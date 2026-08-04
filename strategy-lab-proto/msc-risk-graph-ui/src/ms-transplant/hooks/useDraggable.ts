/**
 * useDraggable — Makes a panel draggable by its header.
 * The container element receives a translate transform.
 * Drag starts on mousedown, tracks mousemove, ends on mouseup.
 */
import { useRef, useState, useCallback, useEffect, type CSSProperties, type RefCallback } from 'react';

interface UseDraggableOptions {
  handleSelector?: string;
  initialCentered?: boolean;
}

interface DragHandleProps {
  ref: RefCallback<HTMLElement>;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function useDraggable(_options?: UseDraggableOptions) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  const refCallback: RefCallback<HTMLElement> = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag from the header (class contains "draggable-handle")
    const target = e.target as HTMLElement;
    const handle = target.closest('.draggable-handle');
    if (!handle) return;
    // Don't drag from buttons/inputs inside the handle
    if ((target as HTMLElement).closest('button, input, select, textarea')) return;

    e.preventDefault();
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }, [offset]);

  useEffect(() => {
    if (!isDragging) return;

    function onMouseMove(e: MouseEvent) {
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
    }

    function onMouseUp() {
      setIsDragging(false);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  const dragHandleProps: DragHandleProps = {
    ref: refCallback,
    onMouseDown,
  };

  const containerStyle: CSSProperties = {
    transform: `translate(${offset.x}px, ${offset.y}px)`,
    cursor: isDragging ? 'grabbing' : undefined,
  };

  return { dragHandleProps, containerStyle, isDragging };
}
