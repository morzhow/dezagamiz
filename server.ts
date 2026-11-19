import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import {
  composeMelodyWithGemini,
  GeminiRouteError,
  runPersonalAssistantChat,
} from './server/geminiAssistant';
import { UZBEKISTAN_STATIONS } from './src/data/stations';
import {
  computeMelodyDurationSeconds,
  PRESET_MELODIES,
  sanitizeMelodyNotes,
} from './src/lib/melodyEngine';
import {
  calculateFuelVolume,
  calculatePersonalCardCashback,
  canAccessApp,
  computeGuestExpiresAt,
  decodeEncodedPolyline,
  FUEL_META,
  formatUzbekPhone,
  generateDezagamizCardNumber,
  getDriverVehicles,
  getNextOrderStage,
  haversineDistanceKm,
  isGuestExpired,
  maskCardNumber,
  normalizeDigits,
  normalizeUzbekPlate,
  PERSONAL_CARD_CASHBACK_RATE,
  validateCardExpiry,
  validateCardNumber,
  validatePersonalCardTopUp,
  validateUzbekPhone,
  validateUzbekPlate,
  verifyCreatorCode,
} from './src/lib/dezagamiz';
import type {
  AccessRole,
  CreatorOverview,
  DezagamizPersonalCard,
  DriverUser,
  DriverVehicle,
  FuelCode,
  FuelOrder,
  FuelStation,
  GuestRecord,
  LinkedCard,
  MelodySynthPreset,
  MusicPreferences,
  PersonalCardStyle,
  PersonalCardTier,
  PersonalTrack,
} from './src/types/dezagamiz';

interface StationOverride {
  prices?: Partial<Record<FuelCode, number>>;
  bayAvailability?: Record<number, boolean>;
}

interface DbState {
  users: Record<string, DriverUser>;
  sessions: Record<string, string>; // sessionId -> userId
  creatorSessions: Record<string, AccessRole>; // sessionId -> 'admin' | 'driver'
  guests: Record<string, GuestRecord>; // deviceToken -> GuestRecord
  guestSessions: Record<string, string>; // sessionId -> deviceToken
  stationOverrides: Record<string, StationOverride>;
  orders: FuelOrder[];
  musicTracks: Record<string, PersonalTrack[]>;
  musicPrefs: Record<string, MusicPreferences>;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const AUDIO_DIR = path.join(DATA_DIR, 'audio');
const DB_PATH = path.join(DATA_DIR, 'dezagamiz-db.json');

function loadDb(): DbState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as DbState;
      if (parsed && typeof parsed === 'object' && parsed.users && parsed.sessions && Array.isArray(parsed.orders)) {
        const normalizedCreatorSessions: Record<string, AccessRole> = {};
        if (parsed.creatorSessions && typeof parsed.creatorSessions === 'object') {
          for (const [k, v] of Object.entries(parsed.creatorSessions)) {
            if (v === 'driver') {
              normalizedCreatorSessions[k] = 'driver';
            } else if (v === 'admin' || (v as unknown) === true) {
              normalizedCreatorSessions[k] = 'admin';
            }
          }
        }
        return {
          users: parsed.users,
          sessions: parsed.sessions,
          creatorSessions: normalizedCreatorSessions,
          guests: parsed.guests && typeof parsed.guests === 'object' ? parsed.guests : {},
          guestSessions:
            parsed.guestSessions && typeof parsed.guestSessions === 'object'
              ? parsed.guestSessions
              : {},
          stationOverrides: parsed.stationOverrides || {},
          orders: parsed.orders,
          musicTracks:
            parsed.musicTracks && typeof parsed.musicTracks === 'object'
              ? parsed.musicTracks
              : {},
          musicPrefs:
            parsed.musicPrefs && typeof parsed.musicPrefs === 'object'
              ? parsed.musicPrefs
              : {},
        };
      }
    }
  } catch {
    // Fallback to clean state if file is unreadable
  }
  return {
    users: {},
    sessions: {},
    creatorSessions: {},
    guests: {},
    guestSessions: {},
    stationOverrides: {},
    orders: [],
    musicTracks: {},
    musicPrefs: {},
  };
}

function getDefaultMusicPrefs(): MusicPreferences {
  return {
    activeTrackId: PRESET_MELODIES[0].id,
    fuelingChimeTrackId: 'preset-dezagamiz-chime',
    autoPlayOnFueling: true,
    volume: 0.75,
  };
}

function getOwnerMusicPayload(db: DbState, ownerKey: string) {
  const userTracks = db.musicTracks[ownerKey] || [];
  const prefs = {
    ...getDefaultMusicPrefs(),
    ...(db.musicPrefs[ownerKey] || {}),
  };
  return {
    tracks: [...userTracks, ...PRESET_MELODIES],
    preferences: prefs,
  };
}

function saveDb(state: DbState): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    try {
      result[key] = decodeURIComponent(val);
    } catch {
      result[key] = val;
    }
  }
  return result;
}

function getSessionId(req: express.Request): string | null {
  const headerId = req.header('x-session-id');
  if (headerId && typeof headerId === 'string' && headerId.trim().length > 0) {
    return headerId.trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.dz_session) {
    return cookies.dz_session;
  }
  const querySid =
    typeof req.query?.sid === 'string' && req.query.sid.trim().length > 0
      ? req.query.sid.trim()
      : null;
  return querySid;
}

