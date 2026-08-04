/* FloatingWindow — shared floating window infrastructure.
   Glass material chrome, traffic lights (close/minimize/maximize),
   titlebar drag, 8-edge resize, maximize-toggle, minimize-to-dock.

   Consumers pass position/size as controlled props.
   Window mode (normal/maximized/minimized) is internal state. */

import { useState, useRef, useCallback, useEffect } from 'react';

/* ── Resize edge detection ── */

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null;

const EDGE_ZONE = 12;

const EDGE_CURSORS: Record<string, string> = {
  n: 'n-resize', s: 's-resize', e: 'e-resize', w: 'w-resize',
  ne: 'ne-resize', nw: 'nw-resize', se: 'se-resize', sw: 'sw-resize',
};

function detectEdge(clientX: number, clientY: number, rect: DOMRect): ResizeEdge {
  const left = clientX - rect.left < EDGE_ZONE;
  const right = rect.right - clientX < EDGE_ZONE;
  const top = clientY - rect.top < EDGE_ZONE;
  const bottom = rect.bottom - clientY < EDGE_ZONE;

  if (top && left) return 'nw';
  if (top && right) return 'ne';
  if (bottom && left) return 'sw';
  if (bottom && right) return 'se';
  if (top) return 'n';
  if (bottom) return 's';
  if (left) return 'w';
  if (right) return 'e';
  return null;
}

/* ── Types ── */

type WindowMode = 'normal' | 'maximized' | 'minimized';

interface SavedLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloatingWindowProps {
  open: boolean;
  title: string;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  size: { width: number; height: number };
  onSizeChange: (size: { width: number; height: number }) => void;
  onClose?: () => void;            // undefined = close button disabled
  resizable?: boolean;              // default true
  minWidth?: number;                // default 700
  minHeight?: number;               // default 500
  className?: string;               // additional class on root
  titleBarExtra?: React.ReactNode;  // content after title (e.g. tabs)
  children: React.ReactNode;
}

const TOOLBAR_HEIGHT = 52;
const TITLEBAR_HEIGHT = 44;
const MINIMIZED_WIDTH = 280;
const DOCK_BOTTOM_OFFSET = 12;

