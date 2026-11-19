import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import {
  autostartDemoSession,
  enterGuestMode,
  fetchMapsConfig,
  fetchSession,
  fetchStationLocations,
  fetchStations,
  geocodeAddressQuery,
  logoutDriver,
  switchCreatorRole,
} from './api/client';
import { AppLoadingSplash } from './components/AppLoadingSplash';
import { AssistantAndMusicView } from './components/AssistantAndMusicView';
import { AuthCardGate } from './components/AuthCardGate';
import { CreatorSection } from './components/CreatorSection';
import { FuelingWorkspace } from './components/FuelingWorkspace';
import { HistoryLedger } from './components/HistoryLedger';
import { ProfileAndCards } from './components/ProfileAndCards';
import { ShowcaseView } from './components/ShowcaseView';
import { StationsDirectory } from './components/StationsDirectory';
import { TopNav } from './components/TopNav';
import { UZBEKISTAN_STATIONS } from './data/stations';
import { MusicPlayerProvider, useMusicPlayer } from './lib/musicContext';
import {
  canAccessApp,
  filterStationsByCity,
  findNearestStationForFuel,
  formatGuestRemaining,
  isGuestExpired,
  UZBEKISTAN_CITY_CENTERS,
} from './lib/dezagamiz';
import { useI18n } from './lib/i18n';
import type {
  AccessRole,
  AppView,
  FuelCode,
  FuelOrder,
  FuelStation,
  GeoPermissionState,
  LatLngPoint,
  LocationSourceMode,
  SessionPayload,
  StationCityFilter,
} from './types/dezagamiz';

function FuelingOrderChimeObserver({ activeOrder }: { activeOrder: FuelOrder | null }) {
  const { playFuelingChime } = useMusicPlayer();
  const prevStageRef = useRef<string | null>(null);

  useEffect(() => {
    const key = activeOrder ? `${activeOrder.id}:${activeOrder.stage}` : null;
    if (
      key &&
      prevStageRef.current &&
      prevStageRef.current !== key &&
      (activeOrder?.stage === 'fueling' || activeOrder?.stage === 'completed')
    ) {
      playFuelingChime();
    }
    prevStageRef.current = key;
  }, [activeOrder, playFuelingChime]);

  return null;
}

const EMPTY_SESSION: SessionPayload = {
  authenticated: false,
  isCreator: false,
  creatorRole: null,
  isGuest: false,
  guestExpiresAt: null,
  user: null,
  activeOrder: null,
  orders: [],
};

