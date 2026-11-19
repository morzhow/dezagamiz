import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Compass,
  ExternalLink,
  Globe,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Satellite,
} from 'lucide-react';
import {
  buildStreetViewImageProxyUrl,
  fetchStreetViewMetadata,
  type StreetViewMetadataResponse,
} from '../api/client';
import {
  buildGoogleMapsStreetViewUrl,
  clampPitchDegrees,
  formatCoordinates,
  getCompassDirectionLabel,
  latLngToWorldPoint,
  normalizeHeadingDegrees,
} from '../lib/dezagamiz';
import { useI18n } from '../lib/i18n';
import { PegmanIcon } from './PegmanControl';

export interface StreetView360Target {
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  stationId?: string;
}

interface StreetView360OverlayProps {
  target: StreetView360Target;
  hasGoogleKey?: boolean;
  onClose: () => void;
  onQuotaExceeded?: () => void;
}

export function StreetView360Overlay({
  target,
  hasGoogleKey = false,
  onClose,
  onQuotaExceeded,
}: StreetView360OverlayProps) {
  const { t, lang } = useI18n();

  const [heading, setHeading] = useState<number>(0);
  const [svQueryHeading, setSvQueryHeading] = useState<number>(0);
  const [pitch, setPitch] = useState<number>(5);
  const [svQueryPitch, setSvQueryPitch] = useState<number>(5);
  const [svFov, setSvFov] = useState<number>(95);

  // Orbit 3D tilt (degrees away from overhead: 0° = top-down, 56° = dramatic 3D perspective)
  const [orbitTilt, setOrbitTilt] = useState<number>(52);
  const [orbitZoom, setOrbitZoom] = useState<number>(17);

  const [svMeta, setSvMeta] = useState<StreetViewMetadataResponse | null>(null);
  const [checkingSv, setCheckingSv] = useState<boolean>(hasGoogleKey);
  const [viewMode, setViewMode] = useState<'streetview' | 'orbit'>('orbit');
  const [svImageError, setSvImageError] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startHeading: number;
    startPitch: number;
    startTilt: number;
  } | null>(null);

  const onQuotaExceededRef = useRef(onQuotaExceeded);
  onQuotaExceededRef.current = onQuotaExceeded;

  // Check Street View Static Metadata when Google key is configured
  useEffect(() => {
    setSvImageError(false);
    if (!hasGoogleKey) {
      setSvMeta({ available: false, quotaExceeded: false });
      setViewMode('orbit');
      setCheckingSv(false);
      return;
    }

    let cancelled = false;
    setCheckingSv(true);

    fetchStreetViewMetadata({
      lat: target.lat,
      lng: target.lng,
      radius: 800,
    })
      .then((res) => {
        if (cancelled) return;
        setSvMeta(res);
        if (res.quotaExceeded) {
          onQuotaExceededRef.current?.();
        }
        if (res.available) {
          setViewMode('streetview');
        } else {
          setViewMode('orbit');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setSvMeta({ available: false, quotaExceeded: false });
        setViewMode('orbit');
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingSv(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasGoogleKey, target.lat, target.lng]);

  // Precompute 5x5 aerial satellite mosaic centered accurately on target coordinates
  const orbitTiles = useMemo(() => {
    const z = orbitZoom;
    const tileSize = 256;
    const gridRadius = 2; // 5x5 grid = 1280x1280px mosaic
    const world = latLngToWorldPoint(target.lat, target.lng, z);
    const centerTileX = Math.floor(world.x / tileSize);
    const centerTileY = Math.floor(world.y / tileSize);
    const offsetInCenterX = world.x - centerTileX * tileSize;
    const offsetInCenterY = world.y - centerTileY * tileSize;
    const gridPx = (gridRadius * 2 + 1) * tileSize;
    const anchorX = gridRadius * tileSize + offsetInCenterX;
    const anchorY = gridRadius * tileSize + offsetInCenterY;
    const maxIndex = 1 << z;

    const tiles: Array<{
      key: string;
      satSrc: string;
      lblSrc: string;
      left: number;
      top: number;
    }> = [];

    for (let dy = -gridRadius; dy <= gridRadius; dy++) {
      const ty = centerTileY + dy;
      if (ty < 0 || ty >= maxIndex) continue;
      for (let dx = -gridRadius; dx <= gridRadius; dx++) {
        const tx = centerTileX + dx;
        const wrappedX = ((tx % maxIndex) + maxIndex) % maxIndex;
        tiles.push({
          key: `${z}-${tx}-${ty}`,
          satSrc: `/api/maps/fallback-tile/satellite/${z}/${wrappedX}/${ty}`,
          lblSrc: `/api/maps/fallback-tile/labels/${z}/${wrappedX}/${ty}`,
          left: (dx + gridRadius) * tileSize,
          top: (dy + gridRadius) * tileSize,
        });
      }
    }

    return {
      gridPx,
      anchorX,
      anchorY,
      tileSize,
      tiles,
    };
  }, [target.lat, target.lng, orbitZoom]);

  const streetViewImgSrc = useMemo(() => {
    if (viewMode !== 'streetview' || !svMeta?.available) return '';
    return buildStreetViewImageProxyUrl({
      lat: svMeta.lat ?? target.lat,
      lng: svMeta.lng ?? target.lng,
      panoId: svMeta.panoId,
      heading: svQueryHeading,
      pitch: svQueryPitch,
      fov: svFov,
    });
  }, [
    viewMode,
    svMeta,
    target.lat,
    target.lng,
    svQueryHeading,
    svQueryPitch,
    svFov,
  ]);

  function handleStepHeading(delta: number) {
    setHeading((prev) => {
      const next = normalizeHeadingDegrees(prev + delta);
      setSvQueryHeading(next);
      return next;
    });
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = e.target as HTMLElement | null;
    if (el?.closest('button, a')) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startHeading: heading,
      startPitch: pitch,
      startTilt: orbitTilt,
    };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const nextHeading = normalizeHeadingDegrees(drag.startHeading + dx * 0.45);
    setHeading(nextHeading);
    if (viewMode === 'streetview') {
      setPitch(clampPitchDegrees(drag.startPitch - dy * 0.2, -35, 55));
    } else {
      setOrbitTilt(Math.max(18, Math.min(64, Math.round(drag.startTilt + dy * 0.18))));
    }
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
    if (viewMode === 'streetview') {
      setSvQueryHeading(heading);
      setSvQueryPitch(pitch);
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }

  const compassDir = getCompassDirectionLabel(heading, lang);
  const roundedHeading = Math.round(heading);
  const external360Url = buildGoogleMapsStreetViewUrl(
    { lat: target.lat, lng: target.lng },
    roundedHeading,
  );

  // Compute gentle horizontal visual offset when dragging in Street View static mode before release
  const dragDeltaDeg =
    viewMode === 'streetview'
      ? ((heading - svQueryHeading + 540) % 360) - 180
      : 0;

  return (
    <div
      data-testid="streetview-360-overlay"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
      className={`absolute inset-0 z-40 flex flex-col justify-between overflow-hidden bg-[#061124] text-white select-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Background Stage: Google Street View OR 360° Satellite Orbit Dome */}
      {checkingSv ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#061124]">
          <Loader2 className="h-8 w-8 animate-spin text-[#60A5FA]" aria-hidden="true" />
          <p className="text-xs font-semibold text-white/85">{t.streetViewLoading}</p>
        </div>
      ) : viewMode === 'streetview' && svMeta?.available && !svImageError ? (
        <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#061124]">
          <img
            src={streetViewImgSrc}
            alt={target.title}
            draggable={false}
            onError={() => {
              setSvImageError(true);
              setViewMode('orbit');
            }}
            style={{
              transform: `scale(1.12) translateX(${Math.max(-18, Math.min(18, -dragDeltaDeg * 0.45))}%)`,
            }}
            className="h-full w-full object-cover transition-transform duration-100"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-[#061124]/60 via-transparent to-[#061124]/75"
          />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 overflow-hidden bg-[#07152B]">
          {/* Sky-horizon radial atmosphere */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(11,87,208,0.18),rgba(6,17,36,0.88)_78%)]"
          />

          {/* 3D Tilted Rotatable Aerial Satellite Plane anchored at station coordinate */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: `${orbitTiles.gridPx}px`,
              height: `${orbitTiles.gridPx}px`,
              transformOrigin: `${orbitTiles.anchorX}px ${orbitTiles.anchorY}px`,
              transform: `translate(${-orbitTiles.anchorX}px, ${-orbitTiles.anchorY}px) perspective(920px) rotateX(${orbitTilt}deg) rotateZ(${-heading}deg) scale(${orbitZoom >= 18 ? 1.15 : 1.05})`,
              transition: isDragging ? 'none' : 'transform 160ms ease-out',
            }}
          >
            {orbitTiles.tiles.map((tile) => (
              <div
                key={tile.key}
                className="absolute"
                style={{
                  left: `${tile.left}px`,
                  top: `${tile.top}px`,
                  width: `${orbitTiles.tileSize + 0.5}px`,
                  height: `${orbitTiles.tileSize + 0.5}px`,
                }}
              >
                <img
                  src={tile.satSrc}
                  alt=""
                  draggable={false}
                  className="h-full w-full object-cover"
                />
                <img
                  src={tile.lblSrc}
                  alt=""
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover opacity-90"
                />
              </div>
            ))}

            {/* Ground target beacon ring rotating with ground plane */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${orbitTiles.anchorX}px`, top: `${orbitTiles.anchorY}px` }}
            >
              <span className="block h-14 w-14 animate-ping rounded-full bg-[#34D399]/35" />
              <span className="absolute left-1/2 top-1/2 block h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#0A7E42]/80 shadow-lg" />
            </div>
          </div>

          {/* Center upright Station Pin over 3D orbital point */}
          <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-full">
            <div className="flex flex-col items-center">
              <div className="max-w-[210px] truncate rounded-lg border border-white/25 bg-[#092C63]/90 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-lg backdrop-blur-md">
                ★ {target.title}
              </div>
              <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#0A7E42] text-xs font-bold text-white shadow-lg">
                ⛽
              </div>
              <div className="h-2 w-0.5 bg-white shadow" />
            </div>
          </div>

          {/* Top & bottom subtle vignette so HUD controls are razor-sharp */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-[#061124]/60 via-transparent to-[#061124]/75"
          />
        </div>
      )}

      {/* Top HUD Bar */}
      <div className="relative z-10 flex flex-col gap-1.5 p-2.5 sm:p-3">
        <div className="flex items-center justify-between gap-1.5">
          <button
            type="button"
            data-testid="exit-360-btn"
            onClick={onClose}
            className="dz-focus inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/25 bg-[#0B1B36]/90 px-2.5 py-1.5 text-xs font-bold text-white shadow-md backdrop-blur-md transition-colors hover:bg-[#13294F]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t.mapExit360Btn}</span>
          </button>

          <div className="flex items-center gap-1.5">
            {/* Compass Azimuth Readout */}
            <div
              data-testid="sv-heading-readout"
              className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/20 bg-[#0B1B36]/85 px-2.5 py-1.5 font-mono-tabular text-xs font-bold text-white backdrop-blur-md"
            >
              <Compass className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
              <span>
                {roundedHeading}° · {compassDir}
              </span>
            </div>

            <a
              href={external360Url}
              target="_blank"
              rel="noopener noreferrer"
              className="dz-focus inline-flex shrink-0 items-center gap-1 rounded-xl border border-white/25 bg-[#0B57D0]/90 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md backdrop-blur-md transition-colors hover:bg-[#0B57D0]"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden md:inline">{t.streetViewOpenExternal}</span>
              <span className="md:hidden">Google 360°</span>
            </a>
          </div>
        </div>

        <div className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-lg border border-white/15 bg-[#0B1B36]/75 px-2.5 py-1 text-[11px] backdrop-blur-md">
          {viewMode === 'streetview' ? (
            <PegmanIcon variant="badge" className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Satellite className="h-3 w-3 shrink-0 text-[#34D399]" aria-hidden="true" />
          )}
          <span className="shrink-0 font-semibold text-[#93C5FD]">
            {viewMode === 'streetview'
              ? t.streetViewStreetModeLabel
              : t.streetViewSatelliteOrbitLabel}
          </span>
          <span className="text-white/40">·</span>
          <span className="truncate font-semibold text-white">{target.title}</span>
        </div>
      </div>

      {/* Bottom HUD Controls */}
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-2 p-2.5 sm:p-3">
        <div className="flex min-w-0 flex-1 items-end gap-2">
          {/* Google Maps-style Pegman 360° Radar / FOV Cone */}
          <div
            data-testid="pegman-fov-cone"
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/25 bg-[#0B1B36]/85 shadow-lg backdrop-blur-md"
            title={`${roundedHeading}° · ${compassDir}`}
          >
            <svg
              viewBox="0 0 48 48"
              className="pointer-events-none absolute inset-0 h-full w-full"
              style={{ transform: `rotate(${heading}deg)` }}
              aria-hidden="true"
            >
              <path
                d="M24 24 L11 6 A21 21 0 0 1 37 6 Z"
                fill="rgba(251, 188, 4, 0.34)"
                stroke="rgba(251, 188, 4, 0.8)"
                strokeWidth="1"
              />
            </svg>
            <PegmanIcon variant="badge" className="relative z-10 h-5 w-5" />
          </div>

          <div className="hidden min-w-0 flex-1 space-y-1 sm:block">
            {viewMode === 'orbit' && !checkingSv && !svMeta?.available && (
              <div className="max-w-sm truncate rounded-lg border border-white/15 bg-[#0B1B36]/80 px-2.5 py-1 text-[11px] text-white/85 backdrop-blur-md">
                {t.streetViewUnavailableHint}
              </div>
            )}
            <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-[#0B1B36]/75 px-2.5 py-1 text-[11px] text-white/85 backdrop-blur-md">
              <span>{t.streetViewDragHint}</span>
              <span className="text-white/40">·</span>
              <span className="font-mono-tabular text-white/80">
                {formatCoordinates(target.lat, target.lng)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {svMeta?.available && (
            <button
              type="button"
              onClick={() =>
                setViewMode((prev) => (prev === 'streetview' ? 'orbit' : 'streetview'))
              }
              className="dz-focus inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-[#0B1B36]/90 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-[#13294F]"
            >
              {viewMode === 'streetview' ? (
                <>
                  <Satellite className="h-3.5 w-3.5 text-[#34D399]" aria-hidden="true" />
                  <span>{t.mapLayerSatellite}</span>
                </>
              ) : (
                <>
                  <Globe className="h-3.5 w-3.5 text-[#60A5FA]" aria-hidden="true" />
                  <span>360°</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            data-testid="sv-rotate-left"
            onClick={() => handleStepHeading(-45)}
            aria-label={t.rotateLeftAria}
            className="dz-focus inline-flex items-center gap-1 rounded-xl border border-white/25 bg-[#0B1B36]/90 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur-md hover:bg-[#13294F]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>-45°</span>
          </button>

          <button
            type="button"
            data-testid="sv-rotate-right"
            onClick={() => handleStepHeading(45)}
            aria-label={t.rotateRightAria}
            className="dz-focus inline-flex items-center gap-1 rounded-xl border border-white/25 bg-[#0B1B36]/90 px-2.5 py-1.5 text-xs font-bold text-white backdrop-blur-md hover:bg-[#13294F]"
          >
            <span>+45°</span>
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>

          <div className="flex overflow-hidden rounded-xl border border-white/25 bg-[#0B1B36]/90 backdrop-blur-md">
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'streetview') {
                  setSvFov((prev) => Math.max(45, prev - 15));
                } else {
                  setOrbitZoom((prev) => Math.min(18, prev + 1));
                }
              }}
              aria-label={t.zoomInAria}
              className="dz-focus flex h-8 w-8 items-center justify-center text-white hover:bg-[#13294F]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (viewMode === 'streetview') {
                  setSvFov((prev) => Math.min(110, prev + 15));
                } else {
                  setOrbitZoom((prev) => Math.max(16, prev - 1));
                }
              }}
              aria-label={t.zoomOutAria}
              className="dz-focus flex h-8 w-8 items-center justify-center border-l border-white/20 text-white hover:bg-[#13294F]"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
