import type {
  AppView,
  CardNetwork,
  DriverUser,
  DriverVehicle,
  FuelCode,
  FuelStation,
  LatLngPoint,
  OrderStage,
  PersonalCardTier,
  RankedStation,
  StationCity,
  StationCityFilter,
  StationQueueLevel,
  StationSortMode,
} from '../types/dezagamiz';

export const FUEL_META: Record<
  FuelCode,
  { label: string; shortLabel: string; unit: 'м³' | 'л'; pressureLabel?: string }
> = {
  metan: {
    label: 'Метан (CNG)',
    shortLabel: 'Метан',
    unit: 'м³',
    pressureLabel: '200 бар',
  },
  propan: {
    label: 'Пропан (LPG)',
    shortLabel: 'Пропан',
    unit: 'л',
    pressureLabel: '16 бар',
  },
  ai92: {
    label: 'Бензин АИ-92',
    shortLabel: 'АИ-92',
    unit: 'л',
  },
  ai95: {
    label: 'Бензин АИ-95',
    shortLabel: 'АИ-95',
    unit: 'л',
  },
};

export const ORDER_STAGE_SEQUENCE: OrderStage[] = [
  'paid',
  'attendant_approaching',
  'fueling',
  'completed',
];

export function normalizeDigits(input: string): string {
  return input.replace(/\D/g, '');
}

export function formatUzbekPhone(input: string): string {
  let digits = normalizeDigits(input);
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('8') && digits.length > 9) {
    digits = digits.slice(1);
  }
  digits = digits.slice(0, 9);

  if (digits.length === 0) return '+998 ';
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 5);
  const p3 = digits.slice(5, 7);
  const p4 = digits.slice(7, 9);

  let out = `+998 ${p1}`;
  if (p2) out += ` ${p2}`;
  if (p3) out += ` ${p3}`;
  if (p4) out += ` ${p4}`;
  return out;
}

export function validateUzbekPhone(phone: string): boolean {
  const digits = normalizeDigits(phone);
  return /^998\d{9}$/.test(digits);
}

