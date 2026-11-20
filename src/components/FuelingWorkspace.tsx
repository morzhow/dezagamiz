import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CarFront,
  Check,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Crosshair,
  ExternalLink,
  Fuel,
  Headphones,
  HelpCircle,
  KeyRound,
  Map as MapIcon,
  MapPin,
  Pause,
  Play,
  QrCode,
  Radio,
  Route as RouteIcon,
  ShieldCheck,
  SkipForward,
} from 'lucide-react';
import { createFuelOrder, setDefaultVehicle } from '../api/client';
import { useMusicPlayer } from '../lib/musicContext';
import {
  buildGoogleMapsDirectionsUrl,
  calculateFuelVolume,
  calculatePersonalCardCashback,
  computeBayDisplayCode,
  filterStationsByCity,
  formatCoordinates,
  formatLocationAge,
  formatRouteDuration,
  formatSpeedKmh,
  getDriverVehicles,
  getEffectiveQueueLevel,
  getVehicleFuelProfile,
  isFuelEnabledOnStation,
  PERSONAL_CARD_CASHBACK_RATE,
  rankStationsWithMode,
  STATION_CITIES,
} from '../lib/dezagamiz';
import { useI18n } from '../lib/i18n';
import type {
  DriverUser,
  FuelCode,
  FuelOrder,
  FuelStation,
  GeoPermissionState,
  LatLngPoint,
  LocationSourceMode,
  SessionPayload,
  StationCityFilter,
  StationSortMode,
} from '../types/dezagamiz';
import { LiveFuelingTracker } from './LiveFuelingTracker';
import heroStationImg from '../assets/images/hero_station_uzbekistan_1794645013755.jpg';
import {
  StationsMapView,
  type ComputedRouteInfo,
} from './StationsMapView';

interface FuelingWorkspaceProps {
  user: DriverUser;
  stations: FuelStation[];
  selectedStationId: string;
  onSelectStationId: (id: string) => void;
  activeOrder: FuelOrder | null;
  onUpdateSession: (payload: SessionPayload) => void;
  onGoToCards: () => void;
  mapsApiKey?: string;
  driverLocation?: LatLngPoint | null;
  locationMode?: LocationSourceMode;
  selectedCity?: StationCityFilter;
  geoPermission?: GeoPermissionState;
  locatingGps?: boolean;
  liveGpsActive?: boolean;
  gpsError?: string | null;
  onToggleLiveGps?: (enable?: boolean) => void;
  onSelectCity?: (city: StationCityFilter) => void;
  onStationsResolved?: (
    resolved: Record<
      string,
      {
        lat: number;
        lng: number;
        placeId?: string;
        formattedAddress?: string;
      }
    >,
  ) => void;
  onOriginSelected?: (point: LatLngPoint) => void;
  onQuotaExceeded?: () => void;
  showRouteMap?: boolean;
  onToggleRouteMap?: (show: boolean) => void;
  requestedFuel?: FuelCode | null;
  onClearRequestedFuel?: () => void;
  onOpenStationsMap?: (fuelCode?: FuelCode) => void;
  onOpenAssistant?: () => void;
}

const AMOUNT_PRESETS = [50000, 100000, 150000, 200000];
const NOOP = () => {};

