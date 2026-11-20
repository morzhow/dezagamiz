import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Crosshair,
  ExternalLink,
  Globe,
  Minus,
  Navigation,
  Plus,
  X,
} from 'lucide-react';
import { fetchServerDrivingRoute } from '../api/client';
import {
  accuracyMetersToPixels,
  buildGoogleMapsDirectionsUrl,
  computeFitBoundsViewport,
  formatCoordinates,
  formatSpeedKmh,
  getEffectiveQueueLevel,
  latLngToWorldPoint,
  shouldRefreshOrigin,
  worldPointToLatLng,
} from '../lib/dezagamiz';
import { useI18n, type AppLanguage } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import type {
  FuelCode,
  LatLngPoint,
  RankedStation,
} from '../types/dezagamiz';

export interface FallbackComputedRoute {
  stationId: string;
  distanceMeters: number;
  durationMillis: number | null;
  steps: string[];
}

interface InteractiveFallbackMapProps {
  stations: RankedStation[];
  driverLocation: LatLngPoint | null;
  targetStationId: string | null;
  selectedStationId: string;
  fuelFilter: FuelCode | 'all';
  lang: AppLanguage;
  mapLayerMode?: 'roadmap' | 'satellite';
  showSatelliteLabels?: boolean;
  pegmanDragging?: boolean;
  compact?: boolean;
  expanded?: boolean;
  onSelectStation: (stationId: string) => void;
  onChooseAndRefuel: (stationId: string, preferredFuel?: FuelCode) => void;
  onOpen360?: (station?: RankedStation) => void;
  onViewportChange?: (vp: { lat: number; lng: number; zoom: number }) => void;
  onRouteComputed?: (info: FallbackComputedRoute | null) => void;
  onRouteLoadingChange?: (loading: boolean) => void;
  onQuotaExceeded?: () => void;
}

const DEFAULT_CENTER = { lat: 41.3111, lng: 69.2797 };

