import React, { useState, useEffect } from 'react';
import * as maplibregl from 'maplibre-gl';
import { useProjectStore } from '../../store/useProjectStore';
import { computeBboxFromGeoJSON } from '../../services/boundaryService';

// Renders the cinematic area title at the centroid of the area polygon
// matching the exact look of MapEffect.app (Hình 2: golden font, clean drop shadow)
export const AreaBoundingBoxOverlay: React.FC<{ map: maplibregl.Map | null }> = ({ map }) => {
  const { layers, playhead } = useProjectStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!map) return;
    const onMove = () => setTick(t => (t + 1) % 1000000);
    map.on('move', onMove);
    return () => {
      map.off('move', onMove);
    };
  }, [map]);

  if (!map) return null;

  // Render for all currently visible area layers during their playback window
  const visibleAreaLayers = layers.filter(
    l => l.type === 'area' && l.visible && l.areaData?.geojson && playhead >= l.startTime && playhead <= l.endTime
  );

  if (visibleAreaLayers.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {visibleAreaLayers.map(layer => {
        try {
          const geojson = layer.areaData!.geojson!;
          const bbox = computeBboxFromGeoJSON(geojson);
          const centerLng = (bbox[0] + bbox[2]) / 2;
          const centerLat = (bbox[1] + bbox[3]) / 2;
          const pCenter = map.project([centerLng, centerLat]);

          if (!pCenter || isNaN(pCenter.x) || isNaN(pCenter.y)) return null;

          // Clean title name (e.g. "TP. Huế" -> "Huế", "TP. Quy Nhơn" -> "Quy Nhơn")
          const displayName = layer.name.replace(/^(TP\.|Tỉnh|Thành phố|Quận|Huyện|Xã|Phường)\s*/i, '');

          return (
            <div
              key={`label-${layer.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none transition-all duration-75"
              style={{
                left: `${pCenter.x}px`,
                top: `${pCenter.y}px`,
              }}
            >
              {/* Centered Golden Area Title matching MapEffect.app in Hình 2 */}
              <span
                className="font-extrabold text-amber-200 tracking-wide inline-block"
                style={{
                  fontSize: 'clamp(18px, 2.2vw, 32px)',
                  color: '#fed7aa',
                  textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 0 16px rgba(0, 0, 0, 0.8), 0 1px 3px rgba(0, 0, 0, 0.9)',
                  filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.9))',
                }}
              >
                {displayName}
              </span>
            </div>
          );
        } catch {
          return null;
        }
      })}
    </div>
  );
};
