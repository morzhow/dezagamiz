import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APILoadingStatus,
  APIProvider,
  ColorScheme,
  InfoWindow,
  Map as GoogleMap,
  Marker,
  Pin,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  ArrowLeft,
  Compass,
  Crosshair,
  ExternalLink,
  Globe,
  Loader2,
  Map as MapIcon,
  MapPin,
  Navigation,
  Satellite,
  Search,
  Tag,
} from 'lucide-react';
import { geocodeAddressQuery } from '../api/client';
import {
  buildGoogleMapsDirectionsUrl,
  buildGoogleMapsStreetViewUrl,
  classifyNearbyPlaceCategory,
  computeBearingDegrees,
  findNearestSnapStation,
  formatCoordinates,
  formatDistanceShort,
  haversineDistanceKm,
  pixelOffsetToLatLng,
  shouldRefreshOrigin,
} from '../lib/dezagamiz';
import { useI18n, type AppLanguage } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import type {
  FuelCode,
  LatLngPoint,
  NearbyPlaceCategory,
  NearbyPlaceItem,
  RankedStation,
} from '../types/dezagamiz';
import { InteractiveFallbackMap } from './InteractiveFallbackMap';
import { PegmanIcon, PegmanMapWidget } from './PegmanControl';
import {
  StreetView360Overlay,
  type StreetView360Target,
} from './StreetView360Overlay';

export interface ComputedRouteInfo {
  stationId: string;
  distanceMeters: number;
  durationMillis: number | null;
  steps: string[];
}

const MAP_LIBRARIES: ('places' | 'routes' | 'streetView')[] = [
  'places',
  'routes',
  'streetView',
];

const DEFAULT_MAP_ID =
  (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined)?.trim() ||
  'DEMO_MAP_ID';

interface StationsMapViewProps {
  apiKey: string;
  stations: RankedStation[];
  driverLocation: LatLngPoint | null;
  targetStationId: string | null;
  selectedStationId: string;
  fuelFilter: FuelCode | 'all';
  lang: AppLanguage;
  compact?: boolean;
  expanded?: boolean;
  hideOriginSearch?: boolean;
  showNearbyPlaces?: boolean;
  showNearbyList?: boolean;
  externalStreetViewRequest?: { stationId: string; nonce: number } | null;
  onSelectStation: (stationId: string) => void;
  onChooseAndRefuel: (stationId: string, preferredFuel?: FuelCode) => void;
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
  onOriginSelected: (point: LatLngPoint) => void;
  onRouteComputed: (info: ComputedRouteInfo | null) => void;
  onRouteLoadingChange?: (loading: boolean) => void;
  onQuotaExceeded: () => void;
}

interface MapViewModeBarProps {
  mapLayerMode: 'roadmap' | 'satellite';
  showSatelliteLabels: boolean;
  is360Active: boolean;
  onChangeLayerMode: (mode: 'roadmap' | 'satellite') => void;
  onToggleLabels: () => void;
  onOpen360: () => void;
}

function MapViewModeBar({
  mapLayerMode,
  showSatelliteLabels,
  is360Active,
  onChangeLayerMode,
  onToggleLabels,
  onOpen360,
}: MapViewModeBarProps) {
  const { t } = useI18n();
  if (is360Active) return null;

  return (
    <div
      data-testid="map-view-mode-bar"
      className="pointer-events-auto absolute left-3 top-3 z-30 flex flex-wrap items-center gap-1 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface)]/95 p-1 shadow-md backdrop-blur-md max-w-[calc(100%-24px)] sm:max-w-[calc(100%-160px)]"
    >
      <button
        type="button"
        data-testid="map-mode-roadmap"
        aria-pressed={mapLayerMode === 'roadmap'}
        onClick={() => onChangeLayerMode('roadmap')}
        className={`dz-focus inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
          mapLayerMode === 'roadmap'
            ? 'dz-dark-active-glow bg-[var(--dz-primary)] text-white shadow-xs'
            : 'text-[var(--dz-ink-secondary)] hover:bg-[var(--dz-surface-tint)] hover:text-[var(--dz-ink)]'
        }`}
      >
        <MapIcon className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t.mapLayerRoadmap}</span>
      </button>

      <button
        type="button"
        data-testid="map-mode-satellite"
        aria-pressed={mapLayerMode === 'satellite'}
        onClick={() => onChangeLayerMode('satellite')}
        className={`dz-focus inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
          mapLayerMode === 'satellite'
            ? 'dz-dark-active-glow bg-[var(--dz-primary)] text-white shadow-xs'
            : 'text-[var(--dz-ink-secondary)] hover:bg-[var(--dz-surface-tint)] hover:text-[var(--dz-ink)]'
        }`}
      >
        <Satellite className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t.mapLayerSatellite}</span>
      </button>

      {mapLayerMode === 'satellite' && (
        <button
          type="button"
          data-testid="map-satellite-labels-toggle"
          aria-pressed={showSatelliteLabels}
          onClick={onToggleLabels}
          className={`dz-focus inline-flex items-center gap-1 rounded-xl border px-2 py-1.5 text-[11px] font-semibold transition-all whitespace-nowrap ${
            showSatelliteLabels
              ? 'border-[#0A7E42]/40 bg-[#E9F7EF] dark:bg-[#0D2B22] text-[#0A7E42] dark:text-[#34D399]'
              : 'border-[var(--dz-border)] bg-transparent text-[var(--dz-ink-muted)] hover:text-[var(--dz-ink)]'
          }`}
        >
          <Tag className="h-3 w-3" aria-hidden="true" />
          <span>{t.mapSatelliteLabels}</span>
        </button>
      )}

      <button
        type="button"
        data-testid="map-mode-360"
        onClick={onOpen360}
        className="dz-focus inline-flex items-center gap-1.5 rounded-xl border border-[var(--dz-primary)]/35 bg-[var(--dz-surface-tint)] px-2.5 py-1.5 text-xs font-bold text-[var(--dz-primary)] transition-all hover:bg-[#D8E7FE] dark:hover:bg-[#1E3B6B] whitespace-nowrap"
      >
        <PegmanIcon variant="badge" className="h-4 w-4" />
        <span>{t.mapView360Btn}</span>
      </button>
    </div>
  );
}

interface AutocompleteItem {
  id: string;
  label: string;
  secondary: string;
  prediction: google.maps.places.PlacePrediction;
}

function isQuotaErrorMessage(err: unknown): boolean {
  const msg =
    err instanceof Error ? err.message : typeof err === 'string' ? err : String(err ?? '');
  return (
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('OVER_QUERY_LIMIT') ||
    msg.includes('QuotaExceeded') ||
    msg.includes('OverQuotaMapError') ||
    msg.includes('429')
  );
}

const NEARBY_CATEGORY_STYLES: Record<
  Exclude<NearbyPlaceCategory, 'all'>,
  { dotClass: string; badgeBg: string; badgeText: string; glyph: string }
> = {
  gas_station: {
    dotClass: 'bg-[#0B57D0] text-white border-white',
    badgeBg: 'bg-[#EBF2FF] dark:bg-[#193159]',
    badgeText: 'text-[#0B57D0] dark:text-[#60A5FA]',
    glyph: '⛽',
  },
  cafe: {
    dotClass: 'bg-[#D97706] text-white border-white',
    badgeBg: 'bg-[#FEF3C7] dark:bg-amber-950',
    badgeText: 'text-[#92400E] dark:text-amber-300',
    glyph: '☕',
  },
  store: {
    dotClass: 'bg-[#0D9488] text-white border-white',
    badgeBg: 'bg-[#CCFBF1] dark:bg-teal-950',
    badgeText: 'text-[#115E59] dark:text-teal-300',
    glyph: '🛒',
  },
  service: {
    dotClass: 'bg-[#4F46E5] text-white border-white',
    badgeBg: 'bg-[#E0E7FF] dark:bg-indigo-950',
    badgeText: 'text-[#3730A3] dark:text-indigo-300',
    glyph: '🔧',
  },
  other: {
    dotClass: 'bg-[#475569] text-white border-white',
    badgeBg: 'bg-[#F1F5F9] dark:bg-slate-800',
    badgeText: 'text-[#334155] dark:text-slate-300',
    glyph: '•',
  },
};