export default function App() {
  const { t, lang, localizeCity } = useI18n();
  const [loading, setLoading] = useState(true);
  const [splashDismissed, setSplashDismissed] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') === '1' && params.get('splash') !== '1';
  });
  const [enteringApp, setEnteringApp] = useState(false);
  const [guestExpiredBanner, setGuestExpiredBanner] = useState(false);
  const [initialGateMode, setInitialGateMode] = useState<
    'register' | 'login' | 'guest' | 'creator'
  >('register');
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [session, setSession] = useState<SessionPayload>(EMPTY_SESSION);
  const [stations, setStations] = useState<FuelStation[]>(UZBEKISTAN_STATIONS);
  const [selectedStationId, setSelectedStationId] = useState<string>(
    UZBEKISTAN_STATIONS[0].id,
  );
  const [activeView, setActiveView] = useState<AppView>('fuel');
  const [preAuthShowcaseOpen, setPreAuthShowcaseOpen] = useState(false);
  const [mapsApiKey, setMapsApiKey] = useState<string>(
    () => (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined) || '',
  );
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [driverLocation, setDriverLocation] = useState<LatLngPoint | null>(null);
  const [locationMode, setLocationMode] = useState<LocationSourceMode>('city');
  const [selectedCity, setSelectedCity] = useState<StationCityFilter>('all');
  const [geoPermission, setGeoPermission] = useState<GeoPermissionState>(() =>
    typeof navigator === 'undefined' || !navigator.geolocation
      ? 'unsupported'
      : 'unknown',
  );
  const [locatingGps, setLocatingGps] = useState(false);
  const [liveGpsActive, setLiveGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const locationSeqRef = useRef(0);
  const autoGpsCheckedRef = useRef(false);
  const [showRouteMapOnFuel, setShowRouteMapOnFuel] = useState(false);
  const [stationFuelFilter, setStationFuelFilter] = useState<FuelCode | 'all'>('all');
  const [fuelingRequestedFuel, setFuelingRequestedFuel] =
    useState<FuelCode | null>(null);

  const stationsRef = useRef(stations);
  stationsRef.current = stations;
  const stationFuelFilterRef = useRef(stationFuelFilter);
  stationFuelFilterRef.current = stationFuelFilter;
  const liveGpsActiveRef = useRef(liveGpsActive);
  liveGpsActiveRef.current = liveGpsActive;
  const locationModeRef = useRef(locationMode);
  locationModeRef.current = locationMode;

  const stopLiveGps = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLocatingGps(false);
    setLiveGpsActive(false);
    setDriverLocation((prev) =>
      prev && prev.isLive ? { ...prev, isLive: false } : prev,
    );
  }, []);

  const toggleLiveGps = useCallback(
    (forceEnable?: boolean) => {
      const shouldEnable =
        typeof forceEnable === 'boolean' ? forceEnable : !liveGpsActiveRef.current;
      if (!shouldEnable) {
        stopLiveGps();
        return;
      }
      setGpsError(null);
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setGeoPermission('unsupported');
        setGpsError(t.gpsPermissionDenied);
        setLiveGpsActive(false);
        setLocatingGps(false);
        return;
      }

      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      const seq = ++locationSeqRef.current;
      setLocationMode('gps');
      setSelectedCity('all');
      setLocatingGps(true);
      setLiveGpsActive(true);

      const handleSuccess = (pos: GeolocationPosition, autoSelectNearest: boolean) => {
        if (locationSeqRef.current !== seq) return;
        const point: LatLngPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Number.isFinite(pos.coords.accuracy)
            ? Math.round(pos.coords.accuracy)
            : undefined,
          heading:
            typeof pos.coords.heading === 'number' &&
            Number.isFinite(pos.coords.heading)
              ? pos.coords.heading
              : null,
          speed:
            typeof pos.coords.speed === 'number' &&
            Number.isFinite(pos.coords.speed)
              ? pos.coords.speed
              : null,
          isLive: true,
          updatedAt: pos.timestamp || Date.now(),
          label: t.liveGpsActive,
        };
        setGeoPermission('granted');
        setGpsError(null);
        setLocatingGps(false);
        setDriverLocation(point);
        if (autoSelectNearest) {
          const nearest = findNearestStationForFuel(
            point,
            stationsRef.current,
            stationFuelFilterRef.current,
          );
          if (nearest) {
            setSelectedStationId(nearest.id);
          }
        }
      };

      const handleGeoError = (err: GeolocationPositionError) => {
        if (locationSeqRef.current !== seq) return;
        setLocatingGps(false);
        const fallbackPoint: LatLngPoint = {
          lat: UZBEKISTAN_CITY_CENTERS['Ташкент'].lat,
          lng: UZBEKISTAN_CITY_CENTERS['Ташкент'].lng,
          label: t.districtTashkentCenter,
          isLive: false,
        };
        if (err && err.code === 1) {
          setGeoPermission('denied');
          setGpsError(t.locationBlockedHint);
          if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
          setLiveGpsActive(false);
          setDriverLocation((prev) =>
            prev
              ? prev.isLive
                ? { ...prev, isLive: false }
                : prev
              : fallbackPoint,
          );
        } else {
          setGpsError(err?.code === 3 ? t.gpsSignalTimeout : t.gpsSignalUnavailable);
          setDriverLocation((prev) => prev ?? fallbackPoint);
        }
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => handleSuccess(pos, true),
        handleGeoError,
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 12000,
        },
      );

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => handleSuccess(pos, false),
        handleGeoError,
        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 15000,
        },
      );
    },
    [
      stopLiveGps,
      t.gpsPermissionDenied,
      t.gpsSignalTimeout,
      t.gpsSignalUnavailable,
      t.liveGpsActive,
      t.locationBlockedHint,
    ],
  );

  const toggleLiveGpsRef = useRef(toggleLiveGps);
  toggleLiveGpsRef.current = toggleLiveGps;

  const selectCityOrigin = useCallback(
    (city: StationCityFilter) => {
      const seq = ++locationSeqRef.current;
      stopLiveGps();
      setGpsError(null);
      setLocationMode('city');
      setSelectedCity(city);

      const anchorCity = city === 'all' ? 'Ташкент' : city;
      const center = UZBEKISTAN_CITY_CENTERS[anchorCity];
      const nextOrigin: LatLngPoint = {
        lat: center.lat,
        lng: center.lng,
        label:
          anchorCity === 'Ташкент'
            ? t.districtTashkentCenter
            : localizeCity(anchorCity),
        isLive: false,
      };
      setDriverLocation(nextOrigin);

      const cityStations = filterStationsByCity(stationsRef.current, city);
      const nearest =
        findNearestStationForFuel(
          nextOrigin,
          cityStations,
          stationFuelFilterRef.current,
        ) || cityStations[0];
      if (nearest) {
        setSelectedStationId(nearest.id);
      }

      geocodeAddressQuery(center.geocodeQuery)
        .then((geo) => {
          if (
            locationSeqRef.current === seq &&
            typeof geo.lat === 'number' &&
            typeof geo.lng === 'number'
          ) {
            setDriverLocation({
              lat: geo.lat,
              lng: geo.lng,
              label: nextOrigin.label,
              isLive: false,
            });
          }
        })
        .catch(() => {
          // Instant city center coordinates are already applied
        });
    },
    [stopLiveGps],
  );

  const handleManualDriverLocation = useCallback(
    (point: LatLngPoint | null) => {
      locationSeqRef.current += 1;
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setLocatingGps(false);
      setLiveGpsActive(false);
      setGpsError(null);
      setLocationMode('custom');
      setDriverLocation(point ? { ...point, isLive: false } : null);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const mergeStationLocations = useCallback(
    (
      resolved: Record<
        string,
        {
          lat: number;
          lng: number;
          placeId?: string;
          formattedAddress?: string;
        }
      >,
    ) => {
      if (!resolved || Object.keys(resolved).length === 0) return;
      setStations((prev) =>
        prev.map((s) => {
          const coords = resolved[s.id];
          if (!coords) return s;
          return {
            ...s,
            lat: coords.lat,
            lng: coords.lng,
            placeId: coords.placeId ?? s.placeId,
            formattedAddress: coords.formattedAddress ?? s.formattedAddress,
          };
        }),
      );
    },
    [],
  );

  const hydrateMaps = useCallback(async () => {
    try {
      const cfg = await fetchMapsConfig();
      if (cfg.apiKey) {
        setMapsApiKey(cfg.apiKey);
      }
    } catch {
      // Fallback to VITE_GOOGLE_MAPS_API_KEY if present
    }
    try {
      const locPayload = await fetchStationLocations();
      if (locPayload.quotaExceeded) {
        setQuotaExceeded(true);
      }
      mergeStationLocations(locPayload.locations);
    } catch {
      // Client-side Places fallback in StationsMapView handles unresolved stations
    }
  }, [mergeStationLocations]);

  const bootstrap = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const isAutostart = params.get('autostart') === '1';
    const showSplash = params.get('splash') === '1';
    const minSplashPromise =
      !isAutostart || showSplash
        ? new Promise((resolve) => window.setTimeout(resolve, 420))
        : Promise.resolve();

    try {
      const [current] = await Promise.all([fetchSession(), minSplashPromise]);
      if (current.guestExpired) {
        setGuestExpiredBanner(true);
      }

      const hasDriver = current.authenticated && canAccessApp(current.user);
      if (hasDriver || current.isCreator) {
        setSession(current);
        if (current.isCreator && current.creatorRole === 'admin') {
          setActiveView('creator');
        } else {
          setActiveView('fuel');
        }
        const loadedStations = await fetchStations().catch(
          () => UZBEKISTAN_STATIONS,
        );
        setStations(loadedStations);
        await hydrateMaps();
      } else if (isAutostart) {
        const demo = await autostartDemoSession();
        setSession(demo);
        const loadedStations = await fetchStations().catch(
          () => UZBEKISTAN_STATIONS,
        );
        setStations(loadedStations);
        await hydrateMaps();
      } else {
        setSession(EMPTY_SESSION);
      }
    } catch {
      await minSplashPromise;
      setSession(EMPTY_SESSION);
    } finally {
      setLoading(false);
    }
  }, [hydrateMaps]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const onQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [activeView]);

  // Seed initial Tashkent center origin once authenticated without re-running on GPS ticks
  useEffect(() => {
    if (!session.authenticated && !session.isCreator) return;
    setDriverLocation((prev) => {
      if (prev) return prev;
      const center = UZBEKISTAN_CITY_CENTERS['Ташкент'];
      return {
        lat: center.lat,
        lng: center.lng,
        label: t.districtTashkentCenter,
        isLive: false,
      };
    });
  }, [session.authenticated, session.isCreator, t.districtTashkentCenter]);

  // Monitor browser geolocation permission once authenticated
  useEffect(() => {
    if (!session.authenticated && !session.isCreator) return;
    if (
      autoGpsCheckedRef.current ||
      typeof navigator === 'undefined' ||
      !navigator.permissions?.query
    ) {
      return;
    }

    let cancelled = false;
    autoGpsCheckedRef.current = true;
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (cancelled) return;
        setGeoPermission(status.state as GeoPermissionState);
        status.onchange = () => {
          if (cancelled) return;
          const nextState = status.state as GeoPermissionState;
          setGeoPermission(nextState);
          if (nextState === 'granted' && locationModeRef.current !== 'city') {
            toggleLiveGpsRef.current(true);
          }
        };
        if (status.state === 'granted') {
          toggleLiveGpsRef.current(true);
        }
      })
      .catch(() => {
        // Ignore permissions API unsupported errors
      });

    return () => {
      cancelled = true;
    };
  }, [session.authenticated, session.isCreator]);

  // Enforce strict 3-day guest cap while app is open and refresh remaining countdown
  useEffect(() => {
    if (!session.isGuest || !session.guestExpiresAt) return;
    const interval = window.setInterval(() => {
      const now = Date.now();
      setNowTick(now);
      if (isGuestExpired(session.guestExpiresAt, now)) {
        setSession(EMPTY_SESSION);
        setGuestExpiredBanner(true);
        setInitialGateMode('register');
      }
    }, 30000);
    return () => window.clearInterval(interval);
  }, [session.isGuest, session.guestExpiresAt]);

  async function handleGateSuccess(payload: SessionPayload) {
    setGuestExpiredBanner(false);
    setEnteringApp(true);
    setSession(payload);

    const minDelay = new Promise((resolve) => window.setTimeout(resolve, 850));
    const stationsAndMaps = fetchStations()
      .catch(() => UZBEKISTAN_STATIONS)
      .then(async (loaded) => {
        setStations(loaded);
        await hydrateMaps();
      });

    await Promise.all([minDelay, stationsAndMaps]);

    if (payload.isCreator && payload.creatorRole === 'admin') {
      setActiveView('creator');
    } else {
      setActiveView('fuel');
    }
    setPreAuthShowcaseOpen(false);
    setEnteringApp(false);
  }

  const handleDemoJumpFromShowcase = useCallback(
    async (targetView: AppView) => {
      const target = targetView === 'creator' ? 'fuel' : targetView;
      if (session.authenticated && canAccessApp(session.user)) {
        setActiveView(target);
        return;
      }
      setEnteringApp(true);
      try {
        const guestSession = await enterGuestMode();
        setSession(guestSession);
        const loaded = await fetchStations().catch(() => UZBEKISTAN_STATIONS);
        setStations(loaded);
        await hydrateMaps();
        setPreAuthShowcaseOpen(false);
        setActiveView(target);
      } finally {
        setEnteringApp(false);
      }
    },
    [session.authenticated, session.user, hydrateMaps],
  );

  const handleSwitchCreatorRole = useCallback(async (role: AccessRole) => {
    try {
      const updated = await switchCreatorRole(role);
      setSession(updated);
      setActiveView(role === 'admin' ? 'creator' : 'fuel');
    } catch {
      // Ignore transient errors
    }
  }, []);

  const handleLogout = useCallback(
    async (targetMode: 'register' | 'login' | 'guest' | 'creator' = 'register') => {
      stopLiveGps();
      try {
        await logoutDriver();
      } catch {
        // Always complete client logout even if server call fails
      } finally {
        setSession(EMPTY_SESSION);
        setInitialGateMode(targetMode);
        setActiveView('fuel');
        setShowRouteMapOnFuel(false);
      }
    },
    [stopLiveGps],
  );

  const handleQuotaExceeded = useCallback(() => setQuotaExceeded(true), []);
  const handleClearGpsError = useCallback(() => setGpsError(null), []);
  const handleClearRequestedFuel = useCallback(() => setFuelingRequestedFuel(null), []);
  const handleGoToCards = useCallback(() => setActiveView('profile'), []);
  const handleGoToFuel = useCallback(() => setActiveView('fuel'), []);
  const handleOpenAssistant = useCallback(() => setActiveView('assistant'), []);
  const handleOpenStationsMap = useCallback((preferredFuel?: FuelCode) => {
    if (preferredFuel) setStationFuelFilter(preferredFuel);
    setActiveView('stations');
  }, []);
  const handleSelectStationFromAssistant = useCallback(
    (id: string, preferredFuel?: FuelCode, navigateTo?: 'fuel' | 'stations') => {
      setSelectedStationId(id);
      if (preferredFuel) {
        setFuelingRequestedFuel(preferredFuel);
        setStationFuelFilter(preferredFuel);
      }
      if (navigateTo === 'stations') {
        setActiveView('stations');
      } else if (navigateTo === 'fuel') {
        setShowRouteMapOnFuel(true);
        setActiveView('fuel');
      }
    },
    [],
  );
  const handleChooseStation = useCallback(
    (id: string, preferredFuel?: FuelCode) => {
      setSelectedStationId(id);
      setShowRouteMapOnFuel(true);
      if (preferredFuel) {
        setFuelingRequestedFuel(preferredFuel);
      }
      if (session.isCreator && session.creatorRole === 'admin') {
        void handleSwitchCreatorRole('driver');
      } else {
        setActiveView('fuel');
      }
    },
    [session.isCreator, session.creatorRole, handleSwitchCreatorRole],
  );
  const handleCreatorSessionUpdate = useCallback((nextPayload: SessionPayload) => {
    setSession(nextPayload);
    if (!nextPayload.isCreator && !canAccessApp(nextPayload.user)) {
      setActiveView('fuel');
    }
  }, []);
  const handleSwitchCreatorToDriver = useCallback(() => {
    void handleSwitchCreatorRole('driver');
  }, [handleSwitchCreatorRole]);

  if (loading || !splashDismissed) {
    return (
      <AppLoadingSplash
        isLoading={loading}
        subtitle={t.loadingSubtitle}
        onProceed={() => setSplashDismissed(true)}
      />
    );
  }

  if (enteringApp) {
    return <AppLoadingSplash isLoading subtitle={t.enteringApp} />;
  }

  const hasDriver =
    session.authenticated && canAccessApp(session.user) && Boolean(session.user);

  // Strict Gate: Drivers must register & bind a card (or active <=3d Guest); Creator via Morzhowich88
  if (!hasDriver && !session.isCreator) {
    if (preAuthShowcaseOpen) {
      return (
        <ShowcaseView
          isAuthenticatedDemo={false}
          onNavigateView={setActiveView}
          onStartDemoAtView={handleDemoJumpFromShowcase}
          onBackToGate={() => setPreAuthShowcaseOpen(false)}
        />
      );
    }
    return (
      <AuthCardGate
        onSuccess={handleGateSuccess}
        initialMode={initialGateMode}
        guestExpiredNotice={guestExpiredBanner}
        onOpenShowcase={() => setPreAuthShowcaseOpen(true)}
      />
    );
  }

  const adminOnly = session.isCreator && session.creatorRole === 'admin';

  return (
    <MusicPlayerProvider enabled={hasDriver || session.isCreator}>
      <FuelingOrderChimeObserver activeOrder={session.activeOrder} />
      <div
        data-testid="authenticated-app"
        className="min-h-screen bg-[var(--dz-bg)] pb-20 text-[var(--dz-ink)] md:pb-12"
      >
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800 dark:text-amber-200 dark:hover:text-white"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <TopNav
        activeView={activeView}
        isCreator={session.isCreator}
        creatorRole={session.creatorRole}
        onSelectView={setActiveView}
        onSwitchCreatorRole={handleSwitchCreatorRole}
        onLogout={() => handleLogout('register')}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
        {session.isGuest && session.guestExpiresAt && !adminOnly && (
          <div
            data-testid="guest-mode-banner"
            className="dz-panel-enter mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--dz-primary)]/25 bg-[var(--dz-surface-tint)] px-4 py-3 text-xs sm:text-sm"
          >
            <div className="flex flex-wrap items-center gap-2 text-[var(--dz-ink)]">
              <Clock
                className="h-4 w-4 shrink-0 text-[var(--dz-primary)]"
                aria-hidden="true"
              />
              <span className="font-semibold">{t.guestBannerLabel}:</span>
              <span className="font-mono-tabular font-bold text-[var(--dz-primary)]">
                {formatGuestRemaining(session.guestExpiresAt, lang, nowTick)}
              </span>
              <span className="text-[var(--dz-ink-secondary)]">
                ({t.guestRuleBadge})
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleLogout('register')}
              className="dz-focus rounded-xl bg-[var(--dz-primary)] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[var(--dz-primary-hover)] whitespace-nowrap"
            >
              {t.guestUpgradeButton}
            </button>
          </div>
        )}

        <div
          key={`${activeView}-${adminOnly ? 'admin' : 'driver'}`}
          className="dz-section-enter"
        >
          {!adminOnly && activeView === 'fuel' && session.user && (
            <FuelingWorkspace
              user={session.user}
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStationId={setSelectedStationId}
              activeOrder={session.activeOrder}
              onUpdateSession={setSession}
              onGoToCards={handleGoToCards}
              mapsApiKey={mapsApiKey}
              driverLocation={driverLocation}
              locationMode={locationMode}
              selectedCity={selectedCity}
              geoPermission={geoPermission}
              locatingGps={locatingGps}
              liveGpsActive={liveGpsActive}
              gpsError={gpsError}
              onToggleLiveGps={toggleLiveGps}
              onSelectCity={selectCityOrigin}
              onStationsResolved={mergeStationLocations}
              onOriginSelected={handleManualDriverLocation}
              onQuotaExceeded={handleQuotaExceeded}
              showRouteMap={showRouteMapOnFuel}
              onToggleRouteMap={setShowRouteMapOnFuel}
              requestedFuel={fuelingRequestedFuel}
              onClearRequestedFuel={handleClearRequestedFuel}
              onOpenStationsMap={handleOpenStationsMap}
              onOpenAssistant={handleOpenAssistant}
            />
          )}

          {activeView === 'stations' && (
            <StationsDirectory
              apiKey={mapsApiKey}
              stations={stations}
              selectedStationId={selectedStationId}
              driverLocation={driverLocation}
              locationMode={locationMode}
              selectedCity={selectedCity}
              geoPermission={geoPermission}
              locatingGps={locatingGps}
              liveGpsActive={liveGpsActive}
              gpsError={gpsError}
              onToggleLiveGps={toggleLiveGps}
              onSelectCity={selectCityOrigin}
              onClearGpsError={handleClearGpsError}
              fuelFilter={stationFuelFilter}
              onChangeDriverLocation={handleManualDriverLocation}
              onChangeFuelFilter={setStationFuelFilter}
              onStationsResolved={mergeStationLocations}
              onQuotaExceeded={handleQuotaExceeded}
              onChooseStation={handleChooseStation}
            />
          )}

          {!adminOnly && activeView === 'assistant' && (
            <AssistantAndMusicView
              user={session.user}
              selectedStationId={selectedStationId}
              driverLocation={driverLocation}
              onSelectStationFromAssistant={handleSelectStationFromAssistant}
              onNavigateView={setActiveView}
              onToggleLiveGps={toggleLiveGps}
            />
          )}

          {!adminOnly && activeView === 'showcase' && (
            <ShowcaseView
              isAuthenticatedDemo
              onNavigateView={setActiveView}
              onStartDemoAtView={handleDemoJumpFromShowcase}
            />
          )}

          {!adminOnly && activeView === 'history' && (
            <HistoryLedger
              orders={session.orders}
              onGoToFuel={handleGoToFuel}
            />
          )}

          {!adminOnly && activeView === 'profile' && session.user && (
            <ProfileAndCards
              user={session.user}
              onUpdateSession={setSession}
            />
          )}

          {activeView === 'creator' && (
            <CreatorSection
              isCreator={session.isCreator}
              hasDriverAccount={hasDriver}
              onSessionUpdate={handleCreatorSessionUpdate}
              onStationsUpdated={setStations}
              onSwitchToDriver={handleSwitchCreatorToDriver}
            />
          )}
        </div>
      </main>
    </div>
    </MusicPlayerProvider>
  );
}