export function FuelingWorkspace({
  user,
  stations,
  selectedStationId,
  onSelectStationId,
  activeOrder,
  onUpdateSession,
  onGoToCards,
  mapsApiKey = '',
  driverLocation = null,
  locationMode = 'city',
  selectedCity = 'all',
  geoPermission = 'unknown',
  locatingGps = false,
  liveGpsActive = false,
  gpsError = null,
  onToggleLiveGps,
  onSelectCity,
  onStationsResolved,
  onOriginSelected,
  onQuotaExceeded,
  showRouteMap = false,
  onToggleRouteMap,
  requestedFuel = null,
  onClearRequestedFuel,
  onOpenStationsMap,
  onOpenAssistant,
}: FuelingWorkspaceProps) {
  const {
    t,
    lang,
    fuelShortLabel,
    fuelUnit,
    formatMoney,
    localizeCity,
    localizeStationName,
    localizeStationAddress,
    localizePersonName,
    localizeCarModel,
    localizeTrack,
  } = useI18n();
  const {
    activeTrack,
    isPlaying,
    togglePlay,
    playNext,
  } = useMusicPlayer();
  const station =
    stations.find((s) => s.id === selectedStationId) || stations[0];
  const vehicles = useMemo(() => getDriverVehicles(user), [user]);
  const activeVehicle = vehicles.find((v) => v.isDefault) || vehicles[0];
  const activeCarModel = activeVehicle?.carModel || user.carModel;
  const vehicleFuelProfile = useMemo(
    () => getVehicleFuelProfile(activeCarModel),
    [activeCarModel],
  );

  const pickCompatibleFuel = useCallback(
    (desired: FuelCode, st: FuelStation | undefined): FuelCode => {
      if (!vehicleFuelProfile.supportsGas && (desired === 'metan' || desired === 'propan')) {
        if (st?.prices.ai95) return 'ai95';
        if (st?.prices.ai92) return 'ai92';
        return vehicleFuelProfile.recommendedFuel;
      }
      if (
        vehicleFuelProfile.supportedFuels.length > 0 &&
        !vehicleFuelProfile.supportedFuels.includes(desired)
      ) {
        const matchOnStation = vehicleFuelProfile.supportedFuels.find(
          (code) => Boolean(st?.prices[code]),
        );
        if (matchOnStation) return matchOnStation;
        return vehicleFuelProfile.recommendedFuel;
      }
      if (st && !st.prices[desired]) {
        const fallback = (['ai95', 'ai92', 'metan', 'propan'] as FuelCode[]).find(
          (c) =>
            Boolean(st.prices[c]) &&
            (vehicleFuelProfile.supportsGas || (c !== 'metan' && c !== 'propan')),
        );
        if (fallback) return fallback;
      }
      return desired;
    },
    [vehicleFuelProfile],
  );

  const initialDesiredFuel: FuelCode = pickCompatibleFuel(
    requestedFuel || activeVehicle?.preferredFuel || user.preferredFuel || 'metan',
    station,
  );

  const [bayNumber, setBayNumber] = useState<number>(() => {
    const preferredOpen = station?.bays.find(
      (b) => b.available && b.supportedFuels.includes(initialDesiredFuel),
    );
    const firstOpen = station?.bays.find((b) => b.available);
    return preferredOpen
      ? preferredOpen.number
      : firstOpen
        ? firstOpen.number
        : 1;
  });
  const [fuelCode, setFuelCode] = useState<FuelCode>(initialDesiredFuel);
  const [carFuelWarning, setCarFuelWarning] = useState<string | null>(() =>
    vehicleFuelProfile.powertrain === 'ev_only' ? t.carEvOnlyWarn : null,
  );
  const [carAutoAdjustedNote, setCarAutoAdjustedNote] = useState(false);
  const [bayCodeInput, setBayCodeInput] = useState('');
  const [qrScanning, setQrScanning] = useState(false);
  const qrTimerRef = useRef<number | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [amountUzs, setAmountUzs] = useState<number>(100000);
  const [selectedCardId, setSelectedCardId] = useState<string>(
    user.cards.find((c) => c.isDefault)?.id || user.cards[0]?.id || '',
  );
  const [switchingVehicle, setSwitchingVehicle] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justCompletedOrderId, setJustCompletedOrderId] = useState<string | null>(
    null,
  );
  const [lastCompletedOrder, setLastCompletedOrder] = useState<FuelOrder | null>(
    null,
  );
  const [localShowMap, setLocalShowMap] = useState(false);
  const [sortMode, setSortMode] = useState<StationSortMode>('best_nearby');
  const [computedRoute, setComputedRoute] = useState<ComputedRouteInfo | null>(
    null,
  );
  const [routeLoading, setRouteLoading] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!driverLocation?.isLive) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [driverLocation?.isLive, driverLocation?.updatedAt]);

  const handleChooseAndRefuelFromMap = useCallback(
    (id: string) => onSelectStationId(id),
    [onSelectStationId],
  );

  const isMapOpen = onToggleRouteMap ? showRouteMap : localShowMap;
  const setIsMapOpen = onToggleRouteMap || setLocalShowMap;

  const cityScopedStations = useMemo(
    () => filterStationsByCity(stations, selectedCity),
    [stations, selectedCity],
  );

  const rankedStationsForMap = useMemo(
    () =>
      rankStationsWithMode(
        driverLocation,
        cityScopedStations,
        fuelCode,
        sortMode,
        activeCarModel,
      ),
    [driverLocation, cityScopedStations, fuelCode, sortMode, activeCarModel],
  );

  const topNearestStations = useMemo(
    () => rankedStationsForMap.slice(0, 3),
    [rankedStationsForMap],
  );

  // Sync card selection if user added/changed default card or personal card
  useEffect(() => {
    const matchesLinked = user.cards.some((c) => c.id === selectedCardId);
    const matchesPersonal =
      Boolean(user.personalCard) && user.personalCard?.id === selectedCardId;
    if (!matchesLinked && !matchesPersonal) {
      const def = user.cards.find((c) => c.isDefault) || user.cards[0];
      if (def) setSelectedCardId(def.id);
    }
  }, [user.cards, user.personalCard, selectedCardId]);

  // Clear bay verification input when station or bay changes
  useEffect(() => {
    setBayCodeInput('');
    setQrScanning(false);
    if (qrTimerRef.current !== null) {
      window.clearTimeout(qrTimerRef.current);
      qrTimerRef.current = null;
    }
  }, [station?.id, bayNumber]);

  useEffect(() => {
    return () => {
      if (qrTimerRef.current !== null) {
        window.clearTimeout(qrTimerRef.current);
      }
    };
  }, []);

  // Sync fuel compatibility whenever active car model changes
  useEffect(() => {
    if (vehicleFuelProfile.powertrain === 'ev_only') {
      setCarFuelWarning(t.carEvOnlyWarn);
      setCarAutoAdjustedNote(false);
      return;
    }
    if (
      !vehicleFuelProfile.supportsGas &&
      (fuelCode === 'metan' || fuelCode === 'propan')
    ) {
      const nextFuel = pickCompatibleFuel(fuelCode, station);
      setFuelCode(nextFuel);
      setCarAutoAdjustedNote(true);
      setCarFuelWarning(null);
      return;
    }
    setCarFuelWarning(null);
  }, [
    activeCarModel,
    vehicleFuelProfile.powertrain,
    vehicleFuelProfile.supportsGas,
    fuelCode,
    station,
    pickCompatibleFuel,
    t.carEvOnlyWarn,
  ]);

  // Honor requestedFuel passed from StationsDirectory
  useEffect(() => {
    if (!requestedFuel || !station) return;
    if (!vehicleFuelProfile.supportsGas && (requestedFuel === 'metan' || requestedFuel === 'propan')) {
      setCarFuelWarning(
        vehicleFuelProfile.powertrain === 'ev_only'
          ? t.carEvOnlyWarn
          : t.carNoGboHybridWarn,
      );
      const safeFuel = pickCompatibleFuel(requestedFuel, station);
      setFuelCode(safeFuel);
      onClearRequestedFuel?.();
      return;
    }
    const matchingBay =
      station.bays.find(
        (b) => b.available && b.supportedFuels.includes(requestedFuel),
      ) ||
      station.bays.find((b) => b.supportedFuels.includes(requestedFuel));
    if (matchingBay) {
      setBayNumber(matchingBay.number);
    }
    if (station.prices[requestedFuel]) {
      setFuelCode(requestedFuel);
    }
    onClearRequestedFuel?.();
  }, [
    requestedFuel,
    station,
    onClearRequestedFuel,
    vehicleFuelProfile.supportsGas,
    vehicleFuelProfile.powertrain,
    pickCompatibleFuel,
    t.carEvOnlyWarn,
    t.carNoGboHybridWarn,
  ]);

  // Sync valid bay & fuel when station changes (prefer compatible fuel)
  useEffect(() => {
    if (!station) return;
    const currentBay = station.bays.find((b) => b.number === bayNumber);
    const chosenBay =
      currentBay &&
      currentBay.available &&
      (currentBay.supportedFuels.includes(fuelCode) || !station.prices[fuelCode])
        ? currentBay
        : station.bays.find(
            (b) => b.available && b.supportedFuels.includes(fuelCode),
          ) ||
          station.bays.find((b) => b.available) ||
          station.bays[0];
    if (chosenBay && chosenBay.number !== bayNumber) {
      setBayNumber(chosenBay.number);
    }
    if (chosenBay && !chosenBay.supportedFuels.includes(fuelCode)) {
      const compatibleOnBay =
        chosenBay.supportedFuels.find(
          (c) =>
            vehicleFuelProfile.supportsGas || (c !== 'metan' && c !== 'propan'),
        ) || chosenBay.supportedFuels[0];
      setFuelCode(compatibleOnBay);
    }
  }, [station, bayNumber, fuelCode, vehicleFuelProfile.supportsGas]);

  async function handleSwitchVehicle(vehicleId: string) {
    setSwitchingVehicle(true);
    setCarFuelWarning(null);
    setCarAutoAdjustedNote(false);
    try {
      const payload = await setDefaultVehicle(vehicleId);
      onUpdateSession(payload);
      const nextVehicles = payload.user ? getDriverVehicles(payload.user) : [];
      const chosen = nextVehicles.find((v) => v.id === vehicleId);
      if (chosen) {
        const nextProfile = getVehicleFuelProfile(chosen.carModel);
        const targetFuel =
          !nextProfile.supportsGas &&
          (chosen.preferredFuel === 'metan' || chosen.preferredFuel === 'propan')
            ? nextProfile.recommendedFuel
            : chosen.preferredFuel;
        if (nextProfile.powertrain === 'ev_only') {
          setCarFuelWarning(t.carEvOnlyWarn);
        } else if (targetFuel !== chosen.preferredFuel) {
          setCarAutoAdjustedNote(true);
        }
        if (station?.prices[targetFuel]) {
          const bay = station.bays.find(
            (b) => b.available && b.supportedFuels.includes(targetFuel),
          );
          if (bay) {
            setBayNumber(bay.number);
            setFuelCode(targetFuel);
          }
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.errSwitchCarFailed,
      );
    } finally {
      setSwitchingVehicle(false);
    }
  }

  // Keep showing just-completed tracker until driver clicks "Новая заправка"
  const displayedOrder =
    activeOrder ||
    (justCompletedOrderId && lastCompletedOrder?.id === justCompletedOrderId
      ? lastCompletedOrder
      : null);

  function handleSessionUpdate(payload: SessionPayload) {
    if (
      displayedOrder &&
      !payload.activeOrder &&
      payload.orders.length > 0
    ) {
      const finished = payload.orders.find((o) => o.id === displayedOrder.id);
      if (finished && finished.stage === 'completed') {
        setJustCompletedOrderId(finished.id);
        setLastCompletedOrder(finished);
      }
    }
    onUpdateSession(payload);
  }

  if (displayedOrder) {
    return (
      <LiveFuelingTracker
        order={displayedOrder}
        onUpdateSession={handleSessionUpdate}
        onStartNewOrder={() => {
          setJustCompletedOrderId(null);
          setLastCompletedOrder(null);
        }}
      />
    );
  }

  if (!station) {
    return null;
  }

  const currentBay =
    station.bays.find((b) => b.number === bayNumber) || station.bays[0];
  const expectedBayCode = computeBayDisplayCode(station.id, currentBay.number);
  const isBayVerified = bayCodeInput.trim() === expectedBayCode;
  const pricePerUnit = station.prices[fuelCode] || 0;
  const estimatedVolume = calculateFuelVolume(amountUzs, pricePerUnit);
  const personalCard = user.personalCard || null;
  const isPayingWithPersonalCard = Boolean(
    personalCard && selectedCardId === personalCard.id,
  );
  const activeCard = isPayingWithPersonalCard
    ? null
    : user.cards.find((c) => c.id === selectedCardId) ||
      user.cards.find((c) => c.isDefault) ||
      user.cards[0];

  const personalCardCashbackPct = personalCard
    ? Math.round((PERSONAL_CARD_CASHBACK_RATE[personalCard.tier] ?? 0.03) * 100)
    : 0;
  const estimatedCashbackUzs =
    isPayingWithPersonalCard && personalCard
      ? calculatePersonalCardCashback(amountUzs, personalCard.tier)
      : 0;

  function handleSelectFuelWithCarGuard(code: FuelCode) {
    setError(null);
    setCarAutoAdjustedNote(false);
    if (vehicleFuelProfile.powertrain === 'ev_only') {
      setCarFuelWarning(t.carEvOnlyWarn);
      return;
    }
    if (!vehicleFuelProfile.supportsGas && (code === 'metan' || code === 'propan')) {
      setCarFuelWarning(t.carNoGboHybridWarn);
      const safeFuel = pickCompatibleFuel(code, station);
      setFuelCode(safeFuel);
      return;
    }
    setCarFuelWarning(null);
    setFuelCode(code);
  }

  function handleStartQrScan() {
    setError(null);
    setQrScanning(true);
    if (qrTimerRef.current !== null) {
      window.clearTimeout(qrTimerRef.current);
    }
    qrTimerRef.current = window.setTimeout(() => {
      setBayCodeInput(expectedBayCode);
      setQrScanning(false);
      qrTimerRef.current = null;
    }, 650);
  }

  async function handlePayFromCar() {
    setError(null);
    if (vehicleFuelProfile.powertrain === 'ev_only') {
      setError(t.carEvOnlyWarn);
      return;
    }
    if (
      !vehicleFuelProfile.supportsGas &&
      (fuelCode === 'metan' || fuelCode === 'propan')
    ) {
      setError(t.carNoGboHybridWarn);
      return;
    }
    if (!currentBay?.available) {
      setError(t.errSelectFreeBay);
      return;
    }
    if (!isBayVerified) {
      setError(t.errBayCodeMismatch);
      return;
    }
    if (!pricePerUnit) {
      setError(t.errFuelNotOnBay);
      return;
    }
    if (!Number.isFinite(amountUzs) || amountUzs < 10000) {
      setError(t.errMinFuelAmount);
      return;
    }
    if (isPayingWithPersonalCard && personalCard) {
      if (personalCard.isFrozen) {
        setError(t.errPersonalCardFrozen);
        return;
      }
      if (personalCard.balanceUzs < amountUzs) {
        setError(t.errPersonalCardLowFunds);
        return;
      }
    } else if (!activeCard) {
      setError(t.errBindCardToPay);
      return;
    }

    setSubmitting(true);
    try {
      const payload = await createFuelOrder({
        stationId: station.id,
        bayNumber: currentBay.number,
        fuelCode,
        amountUzs,
        cardId:
          isPayingWithPersonalCard && personalCard
            ? personalCard.id
            : activeCard!.id,
        bayCode: bayCodeInput.trim(),
      });
      if (payload.activeOrder) {
        setJustCompletedOrderId(payload.activeOrder.id);
      }
      onUpdateSession(payload);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t.errPaymentFailed,
      );
    } finally {
      setSubmitting(false);
    }
  }

  const routeDistanceKm =
    computedRoute &&
    computedRoute.stationId === station.id &&
    computedRoute.distanceMeters > 0
      ? Math.round((computedRoute.distanceMeters / 1000) * 10) / 10
      : null;

  const hasValidStationCoords =
    typeof station.lat === 'number' && typeof station.lng === 'number';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Left 8 cols: In-car refueling order builder */}
      <section className="dz-section-enter min-w-0 rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5 shadow-[var(--dz-shadow-card)] sm:p-7 lg:col-span-8">
        <div className="flex flex-col gap-3 border-b border-[var(--dz-border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-bold text-[var(--dz-ink)]">
              {t.fuelTitle}
            </h1>
            <p className="mt-1 text-sm text-[var(--dz-ink-secondary)]">
              {t.fuelSubtitle}
            </p>
          </div>
          <div className="min-w-0 shrink-0 rounded-xl bg-[var(--dz-surface-subtle)] px-3.5 py-2 sm:text-right">
            <div className="text-[11px] font-medium text-[var(--dz-ink-muted)]">
              {t.yourCar}
            </div>
            {vehicles.length > 1 ? (
              <select
                aria-label={t.yourCar}
                data-testid="workspace-vehicle-select"
                value={activeVehicle?.id || ''}
                disabled={switchingVehicle}
                onChange={(e) => void handleSwitchVehicle(e.target.value)}
                className="dz-focus mt-0.5 w-full max-w-full sm:max-w-[230px] rounded-lg border border-[var(--dz-border)] bg-[var(--dz-surface)] px-2.5 py-1 font-mono-tabular text-xs font-bold text-[var(--dz-ink)]"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {localizeCarModel(v.carModel)} · {v.plateNumber}
                  </option>
                ))}
              </select>
            ) : (
              <div
                data-testid="workspace-active-car"
                className="font-mono-tabular text-sm font-bold text-[var(--dz-ink)] sm:whitespace-nowrap"
              >
                {localizeCarModel(user.carModel)} · {user.plateNumber}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="dz-feedback-enter mt-5 rounded-xl border border-[#F5C2C2] dark:border-[#7A2830] bg-[var(--dz-danger-bg)] px-4 py-3 text-sm font-medium text-[var(--dz-danger)]"
          >
            {error}
          </div>
        )}

        {/* 1. Unified Compact Block: City, GPS, Nearest Stations & Station Picker */}
        <div
          data-testid="fuel-location-city-bar"
          className="mt-4 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-bg)]/50 p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-[var(--dz-ink)]">
              <MapPin className="h-4 w-4 shrink-0 text-[var(--dz-primary)]" aria-hidden="true" />
              <span className="truncate">{t.compactLocationTitle}</span>
              {geoPermission === 'granted' && driverLocation?.isLive && (
                <span className="rounded-md bg-[#E9F7EF] dark:bg-[#0D2B22] px-2 py-0.5 text-[10px] font-bold text-[#0A7E42] dark:text-[#34D399]">
                  LIVE{typeof driverLocation.accuracy === 'number' ? ` ±${driverLocation.accuracy}${t.meterUnit}` : ''}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <div
                role="group"
                aria-label={t.sortBestNearbyLabel}
                className="flex items-center gap-0.5 rounded-lg border border-[var(--dz-border)] bg-[var(--dz-surface)] p-0.5"
              >
                <button
                  type="button"
                  data-testid="fuel-sort-best_nearby"
                  onClick={() => setSortMode('best_nearby')}
                  className={`dz-focus rounded-md px-2 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                    sortMode === 'best_nearby'
                      ? 'bg-[var(--dz-primary)] text-white'
                      : 'text-[var(--dz-ink-secondary)] hover:text-[var(--dz-ink)]'
                  }`}
                >
                  {t.sortBestNearbyLabel}
                </button>
                <button
                  type="button"
                  data-testid="fuel-sort-nearest"
                  onClick={() => setSortMode('nearest')}
                  className={`dz-focus rounded-md px-2 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                    sortMode === 'nearest'
                      ? 'bg-[var(--dz-primary)] text-white'
                      : 'text-[var(--dz-ink-secondary)] hover:text-[var(--dz-ink)]'
                  }`}
                >
                  {t.sortNearestLabel}
                </button>
              </div>

              {onToggleLiveGps && (
                <button
                  type="button"
                  data-testid="fuel-live-gps-btn"
                  onClick={() => onToggleLiveGps()}
                  className={`dz-focus inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                    liveGpsActive
                      ? 'dz-dark-active-glow border-[#0A7E42] dark:border-[#1E6B50] bg-[#E9F7EF] dark:bg-[#0D2B22] text-[#0A7E42] dark:text-[#34D399]'
                      : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)] hover:border-[var(--dz-primary)]'
                  }`}
                >
                  {liveGpsActive ? (
                    <Radio key="gps-on" className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Crosshair key="gps-off" className="h-3 w-3 text-[var(--dz-primary)]" aria-hidden="true" />
                  )}
                  <span>{locatingGps ? t.locatingGps : liveGpsActive ? t.stopLiveGps : t.liveGpsOn}</span>
                </button>
              )}

              <button
                type="button"
                data-testid="toggle-fuel-route-map"
                onClick={() => setIsMapOpen(!isMapOpen)}
                className={`dz-focus inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                  isMapOpen
                    ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white'
                    : 'border-[var(--dz-primary)]/30 bg-[var(--dz-surface)] text-[var(--dz-primary)] hover:bg-[var(--dz-surface-tint)]'
                }`}
              >
                <MapIcon className="h-3 w-3" aria-hidden="true" />
                <span>{isMapOpen ? t.hideRouteMapBtn : t.showRouteMapBtn}</span>
              </button>

              {onOpenStationsMap && (
                <button
                  type="button"
                  onClick={() => onOpenStationsMap(fuelCode)}
                  className="dz-focus rounded-lg border border-[var(--dz-border)] bg-[var(--dz-surface)] px-2.5 py-1.5 text-[11px] font-semibold text-[var(--dz-ink-secondary)] hover:border-[var(--dz-primary)] hover:text-[var(--dz-primary)]"
                >
                  {t.findNearestOnMapBtn}
                </button>
              )}
            </div>
          </div>

          {gpsError && (
            <div className="dz-feedback-enter rounded-xl border border-[#F5D6A7] dark:border-amber-800 bg-[#FFFBEB] dark:bg-amber-950/70 px-3.5 py-2 text-xs font-medium text-[#92400E] dark:text-amber-200">
              {gpsError}
            </div>
          )}

          {/* City filter + full station selector combined cleanly */}
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-12 lg:items-center">
            {onSelectCity && (
              <div className="flex flex-wrap items-center gap-1.5 lg:col-span-7">
                <button
                  type="button"
                  data-testid="fuel-city-all"
                  onClick={() => onSelectCity('all')}
                  className={`dz-focus rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    locationMode !== 'gps' && selectedCity === 'all'
                      ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white'
                      : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink-secondary)] hover:border-[var(--dz-primary)] hover:text-[var(--dz-ink)]'
                  }`}
                >
                  {t.allCities}
                </button>
                {STATION_CITIES.map((city) => {
                  const active = locationMode !== 'gps' && selectedCity === city;
                  return (
                    <button
                      key={city}
                      type="button"
                      data-testid={`fuel-city-${city}`}
                      onClick={() => onSelectCity(city)}
                      className={`dz-focus rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                        active
                          ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white'
                          : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink-secondary)] hover:border-[var(--dz-primary)] hover:text-[var(--dz-ink)]'
                      }`}
                    >
                      {localizeCity(city)}
                    </button>
                  );
                })}
              </div>
            )}

            <div className={onSelectCity ? 'lg:col-span-5' : 'lg:col-span-12'}>
              <select
                id="station-select"
                aria-label={t.selectStationStep}
                value={station.id}
                onChange={(e) => onSelectStationId(e.target.value)}
                className="dz-focus h-10 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3 text-xs font-semibold text-[var(--dz-ink)]"
              >
                {rankedStationsForMap.map((s) => (
                  <option key={s.id} value={s.id}>
                    {localizeCity(s.city)} — {localizeStationName(s.id, s.name)} ({s.straightDistanceKm ?? s.distanceKm}{' '}
                    {t.distanceKmUnit})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Nearest / Best-Nearby quick-pick station cards */}
          {topNearestStations.length > 0 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {topNearestStations.map((st, idx) => {
                const isPicked = st.id === station.id;
                const dist = st.straightDistanceKm ?? st.distanceKm;
                const queueLvl = getEffectiveQueueLevel(st);
                const queueTag =
                  st.operationalStatus === 'maintenance'
                    ? t.stationStatusMaint
                    : queueLvl === 'high'
                      ? t.queueHighLabel
                      : queueLvl === 'medium'
                        ? t.queueMediumLabel
                        : t.queueLowLabel;
                const hasCoords = typeof st.lat === 'number' && typeof st.lng === 'number';
                return (
                  <div
                    key={st.id}
                    className={`flex flex-col justify-between rounded-xl border p-2.5 transition-all duration-200 ${
                      isPicked
                        ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] shadow-sm'
                        : 'border-[var(--dz-border)] bg-[var(--dz-surface)] hover:border-[var(--dz-primary)]/60'
                    }`}
                  >
                    <button
                      type="button"
                      data-testid={`fuel-nearest-station-${st.id}`}
                      onClick={() => onSelectStationId(st.id)}
                      className="dz-focus w-full text-left"
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="rounded bg-[var(--dz-primary)]/10 px-1.5 py-0.5 font-mono-tabular text-[10px] font-bold text-[var(--dz-primary)]">
                          #{idx + 1} · {dist} {t.distanceKmUnit}
                        </span>
                        <span className="text-[10px] font-semibold text-[var(--dz-success)]">
                          {st.freeBaysForFuel}/{st.bays.length} {t.freeBaysCount.toLowerCase()}
                        </span>
                      </div>
                      <div className="mt-1 truncate text-xs font-bold text-[var(--dz-ink)]">
                        {localizeStationName(st.id, st.name)}
                      </div>
                      <div className="truncate text-[10px] text-[var(--dz-ink-muted)]">
                        {localizeCity(st.city)} · {queueTag}
                      </div>
                    </button>
                    {hasCoords && (
                      <div className="mt-1.5 flex items-center justify-between border-t border-[var(--dz-border)]/70 pt-1.5 text-[10px]">
                        <span className="truncate text-[var(--dz-ink-muted)]">
                          {localizeStationAddress(st.id, st.address)}
                        </span>
                        <a
                          href={buildGoogleMapsDirectionsUrl(driverLocation, {
                            lat: st.lat as number,
                            lng: st.lng as number,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-1.5 inline-flex shrink-0 items-center gap-0.5 font-semibold text-[var(--dz-primary)] hover:underline"
                        >
                          <ExternalLink className="h-2.5 w-2.5" aria-hidden="true" />
                          <span>Maps</span>
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Embedded Route Map */}
          {isMapOpen && (
            <div
              data-testid="fuel-route-map-panel"
              className="dz-panel-enter rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-3.5 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--dz-ink)]">
                    <RouteIcon
                      className="h-4 w-4 text-[var(--dz-primary)]"
                      aria-hidden="true"
                    />
                    <span>{t.liveRouteModeTitle}: {localizeStationName(station.id, station.name)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-[var(--dz-ink-secondary)]">
                    <span className="font-mono-tabular font-semibold text-[var(--dz-ink)]">
                      {t.routeDistanceLabel}:{' '}
                      {routeDistanceKm !== null
                        ? `${routeDistanceKm} ${t.distanceKmUnit}`
                        : `${station.distanceKm} ${t.distanceKmUnit}`}
                    </span>
                    <span className="font-mono-tabular font-semibold text-[var(--dz-primary)]">
                      {t.routeEtaLabel}:{' '}
                      {routeLoading
                        ? t.routeBuilding
                        : computedRoute && computedRoute.stationId === station.id
                          ? formatRouteDuration(computedRoute.durationMillis, lang)
                          : '—'}
                    </span>
                    {driverLocation && (
                      <span className="font-mono-tabular text-[var(--dz-ink-muted)]">
                        {driverLocation.isLive
                          ? `${formatLocationAge(driverLocation.updatedAt, nowMs, lang)} · `
                          : ''}
                        {formatCoordinates(driverLocation.lat, driverLocation.lng)}
                      </span>
                    )}
                    {driverLocation?.isLive &&
                      typeof driverLocation.speed === 'number' &&
                      driverLocation.speed >= 0.3 && (
                        <span className="font-mono-tabular font-semibold text-[var(--dz-primary)]">
                          {formatSpeedKmh(driverLocation.speed, lang)}
                        </span>
                      )}
                  </div>
                </div>

                {hasValidStationCoords && (
                  <a
                    href={buildGoogleMapsDirectionsUrl(driverLocation, {
                      lat: station.lat as number,
                      lng: station.lng as number,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dz-focus inline-flex items-center gap-1.5 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--dz-primary)] hover:border-[var(--dz-primary)]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.openGoogleMapsBtn}</span>
                  </a>
                )}
              </div>

              <StationsMapView
                apiKey={mapsApiKey}
                stations={rankedStationsForMap}
                driverLocation={driverLocation}
                targetStationId={station.id}
                selectedStationId={station.id}
                fuelFilter={fuelCode}
                lang={lang}
                compact
                hideOriginSearch
                showNearbyPlaces
                showNearbyList
                onSelectStation={onSelectStationId}
                onChooseAndRefuel={handleChooseAndRefuelFromMap}
                onStationsResolved={onStationsResolved || NOOP}
                onOriginSelected={onOriginSelected || NOOP}
                onRouteComputed={setComputedRoute}
                onRouteLoadingChange={setRouteLoading}
                onQuotaExceeded={onQuotaExceeded || NOOP}
              />

              {computedRoute &&
                computedRoute.stationId === station.id &&
                computedRoute.steps.length > 0 && (
                  <div className="rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-bg)] p-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--dz-ink)]">
                      <RouteIcon
                        className="h-3.5 w-3.5 text-[var(--dz-primary)]"
                        aria-hidden="true"
                      />
                      <span>{t.routeStepsTitle}</span>
                    </div>
                    <ol className="mt-1.5 max-h-28 space-y-1 overflow-y-auto pr-1 text-xs text-[var(--dz-ink-secondary)]">
                      {computedRoute.steps.map((step, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="font-mono-tabular font-bold text-[var(--dz-primary)]">
                            {index + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* 2. Column / Bay selection + Pump Display Confirmation Guard */}
        <div className="mt-5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-[var(--dz-ink)]">
              {t.selectBayStep}
            </span>
            <span className="text-xs text-[var(--dz-ink-muted)]">
              {t.freeBaysCount}: {station.bays.filter((b) => b.available).length} /{' '}
              {station.bays.length}
            </span>
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {station.bays.map((bay) => {
              const selected = bay.number === currentBay.number;
              return (
                <button
                  key={bay.number}
                  type="button"
                  disabled={!bay.available}
                  onClick={() => {
                    setBayNumber(bay.number);
                    if (!bay.supportedFuels.includes(fuelCode)) {
                      const next =
                        bay.supportedFuels.find(
                          (c) =>
                            vehicleFuelProfile.supportsGas ||
                            (c !== 'metan' && c !== 'propan'),
                        ) || bay.supportedFuels[0];
                      setFuelCode(next);
                    }
                  }}
                  className={`dz-focus flex min-h-[54px] flex-col items-center justify-center rounded-2xl border p-2 transition-all duration-200 ${
                    !bay.available
                      ? 'cursor-not-allowed border-[var(--dz-border)] bg-[var(--dz-bg)] text-[var(--dz-ink-muted)] opacity-55'
                      : selected
                        ? 'dz-dark-active-glow scale-[1.02] border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white shadow-sm'
                        : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)] hover:border-[var(--dz-primary)]'
                  }`}
                >
                  <span className="font-mono-tabular text-sm font-bold">
                    №{bay.number}
                  </span>
                  <span
                    className={`mt-0.5 text-[11px] font-medium ${
                      selected
                        ? 'text-blue-100'
                        : bay.available
                          ? 'text-[var(--dz-success)]'
                          : 'text-[var(--dz-ink-muted)]'
                    }`}
                  >
                    {bay.available ? t.bayFree : t.bayBusy}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Wrong-Pump Display Code & QR Protection */}
          <div
            data-testid="bay-verification-box"
            className={`mt-3 rounded-2xl border p-3.5 transition-colors ${
              isBayVerified
                ? 'border-[#BCE3D3] dark:border-[#1E6B50] bg-[var(--dz-success-bg)]/60'
                : 'border-[var(--dz-border)] bg-[var(--dz-surface-subtle)]'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--dz-ink)]">
                <KeyRound
                  className={`h-4 w-4 ${
                    isBayVerified ? 'text-[var(--dz-success)]' : 'text-[var(--dz-primary)]'
                  }`}
                  aria-hidden="true"
                />
                <span>{t.bayCodeTitle} · №{currentBay.number}</span>
              </div>
              {isBayVerified ? (
                <span
                  data-testid="bay-verified-badge"
                  className="inline-flex items-center gap-1 rounded-lg bg-[#E9F7EF] dark:bg-[#0D2B22] px-2.5 py-0.5 text-[11px] font-bold text-[var(--dz-success)]"
                >
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.bayCodeVerifiedBadge}</span>
                </span>
              ) : (
                <span className="font-mono-tabular text-[11px] text-[var(--dz-ink-muted)]">
                  {t.bayCodeDemoHintPrefix}:{' '}
                  <strong className="text-[var(--dz-ink)]">{expectedBayCode}</strong>
                </span>
              )}
            </div>

            <div className="mt-2.5 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <label htmlFor="bay-display-code-input" className="sr-only">
                  {t.bayCodeLabel}
                </label>
                <input
                  id="bay-display-code-input"
                  data-testid="bay-display-code-input"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={bayCodeInput}
                  onChange={(e) => {
                    setError(null);
                    setBayCodeInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                  }}
                  placeholder={`${t.bayCodeLabel} (${t.bayCodePlaceholder})`}
                  className="dz-focus h-10 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3.5 font-mono-tabular text-sm font-bold tracking-widest text-[var(--dz-ink)] placeholder:font-sans placeholder:tracking-normal placeholder:text-xs placeholder:font-normal placeholder:text-[var(--dz-ink-muted)]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-testid="bay-autofill-demo-btn"
                  onClick={() => {
                    setError(null);
                    setBayCodeInput(expectedBayCode);
                  }}
                  className="dz-focus inline-flex h-10 items-center justify-center rounded-xl border border-[var(--dz-primary)]/40 bg-[var(--dz-surface)] px-3 text-xs font-semibold text-[var(--dz-primary)] hover:bg-[var(--dz-surface-tint)] whitespace-nowrap"
                >
                  {t.bayCodeAutofillBtn}
                </button>
                <button
                  type="button"
                  data-testid="bay-scan-qr-btn"
                  disabled={qrScanning}
                  onClick={handleStartQrScan}
                  className="dz-focus inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[var(--dz-primary)] px-3.5 text-xs font-semibold text-white hover:bg-[var(--dz-primary-hover)] disabled:opacity-65 whitespace-nowrap"
                >
                  <QrCode className="h-4 w-4" aria-hidden="true" />
                  <span>{qrScanning ? t.bayCodeScanningQr : t.bayCodeScanQrBtn}</span>
                </button>
              </div>
            </div>

            {qrScanning && (
              <div className="dz-panel-enter mt-2.5 flex items-center gap-3 rounded-xl border border-[var(--dz-primary)]/35 bg-[var(--dz-surface)] px-3.5 py-2.5 text-xs font-semibold text-[var(--dz-primary)]">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span>
                  {t.bayCodeScanningQr} (№{currentBay.number})
                </span>
              </div>
            )}

            {!qrScanning && bayCodeInput.length === 4 && !isBayVerified && (
              <div
                data-testid="bay-code-mismatch-hint"
                className="dz-feedback-enter mt-2.5 flex items-center gap-2 rounded-xl border border-amber-400/70 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-100"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                <span>{t.errBayCodeMismatch}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Fuel type selection (with Car Model binding + ПБ АГНКС rule) */}
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-[var(--dz-ink)]">
              {t.selectFuelStep} №{currentBay.number}
            </span>
            {vehicleFuelProfile.supportedFuels.length > 0 && (
              <span className="text-xs font-medium text-[var(--dz-ink-secondary)]">
                {t.carSupportedFuelsLabel}:{' '}
                <strong className="text-[var(--dz-ink)]">
                  {vehicleFuelProfile.supportedFuels
                    .map((code) => fuelShortLabel(code))
                    .join(' · ')}
                </strong>
              </span>
            )}
          </div>

          {carAutoAdjustedNote && !carFuelWarning && (
            <div className="dz-feedback-enter mt-2 rounded-xl border border-[var(--dz-primary)]/25 bg-[var(--dz-surface-tint)] px-3.5 py-2 text-xs font-medium text-[var(--dz-primary)]">
              {t.carFuelAutoSelected}: <strong>{localizeCarModel(activeCarModel)}</strong> ({fuelShortLabel(fuelCode)})
            </div>
          )}

          {carFuelWarning && (
            <div
              role="alert"
              data-testid="car-fuel-warning"
              className="dz-feedback-enter mt-2 flex items-start gap-2.5 rounded-xl border border-amber-400/70 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 px-3.5 py-2.5 text-xs font-semibold text-amber-950 dark:text-amber-100"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>{carFuelWarning}</span>
            </div>
          )}

          <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {(['metan', 'propan', 'ai92', 'ai95'] as FuelCode[]).map((code) => {
              const price = station.prices[code];
              const fuelEnabled = isFuelEnabledOnStation(station, code);
              const baySupportsFuel =
                Boolean(price) &&
                fuelEnabled &&
                currentBay.supportedFuels.includes(code);
              const carSupportsFuel =
                vehicleFuelProfile.powertrain === 'ev_only'
                  ? false
                  : vehicleFuelProfile.supportsGas ||
                    (code !== 'metan' && code !== 'propan');
              const selected =
                vehicleFuelProfile.powertrain !== 'ev_only' &&
                carSupportsFuel &&
                fuelEnabled &&
                fuelCode === code;

              return (
                <button
                  key={code}
                  type="button"
                  data-testid={`fuel-option-${code}`}
                  disabled={!baySupportsFuel}
                  onClick={() => handleSelectFuelWithCarGuard(code)}
                  className={`dz-focus flex min-h-[68px] flex-col items-start justify-between rounded-2xl border p-3 text-left transition-all duration-200 ${
                    !baySupportsFuel
                      ? 'cursor-not-allowed border-[var(--dz-border)] bg-[var(--dz-bg)] opacity-45'
                      : !carSupportsFuel
                        ? 'border-amber-300/70 dark:border-amber-800/70 bg-amber-50/40 dark:bg-amber-950/20 text-[var(--dz-ink-muted)] opacity-75 hover:border-amber-400'
                        : selected
                          ? 'dz-dark-active-glow scale-[1.02] border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] text-[var(--dz-primary)]'
                          : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)] hover:border-[var(--dz-border-strong)]'
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-1">
                    <span className="text-sm font-bold">{fuelShortLabel(code)}</span>
                    {selected ? (
                      <Check
                        className="dz-icon-pop h-4 w-4 text-[var(--dz-primary)]"
                        aria-hidden="true"
                      />
                    ) : !carSupportsFuel && baySupportsFuel ? (
                      <AlertTriangle
                        className="h-3.5 w-3.5 text-amber-500"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                  <div className="mt-1.5 font-mono-tabular text-xs font-semibold text-[var(--dz-ink-secondary)]">
                    {price ? `${formatMoney(price)} / ${fuelUnit(code)}` : t.notAtBay}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Safety Compliance Notice (ПБ АГНКС for Methane vs Stay-in-Car for Petrol/Propane) */}
          {fuelCode === 'metan' && vehicleFuelProfile.supportsGas ? (
            <div
              data-testid="metan-safety-banner"
              className="dz-feedback-enter mt-3 flex items-start gap-2.5 rounded-2xl border border-amber-400/75 dark:border-amber-600/75 bg-amber-50 dark:bg-amber-950/60 p-3.5 text-xs sm:text-sm font-semibold text-amber-950 dark:text-amber-100"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
              <span>{t.safetyMetanRule}</span>
            </div>
          ) : vehicleFuelProfile.powertrain !== 'ev_only' ? (
            <div
              data-testid="stay-in-car-banner"
              className="mt-3 flex items-center gap-2 rounded-2xl border border-[#BCE3D3] dark:border-[#1E6B50] bg-[var(--dz-success-bg)]/60 px-3.5 py-2.5 text-xs font-semibold text-[var(--dz-success)]"
            >
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t.safetyStayInCarNote}</span>
            </div>
          ) : null}
        </div>

        {/* 4. Amount in UZS */}
        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="amount-uzs-input"
              className="text-sm font-semibold text-[var(--dz-ink)]"
            >
              {t.amountStep}
            </label>
            <span className="font-mono-tabular text-sm font-bold text-[var(--dz-primary)]">
              ≈ {estimatedVolume.toFixed(2)} {fuelUnit(fuelCode)}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            {AMOUNT_PRESETS.map((preset) => {
              const active = amountUzs === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountUzs(preset)}
                  className={`dz-focus min-h-[40px] rounded-xl border px-3.5 py-1.5 font-mono-tabular text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    active
                      ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white'
                      : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)] hover:border-[var(--dz-primary)]'
                  }`}
                >
                  {formatMoney(preset)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setAmountUzs(260000)}
              className={`dz-focus min-h-[40px] rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                amountUzs === 260000
                  ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white'
                  : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)] hover:border-[var(--dz-primary)]'
              }`}
            >
              {t.fullTank}
            </button>
          </div>

          <input
            id="amount-uzs-input"
            type="number"
            min={10000}
            max={2000000}
            step={5000}
            value={amountUzs}
            onChange={(e) => setAmountUzs(Number(e.target.value) || 0)}
            className="dz-focus mt-2.5 h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-4 font-mono-tabular text-base font-bold text-[var(--dz-ink)]"
          />
        </div>

        {/* 5. Payment card (Personal dezagamiz Card or Linked bank card) & primary CTA */}
        <div className="mt-4 space-y-2.5 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] p-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white ${
                  isPayingWithPersonalCard
                    ? 'bg-[#092C63]'
                    : 'bg-[var(--dz-primary)]'
                }`}
              >
                <CreditCard className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--dz-ink-secondary)]">
                  {t.payWithCardLabel}
                </div>
                {isPayingWithPersonalCard && personalCard ? (
                  <div className="font-mono-tabular text-sm font-bold text-[var(--dz-ink)]">
                    dezagamiz · •••• {personalCard.last4} ·{' '}
                    <span className="text-[var(--dz-primary)]">
                      {formatMoney(personalCard.balanceUzs)}
                    </span>
                  </div>
                ) : (
                  <div className="font-mono-tabular text-sm font-bold text-[var(--dz-ink)]">
                    {activeCard?.network} · {activeCard?.maskedNumber}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {(user.cards.length > 1 || Boolean(personalCard)) && (
                <select
                  aria-label={t.payWithCardLabel}
                  data-testid="payment-card-select"
                  value={
                    isPayingWithPersonalCard && personalCard
                      ? personalCard.id
                      : activeCard?.id || ''
                  }
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  className="dz-focus h-10 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3 font-mono-tabular text-xs font-semibold text-[var(--dz-ink)]"
                >
                  {personalCard && (
                    <option value={personalCard.id}>
                      {t.personalCardPayOption} •••• {personalCard.last4} (
                      {formatMoney(personalCard.balanceUzs)})
                    </option>
                  )}
                  {user.cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.network} •••• {c.last4}
                    </option>
                  ))}
                </select>
              )}

              {personalCard && !isPayingWithPersonalCard && (
                <button
                  type="button"
                  data-testid="pay-with-personal-card-btn"
                  onClick={() => setSelectedCardId(personalCard.id)}
                  className="dz-focus h-10 rounded-xl border border-[var(--dz-primary)]/35 bg-[var(--dz-surface)] px-3 text-xs font-semibold text-[var(--dz-primary)] hover:bg-[var(--dz-surface-tint)] whitespace-nowrap"
                >
                  {t.personalCardPayOption} (+{personalCardCashbackPct}%)
                </button>
              )}

              <button
                type="button"
                onClick={onGoToCards}
                className="dz-focus text-xs font-semibold text-[var(--dz-primary)] hover:underline whitespace-nowrap"
              >
                {t.cardsCountLabel} ({user.cards.length})
              </button>
            </div>
          </div>

          {isPayingWithPersonalCard && personalCard ? (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--dz-border)] pt-2 text-xs">
              <span className="text-[var(--dz-ink-secondary)]">
                {t.personalCardCashbackLabel} ({personalCardCashbackPct}%):{' '}
                <strong className="font-mono-tabular text-[var(--dz-success)]">
                  +{formatMoney(estimatedCashbackUzs)}
                </strong>
              </span>
              {personalCard.isFrozen ? (
                <button
                  type="button"
                  onClick={onGoToCards}
                  className="font-semibold text-[var(--dz-danger)] hover:underline"
                >
                  {t.personalCardFrozenBadge} · {t.personalCardUnfreezeBtn}
                </button>
              ) : personalCard.balanceUzs < amountUzs ? (
                <button
                  type="button"
                  onClick={onGoToCards}
                  className="font-semibold text-[var(--dz-primary)] hover:underline"
                >
                  {t.personalCardTopUpBtn} →
                </button>
              ) : null}
            </div>
          ) : !personalCard ? (
            <div className="border-t border-[var(--dz-border)] pt-2">
              <button
                type="button"
                onClick={onGoToCards}
                className="dz-focus text-xs font-semibold text-[var(--dz-primary)] hover:underline"
              >
                {t.personalCardIssuePromptLink} →
              </button>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={handlePayFromCar}
          className="dz-focus dz-dark-active-glow group mt-4 flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--dz-primary)] px-6 text-base font-bold text-white shadow-sm hover:bg-[var(--dz-primary-hover)] hover:shadow-md hover:shadow-[var(--dz-primary)]/20 disabled:opacity-60"
        >
          <Fuel className="h-5 w-5 transition-transform duration-150 group-hover:scale-110" aria-hidden="true" />
          <span>
            {submitting
              ? t.processingPayment
              : `${t.payFromCarBtn} · ${formatMoney(amountUzs)}`}
          </span>
        </button>
      </section>

      {/* Right 4 cols: In-car attendant assurance panel */}
      <aside className="dz-section-enter dz-stagger-1 flex min-w-0 flex-col gap-6 lg:col-span-4">
        <div className="overflow-hidden rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] shadow-[var(--dz-shadow-sm)]">
          <div className="relative h-48 w-full bg-[var(--dz-primary-deep)]">
            <img
              src={heroStationImg}
              alt={localizeStationName(station.id, station.name)}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#092C63]/80 via-transparent to-transparent"
            />
            <div className="absolute bottom-3 left-4 right-4 text-white">
              <div className="text-xs text-blue-100">{localizeCity(station.city)}</div>
              <div className="font-display text-base font-bold">
                {localizeStationName(station.id, station.name)}
              </div>
            </div>
          </div>

          <div className="p-5">
            <button
              type="button"
              data-testid="how-it-works-toggle"
              aria-expanded={howItWorksOpen}
              onClick={() => setHowItWorksOpen((v) => !v)}
              className="dz-focus flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface-subtle)] px-4 py-3 text-left text-sm font-bold text-[var(--dz-ink)] transition-colors hover:border-[var(--dz-primary)]"
            >
              <span className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 shrink-0 text-[var(--dz-primary)]" aria-hidden="true" />
                <span>{howItWorksOpen ? t.howItWorksToggleClose : t.howItWorksToggleOpen}</span>
              </span>
              {howItWorksOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-[var(--dz-ink-muted)]" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-[var(--dz-ink-muted)]" aria-hidden="true" />
              )}
            </button>

            {howItWorksOpen && (
              <div className="dz-panel-enter mt-4">
                <h2 className="font-display text-sm font-bold text-[var(--dz-ink)]">
                  {t.howItWorksTitle}
                </h2>
                <ol className="mt-3 space-y-3 text-sm text-[var(--dz-ink-secondary)]">
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--dz-surface-tint)] font-mono-tabular text-xs font-bold text-[var(--dz-primary)]">
                      1
                    </span>
                    <span>{t.howStep1}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--dz-surface-tint)] font-mono-tabular text-xs font-bold text-[var(--dz-primary)]">
                      2
                    </span>
                    <span>
                      {t.howStep2Prefix} №{currentBay.number} →{' '}
                      <strong className="text-[var(--dz-ink)]">{user.plateNumber}</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--dz-surface-tint)] font-mono-tabular text-xs font-bold text-[var(--dz-primary)]">
                      3
                    </span>
                    <span>{t.howStep3}</span>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-primary-deep)] p-6 text-white">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-200">
            <CarFront className="h-4 w-4 text-white" aria-hidden="true" />
            <span>{t.driverProfileActive}</span>
          </div>
          <div className="mt-2 font-display text-lg font-bold text-white">
            {localizePersonName(user.fullName)}
          </div>
          <div className="mt-1 font-mono-tabular text-xs text-blue-100">
            {user.phone} · {localizeCarModel(user.carModel)} ({user.plateNumber})
          </div>
          <div className="mt-4 flex items-center gap-2 border-t border-white/15 pt-4 text-xs text-blue-100">
            <ShieldCheck className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
            <span>
              {t.cardVerifiedText} (
              {isPayingWithPersonalCard
                ? t.personalCardPayOption
                : activeCard?.network}
              )
            </span>
          </div>
        </div>

        {/* Personal Music & Gemini Assistant Quick Deck */}
        <div
          data-testid="fuel-music-assistant-card"
          className="rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-5 shadow-[var(--dz-shadow-sm)] space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Headphones
                className="h-4 w-4 shrink-0 text-[var(--dz-primary)]"
                aria-hidden="true"
              />
              <span className="truncate text-xs font-bold text-[var(--dz-ink)]">
                {t.musicQuickCardTitle}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-bg)] px-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-[var(--dz-ink)]">
                {activeTrack ? localizeTrack(activeTrack).title : t.musicPreset1Title}
              </p>
              <p className="truncate text-[11px] text-[var(--dz-ink-secondary)]">
                {activeTrack
                  ? localizeTrack(activeTrack).subtitle
                  : t.musicStudioSubtitle}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                data-testid="fuel-music-play-btn"
                aria-label={isPlaying ? t.musicPauseBtn : t.musicPlayBtn}
                onClick={() => togglePlay()}
                className="dz-focus flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--dz-primary)] text-white hover:bg-[var(--dz-primary-hover)]"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Play className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                aria-label={t.musicNextBtn}
                onClick={playNext}
                className="dz-focus flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)] hover:bg-[var(--dz-surface-subtle)]"
              >
                <SkipForward className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {onOpenAssistant && (
            <button
              type="button"
              data-testid="open-assistant-studio-btn"
              onClick={onOpenAssistant}
              className="dz-focus flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] px-3 py-2 text-xs font-semibold text-[var(--dz-primary)] hover:bg-[#DDEAFF] dark:hover:bg-[#1E3B6B]"
            >
              <Bot className="h-4 w-4" aria-hidden="true" />
              <span>{t.musicOpenStudioBtn}</span>
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
