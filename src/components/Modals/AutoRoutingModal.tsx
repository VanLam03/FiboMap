import React, { useState, useEffect } from 'react';
import {
  Navigation,
  Car,
  Bike,
  Plane,
  Ship,
  X,
  ArrowRight,
  Route,
  Sparkles,
  Search,
  Video,
  MapPin,
  Clock,
  Gauge,
  Sliders,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import type { Feature } from 'geojson';
import { removeVietnameseTones } from '../../services/boundaryService';

// Popular scenic and highway presets in Vietnam
const VIETNAM_PRESET_ROUTES = [
  {
    name: 'Cao tốc Hà Nội → Hải Phòng (CT04 / 5B)',
    from: 'Hà Nội (Nút giao Cổ Linh)',
    to: 'TP. Hải Phòng (Cảng Đình Vũ)',
    vehicle: 'car' as const,
    coordsFrom: [105.8950, 20.9980] as [number, number],
    coordsTo: [106.7250, 20.8450] as [number, number],
    distanceKm: 105,
    durationMin: 75,
  },
  {
    name: 'TP. Hồ Chí Minh → Vũng Tàu (Cao tốc Long Thành)',
    from: 'Quận 1, TP. Hồ Chí Minh',
    to: 'Bãi Sau, TP. Vũng Tàu',
    vehicle: 'car' as const,
    coordsFrom: [106.7009, 10.7753] as [number, number],
    coordsTo: [107.0843, 10.3460] as [number, number],
    distanceKm: 98,
    durationMin: 90,
  },
  {
    name: 'Hà Nội ✈️ TP. Hồ Chí Minh (Đường bay vàng Nội Bài - Tân Sơn Nhất)',
    from: 'Sân bay Quốc tế Nội Bài (HAN)',
    to: 'Sân bay Quốc tế Tân Sơn Nhất (SGN)',
    vehicle: 'airplane' as const,
    coordsFrom: [105.8055, 21.2212] as [number, number],
    coordsTo: [106.6558, 10.8185] as [number, number],
    distanceKm: 1160,
    durationMin: 120,
  },
  {
    name: 'Đà Nẵng → Phố cổ Hội An (Cung đường biển Võ Nguyên Giáp)',
    from: 'Cầu Rồng, TP. Đà Nẵng',
    to: 'Phố cổ Hội An, Quảng Nam',
    vehicle: 'motorcycle' as const,
    coordsFrom: [108.2243, 16.0610] as [number, number],
    coordsTo: [108.3380, 15.8801] as [number, number],
    distanceKm: 30,
    durationMin: 40,
  },
  {
    name: 'TP. Hồ Chí Minh → TP. Đà Lạt (Cao tốc Dầu Giây - Đèo Prenn)',
    from: 'TP. Hồ Chí Minh',
    to: 'Hồ Xuân Hương, TP. Đà Lạt',
    vehicle: 'car' as const,
    coordsFrom: [106.7009, 10.7753] as [number, number],
    coordsTo: [108.4419, 11.9404] as [number, number],
    distanceKm: 305,
    durationMin: 360,
  },
  {
    name: 'Rạch Giá 🚢 Đảo Phú Quốc (Tàu cao tốc biển Tây Nam)',
    from: 'Bến tàu Rạch Giá, Kiên Giang',
    to: 'Cảng Bãi Vòng, TP. Phú Quốc',
    vehicle: 'boat' as const,
    coordsFrom: [105.0760, 10.0120] as [number, number],
    coordsTo: [104.0150, 10.1980] as [number, number],
    distanceKm: 120,
    durationMin: 150,
  },
];

// Major locations database for autocompletion
const LOCATION_SEARCH_DB = [
  { name: 'Hà Nội', coords: [105.8412, 21.0245] as [number, number] },
  { name: 'Sân bay Nội Bài (Hà Nội)', coords: [105.8055, 21.2212] as [number, number] },
  { name: 'Hải Phòng', coords: [106.6881, 20.8449] as [number, number] },
  { name: 'Hạ Long (Quảng Ninh)', coords: [107.0843, 20.9505] as [number, number] },
  { name: 'Sapa (Lào Cai)', coords: [103.8438, 22.3364] as [number, number] },
  { name: 'TP. Huế (Thừa Thiên Huế)', coords: [107.5909, 16.4637] as [number, number] },
  { name: 'TP. Đà Nẵng', coords: [108.2243, 16.0610] as [number, number] },
  { name: 'Hội An (Quảng Nam)', coords: [108.3380, 15.8801] as [number, number] },
  { name: 'Quy Nhơn (Bình Định)', coords: [109.2197, 13.7820] as [number, number] },
  { name: 'Pleiku (Gia Lai)', coords: [108.0021, 13.9833] as [number, number] },
  { name: 'Nha Trang (Khánh Hòa)', coords: [109.1967, 12.2388] as [number, number] },
  { name: 'Đà Lạt (Lâm Đồng)', coords: [108.4419, 11.9404] as [number, number] },
  { name: 'Phan Thiết (Bình Thuận)', coords: [108.1022, 10.9289] as [number, number] },
  { name: 'TP. Hồ Chí Minh (Sài Gòn)', coords: [106.7009, 10.7753] as [number, number] },
  { name: 'Sân bay Tân Sơn Nhất (TP.HCM)', coords: [106.6558, 10.8185] as [number, number] },
  { name: 'Vũng Tàu (Bà Rịa - Vũng Tàu)', coords: [107.0843, 10.3460] as [number, number] },
  { name: 'Cần Thơ', coords: [105.7838, 10.0452] as [number, number] },
  { name: 'Phú Quốc (Kiên Giang)', coords: [103.9575, 10.2289] as [number, number] },
  { name: 'Cà Mau', coords: [105.1500, 9.1769] as [number, number] },
];

// Generate great circle parabolic curved arc for airplanes & boats
function generateCurvedArc(from: [number, number], to: [number, number], steps = 60): [number, number][] {
  const coords: [number, number][] = [];
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const distance = Math.hypot(dx, dy);
  const len = distance || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const curvature = Math.min(0.25, Math.max(0.08, 0.5 / (distance + 1)));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lng = from[0] + dx * t;
    const lat = from[1] + dy * t;
    const arcOffset = Math.sin(t * Math.PI) * curvature * distance;
    coords.push([Number((lng + nx * arcOffset).toFixed(5)), Number((lat + ny * arcOffset).toFixed(5))]);
  }
  return coords;
}