function MapWorkspace({
  hasGoogleKey = true,
  stations,
  driverLocation,
  targetStationId,
  selectedStationId,
  fuelFilter,
  lang,
  compact = false,
  expanded = false,
  hideOriginSearch = false,
  showNearbyPlaces = true,
  showNearbyList = true,
  externalStreetViewRequest = null,
  apiLoadFailed = false,
  onSelectStation,
  onChooseAndRefuel,
  onStationsResolved,
  onOriginSelected,
  onRouteComputed,
  onRouteLoadingChange,
  onQuotaExceeded,
}: Omit<StationsMapViewProps, 'apiKey'> & {
  apiLoadFailed?: boolean;
  hasGoogleKey?: boolean;
}) {
  const {
    t,
    fuelShortLabel,
    fuelUnit,
    formatMoney,
    localizeCity,
    localizeStationName,
    localizeStationAddress,
  } = useI18n();
  const { isDark } = useTheme();
  const map = useMap();
  const loadingStatus = useApiLoadingStatus();
  const placesLib = useMapsLibrary('places');
  const routesLib = useMapsLibrary('routes');
  const streetViewLib = useMapsLibrary('streetView');
  const [gmAuthFailed, setGmAuthFailed] = useState(false);
  const [loadTimeoutExpired, setLoadTimeoutExpired] = useState(false);

  useEffect(() => {
    const win = window as Window & { gm_authFailure?: () => void };
    const prev = win.gm_authFailure;
    win.gm_authFailure = () => {
      setGmAuthFailed(true);
      prev?.();
    };
    return () => {
      win.gm_authFailure = prev;
    };
  }, []);

  useEffect(() => {
    if (
      loadingStatus === APILoadingStatus.LOADED ||
      loadingStatus === APILoadingStatus.FAILED ||
      loadingStatus === APILoadingStatus.AUTH_FAILURE
    ) {
      setLoadTimeoutExpired(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setLoadTimeoutExpired(true);
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [loadingStatus]);

  const isFallbackMode =
    apiLoadFailed ||
    gmAuthFailed ||
    loadTimeoutExpired ||
    loadingStatus === APILoadingStatus.FAILED ||
    loadingStatus === APILoadingStatus.AUTH_FAILURE;

  const [mapLayerMode, setMapLayerMode] = useState<'roadmap' | 'satellite'>('roadmap');
  const [showSatelliteLabels, setShowSatelliteLabels] = useState<boolean>(true);
  const [streetViewTarget, setStreetViewTarget] = useState<StreetView360Target | null>(
    null,
  );
  const [isGoogleStreetViewOpen, setIsGoogleStreetViewOpen] = useState<boolean>(false);
  const [googleStreetViewTitle, setGoogleStreetViewTitle] = useState<string>('');
  const [googleStreetViewPoint, setGoogleStreetViewPoint] = useState<LatLngPoint | null>(
    null,
  );
  const [lookingUpStreetView, setLookingUpStreetView] = useState<boolean>(false);
  const [pegmanDragging, setPegmanDragging] = useState<boolean>(false);
  const [followDriver, setFollowDriver] = useState<boolean>(true);

  const [infoStationId, setInfoStationId] = useState<string | null>(null);
  const [selectedNearbyPlaceId, setSelectedNearbyPlaceId] = useState<
    string | null
  >(null);
  const [nearbyCategory, setNearbyCategory] =
    useState<NearbyPlaceCategory>('all');
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlaceItem[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const [originQuery, setOriginQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteItem[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [advancedMarkersAvailable, setAdvancedMarkersAvailable] =
    useState(false);
  const [capabilitiesSettled, setCapabilitiesSettled] = useState(false);
  const [mapIdUnavailable, setMapIdUnavailable] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const fallbackViewportRef = useRef<{ lat: number; lng: number; zoom: number }>({
    lat: 41.3111,
    lng: 69.2797,
    zoom: 12,
  });
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(
    null,
  );
  const attemptedStationLookupRef = useRef<Record<string, boolean>>({});
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const accuracyCircleRef = useRef<google.maps.Circle | null>(null);
  const lastRoutedMapRef = useRef<google.maps.Map | null>(null);
  const lastRoutedOriginRef = useRef<LatLngPoint | null>(null);
  const lastRoutedStationIdRef = useRef<string | null>(null);
  const lastRoutedLangRef = useRef<AppLanguage | null>(null);
  const lastNearbyOriginRef = useRef<LatLngPoint | null>(null);
  const lastNearbyLangRef = useRef<AppLanguage | null>(null);
  const lastHandledSvNonceRef = useRef<number>(0);
  const prevIsLiveRef = useRef<boolean>(Boolean(driverLocation?.isLive));
  const initialCenteredRef = useRef<boolean>(false);

  const onStationsResolvedRef = useRef(onStationsResolved);
  onStationsResolvedRef.current = onStationsResolved;
  const onRouteComputedRef = useRef(onRouteComputed);
  onRouteComputedRef.current = onRouteComputed;
  const onRouteLoadingChangeRef = useRef(onRouteLoadingChange);
  onRouteLoadingChangeRef.current = onRouteLoadingChange;
  const onQuotaExceededRef = useRef(onQuotaExceeded);
  onQuotaExceededRef.current = onQuotaExceeded;

  const clearPolylines = useCallback(() => {
    for (const line of polylinesRef.current) {
      line.setMap(null);
    }
    polylinesRef.current = [];
  }, []);

  // Unmount cleanup for polylines and accuracy circle
  useEffect(() => {
    return () => {
      clearPolylines();
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setMap(null);
        accuracyCircleRef.current = null;
      }
    };
  }, [clearPolylines]);

  // Listen for runtime Map ID fetch failures so subsequent renders skip invalid mapId
  useEffect(() => {
    const handleMapIdUnavailable = () => {
      setMapIdUnavailable(true);
      setAdvancedMarkersAvailable(false);
      setCapabilitiesSettled(true);
    };
    window.addEventListener('gmp-mapid-unavailable', handleMapIdUnavailable);
    return () => {
      window.removeEventListener(
        'gmp-mapid-unavailable',
        handleMapIdUnavailable,
      );
    };
  }, []);

  // Sync MapCapabilities to verify whether Advanced Markers are supported on the active map
  useEffect(() => {
    if (!map) {
      setAdvancedMarkersAvailable(false);
      setCapabilitiesSettled(false);
      return;
    }
    const syncCapabilities = () => {
      const caps = map.getMapCapabilities?.();
      if (caps && typeof caps.isAdvancedMarkersAvailable === 'boolean') {
        setAdvancedMarkersAvailable(caps.isAdvancedMarkersAvailable);
        if (caps.isAdvancedMarkersAvailable) {
          setCapabilitiesSettled(true);
        }
      }
    };
    syncCapabilities();
    const capListener = map.addListener(
      'mapcapabilities_changed',
      () => {
        syncCapabilities();
        setCapabilitiesSettled(true);
      },
    );
    const idleListener = map.addListener('idle', () => {
      syncCapabilities();
      setCapabilitiesSettled(true);
    });
    return () => {
      capListener.remove();
      idleListener.remove();
    };
  }, [map]);

  // Sync built-in Google Street View Panorama visibility listener (including Pegman drops)
  useEffect(() => {
    if (!map) return;
    const pano = map.getStreetView?.();
    if (!pano) return;
    const visListener = pano.addListener('visible_changed', () => {
      const visible = Boolean(pano.getVisible());
      setIsGoogleStreetViewOpen(visible);
      if (visible) {
        setStreetViewTarget(null);
        const pos = pano.getPosition();
        if (pos) {
          setGoogleStreetViewPoint({
            lat: pos.lat(),
            lng: pos.lng(),
          });
        }
      }
    });
    return () => {
      visListener.remove();
    };
  }, [map]);

  // Notify top-level app if Maps JS API fails authentication/quota
  useEffect(() => {
    if (loadingStatus === APILoadingStatus.AUTH_FAILURE) {
      onQuotaExceededRef.current();
    }
  }, [loadingStatus]);

  // Client-side Places resolution for any catalog station lacking verified coordinates yet
  useEffect(() => {
    if (!placesLib) return;
    const missing = stations.filter(
      (s) =>
        (typeof s.lat !== 'number' || typeof s.lng !== 'number') &&
        !attemptedStationLookupRef.current[s.id],
    );
    if (missing.length === 0) return;

    let cancelled = false;

    async function resolveMissingStations() {
      const resolvedMap: Record<
        string,
        {
          lat: number;
          lng: number;
          placeId?: string;
          formattedAddress?: string;
        }
      > = {};

      for (const station of missing) {
        if (cancelled) break;
        attemptedStationLookupRef.current[station.id] = true;
        try {
          const response = await placesLib!.Place.searchByText({
            textQuery: station.geocodeQuery,
            fields: ['id', 'location', 'formattedAddress'],
            region: 'uz',
            maxResultCount: 1,
            internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
          });
          const topPlace = response?.places?.[0];
          const loc = topPlace?.location;
          if (loc) {
            resolvedMap[station.id] = {
              lat: typeof loc.lat === 'function' ? loc.lat() : Number(loc.lat),
              lng: typeof loc.lng === 'function' ? loc.lng() : Number(loc.lng),
              placeId: topPlace.id,
              formattedAddress: topPlace.formattedAddress ?? undefined,
            };
          }
        } catch (err) {
          if (isQuotaErrorMessage(err)) {
            onQuotaExceededRef.current();
            break;
          }
        }
      }

      if (!cancelled && Object.keys(resolvedMap).length > 0) {
        onStationsResolvedRef.current(resolvedMap);
      }
    }

    void resolveMissingStations();

    return () => {
      cancelled = true;
    };
  }, [placesLib, stations]);

  // Fetch all nearby places around driver's location using Places API (New) searchNearby
  useEffect(() => {
    if (!showNearbyPlaces || !placesLib || !driverLocation) return;

    const originMovedEnough = shouldRefreshOrigin(
      lastNearbyOriginRef.current,
      driverLocation,
      250,
    );
    const langChanged = lastNearbyLangRef.current !== lang;
    if (!originMovedEnough && !langChanged) {
      return;
    }

    const originSnapshot: LatLngPoint = {
      lat: driverLocation.lat,
      lng: driverLocation.lng,
    };
    lastNearbyOriginRef.current = originSnapshot;
    lastNearbyLangRef.current = lang;

    let cancelled = false;
    setNearbyLoading(true);

    async function loadNearbyPlaces() {
      try {
        const res = await placesLib!.Place.searchNearby({
          fields: [
            'id',
            'displayName',
            'location',
            'formattedAddress',
            'primaryType',
            'primaryTypeDisplayName',
            'types',
            'googleMapsURI',
          ],
          locationRestriction: {
            center: { lat: originSnapshot.lat, lng: originSnapshot.lng },
            radius: 3000,
          },
          maxResultCount: 16,
          rankPreference: 'DISTANCE',
          language: lang,
          region: 'uz',
          internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
        });

        if (cancelled) return;
        const parsed: NearbyPlaceItem[] = [];
        for (const place of res?.places ?? []) {
          const loc = place.location;
          if (!loc) continue;
          const pLat = typeof loc.lat === 'function' ? loc.lat() : Number(loc.lat);
          const pLng = typeof loc.lng === 'function' ? loc.lng() : Number(loc.lng);
          if (!Number.isFinite(pLat) || !Number.isFinite(pLng)) continue;

          const category = classifyNearbyPlaceCategory(
            place.primaryType,
            place.types,
          );
          const distanceKm = haversineDistanceKm(originSnapshot, {
            lat: pLat,
            lng: pLng,
          });
          parsed.push({
            id: place.id || `${pLat.toFixed(5)}-${pLng.toFixed(5)}`,
            name: place.displayName || place.primaryTypeDisplayName || '—',
            address: place.formattedAddress || '',
            category,
            primaryTypeLabel:
              place.primaryTypeDisplayName || place.primaryType || '',
            lat: pLat,
            lng: pLng,
            distanceKm,
            googleMapsURI: place.googleMapsURI ?? undefined,
          });
        }
        parsed.sort((a, b) => a.distanceKm - b.distanceKm);
        setNearbyPlaces(parsed);
      } catch (err) {
        if (isQuotaErrorMessage(err)) {
          onQuotaExceededRef.current();
        }
      } finally {
        if (!cancelled) {
          setNearbyLoading(false);
        }
      }
    }

    void loadNearbyPlaces();

    return () => {
      cancelled = true;
    };
  }, [
    showNearbyPlaces,
    placesLib,
    driverLocation?.lat,
    driverLocation?.lng,
    lang,
  ]);

  // Debounced Places Autocomplete (New) for custom starting point in Uzbekistan
  useEffect(() => {
    if (hideOriginSearch) return;
    const trimmed = originQuery.trim();
    if (!placesLib || trimmed.length < 3) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSearchingPlaces(true);
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
        const res =
          await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: trimmed,
            sessionToken: sessionTokenRef.current,
            includedRegionCodes: ['uz'],
            language: lang,
          });

        if (cancelled) return;
        const items: AutocompleteItem[] = [];
        for (const suggestion of res?.suggestions ?? []) {
          const pred = suggestion.placePrediction;
          if (!pred) continue;
          items.push({
            id: pred.placeId,
            label: pred.mainText?.text || pred.text?.text || '',
            secondary: pred.secondaryText?.text || '',
            prediction: pred,
          });
        }
        setSuggestions(items.slice(0, 5));
      } catch (err) {
        if (isQuotaErrorMessage(err)) {
          onQuotaExceededRef.current();
        }
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setSearchingPlaces(false);
      }
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [hideOriginSearch, originQuery, placesLib, lang]);

  async function handleSelectSuggestion(item: AutocompleteItem) {
    try {
      const place = item.prediction.toPlace();
      await place.fetchFields({
        fields: ['location', 'formattedAddress', 'displayName'],
      });
      // Reset session token immediately after fetchFields closes the billing session
      if (placesLib) {
        sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
      }
      const loc = place.location;
      if (loc) {
        const lat = typeof loc.lat === 'function' ? loc.lat() : Number(loc.lat);
        const lng = typeof loc.lng === 'function' ? loc.lng() : Number(loc.lng);
        const label =
          place.displayName || place.formattedAddress || item.label;
        onOriginSelected({ lat, lng, label, isLive: false });
        setOriginQuery(label);
        setSuggestions([]);
      }
    } catch (err) {
      if (isQuotaErrorMessage(err)) {
        onQuotaExceeded();
      }
    }
  }

  const targetStation = useMemo(
    () => stations.find((s) => s.id === targetStationId) || null,
    [stations, targetStationId],
  );

  // Compute driving route via Routes JS SDK (`Route.computeRoutes`) throttled at 60m on live GPS moves
  useEffect(() => {
    if (isFallbackMode) {
      clearPolylines();
      return;
    }
    if (
      !routesLib ||
      !map ||
      !driverLocation ||
      !targetStation ||
      typeof targetStation.lat !== 'number' ||
      typeof targetStation.lng !== 'number'
    ) {
      clearPolylines();
      lastRoutedMapRef.current = null;
      lastRoutedOriginRef.current = null;
      lastRoutedStationIdRef.current = null;
      onRouteComputedRef.current(null);
      onRouteLoadingChangeRef.current?.(false);
      return;
    }

    const mapChanged = lastRoutedMapRef.current !== map;
    const stationChanged = lastRoutedStationIdRef.current !== targetStation.id;
    const langChanged = lastRoutedLangRef.current !== lang;
    const movedEnough = shouldRefreshOrigin(
      lastRoutedOriginRef.current,
      driverLocation,
      60,
    );

    if (
      !mapChanged &&
      !stationChanged &&
      !langChanged &&
      !movedEnough &&
      polylinesRef.current.length > 0
    ) {
      return;
    }

    const activeMap = map;
    const activeRoutesLib = routesLib;
    const activeOrigin: LatLngPoint = {
      lat: driverLocation.lat,
      lng: driverLocation.lng,
    };
    const activeTarget = targetStation;
    const destLat = activeTarget.lat as number;
    const destLng = activeTarget.lng as number;
    const shouldFitViewport =
      mapChanged || stationChanged || polylinesRef.current.length === 0;

    lastRoutedMapRef.current = activeMap;
    lastRoutedOriginRef.current = activeOrigin;
    lastRoutedStationIdRef.current = activeTarget.id;
    lastRoutedLangRef.current = lang;

    let cancelled = false;
    onRouteLoadingChangeRef.current?.(true);

    async function compute() {
      try {
        const result = await activeRoutesLib.Route.computeRoutes({
          origin: { lat: activeOrigin.lat, lng: activeOrigin.lng },
          destination: { lat: destLat, lng: destLng },
          travelMode: 'DRIVING' as google.maps.TravelModeString,
          fields: [
            'path',
            'distanceMeters',
            'durationMillis',
            'viewport',
            'legs',
            'localizedValues',
          ],
          language: lang,
          region: 'uz',
        });

        if (cancelled) return;
        const primaryRoute = result?.routes?.[0];
        clearPolylines();

        if (!primaryRoute) {
          onRouteComputedRef.current(null);
          return;
        }

        const created = primaryRoute.createPolylines({
          polylineOptions: {
            strokeColor: '#0B57D0',
            strokeWeight: 6,
            strokeOpacity: 0.9,
          },
        });
        for (const poly of created) {
          poly.setMap(activeMap);
        }
        polylinesRef.current = created;

        if (shouldFitViewport) {
          if (primaryRoute.viewport) {
            activeMap.fitBounds(primaryRoute.viewport, 48);
          } else {
            activeMap.panTo({ lat: destLat, lng: destLng });
          }
        }

        const steps: string[] = [];
        const legs = primaryRoute.legs ?? [];
        for (const leg of legs) {
          for (const step of leg.steps ?? []) {
            if (step.instructions && step.instructions.trim()) {
              steps.push(step.instructions.trim());
            }
            if (steps.length >= 6) break;
          }
          if (steps.length >= 6) break;
        }

        onRouteComputedRef.current({
          stationId: activeTarget.id,
          distanceMeters: primaryRoute.distanceMeters ?? 0,
          durationMillis: primaryRoute.durationMillis ?? null,
          steps,
        });
      } catch (err) {
        if (!cancelled) {
          onRouteComputedRef.current(null);
          if (isQuotaErrorMessage(err)) {
            onQuotaExceededRef.current();
          }
        }
      } finally {
        if (!cancelled) {
          onRouteLoadingChangeRef.current?.(false);
        }
      }
    }

    void compute();

    return () => {
      cancelled = true;
    };
  }, [
    isFallbackMode,
    routesLib,
    map,
    driverLocation?.lat,
    driverLocation?.lng,
    targetStation?.id,
    targetStation?.lat,
    targetStation?.lng,
    lang,
    clearPolylines,
  ]);

  // Render live GPS accuracy halo ring on Google Maps
  useEffect(() => {
    if (
      isFallbackMode ||
      !map ||
      !driverLocation ||
      !driverLocation.isLive ||
      typeof driverLocation.accuracy !== 'number' ||
      driverLocation.accuracy <= 0 ||
      typeof google === 'undefined' ||
      !google.maps?.Circle
    ) {
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setMap(null);
        accuracyCircleRef.current = null;
      }
      return;
    }

    const center = { lat: driverLocation.lat, lng: driverLocation.lng };
    if (!accuracyCircleRef.current) {
      accuracyCircleRef.current = new google.maps.Circle({
        map,
        center,
        radius: driverLocation.accuracy,
        fillColor: '#0B57D0',
        fillOpacity: 0.14,
        strokeColor: '#0B57D0',
        strokeOpacity: 0.45,
        strokeWeight: 1.5,
        clickable: false,
        zIndex: 5,
      });
    } else {
      accuracyCircleRef.current.setCenter(center);
      accuracyCircleRef.current.setRadius(driverLocation.accuracy);
      if (accuracyCircleRef.current.getMap() !== map) {
        accuracyCircleRef.current.setMap(map);
      }
    }
  }, [
    isFallbackMode,
    map,
    driverLocation?.lat,
    driverLocation?.lng,
    driverLocation?.accuracy,
    driverLocation?.isLive,
  ]);

  // Pause Follow-Me camera when the user drags the Google Map manually
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('dragstart', () => {
      setFollowDriver(false);
    });
    return () => {
      listener.remove();
    };
  }, [map]);

  // Re-engage Follow-Me automatically when live GPS transitions from off -> on
  useEffect(() => {
    const isLive = Boolean(driverLocation?.isLive);
    if (isLive && !prevIsLiveRef.current) {
      setFollowDriver(true);
    }
    prevIsLiveRef.current = isLive;
  }, [driverLocation?.isLive]);

  // Smoothly follow driver when live GPS updates and Follow-Me is active, or center initially
  useEffect(() => {
    if (!map) return;
    if (
      driverLocation?.isLive &&
      followDriver &&
      !infoStationId &&
      !selectedNearbyPlaceId
    ) {
      map.panTo({ lat: driverLocation.lat, lng: driverLocation.lng });
      initialCenteredRef.current = true;
      return;
    }
    if (!initialCenteredRef.current) {
      if (driverLocation && !targetStation) {
        map.panTo({ lat: driverLocation.lat, lng: driverLocation.lng });
        map.setZoom(12);
        initialCenteredRef.current = true;
      } else if (!driverLocation && stations.length > 0) {
        const firstResolved = stations.find(
          (s) => typeof s.lat === 'number' && typeof s.lng === 'number',
        );
        if (firstResolved) {
          map.panTo({
            lat: firstResolved.lat as number,
            lng: firstResolved.lng as number,
          });
          initialCenteredRef.current = true;
        }
      }
    }
  }, [
    map,
    followDriver,
    infoStationId,
    selectedNearbyPlaceId,
    driverLocation?.lat,
    driverLocation?.lng,
    driverLocation?.isLive,
    targetStation,
    stations,
  ]);

  const activeInfoStation = useMemo(
    () =>
      stations.find(
        (s) =>
          s.id === infoStationId &&
          typeof s.lat === 'number' &&
          typeof s.lng === 'number',
      ) || null,
    [stations, infoStationId],
  );

  const filteredNearbyPlaces = useMemo(
    () =>
      nearbyCategory === 'all'
        ? nearbyPlaces
        : nearbyPlaces.filter((p) => p.category === nearbyCategory),
    [nearbyPlaces, nearbyCategory],
  );

  const activeNearbyPlace = useMemo(
    () => nearbyPlaces.find((p) => p.id === selectedNearbyPlaceId) || null,
    [nearbyPlaces, selectedNearbyPlaceId],
  );

  const infoFuelCode: FuelCode =
    fuelFilter !== 'all' && activeInfoStation?.prices[fuelFilter]
      ? fuelFilter
      : activeInfoStation?.prices.metan
        ? 'metan'
        : activeInfoStation?.prices.propan
          ? 'propan'
          : 'ai92';

  const mapHeightClass = compact
    ? 'h-[280px] sm:h-[320px]'
    : expanded
      ? 'h-[480px] sm:h-[580px]'
      : 'h-[380px] sm:h-[440px]';

  const categoryChips: { id: NearbyPlaceCategory; label: string }[] = [
    { id: 'all', label: t.nearbyAll },
    { id: 'gas_station', label: t.nearbyGas },
    { id: 'cafe', label: t.nearbyFood },
    { id: 'store', label: t.nearbyStore },
    { id: 'service', label: t.nearbyService },
  ];

  function handleFocusNearbyPlace(place: NearbyPlaceItem) {
    setInfoStationId(null);
    setSelectedNearbyPlaceId(place.id);
    if (map) {
      map.panTo({ lat: place.lat, lng: place.lng });
      const currentZoom = map.getZoom();
      if (!currentZoom || currentZoom < 14) {
        map.setZoom(15);
      }
    }
  }

  const resolveDefault360Target = useCallback(
    (explicitStation?: RankedStation | null): StreetView360Target => {
      const candidate =
        explicitStation ||
        activeInfoStation ||
        targetStation ||
        stations.find(
          (s) =>
            s.id === selectedStationId &&
            typeof s.lat === 'number' &&
            typeof s.lng === 'number',
        ) ||
        stations.find(
          (s) => typeof s.lat === 'number' && typeof s.lng === 'number',
        ) ||
        null;

      if (
        candidate &&
        typeof candidate.lat === 'number' &&
        typeof candidate.lng === 'number'
      ) {
        return {
          lat: candidate.lat,
          lng: candidate.lng,
          title: localizeStationName(candidate.id, candidate.name),
          subtitle:
            candidate.formattedAddress ||
            localizeStationAddress(candidate.id, candidate.address),
          stationId: candidate.id,
        };
      }
      if (driverLocation) {
        return {
          lat: driverLocation.lat,
          lng: driverLocation.lng,
          title: driverLocation.label
            ? localizeCity(driverLocation.label)
            : t.youAreHere,
        };
      }
      return {
        lat: 41.3111,
        lng: 69.2797,
        title: `${localizeCity('Ташкент')} · dezagamiz`,
      };
    },
    [
      activeInfoStation,
      targetStation,
      stations,
      selectedStationId,
      driverLocation,
      t.youAreHere,
      localizeCity,
      localizeStationName,
      localizeStationAddress,
    ],
  );

  const handleClose360View = useCallback(() => {
    setStreetViewTarget(null);
    setLookingUpStreetView(false);
    if (map) {
      try {
        const pano = map.getStreetView?.();
        if (pano?.getVisible?.()) {
          pano.setVisible(false);
        }
      } catch {
        // Ignore if StreetViewPanorama unavailable
      }
    }
    setIsGoogleStreetViewOpen(false);
  }, [map]);

  const open360AtTarget = useCallback(
    async (target: StreetView360Target) => {
      setInfoStationId(null);

      // If fallback map or StreetView library unavailable, open custom StreetView360Overlay directly
      if (isFallbackMode || !map || !streetViewLib?.StreetViewService) {
        setIsGoogleStreetViewOpen(false);
        setStreetViewTarget(target);
        return;
      }

      setLookingUpStreetView(true);
      try {
        const svService = new streetViewLib.StreetViewService();
        let panoData: google.maps.StreetViewPanoramaData | null = null;

        try {
          const res = await svService.getPanorama({
            location: { lat: target.lat, lng: target.lng },
            radius: 400,
            preference: streetViewLib.StreetViewPreference?.NEAREST,
          });
          panoData = res?.data ?? null;
        } catch {
          try {
            const wider = await svService.getPanorama({
              location: { lat: target.lat, lng: target.lng },
              radius: 2000,
              preference: streetViewLib.StreetViewPreference?.NEAREST,
            });
            panoData = wider?.data ?? null;
          } catch {
            panoData = null;
          }
        }

        const panoLatLng = panoData?.location?.latLng;
        if (panoLatLng && map.getStreetView) {
          const pano = map.getStreetView();
          const pLat = panoLatLng.lat();
          const pLng = panoLatLng.lng();
          const initialHeading = computeBearingDegrees(
            { lat: pLat, lng: pLng },
            { lat: target.lat, lng: target.lng },
          );
          pano.setPosition(panoLatLng);
          pano.setPov({ heading: initialHeading, pitch: 4 });
          pano.setOptions({
            addressControl: false,
            enableCloseButton: false,
            motionTracking: false,
            linksControl: true,
            panControl: true,
            zoomControl: true,
          });
          pano.setVisible(true);
          setStreetViewTarget(null);
          setGoogleStreetViewTitle(target.title);
          setGoogleStreetViewPoint({ lat: pLat, lng: pLng });
          setIsGoogleStreetViewOpen(true);
          return;
        }
      } catch {
        // Fall through to interactive 360° satellite/street overlay
      } finally {
        setLookingUpStreetView(false);
      }

      setIsGoogleStreetViewOpen(false);
      setStreetViewTarget(target);
    },
    [isFallbackMode, map, streetViewLib],
  );

  const handleOpen360ForTarget = useCallback(
    async (explicitStation?: RankedStation | null) => {
      const target = resolveDefault360Target(explicitStation);
      await open360AtTarget(target);
    },
    [resolveDefault360Target, open360AtTarget],
  );

  const getActiveMapViewport = useCallback(() => {
    if (!isFallbackMode && map) {
      const center = map.getCenter?.();
      const zoom = map.getZoom?.();
      return {
        lat: center ? center.lat() : 41.3111,
        lng: center ? center.lng() : 69.2797,
        zoom: typeof zoom === 'number' && Number.isFinite(zoom) ? zoom : 12,
      };
    }
    return fallbackViewportRef.current;
  }, [isFallbackMode, map]);

  const resolvePegmanDrop = useCallback(
    (xPx: number, yPx: number, width: number, height: number): StreetView360Target => {
      const vp = getActiveMapViewport();
      const snapped = findNearestSnapStation(
        xPx,
        yPx,
        vp.lat,
        vp.lng,
        vp.zoom,
        width,
        height,
        stations,
        44,
      );
      if (snapped && typeof snapped.lat === 'number' && typeof snapped.lng === 'number') {
        onSelectStation(snapped.id);
        return {
          lat: snapped.lat,
          lng: snapped.lng,
          title: localizeStationName(snapped.id, snapped.name),
          subtitle:
            snapped.formattedAddress ||
            localizeStationAddress(snapped.id, snapped.address),
          stationId: snapped.id,
        };
      }
      const pt = pixelOffsetToLatLng(
        vp.lat,
        vp.lng,
        vp.zoom,
        xPx - width / 2,
        yPx - height / 2,
      );
      return {
        lat: pt.lat,
        lng: pt.lng,
        title: t.pegmanDroppedPointLabel,
        subtitle: formatCoordinates(pt.lat, pt.lng),
      };
    },
    [
      getActiveMapViewport,
      stations,
      onSelectStation,
      t.pegmanDroppedPointLabel,
      localizeStationName,
      localizeStationAddress,
    ],
  );

  const resolvePegmanSnapPreview = useCallback(
    (xPx: number, yPx: number, width: number, height: number): string | null => {
      const vp = getActiveMapViewport();
      const snapped = findNearestSnapStation(
        xPx,
        yPx,
        vp.lat,
        vp.lng,
        vp.zoom,
        width,
        height,
        stations,
        44,
      );
      return snapped ? localizeStationName(snapped.id, snapped.name) : null;
    },
    [getActiveMapViewport, stations, localizeStationName],
  );

  // Trigger 360° panorama when requested externally from station directory card
  useEffect(() => {
    if (
      !externalStreetViewRequest ||
      externalStreetViewRequest.nonce === lastHandledSvNonceRef.current
    ) {
      return;
    }
    lastHandledSvNonceRef.current = externalStreetViewRequest.nonce;
    const match =
      stations.find((s) => s.id === externalStreetViewRequest.stationId) || null;
    void handleOpen360ForTarget(match);
  }, [externalStreetViewRequest, stations, handleOpen360ForTarget]);

  async function handleFallbackOriginGeocode() {
    const trimmed = originQuery.trim();
    if (trimmed.length < 3) return;
    setSearchingPlaces(true);
    try {
      const geo = await geocodeAddressQuery(trimmed);
      if (typeof geo.lat === 'number' && typeof geo.lng === 'number') {
        const label = geo.formattedAddress || trimmed;
        onOriginSelected({ lat: geo.lat, lng: geo.lng, label, isLive: false });
        setOriginQuery(label);
        setSuggestions([]);
      }
    } catch (err) {
      if (isQuotaErrorMessage(err)) {
        onQuotaExceeded();
      }
    } finally {
      setSearchingPlaces(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Autocomplete origin search */}
      {!hideOriginSearch && (
        <div className="relative">
          <div className="relative flex items-center">
            <Search
              className="pointer-events-none absolute left-3.5 h-4 w-4 text-[var(--dz-ink-muted)]"
              aria-hidden="true"
            />
            <input
              type="text"
              value={originQuery}
              onChange={(e) => setOriginQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (!placesLib || isFallbackMode)) {
                  e.preventDefault();
                  void handleFallbackOriginGeocode();
                }
              }}
              placeholder={t.searchOriginPlaceholder}
              aria-label={t.driverLocationLabel}
              className="dz-focus h-11 w-full rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] pl-10 pr-10 text-sm text-[var(--dz-ink)] placeholder:text-[var(--dz-ink-muted)]"
            />
            {searchingPlaces && (
              <Loader2
                className="absolute right-3.5 h-4 w-4 animate-spin text-[var(--dz-primary)]"
                aria-hidden="true"
              />
            )}
          </div>

          {suggestions.length > 0 && (
            <ul
              role="listbox"
              className="dz-panel-enter absolute left-0 right-0 top-12 z-30 max-h-60 overflow-y-auto rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-1.5 shadow-[var(--dz-shadow-card)]"
            >
              {suggestions.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => void handleSelectSuggestion(item)}
                    className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left text-xs transition-colors hover:bg-[var(--dz-surface-tint)]"
                  >
                    <MapPin
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--dz-primary)]"
                      aria-hidden="true"
                    />
                    <span>
                      <span className="block font-semibold text-[var(--dz-ink)]">
                        {item.label}
                      </span>
                      {item.secondary && (
                        <span className="block text-[11px] text-[var(--dz-ink-muted)]">
                          {item.secondary}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Interactive Google Map (with seamless interactive tile/route fallback if script cannot load) */}
      <div
        ref={mapContainerRef}
        data-testid="google-map-container"
        data-map-layer={mapLayerMode}
        style={{
          minHeight: compact ? '280px' : expanded ? '480px' : '380px',
        }}
        className={`relative ${mapHeightClass} w-full overflow-hidden rounded-3xl border border-[var(--dz-border)] bg-[#E8EFFA] dark:bg-[#0D1E3A] transition-[height] duration-200`}
      >
        <MapViewModeBar
          mapLayerMode={mapLayerMode}
          showSatelliteLabels={showSatelliteLabels}
          is360Active={Boolean(streetViewTarget) || isGoogleStreetViewOpen}
          onChangeLayerMode={(mode) => {
            setMapLayerMode(mode);
            if (isGoogleStreetViewOpen || streetViewTarget) {
              handleClose360View();
            }
          }}
          onToggleLabels={() => setShowSatelliteLabels((prev) => !prev)}
          onOpen360={() => void handleOpen360ForTarget()}
        />

        {isFallbackMode ? (
          <>
            <InteractiveFallbackMap
              stations={stations}
              driverLocation={driverLocation}
              targetStationId={targetStationId}
              selectedStationId={selectedStationId}
              fuelFilter={fuelFilter}
              lang={lang}
              mapLayerMode={mapLayerMode}
              showSatelliteLabels={showSatelliteLabels}
              pegmanDragging={pegmanDragging}
              compact={compact}
              expanded={expanded}
              onSelectStation={onSelectStation}
              onChooseAndRefuel={onChooseAndRefuel}
              onOpen360={(station) => void handleOpen360ForTarget(station)}
              onViewportChange={(vp) => {
                fallbackViewportRef.current = vp;
              }}
              onRouteComputed={onRouteComputed}
              onRouteLoadingChange={onRouteLoadingChange}
              onQuotaExceeded={onQuotaExceeded}
            />
            <div
              data-testid="map-fallback-notice"
              className="pointer-events-none absolute bottom-2 left-3 z-10 max-w-[70%] truncate rounded-lg border border-[var(--dz-border)] bg-[var(--dz-surface)]/90 px-2.5 py-1 text-[10px] font-medium text-[var(--dz-ink-secondary)] shadow-xs backdrop-blur-xs"
            >
              {t.mapFallbackActiveNote}
            </div>
          </>
        ) : (
          <>
            <GoogleMap
              mapId={mapIdUnavailable ? undefined : DEFAULT_MAP_ID}
              mapTypeId={
                mapLayerMode === 'roadmap'
                  ? 'roadmap'
                  : showSatelliteLabels
                    ? 'hybrid'
                    : 'satellite'
              }
              colorScheme={
                mapIdUnavailable
                  ? undefined
                  : isDark
                    ? ColorScheme.DARK
                    : ColorScheme.LIGHT
              }
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              defaultCenter={
                driverLocation
                  ? { lat: driverLocation.lat, lng: driverLocation.lng }
                  : { lat: 41.2995, lng: 69.2401 }
              }
              defaultZoom={12}
              gestureHandling="greedy"
              zoomControl
              cameraControl={false}
              mapTypeControl={false}
              streetViewControl={false}
              fullscreenControl
              onMapCapabilitiesChanged={(ev) => {
                const avail = Boolean(
                  ev.map?.getMapCapabilities?.()?.isAdvancedMarkersAvailable,
                );
                setAdvancedMarkersAvailable(avail);
                setCapabilitiesSettled(true);
              }}
              style={{ width: '100%', height: '100%' }}
              className="h-full w-full"
            >
              {/* Driver Live / Starting Location Pin */}
              {driverLocation &&
                (advancedMarkersAvailable ? (
                  <AdvancedMarker
                    key={driverLocation.isLive ? 'driver-live' : 'driver-static'}
                    position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
                    title={
                      driverLocation.isLive ? t.liveGpsActive : t.youAreHere
                    }
                    zIndex={50}
                  >
                    {driverLocation.isLive ? (
                      <div
                        data-testid="live-driver-marker"
                        className="relative flex items-center justify-center"
                      >
                        <span
                          aria-hidden="true"
                          className="absolute h-10 w-10 animate-ping rounded-full bg-[#0B57D0]/35"
                        />
                        <span className="relative inline-flex items-center gap-1 rounded-full border-2 border-white bg-[#092C63] px-2.5 py-1 text-[11px] font-bold text-white shadow-md">
                          <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                          <span>{t.driverMarkerSelf} · LIVE</span>
                        </span>
                      </div>
                    ) : (
                      <Pin
                        background="#092C63"
                        borderColor="#FFFFFF"
                        glyphColor="#FFFFFF"
                        glyph={t.driverMarkerSelf}
                      />
                    )}
                  </AdvancedMarker>
                ) : capabilitiesSettled || mapIdUnavailable ? (
                  <Marker
                    key={driverLocation.isLive ? 'driver-live-fb' : 'driver-static-fb'}
                    position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
                    title={
                      driverLocation.isLive ? t.liveGpsActive : t.youAreHere
                    }
                    label={{
                      text: t.driverMarkerSelf,
                      color: '#FFFFFF',
                      fontWeight: '700',
                      fontSize: '12px',
                    }}
                    zIndex={50}
                  />
                ) : null)}

              {/* Catalog Station Pins */}
              {stations.map((station) => {
                if (
                  typeof station.lat !== 'number' ||
                  typeof station.lng !== 'number'
                ) {
                  return null;
                }
                const isTarget = station.id === targetStationId;
                const isSelected = station.id === selectedStationId;
                const matches = station.supportsSelectedFuel;

                const background = isTarget
                  ? '#0A7E42'
                  : matches || isSelected
                    ? '#0B57D0'
                    : '#64748B';

                if (advancedMarkersAvailable) {
                  return (
                    <AdvancedMarker
                      key={station.id}
                      position={{ lat: station.lat, lng: station.lng }}
                      title={`${localizeStationName(station.id, station.name)} (${formatCoordinates(station.lat, station.lng)})`}
                      zIndex={isTarget ? 35 : isSelected ? 25 : 12}
                      onClick={() => {
                        setSelectedNearbyPlaceId(null);
                        setInfoStationId(station.id);
                        onSelectStation(station.id);
                      }}
                    >
                      <Pin
                        background={background}
                        borderColor={pegmanDragging ? '#38BDF8' : '#FFFFFF'}
                        glyphColor="#FFFFFF"
                        glyph={isTarget ? '★' : '⛽'}
                        scale={pegmanDragging ? 1.2 : isTarget ? 1.15 : 1}
                      />
                    </AdvancedMarker>
                  );
                }

                if (capabilitiesSettled || mapIdUnavailable) {
                  return (
                    <Marker
                      key={`${station.id}-fb`}
                      position={{ lat: station.lat, lng: station.lng }}
                      title={`${localizeStationName(station.id, station.name)} (${formatCoordinates(station.lat, station.lng)})`}
                      label={{
                        text: isTarget ? '★' : '⛽',
                        color: '#FFFFFF',
                        fontWeight: '700',
                        fontSize: '12px',
                      }}
                      zIndex={isTarget ? 35 : isSelected ? 25 : 12}
                      onClick={() => {
                        setSelectedNearbyPlaceId(null);
                        setInfoStationId(station.id);
                        onSelectStation(station.id);
                      }}
                    />
                  );
                }

                return null;
              })}

              {/* Nearby Places Pins */}
              {showNearbyPlaces &&
                filteredNearbyPlaces.map((place) => {
                  const style = NEARBY_CATEGORY_STYLES[place.category];
                  const isActive = place.id === selectedNearbyPlaceId;

                  if (advancedMarkersAvailable) {
                    return (
                      <AdvancedMarker
                        key={place.id}
                        position={{ lat: place.lat, lng: place.lng }}
                        title={`${place.name} (${formatDistanceShort(place.distanceKm, lang)})`}
                        zIndex={isActive ? 30 : 6}
                        onClick={() => handleFocusNearbyPlace(place)}
                      >
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs shadow-sm transition-transform ${
                            style.dotClass
                          } ${isActive ? 'scale-125 ring-2 ring-[#0B57D0]/40' : ''}`}
                        >
                          <span aria-hidden="true">{style.glyph}</span>
                        </div>
                      </AdvancedMarker>
                    );
                  }

                  if (capabilitiesSettled || mapIdUnavailable) {
                    return (
                      <Marker
                        key={`${place.id}-fb`}
                        position={{ lat: place.lat, lng: place.lng }}
                        title={`${place.name} (${formatDistanceShort(place.distanceKm, lang)})`}
                        label={{
                          text: style.glyph,
                          fontSize: '11px',
                        }}
                        zIndex={isActive ? 30 : 6}
                        onClick={() => handleFocusNearbyPlace(place)}
                      />
                    );
                  }

                  return null;
                })}

              {/* Catalog Station InfoWindow */}
              {activeInfoStation &&
                typeof activeInfoStation.lat === 'number' &&
                typeof activeInfoStation.lng === 'number' && (
                  <InfoWindow
                    position={{
                      lat: activeInfoStation.lat,
                      lng: activeInfoStation.lng,
                    }}
                    onCloseClick={() => setInfoStationId(null)}
                  >
                    <div className="max-w-[240px] space-y-1.5 bg-white p-1 text-[#0A1D3B]">
                      <div className="text-xs font-bold leading-snug text-[#0A1D3B]">
                        {localizeStationName(activeInfoStation.id, activeInfoStation.name)}
                      </div>
                      <div className="text-[11px] text-[#425A7A]">
                        {activeInfoStation.formattedAddress ||
                          localizeStationAddress(activeInfoStation.id, activeInfoStation.address)}
                      </div>
                      <div className="font-mono-tabular text-[11px] text-[#6C82A0]">
                        {formatCoordinates(
                          activeInfoStation.lat,
                          activeInfoStation.lng,
                        )}
                      </div>
                      {activeInfoStation.prices[infoFuelCode] && (
                        <div className="font-mono-tabular text-xs font-bold text-[#0B57D0]">
                          {fuelShortLabel(infoFuelCode)}:{' '}
                          {formatMoney(activeInfoStation.prices[infoFuelCode] as number)}{' '}
                          / {fuelUnit(infoFuelCode)}
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onChooseAndRefuel(
                              activeInfoStation.id,
                              fuelFilter !== 'all' ? fuelFilter : undefined,
                            )
                          }
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#0B57D0] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0842A0]"
                        >
                          <Navigation className="h-3 w-3" aria-hidden="true" />
                          <span>{t.refuelHereBtn}</span>
                        </button>
                        <button
                          type="button"
                          data-testid="infowindow-360-btn"
                          onClick={() => void handleOpen360ForTarget(activeInfoStation)}
                          className="inline-flex items-center justify-center gap-1 rounded-lg border border-[#0B57D0]/35 bg-[#EBF2FF] px-2 py-1.5 text-xs font-bold text-[#0B57D0] hover:bg-[#D8E7FE]"
                          title={t.mapView360Btn}
                        >
                          <Globe className="h-3 w-3" aria-hidden="true" />
                          <span>360°</span>
                        </button>
                      </div>
                    </div>
                  </InfoWindow>
                )}

              {/* Nearby Place InfoWindow */}
              {activeNearbyPlace && (
                <InfoWindow
                  position={{
                    lat: activeNearbyPlace.lat,
                    lng: activeNearbyPlace.lng,
                  }}
                  onCloseClick={() => setSelectedNearbyPlaceId(null)}
                >
                  <div className="max-w-[235px] space-y-1.5 bg-white p-1 text-[#0A1D3B]">
                    <div className="text-xs font-bold leading-snug text-[#0A1D3B]">
                      {activeNearbyPlace.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      {activeNearbyPlace.primaryTypeLabel && (
                        <span className="rounded bg-[#EBF2FF] px-1.5 py-0.5 font-semibold text-[#0B57D0]">
                          {activeNearbyPlace.primaryTypeLabel}
                        </span>
                      )}
                      <span className="font-mono-tabular font-bold text-[#425A7A]">
                        {formatDistanceShort(activeNearbyPlace.distanceKm, lang)}
                      </span>
                    </div>
                    {activeNearbyPlace.address && (
                      <div className="text-[11px] text-[#425A7A]">
                        {activeNearbyPlace.address}
                      </div>
                    )}
                    <div className="font-mono-tabular text-[11px] text-[#6C82A0]">
                      {formatCoordinates(activeNearbyPlace.lat, activeNearbyPlace.lng)}
                    </div>
                    <a
                      href={
                        activeNearbyPlace.googleMapsURI ||
                        `https://www.google.com/maps/search/?api=1&query=${activeNearbyPlace.lat},${activeNearbyPlace.lng}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-[#D7E2F0] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0B57D0] hover:bg-[#F4F7FB]"
                    >
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      <span>{t.openPlaceOnMap}</span>
                    </a>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>

            {loadingStatus === APILoadingStatus.LOADING && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#F4F7FB]/80 dark:bg-[#071122]/80">
                <div className="flex items-center gap-2 rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-4 py-2.5 text-xs font-semibold text-[var(--dz-ink)] shadow-sm">
                  <Loader2
                    className="h-4 w-4 animate-spin text-[var(--dz-primary)]"
                    aria-hidden="true"
                  />
                  <span>Google Maps...</span>
                </div>
              </div>
            )}

            {/* Native Google Street View Panorama Exit HUD */}
            {isGoogleStreetViewOpen && (
              <div
                data-testid="google-streetview-hud"
                className="pointer-events-none absolute left-3 right-3 top-3 z-30 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="pointer-events-auto flex items-center gap-2">
                  <button
                    type="button"
                    data-testid="exit-360-btn"
                    onClick={handleClose360View}
                    className="dz-focus inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-[#0B1B36]/90 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur-md hover:bg-[#13294F]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.mapExit360Btn}</span>
                  </button>
                  {googleStreetViewTitle && (
                    <span className="hidden rounded-xl border border-white/15 bg-[#0B1B36]/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md sm:inline-block">
                      {googleStreetViewTitle}
                    </span>
                  )}
                </div>

                {googleStreetViewPoint && (
                  <a
                    href={buildGoogleMapsStreetViewUrl(googleStreetViewPoint)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto dz-focus inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-[#0B57D0]/90 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md hover:bg-[#0B57D0]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{t.streetViewOpenExternal}</span>
                  </a>
                )}
              </div>
            )}

            {/* Follow-Me / Recenter button on Google Map */}
            {!streetViewTarget && !isGoogleStreetViewOpen && driverLocation && (
              <button
                type="button"
                data-testid="map-follow-driver-btn"
                aria-pressed={followDriver}
                onClick={() => {
                  setFollowDriver(true);
                  if (map) {
                    map.panTo({ lat: driverLocation.lat, lng: driverLocation.lng });
                    const curZoom = map.getZoom?.();
                    if (!curZoom || curZoom < 13) {
                      map.setZoom(14);
                    }
                  }
                }}
                className={`dz-focus pointer-events-auto absolute bottom-8 left-3 z-20 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-md backdrop-blur-md transition-all ${
                  followDriver && driverLocation.isLive
                    ? 'border-[#0A7E42]/60 bg-[#E9F7EF]/95 dark:bg-[#0D2B22]/95 text-[#0A7E42] dark:text-[#34D399]'
                    : 'border-[var(--dz-border)] bg-[var(--dz-surface)]/95 text-[var(--dz-ink)] hover:border-[var(--dz-primary)] hover:text-[var(--dz-primary)]'
                }`}
              >
                <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {followDriver && driverLocation.isLive
                    ? t.mapFollowingDriver
                    : t.mapFollowDriverBtn}
                </span>
              </button>
            )}
          </>
        )}

        <PegmanMapWidget
          isHidden={Boolean(streetViewTarget) || isGoogleStreetViewOpen}
          dockClassName={
            isFallbackMode ? 'bottom-9 right-3' : 'bottom-[110px] right-[10px]'
          }
          containerRef={mapContainerRef}
          onClickOpenDefault360={() => void handleOpen360ForTarget()}
          onDropAtOffset={(xPx, yPx, w, h) => {
            const dropTarget = resolvePegmanDrop(xPx, yPx, w, h);
            void open360AtTarget(dropTarget);
          }}
          onResolveSnapPreview={resolvePegmanSnapPreview}
          onDraggingChange={setPegmanDragging}
        />

        {lookingUpStreetView && !streetViewTarget && !isGoogleStreetViewOpen && (
          <div className="pointer-events-none absolute inset-0 z-25 flex items-center justify-center bg-[#061124]/45 backdrop-blur-[1px]">
            <div className="flex items-center gap-2 rounded-2xl border border-white/20 bg-[#0B1B36]/90 px-4 py-2.5 text-xs font-semibold text-white shadow-lg">
              <Loader2 className="h-4 w-4 animate-spin text-[#60A5FA]" aria-hidden="true" />
              <span>{t.streetViewLoading}</span>
            </div>
          </div>
        )}

        {streetViewTarget && (
          <StreetView360Overlay
            target={streetViewTarget}
            hasGoogleKey={hasGoogleKey && !isFallbackMode}
            onClose={handleClose360View}
            onQuotaExceeded={onQuotaExceeded}
          />
        )}
      </div>

      {/* All Nearby Places Interactive List + Category Chips */}
      {showNearbyPlaces && showNearbyList && (
        <div
          data-testid="nearby-places-panel"
          className="dz-panel-enter rounded-3xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-4 shadow-[var(--dz-shadow-sm)] space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass
                className="h-4 w-4 text-[var(--dz-primary)]"
                aria-hidden="true"
              />
              <h3 className="text-sm font-bold text-[var(--dz-ink)]">
                {t.nearbyPlacesTitle}
              </h3>
              <span className="rounded-lg bg-[var(--dz-surface-tint)] px-2 py-0.5 font-mono-tabular text-[11px] font-bold text-[var(--dz-primary)]">
                {filteredNearbyPlaces.length}
              </span>
            </div>
            {nearbyLoading && (
              <span className="inline-flex items-center gap-1.5 text-xs text-[var(--dz-ink-muted)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--dz-primary)]" />
                <span>{t.nearbyPlacesLoading}</span>
              </span>
            )}
          </div>

          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={t.nearbyPlacesTitle}
          >
            {categoryChips.map((chip) => {
              const active = nearbyCategory === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  data-testid={`nearby-chip-${chip.id}`}
                  onClick={() => setNearbyCategory(chip.id)}
                  className={`dz-focus rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                    active
                      ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-primary)] text-white'
                      : 'border-[var(--dz-border)] bg-[var(--dz-bg)] text-[var(--dz-ink-secondary)] hover:border-[var(--dz-primary)] hover:text-[var(--dz-ink)]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>

          {filteredNearbyPlaces.length > 0 ? (
            <div className="grid max-h-[250px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {filteredNearbyPlaces.map((place) => {
                const style = NEARBY_CATEGORY_STYLES[place.category];
                const isSelected = place.id === selectedNearbyPlaceId;
                return (
                  <button
                    key={place.id}
                    type="button"
                    data-testid={`nearby-place-${place.id}`}
                    onClick={() => handleFocusNearbyPlace(place)}
                    className={`dz-focus flex items-start justify-between gap-2.5 rounded-2xl border p-3 text-left transition-all duration-200 ${
                      isSelected
                        ? 'dz-dark-active-glow border-[var(--dz-primary)] bg-[var(--dz-surface-tint)]'
                        : 'border-[var(--dz-border)] bg-[var(--dz-bg)]/50 hover:border-[var(--dz-primary)]/50 hover:bg-[var(--dz-surface)]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          aria-hidden="true"
                          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] ${style.badgeBg} ${style.badgeText}`}
                        >
                          {style.glyph}
                        </span>
                        <span className="truncate text-xs font-bold text-[var(--dz-ink)]">
                          {place.name}
                        </span>
                      </div>
                      {place.primaryTypeLabel && (
                        <div className="mt-1 truncate text-[11px] font-medium text-[var(--dz-primary)]">
                          {place.primaryTypeLabel}
                        </div>
                      )}
                      {place.address && (
                        <div className="mt-0.5 truncate text-[11px] text-[var(--dz-ink-muted)]">
                          {place.address}
                        </div>
                      )}
                    </div>
                    <span className="shrink-0 rounded-lg bg-[var(--dz-surface)] px-2 py-0.5 font-mono-tabular text-[11px] font-bold text-[var(--dz-ink)] border border-[var(--dz-border)]">
                      {formatDistanceShort(place.distanceKm, lang)}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : !nearbyLoading ? (
            <p className="py-3 text-center text-xs text-[var(--dz-ink-muted)]">
              {t.nearbyPlacesEmpty}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

function NoKeyMapWorkspace(props: StationsMapViewProps) {
  const { t, localizeCity, localizeStationName, localizeStationAddress } = useI18n();
  const [mapLayerMode, setMapLayerMode] = useState<'roadmap' | 'satellite'>('roadmap');
  const [showSatelliteLabels, setShowSatelliteLabels] = useState<boolean>(true);
  const [streetViewTarget, setStreetViewTarget] = useState<StreetView360Target | null>(
    null,
  );
  const [pegmanDragging, setPegmanDragging] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const fallbackViewportRef = useRef<{ lat: number; lng: number; zoom: number }>({
    lat: 41.3111,
    lng: 69.2797,
    zoom: 12,
  });
  const lastHandledNonceRef = useRef<number>(0);

  const open360ForStation = useCallback(
    (explicit?: RankedStation | null) => {
      const candidate =
        explicit ||
        props.stations.find(
          (s) =>
            s.id === props.targetStationId &&
            typeof s.lat === 'number' &&
            typeof s.lng === 'number',
        ) ||
        props.stations.find(
          (s) =>
            s.id === props.selectedStationId &&
            typeof s.lat === 'number' &&
            typeof s.lng === 'number',
        ) ||
        props.stations.find(
          (s) => typeof s.lat === 'number' && typeof s.lng === 'number',
        ) ||
        null;

      if (
        candidate &&
        typeof candidate.lat === 'number' &&
        typeof candidate.lng === 'number'
      ) {
        setStreetViewTarget({
          lat: candidate.lat,
          lng: candidate.lng,
          title: localizeStationName(candidate.id, candidate.name),
          subtitle:
            candidate.formattedAddress ||
            localizeStationAddress(candidate.id, candidate.address),
          stationId: candidate.id,
        });
      } else if (props.driverLocation) {
        setStreetViewTarget({
          lat: props.driverLocation.lat,
          lng: props.driverLocation.lng,
          title: props.driverLocation.label
            ? localizeCity(props.driverLocation.label)
            : t.youAreHere,
        });
      } else {
        setStreetViewTarget({
          lat: 41.3111,
          lng: 69.2797,
          title: `${localizeCity('Ташкент')} · dezagamiz`,
        });
      }
    },
    [
      props.stations,
      props.targetStationId,
      props.selectedStationId,
      props.driverLocation,
      t.youAreHere,
      localizeCity,
      localizeStationName,
      localizeStationAddress,
    ],
  );

  useEffect(() => {
    if (
      !props.externalStreetViewRequest ||
      props.externalStreetViewRequest.nonce === lastHandledNonceRef.current
    ) {
      return;
    }
    lastHandledNonceRef.current = props.externalStreetViewRequest.nonce;
    const match =
      props.stations.find((s) => s.id === props.externalStreetViewRequest?.stationId) ||
      null;
    open360ForStation(match);
  }, [props.externalStreetViewRequest, props.stations, open360ForStation]);

  const mapHeightClass = props.compact
    ? 'h-[280px] sm:h-[320px]'
    : props.expanded
      ? 'h-[480px] sm:h-[580px]'
      : 'h-[380px] sm:h-[440px]';

  return (
    <div
      ref={mapContainerRef}
      data-testid="google-map-container"
      data-map-layer={mapLayerMode}
      style={{
        minHeight: props.compact
          ? '280px'
          : props.expanded
            ? '480px'
            : '380px',
      }}
      className={`relative ${mapHeightClass} w-full overflow-hidden rounded-3xl border border-[var(--dz-border)] bg-[#E8EFFA] dark:bg-[#0D1E3A] transition-[height] duration-200`}
    >
      <MapViewModeBar
        mapLayerMode={mapLayerMode}
        showSatelliteLabels={showSatelliteLabels}
        is360Active={Boolean(streetViewTarget)}
        onChangeLayerMode={(mode) => {
          setMapLayerMode(mode);
          setStreetViewTarget(null);
        }}
        onToggleLabels={() => setShowSatelliteLabels((prev) => !prev)}
        onOpen360={() => open360ForStation()}
      />

      <InteractiveFallbackMap
        stations={props.stations}
        driverLocation={props.driverLocation}
        targetStationId={props.targetStationId}
        selectedStationId={props.selectedStationId}
        fuelFilter={props.fuelFilter}
        lang={props.lang}
        mapLayerMode={mapLayerMode}
        showSatelliteLabels={showSatelliteLabels}
        pegmanDragging={pegmanDragging}
        compact={props.compact}
        expanded={props.expanded}
        onSelectStation={props.onSelectStation}
        onChooseAndRefuel={props.onChooseAndRefuel}
        onOpen360={(station) => open360ForStation(station)}
        onViewportChange={(vp) => {
          fallbackViewportRef.current = vp;
        }}
        onRouteComputed={props.onRouteComputed}
        onRouteLoadingChange={props.onRouteLoadingChange}
        onQuotaExceeded={props.onQuotaExceeded}
      />
      <div
        data-testid="map-fallback-notice"
        className="pointer-events-none absolute bottom-2 left-3 z-10 max-w-[70%] truncate rounded-lg border border-[var(--dz-border)] bg-[var(--dz-surface)]/90 px-2.5 py-1 text-[10px] font-medium text-[var(--dz-ink-secondary)] shadow-xs backdrop-blur-xs"
      >
        {t.mapFallbackActiveNote}
      </div>

      <PegmanMapWidget
        isHidden={Boolean(streetViewTarget)}
        dockClassName="bottom-9 right-3"
        containerRef={mapContainerRef}
        onClickOpenDefault360={() => open360ForStation()}
        onDropAtOffset={(xPx, yPx, w, h) => {
          const vp = fallbackViewportRef.current;
          const snapped = findNearestSnapStation(
            xPx,
            yPx,
            vp.lat,
            vp.lng,
            vp.zoom,
            w,
            h,
            props.stations,
            44,
          );
          if (snapped && typeof snapped.lat === 'number' && typeof snapped.lng === 'number') {
            props.onSelectStation(snapped.id);
            setStreetViewTarget({
              lat: snapped.lat,
              lng: snapped.lng,
              title: localizeStationName(snapped.id, snapped.name),
              subtitle:
                snapped.formattedAddress ||
                localizeStationAddress(snapped.id, snapped.address),
              stationId: snapped.id,
            });
            return;
          }
          const pt = pixelOffsetToLatLng(
            vp.lat,
            vp.lng,
            vp.zoom,
            xPx - w / 2,
            yPx - h / 2,
          );
          setStreetViewTarget({
            lat: pt.lat,
            lng: pt.lng,
            title: t.pegmanDroppedPointLabel,
            subtitle: formatCoordinates(pt.lat, pt.lng),
          });
        }}
        onResolveSnapPreview={(xPx, yPx, w, h) => {
          const vp = fallbackViewportRef.current;
          const snapped = findNearestSnapStation(
            xPx,
            yPx,
            vp.lat,
            vp.lng,
            vp.zoom,
            w,
            h,
            props.stations,
            44,
          );
          return snapped ? localizeStationName(snapped.id, snapped.name) : null;
        }}
        onDraggingChange={setPegmanDragging}
      />

      {streetViewTarget && (
        <StreetView360Overlay
          target={streetViewTarget}
          hasGoogleKey={false}
          onClose={() => setStreetViewTarget(null)}
          onQuotaExceeded={props.onQuotaExceeded}
        />
      )}
    </div>
  );
}

export function StationsMapView(props: StationsMapViewProps) {
  const [apiLoadFailed, setApiLoadFailed] = useState(false);
  const initialLangRef = useRef(props.lang);

  const handleApiLoadError = useCallback((err: unknown) => {
    setApiLoadFailed(true);
    console.warn('[dezagamiz] Google Maps script unavailable (interactive fallback map active):', err);
  }, []);

  if (!props.apiKey) {
    return <NoKeyMapWorkspace {...props} />;
  }

  return (
    <APIProvider
      apiKey={props.apiKey}
      language={initialLangRef.current}
      region="UZ"
      libraries={MAP_LIBRARIES}
      onError={handleApiLoadError}
    >
      <MapWorkspace
        hasGoogleKey={Boolean(props.apiKey)}
        stations={props.stations}
        driverLocation={props.driverLocation}
        targetStationId={props.targetStationId}
        selectedStationId={props.selectedStationId}
        fuelFilter={props.fuelFilter}
        lang={props.lang}
        compact={props.compact}
        expanded={props.expanded}
        hideOriginSearch={props.hideOriginSearch}
        showNearbyPlaces={props.showNearbyPlaces}
        showNearbyList={props.showNearbyList}
        externalStreetViewRequest={props.externalStreetViewRequest}
        apiLoadFailed={apiLoadFailed}
        onSelectStation={props.onSelectStation}
        onChooseAndRefuel={props.onChooseAndRefuel}
        onStationsResolved={props.onStationsResolved}
        onOriginSelected={props.onOriginSelected}
        onRouteComputed={props.onRouteComputed}
        onRouteLoadingChange={props.onRouteLoadingChange}
        onQuotaExceeded={props.onQuotaExceeded}
      />
    </APIProvider>
  );
}
