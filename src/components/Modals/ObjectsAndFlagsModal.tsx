import React, { useState } from 'react';
import { Package, Plane, Car, User, Ship, Building2, Flag, X, Plus } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

const PNG_OBJECTS = [
  { id: 'airplane', name: 'Máy bay thương mại', icon: <Plane size={24} className="text-blue-400" />, defaultSpeed: 50 },
  { id: 'car', name: 'Xe Ô tô / Taxi', icon: <Car size={24} className="text-amber-400" />, defaultSpeed: 30 },
  { id: 'person', name: 'Khách du lịch / Người đi bộ', icon: <User size={24} className="text-emerald-400" />, defaultSpeed: 10 },
  { id: 'ship', name: 'Tàu du lịch ven biển', icon: <Ship size={24} className="text-cyan-400" />, defaultSpeed: 20 },
  { id: 'landmark', name: 'Tòa nhà Landmark 81 / Bitexco', icon: <Building2 size={24} className="text-purple-400" />, defaultSpeed: 0 },
];

const NATIONAL_FLAGS = [
  { code: 'VN', name: 'Việt Nam 🇻🇳', coords: [108.2772, 14.0583] as [number, number] },
  { code: 'US', name: 'Hoa Kỳ (USA) 🇺🇸', coords: [-95.7129, 37.0902] as [number, number] },
  { code: 'JP', name: 'Nhật Bản 🇯🇵', coords: [138.2529, 36.2048] as [number, number] },
  { code: 'KR', name: 'Hàn Quốc 🇰🇷', coords: [127.7669, 35.9078] as [number, number] },
  { code: 'FR', name: 'Pháp 🇫🇷', coords: [2.2137, 46.2276] as [number, number] },
  { code: 'GB', name: 'Vương Quốc Anh 🇬🇧', coords: [-3.4360, 55.3781] as [number, number] },
  { code: 'DE', name: 'Đức 🇩🇪', coords: [10.4515, 51.1657] as [number, number] },
  { code: 'SG', name: 'Singapore 🇸🇬', coords: [103.8198, 1.3521] as [number, number] },
  { code: 'TH', name: 'Thái Lan 🇹🇭', coords: [100.9925, 15.8700] as [number, number] },
  { code: 'CN', name: 'Trung Quốc 🇨🇳', coords: [104.1954, 35.8617] as [number, number] },
  { code: 'AU', name: 'Úc (Australia) 🇦🇺', coords: [133.7751, -25.2744] as [number, number] },
];

export const ObjectsAndFlagsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<'object' | 'flag'>('object');
  const [selectedObject, setSelectedObject] = useState(PNG_OBJECTS[0]);
  const [selectedFlag, setSelectedFlag] = useState(NATIONAL_FLAGS[0]);
  const [speed, setSpeed] = useState(PNG_OBJECTS[0].defaultSpeed);
  const [followLine, setFollowLine] = useState(true);

  const { addLayer, playhead, duration, currentCamera, setCurrentCamera } = useProjectStore();

  const handleAdd = () => {
    if (tab === 'object') {
      const newLayer = {
        id: `object-layer-${Date.now()}`,
        type: 'object' as const,
        name: `Đối tượng: ${selectedObject.name}`,
        color: '#10b981',
        startTime: playhead,
        endTime: Math.min(playhead + 4.0, duration),
        visible: true,
        locked: false,
        selected: true,
        objectData: {
          objectType: selectedObject.id as any,
          lngLat: currentCamera.center,
          speed,
          movingAlongLine: followLine,
        },
      };
      addLayer(newLayer);
    } else {
      const newLayer = {
        id: `flag-layer-${Date.now()}`,
        type: 'object' as const,
        name: `Cờ quốc gia: ${selectedFlag.name}`,
        color: '#ef4444',
        startTime: playhead,
        endTime: Math.min(playhead + 4.0, duration),
        visible: true,
        locked: false,
        selected: true,
        objectData: {
          objectType: 'flag' as const,
          countryCode: selectedFlag.code,
          countryName: selectedFlag.name,
          lngLat: selectedFlag.coords,
        },
      };
      addLayer(newLayer);
      setCurrentCamera({
        center: selectedFlag.coords,
        zoom: 5.5,
        bearing: 0,
        pitch: 20,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-[520px] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Package size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Đối tượng tách nền & Cờ Quốc Gia</h2>
              <p className="text-slate-400 text-xs">Vật thể hoạt họa chuyển động theo tuyến đường & cờ các nước</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#0a1628]/60 p-1.5 border-b border-[#1e293b] gap-1">
          <button
            type="button"
            onClick={() => setTab('object')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              tab === 'object'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plane size={14} />
            Đối tượng di chuyển (PNG)
          </button>
          <button
            type="button"
            onClick={() => setTab('flag')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              tab === 'flag'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flag size={14} />
            Cờ Quốc Gia (National Flags)
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {tab === 'object' ? (
            <>
              {/* Objects Grid */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Chọn loại vật thể</label>
                <div className="space-y-2">
                  {PNG_OBJECTS.map((obj) => (
                    <div
                      key={obj.id}
                      onClick={() => { setSelectedObject(obj); setSpeed(obj.defaultSpeed); }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3.5 ${
                        selectedObject.id === obj.id
                          ? 'border-emerald-500 bg-emerald-500/15 text-white shadow-md'
                          : 'border-slate-700/60 bg-[#1e293b]/40 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                        {obj.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-semibold text-white">{obj.name}</h4>
                        <p className="text-[11px] text-slate-400">Tự động điều chỉnh góc xoay theo hướng di chuyển</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Speed slider */}
              <div className="space-y-1.5 pt-2 border-t border-[#1e293b]">
                <label className="text-xs text-slate-400 font-medium">Tốc độ chuyển động</label>
                <div className="flex items-center gap-3 bg-[#1e293b]/60 px-3 py-2 rounded-xl border border-slate-700">
                  <input
                    type="range"
                    min={5}
                    max={100}
                    value={speed}
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="flex-1 accent-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono font-medium text-emerald-400 min-w-[50px] text-right">
                    {speed} km/h
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={followLine}
                  onChange={(e) => setFollowLine(e.target.checked)}
                  className="rounded accent-emerald-500 w-4 h-4 cursor-pointer"
                />
                <span>Tự động bám theo tuyến đường (Route Line) đã vẽ</span>
              </label>
            </>
          ) : (
            <>
              {/* National Flags Dropdown list */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Chọn quốc gia để thả cờ</label>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {NATIONAL_FLAGS.map((flag) => (
                    <div
                      key={flag.code}
                      onClick={() => setSelectedFlag(flag)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                        selectedFlag.code === flag.code
                          ? 'border-red-500 bg-red-500/20 text-white shadow-md'
                          : 'border-slate-700/60 bg-[#1e293b]/40 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs font-semibold">{flag.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">{flag.code}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Plus size={16} />
            {tab === 'object' ? 'Thêm đối tượng vào timeline' : `Thả cờ ${selectedFlag.name} vào bản đồ`}
          </button>
        </div>
      </div>
    </div>
  );
};
