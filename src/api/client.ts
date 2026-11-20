import type {
  AccessRole,
  AssistantAction,
  CreatorDemoEvent,
  CreatorOverview,
  FuelCode,
  FuelStation,
  LatLngPoint,
  MelodyNote,
  MelodySynthPreset,
  MusicPreferences,
  PersonalCardStyle,
  PersonalCardTier,
  PersonalTrack,
  SessionPayload,
  StationOperationalStatus,
  StationQueueLevel,
} from '../types/dezagamiz';

const SESSION_KEY = 'dz_session_id';
const GUEST_TOKEN_KEY = 'dz_guest_token';

export function getStoredSessionId(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function setStoredSessionId(id: string | null): void {
  try {
    if (id) {
      window.localStorage.setItem(SESSION_KEY, id);
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function getOrCreateGuestDeviceToken(): string {
  try {
    const existing = window.localStorage.getItem(GUEST_TOKEN_KEY);
    if (existing && existing.length >= 8) {
      return existing;
    }
    const generated =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `gst-${crypto.randomUUID()}`
        : `gst-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(GUEST_TOKEN_KEY, generated);
    return generated;
  } catch {
    return `gst-fallback-${Date.now()}`;
  }
}

async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const sessionId = getStoredSessionId();
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (sessionId) {
    headers.set('x-session-id', sessionId);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Ошибка соединения с сервером');
  }
  return data as T;
}

export async function fetchSession(): Promise<SessionPayload> {
  return apiFetch<SessionPayload>('/api/session');
}

export async function registerAndBindCard(payload: {
  fullName: string;
  phone: string;
  carModel: string;
  plateNumber: string;
  preferredFuel: FuelCode;
  cardNumber: string;
  expiry: string;
  holderName: string;
  cvc: string;
}): Promise<SessionPayload & { sessionId?: string }> {
  const res = await apiFetch<SessionPayload & { sessionId?: string }>(
    '/api/auth/register-and-bind',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
  if (res.sessionId) {
    setStoredSessionId(res.sessionId);
  }
  return res;
}

export async function loginWithPhone(
  phone: string,
): Promise<SessionPayload & { sessionId?: string }> {
  const res = await apiFetch<SessionPayload & { sessionId?: string }>(
    '/api/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ phone }),
    },
  );
  if (res.sessionId) {
    setStoredSessionId(res.sessionId);
  }
  return res;
}

export async function autostartDemoSession(): Promise<
  SessionPayload & { sessionId?: string }
> {
  const res = await apiFetch<SessionPayload & { sessionId?: string }>(
    '/api/auth/autostart-demo',
    {
      method: 'POST',
    },
  );
  if (res.sessionId) {
    setStoredSessionId(res.sessionId);
  }
  return res;
}

export async function enterGuestMode(): Promise<
  SessionPayload & { sessionId?: string; guestDeviceToken?: string }
> {
  const deviceToken = getOrCreateGuestDeviceToken();
  const res = await apiFetch<
    SessionPayload & { sessionId?: string; guestDeviceToken?: string }
  >('/api/auth/guest', {
    method: 'POST',
    body: JSON.stringify({ deviceToken }),
  });
  if (res.sessionId) {
    setStoredSessionId(res.sessionId);
  }
  if (res.guestDeviceToken) {
    try {
      window.localStorage.setItem(GUEST_TOKEN_KEY, res.guestDeviceToken);
    } catch {
      // Ignore storage errors
    }
  }
  return res;
}

export async function logoutDriver(): Promise<void> {
  await apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
  setStoredSessionId(null);
}

export async function fetchStations(): Promise<FuelStation[]> {
  const res = await apiFetch<{ stations: FuelStation[] }>('/api/stations');
  return res.stations;
}

export async function fetchMapsConfig(): Promise<{ hasKey: boolean; apiKey: string }> {
  return apiFetch<{ hasKey: boolean; apiKey: string }>('/api/maps/config');
}

export async function fetchStationLocations(): Promise<{
  locations: Record<
    string,
    { lat: number; lng: number; placeId?: string; formattedAddress?: string }
  >;
  quotaExceeded: boolean;
}> {
  return apiFetch<{
    locations: Record<
      string,
      { lat: number; lng: number; placeId?: string; formattedAddress?: string }
    >;
    quotaExceeded: boolean;
  }>('/api/maps/station-locations');
}

export async function geocodeAddressQuery(query: string): Promise<{
  lat: number;
  lng: number;
  placeId?: string;
  formattedAddress?: string;
}> {
  return apiFetch<{
    lat: number;
    lng: number;
    placeId?: string;
    formattedAddress?: string;
  }>('/api/maps/geocode', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

export async function fetchServerDrivingRoute(payload: {
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  lang: string;
}): Promise<{
  path: Array<{ lat: number; lng: number }>;
  distanceMeters: number;
  durationMillis: number | null;
  steps: string[];
  fallback: boolean;
  quotaExceeded: boolean;
}> {
  return apiFetch<{
    path: Array<{ lat: number; lng: number }>;
    distanceMeters: number;
    durationMillis: number | null;
    steps: string[];
    fallback: boolean;
    quotaExceeded: boolean;
  }>('/api/maps/route', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface StreetViewMetadataResponse {
  available: boolean;
  panoId?: string;
  lat?: number;
  lng?: number;
  copyright?: string;
  date?: string;
  quotaExceeded: boolean;
}

export async function fetchStreetViewMetadata(payload: {
  lat: number;
  lng: number;
  radius?: number;
}): Promise<StreetViewMetadataResponse> {
  const params = new URLSearchParams({
    lat: String(payload.lat),
    lng: String(payload.lng),
    radius: String(payload.radius ?? 600),
  });
  return apiFetch<StreetViewMetadataResponse>(
    `/api/maps/streetview/metadata?${params.toString()}`,
  );
}

export function buildStreetViewImageProxyUrl(payload: {
  lat: number;
  lng: number;
  panoId?: string;
  heading: number;
  pitch: number;
  fov?: number;
}): string {
  const params = new URLSearchParams({
    lat: String(payload.lat),
    lng: String(payload.lng),
    heading: String(Math.round(payload.heading)),
    pitch: String(Math.round(payload.pitch)),
    fov: String(Math.round(payload.fov ?? 95)),
  });
  if (payload.panoId) {
    params.set('panoId', payload.panoId);
  }
  const sid = getStoredSessionId();
  if (sid) {
    params.set('sid', sid);
  }
  return `/api/maps/streetview/image?${params.toString()}`;
}

export async function addLinkedCard(payload: {
  cardNumber: string;
  expiry: string;
  holderName: string;
  cvc: string;
  makeDefault: boolean;
}): Promise<SessionPayload> {
  return apiFetch<SessionPayload>('/api/cards', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function setDefaultCard(cardId: string): Promise<SessionPayload> {
  return apiFetch<SessionPayload>(`/api/cards/${cardId}/default`, {
    method: 'PATCH',
  });
}

export async function deleteLinkedCard(cardId: string): Promise<SessionPayload> {
  return apiFetch<SessionPayload>(`/api/cards/${cardId}`, {
    method: 'DELETE',
  });
}

export async function issuePersonalCard(payload: {
  tier: PersonalCardTier;
  style: PersonalCardStyle;
  holderName: string;
  initialTopUpUzs: number;
}): Promise<SessionPayload> {
  return apiFetch<SessionPayload>('/api/personal-card/issue', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function topUpPersonalCard(
  amountUzs: number,
): Promise<SessionPayload> {
  return apiFetch<SessionPayload>('/api/personal-card/topup', {
    method: 'POST',
    body: JSON.stringify({ amountUzs }),
  });
}

export async function updatePersonalCardDesign(payload: {
  style?: PersonalCardStyle;
  tier?: PersonalCardTier;
}): Promise<SessionPayload> {
  return apiFetch<SessionPayload>('/api/personal-card/design', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function togglePersonalCardFreeze(
  isFrozen: boolean,
): Promise<SessionPayload> {
  return apiFetch<SessionPayload>('/api/personal-card/freeze', {
    method: 'PATCH',
    body: JSON.stringify({ isFrozen }),
  });
}

export async function updateDriverProfile(payload: {
  fullName?: string;
  carModel?: string;
  plateNumber?: string;
  preferredFuel?: FuelCode;
}): Promise<SessionPayload> {
  return apiFetch<SessionPayload>('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function addDriverVehicle(payload: {
  carModel: string;
  plateNumber: string;
  preferredFuel: FuelCode;
  makeDefault?: boolean;
}): Promise<SessionPayload> {
  return apiFetch<SessionPayload>('/api/vehicles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function setDefaultVehicle(
  vehicleId: string,
): Promise<SessionPayload> {
  return apiFetch<SessionPayload>(`/api/vehicles/${vehicleId}/default`, {
    method: 'PATCH',
  });
}

export async function deleteDriverVehicle(
  vehicleId: string,
): Promise<SessionPayload> {
  return apiFetch<SessionPayload>(`/api/vehicles/${vehicleId}`, {
    method: 'DELETE',
  });
}

export async function createFuelOrder(payload: {
  stationId: string;
  bayNumber: number;
  fuelCode: FuelCode;
  amountUzs: number;
  cardId: string;
  bayCode?: string;
}): Promise<SessionPayload> {
  return apiFetch<SessionPayload>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function advanceFuelOrder(
  orderId: string,
): Promise<SessionPayload> {
  return apiFetch<SessionPayload>(`/api/orders/${orderId}/advance`, {
    method: 'POST',
  });
}

export async function rateFuelOrder(
  orderId: string,
  rating: number,
): Promise<SessionPayload> {
  return apiFetch<SessionPayload>(`/api/orders/${orderId}/rate`, {
    method: 'POST',
    body: JSON.stringify({ rating }),
  });
}

export async function unlockCreatorSection(
  code: string,
  role: AccessRole = 'admin',
): Promise<SessionPayload & { sessionId?: string; overview: CreatorOverview }> {
  const res = await apiFetch<
    SessionPayload & { sessionId?: string; overview: CreatorOverview }
  >('/api/creator/unlock', {
    method: 'POST',
    body: JSON.stringify({ code, role }),
  });
  if (res.sessionId) {
    setStoredSessionId(res.sessionId);
  }
  return res;
}

export async function switchCreatorRole(
  role: AccessRole,
): Promise<SessionPayload> {
  return apiFetch<SessionPayload>('/api/creator/role', {
    method: 'POST',
    body: JSON.stringify({ role }),
  });
}

export async function lockCreatorSection(): Promise<SessionPayload> {
  return apiFetch<SessionPayload>('/api/creator/lock', {
    method: 'POST',
  });
}

export async function fetchCreatorOverview(): Promise<CreatorOverview> {
  return apiFetch<CreatorOverview>('/api/creator/overview');
}

export async function updateCreatorStation(
  stationId: string,
  data: {
    prices?: Partial<Record<FuelCode, number>>;
    bayAvailability?: Record<number, boolean>;
    operationalStatus?: StationOperationalStatus;
    queueLevel?: StationQueueLevel;
    estimatedWaitMinutes?: number;
    disabledFuels?: FuelCode[];
  },
): Promise<CreatorOverview> {
  return apiFetch<CreatorOverview>(`/api/creator/stations/${stationId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function recordCreatorEvent(data: {
  type: CreatorDemoEvent['type'];
  title: string;
  detail: string;
}): Promise<CreatorOverview> {
  return apiFetch<CreatorOverview>('/api/creator/events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function advanceCreatorOrder(
  orderId: string,
): Promise<CreatorOverview> {
  return apiFetch<CreatorOverview>(`/api/creator/orders/${orderId}/advance`, {
    method: 'POST',
  });
}

export interface PersonalMusicStateResponse {
  tracks: PersonalTrack[];
  preferences: MusicPreferences;
}

export async function fetchPersonalMusic(): Promise<PersonalMusicStateResponse> {
  return apiFetch<PersonalMusicStateResponse>('/api/music');
}

export async function saveCustomMelodyTrack(payload: {
  title: string;
  subtitle?: string;
  bpm: number;
  keySignature?: string;
  synthPreset: MelodySynthPreset;
  notes: MelodyNote[];
  setAsFuelingChime?: boolean;
}): Promise<PersonalMusicStateResponse & { track: PersonalTrack }> {
  return apiFetch<PersonalMusicStateResponse & { track: PersonalTrack }>(
    '/api/music/melody',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function uploadPersonalAudioTrack(payload: {
  title: string;
  mimeType: string;
  base64Data: string;
  durationSeconds?: number;
}): Promise<PersonalMusicStateResponse & { track: PersonalTrack }> {
  return apiFetch<PersonalMusicStateResponse & { track: PersonalTrack }>(
    '/api/music/upload',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export async function updatePersonalMusicPrefs(
  payload: Partial<MusicPreferences>,
): Promise<PersonalMusicStateResponse> {
  return apiFetch<PersonalMusicStateResponse>('/api/music/preferences', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deletePersonalMusicTrack(
  trackId: string,
): Promise<PersonalMusicStateResponse> {
  return apiFetch<PersonalMusicStateResponse>(`/api/music/${trackId}`, {
    method: 'DELETE',
  });
}

export async function sendAssistantChatMessage(payload: {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; text: string }>;
  context: {
    selectedStationId?: string;
    driverLocation?: LatLngPoint | null;
    lang?: string;
  };
}): Promise<{
  reply: string;
  actions: AssistantAction[];
  music: PersonalMusicStateResponse;
}> {
  return apiFetch<{
    reply: string;
    actions: AssistantAction[];
    music: PersonalMusicStateResponse;
  }>('/api/assistant/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function composeMelodyWithAi(payload: {
  prompt: string;
  bpm: number;
  synthPreset: MelodySynthPreset;
  lang?: string;
  setAsFuelingChime?: boolean;
}): Promise<PersonalMusicStateResponse & { track: PersonalTrack }> {
  return apiFetch<PersonalMusicStateResponse & { track: PersonalTrack }>(
    '/api/assistant/compose-melody',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}