// Fetch real road highway routing from OSRM
async function fetchRoadRouteGeometry(from: [number, number], to: [number, number]): Promise<{ geometry: [number, number][]; distanceKm: number; durationMin: number } | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.routes || !data.routes[0]) return null;

    const route = data.routes[0];
    const geometry = route.geometry.coordinates as [number, number][];
    const distanceKm = Math.round(route.distance / 1000);
    const durationMin = Math.round(route.duration / 60);

    return { geometry, distanceKm, durationMin };
  } catch (err) {
    console.warn('OSRM Route fetch failed, fallback to direct arc:', err);
    return null;
  }
}

export const AutoRoutingModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [vehicle, setVehicle] = useState<'car' | 'motorcycle' | 'airplane' | 'boat'>('car');
  const [selectedPresetIdx, setSelectedPresetIdx] = useState<number | null>(0);
  
  const [fromName, setFromName] = useState('Hà Nội (Nút giao Cổ Linh)');
  const [fromCoords, setFromCoords] = useState<[number, number]>([105.8950, 20.9980]);
  const [toName, setToName] = useState('TP. Hải Phòng (Cảng Đình Vũ)');
  const [toCoords, setToCoords] = useState<[number, number]>([106.7250, 20.8450]);

  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  const [lineColor, setLineColor] = useState('#00f0ff');
  const [lineWidth, setLineWidth] = useState(4.0);
  const [showVehicle, setShowVehicle] = useState(true);
  const [cameraTracking, setCameraTracking] = useState(true);
  const [cameraPitch, setCameraPitch] = useState(48);
  const [travelDuration, setTravelDuration] = useState(6.0); // seconds on timeline
  const [isCalculating, setIsCalculating] = useState(false);

  const { addLayer, playhead, duration, setCurrentCamera, selectLayer } = useProjectStore();

  const handleSelectPreset = (idx: number) => {
    setSelectedPresetIdx(idx);
    const p = VIETNAM_PRESET_ROUTES[idx];
    setFromName(p.from);
    setFromCoords(p.coordsFrom);
    setToName(p.to);
    setToCoords(p.coordsTo);
    setVehicle(p.vehicle);
    if (p.vehicle === 'airplane') setLineColor('#38bdf8');
    else if (p.vehicle === 'boat') setLineColor('#2dd4bf');
    else if (p.vehicle === 'motorcycle') setLineColor('#f59e0b');
    else setLineColor('#00f0ff');
  };

  const handleCreateRoute = async () => {
    setIsCalculating(true);
    let routeCoords: [number, number][] = [];
    let distanceKm = 0;
    let durationMin = 0;

    if (vehicle === 'airplane' || vehicle === 'boat') {
      // Curved aerodynamic flight arc
      routeCoords = generateCurvedArc(fromCoords, toCoords, 80);
      const directDist = Math.hypot(toCoords[0] - fromCoords[0], toCoords[1] - fromCoords[1]) * 111;
      distanceKm = Math.round(directDist);
      durationMin = vehicle === 'airplane' ? Math.round(distanceKm / 12) : Math.round(distanceKm * 2);
    } else {
      // Road driving highway
      const roadData = await fetchRoadRouteGeometry(fromCoords, toCoords);
      if (roadData && roadData.geometry.length > 5) {
        routeCoords = roadData.geometry;
        distanceKm = roadData.distanceKm;
        durationMin = roadData.durationMin;
      } else {
        routeCoords = generateCurvedArc(fromCoords, toCoords, 50);
        distanceKm = Math.round(Math.hypot(toCoords[0] - fromCoords[0], toCoords[1] - fromCoords[1]) * 111);
        durationMin = Math.round(distanceKm * 1.2);
      }
    }

    const layerId = `route-layer-${Date.now()}`;
    const routeTitle = `${fromName.split('(')[0].trim()} ➔ ${toName.split('(')[0].trim()}`;

    const geojson: Feature = {
      type: 'Feature',
      properties: { name: routeTitle },
      geometry: {
        type: 'LineString',
        coordinates: routeCoords,
      },
    };

    const newLayer = {
      id: layerId,
      type: 'route' as const,
      name: `Lộ trình: ${routeTitle}`,
      color: lineColor,
      startTime: playhead,
      endTime: Math.min(playhead + travelDuration, duration),
      visible: true,
      locked: false,
      selected: true,
      lineData: {
        geojson,
        color: lineColor,
        width: lineWidth,
        glow: true,
        animated: true,
        animationProgress: 0,
        distanceKm,
        durationMinutes: durationMin,
        vehicle,
        showVehicle,
        cameraTracking,
        cameraPitch: cameraTracking ? cameraPitch : 0,
        fromName,
        toName,
      },
    };

    addLayer(newLayer);
    selectLayer(layerId);

    // Initial camera positioning
    const map = (window as any).__fibomap_map;
    if (map) {
      if (cameraTracking) {
        // Position camera behind start point
        map.flyTo({
          center: fromCoords,
          zoom: vehicle === 'airplane' ? 8.5 : 13.0,
          pitch: cameraPitch,
          bearing: 15,
          duration: 1200,
        });
      } else {
        // Fit whole route
        const lngs = routeCoords.map(c => c[0]);
        const lats = routeCoords.map(c => c[1]);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        map.fitBounds(
          [[minLng, minLat], [maxLng, maxLat]],
          { padding: 80, duration: 1200, pitch: 30, bearing: 10 }
        );
      }
    }

    setCurrentCamera({
      center: fromCoords,
      zoom: vehicle === 'airplane' ? 8.5 : 13.0,
      pitch: cameraTracking ? cameraPitch : 0,
      bearing: 15,
    });

    setIsCalculating(false);
    onClose();
  };

  const filteredFromLocations = LOCATION_SEARCH_DB.filter(l =>
    removeVietnameseTones(l.name).includes(removeVietnameseTones(fromSearch))
  );

  const filteredToLocations = LOCATION_SEARCH_DB.filter(l =>
    removeVietnameseTones(l.name).includes(removeVietnameseTones(toSearch))
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-[620px] max-h-[92vh] flex flex-col overflow-hidden animate-slideUp">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b] bg-[#0a1628]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Navigation size={20} />
            </div>
            <div>
              <h2 className="font-bold text-white text-base flex items-center gap-2">
                Tạo Lộ Trình Di Chuyển (Cinematic Route)
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  Tracking 3D
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Tự động uốn theo cao tốc/quốc lộ, mô phỏng xe chạy & Camera bám đuổi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-[#1e293b] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
          
          {/* Section 1: Origin & Destination Inputs */}
          <div className="bg-[#1e293b]/40 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <MapPin size={14} className="text-cyan-400" />
              Điểm đi & Điểm đến
            </h3>

            <div className="grid grid-cols-2 gap-3 relative">
              {/* Origin */}
              <div className="relative">
                <label className="text-[11px] text-slate-400 font-medium mb-1 block">Điểm xuất phát (A)</label>
                <div
                  onClick={() => setShowFromDropdown(!showFromDropdown)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f172a] border border-slate-700 hover:border-cyan-500/60 transition-all cursor-pointer text-xs font-semibold text-white"
                >
                  <span className="truncate">{fromName}</span>
                  <Sliders size={12} className="text-slate-400 shrink-0 ml-1" />
                </div>

                {showFromDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 w-full z-50 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl p-2 max-h-48 overflow-y-auto custom-scrollbar">
                    <input
                      type="text"
                      placeholder="Tìm địa điểm..."
                      value={fromSearch}
                      onChange={(e) => setFromSearch(e.target.value)}
                      className="w-full bg-[#1e293b] text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 mb-1.5 outline-none focus:border-cyan-500"
                      autoFocus
                    />
                    {filteredFromLocations.map((loc, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setFromName(loc.name);
                          setFromCoords(loc.coords);
                          setShowFromDropdown(false);
                          setSelectedPresetIdx(null);
                        }}
                        className="p-2 text-xs rounded-lg hover:bg-cyan-500/15 hover:text-cyan-300 text-slate-300 cursor-pointer transition-colors"
                      >
                        {loc.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination */}
              <div className="relative">
                <label className="text-[11px] text-slate-400 font-medium mb-1 block">Điểm đích đến (B)</label>
                <div
                  onClick={() => setShowToDropdown(!showToDropdown)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f172a] border border-slate-700 hover:border-cyan-500/60 transition-all cursor-pointer text-xs font-semibold text-white"
                >
                  <span className="truncate">{toName}</span>
                  <Sliders size={12} className="text-slate-400 shrink-0 ml-1" />
                </div>

                {showToDropdown && (
                  <div className="absolute left-0 top-full mt-1.5 w-full z-50 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl p-2 max-h-48 overflow-y-auto custom-scrollbar">
                    <input
                      type="text"
                      placeholder="Tìm địa điểm..."
                      value={toSearch}
                      onChange={(e) => setToSearch(e.target.value)}
                      className="w-full bg-[#1e293b] text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 mb-1.5 outline-none focus:border-cyan-500"
                      autoFocus
                    />
                    {filteredToLocations.map((loc, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setToName(loc.name);
                          setToCoords(loc.coords);
                          setShowToDropdown(false);
                          setSelectedPresetIdx(null);
                        }}
                        className="p-2 text-xs rounded-lg hover:bg-cyan-500/15 hover:text-cyan-300 text-slate-300 cursor-pointer transition-colors"
                      >
                        {loc.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Vehicle Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              Phương tiện di chuyển
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'car', label: 'Ô tô / Xe khách', icon: <Car size={18} />, color: '#00f0ff' },
                { id: 'motorcycle', label: 'Xe máy phượt', icon: <Bike size={18} />, color: '#f59e0b' },
                { id: 'airplane', label: 'Máy bay hàng không', icon: <Plane size={18} />, color: '#38bdf8' },
                { id: 'boat', label: 'Tàu thuyền biển', icon: <Ship size={18} />, color: '#2dd4bf' },
              ].map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setVehicle(v.id as any);
                    setLineColor(v.color);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all gap-1.5 ${
                    vehicle === v.id
                      ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-950/40'
                      : 'border-slate-800 bg-[#1e293b]/40 text-slate-400 hover:border-slate-600 hover:text-white'
                  }`}
                >
                  <div className={vehicle === v.id ? 'text-cyan-400 scale-110' : 'text-slate-400'}>
                    {v.icon}
                  </div>
                  <span className="text-[11px] font-semibold">{v.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Camera Tracking & Cinematic Controls */}
          <div className="bg-[#1e293b]/40 border border-slate-800 rounded-2xl p-4 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Video size={14} className="text-amber-400" />
              Cài đặt Flycam & Hiệu ứng điện ảnh
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* Camera Tracking Toggle */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#0f172a] border border-slate-800 cursor-pointer hover:border-amber-500/40 transition-colors">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Camera bám đuổi (Chase Cam)</span>
                  <span className="text-[10px] text-slate-400">Flycam bám theo xe nghiêng 3D</span>
                </div>
                <input
                  type="checkbox"
                  checked={cameraTracking}
                  onChange={(e) => setCameraTracking(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                />
              </label>

              {/* Show Vehicle Toggle */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#0f172a] border border-slate-800 cursor-pointer hover:border-cyan-500/40 transition-colors">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white">Hiển thị xe/máy bay 3D</span>
                  <span className="text-[10px] text-slate-400">Đầu xe xoay theo khúc cua</span>
                </div>
                <input
                  type="checkbox"
                  checked={showVehicle}
                  onChange={(e) => setShowVehicle(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </label>
            </div>

            {/* Controls: Color, Width, Duration */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Màu đường đi</label>
                <div className="flex items-center gap-2 bg-[#0f172a] p-1.5 rounded-xl border border-slate-700">
                  <input
                    type="color"
                    value={lineColor}
                    onChange={(e) => setLineColor(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-[11px] font-mono text-slate-300 uppercase">{lineColor}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Độ dày đường ({lineWidth}px)</label>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="0.5"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 mt-2"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Thời lượng ({travelDuration}s)</label>
                <input
                  type="range"
                  min="2"
                  max="15"
                  step="0.5"
                  value={travelDuration}
                  onChange={(e) => setTravelDuration(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 mt-2"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Quick Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Tuyến đường mẫu tiêu biểu</span>
              <span className="text-[10px] text-slate-500 font-normal">Click chọn nhanh</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {VIETNAM_PRESET_ROUTES.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectPreset(idx)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                    selectedPresetIdx === idx
                      ? 'border-cyan-500/80 bg-cyan-500/10 shadow-sm'
                      : 'border-slate-800/80 bg-[#1e293b]/30 hover:border-slate-600 hover:bg-[#1e293b]/60'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    p.vehicle === 'airplane' ? 'bg-sky-500/20 text-sky-400' :
                    p.vehicle === 'boat' ? 'bg-teal-500/20 text-teal-400' :
                    p.vehicle === 'motorcycle' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {p.vehicle === 'airplane' ? <Plane size={14} /> :
                     p.vehicle === 'boat' ? <Ship size={14} /> :
                     p.vehicle === 'motorcycle' ? <Bike size={14} /> :
                     <Car size={14} />}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-bold text-white truncate">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{p.distanceKm} km • ~{p.durationMin} phút</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#1e293b] bg-[#0a1628]/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles size={13} className="text-cyan-400" />
            Tự động tính toán toạ độ GPS & bám sát cao tốc
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleCreateRoute}
              disabled={isCalculating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-950/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isCalculating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Đang định tuyến...</span>
                </>
              ) : (
                <>
                  <Route size={15} />
                  <span>Tạo lộ trình ngay</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
