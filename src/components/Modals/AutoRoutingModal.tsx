import React, { useState } from 'react';
import { Navigation, Car, Bike, X, ArrowRight, Route, Sparkles } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import type { Feature } from 'geojson';

const PRESET_ROUTES = [
  {
    name: 'TP. Hồ Chí Minh → Vũng Tàu',
    from: 'Quận 1, TP.HCM',
    to: 'Bãi Sau, Vũng Tàu',
    coordsFrom: [106.7009, 10.7753] as [number, number],
    coordsTo: [107.0843, 10.3460] as [number, number],
    distanceCar: 98,
    distanceMoto: 110,
    geometry: [
      [106.7009, 10.7753], [106.7500, 10.7800], [106.8200, 10.8200],
      [106.9500, 10.7500], [107.0500, 10.5500], [107.0843, 10.3460],
    ],
  },
  {
    name: 'Hà Nội → Hải Phòng (Cao Tốc 5B)',
    from: 'Trung tâm Hà Nội',
    to: 'TP. Hải Phòng',
    coordsFrom: [105.8412, 21.0245] as [number, number],
    coordsTo: [106.6881, 20.8449] as [number, number],
    distanceCar: 105,
    distanceMoto: 120,
    geometry: [
      [105.8412, 21.0245], [105.9500, 20.9800], [106.1500, 20.9200],
      [106.4000, 20.8800], [106.6881, 20.8449],
    ],
  },
  {
    name: 'Sân bay Nội Bài → Hồ Hoàn Kiếm',
    from: 'Sân bay Quốc tế Nội Bài',
    to: 'Hồ Hoàn Kiếm, Hà Nội',
    coordsFrom: [105.8055, 21.2212] as [number, number],
    coordsTo: [105.8524, 21.0287] as [number, number],
    distanceCar: 28,
    distanceMoto: 30,
    geometry: [
      [105.8055, 21.2212], [105.8150, 21.1500], [105.8300, 21.0800],
      [105.8524, 21.0287],
    ],
  },
  {
    name: 'Đà Nẵng → Phố cổ Hội An',
    from: 'Cầu Rồng, Đà Nẵng',
    to: 'Phố cổ Hội An, Quảng Nam',
    coordsFrom: [108.2243, 16.0610] as [number, number],
    coordsTo: [108.3380, 15.8801] as [number, number],
    distanceCar: 30,
    distanceMoto: 28,
    geometry: [
      [108.2243, 16.0610], [108.2400, 16.0200], [108.2800, 15.9500],
      [108.3380, 15.8801],
    ],
  },
];

export const AutoRoutingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [vehicle, setVehicle] = useState<'car' | 'motorcycle'>('car');
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [lineColor, setLineColor] = useState('#3b82f6');
  const [glow, setGlow] = useState(true);
  const { addLayer, playhead, duration, setCurrentCamera } = useProjectStore();

  const handleCreateRoute = () => {
    const route = PRESET_ROUTES[selectedPreset];
    const distance = vehicle === 'car' ? route.distanceCar : route.distanceMoto;

    const geojson: Feature = {
      type: 'Feature',
      properties: { name: route.name },
      geometry: {
        type: 'LineString',
        coordinates: route.geometry,
      },
    };

    const newLayer = {
      id: `route-layer-${Date.now()}`,
      type: 'route' as const,
      name: `Lộ trình: ${route.name}`,
      color: lineColor,
      startTime: playhead,
      endTime: Math.min(playhead + 4.0, duration),
      visible: true,
      locked: false,
      selected: true,
      lineData: {
        geojson,
        color: lineColor,
        width: 3.5,
        glow,
        animated: true,
        animationProgress: 0,
        distanceKm: distance,
        vehicle,
        fromName: route.from,
        toName: route.to,
      },
    };

    addLayer(newLayer);

    // Zoom camera to route midpoint
    const midLng = (route.coordsFrom[0] + route.coordsTo[0]) / 2;
    const midLat = (route.coordsFrom[1] + route.coordsTo[1]) / 2;
    setCurrentCamera({
      center: [midLng, midLat],
      zoom: 10,
      pitch: 30,
      bearing: 10,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-[500px] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Navigation size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Tìm tuyến đường tự động (Auto Routing)</h2>
              <p className="text-slate-400 text-xs">Vẽ lộ trình thực tế, tính toán khoảng cách km & animation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Vehicle selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Phương tiện di chuyển</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setVehicle('car')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  vehicle === 'car'
                    ? 'border-blue-500 bg-blue-600/20 text-blue-300 shadow-md shadow-blue-900/30'
                    : 'border-slate-700/60 bg-[#1e293b]/40 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                <Car size={16} />
                <span>Ô tô (Ưu tiên cao tốc)</span>
              </button>

              <button
                type="button"
                onClick={() => setVehicle('motorcycle')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                  vehicle === 'motorcycle'
                    ? 'border-blue-500 bg-blue-600/20 text-blue-300 shadow-md shadow-blue-900/30'
                    : 'border-slate-700/60 bg-[#1e293b]/40 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                }`}
              >
                <Bike size={16} />
                <span>Xe máy (Tránh cao tốc)</span>
              </button>
            </div>
          </div>

          {/* Preset routes */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-medium">Chọn lộ trình mẫu hoặc nhập</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {PRESET_ROUTES.map((r, idx) => (
                <div
                  key={r.name}
                  onClick={() => setSelectedPreset(idx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedPreset === idx
                      ? 'border-blue-500 bg-blue-600/15 text-white shadow-sm'
                      : 'border-slate-700/60 bg-[#1e293b]/40 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-blue-400">{r.name}</span>
                    <span className="text-[11px] font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-amber-400">
                      {vehicle === 'car' ? r.distanceCar : r.distanceMoto} km
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                    <span>{r.from}</span>
                    <ArrowRight size={11} className="text-slate-500" />
                    <span>{r.to}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Color and Glow */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1e293b]">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Màu tuyến đường</label>
              <div className="flex items-center gap-2 bg-[#1e293b]/60 px-2.5 py-1.5 rounded-xl border border-slate-700/60">
                <input
                  type="color"
                  value={lineColor}
                  onChange={(e) => setLineColor(e.target.value)}
                  className="w-7 h-7 rounded-lg border-0 cursor-pointer bg-transparent"
                />
                <span className="text-xs font-mono text-slate-300">{lineColor}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">Hiệu ứng phát sáng</label>
              <button
                type="button"
                onClick={() => setGlow(!glow)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  glow
                    ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                    : 'border-slate-700/60 bg-[#1e293b]/40 text-slate-400'
                }`}
              >
                {glow ? '✨ Bật phát sáng (Glow)' : 'Tắt'}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCreateRoute}
            className="w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-500 hover:from-blue-300 hover:to-indigo-300 shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Route size={16} />
            Tạo tuyến đường trên bản đồ
          </button>
        </div>
      </div>
    </div>
  );
};