export function FloatingWindow({
  open,
  title,
  position,
  onPositionChange,
  size,
  onSizeChange,
  onClose,
  resizable = true,
  minWidth = 700,
  minHeight = 500,
  className,
  titleBarExtra,
  children,
}: FloatingWindowProps) {
  const windowRef = useRef<HTMLDivElement>(null);

  /* ── Window mode state ── */
  const [windowMode, setWindowMode] = useState<WindowMode>('normal');
  const savedLayout = useRef<SavedLayout>({
    x: position.x,
    y: position.y,
    width: size.width,
    height: size.height,
  });

  // Keep savedLayout in sync with props while in normal mode
  useEffect(() => {
    if (windowMode === 'normal') {
      savedLayout.current = {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
      };
    }
  }, [windowMode, position.x, position.y, size.width, size.height]);

  /* ── Maximize ── */

  const handleMaximize = useCallback(() => {
    if (windowMode === 'maximized') {
      // Restore to saved normal layout
      const s = savedLayout.current;
      onPositionChange({ x: s.x, y: s.y });
      onSizeChange({ width: s.width, height: s.height });
      setWindowMode('normal');
    } else {
      // Save current layout if in normal mode (minimized keeps existing ref)
      if (windowMode === 'normal') {
        savedLayout.current = {
          x: position.x,
          y: position.y,
          width: size.width,
          height: size.height,
        };
      }
      onPositionChange({ x: 0, y: TOOLBAR_HEIGHT });
      onSizeChange({ width: window.innerWidth, height: window.innerHeight - TOOLBAR_HEIGHT });
      setWindowMode('maximized');
    }
  }, [windowMode, position, size, onPositionChange, onSizeChange]);

  /* ── Minimize ── */

  const handleMinimize = useCallback(() => {
    if (windowMode === 'minimized') {
      // Restore to saved normal layout
      const s = savedLayout.current;
      onPositionChange({ x: s.x, y: s.y });
      onSizeChange({ width: s.width, height: s.height });
      setWindowMode('normal');
    } else {
      // Save current layout if in normal mode (maximized keeps existing ref)
      if (windowMode === 'normal') {
        savedLayout.current = {
          x: position.x,
          y: position.y,
          width: size.width,
          height: size.height,
        };
      }
      // Dock at bottom center
      const dockX = Math.round((window.innerWidth - MINIMIZED_WIDTH) / 2);
      const dockY = window.innerHeight - TITLEBAR_HEIGHT - DOCK_BOTTOM_OFFSET;
      onPositionChange({ x: dockX, y: dockY });
      onSizeChange({ width: MINIMIZED_WIDTH, height: TITLEBAR_HEIGHT });
      setWindowMode('minimized');
    }
  }, [windowMode, position, size, onPositionChange, onSizeChange]);

  /* ── Track viewport resize while maximized ── */

  useEffect(() => {
    if (windowMode !== 'maximized') return;
    const handleResize = () => {
      onPositionChange({ x: 0, y: TOOLBAR_HEIGHT });
      onSizeChange({ width: window.innerWidth, height: window.innerHeight - TOOLBAR_HEIGHT });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [windowMode, onPositionChange, onSizeChange]);

  /* ── Drag (titlebar only, disabled when maximized/minimized) ── */

  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleTitlebarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (windowMode !== 'normal') return;
      if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
      // Don't start drag if cursor is on a resize edge — let it bubble to resize handler
      if (resizable) {
        const el = windowRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          if (detectEdge(e.clientX, e.clientY, rect)) return;
        }
      }
      setDragging(true);
      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    },
    [position, windowMode, resizable],
  );

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      onPositionChange({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const handleMouseUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, onPositionChange]);

  /* ── Resize (8-edge, disabled when maximized/minimized) ── */

  const [resizing, setResizing] = useState(false);
  const resizeEdge = useRef<ResizeEdge>(null);
  const resizeStart = useRef({ mouseX: 0, mouseY: 0, x: 0, y: 0, w: 0, h: 0 });
  const [hoverCursor, setHoverCursor] = useState<string | null>(null);

  const handleWindowMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!resizable || windowMode !== 'normal') return;
      const el = windowRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const edge = detectEdge(e.clientX, e.clientY, rect);
      if (!edge) return;

      e.preventDefault();
      e.stopPropagation();
      resizeEdge.current = edge;
      resizeStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        x: position.x,
        y: position.y,
        w: size.width,
        h: size.height,
      };
      setResizing(true);
    },
    [resizable, windowMode, position, size],
  );

  useEffect(() => {
    if (!resizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      const edge = resizeEdge.current;
      if (!edge) return;

      const { mouseX, mouseY, x, y, w, h } = resizeStart.current;
      const dx = e.clientX - mouseX;
      const dy = e.clientY - mouseY;

      let newX = x;
      let newY = y;
      let newW = w;
      let newH = h;

      if (edge.includes('e')) {
        newW = Math.max(minWidth, w + dx);
      }
      if (edge.includes('w')) {
        const proposedW = w - dx;
        if (proposedW >= minWidth) {
          newW = proposedW;
          newX = x + dx;
        } else {
          newW = minWidth;
          newX = x + (w - minWidth);
        }
      }
      if (edge === 's' || edge === 'se' || edge === 'sw') {
        newH = Math.max(minHeight, h + dy);
      }
      if (edge === 'n' || edge === 'ne' || edge === 'nw') {
        const proposedH = h - dy;
        if (proposedH >= minHeight) {
          newH = proposedH;
          newY = y + dy;
        } else {
          newH = minHeight;
          newY = y + (h - minHeight);
        }
      }

      onSizeChange({ width: newW, height: newH });
      onPositionChange({ x: newX, y: newY });
    };
    const handleMouseUp = () => {
      setResizing(false);
      resizeEdge.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, minWidth, minHeight, onSizeChange, onPositionChange]);

  /* ── Hover cursor for resize edges ── */

  const handleWindowMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (dragging || resizing || !resizable || windowMode !== 'normal') return;
      const el = windowRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const edge = detectEdge(e.clientX, e.clientY, rect);
      setHoverCursor(edge ? EDGE_CURSORS[edge] : null);
    },
    [dragging, resizing, resizable, windowMode],
  );

  const handleWindowMouseLeave = useCallback(() => {
    if (!resizing) setHoverCursor(null);
  }, [resizing]);

  /* ── Render ── */

  if (!open) return null;

  const modeClass =
    windowMode === 'maximized' ? ' floating-window--maximized' :
    windowMode === 'minimized' ? ' floating-window--minimized' :
    '';

  return (
    <div
      ref={windowRef}
      className={`floating-window${modeClass}${className ? ` ${className}` : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: windowMode === 'minimized' ? TITLEBAR_HEIGHT : size.height,
        minWidth: windowMode === 'normal' ? minWidth : undefined,
        minHeight: windowMode === 'normal' ? minHeight : undefined,
        userSelect: dragging || resizing ? 'none' : 'auto',
        cursor: hoverCursor ?? undefined,
      }}
      role="dialog"
      aria-label={title}
      aria-modal="false"
      onMouseDown={handleWindowMouseDown}
      onMouseMove={handleWindowMouseMove}
      onMouseLeave={handleWindowMouseLeave}
      onClick={windowMode === 'minimized' ? handleMinimize : undefined}
    >
      {/* Title bar */}
      <div
        className={`floating-window-titlebar${dragging ? ' dragging' : ''}`}
        onMouseDown={handleTitlebarMouseDown}
      >
        <div className="floating-window-traffic-lights" data-no-drag>
          <button
            className="vexy-traffic-light close"
            disabled={!onClose}
            onClick={onClose}
            aria-label={`Close ${title}`}
          />
          <button
            className="vexy-traffic-light minimize"
            onClick={handleMinimize}
            aria-label="Minimize"
          />
          <button
            className="vexy-traffic-light maximize"
            onClick={handleMaximize}
            aria-label="Maximize"
          />
        </div>
        <span className="floating-window-title">{title}</span>
        {titleBarExtra ?? <div className="floating-window-titlebar-spacer" />}
      </div>

      {/* Window body — hidden when minimized */}
      {windowMode !== 'minimized' && (
        <div className="floating-window-body">
          {children}
        </div>
      )}
    </div>
  );
}
