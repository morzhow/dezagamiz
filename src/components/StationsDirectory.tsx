import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Clock,
  Crosshair,
  ExternalLink,
  Fuel,
  Loader2,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  Radio,
  Route as RouteIcon,
} from 'lucide-react';
import { PegmanIcon } from './PegmanControl';
import { geocodeAddressQuery } from '../api/client';
import {
  buildGoogleMapsDirectionsUrl,
  detectClosestCity,
  filterStationsByCity,
  findNearestStationForFuel,
  formatCoordinates,
  formatLocationAge,
  formatRouteDuration,
  formatSpeedKmh,
  rankStationsByProximity,
  STATION_CITIES,
} from '../lib/dezagamiz';
import { useI18n } from '../lib/i18n';
import type {
  FuelCode,
  FuelStation,
  GeoPermissionState,
  LatLngPoint,
  LocationSourceMode,
  StationCity,
  StationCityFilter,
} from '../types/dezagamiz';
import {
  StationsMapView,
  type ComputedRouteInfo,
} from './StationsMapView';

interface StationsDirectoryProps {
  apiKey: string;
  stations: FuelStation[];
  selectedStationId: string;
  driverLocation: LatLngPoint | null;
  locationMode: LocationSourceMode;
  selectedCity: StationCityFilter;
  geoPermission: GeoPermissionState;
  locatingGps: boolean;
  liveGpsActive: boolean;
  gpsError: string | null;
  onToggleLiveGps: (enable?: boolean) => void;
  onSelectCity: (city: StationCityFilter) => void;
  onClearGpsError: () => void;
  fuelFilter: FuelCode | 'all';
  onChangeDriverLocation: (point: LatLngPoint | null) => void;
  onChangeFuelFilter: (filter: FuelCode | 'all') => void;
  onStationsResolved: (
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
  onChooseStation: (stationId: string, preferredFuel?: FuelCode) => void;
  onQuotaExceeded: () => void;
}

const CITY_FILTERS: readonly StationCityFilter[] = ['all', ...STATION_CITIES];
const FUEL_FILTERS: (FuelCode | 'all')[] = [
  'all',
  'metan',
  'propan',
  'ai92',
  'ai95',
];

const QUICK_ORIGIN_PRESETS: {
  id: string;
  label: string;
  city: StationCity;
  query: string;
}[] = [
  {
    id: 'tashkent-center',
    label: 'Ташкент · Центр',
    city: 'Ташкент',
    query: 'Amir Temur Square, Tashkent, Uzbekistan',
  },
  {
    id: 'chilonzor',
    label: 'Чиланзар',
    city: 'Ташкент',
    query: 'Chilonzor Metro Station, Tashkent, Uzbekistan',
  },
  {
    id: 'yunusobod',
    label: 'Юнусабад',
    city: 'Ташкент',
    query: 'Yunusabad District, Tashkent, Uzbekistan',
  },
  {
    id: 'sergeli',
    label: 'Сергели',
    city: 'Ташкент',
    query: 'Sergeli District, Tashkent, Uzbekistan',
  },
  {
    id: 'samarkand',
    label: 'Самарканд',
    city: 'Самарканд',
    query: 'Registan Square, Samarkand, Uzbekistan',
  },
  {
    id: 'bukhara',
    label: 'Бухара',
    city: 'Бухара',
    query: 'Bukhara, Uzbekistan',
  },
  {
    id: 'fergana',
    label: 'Фергана',
    city: 'Фергана',
    query: 'Fergana, Uzbekistan',
  },
];

export function StationsDirectory({
  apiKey,
  stations,
  selectedStationId,
  driverLocation,
  locationMode,
  selectedCity,
  geoPermission,
  locatingGps,
  liveGpsActive,
  gpsError,
  onToggleLiveGps,
  onSelectCity,
  onClearGpsError,
  fuelFilter,
  onChangeDriverLocation,
  onChangeFuelFilter,
  onStationsResolved,
  onChooseStation,
  onQuotaExceeded,
}: StationsDirectoryProps) {
  const {
    t,
    lang,
    fuelShortLabel,
    fuelUnit,
    formatMoney,
    localizeCity,
    localizeStationName,
    localizeStationAddress,
    localizeAttendantName,
  } = useI18n();
  const [presetBusyId, setPresetBusyId] = useState<string | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const mapSectionRef = useRef<HTMLDivElement | null>(null);
  const [routeTargetStationId, setRouteTargetStationId] = useState<string | null>(
    null,
  );
  const [externalStreetViewRequest, setExternalStreetViewRequest] = useState<{
    stationId: string;
    nonce: number;
  } | null>(null);
  const [computedRoute, setComputedRoute] = useState<ComputedRouteInfo | null>(
    null,
  );
  const [routeLoading, setRouteLoading] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const manualRouteTargetRef = useRef(false);
  const lastAutoResetKeyRef = useRef('');

  useEffect(() => {
    if (!driverLocation?.isLive) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [driverLocation?.isLive, driverLocation?.updatedAt]);

  const cityFiltered = useMemo(
    () => filterStationsByCity(stations, selectedCity),
    [stations, selectedCity],
  );

  // Rank stations by proximity and selected fuel support
  const rankedStations = useMemo(
    () => rankStationsByProximity(driverLocation, cityFiltered, fuelFilter),
    [driverLocation, cityFiltered, fuelFilter],
  );

  const recommendedNearest = useMemo(
    () => findNearestStationForFuel(driverLocation, cityFiltered, fuelFilter),
    [driverLocation, cityFiltered, fuelFilter],
  );

  // Sync route target to nearest station when filter/city/mode changes, while respecting manual picks across live GPS ticks
  useEffect(() => {
    const autoResetKey = `${fuelFilter}|${selectedCity}|${locationMode}`;
    if (lastAutoResetKeyRef.current !== autoResetKey) {
      lastAutoResetKeyRef.current = autoResetKey;
      manualRouteTargetRef.current = false;
    }

    if (
      manualRouteTargetRef.current &&
      routeTargetStationId &&
      rankedStations.some((s) => s.id === routeTargetStationId)
    ) {
      return;
    }

    if (recommendedNearest) {
      setRouteTargetStationId(recommendedNearest.id);
    } else if (rankedStations[0]) {
      setRouteTargetStationId(rankedStations[0].id);
    } else {
      setRouteTargetStationId(null);
    }
  }, [
    recommendedNearest?.id,
    fuelFilter,
    selectedCity,
    locationMode,
    driverLocation?.lat,
    driverLocation?.lng,
    rankedStations,
    routeTargetStationId,
  ]);

  const activeTargetStation = useMemo(
    () =>
      rankedStations.find((s) => s.id === routeTargetStationId) ||
      recommendedNearest ||
      rankedStations[0] ||
      null,
    [rankedStations, routeTargetStationId, recommendedNearest],
  );

  function handleFocusStationRoute(stationId: string) {
    manualRouteTargetRef.current = true;
    setRouteTargetStationId(stationId);
    mapSectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  function handleToggleGps() {
    setLocationNotice(null);
    onClearGpsError();
    onToggleLiveGps();
  }

  async function handleSelectPreset(preset: (typeof QUICK_ORIGIN_PRESETS)[number]) {
    manualRouteTargetRef.current = false;
    setLocationNotice(null);
    onClearGpsError();
    setPresetBusyId(preset.id);
    try {
      const geo = await geocodeAddressQuery(preset.query);
      if (typeof geo.lat === 'number' && typeof geo.lng === 'number') {
        onChangeDriverLocation({
          lat: geo.lat,
          lng: geo.lng,
          label: preset.label,
        });
        if (selectedCity !== 'all' && selectedCity !== preset.city) {
          onSelectCity(preset.city);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
        onQuotaExceeded();
      } else {
        setLocationNotice(t.gpsPermissionDenied);
      }
    } finally {
      setPresetBusyId(null);
    }
  }

  const nearestDistanceKm =
    computedRoute &&
    activeTargetStation &&
    computedRoute.stationId === activeTargetStation.id &&
    computedRoute.distanceMeters > 0
      ? Math.round((computedRoute.distanceMeters / 1000) * 10) / 10
      : activeTargetStation?.straightDistanceKm ?? null;

  const targetFuelCode: FuelCode =
    fuelFilter !== 'all' && activeTargetStation?.prices[fuelFilter]
      ? fuelFilter
      : activeTargetStation?.prices.metan
        ? 'metan'
        : activeTargetStation?.prices.propan
          ? 'propan'
          : 'ai92';

  const hasValidTargetCoords =
    activeTargetStation &&
    typeof activeTargetStation.lat === 'number' &&
    typeof activeTargetStation.lng === 'number';

  return (
    <section className="space-y-6">
      {/* Header + City Filter */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--dz-ink)] sm:text-3xl">
            {t.stationsTitle}
          </h1>
          <p className="mt-1 text-sm text-[var(--dz-ink-secondary)]">
            {t.stationsSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="stations-my-location-btn"
            onClick={() => {
              manualRouteTargetRef.current = false;
              setLocationNotice(null);
              onClearGpsError();
              onToggleLiveGps(true);
            }}
            className={`dz-focus inline-flex min-h-[42px] items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
              locationMode === 'gps' && liveGpsActive
                ? 'dz-dark-active-glow border-[#0A7E42] dark:border-[#1E6B50] bg-[#E9F7EF] dark:bg-[#0D2B22] text-[#0A7E42] dark:text-[#34D399]'
                : 'border-[var(--dz-primary)]/40 bg-[var(--dz-surface)] text-[var(--dz-primary)] hover:bg-[var(--dz-surface-tint)]'
            }`}
          >
            {locatingGps ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {locatingGps ? t.locatingGps : t.locationModeMyLocation}
            </span>
          </button>

          <div
            role="tablist"
            aria-label={t.locationModeCity}
            className="flex flex-wrap gap-1 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-1"
          >
            {CITY_FILTERS.map((city) => {
              const active = locationMode !== 'gps' && selectedCity === city;
              return (
                <button
                  key={city}
                  type="button"
                  role="tab"
                  data-testid={`station-city-tab-${city}`}
                  aria-selected={active}
                  onClick={() => {
                    manualRouteTargetRef.current = false;
                    setLocationNotice(null);
                    onClearGpsError();
                    onSelectCity(city);
                  }}
                  className={`dz-focus min-h-[36px] rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    active
                      ? 'dz-dark-active-glow bg-[var(--dz-primary)] text-white'
                      : 'text-[var(--dz-ink-secondary)] hover:text-[var(--dz-ink)]'
                  }`}
                >
                  {city === 'all' ? t.allCities : localizeCity(city)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fuel Filter + Driver Origin Controls */}
      <div className="dz-section-enter rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-4 shadow-[var(--dz-shadow-sm)] sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--dz-ink-secondary)]">
              <Fuel className="h-3.5 w-3.5 text-[var(--dz-primary)]" aria-hidden="true" />
              <span>{t.fuelFilterLabel}:</span>
            </span>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label={t.fuelFilterLabel}>
              {FUEL_FILTERS.map((code) => {
                const active = fuelFilter === code;
                const label = code === 'all' ? t.allFuels : fuelShortLabel(code);
                return (
                  <button
                    key={code}
                    type="button"
                    data-testid={`fuel-filter-${code}`}
                    onClick={() => onChangeFuelFilter(code)}
                    className={`dz-focus min-h-[38px] rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                      active
                        ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white shadow-sm'
                        : 'border-[var(--dz-border)] bg-[var(--dz-bg)] text-[var(--dz-ink)] hover:border-[var(--dz-primary)]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {geoPermission === 'granted' && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#E9F7EF] dark:bg-[#0D2B22] px-2.5 py-1 text-[11px] font-semibold text-[#0A7E42] dark:text-[#34D399]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0A7E42] dark:bg-[#34D399]" />
                <span>{t.locationGrantedBadge}</span>
              </span>
            )}

            <button
              type="button"
              data-testid="live-gps-toggle"
              onClick={handleToggleGps}
              className={`dz-focus inline-flex min-h-[38px] items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                liveGpsActive
                  ? 'dz-dark-active-glow border-[#0A7E42] dark:border-[#1E6B50] bg-[#E9F7EF] dark:bg-[#0D2B22] text-[#0A7E42] dark:text-[#34D399] hover:bg-[#D4F0E0] dark:hover:bg-[#133D2F]'
                  : 'border-[var(--dz-primary)]/30 bg-[var(--dz-surface-tint)] text-[var(--dz-primary)] hover:bg-[#D8E7FE] dark:hover:bg-[#1E3B6B]'
              }`}
            >
              {liveGpsActive ? (
                <Radio key="gps-on" className="dz-icon-pop h-3.5 w-3.5 animate-pulse" aria-hidden="true" />
              ) : (
                <Crosshair key="gps-off" className="dz-icon-pop h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>
                {locatingGps
                  ? t.locatingGps
                  : liveGpsActive
                    ? t.stopLiveGps
                    : t.liveGpsOn}
              </span>
            </button>
          </div>
        </div>

        {/* Uzbekistan city/district quick points + active origin coords */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--dz-border)] pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_ORIGIN_PRESETS.map((preset) => {
              const busy = presetBusyId === preset.id;
              const isCurrent = !liveGpsActive && driverLocation?.label === preset.label;
              return (
                <button
                  key={preset.id}
                  type="button"
                  disabled={busy}
                  onClick={() => void handleSelectPreset(preset)}
                  className={`dz-focus inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                    isCurrent
                      ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-surface-tint)] text-[var(--dz-primary)] font-semibold'
                      : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink-secondary)] hover:border-[var(--dz-primary)] hover:text-[var(--dz-ink)]'
                  }`}
                >
                  {busy && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
                  <span>{localizeCity(preset.label)}</span>
                </button>
              );
            })}
          </div>

          {driverLocation && (() => {
            const speedBadge =
              driverLocation.isLive &&
              typeof driverLocation.speed === 'number' &&
              driverLocation.speed >= 0.3
                ? formatSpeedKmh(driverLocation.speed, lang)
                : null;
            const closestCity = detectClosestCity(driverLocation);
            return (
              <div
                data-testid="driver-live-coords"
                className="flex flex-wrap items-center gap-2 font-mono-tabular text-[11px] text-[var(--dz-ink-muted)]"
              >
                {driverLocation.isLive && (
                  <>
                    <span className="inline-flex items-center gap-1 rounded-md bg-[#E9F7EF] dark:bg-[#0D2B22] px-2 py-0.5 font-sans text-[11px] font-bold text-[#0A7E42] dark:text-[#34D399]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0A7E42] dark:bg-[#34D399]" />
                      <span>LIVE</span>
                      {typeof driverLocation.accuracy === 'number' && (
                        <span>
                          ±{driverLocation.accuracy} {t.meterUnit}
                        </span>
                      )}
                    </span>
                    {speedBadge && (
                      <span className="rounded-md bg-[var(--dz-surface-tint)] px-2 py-0.5 text-[11px] font-bold text-[var(--dz-primary)]">
                        {speedBadge}
                      </span>
                    )}
                    <span
                      data-testid="live-gps-age"
                      className="font-sans text-[11px] font-medium text-[var(--dz-ink-secondary)]"
                    >
                      {t.liveTelemetryUpdated}:{' '}
                      {formatLocationAge(driverLocation.updatedAt, nowMs, lang)}
                    </span>
                  </>
                )}
                <span>
                  <span className="font-semibold text-[var(--dz-ink-secondary)]">
                    {driverLocation.isLive
                      ? `${t.liveGpsActive} (${localizeCity(closestCity)})`
                      : driverLocation.label
                        ? localizeCity(driverLocation.label)
                        : localizeCity(closestCity)}
                    :
                  </span>{' '}
                  {formatCoordinates(driverLocation.lat, driverLocation.lng)}
                </span>
              </div>
            );
          })()}
        </div>

        {(gpsError || locationNotice) && (
          <div className="dz-feedback-enter rounded-xl border border-[#F5D6A7] dark:border-amber-800 bg-[#FFFBEB] dark:bg-amber-950/70 px-3.5 py-2 text-xs font-medium text-[#92400E] dark:text-amber-200">
            {gpsError || locationNotice}
          </div>
        )}
      </div>

      {/* Nearest Station Recommendation Card + Interactive Google Map */}
      <div
        ref={mapSectionRef}
        className="grid grid-cols-1 gap-6 scroll-mt-24 lg:grid-cols-12"
      >
        <div className="space-y-3 lg:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-4 py-2.5 shadow-[var(--dz-shadow-sm)]">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--dz-ink)]">
              <Navigation
                className="h-4 w-4 text-[var(--dz-primary)]"
                aria-hidden="true"
              />
              <span>{t.liveRouteModeTitle}</span>
              {activeTargetStation && (
                <span className="hidden rounded-lg bg-[var(--dz-surface-tint)] px-2 py-0.5 text-[11px] font-semibold text-[var(--dz-primary)] sm:inline-block">
                  → {localizeStationName(activeTargetStation.id, activeTargetStation.name)}
                </span>
              )}
            </div>
            <button
              type="button"
              data-testid="expand-map-btn"
              onClick={() => setMapExpanded((prev) => !prev)}
              className="dz-focus inline-flex items-center gap-1.5 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--dz-ink)] transition-colors hover:border-[var(--dz-primary)] hover:text-[var(--dz-primary)]"
            >
              {mapExpanded ? (
                <>
                  <Minimize2 key="min" className="dz-icon-pop h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.collapseMapBtn}</span>
                </>
              ) : (
                <>
                  <Maximize2 key="max" className="dz-icon-pop h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.expandMapBtn}</span>
                </>
              )}
            </button>
          </div>

          <StationsMapView
            apiKey={apiKey}
            stations={rankedStations}
            driverLocation={driverLocation}
            targetStationId={activeTargetStation?.id || null}
            selectedStationId={selectedStationId}
            fuelFilter={fuelFilter}
            lang={lang}
            expanded={mapExpanded}
            showNearbyPlaces
            showNearbyList
            externalStreetViewRequest={externalStreetViewRequest}
            onSelectStation={(id) => {
              manualRouteTargetRef.current = true;
              setRouteTargetStationId(id);
            }}
            onChooseAndRefuel={(id, preferred) =>
              onChooseStation(id, preferred)
            }
            onStationsResolved={onStationsResolved}
            onOriginSelected={(point) => {
              setLocationNotice(null);
              onClearGpsError();
              onChangeDriverLocation(point);
            }}
            onRouteComputed={setComputedRoute}
            onRouteLoadingChange={setRouteLoading}
            onQuotaExceeded={onQuotaExceeded}
          />
        </div>

        {/* Right 5 cols: Recommended Nearest Station + Route Details */}
        <aside className="dz-card-enter dz-stagger-1 lg:col-span-5">
          <div
            data-testid="nearest-route-card"
            className="flex h-full flex-col justify-between rounded-3xl border border-[var(--dz-primary)]/25 bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-card)]"
          >
            {activeTargetStation && (fuelFilter === 'all' || recommendedNearest) ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--dz-surface-tint)] px-3 py-1 text-xs font-bold text-[var(--dz-primary)]">
                    <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {fuelFilter === 'all'
                        ? t.nearestRouteTitle
                        : `${t.nearestFuelBadge} ${fuelShortLabel(fuelFilter)}`}
                    </span>
                  </span>
                  <span className="text-xs font-semibold text-[var(--dz-success)]">
                    {t.freeBaysCount}: {activeTargetStation.freeBaysForFuel}/
                    {activeTargetStation.bays.length}
                  </span>
                </div>

                <div>
                  <h2 className="font-display text-xl font-bold text-[var(--dz-ink)]">
                    {localizeStationName(activeTargetStation.id, activeTargetStation.name)}
                  </h2>
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-[var(--dz-ink-secondary)]">
                    <MapPin
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--dz-primary)]"
                      aria-hidden="true"
                    />
                    <span>
                      {activeTargetStation.formattedAddress ||
                        localizeStationAddress(activeTargetStation.id, activeTargetStation.address)}
                    </span>
                  </p>
                </div>

                {/* Verified Coordinates + Distance + ETA */}
                <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-bg)] p-3.5">
                  <div>
                    <div className="text-[11px] font-medium text-[var(--dz-ink-muted)]">
                      {t.routeDistanceLabel}
                    </div>
                    <div className="mt-0.5 font-mono-tabular text-base font-bold text-[var(--dz-ink)]">
                      {nearestDistanceKm !== null
                        ? `${nearestDistanceKm} ${t.distanceKmUnit}`
                        : `${activeTargetStation.distanceKm} ${t.distanceKmUnit}`}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-[var(--dz-ink-muted)]">
                      {t.routeEtaLabel}
                    </div>
                    <div className="mt-0.5 font-mono-tabular text-base font-bold text-[var(--dz-primary)]">
                      {routeLoading
                        ? t.routeBuilding
                        : computedRoute &&
                            computedRoute.stationId === activeTargetStation.id
                          ? formatRouteDuration(computedRoute.durationMillis, lang)
                          : '—'}
                    </div>
                  </div>
                  <div className="col-span-2 border-t border-[var(--dz-border)] pt-2.5">
                    <div className="text-[11px] font-medium text-[var(--dz-ink-muted)]">
                      {t.coordinatesLabel}
                    </div>
                    <div
                      data-testid="nearest-station-coords"
                      className="mt-0.5 font-mono-tabular text-xs font-bold text-[var(--dz-ink)]"
                    >
                      {hasValidTargetCoords
                        ? formatCoordinates(
                            activeTargetStation.lat,
                            activeTargetStation.lng,
                          )
                        : t.resolvingCoords}
                    </div>
                  </div>
                </div>

                {/* Highlighted price */}
                {activeTargetStation.prices[targetFuelCode] && (
                  <div className="flex items-center justify-between rounded-2xl bg-[var(--dz-surface-tint)] px-4 py-3 text-sm">
                    <span className="font-semibold text-[var(--dz-ink)]">
                      {fuelShortLabel(targetFuelCode)}
                    </span>
                    <span className="font-mono-tabular font-bold text-[var(--dz-primary)]">
                      {formatMoney(
                        activeTargetStation.prices[targetFuelCode] as number,
                      )}{' '}
                      / {fuelUnit(targetFuelCode)}
                    </span>
                  </div>
                )}

                {/* Concise Route Steps from Routes API */}
                {computedRoute &&
                  computedRoute.stationId === activeTargetStation.id &&
                  computedRoute.steps.length > 0 && (
                    <div className="rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--dz-ink)]">
                        <RouteIcon
                          className="h-3.5 w-3.5 text-[var(--dz-primary)]"
                          aria-hidden="true"
                        />
                        <span>{t.routeStepsTitle}</span>
                      </div>
                      <ol className="mt-2 max-h-36 space-y-1.5 overflow-y-auto pr-1 text-xs text-[var(--dz-ink-secondary)]">
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
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                <Fuel
                  className="h-8 w-8 text-[var(--dz-ink-muted)]"
                  aria-hidden="true"
                />
                <p className="mt-2 text-sm font-semibold text-[var(--dz-ink)]">
                  {t.noStationForFuel}
                </p>
              </div>
            )}

            {activeTargetStation && (
              <div className="mt-5 space-y-2.5 border-t border-[var(--dz-border)] pt-4">
                <button
                  type="button"
                  data-testid="nearest-refuel-btn"
                  onClick={() =>
                    onChooseStation(
                      activeTargetStation.id,
                      fuelFilter !== 'all' ? fuelFilter : undefined,
                    )
                  }
                  className="dz-focus group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--dz-primary)] px-4 text-sm font-bold text-white hover:bg-[var(--dz-primary-hover)] hover:shadow-md hover:shadow-[var(--dz-primary)]/20"
                >
                  <span>{t.refuelHereBtn}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-1" aria-hidden="true" />
                </button>

                {hasValidTargetCoords && (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      data-testid="nearest-station-360-btn"
                      onClick={() => {
                        setExternalStreetViewRequest({
                          stationId: activeTargetStation.id,
                          nonce: Date.now(),
                        });
                        mapSectionRef.current?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }}
                      className="dz-focus flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--dz-primary)]/40 bg-[var(--dz-surface-tint)] px-3 text-xs font-bold text-[var(--dz-primary)] transition-colors hover:bg-[#D8E7FE] dark:hover:bg-[#1E3B6B]"
                    >
                      <PegmanIcon variant="badge" className="h-4 w-4" />
                      <span>{t.mapView360Btn}</span>
                    </button>

                    <a
                      href={buildGoogleMapsDirectionsUrl(driverLocation, {
                        lat: activeTargetStation.lat as number,
                        lng: activeTargetStation.lng as number,
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="dz-focus flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-3 text-xs font-semibold text-[var(--dz-ink)] transition-colors hover:border-[var(--dz-primary)] hover:text-[var(--dz-primary)]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{t.openGoogleMapsBtn}</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Ranked Stations Directory Grid */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-[var(--dz-ink)] sm:text-xl">
            {t.nearestStationsSectionTitle} ·{' '}
            <span className="text-[var(--dz-primary)]">
              {locationMode === 'gps'
                ? t.nearestFromMyGps
                : selectedCity === 'all'
                  ? t.allCities
                  : localizeCity(selectedCity)}
            </span>
          </h2>
          <span className="text-xs font-semibold text-[var(--dz-ink-muted)]">
            {rankedStations.length}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {rankedStations.map((station, idx) => {
          const isNearest =
            idx === 0 &&
            (fuelFilter === 'all' || station.supportsSelectedFuel);
          const isTarget = station.id === routeTargetStationId;
          const isSelected = station.id === selectedStationId;
          const hasCoords =
            typeof station.lat === 'number' && typeof station.lng === 'number';
          const distLabel =
            station.straightDistanceKm !== null
              ? `${station.straightDistanceKm} ${t.distanceKmUnit}`
              : `${station.distanceKm} ${t.distanceKmUnit}`;

          return (
            <article
              key={station.id}
              data-testid={`station-card-${station.id}`}
              className={`dz-card-hover flex flex-col justify-between rounded-3xl border bg-[var(--dz-surface)] p-6 shadow-[var(--dz-shadow-sm)] ${
                !station.supportsSelectedFuel && fuelFilter !== 'all'
                  ? 'border-[var(--dz-border)] opacity-60'
                  : isTarget
                    ? 'border-[#0A7E42] dark:border-[#34D399]/70 ring-1 ring-[#0A7E42]/20 dark:ring-[#34D399]/25'
                    : isSelected
                      ? 'border-[var(--dz-primary)] ring-1 ring-[var(--dz-primary)]/20'
                      : 'border-[var(--dz-border)]'
              }`}
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[var(--dz-ink-muted)]">
                    #{idx + 1} · {localizeCity(station.city)} · {distLabel}
                  </span>
                  {isNearest ? (
                    <span className="rounded-lg bg-[#E9F7EF] dark:bg-[#0D2B22] px-2 py-0.5 font-bold text-[#0A7E42] dark:text-[#34D399]">
                      {t.nearestStationRank}
                    </span>
                  ) : (
                    <span className="font-semibold text-[var(--dz-success)]">
                      {t.freeBaysCount}: {station.freeBaysForFuel}/{station.bays.length}
                    </span>
                  )}
                </div>

                <h2 className="mt-2 font-display text-lg font-bold text-[var(--dz-ink)]">
                  {localizeStationName(station.id, station.name)}
                </h2>

                <div className="mt-1.5 flex items-start gap-1.5 text-xs text-[var(--dz-ink-secondary)]">
                  <MapPin
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--dz-primary)]"
                    aria-hidden="true"
                  />
                  <span>
                    {station.formattedAddress ||
                      localizeStationAddress(station.id, station.address)}
                  </span>
                </div>

                <div className="mt-1 font-mono-tabular text-[11px] text-[var(--dz-ink-muted)]">
                  {t.coordinatesLabel}:{' '}
                  {hasCoords
                    ? formatCoordinates(station.lat, station.lng)
                    : t.resolvingCoords}
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--dz-ink-muted)]">
                  <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {station.isOpen24h ? t.open24h : '06:00 – 23:00'} ·{' '}
                    {t.attendantLabel}:{' '}
                    {station.attendants[0]
                      ? localizeAttendantName(station.attendants[0].id, station.attendants[0].name)
                      : '—'}
                  </span>
                </div>

                <div className="mt-4 divide-y divide-[var(--dz-border)] border-t border-[var(--dz-border)]">
                  {(['metan', 'propan', 'ai92', 'ai95'] as FuelCode[]).map(
                    (code) => {
                      const price = station.prices[code];
                      if (!price) return null;
                      const highlighted = fuelFilter === code;
                      return (
                        <div
                          key={code}
                          className={`flex items-center justify-between py-2 text-xs ${
                            highlighted
                              ? 'font-bold text-[var(--dz-primary)]'
                              : ''
                          }`}
                        >
                          <span
                            className={
                              highlighted
                                ? 'font-bold text-[var(--dz-primary)]'
                                : 'font-medium text-[var(--dz-ink-secondary)]'
                            }
                          >
                            {fuelShortLabel(code)}
                          </span>
                          <span className="font-mono-tabular font-bold">
                            {formatMoney(price)} / {fuelUnit(code)}
                          </span>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleFocusStationRoute(station.id)}
                  className={`dz-focus flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl border px-3.5 text-xs font-semibold transition-colors ${
                    isTarget
                      ? 'border-[#0A7E42] dark:border-[#1E6B50] bg-[#E9F7EF] dark:bg-[#0D2B22] text-[#0A7E42] dark:text-[#34D399]'
                      : 'border-[var(--dz-border)] bg-[var(--dz-surface)] text-[var(--dz-ink)] hover:border-[var(--dz-primary)]'
                  }`}
                >
                  <RouteIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{t.routeDistanceLabel}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChooseStation(
                      station.id,
                      fuelFilter !== 'all' && station.supportsSelectedFuel
                        ? fuelFilter
                        : undefined,
                    )
                  }
                  className={`dz-focus flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'bg-[var(--dz-surface-tint)] text-[var(--dz-primary)] hover:bg-[#D8E7FE] dark:hover:bg-[#1E3B6B]'
                      : 'bg-[var(--dz-primary)] text-white hover:bg-[var(--dz-primary-hover)]'
                  }`}
                >
                  <span>
                    {isSelected ? t.goToFueling : t.chooseStation}
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
      </div>
    </section>
  );
}
