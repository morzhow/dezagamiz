export type CardNetwork = 'Uzcard' | 'Humo' | 'Visa' | 'Mastercard' | 'dezagamiz';

export type PersonalCardTier = 'standard' | 'prime';

export type PersonalCardStyle = 'cobalt' | 'arctic' | 'night';

export interface DezagamizPersonalCard {
  id: string;
  cardNumber: string;
  maskedNumber: string;
  last4: string;
  holderName: string;
  expiry: string;
  tier: PersonalCardTier;
  style: PersonalCardStyle;
  balanceUzs: number;
  bonusUzs: number;
  cashbackRate: number;
  isFrozen: boolean;
  carModel: string;
  plateNumber: string;
  issuedAt: string;
}

export type FuelCode = 'metan' | 'propan' | 'ai92' | 'ai95';

export type OrderStage =
  | 'paid'
  | 'attendant_approaching'
  | 'fueling'
  | 'completed';

export type AppView =
  | 'fuel'
  | 'stations'
  | 'assistant'
  | 'showcase'
  | 'history'
  | 'profile'
  | 'creator';

export type AccessRole = 'admin' | 'driver';

export type StationCity = 'Ташкент' | 'Самарканд' | 'Бухара' | 'Фергана';

export type StationCityFilter = 'all' | StationCity;

export type LocationSourceMode = 'gps' | 'city' | 'custom';

export type GeoPermissionState =
  | 'unknown'
  | 'prompt'
  | 'granted'
  | 'denied'
  | 'unsupported';

export interface LinkedCard {
  id: string;
  network: CardNetwork;
  maskedNumber: string;
  last4: string;
  expiry: string;
  holderName: string;
  isDefault: boolean;
  addedAt: string;
}

export interface DriverVehicle {
  id: string;
  carModel: string;
  plateNumber: string;
  preferredFuel: FuelCode;
  isDefault: boolean;
  addedAt: string;
}

export interface DriverUser {
  id: string;
  fullName: string;
  phone: string;
  carModel: string;
  plateNumber: string;
  preferredFuel: FuelCode;
  vehicles?: DriverVehicle[];
  isRegistered: boolean;
  cards: LinkedCard[];
  personalCard?: DezagamizPersonalCard | null;
  createdAt: string;
}

export interface AttendantInfo {
  id: string;
  name: string;
  experienceYears: number;
  rating: number;
  shiftBadge: string;
}

export interface StationBay {
  number: number;
  available: boolean;
  supportedFuels: FuelCode[];
}

export type NearbyPlaceCategory = 'all' | 'gas_station' | 'cafe' | 'store' | 'service' | 'other';

export interface LatLngPoint {
  lat: number;
  lng: number;
  label?: string;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  isLive?: boolean;
  updatedAt?: number;
}

export interface NearbyPlaceItem {
  id: string;
  name: string;
  address: string;
  category: Exclude<NearbyPlaceCategory, 'all'>;
  primaryTypeLabel: string;
  lat: number;
  lng: number;
  distanceKm: number;
  googleMapsURI?: string;
}

export interface FuelStation {
  id: string;
  name: string;
  city: 'Ташкент' | 'Самарканд' | 'Бухара' | 'Фергана';
  address: string;
  geocodeQuery: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  formattedAddress?: string;
  distanceKm: number;
  isOpen24h: boolean;
  prices: Partial<Record<FuelCode, number>>;
  bays: StationBay[];
  attendants: AttendantInfo[];
}

export interface RankedStation extends FuelStation {
  straightDistanceKm: number | null;
  supportsSelectedFuel: boolean;
  hasAvailableBayForFuel: boolean;
  freeBaysForFuel: number;
}

export interface FuelOrder {
  id: string;
  receiptCode: string;
  userId: string;
  stationId: string;
  stationName: string;
  stationAddress: string;
  city: string;
  bayNumber: number;
  fuelCode: FuelCode;
  fuelLabel: string;
  unit: 'м³' | 'л';
  pricePerUnit: number;
  amountUzs: number;
  targetVolume: number;
  dispensedVolume: number;
  cardId: string;
  cardMasked: string;
  cardNetwork: CardNetwork;
  cashbackUzs?: number;
  carModel: string;
  plateNumber: string;
  attendant: AttendantInfo;
  stage: OrderStage;
  etaSeconds: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface GuestRecord {
  id: string;
  deviceToken: string;
  startedAt: string;
  expiresAt: string;
  userId: string;
}

export interface SessionPayload {
  authenticated: boolean;
  isCreator: boolean;
  creatorRole: AccessRole | null;
  isGuest: boolean;
  guestExpiresAt: string | null;
  guestExpired?: boolean;
  user: DriverUser | null;
  activeOrder: FuelOrder | null;
  orders: FuelOrder[];
}

export interface CreatorDriverSummary {
  id: string;
  fullName: string;
  phone: string;
  carModel: string;
  plateNumber: string;
  preferredFuel: FuelCode;
  cardsCount: number;
  primaryCardMasked: string;
  createdAt: string;
}

export interface CreatorOverview {
  stats: {
    totalDrivers: number;
    totalOrders: number;
    activeOrdersCount: number;
    totalRevenueUzs: number;
    totalGasM3: number;
  };
  drivers: CreatorDriverSummary[];
  orders: FuelOrder[];
  stations: FuelStation[];
}

export type MelodySynthPreset =
  | 'rhodes'
  | 'warm_pad'
  | 'pluck'
  | 'chime'
  | 'bass_groove';

export interface MelodyNote {
  freqHz: number;
  offsetBeats: number;
  durationBeats: number;
  velocity?: number;
}

export interface PersonalTrack {
  id: string;
  title: string;
  subtitle: string;
  kind: 'melody' | 'audio';
  source: 'preset' | 'gemini' | 'custom' | 'upload';
  bpm?: number;
  keySignature?: string;
  synthPreset?: MelodySynthPreset;
  notes?: MelodyNote[];
  durationSeconds: number;
  audioUrl?: string;
  mimeType?: string;
  createdAt: string;
}

export interface MusicPreferences {
  activeTrackId: string | null;
  fuelingChimeTrackId: string | null;
  autoPlayOnFueling: boolean;
  volume: number;
}

export type AssistantAction =
  | {
      type: 'select_station';
      stationId: string;
      stationName?: string;
      fuelCode?: FuelCode;
      navigateTo?: 'fuel' | 'stations';
    }
  | {
      type: 'navigate';
      view: AppView;
      autoNavigate?: boolean;
      label?: string;
    }
  | {
      type: 'app_control';
      theme?: 'light' | 'dark' | 'toggle';
      language?: 'ru' | 'uz' | 'en' | 'kk' | 'tr';
      liveGps?: 'on' | 'off';
    }
  | {
      type: 'melody_created';
      track: PersonalTrack;
      setAsFuelingChime?: boolean;
    }
  | {
      type: 'music_control';
      action: 'play' | 'pause' | 'next' | 'play_station_alert';
    };

export interface AssistantChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  actions?: AssistantAction[];
}
