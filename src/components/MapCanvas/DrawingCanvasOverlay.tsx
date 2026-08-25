import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Feature } from 'geojson';
import { useProjectStore } from '../../store/useProjectStore';
import type { TimelineLayer } from '../../types/project.types';

// Generate smooth 64-point circle polygon in geographic coordinates
function createCirclePolygon(center: [number, number], radiusLng: number, radiusLat: number, steps = 64): [number, number][] {
  const coords: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const angle = (i * 2 * Math.PI) / steps;
    const lng = center[0] + radiusLng * Math.cos(angle);
    const lat = center[1] + radiusLat * Math.sin(angle);
    coords.push([lng, lat]);
  }
  return coords;
}

// Generate cubic bezier interpolation between anchors
function interpolateBezier(p0: [number, number], cp1: [number, number], cp2: [number, number], p1: [number, number], steps = 10): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;

    const x = uuu * p0[0] + 3 * uu * t * cp1[0] + 3 * u * tt * cp2[0] + ttt * p1[0];
    const y = uuu * p0[1] + 3 * uu * t * cp1[1] + 3 * u * tt * cp2[1] + ttt * p1[1];
    points.push([x, y]);
  }
  return points;
}

let layerIdCounter = 600;

export interface DrawingOverlayProps {
  map: maplibregl.Map | null;
  mapContainerRect: DOMRect | null;
}

