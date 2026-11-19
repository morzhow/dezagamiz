import { useRef, useState, type RefObject } from 'react';
import { computePegmanTiltDegrees } from '../lib/dezagamiz';
import { useI18n } from '../lib/i18n';

interface PegmanIconProps {
  variant?: 'standing' | 'dangling' | 'badge';
  className?: string;
}

export function PegmanIcon({
  variant = 'standing',
  className = 'h-6 w-6',
}: PegmanIconProps) {
  if (variant === 'dangling') {
    return (
      <svg
        viewBox="0 0 36 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        {/* Head */}
        <circle
          cx="18"
          cy="7.5"
          r="5"
          fill="#FBBC04"
          stroke="#925400"
          strokeWidth="1.6"
        />
        <circle cx="16.4" cy="6.4" r="1.2" fill="#FEF08A" opacity="0.85" />
        {/* Raised swinging arms & torso */}
        <path
          d="M6.5 11.5C7.6 10.2 9.5 10.5 10.5 11.8L13.5 15.6H22.5L25.5 11.8C26.5 10.5 28.4 10.2 29.5 11.5C30.4 12.6 30.1 14.3 29 15.3L24.5 19.6V28.5L27 37.5C27.4 39 26.4 40.5 24.9 40.8C23.5 41.1 22.1 40.2 21.7 38.8L19.4 30.5H16.6L14.3 38.8C13.9 40.2 12.5 41.1 11.1 40.8C9.6 40.5 8.6 39 9 37.5L11.5 28.5V19.6L7 15.3C5.9 14.3 5.6 12.6 6.5 11.5Z"
          fill="#FBBC04"
          stroke="#925400"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        {/* Collar accent */}
        <path
          d="M14.5 15.6H21.5"
          stroke="#D97706"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (variant === 'badge') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="5.2"
          r="3.2"
          fill="#FBBC04"
          stroke="#925400"
          strokeWidth="1.4"
        />
        <path
          d="M7.5 11.2C7.5 10 8.5 9.1 9.7 9.1H14.3C15.5 9.1 16.5 10 16.5 11.2V16.2C16.5 17 15.9 17.6 15.1 17.6H14.6V21.2C14.6 22 14 22.6 13.2 22.6C12.5 22.6 12 22.1 12 21.4V17.6H12V21.4C12 22.1 11.5 22.6 10.8 22.6C10 22.6 9.4 22 9.4 21.2V17.6H8.9C8.1 17.6 7.5 17 7.5 16.2V11.2Z"
          fill="#FBBC04"
          stroke="#925400"
          strokeWidth="1.35"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Ground shadow */}
      <ellipse cx="16" cy="37" rx="7" ry="2" fill="#0F172A" opacity="0.16" />
      {/* Head */}
      <circle
        cx="16"
        cy="7"
        r="4.7"
        fill="#FBBC04"
        stroke="#925400"
        strokeWidth="1.5"
      />
      <circle cx="14.5" cy="5.8" r="1.1" fill="#FEF08A" opacity="0.9" />
      {/* Standing Pegman torso, arms, and legs */}
      <path
        d="M8 16.2C8 14.3 9.5 12.8 11.4 12.8H20.6C22.5 12.8 24 14.3 24 16.2V23.4C24 24.5 23.1 25.4 22 25.4H20.8V33.6C20.8 34.8 19.8 35.8 18.6 35.8C17.4 35.8 16.5 34.8 16.5 33.6V26.2H15.5V33.6C15.5 34.8 14.6 35.8 13.4 35.8C12.2 35.8 11.2 34.8 11.2 33.6V25.4H10C8.9 25.4 8 24.5 8 23.4V16.2Z"
        fill="#FBBC04"
        stroke="#925400"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Arm separation details */}
      <path
        d="M11.3 18.5V24.5M20.7 18.5V24.5"
        stroke="#B45309"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface PegmanMapWidgetProps {
  isHidden: boolean;
  dockClassName: string;
  containerRef: RefObject<HTMLDivElement | null>;
  onClickOpenDefault360: () => void;
  onDropAtOffset: (
    xPx: number,
    yPx: number,
    viewportWidth: number,
    viewportHeight: number,
  ) => void;
  onResolveSnapPreview?: (
    xPx: number,
    yPx: number,
    viewportWidth: number,
    viewportHeight: number,
  ) => string | null;
  onDraggingChange?: (dragging: boolean) => void;
}

export function PegmanMapWidget({
  isHidden,
  dockClassName,
  containerRef,
  onClickOpenDefault360,
  onDropAtOffset,
  onResolveSnapPreview,
  onDraggingChange,
}: PegmanMapWidgetProps) {
  const { t } = useI18n();
  const [dragState, setDragState] = useState<{
    active: boolean;
    x: number;
    y: number;
    tiltDeg: number;
    snapLabel: string | null;
  } | null>(null);

  const pointerSessionRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    lastClientX: number;
    moved: boolean;
  } | null>(null);

  if (isHidden) return null;

  function computeLocalCoords(clientX: number, clientY: number) {
    const el = containerRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return {
      x: Math.max(16, Math.min(rect.width - 16, x)),
      y: Math.max(24, Math.min(rect.height - 16, y)),
      inside:
        x >= 0 && x <= rect.width && y >= 0 && y <= rect.height,
      width: rect.width,
      height: rect.height,
    };
  }

  function handlePointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.stopPropagation();
    pointerSessionRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      lastClientX: e.clientX,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const sess = pointerSessionRef.current;
    if (!sess || sess.pointerId !== e.pointerId) return;

    const totalMove = Math.hypot(
      e.clientX - sess.startClientX,
      e.clientY - sess.startClientY,
    );
    if (!sess.moved && totalMove < 6) {
      return;
    }

    if (!sess.moved) {
      sess.moved = true;
      onDraggingChange?.(true);
    }

    const deltaX = e.clientX - sess.lastClientX;
    sess.lastClientX = e.clientX;
    const coords = computeLocalCoords(e.clientX, e.clientY);
    if (!coords) return;

    const snapLabel =
      onResolveSnapPreview?.(
        coords.x,
        coords.y,
        coords.width,
        coords.height,
      ) ?? null;

    setDragState({
      active: true,
      x: coords.x,
      y: coords.y,
      tiltDeg: computePegmanTiltDegrees(deltaX),
      snapLabel,
    });
  }

  function finishPointer(e: React.PointerEvent<HTMLButtonElement>, cancelled: boolean) {
    const sess = pointerSessionRef.current;
    if (!sess || sess.pointerId !== e.pointerId) return;
    pointerSessionRef.current = null;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const wasMoved = sess.moved;
    setDragState(null);
    onDraggingChange?.(false);

    if (cancelled) return;

    if (!wasMoved) {
      onClickOpenDefault360();
      return;
    }

    const coords = computeLocalCoords(e.clientX, e.clientY);
    if (coords && coords.inside) {
      onDropAtOffset(coords.x, coords.y, coords.width, coords.height);
    }
  }

  return (
    <>
      {/* Full-map Coverage Drop Halo + Dangling Yellow Pegman while dragging */}
      {dragState?.active && (
        <div
          className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
          aria-hidden="true"
        >
          {/* Subtle Street-View-blue atmospheric tint signaling interactive 360° drop */}
          <div className="absolute inset-0 bg-[#0B57D0]/[0.06] ring-2 ring-inset ring-[#38BDF8]/40" />

          {/* Pulsing Google Street View drop target circle beneath Pegman's feet */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${dragState.x}px`, top: `${dragState.y}px` }}
          >
            <span className="block h-14 w-14 animate-ping rounded-full bg-[#38BDF8]/40" />
            <span className="absolute left-1/2 top-1/2 block h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#0284C7]/75 shadow-lg" />
          </div>

          {/* Floating swinging Yellow Pegman avatar */}
          <div
            data-testid="pegman-dragging-avatar"
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{
              left: `${dragState.x}px`,
              top: `${dragState.y - 2}px`,
              transform: `translate(-50%, -100%) rotate(${dragState.tiltDeg}deg)`,
              transition: 'transform 80ms ease-out',
            }}
          >
            <PegmanIcon
              variant="dangling"
              className="h-12 w-10 drop-shadow-[0_6px_12px_rgba(10,29,59,0.45)]"
            />
          </div>

          {/* Drop action / snapped station badge */}
          <div
            className="absolute -translate-x-1/2 whitespace-nowrap rounded-xl border border-white/25 bg-[#092C63]/95 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg backdrop-blur-md"
            style={{
              left: `${dragState.x}px`,
              top: `${Math.max(12, dragState.y - 62)}px`,
            }}
          >
            {dragState.snapLabel
              ? `360° · ${dragState.snapLabel}`
              : t.pegmanDropAction}
          </div>
        </div>
      )}

      {/* Docked Google Maps Yellow Pegman Control */}
      <div className={`group absolute z-30 flex items-center gap-2 ${dockClassName}`}>
        {!dragState?.active && (
          <span className="pointer-events-none hidden whitespace-nowrap rounded-xl border border-[var(--dz-border)] bg-[var(--dz-surface)]/95 px-2.5 py-1 text-[11px] font-semibold text-[var(--dz-ink)] shadow-md backdrop-blur-sm sm:group-hover:inline-flex">
            {t.pegmanDragTooltip}
          </span>
        )}

        <button
          type="button"
          data-testid="pegman-control"
          aria-label={t.pegmanAriaLabel}
          title={t.pegmanDragTooltip}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={(e) => finishPointer(e, false)}
          onPointerCancel={(e) => finishPointer(e, true)}
          style={{ touchAction: 'none' }}
          className={`dz-focus relative flex h-10 w-10 items-center justify-center rounded-xl border shadow-md backdrop-blur-md transition-all duration-150 ${
            dragState?.active
              ? 'border-dashed border-[#F59E0B] bg-[var(--dz-surface)]/45 opacity-50'
              : 'cursor-grab border-[var(--dz-border)] bg-[var(--dz-surface)]/95 hover:-translate-y-0.5 hover:border-[#F59E0B] hover:bg-[#FFFBEB] dark:hover:bg-[#2B2108] active:cursor-grabbing'
          }`}
        >
          {!dragState?.active && (
            <PegmanIcon variant="standing" className="h-7 w-6 transition-transform duration-150 group-hover:scale-110" />
          )}
          <span className="pointer-events-none absolute -bottom-1 -right-1 rounded-md border border-white/80 bg-[#0B57D0] px-1 text-[8px] font-extrabold leading-tight text-white shadow-xs">
            360
          </span>
        </button>
      </div>
    </>
  );
}