export function InteractiveFallbackMap({
  stations,
  driverLocation,
  targetStationId,
  selectedStationId,
  fuelFilter,
  lang,
  mapLayerMode = 'roadmap',
  showSatelliteLabels = true,
  pegmanDragging = false,
  compact = false,
  expanded = false,
  onSelectStation,
  onChooseAndRefuel,
  onOpen360,
  onViewportChange,
  onRouteComputed,
  onRouteLoadingChange,
  onQuotaExceeded,
}: InteractiveFallbackMapProps) {
  const {
    t,
    fuelShortLabel,
    fuelUnit,
    formatMoney,
    localizeStationName,
    localizeStationAddress,
  } = useI18n();
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [size, setSize] = useState<{ width: number; height: number }>({
    width: 680,
    height: compact ? 300 : expanded ? 520 : 400,
  });

  const targetStation = useMemo(
    () => stations.find((s) => s.id === targetStationId) || null,
    [stations, targetStationId],
  );

  const resolvedStations = useMemo(
    () =>
      stations.filter(
        (s) =>
          typeof s.lat === 'number' &&
          Number.isFinite(s.lat) &&
          typeof s.lng === 'number' &&
          Number.isFinite(s.lng),
      ),
    [stations],
  );

  const fitViewport = useCallback(
    (w: number, h: number) => {
      const pts: Array<{ lat: number; lng: number }> = [];
      if (driverLocation) {
        pts.push({ lat: driverLocation.lat, lng: driverLocation.lng });
      }
      if (
        targetStation &&
        typeof targetStation.lat === 'number' &&
        typeof targetStation.lng === 'number'
      ) {
        pts.push({ lat: targetStation.lat, lng: targetStation.lng });
      }
      if (pts.length === 0) {
        for (const s of resolvedStations) {
          pts.push({ lat: s.lat as number, lng: s.lng as number });
        }
      }
      if (pts.length === 0) {
        return { ...DEFAULT_CENTER, zoom: 12 };
      }
      return computeFitBoundsViewport(pts, w, h, 56, 6, 15);
    },
    [driverLocation, targetStation, resolvedStations],
  );

  const [viewport, setViewport] = useState<{
    lat: number;
    lng: number;
    zoom: number;
  }>(() => fitViewport(680, compact ? 300 : expanded ? 520 : 400));

  const [routePath, setRoutePath] = useState<Array<{ lat: number; lng: number }>>([]);
  const [popupStationId, setPopupStationId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [followDriver, setFollowDriver] = useState(true);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startWorldX: number;
    startWorldY: number;
    zoom: number;
  } | null>(null);

  const lastFitKeyRef = useRef<string>('');
  const lastRouteOriginRef = useRef<LatLngPoint | null>(null);
  const lastRouteStationRef = useRef<string | null>(null);
  const lastRouteLangRef = useRef<AppLanguage | null>(null);
  const hasRoutePathRef = useRef(false);
  const prevIsLiveRef = useRef<boolean>(Boolean(driverLocation?.isLive));

  const onViewportChangeRef = useRef(onViewportChange);
  onViewportChangeRef.current = onViewportChange;
  const onRouteComputedRef = useRef(onRouteComputed);
  onRouteComputedRef.current = onRouteComputed;
  const onRouteLoadingChangeRef = useRef(onRouteLoadingChange);
  onRouteLoadingChangeRef.current = onRouteLoadingChange;
  const onQuotaExceededRef = useRef(onQuotaExceeded);
  onQuotaExceededRef.current = onQuotaExceeded;

  // Measure container dynamically so projections stay pixel-accurate
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 40 && rect.height > 40) {
        setSize({
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      }
    };

    update();
    if (typeof ResizeObserver !== 'undefined') {
      const obs = new ResizeObserver(update);
      obs.observe(el);
      return () => obs.disconnect();
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Re-engage Follow-Me automatically when live GPS transitions off -> on
  useEffect(() => {
    const isLive = Boolean(driverLocation?.isLive);
    if (isLive && !prevIsLiveRef.current) {
      setFollowDriver(true);
    }
    prevIsLiveRef.current = isLive;
  }, [driverLocation?.isLive]);

  // Fit bounds when target station or non-live origin changes, and pan gently without resetting zoom on live GPS ticks
  useEffect(() => {
    const originScope = driverLocation
      ? driverLocation.isLive
        ? 'live'
        : `${driverLocation.lat.toFixed(3)},${driverLocation.lng.toFixed(3)}`
      : 'none';
    const fitKey = [
      originScope,
      targetStation?.id || 'none',
      targetStation?.lat?.toFixed(3) || 'none',
      resolvedStations.length,
    ].join('|');

    if (lastFitKeyRef.current !== fitKey) {
      lastFitKeyRef.current = fitKey;
      setViewport(fitViewport(size.width, size.height));
      return;
    }

    if (driverLocation?.isLive && followDriver) {
      setViewport((prev) => ({
        ...prev,
        lat: driverLocation.lat,
        lng: driverLocation.lng,
      }));
    }
  }, [
    driverLocation?.lat,
    driverLocation?.lng,
    driverLocation?.isLive,
    followDriver,
    targetStation?.id,
    targetStation?.lat,
    resolvedStations.length,
    fitViewport,
    size.width,
    size.height,
  ]);

  useEffect(() => {
    onViewportChangeRef.current?.(viewport);
  }, [viewport]);

  // Fetch real road route from server Google Routes API proxy (or smooth direct line if unavailable)
  useEffect(() => {
    if (
      !driverLocation ||
      !targetStation ||
      typeof targetStation.lat !== 'number' ||
      typeof targetStation.lng !== 'number'
    ) {
      hasRoutePathRef.current = false;
      setRoutePath([]);
      lastRouteOriginRef.current = null;
      lastRouteStationRef.current = null;
      onRouteComputedRef.current?.(null);
      onRouteLoadingChangeRef.current?.(false);
      return;
    }

    const stationChanged = lastRouteStationRef.current !== targetStation.id;
    const langChanged = lastRouteLangRef.current !== lang;
    const movedEnough = shouldRefreshOrigin(
      lastRouteOriginRef.current,
      driverLocation,
      60,
    );

    if (!stationChanged && !langChanged && !movedEnough && hasRoutePathRef.current) {
      return;
    }

    lastRouteOriginRef.current = {
      lat: driverLocation.lat,
      lng: driverLocation.lng,
    };
    lastRouteStationRef.current = targetStation.id;
    lastRouteLangRef.current = lang;

    let cancelled = false;
    onRouteLoadingChangeRef.current?.(true);

    const destLat = targetStation.lat;
    const destLng = targetStation.lng;
    const activeStationId = targetStation.id;

    fetchServerDrivingRoute({
      originLat: driverLocation.lat,
      originLng: driverLocation.lng,
      destLat,
      destLng,
      lang,
    })
      .then((res) => {
        if (cancelled) return;
        if (res.quotaExceeded) {
          onQuotaExceededRef.current?.();
        }
        const validPath =
          Array.isArray(res.path) && res.path.length >= 2
            ? res.path
            : [
                { lat: driverLocation.lat, lng: driverLocation.lng },
                { lat: destLat, lng: destLng },
              ];
        hasRoutePathRef.current = true;
        setRoutePath(validPath);
        onRouteComputedRef.current?.({
          stationId: activeStationId,
          distanceMeters: res.distanceMeters,
          durationMillis: res.durationMillis,
          steps: res.steps || [],
        });
      })
      .catch(() => {
        if (cancelled) return;
        hasRoutePathRef.current = true;
        setRoutePath([
          { lat: driverLocation.lat, lng: driverLocation.lng },
          { lat: destLat, lng: destLng },
        ]);
        onRouteComputedRef.current?.(null);
      })
      .finally(() => {
        if (!cancelled) {
          onRouteLoadingChangeRef.current?.(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    driverLocation?.lat,
    driverLocation?.lng,
    targetStation?.id,
    targetStation?.lat,
    targetStation?.lng,
    lang,
  ]);

  const tileZoom = Math.max(4, Math.min(18, Math.round(viewport.zoom)));
  const tileScale = Math.pow(2, viewport.zoom - tileZoom);
  const centerWorldAtTileZoom = useMemo(
    () => latLngToWorldPoint(viewport.lat, viewport.lng, tileZoom),
    [viewport.lat, viewport.lng, tileZoom],
  );
  const centerWorldAtViewZoom = useMemo(
    () => latLngToWorldPoint(viewport.lat, viewport.lng, viewport.zoom),
    [viewport.lat, viewport.lng, viewport.zoom],
  );

  const projectLatLng = useCallback(
    (lat: number, lng: number) => {
      const world = latLngToWorldPoint(lat, lng, viewport.zoom);
      return {
        x: size.width / 2 + (world.x - centerWorldAtViewZoom.x),
        y: size.height / 2 + (world.y - centerWorldAtViewZoom.y),
      };
    },
    [viewport.zoom, size.width, size.height, centerWorldAtViewZoom],
  );

  // Compute visible 256px tiles around current viewport
  const visibleTiles = useMemo(() => {
    const halfW = size.width / (2 * tileScale);
    const halfH = size.height / (2 * tileScale);
    const minTileX = Math.floor((centerWorldAtTileZoom.x - halfW) / 256) - 1;
    const maxTileX = Math.floor((centerWorldAtTileZoom.x + halfW) / 256) + 1;
    const minTileY = Math.floor((centerWorldAtTileZoom.y - halfH) / 256) - 1;
    const maxTileY = Math.floor((centerWorldAtTileZoom.y + halfH) / 256) + 1;
    const maxIndex = (1 << tileZoom) - 1;
    const isSatellite = mapLayerMode === 'satellite';
    const baseSlug = isSatellite ? 'satellite' : isDark ? 'dark' : 'light';

    const list: Array<{
      key: string;
      src: string;
      labelSrc?: string;
      left: number;
      top: number;
      tileSize: number;
    }> = [];

    const scaledTile = 256 * tileScale;

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      if (ty < 0 || ty > maxIndex) continue;
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const wrappedX = ((tx % (maxIndex + 1)) + (maxIndex + 1)) % (maxIndex + 1);
        const left =
          size.width / 2 + (tx * 256 - centerWorldAtTileZoom.x) * tileScale;
        const top =
          size.height / 2 + (ty * 256 - centerWorldAtTileZoom.y) * tileScale;
        list.push({
          key: `${baseSlug}-${tileZoom}-${tx}-${ty}`,
          src: `/api/maps/fallback-tile/${baseSlug}/${tileZoom}/${wrappedX}/${ty}`,
          labelSrc:
            isSatellite && showSatelliteLabels
              ? `/api/maps/fallback-tile/labels/${tileZoom}/${wrappedX}/${ty}`
              : undefined,
          left,
          top,
          tileSize: scaledTile + 0.5,
        });
      }
    }

    return list;
  }, [
    size.width,
    size.height,
    tileScale,
    tileZoom,
    centerWorldAtTileZoom,
    isDark,
    mapLayerMode,
    showSatelliteLabels,
  ]);

  const routeSvgPoints = useMemo(() => {
    if (routePath.length < 2) return '';
    return routePath
      .map((pt) => {
        const pos = projectLatLng(pt.lat, pt.lng);
        return `${pos.x.toFixed(1)},${pos.y.toFixed(1)}`;
      })
      .join(' ');
  }, [routePath, projectLatLng]);

  const driverPixel = useMemo(
    () =>
      driverLocation
        ? projectLatLng(driverLocation.lat, driverLocation.lng)
        : null,
    [driverLocation, projectLatLng],
  );

  const popupStation = useMemo(
    () => resolvedStations.find((s) => s.id === popupStationId) || null,
    [resolvedStations, popupStationId],
  );

  const popupFuelCode: FuelCode =
    fuelFilter !== 'all' && popupStation?.prices[fuelFilter]
      ? fuelFilter
      : popupStation?.prices.metan
        ? 'metan'
        : popupStation?.prices.propan
          ? 'propan'
          : 'ai92';

  const externalMapsUrl =
    targetStation &&
    typeof targetStation.lat === 'number' &&
    typeof targetStation.lng === 'number'
      ? buildGoogleMapsDirectionsUrl(driverLocation, {
          lat: targetStation.lat,
          lng: targetStation.lng,
        })
      : 'https://www.google.com/maps/search/?api=1&query=41.3111,69.2797';

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button, a')) return;

    const world = latLngToWorldPoint(viewport.lat, viewport.lng, viewport.zoom);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startWorldX: world.x,
      startWorldY: world.y,
      zoom: viewport.zoom,
    };
    setFollowDriver(false);
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const nextCenter = worldPointToLatLng(
      drag.startWorldX - dx,
      drag.startWorldY - dy,
      drag.zoom,
    );
    setViewport((prev) => ({
      ...prev,
      lat: nextCenter.lat,
      lng: nextCenter.lng,
    }));
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  function handleZoomDelta(delta: number) {
    setViewport((prev) => ({
      ...prev,
      zoom: Math.max(5, Math.min(17, Math.round((prev.zoom + delta) * 2) / 2)),
    }));
  }

  return (
    <div
      ref={containerRef}
      data-testid="interactive-fallback-map"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative h-full w-full select-none overflow-hidden ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } ${
        mapLayerMode === 'satellite'
          ? 'bg-[#0C1D19]'
          : isDark
            ? 'bg-[#0D1E3A]'
            : 'bg-[#E8EFFA]'
      }`}
      data-map-layer={mapLayerMode}
      style={{ touchAction: 'none' }}
      role="region"
      aria-label={t.liveRouteModeTitle}
    >
      {/* Vector Architectural Grid Backdrop (guarantees crisp canvas offline/slow tiles) */}
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-40"
      >
        <defs>
          <pattern
            id="dz-fallback-grid"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 48 0 L 0 0 0 48"
              fill="none"
              stroke={isDark ? '#1E3A68' : '#C3D4EC'}
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dz-fallback-grid)" />
      </svg>

      {/* Slippy Map Tiles Layer */}
      <div
        className={`pointer-events-none absolute inset-0 transition-[filter] duration-300 ${
          mapLayerMode === 'satellite'
            ? isDark
              ? 'brightness-90 contrast-105'
              : ''
            : isDark
              ? '[filter:invert(92%)_hue-rotate(180deg)_brightness(92%)_contrast(94%)_saturate(85%)]'
              : ''
        }`}
      >
        {visibleTiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            draggable={false}
            loading="eager"
            className="absolute max-w-none"
            style={{
              left: `${tile.left}px`,
              top: `${tile.top}px`,
              width: `${tile.tileSize}px`,
              height: `${tile.tileSize}px`,
            }}
          />
        ))}
        {mapLayerMode === 'satellite' &&
          showSatelliteLabels &&
          visibleTiles.map(
            (tile) =>
              tile.labelSrc && (
                <img
                  key={`${tile.key}-lbl`}
                  src={tile.labelSrc}
                  alt=""
                  draggable={false}
                  loading="eager"
                  className="absolute max-w-none opacity-95"
                  style={{
                    left: `${tile.left}px`,
                    top: `${tile.top}px`,
                    width: `${tile.tileSize}px`,
                    height: `${tile.tileSize}px`,
                  }}
                />
              ),
          )}
      </div>

      {/* Driving Route Polyline SVG Layer */}
      {routeSvgPoints && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`0 0 ${size.width} ${size.height}`}
          aria-hidden="true"
        >
          <polyline
            points={routeSvgPoints}
            fill="none"
            stroke={isDark ? '#071122' : '#FFFFFF'}
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={0.85}
          />
          <polyline
            points={routeSvgPoints}
            fill="none"
            stroke="#0B57D0"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Driver Origin Marker + Real-time Accuracy Halo & Heading */}
      {driverPixel && (() => {
        const accuracyRadiusPx =
          driverLocation?.isLive && driverLocation.accuracy
            ? accuracyMetersToPixels(
                driverLocation.accuracy,
                driverLocation.lat,
                viewport.zoom,
              )
            : 0;
        const speedLabel =
          driverLocation?.isLive &&
          typeof driverLocation.speed === 'number' &&
          driverLocation.speed >= 0.3
            ? formatSpeedKmh(driverLocation.speed, lang)
            : null;
        const hasHeading =
          driverLocation?.isLive &&
          typeof driverLocation.heading === 'number' &&
          Number.isFinite(driverLocation.heading);

        return (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-[left,top] duration-300 ease-out"
            style={{ left: `${driverPixel.x}px`, top: `${driverPixel.y}px` }}
          >
            {accuracyRadiusPx > 4 && (
              <div
                data-testid="live-gps-accuracy-ring"
                aria-hidden="true"
                style={{
                  width: `${accuracyRadiusPx * 2}px`,
                  height: `${accuracyRadiusPx * 2}px`,
                }}
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#0B57D0]/45 bg-[#0B57D0]/12 transition-all duration-300"
              />
            )}
            {driverLocation?.isLive ? (
              <div
                data-testid="live-driver-marker"
                className="relative flex items-center justify-center"
              >
                {hasHeading && (
                  <svg
                    viewBox="0 0 64 64"
                    aria-hidden="true"
                    style={{ transform: `rotate(${driverLocation.heading}deg)` }}
                    className="pointer-events-none absolute h-16 w-16 transition-transform duration-300"
                  >
                    <path
                      d="M32 32 L18 6 A28 28 0 0 1 46 6 Z"
                      fill="rgba(11, 87, 208, 0.28)"
                      stroke="rgba(11, 87, 208, 0.7)"
                      strokeWidth="1.2"
                    />
                  </svg>
                )}
                <span
                  aria-hidden="true"
                  className="absolute h-10 w-10 animate-ping rounded-full bg-[#0B57D0]/35"
                />
                <span className="relative inline-flex items-center gap-1 rounded-full border-2 border-white bg-[#092C63] px-2.5 py-1 text-[11px] font-bold text-white shadow-md whitespace-nowrap">
                  <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
                  <span>{t.driverMarkerSelf} · LIVE</span>
                  {speedLabel && (
                    <span className="font-mono-tabular text-[10px] text-[#93C5FD]">
                      · {speedLabel}
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#092C63] text-xs font-bold text-white shadow-md">
                {t.driverMarkerSelf}
              </span>
            )}
          </div>
        );
      })()}

      {/* Gas Station Markers */}
      {resolvedStations.map((station) => {
        const pos = projectLatLng(station.lat as number, station.lng as number);
        if (
          pos.x < -40 ||
          pos.x > size.width + 40 ||
          pos.y < -40 ||
          pos.y > size.height + 40
        ) {
          return null;
        }
        const isTarget = station.id === targetStationId;
        const isSelected = station.id === selectedStationId;
        const isMaint = station.operationalStatus === 'maintenance';
        const isBusy = station.operationalStatus === 'busy';
        const matches = station.supportsSelectedFuel;
        const bgClass = isMaint
          ? 'bg-[#64748B] opacity-75'
          : isTarget
            ? 'bg-[#0A7E42] scale-110 ring-4 ring-[#0A7E42]/25'
            : isBusy
              ? 'bg-[#D97706] ring-2 ring-[#D97706]/30'
              : matches || isSelected
                ? 'bg-[#0B57D0] ring-2 ring-[#0B57D0]/20'
                : 'bg-[#64748B]';

        return (
          <button
            key={station.id}
            type="button"
            data-testid={`fallback-station-pin-${station.id}`}
            onClick={() => {
              onSelectStation(station.id);
              setPopupStationId(station.id);
            }}
            title={`${localizeStationName(station.id, station.name)} (${formatCoordinates(station.lat, station.lng)})`}
            aria-label={localizeStationName(station.id, station.name)}
            style={{
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              zIndex: isTarget ? 18 : isSelected ? 15 : 10,
            }}
            className="dz-focus group absolute -translate-x-1/2 -translate-y-full transition-transform duration-150 hover:scale-115"
          >
            <span
              className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white shadow-md ${bgClass}`}
            >
              {pegmanDragging && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-2 animate-pulse rounded-full border-2 border-[#38BDF8] bg-[#38BDF8]/25"
                />
              )}
              <span className="relative">{isMaint ? '!' : isTarget ? '★' : '⛽'}</span>
            </span>
            <span className="mx-auto block h-1.5 w-1.5 -translate-y-0.5 rotate-45 bg-white shadow-sm" />
          </button>
        );
      })}

      {/* Floating Station Details Card */}
      {popupStation && (
        <div
          data-testid="fallback-station-popup"
          className="dz-panel-enter absolute bottom-8 left-3 right-3 z-30 max-w-xs rounded-2xl border border-[var(--dz-border)] bg-[var(--dz-surface)] p-3.5 shadow-[var(--dz-shadow-card)] sm:right-auto"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-xs font-bold text-[var(--dz-ink)]">
                {localizeStationName(popupStation.id, popupStation.name)}
              </div>
              <div className="mt-0.5 line-clamp-2 text-[11px] text-[var(--dz-ink-secondary)]">
                {popupStation.formattedAddress ||
                  localizeStationAddress(popupStation.id, popupStation.address)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPopupStationId(null)}
              aria-label={t.closeAria}
              className="dz-focus rounded-lg p-1 text-[var(--dz-ink-muted)] hover:bg-[var(--dz-surface-tint)] hover:text-[var(--dz-ink)]"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
            <span
              className={`rounded-md px-1.5 py-0.5 ${
                popupStation.operationalStatus === 'maintenance'
                  ? 'bg-[var(--dz-danger-bg)] text-[var(--dz-danger)]'
                  : popupStation.operationalStatus === 'busy'
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    : 'bg-[#E9F7EF] dark:bg-[#0D2B22] text-[#0A7E42] dark:text-[#34D399]'
              }`}
            >
              {popupStation.operationalStatus === 'maintenance'
                ? t.stationStatusMaint
                : popupStation.operationalStatus === 'busy'
                  ? t.stationStatusBusy
                  : t.stationStatusOpen}
            </span>
            {popupStation.operationalStatus !== 'maintenance' && (
              <span className="rounded-md bg-[var(--dz-surface-subtle)] px-1.5 py-0.5 text-[var(--dz-ink-secondary)]">
                {(() => {
                  const q = getEffectiveQueueLevel(popupStation);
                  return q === 'high'
                    ? t.queueHighLabel
                    : q === 'medium'
                      ? t.queueMediumLabel
                      : t.queueLowLabel;
                })()}
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
            <span className="font-mono-tabular text-[var(--dz-ink-muted)]">
              {formatCoordinates(popupStation.lat, popupStation.lng)}
            </span>
            {popupStation.prices[popupFuelCode] && (
              <span className="font-mono-tabular font-bold text-[var(--dz-primary)]">
                {fuelShortLabel(popupFuelCode)}:{' '}
                {formatMoney(popupStation.prices[popupFuelCode] as number)} /{' '}
                {fuelUnit(popupFuelCode)}
              </span>
            )}
          </div>

          <div className="mt-2.5 flex items-center gap-1.5">
            <button
              type="button"
              disabled={popupStation.operationalStatus === 'maintenance'}
              onClick={() =>
                onChooseAndRefuel(
                  popupStation.id,
                  fuelFilter !== 'all' ? fuelFilter : undefined,
                )
              }
              className="dz-focus inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--dz-primary)] px-2.5 py-2 text-xs font-semibold text-white hover:bg-[var(--dz-primary-hover)] disabled:opacity-50"
            >
              <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t.refuelHereBtn}</span>
            </button>
            {typeof popupStation.lat === 'number' && typeof popupStation.lng === 'number' && (
              <a
                href={buildGoogleMapsDirectionsUrl(driverLocation, {
                  lat: popupStation.lat,
                  lng: popupStation.lng,
                })}
                target="_blank"
                rel="noopener noreferrer"
                title={t.openGoogleMapsBtn}
                aria-label={t.openGoogleMapsBtn}
                className="dz-focus inline-flex items-center justify-center rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)] px-2.5 py-2 text-xs font-semibold text-[var(--dz-ink)] hover:border-[var(--dz-primary)] hover:text-[var(--dz-primary)]"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
            {onOpen360 && (
              <button
                type="button"
                data-testid="fallback-popup-360-btn"
                onClick={() => onOpen360(popupStation)}
                className="dz-focus inline-flex items-center justify-center gap-1 rounded-xl border border-[var(--dz-primary)]/40 bg-[var(--dz-surface-tint)] px-2.5 py-2 text-xs font-bold text-[var(--dz-primary)] hover:bg-[#D8E7FE] dark:hover:bg-[#1E3B6B]"
                title={t.mapView360Btn}
              >
                <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                <span>360°</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Map Controls: External Google Maps + Zoom + Recenter */}
      <div className="absolute right-3 top-[92px] sm:top-3 z-20 flex flex-col items-end gap-2">
        <a
          href={externalMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="dz-focus inline-flex items-center gap-1.5 rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)]/95 px-2.5 py-1.5 text-[11px] font-semibold text-[var(--dz-ink)] shadow-sm backdrop-blur-sm transition-colors hover:border-[var(--dz-primary)] hover:text-[var(--dz-primary)]"
        >
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
          <span className="hidden md:inline">{t.openGoogleMapsBtn}</span>
          <span className="md:hidden">Google Maps</span>
        </a>

        <div className="flex flex-col overflow-hidden rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)]/95 shadow-sm backdrop-blur-sm">
          <button
            type="button"
            onClick={() => handleZoomDelta(1)}
            aria-label={t.zoomInAria}
            className="dz-focus flex h-8 w-8 items-center justify-center text-[var(--dz-ink)] transition-colors hover:bg-[var(--dz-surface-tint)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => handleZoomDelta(-1)}
            aria-label={t.zoomOutAria}
            className="dz-focus flex h-8 w-8 items-center justify-center border-t border-[var(--dz-border)] text-[var(--dz-ink)] transition-colors hover:bg-[var(--dz-surface-tint)]"
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            data-testid="map-follow-driver-btn"
            aria-pressed={followDriver}
            title={
              followDriver && driverLocation?.isLive
                ? t.mapFollowingDriver
                : t.mapFollowDriverBtn
            }
            onClick={() => {
              setFollowDriver(true);
              if (driverLocation?.isLive) {
                setViewport((prev) => ({
                  ...prev,
                  lat: driverLocation.lat,
                  lng: driverLocation.lng,
                  zoom: Math.max(prev.zoom, 13),
                }));
              } else {
                setViewport(fitViewport(size.width, size.height));
              }
            }}
            aria-label={t.mapFollowDriverBtn}
            className={`dz-focus flex h-8 w-8 items-center justify-center border-t border-[var(--dz-border)] transition-colors ${
              followDriver && driverLocation?.isLive
                ? 'bg-[#E9F7EF] dark:bg-[#0D2B22] text-[#0A7E42] dark:text-[#34D399]'
                : 'text-[var(--dz-primary)] hover:bg-[var(--dz-surface-tint)]'
            }`}
          >
            <Crosshair className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Subtle Map Attribution */}
      <div className="pointer-events-none absolute bottom-2 right-3 z-10 rounded-md bg-[var(--dz-surface)]/80 px-2 py-0.5 text-[10px] text-[var(--dz-ink-muted)] backdrop-blur-xs">
        {mapLayerMode === 'satellite' ? '© Esri World Imagery' : '© OpenStreetMap'}
      </div>
    </div>
  );
}