export function normalizeUzbekPlate(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateUzbekPlate(plate: string): boolean {
  const compact = plate.toUpperCase().replace(/[^0-9A-Z]/g, '');
  // Standard Uzbekistan private/commercial plates:
  // 01A777AA (2 digits + 1 letter + 3 digits + 2 letters)
  // 01777AAA (2 digits + 3 digits + 3 letters)
  return /^(0[1-9]|[1-9][0-9])([A-Z]\d{3}[A-Z]{2}|\d{3}[A-Z]{3})$/.test(compact);
}

export function detectCardNetwork(cardInput: string): CardNetwork | null {
  const digits = normalizeDigits(cardInput);
  if (digits.length < 4) return null;
  if (digits.startsWith('8600') || digits.startsWith('5614')) return 'Uzcard';
  if (digits.startsWith('9860')) return 'Humo';
  if (digits.startsWith('4')) return 'Visa';
  const firstTwo = Number(digits.slice(0, 2));
  const firstFour = Number(digits.slice(0, 4));
  if (
    (firstTwo >= 51 && firstTwo <= 55) ||
    (firstFour >= 2221 && firstFour <= 2720)
  ) {
    return 'Mastercard';
  }
  return null;
}

export function formatCardNumberInput(input: string): string {
  const digits = normalizeDigits(input).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function passesLuhn(digits: string): boolean {
  if (!/^\d{16}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let val = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      val *= 2;
      if (val > 9) val -= 9;
    }
    sum += val;
  }
  return sum % 10 === 0;
}

export function validateCardNumber(cardInput: string): {
  valid: boolean;
  network: CardNetwork | null;
  error?: string;
} {
  const digits = normalizeDigits(cardInput);
  if (digits.length !== 16) {
    return {
      valid: false,
      network: detectCardNetwork(digits),
      error: 'Введите 16 цифр номера карты',
    };
  }
  const network = detectCardNetwork(digits);
  if (!network) {
    return {
      valid: false,
      network: null,
      error: 'Поддерживаются карты Uzcard (8600), Humo (9860), Visa и Mastercard',
    };
  }
  if (!passesLuhn(digits)) {
    return {
      valid: false,
      network,
      error: 'Некорректный контрольный номер карты',
    };
  }
  return { valid: true, network };
}

export function formatExpiryInput(input: string): string {
  const digits = normalizeDigits(input).slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function validateCardExpiry(
  expiry: string,
  referenceDate: Date = new Date('2026-11-14T00:00:00Z'),
): boolean {
  const match = /^(\d{2})\/(\d{2})$/.exec(expiry.trim());
  if (!match) return false;
  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  const refYear = referenceDate.getUTCFullYear();
  const refMonth = referenceDate.getUTCMonth() + 1;
  if (year < refYear) return false;
  if (year === refYear && month < refMonth) return false;
  return true;
}

export function maskCardNumber(cardInput: string): string {
  const digits = normalizeDigits(cardInput);
  const last4 = digits.slice(-4);
  const first4 = digits.slice(0, 4);
  if (digits.length < 8) return `•••• ${last4}`;
  return `${first4} •••• •••• ${last4}`;
}

export function calculateFuelVolume(
  amountUzs: number,
  pricePerUnit: number,
): number {
  if (amountUzs <= 0 || pricePerUnit <= 0) return 0;
  return Math.round((amountUzs / pricePerUnit) * 100) / 100;
}

export function formatUzs(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} сум`;
}

export function getNextOrderStage(current: OrderStage): OrderStage {
  const idx = ORDER_STAGE_SEQUENCE.indexOf(current);
  if (idx === -1 || idx >= ORDER_STAGE_SEQUENCE.length - 1) {
    return 'completed';
  }
  return ORDER_STAGE_SEQUENCE[idx + 1];
}

export function canAccessApp(user: DriverUser | null): boolean {
  if (!user) return false;
  return Boolean(user.isRegistered && Array.isArray(user.cards) && user.cards.length > 0);
}

export const CREATOR_ACCESS_CODE = 'MorzhowichKittisiwich88';

export function verifyCreatorCode(code: string): boolean {
  return code.trim() === CREATOR_ACCESS_CODE;
}

export const GUEST_MAX_DAYS = 3;
export const GUEST_DURATION_MS = GUEST_MAX_DAYS * 24 * 60 * 60 * 1000;

export function computeGuestExpiresAt(startedAtMs: number = Date.now()): string {
  return new Date(startedAtMs + GUEST_DURATION_MS).toISOString();
}

export function isGuestExpired(
  expiresAtIso: string | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!expiresAtIso) return true;
  const expiresMs = Date.parse(expiresAtIso);
  if (!Number.isFinite(expiresMs)) return true;
  return expiresMs <= nowMs;
}

export function getGuestRemainingMs(
  expiresAtIso: string | null | undefined,
  nowMs: number = Date.now(),
): number {
  if (!expiresAtIso) return 0;
  const expiresMs = Date.parse(expiresAtIso);
  if (!Number.isFinite(expiresMs)) return 0;
  const diff = expiresMs - nowMs;
  if (diff <= 0) return 0;
  return Math.min(GUEST_DURATION_MS, diff);
}

export function formatGuestRemaining(
  expiresAtIso: string | null | undefined,
  lang: 'ru' | 'uz' | 'en' | 'kk' | 'tr' = 'ru',
  nowMs: number = Date.now(),
): string {
  const remaining = getGuestRemainingMs(expiresAtIso, nowMs);
  if (remaining <= 0) return '0';
  const totalMinutes = Math.floor(remaining / 60000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  const labels = {
    ru: { d: 'дн.', h: 'ч.', m: 'мин.' },
    uz: { d: 'kun', h: 'soat', m: 'daq.' },
    en: { d: 'd', h: 'h', m: 'm' },
    kk: { d: 'күн', h: 'сағ', m: 'мин' },
    tr: { d: 'g', h: 'sa', m: 'dk' },
  }[lang];

  if (days > 0) {
    return `${days} ${labels.d} ${hours} ${labels.h}`;
  }
  if (hours > 0) {
    return `${hours} ${labels.h} ${minutes} ${labels.m}`;
  }
  return `${Math.max(1, minutes)} ${labels.m}`;
}

export function haversineDistanceKm(a: LatLngPoint, b: LatLngPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  const km = 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return km < 1 ? Math.round(km * 1000) / 1000 : Math.round(km * 100) / 100;
}

export function isFuelEnabledOnStation(
  station: FuelStation,
  fuelCode: FuelCode,
): boolean {
  if (!station.prices[fuelCode]) return false;
  if (station.disabledFuels && station.disabledFuels.includes(fuelCode)) {
    return false;
  }
  return station.bays.some((b) => b.supportedFuels.includes(fuelCode));
}

export function getEffectiveQueueLevel(station: FuelStation): StationQueueLevel {
  if (station.queueLevel) return station.queueLevel;
  const total = Math.max(1, station.bays.length);
  const free = station.bays.filter((b) => b.available).length;
  const ratio = free / total;
  if (ratio >= 0.55) return 'low';
  if (ratio >= 0.25) return 'medium';
  return 'high';
}

export function countAvailableBaysForFuel(
  station: FuelStation,
  fuelFilter: FuelCode | 'all',
): number {
  if (station.operationalStatus === 'maintenance') {
    return 0;
  }
  if (fuelFilter === 'all') {
    return station.bays.filter((b) => b.available).length;
  }
  if (!isFuelEnabledOnStation(station, fuelFilter)) return 0;
  return station.bays.filter(
    (b) => b.available && b.supportedFuels.includes(fuelFilter),
  ).length;
}

export function stationSupportsFuel(
  station: FuelStation,
  fuelFilter: FuelCode | 'all',
  requireAvailableBay: boolean = false,
): boolean {
  if (fuelFilter === 'all') {
    if (station.operationalStatus === 'maintenance' && requireAvailableBay) {
      return false;
    }
    return requireAvailableBay
      ? station.bays.some((b) => b.available)
      : station.bays.length > 0;
  }
  if (!isFuelEnabledOnStation(station, fuelFilter)) return false;
  if (!requireAvailableBay) return true;
  return countAvailableBaysForFuel(station, fuelFilter) > 0;
}

export function computeStationBestScore(
  station: RankedStation,
  vehicleProfile?: VehicleFuelProfile | null,
): number {
  let score = 0;

  // 1. Operational status
  const op = station.operationalStatus || 'open';
  if (op === 'open') score += 100;
  else if (op === 'busy') score += 55;
  else score -= 250;

  // 2. Fuel filter support & free bay
  if (station.supportsSelectedFuel) score += 40;
  if (station.hasAvailableBayForFuel) score += 30;

  // 3. Compatibility with driver's car model
  if (vehicleProfile && vehicleProfile.powertrain !== 'ev_only') {
    const hasCarFuel = vehicleProfile.supportedFuels.some((code) =>
      isFuelEnabledOnStation(station, code),
    );
    score += hasCarFuel ? 35 : -55;
  }

  // 4. Queue load & bay freedom ratio
  const queue = getEffectiveQueueLevel(station);
  if (queue === 'low') score += 28;
  else if (queue === 'medium') score += 12;
  else score -= 18;

  const totalBays = Math.max(1, station.bays.length);
  const freeBays =
    station.operationalStatus === 'maintenance'
      ? 0
      : station.bays.filter((b) => b.available).length;
  score += Math.round((freeBays / totalBays) * 16);

  // 5. Distance penalty (closer is better)
  const distKm = station.straightDistanceKm ?? station.distanceKm;
  score -= Math.min(80, Math.round(distKm * 2.4));

  return score;
}

export function rankStationsByProximity(
  origin: LatLngPoint | null,
  stations: FuelStation[],
  fuelFilter: FuelCode | 'all' = 'all',
  vehicleCarModel?: string | null,
): RankedStation[] {
  const vehicleProfile = vehicleCarModel
    ? getVehicleFuelProfile(vehicleCarModel)
    : null;

  const ranked: RankedStation[] = stations.map((station) => {
    const hasCoords =
      typeof station.lat === 'number' &&
      Number.isFinite(station.lat) &&
      typeof station.lng === 'number' &&
      Number.isFinite(station.lng);
    let straightDistanceKm: number | null = null;
    if (origin && hasCoords) {
      straightDistanceKm = haversineDistanceKm(origin, {
        lat: station.lat as number,
        lng: station.lng as number,
      });
    } else if (origin) {
      const cityCenter = UZBEKISTAN_CITY_CENTERS[station.city];
      if (cityCenter) {
        const cityDist = haversineDistanceKm(origin, cityCenter);
        straightDistanceKm = cityDist < 15 ? station.distanceKm : cityDist;
      }
    }
    const supportsSelectedFuel = stationSupportsFuel(station, fuelFilter, false);
    const freeBaysForFuel = countAvailableBaysForFuel(station, fuelFilter);
    const hasAvailableBayForFuel = freeBaysForFuel > 0;
    const vehicleCompatible =
      !vehicleProfile || vehicleProfile.powertrain === 'ev_only'
        ? true
        : vehicleProfile.supportedFuels.some((code) =>
            isFuelEnabledOnStation(station, code),
          );

    const base: RankedStation = {
      ...station,
      straightDistanceKm,
      supportsSelectedFuel,
      hasAvailableBayForFuel,
      freeBaysForFuel,
      vehicleCompatible,
    };
    base.bestScore = computeStationBestScore(base, vehicleProfile);
    return base;
  });

  ranked.sort((a, b) => {
    // 1. Matching fuel first
    if (a.supportsSelectedFuel !== b.supportsSelectedFuel) {
      return a.supportsSelectedFuel ? -1 : 1;
    }
    // 2. Available bay for selected fuel preferred
    if (a.hasAvailableBayForFuel !== b.hasAvailableBayForFuel) {
      return a.hasAvailableBayForFuel ? -1 : 1;
    }
    // 3. Nearest computed distance (straight-line km) when coordinates or city anchor are known
    const distA = a.straightDistanceKm ?? Number.POSITIVE_INFINITY;
    const distB = b.straightDistanceKm ?? Number.POSITIVE_INFINITY;
    if (distA !== distB) {
      return distA - distB;
    }
    // 4. Fallback to catalog distanceKm
    return a.distanceKm - b.distanceKm;
  });

  return ranked;
}

export function rankStationsBestNearby(
  origin: LatLngPoint | null,
  stations: FuelStation[],
  fuelFilter: FuelCode | 'all' = 'all',
  vehicleCarModel?: string | null,
): RankedStation[] {
  const ranked = rankStationsByProximity(
    origin,
    stations,
    fuelFilter,
    vehicleCarModel,
  );
  ranked.sort((a, b) => {
    const scoreDiff = (b.bestScore ?? 0) - (a.bestScore ?? 0);
    if (scoreDiff !== 0) return scoreDiff;
    const distA = a.straightDistanceKm ?? a.distanceKm;
    const distB = b.straightDistanceKm ?? b.distanceKm;
    return distA - distB;
  });
  return ranked;
}

export function rankStationsWithMode(
  origin: LatLngPoint | null,
  stations: FuelStation[],
  fuelFilter: FuelCode | 'all' = 'all',
  sortMode: StationSortMode = 'nearest',
  vehicleCarModel?: string | null,
): RankedStation[] {
  if (sortMode === 'best_nearby') {
    return rankStationsBestNearby(origin, stations, fuelFilter, vehicleCarModel);
  }
  return rankStationsByProximity(origin, stations, fuelFilter, vehicleCarModel);
}

export function findNearestStationForFuel(
  origin: LatLngPoint | null,
  stations: FuelStation[],
  fuelFilter: FuelCode | 'all' = 'all',
  sortMode: StationSortMode = 'nearest',
  vehicleCarModel?: string | null,
): RankedStation | null {
  const ranked = rankStationsWithMode(
    origin,
    stations,
    fuelFilter,
    sortMode,
    vehicleCarModel,
  );
  const matching = ranked.filter(
    (s) => s.supportsSelectedFuel && s.operationalStatus !== 'maintenance',
  );
  if (matching.length > 0) return matching[0];
  const anyMatching = ranked.filter((s) => s.supportsSelectedFuel);
  return anyMatching[0] || null;
}

export function formatCoordinates(lat?: number, lng?: number): string {
  if (
    typeof lat !== 'number' ||
    !Number.isFinite(lat) ||
    typeof lng !== 'number' ||
    !Number.isFinite(lng)
  ) {
    return '—';
  }
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function formatRouteDuration(
  durationMillis: number | null | undefined,
  lang: 'ru' | 'uz' | 'en' | 'kk' | 'tr' = 'ru',
): string {
  if (!durationMillis || !Number.isFinite(durationMillis) || durationMillis <= 0) {
    return '—';
  }
  const totalMinutes = Math.max(1, Math.round(durationMillis / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const labels = {
    ru: { h: 'ч', m: 'мин' },
    uz: { h: 'soat', m: 'daq' },
    en: { h: 'h', m: 'min' },
    kk: { h: 'сағ', m: 'мин' },
    tr: { h: 'sa', m: 'dk' },
  }[lang];
  if (hours > 0) {
    return `${hours} ${labels.h} ${mins} ${labels.m}`;
  }
  return `${mins} ${labels.m}`;
}

export function buildGoogleMapsDirectionsUrl(
  origin: LatLngPoint | null,
  destination: LatLngPoint,
): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${destination.lat},${destination.lng}`,
    travelmode: 'driving',
  });
  if (origin) {
    params.set('origin', `${origin.lat},${origin.lng}`);
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function getDriverVehicles(user: DriverUser): DriverVehicle[] {
  if (Array.isArray(user.vehicles) && user.vehicles.length > 0) {
    const hasDefault = user.vehicles.some((v) => v.isDefault);
    if (hasDefault) return user.vehicles;
    return user.vehicles.map((v, idx) => ({ ...v, isDefault: idx === 0 }));
  }
  return [
    {
      id: `veh-primary-${user.id}`,
      carModel: user.carModel,
      plateNumber: user.plateNumber,
      preferredFuel: user.preferredFuel || 'metan',
      isDefault: true,
      addedAt: user.createdAt,
    },
  ];
}

export function formatDistanceShort(
  distanceKm: number | null | undefined,
  lang: 'ru' | 'uz' | 'en' | 'kk' | 'tr' = 'ru',
): string {
  if (distanceKm === null || distanceKm === undefined || !Number.isFinite(distanceKm)) {
    return '—';
  }
  const units = {
    ru: { m: 'м', km: 'км' },
    uz: { m: 'm', km: 'km' },
    en: { m: 'm', km: 'km' },
    kk: { m: 'м', km: 'км' },
    tr: { m: 'm', km: 'km' },
  }[lang];
  if (distanceKm < 1) {
    return `${Math.max(10, Math.round(distanceKm * 1000))} ${units.m}`;
  }
  return `${Math.round(distanceKm * 10) / 10} ${units.km}`;
}

export function classifyNearbyPlaceCategory(
  primaryType?: string | null,
  types?: string[] | null,
): 'gas_station' | 'cafe' | 'store' | 'service' | 'other' {
  const all = [primaryType || '', ...(types || [])]
    .map((t) => t.toLowerCase())
    .filter(Boolean);

  if (all.some((t) => t.includes('gas_station') || t.includes('electric_vehicle_charging'))) {
    return 'gas_station';
  }
  if (
    all.some(
      (t) =>
        t.includes('cafe') ||
        t.includes('restaurant') ||
        t.includes('bakery') ||
        t.includes('coffee') ||
        t.includes('fast_food') ||
        t.includes('meal_'),
    )
  ) {
    return 'cafe';
  }
  if (
    all.some(
      (t) =>
        t.includes('car_wash') ||
        t.includes('car_repair') ||
        t.includes('auto_') ||
        t.includes('tire') ||
        t.includes('parking'),
    )
  ) {
    return 'service';
  }
  if (
    all.some(
      (t) =>
        t.includes('store') ||
        t.includes('supermarket') ||
        t.includes('grocery') ||
        t.includes('market') ||
        t.includes('pharmacy') ||
        t.includes('shopping_mall') ||
        t.includes('atm') ||
        t.includes('bank'),
    )
  ) {
    return 'store';
  }
  return 'other';
}

export function shouldRefreshOrigin(
  prev: LatLngPoint | null | undefined,
  next: LatLngPoint,
  thresholdMeters: number = 60,
): boolean {
  if (!prev) return true;
  const distKm = haversineDistanceKm(prev, next);
  return distKm * 1000 >= thresholdMeters;
}

export const DEZAGAMIZ_CARD_BIN = '7788';

export const PERSONAL_CARD_CASHBACK_RATE: Record<PersonalCardTier, number> = {
  standard: 0.03,
  prime: 0.05,
};

export function generateDezagamizCardNumber(randomBodyDigits?: string): string {
  let body11 = (randomBodyDigits || '').replace(/\D/g, '').slice(0, 11);
  while (body11.length < 11) {
    body11 += Math.floor(Math.random() * 10).toString();
  }
  const partial15 = `${DEZAGAMIZ_CARD_BIN}${body11}`;

  // Compute exact Luhn check digit for the 16th position
  let sum = 0;
  for (let i = 0; i < partial15.length; i++) {
    let val = Number(partial15[partial15.length - 1 - i]);
    if (i % 2 === 0) {
      val *= 2;
      if (val > 9) val -= 9;
    }
    sum += val;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return `${partial15}${checkDigit}`;
}

export function formatDezagamizCardGroups(cardNumber: string): string {
  const digits = normalizeDigits(cardNumber).slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

export function calculatePersonalCardCashback(
  amountUzs: number,
  tier: PersonalCardTier,
): number {
  if (!Number.isFinite(amountUzs) || amountUzs <= 0) return 0;
  const rate = PERSONAL_CARD_CASHBACK_RATE[tier] ?? 0.03;
  return Math.round(amountUzs * rate);
}

export function validatePersonalCardTopUp(amountUzs: number): {
  valid: boolean;
  error?: string;
} {
  if (!Number.isFinite(amountUzs) || amountUzs < 10000) {
    return {
      valid: false,
      error: 'Минимальная сумма пополнения — 10 000 сум',
    };
  }
  if (amountUzs > 5000000) {
    return {
      valid: false,
      error: 'Максимальная сумма одного пополнения — 5 000 000 сум',
    };
  }
  return { valid: true };
}

export type ThemeMode = 'light' | 'dark';

export const THEME_SWITCH_DURATION_MS = 520;

export function normalizeThemeMode(value: unknown): ThemeMode {
  return value === 'dark' ? 'dark' : 'light';
}

export function getNextThemeMode(current: ThemeMode): ThemeMode {
  return current === 'dark' ? 'light' : 'dark';
}

export type SlideDirection = 'forward' | 'backward';

export const DRIVER_VIEW_ORDER: readonly AppView[] = [
  'fuel',
  'stations',
  'assistant',
  'showcase',
  'history',
  'profile',
  'creator',
];

export const ADMIN_VIEW_ORDER: readonly AppView[] = ['creator', 'stations'];

export const GATE_MODE_ORDER = ['register', 'login', 'guest', 'creator'] as const;

export function getIndexedSlideDirection<T>(
  order: readonly T[],
  prev: T,
  next: T,
): SlideDirection {
  const prevIndex = order.indexOf(prev);
  const nextIndex = order.indexOf(next);
  if (prevIndex === -1 || nextIndex === -1 || nextIndex >= prevIndex) {
    return 'forward';
  }
  return 'backward';
}

export function getPageSlideDirection(
  prevView: AppView,
  nextView: AppView,
  isAdminView: boolean,
): SlideDirection {
  const order = isAdminView ? ADMIN_VIEW_ORDER : DRIVER_VIEW_ORDER;
  return getIndexedSlideDirection(order, prevView, nextView);
}

export const STATION_CITIES: readonly StationCity[] = [
  'Ташкент',
  'Самарканд',
  'Бухара',
  'Фергана',
];

export const UZBEKISTAN_CITY_CENTERS: Record<
  StationCity,
  { lat: number; lng: number; geocodeQuery: string }
> = {
  Ташкент: {
    lat: 41.3111,
    lng: 69.2797,
    geocodeQuery: 'Amir Temur Square, Tashkent, Uzbekistan',
  },
  Самарканд: {
    lat: 39.6542,
    lng: 66.9597,
    geocodeQuery: 'Registan Square, Samarkand, Uzbekistan',
  },
  Бухара: {
    lat: 39.7747,
    lng: 64.4286,
    geocodeQuery: 'Bukhara, Uzbekistan',
  },
  Фергана: {
    lat: 40.3864,
    lng: 71.7864,
    geocodeQuery: 'Fergana, Uzbekistan',
  },
};

export function detectClosestCity(point: LatLngPoint): StationCity {
  let closest: StationCity = 'Ташкент';
  let minDistance = Number.POSITIVE_INFINITY;
  for (const city of STATION_CITIES) {
    const center = UZBEKISTAN_CITY_CENTERS[city];
    const d = haversineDistanceKm(point, center);
    if (d < minDistance) {
      minDistance = d;
      closest = city;
    }
  }
  return closest;
}

export function filterStationsByCity(
  stations: FuelStation[],
  cityFilter: StationCityFilter,
): FuelStation[] {
  if (cityFilter === 'all') return stations;
  return stations.filter((station) => station.city === cityFilter);
}

const MAX_MERCATOR_LAT = 85.05112878;

export function clampMercatorLat(lat: number): number {
  return Math.max(-MAX_MERCATOR_LAT, Math.min(MAX_MERCATOR_LAT, lat));
}

export function latLngToWorldPoint(
  lat: number,
  lng: number,
  zoom: number,
): { x: number; y: number } {
  const scale = 256 * Math.pow(2, zoom);
  const clampedLat = clampMercatorLat(lat);
  const sinLat = Math.sin((clampedLat * Math.PI) / 180);
  const x = ((lng + 180) / 360) * scale;
  const y =
    (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return { x, y };
}

export function worldPointToLatLng(
  x: number,
  y: number,
  zoom: number,
): { lat: number; lng: number } {
  const scale = 256 * Math.pow(2, zoom);
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  return { lat: clampMercatorLat(lat), lng };
}

export function computeFitBoundsViewport(
  points: Array<{ lat: number; lng: number }>,
  width: number,
  height: number,
  paddingPx: number = 56,
  minZoom: number = 5,
  maxZoom: number = 16,
): { lat: number; lng: number; zoom: number } {
  if (points.length === 0) {
    return { lat: 41.3111, lng: 69.2797, zoom: 12 };
  }
  if (points.length === 1) {
    return { lat: points[0].lat, lng: points[0].lng, zoom: Math.min(14, maxZoom) };
  }

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const usableW = Math.max(120, width - paddingPx * 2);
  const usableH = Math.max(120, height - paddingPx * 2);

  let chosenZoom = minZoom;
  for (let z = maxZoom; z >= minZoom; z -= 0.25) {
    const nw = latLngToWorldPoint(maxLat, minLng, z);
    const se = latLngToWorldPoint(minLat, maxLng, z);
    const spanW = Math.abs(se.x - nw.x);
    const spanH = Math.abs(se.y - nw.y);
    if (spanW <= usableW && spanH <= usableH) {
      chosenZoom = Math.round(z * 100) / 100;
      break;
    }
  }

  return { lat: centerLat, lng: centerLng, zoom: chosenZoom };
}

export function decodeEncodedPolyline(
  encoded: string,
): Array<{ lat: number; lng: number }> {
  if (!encoded || typeof encoded !== 'string') return [];
  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;
    do {
      if (index >= encoded.length) break;
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dLat;

    shift = 0;
    result = 0;
    do {
      if (index >= encoded.length) break;
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dLng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

export function normalizeHeadingDegrees(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  const wrapped = ((deg % 360) + 360) % 360;
  return Math.round(wrapped * 10) / 10;
}

export function clampPitchDegrees(
  pitch: number,
  min: number = -45,
  max: number = 65,
): number {
  if (!Number.isFinite(pitch)) return 0;
  return Math.max(min, Math.min(max, Math.round(pitch * 10) / 10));
}

export function computeBearingDegrees(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number {
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  if (y === 0 && x === 0) return 0;
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return normalizeHeadingDegrees(bearing);
}

export function getCompassDirectionLabel(
  headingDeg: number,
  lang: 'ru' | 'uz' | 'en' | 'kk' | 'tr' = 'ru',
): string {
  const normalized = normalizeHeadingDegrees(headingDeg);
  const index = Math.round(normalized / 45) % 8;
  const labels: Record<'ru' | 'uz' | 'en' | 'kk' | 'tr', readonly string[]> = {
    ru: ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'],
    uz: ['Sh', 'ShShq', 'Shq', 'JShq', 'J', 'JGʻ', 'Gʻ', 'ShGʻ'],
    en: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
    kk: ['С', 'СШ', 'Ш', 'ОШ', 'О', 'ОБ', 'Б', 'СБ'],
    tr: ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'],
  };
  return labels[lang][index] ?? labels.ru[index];
}

export function buildGoogleMapsStreetViewUrl(
  point: { lat: number; lng: number },
  headingDeg?: number,
): string {
  const params = new URLSearchParams({
    api: '1',
    map_action: 'pano',
    viewpoint: `${point.lat},${point.lng}`,
  });
  if (typeof headingDeg === 'number' && Number.isFinite(headingDeg)) {
    params.set('heading', String(Math.round(normalizeHeadingDegrees(headingDeg))));
  }
  return `https://www.google.com/maps/@?${params.toString()}`;
}

export function pixelOffsetToLatLng(
  centerLat: number,
  centerLng: number,
  zoom: number,
  dxFromCenter: number,
  dyFromCenter: number,
): { lat: number; lng: number } {
  const centerWorld = latLngToWorldPoint(centerLat, centerLng, zoom);
  return worldPointToLatLng(
    centerWorld.x + dxFromCenter,
    centerWorld.y + dyFromCenter,
    zoom,
  );
}

export function computePegmanTiltDegrees(deltaX: number): number {
  if (!Number.isFinite(deltaX)) return 0;
  return Math.max(-24, Math.min(24, Math.round(deltaX * 0.9)));
}

export function findNearestSnapStation<
  T extends { id: string; lat?: number; lng?: number; name: string },
>(
  dropX: number,
  dropY: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  viewportWidth: number,
  viewportHeight: number,
  stations: readonly T[],
  maxSnapPx: number = 44,
): T | null {
  const centerWorld = latLngToWorldPoint(centerLat, centerLng, zoom);
  let best: T | null = null;
  let bestDist = maxSnapPx;

  for (const station of stations) {
    if (typeof station.lat !== 'number' || typeof station.lng !== 'number') {
      continue;
    }
    const world = latLngToWorldPoint(station.lat, station.lng, zoom);
    const px = viewportWidth / 2 + (world.x - centerWorld.x);
    const py = viewportHeight / 2 + (world.y - centerWorld.y);
    // Pin tip sits around (px, py - 14) since marker is -translate-y-full with ~34px height
    const dist = Math.hypot(dropX - px, dropY - (py - 14));
    if (dist <= bestDist) {
      bestDist = dist;
      best = station;
    }
  }
  return best;
}

export function formatLocationAge(
  updatedAt: number | undefined,
  nowMs: number = Date.now(),
  lang: 'ru' | 'uz' | 'en' | 'kk' | 'tr' = 'ru',
): string {
  if (typeof updatedAt !== 'number' || !Number.isFinite(updatedAt)) {
    return '—';
  }
  const diffSec = Math.max(0, Math.floor((nowMs - updatedAt) / 1000));
  if (diffSec < 5) {
    return {
      ru: 'только что',
      uz: 'hozirgina',
      en: 'just now',
      kk: 'жаңа ғана',
      tr: 'az önce',
    }[lang];
  }
  if (diffSec < 60) {
    return {
      ru: `${diffSec} с назад`,
      uz: `${diffSec} s oldin`,
      en: `${diffSec}s ago`,
      kk: `${diffSec} с бұрын`,
      tr: `${diffSec} sn önce`,
    }[lang];
  }
  if (diffSec < 3600) {
    const mins = Math.floor(diffSec / 60);
    return {
      ru: `${mins} мин назад`,
      uz: `${mins} daq oldin`,
      en: `${mins}m ago`,
      kk: `${mins} мин бұрын`,
      tr: `${mins} dk önce`,
    }[lang];
  }
  const hours = Math.floor(diffSec / 3600);
  return {
    ru: `${hours} ч назад`,
    uz: `${hours} soat oldin`,
    en: `${hours}h ago`,
    kk: `${hours} сағ бұрын`,
    tr: `${hours} sa önce`,
  }[lang];
}

export function formatSpeedKmh(
  speedMps: number | null | undefined,
  lang: 'ru' | 'uz' | 'en' | 'kk' | 'tr' = 'ru',
): string | null {
  if (typeof speedMps !== 'number' || !Number.isFinite(speedMps) || speedMps < 0) {
    return null;
  }
  const kmh = Math.round(speedMps * 3.6);
  const unit = {
    ru: 'км/ч',
    uz: 'km/soat',
    en: 'km/h',
    kk: 'км/сағ',
    tr: 'km/sa',
  }[lang];
  return `${kmh} ${unit}`;
}

export function accuracyMetersToPixels(
  accuracyMeters: number | null | undefined,
  lat: number,
  zoom: number,
): number {
  if (
    typeof accuracyMeters !== 'number' ||
    !Number.isFinite(accuracyMeters) ||
    accuracyMeters <= 0 ||
    !Number.isFinite(lat) ||
    !Number.isFinite(zoom)
  ) {
    return 0;
  }
  const clampedLat = clampMercatorLat(lat);
  const metersPerPixel =
    (156543.03392 * Math.cos((clampedLat * Math.PI) / 180)) /
    Math.pow(2, zoom);
  if (!Number.isFinite(metersPerPixel) || metersPerPixel <= 0) {
    return 0;
  }
  const px = accuracyMeters / metersPerPixel;
  return Math.min(400, Math.round(px * 10) / 10);
}

export function computeBayDisplayCode(stationId: string, bayNumber: number): string {
  const seed = `${stationId}#${bayNumber}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const codeNum = 1000 + ((hash >>> 0) % 9000);
  return String(codeNum);
}

export type VehiclePowertrain = 'ice_gbo_ready' | 'hybrid_petrol' | 'ev_only';

export interface VehicleFuelProfile {
  powertrain: VehiclePowertrain;
  supportedFuels: FuelCode[];
  recommendedFuel: FuelCode;
  supportsGas: boolean;
}

export const CAR_MODEL_SUGGESTIONS: string[] = [
  'Chevrolet Cobalt',
  'Chevrolet Lacetti',
  'Chevrolet Gentra',
  'Chevrolet Nexia 3',
  'Chevrolet Damas',
  'Chevrolet Spark',
  'Chevrolet Onix',
  'Chevrolet Malibu',
  'BYD Song Plus',
  'BYD Chazor',
  'BYD Atto 3',
  'Kia K5',
  'Tesla Model 3',
  'Zeekr 001',
];

export function getVehicleFuelProfile(carModel: string | null | undefined): VehicleFuelProfile {
  const raw = (carModel || '').trim().toLowerCase();
  if (!raw) {
    return {
      powertrain: 'ice_gbo_ready',
      supportedFuels: ['metan', 'propan', 'ai92', 'ai95'],
      recommendedFuel: 'metan',
      supportsGas: true,
    };
  }

  // Explicit gas retrofit marker overrides hybrid/petrol defaults
  const explicitGasMarker =
    raw.includes('гбо') ||
    raw.includes('gbo') ||
    raw.includes('cng') ||
    raw.includes('lpg') ||
    raw.includes('метан') ||
    raw.includes('metan') ||
    raw.includes('пропан') ||
    raw.includes('propan');

  if (explicitGasMarker) {
    return {
      powertrain: 'ice_gbo_ready',
      supportedFuels: ['metan', 'propan', 'ai92', 'ai95'],
      recommendedFuel: raw.includes('пропан') || raw.includes('propan') ? 'propan' : 'metan',
      supportsGas: true,
    };
  }

  // Pure electric vehicles (BEV)
  const evPatterns = [
    'tesla',
    'zeekr',
    'byd dolphin',
    'byd atto',
    'byd yuan',
    'byd seal',
    'byd seagull',
    'byd e2',
    'volkswagen id',
    'vw id',
    'id.3',
    'id.4',
    'id.6',
    'nissan leaf',
    'ioniq 5',
    'ioniq 6',
    'kia ev6',
    'kia ev9',
    'taycan',
    'bmw i3',
    'bmw i4',
    'bmw ix',
    'avatr',
    'hongqi e-hs9',
    'leapmotor',
    'электро',
    'electro',
  ];
  if (evPatterns.some((p) => raw.includes(p)) || /\bev\b/i.test(raw)) {
    return {
      powertrain: 'ev_only',
      supportedFuels: [],
      recommendedFuel: 'ai95',
      supportsGas: false,
    };
  }

  // Hybrids and modern petrol-only vehicles without GBO
  const hybridOrPetrolOnlyPatterns = [
    'byd song',
    'byd chazor',
    'byd destroyer',
    'byd han',
    'byd tang',
    'byd qin',
    'lixiang',
    'li auto',
    'li l7',
    'li l8',
    'li l9',
    'chery tiggo',
    'toyota prius',
    'camry hybrid',
    'corolla hybrid',
    'rav4 hybrid',
    'chevrolet equinox',
    'chevrolet malibu',
    'chevrolet tahoe',
    'chevrolet trailblazer',
    'chevrolet traverse',
    'kia k5',
    'kia k8',
    'kia sportage',
    'kia sorento',
    'hyundai sonata',
    'hyundai tucson',
    'hyundai santa fe',
    'hyundai elantra',
    'geely',
    'haval',
    'jetour',
    'changan',
    'hybrid',
    'гибрид',
  ];
  if (hybridOrPetrolOnlyPatterns.some((p) => raw.includes(p))) {
    return {
      powertrain: 'hybrid_petrol',
      supportedFuels: ['ai92', 'ai95'],
      recommendedFuel: 'ai95',
      supportsGas: false,
    };
  }

  // Popular mass-market UZ cars commonly run Metan / Propan / AI-92
  const classicUzGboPatterns = [
    'lacetti',
    'лачетти',
    'cobalt',
    'кобальт',
    'gentra',
    'джентра',
    'nexia',
    'нексия',
    'damas',
    'дамас',
    'labo',
    'spark',
    'спарк',
    'matiz',
    'матиз',
  ];
  if (classicUzGboPatterns.some((p) => raw.includes(p))) {
    return {
      powertrain: 'ice_gbo_ready',
      supportedFuels: ['metan', 'propan', 'ai92'],
      recommendedFuel: 'metan',
      supportsGas: true,
    };
  }

  return {
    powertrain: 'ice_gbo_ready',
    supportedFuels: ['metan', 'propan', 'ai92', 'ai95'],
    recommendedFuel: 'metan',
    supportsGas: true,
  };
}