function setSessionCookie(res: express.Response, sessionId: string): void {
  res.setHeader(
    'Set-Cookie',
    `dz_session=${encodeURIComponent(sessionId)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
  );
}

function clearSessionCookie(res: express.Response): void {
  res.setHeader(
    'Set-Cookie',
    'dz_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
  );
}

function getLiveStations(db: DbState): FuelStation[] {
  return UZBEKISTAN_STATIONS.map((station) => {
    const override = db.stationOverrides[station.id];
    if (!override) return station;
    return {
      ...station,
      prices: {
        ...station.prices,
        ...(override.prices || {}),
      },
      bays: station.bays.map((bay) => {
        if (
          override.bayAvailability &&
          typeof override.bayAvailability[bay.number] === 'boolean'
        ) {
          return { ...bay, available: override.bayAvailability[bay.number] };
        }
        return bay;
      }),
    };
  });
}

function buildCreatorOverview(db: DbState): CreatorOverview {
  const usersList = Object.values(db.users).filter(
    (u) => canAccessApp(u) && !u.id.startsWith('usr-guest-'),
  );
  const sortedOrders = [...db.orders].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const totalRevenueUzs = sortedOrders.reduce((acc, o) => acc + o.amountUzs, 0);
  const totalGasM3 = sortedOrders
    .filter((o) => o.unit === 'м³')
    .reduce((acc, o) => acc + (o.dispensedVolume || o.targetVolume), 0);

  return {
    stats: {
      totalDrivers: usersList.length,
      totalOrders: sortedOrders.length,
      activeOrdersCount: sortedOrders.filter((o) => o.stage !== 'completed')
        .length,
      totalRevenueUzs,
      totalGasM3: Math.round(totalGasM3 * 100) / 100,
    },
    drivers: usersList.map((u) => {
      const defCard = u.cards.find((c) => c.isDefault) || u.cards[0];
      return {
        id: u.id,
        fullName: u.fullName,
        phone: u.phone,
        carModel: u.carModel,
        plateNumber: u.plateNumber,
        preferredFuel: u.preferredFuel,
        cardsCount: u.cards.length,
        primaryCardMasked: defCard ? `${defCard.network} ${defCard.maskedNumber}` : '—',
        createdAt: u.createdAt,
      };
    }),
    orders: sortedOrders,
    stations: getLiveStations(db),
  };
}

function buildSessionPayload(
  db: DbState,
  user: DriverUser | null,
  sessionId: string | null = null,
) {
  const creatorRole =
    sessionId && db.creatorSessions[sessionId] ? db.creatorSessions[sessionId] : null;
  const isCreator = Boolean(creatorRole);

  const guestToken = sessionId ? db.guestSessions[sessionId] : undefined;
  const guestRecord = guestToken ? db.guests[guestToken] : undefined;
  const guestExpired = Boolean(
    guestToken && (!guestRecord || isGuestExpired(guestRecord.expiresAt)),
  );
  const isGuest = Boolean(guestRecord && !guestExpired);

  if (guestExpired && !isCreator) {
    return {
      authenticated: false,
      isCreator,
      creatorRole,
      isGuest: false,
      guestExpiresAt: null,
      guestExpired: true,
      user: null,
      activeOrder: null,
      orders: [],
    };
  }

  if (!user || !canAccessApp(user)) {
    return {
      authenticated: false,
      isCreator,
      creatorRole,
      isGuest: false,
      guestExpiresAt: null,
      user: null,
      activeOrder: null,
      orders: [],
    };
  }
  const userOrders = db.orders
    .filter((o) => o.userId === user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const activeOrder =
    userOrders.find((o) => o.stage !== 'completed') || null;
  return {
    authenticated: true,
    isCreator,
    creatorRole,
    isGuest,
    guestExpiresAt: isGuest && guestRecord ? guestRecord.expiresAt : null,
    user,
    activeOrder,
    orders: userOrders,
  };
}

function ensureDemoDriverInDb(db: DbState): DriverUser {
  const demoId = 'usr-demo-tashkent';
  const nowIso = new Date().toISOString();

  if (!db.users[demoId]) {
    db.users[demoId] = {
      id: demoId,
      fullName: 'Азизбек Каримов',
      phone: '+998 90 777 45 12',
      carModel: 'Chevrolet Cobalt',
      plateNumber: '01 A 777 AA',
      preferredFuel: 'metan',
      isRegistered: true,
      cards: [
        {
          id: 'card-demo-uzcard',
          network: 'Uzcard',
          maskedNumber: '8600 •••• •••• 5676',
          last4: '5676',
          expiry: '09/29',
          holderName: 'AZIZBEK KARIMOV',
          isDefault: true,
          addedAt: nowIso,
        },
      ],
      createdAt: nowIso,
    };

    const pastOrder: FuelOrder = {
      id: 'ord-demo-101',
      receiptCode: 'DZ-482910',
      userId: demoId,
      stationId: 'st-tashkent-chilonzor',
      stationName: 'dezagamiz АГНКС Чиланзар-14',
      stationAddress: 'ул. Бунёдкор, 42, Чиланзарский р-н',
      city: 'Ташкент',
      bayNumber: 2,
      fuelCode: 'metan',
      fuelLabel: 'Метан (CNG)',
      unit: 'м³',
      pricePerUnit: 5750,
      amountUzs: 115000,
      targetVolume: 20,
      dispensedVolume: 20,
      cardId: 'card-demo-uzcard',
      cardMasked: '8600 •••• •••• 5676',
      cardNetwork: 'Uzcard',
      carModel: 'Chevrolet Cobalt',
      plateNumber: '01 A 777 AA',
      attendant: UZBEKISTAN_STATIONS[0].attendants[0],
      stage: 'completed',
      etaSeconds: 0,
      rating: 5,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86200000).toISOString(),
      completedAt: new Date(Date.now() - 86200000).toISOString(),
    };
    db.orders.push(pastOrder);
  }

  return db.users[demoId];
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // Get current session & user (strictly enforces registration + linked card)
  app.get('/api/session', (req, res) => {
    const db = loadDb();
    const sessionId = getSessionId(req);
    const userId = sessionId ? db.sessions[sessionId] : undefined;
    const user = userId ? db.users[userId] || null : null;
    res.json(buildSessionPayload(db, user, sessionId));
  });

  // Register driver AND bind mandatory credit/bank card in one atomic gate
  app.post('/api/auth/register-and-bind', (req, res) => {
    const {
      fullName,
      phone,
      carModel,
      plateNumber,
      preferredFuel = 'metan',
      cardNumber,
      expiry,
      holderName,
      cvc,
    } = req.body ?? {};

    const cleanName = typeof fullName === 'string' ? fullName.trim() : '';
    const cleanPhone = formatUzbekPhone(typeof phone === 'string' ? phone : '');
    const cleanCar = typeof carModel === 'string' ? carModel.trim() : '';
    const cleanPlate = normalizeUzbekPlate(typeof plateNumber === 'string' ? plateNumber : '');
    const cleanHolder = typeof holderName === 'string' ? holderName.trim().toUpperCase() : '';
    const cleanExpiry = typeof expiry === 'string' ? expiry.trim() : '';
    const cleanCvc = normalizeDigits(typeof cvc === 'string' ? cvc : '');

    if (cleanName.length < 2) {
      return res.status(400).json({ error: 'Укажите имя и фамилию водителя' });
    }
    if (!validateUzbekPhone(cleanPhone)) {
      return res.status(400).json({ error: 'Введите корректный номер Узбекистана (+998 XX XXX XX XX)' });
    }
    if (cleanCar.length < 2) {
      return res.status(400).json({ error: 'Укажите марку и модель автомобиля' });
    }
    if (!validateUzbekPlate(cleanPlate)) {
      return res.status(400).json({ error: 'Укажите госномер в формате Узбекистана (например, 01 A 777 AA)' });
    }

    const cardCheck = validateCardNumber(typeof cardNumber === 'string' ? cardNumber : '');
    if (!cardCheck.valid || !cardCheck.network) {
      return res.status(400).json({ error: cardCheck.error || 'Неверный номер карты' });
    }
    if (!validateCardExpiry(cleanExpiry)) {
      return res.status(400).json({ error: 'Укажите действующий срок карты ММ/ГГ' });
    }
    if (cleanHolder.length < 3) {
      return res.status(400).json({ error: 'Укажите имя держателя карты' });
    }
    if (!/^\d{3,4}$/.test(cleanCvc)) {
      return res.status(400).json({ error: 'Введите 3-значный код CVC/CVV или SMS-подтверждение' });
    }

    const fuelKey: FuelCode =
      preferredFuel === 'metan' ||
      preferredFuel === 'propan' ||
      preferredFuel === 'ai92' ||
      preferredFuel === 'ai95'
        ? preferredFuel
        : 'metan';

    const db = loadDb();
    const digits = normalizeDigits(cardNumber);
    const nowIso = new Date().toISOString();

    const newCard: LinkedCard = {
      id: `card-${crypto.randomUUID().slice(0, 8)}`,
      network: cardCheck.network,
      maskedNumber: maskCardNumber(digits),
      last4: digits.slice(-4),
      expiry: cleanExpiry,
      holderName: cleanHolder,
      isDefault: true,
      addedAt: nowIso,
    };

    const existingUser = Object.values(db.users).find(
      (u) => normalizeDigits(u.phone) === normalizeDigits(cleanPhone),
    );

    const userId = existingUser ? existingUser.id : `usr-${crypto.randomUUID().slice(0, 8)}`;
    const user: DriverUser = {
      id: userId,
      fullName: cleanName,
      phone: cleanPhone,
      carModel: cleanCar,
      plateNumber: cleanPlate,
      preferredFuel: fuelKey,
      isRegistered: true,
      cards: [newCard],
      createdAt: existingUser ? existingUser.createdAt : nowIso,
    };

    db.users[userId] = user;
    const sessionId = crypto.randomUUID();
    db.sessions[sessionId] = userId;
    saveDb(db);

    setSessionCookie(res, sessionId);
    return res.json({
      sessionId,
      ...buildSessionPayload(db, user, sessionId),
    });
  });

  // Login for already-registered drivers who already have a linked card
  app.post('/api/auth/login', (req, res) => {
    const { phone } = req.body ?? {};
    const cleanPhone = formatUzbekPhone(typeof phone === 'string' ? phone : '');
    if (!validateUzbekPhone(cleanPhone)) {
      return res.status(400).json({ error: 'Введите номер телефона в формате +998 XX XXX XX XX' });
    }

    const db = loadDb();
    const user = Object.values(db.users).find(
      (u) => normalizeDigits(u.phone) === normalizeDigits(cleanPhone),
    );

    if (!user || !canAccessApp(user)) {
      return res.status(403).json({
        error: 'Аккаунт не найден или к нему не привязана банковская карта. Пожалуйста, пройдите регистрацию и привязку карты.',
      });
    }

    const sessionId = crypto.randomUUID();
    db.sessions[sessionId] = user.id;
    saveDb(db);

    setSessionCookie(res, sessionId);
    return res.json({
      sessionId,
      ...buildSessionPayload(db, user, sessionId),
    });
  });

  // Strict 3-day Guest mode (max 72 hours, cannot be extended beyond 3 days)
  app.post('/api/auth/guest', (req, res) => {
    const rawToken =
      typeof req.body?.deviceToken === 'string' ? req.body.deviceToken.trim() : '';
    const deviceToken =
      rawToken.length >= 8 ? rawToken.slice(0, 80) : `gst-${crypto.randomUUID()}`;

    const db = loadDb();
    const existing = db.guests[deviceToken];
    if (existing && isGuestExpired(existing.expiresAt)) {
      return res.status(403).json({
        error:
          'Срок гостевого режима (3 дня) истёк. Больше 3 дней пользоваться без регистрации нельзя.',
        guestExpired: true,
      });
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    let guestRecord = existing;
    let guestUser = guestRecord ? db.users[guestRecord.userId] : undefined;

    if (!guestRecord) {
      const guestUserId = `usr-guest-${crypto.randomUUID().slice(0, 8)}`;
      guestUser = {
        id: guestUserId,
        fullName: 'Гость dezagamiz',
        phone: '+998 90 000 00 03',
        carModel: 'Chevrolet Cobalt (Гость)',
        plateNumber: '01 G 003 DZ',
        preferredFuel: 'metan',
        isRegistered: true,
        cards: [
          {
            id: `card-guest-${crypto.randomUUID().slice(0, 6)}`,
            network: 'Uzcard',
            maskedNumber: '8600 •••• •••• 0003',
            last4: '0003',
            expiry: '12/29',
            holderName: 'GUEST DEZAGAMIZ',
            isDefault: true,
            addedAt: nowIso,
          },
        ],
        createdAt: nowIso,
      };
      db.users[guestUserId] = guestUser;
      guestRecord = {
        id: `gst-${crypto.randomUUID().slice(0, 8)}`,
        deviceToken,
        startedAt: nowIso,
        expiresAt: computeGuestExpiresAt(nowMs),
        userId: guestUserId,
      };
      db.guests[deviceToken] = guestRecord;
    } else if (!guestUser) {
      guestUser = {
        id: guestRecord.userId,
        fullName: 'Гость dezagamiz',
        phone: '+998 90 000 00 03',
        carModel: 'Chevrolet Cobalt (Гость)',
        plateNumber: '01 G 003 DZ',
        preferredFuel: 'metan',
        isRegistered: true,
        cards: [
          {
            id: `card-guest-${crypto.randomUUID().slice(0, 6)}`,
            network: 'Uzcard',
            maskedNumber: '8600 •••• •••• 0003',
            last4: '0003',
            expiry: '12/29',
            holderName: 'GUEST DEZAGAMIZ',
            isDefault: true,
            addedAt: nowIso,
          },
        ],
        createdAt: guestRecord.startedAt,
      };
      db.users[guestUser.id] = guestUser;
    }

    const sessionId = crypto.randomUUID();
    db.sessions[sessionId] = guestUser.id;
    db.guestSessions[sessionId] = deviceToken;
    saveDb(db);

    setSessionCookie(res, sessionId);
    return res.json({
      sessionId,
      guestDeviceToken: deviceToken,
      ...buildSessionPayload(db, guestUser, sessionId),
    });
  });

  // Autostart demo driver when ?autostart=1 is explicitly used
  app.post('/api/auth/autostart-demo', (_req, res) => {
    const db = loadDb();
    const demoUser = ensureDemoDriverInDb(db);

    const sessionId = crypto.randomUUID();
    db.sessions[sessionId] = demoUser.id;
    saveDb(db);

    setSessionCookie(res, sessionId);
    return res.json({
      sessionId,
      ...buildSessionPayload(db, demoUser, sessionId),
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const db = loadDb();
    const sessionId = getSessionId(req);
    if (sessionId) {
      if (db.sessions[sessionId]) delete db.sessions[sessionId];
      if (db.creatorSessions[sessionId]) delete db.creatorSessions[sessionId];
      if (db.guestSessions[sessionId]) delete db.guestSessions[sessionId];
      saveDb(db);
    }
    clearSessionCookie(res);
    return res.json({ ok: true });
  });

  // Creator unlock using secret code Morzhowich88
  app.post('/api/creator/unlock', (req, res) => {
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    const requestedRole: AccessRole =
      req.body?.role === 'driver' ? 'driver' : 'admin';
    if (!verifyCreatorCode(code)) {
      return res.status(403).json({
        error: 'Неверный код создателя. Доступ к разделу закрыт.',
      });
    }

    const db = loadDb();
    let sessionId = getSessionId(req);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }
    db.creatorSessions[sessionId] = requestedRole;

    let userId = db.sessions[sessionId];
    let user = userId ? db.users[userId] || null : null;
    if (requestedRole === 'driver' && (!user || !canAccessApp(user))) {
      user = ensureDemoDriverInDb(db);
      db.sessions[sessionId] = user.id;
    }

    saveDb(db);

    setSessionCookie(res, sessionId);
    return res.json({
      sessionId,
      ...buildSessionPayload(db, user, sessionId),
      overview: buildCreatorOverview(db),
    });
  });

  app.post('/api/creator/role', (req, res) => {
    const auth = requireCreator(req, res);
    if (!auth) return;
    const { db, sessionId } = auth;
    const requestedRole: AccessRole =
      req.body?.role === 'driver' ? 'driver' : 'admin';

    db.creatorSessions[sessionId] = requestedRole;

    let userId = db.sessions[sessionId];
    let user = userId ? db.users[userId] || null : null;
    if (requestedRole === 'driver' && (!user || !canAccessApp(user))) {
      user = ensureDemoDriverInDb(db);
      db.sessions[sessionId] = user.id;
    }

    saveDb(db);
    return res.json(buildSessionPayload(db, user, sessionId));
  });

  app.post('/api/creator/lock', (req, res) => {
    const db = loadDb();
    const sessionId = getSessionId(req);
    if (sessionId && db.creatorSessions[sessionId]) {
      delete db.creatorSessions[sessionId];
      saveDb(db);
    }
    const userId = sessionId ? db.sessions[sessionId] : undefined;
    const user = userId ? db.users[userId] || null : null;
    return res.json(buildSessionPayload(db, user, sessionId));
  });

  function requireCreator(
    req: express.Request,
    res: express.Response,
  ): { db: DbState; sessionId: string } | null {
    const db = loadDb();
    const sessionId = getSessionId(req);
    if (!sessionId || !db.creatorSessions[sessionId]) {
      res.status(403).json({
        error: 'Требуется код создателя для доступа к этому разделу.',
      });
      return null;
    }
    return { db, sessionId };
  }

  app.get('/api/creator/overview', (req, res) => {
    const auth = requireCreator(req, res);
    if (!auth) return;
    res.json(buildCreatorOverview(auth.db));
  });

  app.patch('/api/creator/stations/:stationId', (req, res) => {
    const auth = requireCreator(req, res);
    if (!auth) return;
    const { db } = auth;
    const station = UZBEKISTAN_STATIONS.find((s) => s.id === req.params.stationId);
    if (!station) {
      return res.status(404).json({ error: 'Станция не найдена' });
    }

    const existing = db.stationOverrides[station.id] || {};
    const { prices, bayAvailability } = req.body ?? {};
    const nextPrices: Partial<Record<FuelCode, number>> = { ...(existing.prices || {}) };
    if (prices && typeof prices === 'object') {
      for (const key of ['metan', 'propan', 'ai92', 'ai95'] as FuelCode[]) {
        const val = Number(prices[key]);
        if (station.prices[key] && Number.isFinite(val) && val >= 1000 && val <= 50000) {
          nextPrices[key] = Math.round(val);
        }
      }
    }

    const nextBays: Record<number, boolean> = { ...(existing.bayAvailability || {}) };
    if (bayAvailability && typeof bayAvailability === 'object') {
      for (const [k, v] of Object.entries(bayAvailability)) {
        const bayNum = Number(k);
        if (station.bays.some((b) => b.number === bayNum) && typeof v === 'boolean') {
          nextBays[bayNum] = v;
        }
      }
    }

    db.stationOverrides[station.id] = {
      prices: nextPrices,
      bayAvailability: nextBays,
    };
    saveDb(db);
    return res.json(buildCreatorOverview(db));
  });

  app.post('/api/creator/orders/:id/advance', (req, res) => {
    const auth = requireCreator(req, res);
    if (!auth) return;
    const { db } = auth;
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    const next = getNextOrderStage(order.stage);
    order.stage = next;
    order.updatedAt = new Date().toISOString();
    if (next === 'attendant_approaching') {
      order.etaSeconds = 4;
    } else if (next === 'fueling') {
      order.etaSeconds = 0;
      order.dispensedVolume = Math.round(order.targetVolume * 0.25 * 100) / 100;
    } else if (next === 'completed') {
      order.etaSeconds = 0;
      order.dispensedVolume = order.targetVolume;
      order.completedAt = order.updatedAt;
    }
    saveDb(db);
    return res.json(buildCreatorOverview(db));
  });

  // Require authenticated + card-bound user (or active <=3d guest) for all protected routes
  function requireVerifiedDriver(
    req: express.Request,
    res: express.Response,
  ): { db: DbState; user: DriverUser; sessionId: string | null; isGuest: boolean } | null {
    const db = loadDb();
    const sessionId = getSessionId(req);
    const guestToken = sessionId ? db.guestSessions[sessionId] : undefined;
    if (guestToken) {
      const guest = db.guests[guestToken];
      if (!guest || isGuestExpired(guest.expiresAt)) {
        if (sessionId) {
          delete db.sessions[sessionId];
          delete db.guestSessions[sessionId];
          saveDb(db);
        }
        res.status(403).json({
          error:
            'Срок гостевого режима (3 дня) истёк. Зарегистрируйтесь и привяжите карту.',
          guestExpired: true,
        });
        return null;
      }
    }

    const userId = sessionId ? db.sessions[sessionId] : undefined;
    const user = userId ? db.users[userId] || null : null;
    if (!user || !canAccessApp(user)) {
      res.status(401).json({
        error: 'Доступ запрещён: требуется регистрация и привязанная банковская карта.',
      });
      return null;
    }
    return { db, user, sessionId, isGuest: Boolean(guestToken) };
  }

  app.get('/api/stations', (req, res) => {
    const db = loadDb();
    const sessionId = getSessionId(req);
    const guestToken = sessionId ? db.guestSessions[sessionId] : undefined;
    if (guestToken) {
      const guest = db.guests[guestToken];
      if (!guest || isGuestExpired(guest.expiresAt)) {
        return res.status(403).json({
          error: 'Срок гостевого режима (3 дня) истёк.',
          guestExpired: true,
        });
      }
    }
    const userId = sessionId ? db.sessions[sessionId] : undefined;
    const user = userId ? db.users[userId] || null : null;
    const isCreator = Boolean(sessionId && db.creatorSessions[sessionId]);
    if ((!user || !canAccessApp(user)) && !isCreator) {
      return res.status(401).json({
        error: 'Доступ запрещён: требуется регистрация и привязанная банковская карта.',
      });
    }
    res.json({ stations: getLiveStations(db) });
  });

  function getMapsServerApiKey(): string {
    return (
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.MAPS_API_KEY ||
      ''
    ).trim();
  }

  interface CachedLocationEntry {
    lat: number;
    lng: number;
    placeId?: string;
    formattedAddress?: string;
    cachedAt: number;
  }

  const GEOCODE_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // <= 24h (within 30-day ToS limit)
  const geocodeCache = new Map<string, CachedLocationEntry>();

  async function geocodeAddressWithGoogle(
    query: string,
    apiKey: string,
  ): Promise<{ entry: CachedLocationEntry | null; quotaExceeded: boolean }> {
    const cacheKey = query.trim().toLowerCase();
    const existing = geocodeCache.get(cacheKey);
    if (existing && Date.now() - existing.cachedAt < GEOCODE_CACHE_TTL_MS) {
      return { entry: existing, quotaExceeded: false };
    }

    const refererHeader = process.env.APP_URL || 'http://localhost:3000/';

    // 1. Try Geocoding API (HTTPS REST)
    try {
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query,
      )}&region=uz&language=ru&key=${encodeURIComponent(apiKey)}`;
      const geoRes = await fetch(geoUrl, {
        headers: {
          Referer: refererHeader,
          'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
        },
        signal: AbortSignal.timeout(5000),
      });
      if (geoRes.status === 429) {
        return { entry: null, quotaExceeded: true };
      }
      const geoData = (await geoRes.json().catch(() => null)) as {
        status?: string;
        results?: Array<{
          place_id?: string;
          formatted_address?: string;
          geometry?: { location?: { lat?: number; lng?: number } };
        }>;
      } | null;

      if (geoData?.status === 'OVER_QUERY_LIMIT' || geoData?.status === 'RESOURCE_EXHAUSTED') {
        return { entry: null, quotaExceeded: true };
      }
      const first = geoData?.results?.[0];
      const lat = first?.geometry?.location?.lat;
      const lng = first?.geometry?.location?.lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        const entry: CachedLocationEntry = {
          lat,
          lng,
          placeId: first?.place_id,
          formattedAddress: first?.formatted_address,
          cachedAt: Date.now(),
        };
        geocodeCache.set(cacheKey, entry);
        return { entry, quotaExceeded: false };
      }
    } catch {
      // Fallback to Places API (New) text search below
    }

    // 2. Fallback: Places API (New) searchText
    try {
      const placesRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.location,places.formattedAddress',
          'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
          Referer: refererHeader,
        },
        body: JSON.stringify({
          textQuery: query,
          regionCode: 'UZ',
          languageCode: 'ru',
          maxResultCount: 1,
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (placesRes.status === 429) {
        return { entry: null, quotaExceeded: true };
      }
      const placesData = (await placesRes.json().catch(() => null)) as {
        error?: { status?: string };
        places?: Array<{
          id?: string;
          formattedAddress?: string;
          location?: { latitude?: number; longitude?: number };
        }>;
      } | null;

      if (placesData?.error?.status === 'RESOURCE_EXHAUSTED') {
        return { entry: null, quotaExceeded: true };
      }
      const place = placesData?.places?.[0];
      const lat = place?.location?.latitude;
      const lng = place?.location?.longitude;
      if (typeof lat === 'number' && typeof lng === 'number') {
        const entry: CachedLocationEntry = {
          lat,
          lng,
          placeId: place?.id,
          formattedAddress: place?.formattedAddress,
          cachedAt: Date.now(),
        };
        geocodeCache.set(cacheKey, entry);
        return { entry, quotaExceeded: false };
      }
    } catch {
      // Let client-side Places JS SDK attempt resolution if server REST is restricted
    }

    return { entry: null, quotaExceeded: false };
  }

  app.get('/api/maps/config', (req, res) => {
    const db = loadDb();
    const sessionId = getSessionId(req);
    const userId = sessionId ? db.sessions[sessionId] : undefined;
    const user = userId ? db.users[userId] || null : null;
    const isCreator = Boolean(sessionId && db.creatorSessions[sessionId]);
    if ((!user || !canAccessApp(user)) && !isCreator) {
      return res.status(401).json({
        error: 'Доступ запрещён.',
      });
    }
    const apiKey = getMapsServerApiKey();
    res.json({ hasKey: Boolean(apiKey), apiKey });
  });

  app.get('/api/maps/station-locations', async (req, res) => {
    const db = loadDb();
    const sessionId = getSessionId(req);
    const userId = sessionId ? db.sessions[sessionId] : undefined;
    const user = userId ? db.users[userId] || null : null;
    const isCreator = Boolean(sessionId && db.creatorSessions[sessionId]);
    if ((!user || !canAccessApp(user)) && !isCreator) {
      return res.status(401).json({ error: 'Доступ запрещён.' });
    }

    const apiKey = getMapsServerApiKey();
    if (!apiKey) {
      return res.json({ locations: {}, quotaExceeded: false });
    }

    const locations: Record<
      string,
      { lat: number; lng: number; placeId?: string; formattedAddress?: string }
    > = {};
    let quotaExceeded = false;

    const results = await Promise.all(
      UZBEKISTAN_STATIONS.map(async (st) => {
        const resolved = await geocodeAddressWithGoogle(st.geocodeQuery, apiKey);
        return { id: st.id, ...resolved };
      }),
    );

    for (const item of results) {
      if (item.quotaExceeded) {
        quotaExceeded = true;
      }
      if (item.entry) {
        locations[item.id] = {
          lat: item.entry.lat,
          lng: item.entry.lng,
          placeId: item.entry.placeId,
          formattedAddress: item.entry.formattedAddress,
        };
      }
    }

    res.json({ locations, quotaExceeded });
  });

  app.post('/api/maps/geocode', async (req, res) => {
    const db = loadDb();
    const sessionId = getSessionId(req);
    const userId = sessionId ? db.sessions[sessionId] : undefined;
    const user = userId ? db.users[userId] || null : null;
    const isCreator = Boolean(sessionId && db.creatorSessions[sessionId]);
    if ((!user || !canAccessApp(user)) && !isCreator) {
      return res.status(401).json({ error: 'Доступ запрещён.' });
    }

    const query = typeof req.body?.query === 'string' ? req.body.query.trim() : '';
    if (!query || query.length < 3) {
      return res.status(400).json({ error: 'Укажите адрес или район для поиска' });
    }

    const apiKey = getMapsServerApiKey();
    if (!apiKey) {
      return res.status(503).json({ error: 'Google Maps API key is not configured' });
    }

    const result = await geocodeAddressWithGoogle(query, apiKey);
    if (result.quotaExceeded) {
      return res.status(429).json({ error: 'Google Maps quota exceeded', quotaExceeded: true });
    }
    if (!result.entry) {
      return res.status(404).json({ error: 'Координаты для указанного места не найдены' });
    }
    return res.json({
      lat: result.entry.lat,
      lng: result.entry.lng,
      placeId: result.entry.placeId,
      formattedAddress: result.entry.formattedAddress,
    });
  });

  app.post('/api/maps/route', async (req, res) => {
    const db = loadDb();
    const sessionId = getSessionId(req);
    const userId = sessionId ? db.sessions[sessionId] : undefined;
    const user = userId ? db.users[userId] || null : null;
    const isCreator = Boolean(sessionId && db.creatorSessions[sessionId]);
    if ((!user || !canAccessApp(user)) && !isCreator) {
      return res.status(401).json({ error: 'Доступ запрещён.' });
    }

    const originLat = Number(req.body?.originLat);
    const originLng = Number(req.body?.originLng);
    const destLat = Number(req.body?.destLat);
    const destLng = Number(req.body?.destLng);
    const lang =
      typeof req.body?.lang === 'string' && req.body.lang.trim()
        ? req.body.lang.trim()
        : 'ru';

    if (
      !Number.isFinite(originLat) ||
      !Number.isFinite(originLng) ||
      !Number.isFinite(destLat) ||
      !Number.isFinite(destLng)
    ) {
      return res.status(400).json({ error: 'Неверные координаты маршрута' });
    }

    const straightMeters = Math.round(
      haversineDistanceKm(
        { lat: originLat, lng: originLng },
        { lat: destLat, lng: destLng },
      ) * 1000,
    );
    const fallbackResponse = (quotaExceeded = false) => ({
      path: [
        { lat: originLat, lng: originLng },
        { lat: destLat, lng: destLng },
      ],
      distanceMeters: straightMeters,
      durationMillis: null as number | null,
      steps: [] as string[],
      fallback: true,
      quotaExceeded,
    });

    const apiKey = getMapsServerApiKey();
    if (!apiKey) {
      return res.json(fallbackResponse(false));
    }

    try {
      const refererHeader = process.env.APP_URL || 'http://localhost:3000/';
      const routeRes = await fetch(
        'https://routes.googleapis.com/directions/v2:computeRoutes',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction',
            'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
            Referer: refererHeader,
          },
          body: JSON.stringify({
            origin: {
              location: { latLng: { latitude: originLat, longitude: originLng } },
            },
            destination: {
              location: { latLng: { latitude: destLat, longitude: destLng } },
            },
            travelMode: 'DRIVE',
            languageCode: lang,
            regionCode: 'UZ',
          }),
          signal: AbortSignal.timeout(5000),
        },
      );

      if (routeRes.status === 429) {
        return res.json(fallbackResponse(true));
      }

      const data = (await routeRes.json().catch(() => null)) as {
        error?: { status?: string };
        routes?: Array<{
          distanceMeters?: number;
          duration?: string;
          polyline?: { encodedPolyline?: string };
          legs?: Array<{
            steps?: Array<{
              navigationInstruction?: { instructions?: string };
            }>;
          }>;
        }>;
      } | null;

      if (data?.error?.status === 'RESOURCE_EXHAUSTED') {
        return res.json(fallbackResponse(true));
      }

      const route = data?.routes?.[0];
      if (!route) {
        return res.json(fallbackResponse(false));
      }

      const encoded = route.polyline?.encodedPolyline || '';
      const decodedPath = decodeEncodedPolyline(encoded);
      const path =
        decodedPath.length >= 2
          ? decodedPath
          : [
              { lat: originLat, lng: originLng },
              { lat: destLat, lng: destLng },
            ];

      let durationMillis: number | null = null;
      if (typeof route.duration === 'string') {
        const secs = Number.parseFloat(route.duration.replace(/s$/i, ''));
        if (Number.isFinite(secs) && secs > 0) {
          durationMillis = Math.round(secs * 1000);
        }
      }

      const steps: string[] = [];
      for (const leg of route.legs ?? []) {
        for (const step of leg.steps ?? []) {
          const instr = step.navigationInstruction?.instructions?.trim();
          if (instr) {
            steps.push(instr);
          }
          if (steps.length >= 6) break;
        }
        if (steps.length >= 6) break;
      }

      return res.json({
        path,
        distanceMeters: route.distanceMeters ?? straightMeters,
        durationMillis,
        steps,
        fallback: false,
        quotaExceeded: false,
      });
    } catch {
      return res.json(fallbackResponse(false));
    }
  });

  const TRANSPARENT_1PX_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    'base64',
  );
  const tileCache = new Map<string, { buf: Buffer; contentType: string; cachedAt: number }>();
  const TILE_CACHE_MAX = 600;
  const TILE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  function makeSvgGridTile(theme: 'light' | 'dark' | 'satellite'): Buffer {
    const bg =
      theme === 'satellite' ? '#10211D' : theme === 'dark' ? '#0D1E3A' : '#E8EFFA';
    const line =
      theme === 'satellite' ? '#1B3630' : theme === 'dark' ? '#173057' : '#D5E2F5';
    const accent =
      theme === 'satellite' ? '#244A41' : theme === 'dark' ? '#1E3E6F' : '#C4D7F2';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="${bg}"/><path d="M64 0V256M128 0V256M192 0V256M0 64H256M0 128H256M0 192H256" stroke="${line}" stroke-width="1"/><path d="M0 0H256V256H0Z" fill="none" stroke="${accent}" stroke-width="1"/></svg>`;
    return Buffer.from(svg, 'utf-8');
  }

  app.get('/api/maps/fallback-tile/:theme/:z/:x/:y', async (req, res) => {
    const rawTheme = req.params.theme;
    const tileMode: 'light' | 'dark' | 'satellite' | 'labels' =
      rawTheme === 'satellite'
        ? 'satellite'
        : rawTheme === 'labels'
          ? 'labels'
          : rawTheme === 'dark'
            ? 'dark'
            : 'light';
    const z = Number.parseInt(req.params.z, 10);
    const x = Number.parseInt(req.params.x, 10);
    const y = Number.parseInt(req.params.y, 10);

    if (
      !Number.isInteger(z) ||
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      z < 1 ||
      z > 18
    ) {
      if (tileMode === 'labels') {
        res.setHeader('Content-Type', 'image/png');
        return res.send(TRANSPARENT_1PX_PNG);
      }
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(makeSvgGridTile(tileMode));
    }

    const maxTile = 1 << z;
    const wrappedX = ((x % maxTile) + maxTile) % maxTile;
    if (y < 0 || y >= maxTile) {
      if (tileMode === 'labels') {
        res.setHeader('Content-Type', 'image/png');
        return res.send(TRANSPARENT_1PX_PNG);
      }
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.send(makeSvgGridTile(tileMode));
    }

    const cacheLayer =
      tileMode === 'satellite' ? 'sat' : tileMode === 'labels' ? 'lbl' : 'osm';
    const cacheKey = `${cacheLayer}/${z}/${wrappedX}/${y}`;
    const cached = tileCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < TILE_CACHE_TTL_MS) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached.buf);
    }

    const upstreamUrl =
      tileMode === 'satellite'
        ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${wrappedX}`
        : tileMode === 'labels'
          ? `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${z}/${y}/${wrappedX}`
          : `https://tile.openstreetmap.org/${z}/${wrappedX}/${y}.png`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);
    try {
      const tileRes = await fetch(upstreamUrl, {
        headers: {
          'User-Agent': 'dezagamiz-uzbekistan/1.0 (+https://dezagamiz.app)',
          Accept: 'image/jpeg,image/png,image/*;q=0.8',
        },
        signal: controller.signal,
      });

      const contentType = (tileRes.headers.get('content-type') || '').split(';')[0].trim();
      if (tileRes.ok && contentType.startsWith('image/')) {
        const arr = await tileRes.arrayBuffer();
        const buf = Buffer.from(arr);
        if (buf.length > 60) {
          if (tileCache.size >= TILE_CACHE_MAX) {
            const oldestKey = tileCache.keys().next().value;
            if (oldestKey) tileCache.delete(oldestKey);
          }
          tileCache.set(cacheKey, {
            buf,
            contentType,
            cachedAt: Date.now(),
          });
          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.send(buf);
        }
      }
    } catch {
      // Serve fallback tile below
    } finally {
      clearTimeout(timeout);
    }

    if (tileMode === 'labels') {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.send(TRANSPARENT_1PX_PNG);
    }

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.send(makeSvgGridTile(tileMode));
  });

  const streetViewImageCache = new Map<
    string,
    { buf: Buffer; contentType: string; cachedAt: number }
  >();
  const SV_IMAGE_CACHE_MAX = 120;
  const SV_IMAGE_CACHE_TTL_MS = 15 * 60 * 1000;

  app.get('/api/maps/streetview/metadata', async (req, res) => {
    const db = loadDb();
    const sessionId = getSessionId(req);
    const userId = sessionId ? db.sessions[sessionId] : undefined;
    const user = userId ? db.users[userId] || null : null;
    const isCreator = Boolean(sessionId && db.creatorSessions[sessionId]);
    if ((!user || !canAccessApp(user)) && !isCreator) {
      return res.status(401).json({ error: 'Доступ запрещён.' });
    }

    const lat = Number(req.query?.lat);
    const lng = Number(req.query?.lng);
    const rawRadius = Number(req.query?.radius ?? 500);
    const radius = Number.isFinite(rawRadius)
      ? Math.max(50, Math.min(5000, Math.round(rawRadius)))
      : 500;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({ error: 'Неверные координаты' });
    }

    const apiKey = getMapsServerApiKey();
    if (!apiKey) {
      return res.json({ available: false, quotaExceeded: false });
    }

    try {
      const refererHeader = process.env.APP_URL || 'http://localhost:3000/';
      const metaUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${encodeURIComponent(
        `${lat},${lng}`,
      )}&radius=${radius}&source=default&key=${encodeURIComponent(apiKey)}`;
      const metaRes = await fetch(metaUrl, {
        headers: {
          Referer: refererHeader,
          'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
        },
        signal: AbortSignal.timeout(5000),
      });
      if (metaRes.status === 429) {
        return res.json({ available: false, quotaExceeded: true });
      }
      const data = (await metaRes.json().catch(() => null)) as {
        status?: string;
        pano_id?: string;
        copyright?: string;
        date?: string;
        location?: { lat?: number; lng?: number };
      } | null;

      if (data?.status === 'OVER_QUERY_LIMIT') {
        return res.json({ available: false, quotaExceeded: true });
      }
      if (
        data?.status === 'OK' &&
        typeof data.location?.lat === 'number' &&
        typeof data.location?.lng === 'number'
      ) {
        return res.json({
          available: true,
          panoId: data.pano_id,
          lat: data.location.lat,
          lng: data.location.lng,
          copyright: data.copyright,
          date: data.date,
          quotaExceeded: false,
        });
      }
    } catch {
      // Fall back gracefully to satellite orbit 360 mode
    }

    return res.json({ available: false, quotaExceeded: false });
  });

  app.get('/api/maps/streetview/image', async (req, res) => {
    const db = loadDb();
    const sessionId = getSessionId(req);
    const userId = sessionId ? db.sessions[sessionId] : undefined;
    const user = userId ? db.users[userId] || null : null;
    const isCreator = Boolean(sessionId && db.creatorSessions[sessionId]);
    if ((!user || !canAccessApp(user)) && !isCreator) {
      return res.status(401).json({ error: 'Доступ запрещён.' });
    }

    const lat = Number(req.query?.lat);
    const lng = Number(req.query?.lng);
    const panoId =
      typeof req.query?.panoId === 'string' && req.query.panoId.trim()
        ? req.query.panoId.trim()
        : '';
    const rawHeading = Number(req.query?.heading ?? 0);
    const heading = Number.isFinite(rawHeading)
      ? Math.round((((rawHeading % 360) + 360) % 360))
      : 0;
    const rawPitch = Number(req.query?.pitch ?? 0);
    const pitch = Number.isFinite(rawPitch)
      ? Math.max(-45, Math.min(65, Math.round(rawPitch)))
      : 0;
    const rawFov = Number(req.query?.fov ?? 95);
    const fov = Number.isFinite(rawFov)
      ? Math.max(40, Math.min(115, Math.round(rawFov)))
      : 95;

    if (!panoId && (!Number.isFinite(lat) || !Number.isFinite(lng))) {
      return res.status(400).json({ error: 'Укажите panoId или координаты' });
    }

    const apiKey = getMapsServerApiKey();
    if (!apiKey) {
      return res.status(503).json({ error: 'Google Street View key not configured' });
    }

    const cacheKey = `${panoId || `${lat.toFixed(5)},${lng.toFixed(5)}`}|h=${heading}|p=${pitch}|f=${fov}`;
    const cached = streetViewImageCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < SV_IMAGE_CACHE_TTL_MS) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=900');
      return res.send(cached.buf);
    }

    try {
      const refererHeader = process.env.APP_URL || 'http://localhost:3000/';
      const params = new URLSearchParams({
        size: '800x480',
        heading: String(heading),
        pitch: String(pitch),
        fov: String(fov),
        return_error_code: 'true',
        key: apiKey,
      });
      if (panoId) {
        params.set('pano', panoId);
      } else {
        params.set('location', `${lat},${lng}`);
      }

      const imgRes = await fetch(
        `https://maps.googleapis.com/maps/api/streetview?${params.toString()}`,
        {
          headers: {
            Referer: refererHeader,
            'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
          },
          signal: AbortSignal.timeout(5000),
        },
      );
      if (imgRes.status === 429) {
        return res.status(429).json({ error: 'Quota exceeded', quotaExceeded: true });
      }
      const contentType = (imgRes.headers.get('content-type') || '').split(';')[0].trim();
      if (imgRes.ok && contentType.startsWith('image/')) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (streetViewImageCache.size >= SV_IMAGE_CACHE_MAX) {
          const oldest = streetViewImageCache.keys().next().value;
          if (oldest) streetViewImageCache.delete(oldest);
        }
        streetViewImageCache.set(cacheKey, {
          buf,
          contentType,
          cachedAt: Date.now(),
        });
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=900');
        return res.send(buf);
      }
      return res.status(404).json({ error: 'Street View panorama unavailable' });
    } catch {
      return res.status(502).json({ error: 'Street View fetch error' });
    }
  });

  app.post('/api/cards', (req, res) => {
    const auth = requireVerifiedDriver(req, res);
    if (!auth) return;
    if (auth.isGuest) {
      return res.status(403).json({
        error:
          'В гостевом режиме нельзя добавлять карты. Пройдите полную регистрацию.',
      });
    }
    const { db, user } = auth;
    const { cardNumber, expiry, holderName, cvc, makeDefault = true } = req.body ?? {};

    const cardCheck = validateCardNumber(typeof cardNumber === 'string' ? cardNumber : '');
    if (!cardCheck.valid || !cardCheck.network) {
      return res.status(400).json({ error: cardCheck.error || 'Неверный номер карты' });
    }
    const cleanExpiry = typeof expiry === 'string' ? expiry.trim() : '';
    if (!validateCardExpiry(cleanExpiry)) {
      return res.status(400).json({ error: 'Укажите действующий срок карты ММ/ГГ' });
    }
    const cleanHolder = typeof holderName === 'string' ? holderName.trim().toUpperCase() : '';
    if (cleanHolder.length < 3) {
      return res.status(400).json({ error: 'Укажите имя держателя карты' });
    }
    const cleanCvc = normalizeDigits(typeof cvc === 'string' ? cvc : '');
    if (!/^\d{3,4}$/.test(cleanCvc)) {
      return res.status(400).json({ error: 'Введите корректный код CVC/CVV' });
    }

    const digits = normalizeDigits(cardNumber);
    const newCard: LinkedCard = {
      id: `card-${crypto.randomUUID().slice(0, 8)}`,
      network: cardCheck.network,
      maskedNumber: maskCardNumber(digits),
      last4: digits.slice(-4),
      expiry: cleanExpiry,
      holderName: cleanHolder,
      isDefault: Boolean(makeDefault),
      addedAt: new Date().toISOString(),
    };

    const updatedCards = makeDefault
      ? user.cards.map((c) => ({ ...c, isDefault: false })).concat(newCard)
      : user.cards.concat(newCard);

    user.cards = updatedCards;
    db.users[user.id] = user;
    saveDb(db);
    return res.json(buildSessionPayload(db, user, auth.sessionId));
  });

  app.patch('/api/cards/:id/default', (req, res) => {
    const auth = requireVerifiedDriver(req, res);
    if (!auth) return;
    const { db, user } = auth;
    const target = user.cards.find((c) => c.id === req.params.id);
    if (!target) {
      return res.status(404).json({ error: 'Карта не найдена' });
    }
    user.cards = user.cards.map((c) => ({
      ...c,
      isDefault: c.id === target.id,
    }));
    db.users[user.id] = user;
    saveDb(db);
    return res.json(buildSessionPayload(db, user, auth.sessionId));
  });

  app.delete('/api/cards/:id', (req, res) => {
    const auth = requireVerifiedDriver(req, res);
    if (!auth) return;
    if (auth.isGuest) {
      return res.status(403).json({
        error: 'В гостевом режиме нельзя изменять карты.',
      });
    }
    const { db, user } = auth;
    if (user.cards.length <= 1) {
      return res.status(400).json({
        error: 'Нельзя удалить единственную карту: для работы в dezagamiz нужна минимум одна привязанная карта.',
      });
    }
    const remaining = user.cards.filter((c) => c.id !== req.params.id);
    if (remaining.length === user.cards.length) {
      return res.status(404).json({ error: 'Карта не найдена' });
    }
    if (!remaining.some((c) => c.isDefault)) {
      remaining[0].isDefault = true;
    }
    user.cards = remaining;
    db.users[user.id] = user;
    saveDb(db);
    return res.json(buildSessionPayload(db, user, auth.sessionId));
  });

  app.patch('/api/profile', (req, res) => {
    const auth = requireVerifiedDriver(req, res);
    if (!auth) return;
    const { db, user } = auth;
    const { fullName, carModel, plateNumber, preferredFuel } = req.body ?? {};

    if (typeof fullName === 'string' && fullName.trim().length >= 2) {
      user.fullName = fullName.trim();
    }
    if (typeof carModel === 'string' && carModel.trim().length >= 2) {
      user.carModel = carModel.trim();
    }
    if (typeof plateNumber === 'string') {
      const normalized = normalizeUzbekPlate(plateNumber);
      if (!validateUzbekPlate(normalized)) {
        return res.status(400).json({ error: 'Некорректный госномер Узбекистана' });
      }
      user.plateNumber = normalized;
    }
    if (
      preferredFuel === 'metan' ||
      preferredFuel === 'propan' ||
      preferredFuel === 'ai92' ||
      preferredFuel === 'ai95'
    ) {
      user.preferredFuel = preferredFuel;
    }

    const vehicles = getDriverVehicles(user);
    const defaultIdx = vehicles.findIndex((v) => v.isDefault);
    const idxToSync = defaultIdx === -1 ? 0 : defaultIdx;
    vehicles[idxToSync] = {
      ...vehicles[idxToSync],
      carModel: user.carModel,
      plateNumber: user.plateNumber,
      preferredFuel: user.preferredFuel,
      isDefault: true,
    };
    user.vehicles = vehicles;

    db.users[user.id] = user;
    saveDb(db);
    return res.json(buildSessionPayload(db, user, auth.sessionId));
  });

  app.post('/api/vehicles', (req, res) => {
    const auth = requireVerifiedDriver(req, res);
    if (!auth) return;
    const { db, user } = auth;
    const { carModel, plateNumber, preferredFuel, makeDefault = true } =
      req.body ?? {};

    const cleanModel =
      typeof carModel === 'string' ? carModel.trim() : '';
    if (cleanModel.length < 2) {
      return res.status(400).json({ error: 'Укажите марку и модель автомобиля' });
    }
    const cleanPlate = normalizeUzbekPlate(
      typeof plateNumber === 'string' ? plateNumber : '',
    );
    if (!validateUzbekPlate(cleanPlate)) {
      return res.status(400).json({
        error: 'Некорректный госномер Узбекистана (пример: 01 A 777 AA)',
      });
    }
    const fuel: FuelCode =
      preferredFuel === 'metan' ||
      preferredFuel === 'propan' ||
      preferredFuel === 'ai92' ||
      preferredFuel === 'ai95'
        ? preferredFuel
        : 'metan';

    const existing = getDriverVehicles(user);
    const shouldBeDefault = Boolean(makeDefault);
    const newVehicle: DriverVehicle = {
      id: `veh-${crypto.randomUUID().slice(0, 8)}`,
      carModel: cleanModel,
      plateNumber: cleanPlate,
      preferredFuel: fuel,
      isDefault: shouldBeDefault,
      addedAt: new Date().toISOString(),
    };

    const nextVehicles = shouldBeDefault
      ? existing.map((v) => ({ ...v, isDefault: false })).concat(newVehicle)
      : existing.concat(newVehicle);

    user.vehicles = nextVehicles;
    if (shouldBeDefault) {
      user.carModel = newVehicle.carModel;
      user.plateNumber = newVehicle.plateNumber;
      user.preferredFuel = newVehicle.preferredFuel;
    }

    db.users[user.id] = user;
    saveDb(db);
    return res.status(201).json(buildSessionPayload(db, user, auth.sessionId));
  });

  app.patch('/api/vehicles/:id/default', (req, res) => {
    const auth = requireVerifiedDriver(req, res);
    if (!auth) return;
    const { db, user } = auth;
    const vehicles = getDriverVehicles(user);
    const target = vehicles.find((v) => v.id === req.params.id);
    if (!target) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }

    user.vehicles = vehicles.map((v) => ({
      ...v,
      isDefault: v.id === target.id,
    }));
    user.carModel = target.carModel;
    user.plateNumber = target.plateNumber;
    user.preferredFuel = target.preferredFuel;

    db.users[user.id] = user;
    saveDb(db);
    return res.json(buildSessionPayload(db, user, auth.sessionId));
  });

  app.delete('/api/vehicles/:id', (req, res) => {
    const auth = requireVerifiedDriver(req, res);
    if (!auth) return;
    const { db, user } = auth;
    const vehicles = getDriverVehicles(user);
    if (vehicles.length <= 1) {
      return res.status(400).json({
        error: 'В профиле должен оставаться хотя бы один автомобиль',
      });
    }
    const remaining = vehicles.filter((v) => v.id !== req.params.id);
    if (remaining.length === vehicles.length) {
      return res.status(404).json({ error: 'Автомобиль не найден' });
    }
    if (!remaining.some((v) => v.isDefault)) {
      remaining[0].isDefault = true;
    }
    const primary = remaining.find((v) => v.isDefault) || remaining[0];
    user.vehicles = remaining;
    user.carModel = primary.carModel;
    user.plateNumber = primary.plateNumber;
    user.preferredFuel = primary.preferredFuel;

    db.users[user.id] = user;
    saveDb(db);
    return res.json(buildSessionPayload(db, user, auth.sessionId));
  });

  // Personal dezagamiz driver card: issue, top up, customize design, freeze
  app.post('/api/personal-card/issue', (req, res) => {
    const auth = requireVerifiedDriver(req, res);
    if (!auth) return;
    const { db, user } = auth;

    if (user.personalCard) {
      return res.status(409).json({
        error: 'Персональная карта dezagamiz уже оформлена для вашего аккаунта',
      });
    }

    const rawTier = req.body?.tier;
    const tier: PersonalCardTier = rawTier === 'standard' ? 'standard' : 'prime';

    const rawStyle = req.body?.style;
    const style: PersonalCardStyle =
      rawStyle === 'arctic' || rawStyle === 'night' ? rawStyle : 'cobalt';

    const rawHolder =
      typeof req.body?.holderName === 'string' && req.body.holderName.trim().length >= 2
        ? req.body.holderName.trim().toUpperCase()
        : user.fullName.toUpperCase();

    const initialTopUp = Number(req.body?.initialTopUpUzs ?? 0);
    if (initialTopUp > 0) {
      const check = validatePersonalCardTopUp(initialTopUp);
      if (!check.valid) {
        return res.status(400).json({ error: check.error });
      }
    }

    const cardNumber = generateDezagamizCardNumber();
    const now = new Date();
    const expMonth = String(now.getUTCMonth() + 1).padStart(2, '0');
    const expYear = String((now.getUTCFullYear() + 4) % 100).padStart(2, '0');

    const issuedCard: DezagamizPersonalCard = {
      id: `dzc-${crypto.randomUUID().slice(0, 8)}`,
      cardNumber,
      maskedNumber: maskCardNumber(cardNumber),
      last4: cardNumber.slice(-4),
      holderName: rawHolder.slice(0, 32),
      expiry: `${expMonth}/${expYear}`,
      tier,
      style,
      balanceUzs: initialTopUp > 0 ? Math.round(initialTopUp) : 0,
      bonusUzs: 0,
      cashbackRate: PERSONAL_CARD_CASHBACK_RATE[tier],
      isFrozen: false,
      carModel: user.carModel,
      plateNumber: user.plateNumber,
      issuedAt: now.toISOString(),
    };

    user.personalCard = issuedCard;
    db.users[user.id] = user;
    saveDb(db);
    return res.status(201).json(buildSessionPayload(db, user, auth.sessionId));
  });

  app.post('/api/personal-card/topup', (req, res) => {
    const auth = requireVerifiedDriver(req, res);
    if (!auth) return;
    const { db, user } = auth;
    if (!user.personalCard) {
      return res.status(404).json({ error: 'Сначала оформите персональную карту dezagamiz' });
    }
    const amountUzs = Number(req.body?.amountUzs);
    const check = validatePersonalCardTopUp(amountUzs);
    if (!check.valid) {
      return res.status(400).json({ error: check.error });
    }
    user.personalCard.balanceUzs = Math.round(
      (user.personalCard.balanceUzs || 0) + amountUzs,
    );
    db.users[user.id] = user;
    saveDb(db);
    return res.json(buildSessionPayload(db, user, auth.sessionId));
  });

  app.patch('/api/personal-card/design', (req, res) => {
    const auth = requireVerifiedDriver(req, res);
    if (!auth) return;
    const { db, user } = auth;
    if (!user.personalCard) {
      return res.status(404).json({ error: 'Персональная карта dezagamiz не оформлена' });
    }
    const { style, tier } = req.body ?? {};
    if (style === 'cobalt' || style === 'arctic' || style === 'night') {
      user.personalCard.style = style;
    }
    if (tier === 'standard' || tier === 'prime') {
      const validTier: PersonalCardTier = tier;
      user.personalCard.tier = validTier;
      user.personalCard.cashbackRate = PERSONAL_CARD_CASHBACK_RATE[validTier];
    }
    db.users[user.id] = user;
    saveDb(db);
    return res.json(buildSessionPayload(db, user, auth.sessionId));
  });

  app.patch('/api/personal-card/freeze', (req, res) => {
    const auth = requireVerifiedDriver(req, res);
    if (!auth) return;
    const { db, user } = auth;
    if (!user.personalCard) {
      return res.status(404).json({ error: 'Персональная карта dezagamiz не оформлена' });
    }
    user.personalCard.isFrozen =
      typeof req.body?.isFrozen === 'boolean'
        ? req.body.isFrozen
        : !user.personalCard.isFrozen;
    db.users[user.id] = user;
    saveDb(db);
    return res.json(buildSessionPayload(db, user, auth.sessionId));
  });

  // Pay from inside the car -> creates order and dispatches station attendant
  app.post('/api/orders', (req, res) => {
    const auth = requireVerifiedDriver(req, res);
    if (!auth) return;
    const { db, user } = auth;

    const existingActive = db.orders.find(
      (o) => o.userId === user.id && o.stage !== 'completed',
    );
    if (existingActive) {
      return res.status(409).json({
        error: 'У вас уже идёт активная заправка на колонке',
        order: existingActive,
      });
    }

    const { stationId, bayNumber, fuelCode, amountUzs, cardId } = req.body ?? {};
    const liveStations = getLiveStations(db);
    const station = liveStations.find((s) => s.id === stationId);
    if (!station) {
      return res.status(400).json({ error: 'Выберите станцию dezagamiz' });
    }
    const bay = station.bays.find((b) => b.number === Number(bayNumber));
    if (!bay || !bay.available) {
      return res.status(400).json({ error: 'Выбранная колонка сейчас занята' });
    }
    const fuelKey = fuelCode as FuelCode;
    const pricePerUnit = station.prices[fuelKey];
    if (!pricePerUnit || !bay.supportedFuels.includes(fuelKey)) {
      return res.status(400).json({ error: 'Этот вид топлива недоступен на выбранной колонке' });
    }

    const numericAmount = Number(amountUzs);
    if (!Number.isFinite(numericAmount) || numericAmount < 10000 || numericAmount > 2000000) {
      return res.status(400).json({ error: 'Сумма оплаты должна быть от 10 000 до 2 000 000 сум' });
    }

    const usePersonalCard = Boolean(
      user.personalCard && (cardId === user.personalCard.id || cardId === 'personal'),
    );

    let paymentCardId: string;
    let paymentCardMasked: string;
    let paymentCardNetwork: FuelOrder['cardNetwork'];
    let cashbackUzs: number | undefined;

    if (usePersonalCard && user.personalCard) {
      if (user.personalCard.isFrozen) {
        return res.status(400).json({
          error: 'Персональная карта dezagamiz заморожена. Разморозьте её в разделе «Карта и авто».',
        });
      }
      if (user.personalCard.balanceUzs < Math.round(numericAmount)) {
        return res.status(400).json({
          error: 'Недостаточно средств на персональной карте dezagamiz. Пополните баланс.',
        });
      }
      user.personalCard.balanceUzs = Math.round(
        user.personalCard.balanceUzs - numericAmount,
      );
      cashbackUzs = calculatePersonalCardCashback(
        numericAmount,
        user.personalCard.tier,
      );
      user.personalCard.bonusUzs = Math.round(
        (user.personalCard.bonusUzs || 0) + cashbackUzs,
      );
      db.users[user.id] = user;

      paymentCardId = user.personalCard.id;
      paymentCardMasked = user.personalCard.maskedNumber;
      paymentCardNetwork = 'dezagamiz';
    } else {
      const card =
        user.cards.find((c) => c.id === cardId) ||
        user.cards.find((c) => c.isDefault) ||
        user.cards[0];
      paymentCardId = card.id;
      paymentCardMasked = card.maskedNumber;
      paymentCardNetwork = card.network;
    }

    const attendant =
      station.attendants[bay.number % station.attendants.length] ||
      station.attendants[0];

    const targetVolume = calculateFuelVolume(numericAmount, pricePerUnit);
    const nowIso = new Date().toISOString();
    const order: FuelOrder = {
      id: `ord-${crypto.randomUUID().slice(0, 8)}`,
      receiptCode: `DZ-${Math.floor(100000 + Math.random() * 900000)}`,
      userId: user.id,
      stationId: station.id,
      stationName: station.name,
      stationAddress: station.address,
      city: station.city,
      bayNumber: bay.number,
      fuelCode: fuelKey,
      fuelLabel: FUEL_META[fuelKey].label,
      unit: FUEL_META[fuelKey].unit,
      pricePerUnit,
      amountUzs: Math.round(numericAmount),
      targetVolume,
      dispensedVolume: 0,
      cardId: paymentCardId,
      cardMasked: paymentCardMasked,
      cardNetwork: paymentCardNetwork,
      cashbackUzs,
      carModel: user.carModel,
      plateNumber: user.plateNumber,
      attendant,
      stage: 'paid',
      etaSeconds: 4,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.orders.push(order);
    saveDb(db);
    return res.status(201).json(buildSessionPayload(db, user, auth.sessionId));
  });

  app.post('/api/orders/:id/advance', (req, res) => {
    const auth = requireVerifiedDriver(req, res);
    if (!auth) return;
    const { db, user } = auth;
    const order = db.orders.find(
      (o) => o.id === req.params.id && o.userId === user.id,
    );
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }

    const next = getNextOrderStage(order.stage);
    order.stage = next;
    order.updatedAt = new Date().toISOString();
    if (next === 'attendant_approaching') {
      order.etaSeconds = 4;
    } else if (next === 'fueling') {
      order.etaSeconds = 0;
      order.dispensedVolume = Math.round(order.targetVolume * 0.25 * 100) / 100;
    } else if (next === 'completed') {
      order.etaSeconds = 0;
      order.dispensedVolume = order.targetVolume;
      order.completedAt = order.updatedAt;
    }

    saveDb(db);
    return res.json(buildSessionPayload(db, user, auth.sessionId));
  });

  app.post('/api/orders/:id/rate', (req, res) => {
    const auth = requireVerifiedDriver(req, res);
    if (!auth) return;
    const { db, user } = auth;
    const order = db.orders.find(
      (o) => o.id === req.params.id && o.userId === user.id,
    );
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' });
    }
    const rating = Number(req.body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Оценка должна быть от 1 до 5' });
    }
    order.rating = rating;
    order.updatedAt = new Date().toISOString();
    saveDb(db);
    return res.json(buildSessionPayload(db, user, auth.sessionId));
  });

  function resolveAuthenticatedActor(req: express.Request): {
    db: DbState;
    user: DriverUser | null;
    isCreator: boolean;
    ownerKey: string;
  } | null {
    const db = loadDb();
    const sessionId = getSessionId(req);
    const userId = sessionId ? db.sessions[sessionId] : undefined;
    const user = userId ? db.users[userId] || null : null;
    const isCreator = Boolean(sessionId && db.creatorSessions[sessionId]);
    if (user && canAccessApp(user)) {
      return { db, user, isCreator, ownerKey: user.id };
    }
    if (isCreator) {
      return { db, user: null, isCreator: true, ownerKey: 'creator-admin' };
    }
    return null;
  }

  app.get('/api/music', (req, res) => {
    const actor = resolveAuthenticatedActor(req);
    if (!actor) {
      return res.status(401).json({ error: 'Доступ запрещён.' });
    }
    return res.json(getOwnerMusicPayload(actor.db, actor.ownerKey));
  });

  app.post('/api/music/melody', (req, res) => {
    const actor = resolveAuthenticatedActor(req);
    if (!actor) {
      return res.status(401).json({ error: 'Доступ запрещён.' });
    }
    const { title, subtitle, bpm, keySignature, synthPreset, notes, setAsFuelingChime } =
      req.body ?? {};
    const cleanTitle =
      typeof title === 'string' && title.trim()
        ? title.trim().slice(0, 64)
        : 'Моя мелодия';
    const cleanNotes = sanitizeMelodyNotes(notes);
    if (cleanNotes.length === 0) {
      return res.status(400).json({ error: 'Добавьте хотя бы одну ноту для сохранения мелодии.' });
    }
    const numericBpm = Number(bpm);
    const safeBpm = Number.isFinite(numericBpm)
      ? Math.max(60, Math.min(165, Math.round(numericBpm)))
      : 100;
    const validPresets: readonly MelodySynthPreset[] = [
      'rhodes',
      'warm_pad',
      'pluck',
      'chime',
      'bass_groove',
    ];
    const safePreset: MelodySynthPreset = validPresets.includes(synthPreset)
      ? synthPreset
      : 'rhodes';

    const track: PersonalTrack = {
      id: `mel-usr-${crypto.randomUUID().slice(0, 8)}`,
      title: cleanTitle,
      subtitle:
        typeof subtitle === 'string' && subtitle.trim()
          ? subtitle.trim().slice(0, 96)
          : `${safePreset} · ${safeBpm} BPM`,
      kind: 'melody',
      source: 'custom',
      bpm: safeBpm,
      keySignature:
        typeof keySignature === 'string' && keySignature.trim()
          ? keySignature.trim().slice(0, 24)
          : 'D minor',
      synthPreset: safePreset,
      notes: cleanNotes,
      durationSeconds: computeMelodyDurationSeconds(cleanNotes, safeBpm),
      createdAt: new Date().toISOString(),
    };

    const existing = actor.db.musicTracks[actor.ownerKey] || [];
    actor.db.musicTracks[actor.ownerKey] = [track, ...existing].slice(0, 40);
    const currentPrefs = {
      ...getDefaultMusicPrefs(),
      ...(actor.db.musicPrefs[actor.ownerKey] || {}),
      activeTrackId: track.id,
      ...(setAsFuelingChime ? { fuelingChimeTrackId: track.id } : {}),
    };
    actor.db.musicPrefs[actor.ownerKey] = currentPrefs;
    saveDb(actor.db);

    return res.status(201).json({
      track,
      ...getOwnerMusicPayload(actor.db, actor.ownerKey),
    });
  });

  const ALLOWED_AUDIO_MIME_TO_EXT: Record<string, string> = {
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/wave': 'wav',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/x-m4a': 'm4a',
    'audio/aac': 'aac',
    'audio/webm': 'webm',
  };

  app.post('/api/music/upload', (req, res) => {
    const actor = resolveAuthenticatedActor(req);
    if (!actor) {
      return res.status(401).json({ error: 'Доступ запрещён.' });
    }
    const { title, mimeType, base64Data, durationSeconds } = req.body ?? {};
    const cleanMime =
      typeof mimeType === 'string'
        ? mimeType.split(';')[0].trim().toLowerCase()
        : '';
    const ext = ALLOWED_AUDIO_MIME_TO_EXT[cleanMime];
    if (!ext) {
      return res.status(400).json({
        error: 'Поддерживаются только аудиофайлы MP3, WAV, OGG, M4A, AAC или WebM.',
      });
    }
    if (typeof base64Data !== 'string' || base64Data.length < 16) {
      return res.status(400).json({ error: 'Некорректные данные аудиофайла.' });
    }
    const cleanBase64 = base64Data.includes(',')
      ? base64Data.slice(base64Data.indexOf(',') + 1)
      : base64Data;
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.byteLength === 0 || buffer.byteLength > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Размер аудиофайла не должен превышать 5 МБ.' });
    }

    const trackId = `aud-${crypto.randomUUID().slice(0, 10)}`;
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
    const filePath = path.join(AUDIO_DIR, `${trackId}.${ext}`);
    fs.writeFileSync(filePath, buffer);

    const parsedDuration = Number(durationSeconds);
    const track: PersonalTrack = {
      id: trackId,
      title:
        typeof title === 'string' && title.trim()
          ? title.trim().slice(0, 64)
          : 'Личный трек',
      subtitle: `Аудиофайл · ${(buffer.byteLength / (1024 * 1024)).toFixed(1)} МБ`,
      kind: 'audio',
      source: 'upload',
      durationSeconds:
        Number.isFinite(parsedDuration) && parsedDuration > 0
          ? Math.round(parsedDuration * 10) / 10
          : 30,
      audioUrl: `/api/music/file/${trackId}`,
      mimeType: cleanMime,
      createdAt: new Date().toISOString(),
    };

    const existing = actor.db.musicTracks[actor.ownerKey] || [];
    actor.db.musicTracks[actor.ownerKey] = [track, ...existing].slice(0, 40);
    actor.db.musicPrefs[actor.ownerKey] = {
      ...getDefaultMusicPrefs(),
      ...(actor.db.musicPrefs[actor.ownerKey] || {}),
      activeTrackId: track.id,
    };
    saveDb(actor.db);

    return res.status(201).json({
      track,
      ...getOwnerMusicPayload(actor.db, actor.ownerKey),
    });
  });

  app.get('/api/music/file/:id', (req, res) => {
    const actor = resolveAuthenticatedActor(req);
    if (!actor) {
      return res.status(401).json({ error: 'Доступ запрещён.' });
    }
    const safeId = path.basename(req.params.id || '');
    const track = (actor.db.musicTracks[actor.ownerKey] || []).find(
      (t) => t.id === safeId && t.kind === 'audio',
    );
    if (!track) {
      return res.status(404).json({ error: 'Трек не найден' });
    }
    const ext = ALLOWED_AUDIO_MIME_TO_EXT[track.mimeType || ''] || 'mp3';
    const filePath = path.join(AUDIO_DIR, `${safeId}.${ext}`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Аудиофайл отсутствует' });
    }
    res.setHeader('Content-Type', track.mimeType || 'audio/mpeg');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.sendFile(filePath);
  });

  app.patch('/api/music/preferences', (req, res) => {
    const actor = resolveAuthenticatedActor(req);
    if (!actor) {
      return res.status(401).json({ error: 'Доступ запрещён.' });
    }
    const prev = {
      ...getDefaultMusicPrefs(),
      ...(actor.db.musicPrefs[actor.ownerKey] || {}),
    };
    const { activeTrackId, fuelingChimeTrackId, autoPlayOnFueling, volume } =
      req.body ?? {};

    const next: MusicPreferences = {
      activeTrackId:
        activeTrackId === null || typeof activeTrackId === 'string'
          ? activeTrackId
          : prev.activeTrackId,
      fuelingChimeTrackId:
        fuelingChimeTrackId === null || typeof fuelingChimeTrackId === 'string'
          ? fuelingChimeTrackId
          : prev.fuelingChimeTrackId,
      autoPlayOnFueling:
        typeof autoPlayOnFueling === 'boolean'
          ? autoPlayOnFueling
          : prev.autoPlayOnFueling,
      volume:
        typeof volume === 'number' && Number.isFinite(volume)
          ? Math.max(0, Math.min(1, Math.round(volume * 100) / 100))
          : prev.volume,
    };

    actor.db.musicPrefs[actor.ownerKey] = next;
    saveDb(actor.db);
    return res.json(getOwnerMusicPayload(actor.db, actor.ownerKey));
  });

  app.delete('/api/music/:id', (req, res) => {
    const actor = resolveAuthenticatedActor(req);
    if (!actor) {
      return res.status(401).json({ error: 'Доступ запрещён.' });
    }
    const safeId = path.basename(req.params.id || '');
    const list = actor.db.musicTracks[actor.ownerKey] || [];
    const target = list.find((t) => t.id === safeId);
    if (!target) {
      return res.status(404).json({ error: 'Трек не найден' });
    }
    actor.db.musicTracks[actor.ownerKey] = list.filter((t) => t.id !== safeId);
    if (target.kind === 'audio') {
      const ext = ALLOWED_AUDIO_MIME_TO_EXT[target.mimeType || ''] || 'mp3';
      const filePath = path.join(AUDIO_DIR, `${safeId}.${ext}`);
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch {
        // Ignore cleanup errors
      }
    }
    const prefs = {
      ...getDefaultMusicPrefs(),
      ...(actor.db.musicPrefs[actor.ownerKey] || {}),
    };
    if (prefs.activeTrackId === safeId) {
      prefs.activeTrackId = PRESET_MELODIES[0].id;
    }
    if (prefs.fuelingChimeTrackId === safeId) {
      prefs.fuelingChimeTrackId = 'preset-dezagamiz-chime';
    }
    actor.db.musicPrefs[actor.ownerKey] = prefs;
    saveDb(actor.db);
    return res.json(getOwnerMusicPayload(actor.db, actor.ownerKey));
  });

  app.post('/api/assistant/chat', async (req, res) => {
    const actor = resolveAuthenticatedActor(req);
    if (!actor) {
      return res.status(401).json({ error: 'Доступ запрещён.' });
    }
    const { message, history, context } = req.body ?? {};
    const cleanMessage = typeof message === 'string' ? message.trim() : '';
    if (!cleanMessage) {
      return res.status(400).json({ error: 'Введите сообщение для помощника.' });
    }

    const sessionOrders = actor.user
      ? actor.db.orders
          .filter((o) => o.userId === actor.user!.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : actor.db.orders.slice(-5);
    const activeOrder =
      sessionOrders.find((o) => o.stage !== 'completed') || null;
    const musicState = getOwnerMusicPayload(actor.db, actor.ownerKey);

    try {
      const result = await runPersonalAssistantChat({
        message: cleanMessage.slice(0, 2000),
        history: Array.isArray(history) ? history : [],
        ctx: {
          user: actor.user,
          isCreator: actor.isCreator,
          stations: getLiveStations(actor.db),
          orders: sessionOrders,
          activeOrder,
          driverLocation:
            context?.driverLocation &&
            typeof context.driverLocation.lat === 'number' &&
            typeof context.driverLocation.lng === 'number'
              ? context.driverLocation
              : null,
          selectedStationId:
            typeof context?.selectedStationId === 'string'
              ? context.selectedStationId
              : undefined,
          lang: typeof context?.lang === 'string' ? context.lang : 'ru',
          tracksSummary: musicState.tracks.map((tr) => tr.title),
        },
        onSaveMelody: (track, setAsChime) => {
          const existing = actor.db.musicTracks[actor.ownerKey] || [];
          actor.db.musicTracks[actor.ownerKey] = [track, ...existing].slice(0, 40);
          actor.db.musicPrefs[actor.ownerKey] = {
            ...getDefaultMusicPrefs(),
            ...(actor.db.musicPrefs[actor.ownerKey] || {}),
            activeTrackId: track.id,
            ...(setAsChime ? { fuelingChimeTrackId: track.id } : {}),
          };
          saveDb(actor.db);
        },
      });

      return res.json({
        reply: result.reply,
        actions: result.actions,
        music: getOwnerMusicPayload(actor.db, actor.ownerKey),
      });
    } catch (err) {
      if (err instanceof GeminiRouteError) {
        return res
          .status(err.status)
          .json({ error: err.message, code: err.code });
      }
      return res.status(502).json({
        error: 'Ошибка обращения к Gemini API.',
        code: 'upstream_error',
      });
    }
  });

  app.post('/api/assistant/compose-melody', async (req, res) => {
    const actor = resolveAuthenticatedActor(req);
    if (!actor) {
      return res.status(401).json({ error: 'Доступ запрещён.' });
    }
    const { prompt, bpm, synthPreset, lang, setAsFuelingChime } = req.body ?? {};
    const cleanPrompt =
      typeof prompt === 'string' && prompt.trim()
        ? prompt.trim().slice(0, 500)
        : 'Спокойная ночная мелодия для поездки по Узбекистану';

    try {
      const track = await composeMelodyWithGemini({
        prompt: cleanPrompt,
        bpm: Number(bpm) || 96,
        synthPreset: synthPreset || 'rhodes',
        lang: typeof lang === 'string' ? lang : 'ru',
      });
      const existing = actor.db.musicTracks[actor.ownerKey] || [];
      actor.db.musicTracks[actor.ownerKey] = [track, ...existing].slice(0, 40);
      actor.db.musicPrefs[actor.ownerKey] = {
        ...getDefaultMusicPrefs(),
        ...(actor.db.musicPrefs[actor.ownerKey] || {}),
        activeTrackId: track.id,
        ...(setAsFuelingChime ? { fuelingChimeTrackId: track.id } : {}),
      };
      saveDb(actor.db);

      return res.status(201).json({
        track,
        ...getOwnerMusicPayload(actor.db, actor.ownerKey),
      });
    } catch (err) {
      if (err instanceof GeminiRouteError) {
        return res
          .status(err.status)
          .json({ error: err.message, code: err.code });
      }
      return res.status(502).json({
        error: 'Не удалось сгенерировать мелодию через Gemini.',
        code: 'upstream_error',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT || 3000);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`dezagamiz server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