export const DrawingCanvasOverlay: React.FC<DrawingOverlayProps> = ({ map, mapContainerRect }) => {
  const {
    activeTool,
    areaDrawingMode,
    addLayer,
    playhead,
    duration,
    selectLayer
  } = useProjectStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPixel, setStartPixel] = useState<{ x: number; y: number } | null>(null);
  const [currentPixel, setCurrentPixel] = useState<{ x: number; y: number } | null>(null);
  const [polygonPixels, setPolygonPixels] = useState<{ x: number; y: number }[]>([]);
  const [freehandPixels, setFreehandPixels] = useState<{ x: number; y: number }[]>([]);
  const [penAnchors, setPenAnchors] = useState<{ pt: { x: number; y: number }; cpOut?: { x: number; y: number }; cpIn?: { x: number; y: number } }[]>([]);

  // Add final area layer to project store
  const finishDrawing = useCallback((geojson: Feature, name: string) => {
    const layerId = `area-layer-${++layerIdCounter}`;
    const defaultColor = '#f59e0b'; // Golden amber matching Hình 1

    const newLayer: TimelineLayer = {
      id: layerId,
      type: 'area',
      name,
      color: defaultColor,
      startTime: playhead,
      endTime: Math.min(playhead + 6, duration),
      visible: true,
      locked: false,
      selected: true,
      areaData: {
        geojson,
        borderWidth: 3.5,
        borderStyle: 'solid',
        borderColor: defaultColor,
        fillColor: defaultColor,
        fillOpacity: 0.35,
        appearEffect: 'draw',
        appearDuration: 1.2,
        exitEffect: 'fade-out',
        exitDuration: 0.8,
        is3D: false,
        extrudeHeight: 500,
      },
    };

    addLayer(newLayer);
    selectLayer(newLayer.id);

    // Reset overlay state
    setIsDrawing(false);
    setStartPixel(null);
    setCurrentPixel(null);
    setPolygonPixels([]);
    setFreehandPixels([]);
    setPenAnchors([]);
  }, [addLayer, selectLayer, playhead, duration]);

  // ── Mouse Handlers on Video Frame Overlay ──────────────────────────────────
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left click
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPixel({ x, y });
    setCurrentPixel({ x, y });

    if (areaDrawingMode === 'freehand') {
      setFreehandPixels([{ x, y }]);
    } else if (areaDrawingMode === 'pen') {
      setPenAnchors(prev => [...prev, { pt: { x, y } }]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentPixel({ x, y });

    if (areaDrawingMode === 'freehand' && isDrawing) {
      setFreehandPixels(prev => {
        const last = prev[prev.length - 1];
        if (!last || Math.hypot(x - last.x, y - last.y) > 3) {
          return [...prev, { x, y }];
        }
        return prev;
      });
    } else if (areaDrawingMode === 'pen' && isDrawing && penAnchors.length > 0) {
      setPenAnchors(prev => {
        const copy = [...prev];
        const last = { ...copy[copy.length - 1] };
        const dx = x - last.pt.x;
        const dy = y - last.pt.y;
        last.cpOut = { x, y };
        last.cpIn = { x: last.pt.x - dx, y: last.pt.y - dy };
        copy[copy.length - 1] = last;
        return copy;
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!startPixel || !currentPixel || !map) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 1. Rectangle / Square
    if (areaDrawingMode === 'rectangle' || areaDrawingMode === 'square') {
      let width = x - startPixel.x;
      let height = y - startPixel.y;

      const isSquare = areaDrawingMode === 'square' || e.shiftKey;
      if (isSquare) {
        const side = Math.max(Math.abs(width), Math.abs(height));
        width = Math.sign(width || 1) * side;
        height = Math.sign(height || 1) * side;
      }

      if (Math.hypot(width, height) > 10) {
        const p0 = map.unproject([startPixel.x, startPixel.y]);
        const p1 = map.unproject([startPixel.x + width, startPixel.y]);
        const p2 = map.unproject([startPixel.x + width, startPixel.y + height]);
        const p3 = map.unproject([startPixel.x, startPixel.y + height]);

        const coords: [number, number][] = [
          [p0.lng, p0.lat],
          [p1.lng, p1.lat],
          [p2.lng, p2.lat],
          [p3.lng, p3.lat],
          [p0.lng, p0.lat],
        ];

        finishDrawing(
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [coords] },
          },
          areaDrawingMode === 'square' ? 'Hình vuông' : 'Hình chữ nhật'
        );
      } else {
        setIsDrawing(false);
        setStartPixel(null);
      }
    }

    // 2. Circle
    else if (areaDrawingMode === 'circle') {
      const radiusPx = Math.hypot(x - startPixel.x, y - startPixel.y);
      if (radiusPx > 8) {
        const center = map.unproject([startPixel.x, startPixel.y]);
        const edge = map.unproject([startPixel.x + radiusPx, startPixel.y]);
        const edgeTop = map.unproject([startPixel.x, startPixel.y - radiusPx]);

        const radiusLng = Math.abs(edge.lng - center.lng);
        const radiusLat = Math.abs(edgeTop.lat - center.lat);

        const circleCoords = createCirclePolygon([center.lng, center.lat], radiusLng, radiusLat, 64);
        finishDrawing(
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [circleCoords] },
          },
          'Hình tròn'
        );
      } else {
        setIsDrawing(false);
        setStartPixel(null);
      }
    }

    // 3. Freehand
    else if (areaDrawingMode === 'freehand') {
      if (freehandPixels.length >= 5) {
        const coords = freehandPixels.map(p => {
          const ll = map.unproject([p.x, p.y]);
          return [ll.lng, ll.lat] as [number, number];
        });
        coords.push(coords[0]); // close polygon

        finishDrawing(
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [coords] },
          },
          'Vùng vẽ tay'
        );
      } else {
        setIsDrawing(false);
        setStartPixel(null);
        setFreehandPixels([]);
      }
    }
  };

  // Click for Polygon
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (areaDrawingMode !== 'polygon' || !map) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (polygonPixels.length >= 3) {
      const first = polygonPixels[0];
      if (Math.hypot(x - first.x, y - first.y) < 15) {
        // Clicked back on first point: close polygon
        const coords = polygonPixels.map(p => {
          const ll = map.unproject([p.x, p.y]);
          return [ll.lng, ll.lat] as [number, number];
        });
        coords.push(coords[0]);

        finishDrawing(
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [coords] },
          },
          'Đa giác'
        );
        return;
      }
    }

    setPolygonPixels(prev => [...prev, { x, y }]);
  };

  // Double click for Polygon & Pen Tool
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!map) return;

    // Double click closes Polygon
    if (areaDrawingMode === 'polygon' && polygonPixels.length >= 3) {
      const coords = polygonPixels.map(p => {
        const ll = map.unproject([p.x, p.y]);
        return [ll.lng, ll.lat] as [number, number];
      });
      coords.push(coords[0]);

      finishDrawing(
        {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [coords] },
        },
        'Đa giác'
      );
    }

    // Double click closes Pen Tool
    else if (areaDrawingMode === 'pen' && penAnchors.length >= 3) {
      const allPts: [number, number][] = [];
      for (let i = 0; i < penAnchors.length; i++) {
        const a1 = penAnchors[i];
        const a2 = penAnchors[(i + 1) % penAnchors.length];
        const cp1 = a1.cpOut ? [a1.cpOut.x, a1.cpOut.y] as [number, number] : [a1.pt.x, a1.pt.y] as [number, number];
        const cp2 = a2.cpIn ? [a2.cpIn.x, a2.cpIn.y] as [number, number] : [a2.pt.x, a2.pt.y] as [number, number];
        const seg = interpolateBezier([a1.pt.x, a1.pt.y], cp1, cp2, [a2.pt.x, a2.pt.y], 10);
        allPts.push(...seg.slice(0, -1));
      }
      allPts.push(allPts[0]);

      const coords = allPts.map(pt => {
        const ll = map.unproject([pt[0], pt[1]]);
        return [ll.lng, ll.lat] as [number, number];
      });

      finishDrawing(
        {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [coords] },
        },
        'Vùng Pen Tool'
      );
    }
  };

  // ── Enter Key Listener to finish Polygon / Pen tool ─────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        if (!map) return;

        // Finish Polygon on Enter
        if (areaDrawingMode === 'polygon' && polygonPixels.length >= 3) {
          const coords = polygonPixels.map(p => {
            const ll = map.unproject([p.x, p.y]);
            return [ll.lng, ll.lat] as [number, number];
          });
          coords.push(coords[0]); // close loop

          finishDrawing(
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'Polygon', coordinates: [coords] },
            },
            'Đa giác'
          );
        }

        // Finish Pen Tool on Enter
        else if (areaDrawingMode === 'pen' && penAnchors.length >= 3) {
          const allPts: [number, number][] = [];
          for (let i = 0; i < penAnchors.length; i++) {
            const a1 = penAnchors[i];
            const a2 = penAnchors[(i + 1) % penAnchors.length];
            const cp1 = a1.cpOut ? [a1.cpOut.x, a1.cpOut.y] as [number, number] : [a1.pt.x, a1.pt.y] as [number, number];
            const cp2 = a2.cpIn ? [a2.cpIn.x, a2.cpIn.y] as [number, number] : [a2.pt.x, a2.pt.y] as [number, number];
            const seg = interpolateBezier([a1.pt.x, a1.pt.y], cp1, cp2, [a2.pt.x, a2.pt.y], 10);
            allPts.push(...seg.slice(0, -1));
          }
          allPts.push(allPts[0]);

          const coords = allPts.map(pt => {
            const ll = map.unproject([pt[0], pt[1]]);
            return [ll.lng, ll.lat] as [number, number];
          });

          finishDrawing(
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'Polygon', coordinates: [coords] },
            },
            'Vùng Pen Tool'
          );
        }
      } else if (e.key === 'Escape') {
        setIsDrawing(false);
        setStartPixel(null);
        setPolygonPixels([]);
        setFreehandPixels([]);
        setPenAnchors([]);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [areaDrawingMode, polygonPixels, penAnchors, map, finishDrawing]);

  if (activeTool !== 'area' || !map) return null;

  return (
    <div
      className="absolute inset-0 z-30 cursor-crosshair select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <svg className="w-full h-full pointer-events-none">
        {/* 1. Rectangle / Square Live Preview (Matches Hình 2) */}
        {(areaDrawingMode === 'rectangle' || areaDrawingMode === 'square') && isDrawing && startPixel && currentPixel && (() => {
          let w = currentPixel.x - startPixel.x;
          let h = currentPixel.y - startPixel.y;
          if (areaDrawingMode === 'square') {
            const side = Math.max(Math.abs(w), Math.abs(h));
            w = Math.sign(w || 1) * side;
            h = Math.sign(h || 1) * side;
          }
          const rx = w < 0 ? startPixel.x + w : startPixel.x;
          const ry = h < 0 ? startPixel.y + h : startPixel.y;
          const rw = Math.abs(w);
          const rh = Math.abs(h);

          return (
            <rect
              x={rx}
              y={ry}
              width={rw}
              height={rh}
              fill="rgba(6, 182, 212, 0.35)"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeDasharray="4 3"
              rx="2"
            />
          );
        })()}

        {/* 2. Circle Live Preview */}
        {areaDrawingMode === 'circle' && isDrawing && startPixel && currentPixel && (() => {
          const r = Math.hypot(currentPixel.x - startPixel.x, currentPixel.y - startPixel.y);
          return (
            <>
              <circle
                cx={startPixel.x}
                cy={startPixel.y}
                r={r}
                fill="rgba(6, 182, 212, 0.35)"
                stroke="#22d3ee"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              {/* Radius guide line */}
              <line
                x1={startPixel.x}
                y1={startPixel.y}
                x2={currentPixel.x}
                y2={currentPixel.y}
                stroke="#22d3ee"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle cx={startPixel.x} cy={startPixel.y} r="3" fill="#00f0ff" />
            </>
          );
        })()}

        {/* 3. Freehand Live Preview */}
        {areaDrawingMode === 'freehand' && freehandPixels.length > 1 && (() => {
          const pathD = freehandPixels.reduce((acc, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '') + ' Z';
          return (
            <path
              d={pathD}
              fill="rgba(6, 182, 212, 0.35)"
              stroke="#22d3ee"
              strokeWidth="2"
              strokeDasharray="3 2"
            />
          );
        })()}

        {/* 4. Polygon Live Preview */}
        {areaDrawingMode === 'polygon' && polygonPixels.length > 0 && (() => {
          const pts = currentPixel ? [...polygonPixels, currentPixel] : polygonPixels;
          const pointsStr = pts.map(p => `${p.x},${p.y}`).join(' ');
          return (
            <>
              <polygon
                points={pointsStr}
                fill="rgba(6, 182, 212, 0.25)"
                stroke="#22d3ee"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              {polygonPixels.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={i === 0 ? 5 : 3.5}
                  fill={i === 0 ? '#22d3ee' : '#ffffff'}
                  stroke="#0891b2"
                  strokeWidth="1.5"
                />
              ))}
            </>
          );
        })()}

        {/* 5. Pen Tool Live Preview with Real-time Curved SVG Path */}
        {areaDrawingMode === 'pen' && penAnchors.length > 0 && (() => {
          let pathD = `M ${penAnchors[0].pt.x} ${penAnchors[0].pt.y}`;
          for (let i = 0; i < penAnchors.length - 1; i++) {
            const a1 = penAnchors[i];
            const a2 = penAnchors[i + 1];
            const cp1 = a1.cpOut || a1.pt;
            const cp2 = a2.cpIn || a2.pt;
            pathD += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${a2.pt.x} ${a2.pt.y}`;
          }

          // Active line to cursor
          if (currentPixel && penAnchors.length > 0) {
            const lastA = penAnchors[penAnchors.length - 1];
            const cp1 = lastA.cpOut || lastA.pt;
            pathD += ` C ${cp1.x} ${cp1.y}, ${currentPixel.x} ${currentPixel.y}, ${currentPixel.x} ${currentPixel.y}`;
          }

          return (
            <>
              {/* Smooth Curved Preview Path */}
              <path
                d={pathD}
                fill="rgba(6, 182, 212, 0.25)"
                stroke="#22d3ee"
                strokeWidth="2.5"
                strokeDasharray="4 3"
              />

              {/* Anchor points and Bezier handles */}
              {penAnchors.map((a, i) => (
                <g key={i}>
                  <circle cx={a.pt.x} cy={a.pt.y} r={i === 0 ? 5 : 3.5} fill={i === 0 ? '#22d3ee' : '#ffffff'} stroke="#0891b2" strokeWidth="2" />
                  {a.cpOut && (
                    <>
                      <line x1={a.pt.x} y1={a.pt.y} x2={a.cpOut.x} y2={a.cpOut.y} stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="2 2" />
                      <circle cx={a.cpOut.x} cy={a.cpOut.y} r="3" fill="#22d3ee" />
                    </>
                  )}
                  {a.cpIn && (
                    <>
                      <line x1={a.pt.x} y1={a.pt.y} x2={a.cpIn.x} y2={a.cpIn.y} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                      <circle cx={a.cpIn.x} cy={a.cpIn.y} r="3" fill="#f59e0b" />
                    </>
                  )}
                </g>
              ))}
            </>
          );
        })()}
      </svg>
    </div>
  );
};
