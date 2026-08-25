import { useEffect, useRef, useCallback } from 'react';
import type { MutableRefObject } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Feature } from 'geojson';
import { useProjectStore } from '../store/useProjectStore';
import type { TimelineLayer } from '../types/project.types';

let layerIdCounter = 500;

const COLORS = [
  '#f59e0b', '#ef4444', '#3b82f6', '#10b981',
  '#8b5cf6', '#f97316', '#ec4899', '#06b6d4',
];

// Helper: generate smooth 64-point circle polygon
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

// Helper: interpolate cubic bezier between anchors
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

export function useAreaDrawing(
  mapRef: MutableRefObject<maplibregl.Map | null>,
  mapReady: boolean
) {
  const {
    activeTool,
    areaDrawingMode,
    addLayer,
    playhead,
    duration,
    selectedLayerId,
    layers,
    updateAreaGeojson,
    selectLayer
  } = useProjectStore();

  const previewSourceId = 'area-drawing-preview-source';
  const previewFillId = 'area-drawing-preview-fill';
  const previewLineId = 'area-drawing-preview-line';

  // Interaction state
  const stateRef = useRef<{
    isDragging: boolean;
    startPoint: [number, number] | null;
    polygonPoints: [number, number][];
    freehandPoints: [number, number][];
    penAnchors: { pt: [number, number]; cpOut: [number, number] | null; cpIn: [number, number] | null }[];
    isDraggingPenHandle: boolean;
  }>({
    isDragging: false,
    startPoint: null,
    polygonPoints: [],
    freehandPoints: [],
    penAnchors: [],
    isDraggingPenHandle: false,
  });

  const vertexMarkersRef = useRef<maplibregl.Marker[]>([]);

  // Update real-time preview GeoJSON on map
  const updatePreview = useCallback((geojson: Feature | null) => {
    const map = mapRef.current;
    if (!map) return;

    if (!geojson) {
      if (map.getSource(previewSourceId)) {
        (map.getSource(previewSourceId) as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: [],
        });
      }
      return;
    }

    if (!map.getSource(previewSourceId)) {
      map.addSource(previewSourceId, { type: 'geojson', data: geojson });
      map.addLayer({
        id: previewFillId,
        type: 'fill',
        source: previewSourceId,
        paint: {
          'fill-color': '#06b6d4',
          'fill-opacity': 0.3,
        },
      });
      map.addLayer({
        id: previewLineId,
        type: 'line',
        source: previewSourceId,
        paint: {
          'line-color': '#22d3ee',
          'line-width': 2.5,
          'line-dasharray': [3, 2],
        },
      });
    } else {
      (map.getSource(previewSourceId) as maplibregl.GeoJSONSource).setData(geojson);
    }
  }, [mapRef]);

  // Add final area layer to project store
  const addAreaToMap = useCallback(
    (geojson: Feature, name: string) => {
      const colorIndex = layerIdCounter % COLORS.length;
      const color = COLORS[colorIndex];
      const layerId = `area-layer-${++layerIdCounter}`;

      const newLayer: TimelineLayer = {
        id: layerId,
        type: 'area',
        name,
        color,
        startTime: playhead,
        endTime: Math.min(playhead + 6, duration),
        visible: true,
        locked: false,
        selected: true,
        areaData: {
          geojson,
          borderWidth: 2.5,
          borderStyle: 'solid',
          borderColor: color,
          fillColor: color,
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
      updatePreview(null);
    },
    [addLayer, selectLayer, playhead, duration, updatePreview]
  );

  // ── Main Drawing Event Listeners ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (activeTool !== 'area') {
      updatePreview(null);
      stateRef.current = {
        isDragging: false,
        startPoint: null,
        polygonPoints: [],
        freehandPoints: [],
        penAnchors: [],
        isDraggingPenHandle: false,
      };
      map.getCanvas().style.cursor = '';
      map.dragPan.enable();
      map.doubleClickZoom.enable();
      return;
    }

    map.getCanvas().style.cursor = 'crosshair';
    map.doubleClickZoom.disable();

    // ── Mouse Down ─────────────────────────────────────────────────────────────
    const onMouseDown = (e: maplibregl.MapMouseEvent) => {
      const pt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      stateRef.current.isDragging = true;
      stateRef.current.startPoint = pt;

      // Disable map pan for drag-based tools
      if (
        areaDrawingMode === 'rectangle' ||
        areaDrawingMode === 'square' ||
        areaDrawingMode === 'circle' ||
        areaDrawingMode === 'freehand'
      ) {
        map.dragPan.disable();
      }

      if (areaDrawingMode === 'freehand') {
        stateRef.current.freehandPoints = [pt];
      } else if (areaDrawingMode === 'pen') {
        // Pen tool: start new anchor and handle dragging
        stateRef.current.isDraggingPenHandle = true;
        stateRef.current.penAnchors.push({ pt, cpOut: null, cpIn: null });
      }
    };

    // ── Mouse Move ─────────────────────────────────────────────────────────────
    const onMouseMove = (e: maplibregl.MapMouseEvent) => {
      const currPt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const { isDragging, startPoint, polygonPoints, freehandPoints, penAnchors, isDraggingPenHandle } = stateRef.current;

      // 1. Đa giác (Polygon Preview): cursor line from last point to current mouse
      if (areaDrawingMode === 'polygon' && polygonPoints.length > 0) {
        const previewCoords = [...polygonPoints, currPt, polygonPoints[0]];
        updatePreview({
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [previewCoords] },
        });
        return;
      }

      // 2. Pen Tool: dragging bezier handle or moving cursor preview
      if (areaDrawingMode === 'pen') {
        if (isDraggingPenHandle && penAnchors.length > 0) {
          const lastAnchor = penAnchors[penAnchors.length - 1];
          const dLng = currPt[0] - lastAnchor.pt[0];
          const dLat = currPt[1] - lastAnchor.pt[1];
          lastAnchor.cpOut = currPt;
          lastAnchor.cpIn = [lastAnchor.pt[0] - dLng, lastAnchor.pt[1] - dLat];
        }

        if (penAnchors.length > 0) {
          const pts: [number, number][] = [];
          for (let i = 0; i < penAnchors.length - 1; i++) {
            const a1 = penAnchors[i];
            const a2 = penAnchors[i + 1];
            const cp1 = a1.cpOut || a1.pt;
            const cp2 = a2.cpIn || a2.pt;
            const seg = interpolateBezier(a1.pt, cp1, cp2, a2.pt, 8);
            pts.push(...seg.slice(0, -1));
          }
          const lastA = penAnchors[penAnchors.length - 1];
          const firstA = penAnchors[0];
          pts.push(lastA.pt, currPt, firstA.pt);

          updatePreview({
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [pts] },
          });
        }
        return;
      }

      if (!isDragging || !startPoint) return;

      // 3. Hình chữ nhật / Hình vuông (Rectangle / Square)
      if (areaDrawingMode === 'rectangle' || areaDrawingMode === 'square') {
        const p0 = startPoint;
        let dLng = currPt[0] - p0[0];
        let dLat = currPt[1] - p0[1];

        const isSquare = areaDrawingMode === 'square' || e.originalEvent.shiftKey;
        if (isSquare) {
          const latRad = (p0[1] * Math.PI) / 180;
          const cosLat = Math.cos(latRad) || 1;
          const avgDist = Math.max(Math.abs(dLng * cosLat), Math.abs(dLat));
          dLng = Math.sign(dLng || 1) * (avgDist / cosLat);
          dLat = Math.sign(dLat || 1) * avgDist;
        }

        const p1: [number, number] = [p0[0] + dLng, p0[1]];
        const p2: [number, number] = [p0[0] + dLng, p0[1] + dLat];
        const p3: [number, number] = [p0[0], p0[1] + dLat];
        const rectCoords = [p0, p1, p2, p3, p0];

        updatePreview({
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [rectCoords] },
        });
      }

      // 4. Hình tròn (Circle)
      else if (areaDrawingMode === 'circle') {
        const p0 = startPoint;
        const latRad = (p0[1] * Math.PI) / 180;
        const cosLat = Math.cos(latRad) || 1;
        const dLng = (currPt[0] - p0[0]) * cosLat;
        const dLat = currPt[1] - p0[1];
        const radius = Math.hypot(dLng, dLat);

        const circleCoords = createCirclePolygon(p0, radius / cosLat, radius);
        updatePreview({
          type: 'Feature',
          properties: {},
          geometry: { type: 'Polygon', coordinates: [circleCoords] },
        });
      }

      // 5. Vẽ tay (Freehand)
      else if (areaDrawingMode === 'freehand') {
        const lastPt = freehandPoints[freehandPoints.length - 1];
        if (!lastPt || Math.hypot(currPt[0] - lastPt[0], currPt[1] - lastPt[1]) > 0.0002) {
          freehandPoints.push(currPt);
          if (freehandPoints.length >= 3) {
            updatePreview({
              type: 'Feature',
              properties: {},
              geometry: { type: 'Polygon', coordinates: [[...freehandPoints, freehandPoints[0]]] },
            });
          }
        }
      }
    };

    // ── Mouse Up ───────────────────────────────────────────────────────────────
    const onMouseUp = (e: maplibregl.MapMouseEvent) => {
      const currPt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const { startPoint, freehandPoints } = stateRef.current;
      stateRef.current.isDragging = false;
      stateRef.current.isDraggingPenHandle = false;
      map.dragPan.enable();

      if (!startPoint) return;

      // Finish Rectangle / Square
      if (areaDrawingMode === 'rectangle' || areaDrawingMode === 'square') {
        const p0 = startPoint;
        let dLng = currPt[0] - p0[0];
        let dLat = currPt[1] - p0[1];

        if (Math.hypot(dLng, dLat) > 0.0003) {
          const isSquare = areaDrawingMode === 'square' || e.originalEvent.shiftKey;
          if (isSquare) {
            const latRad = (p0[1] * Math.PI) / 180;
            const cosLat = Math.cos(latRad) || 1;
            const avgDist = Math.max(Math.abs(dLng * cosLat), Math.abs(dLat));
            dLng = Math.sign(dLng || 1) * (avgDist / cosLat);
            dLat = Math.sign(dLat || 1) * avgDist;
          }

          const p1: [number, number] = [p0[0] + dLng, p0[1]];
          const p2: [number, number] = [p0[0] + dLng, p0[1] + dLat];
          const p3: [number, number] = [p0[0], p0[1] + dLat];
          const rectCoords = [p0, p1, p2, p3, p0];

          addAreaToMap(
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'Polygon', coordinates: [rectCoords] },
            },
            areaDrawingMode === 'square' ? 'Hình vuông' : 'Hình chữ nhật'
          );
        }
        stateRef.current.startPoint = null;
      }

      // Finish Circle
      else if (areaDrawingMode === 'circle') {
        const p0 = startPoint;
        const latRad = (p0[1] * Math.PI) / 180;
        const cosLat = Math.cos(latRad) || 1;
        const dLng = (currPt[0] - p0[0]) * cosLat;
        const dLat = currPt[1] - p0[1];
        const radius = Math.hypot(dLng, dLat);

        if (radius > 0.0003) {
          const circleCoords = createCirclePolygon(p0, radius / cosLat, radius);
          addAreaToMap(
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'Polygon', coordinates: [circleCoords] },
            },
            'Hình tròn'
          );
        }
        stateRef.current.startPoint = null;
      }

      // Finish Freehand
      else if (areaDrawingMode === 'freehand') {
        if (freehandPoints.length >= 4) {
          const closedCoords = [...freehandPoints, freehandPoints[0]];
          addAreaToMap(
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'Polygon', coordinates: [closedCoords] },
            },
            'Vùng vẽ tay'
          );
        }
        stateRef.current.freehandPoints = [];
        stateRef.current.startPoint = null;
      }
    };

    // ── Click for Polygon & Pen Tool ───────────────────────────────────────────
    const onClick = (e: maplibregl.MapMouseEvent) => {
      const pt: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      if (areaDrawingMode === 'polygon') {
        const points = stateRef.current.polygonPoints;
        // Check if clicking back on first point to close polygon
        if (points.length >= 3) {
          const first = points[0];
          const dist = Math.hypot(pt[0] - first[0], pt[1] - first[1]);
          if (dist < 0.003) {
            const closedCoords = [...points, points[0]];
            addAreaToMap(
              {
                type: 'Feature',
                properties: {},
                geometry: { type: 'Polygon', coordinates: [closedCoords] },
              },
              'Đa giác'
            );
            stateRef.current.polygonPoints = [];
            return;
          }
        }
        points.push(pt);
      }
    };

    // ── Double Click to Finish Polygon & Pen Tool ──────────────────────────────
    const onDblClick = (e: maplibregl.MapMouseEvent) => {
      e.preventDefault();

      // Finish Polygon
      if (areaDrawingMode === 'polygon') {
        const points = stateRef.current.polygonPoints;
        if (points.length >= 3) {
          const closedCoords = [...points, points[0]];
          addAreaToMap(
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'Polygon', coordinates: [closedCoords] },
            },
            'Đa giác'
          );
        }
        stateRef.current.polygonPoints = [];
      }

      // Finish Pen Tool (double click closes path and connects to origin)
      else if (areaDrawingMode === 'pen') {
        const anchors = stateRef.current.penAnchors;
        if (anchors.length >= 3) {
          const polyCoords: [number, number][] = [];
          for (let i = 0; i < anchors.length; i++) {
            const a1 = anchors[i];
            const a2 = anchors[(i + 1) % anchors.length];
            const cp1 = a1.cpOut || a1.pt;
            const cp2 = a2.cpIn || a2.pt;
            const segment = interpolateBezier(a1.pt, cp1, cp2, a2.pt, 10);
            polyCoords.push(...segment.slice(0, -1));
          }
          polyCoords.push(polyCoords[0]);

          addAreaToMap(
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'Polygon', coordinates: [polyCoords] },
            },
            'Vùng Pen Tool'
          );
        }
        stateRef.current.penAnchors = [];
        updatePreview(null);
      }
    };

    // ── Keydown to Finish Pen Tool (Enter) ─────────────────────────────────────
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && areaDrawingMode === 'pen') {
        const anchors = stateRef.current.penAnchors;
        if (anchors.length >= 3) {
          const polyCoords: [number, number][] = [];
          for (let i = 0; i < anchors.length; i++) {
            const a1 = anchors[i];
            const a2 = anchors[(i + 1) % anchors.length];
            const cp1 = a1.cpOut || a1.pt;
            const cp2 = a2.cpIn || a2.pt;
            const segment = interpolateBezier(a1.pt, cp1, cp2, a2.pt, 10);
            polyCoords.push(...segment.slice(0, -1));
          }
          polyCoords.push(polyCoords[0]);

          addAreaToMap(
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'Polygon', coordinates: [polyCoords] },
            },
            'Vùng Pen Tool'
          );
        }
        stateRef.current.penAnchors = [];
        updatePreview(null);
      }
    };

    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
    map.on('click', onClick);
    map.on('dblclick', onDblClick);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      map.off('click', onClick);
      map.off('dblclick', onDblClick);
      window.removeEventListener('keydown', onKeyDown);
      map.getCanvas().style.cursor = '';
      map.dragPan.enable();
      map.doubleClickZoom.enable();
    };
  }, [activeTool, areaDrawingMode, mapReady, mapRef, addAreaToMap, updatePreview]);

  // ── Vertex Editing on Selected Area Layer ────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Clear existing vertex markers
    vertexMarkersRef.current.forEach(m => m.remove());
    vertexMarkersRef.current = [];

    const { isEditingVertices } = useProjectStore.getState();
    if (!isEditingVertices) return;

    const selectedLayer = layers.find(l => l.id === selectedLayerId && l.type === 'area');
    if (!selectedLayer || !selectedLayer.areaData?.geojson) return;

    const geojson = selectedLayer.areaData.geojson;
    if (geojson.geometry.type !== 'Polygon') return;

    const coordinates = (geojson.geometry.coordinates[0] as [number, number][]) || [];
    if (coordinates.length < 3 || coordinates.length > 32) return;

    // Render draggable marker for each vertex (except closing duplicate)
    const uniqueCoords = coordinates.slice(0, -1);

    uniqueCoords.forEach((coord, idx) => {
      const el = document.createElement('div');
      el.className = 'w-3 h-3 rounded-full bg-white border-2 border-cyan-500 shadow-lg cursor-move hover:scale-150 hover:bg-cyan-200 transition-all z-30';

      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat(coord)
        .addTo(map);

      marker.on('drag', () => {
        const lngLat = marker.getLngLat();
        const newCoords = [...uniqueCoords];
        newCoords[idx] = [lngLat.lng, lngLat.lat];
        const closed = [...newCoords, newCoords[0]];
        const updatedGeojson: Feature = {
          ...geojson,
          geometry: {
            type: 'Polygon',
            coordinates: [closed],
          },
        };
        updateAreaGeojson(selectedLayer.id, updatedGeojson);
      });

      vertexMarkersRef.current.push(marker);
    });

    return () => {
      vertexMarkersRef.current.forEach(m => m.remove());
      vertexMarkersRef.current = [];
    };
  }, [selectedLayerId, layers, mapReady, mapRef, updateAreaGeojson]);

  return { addAreaToMap };
}
