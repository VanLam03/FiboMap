import React, { useState } from 'react';
import { Boxes, School, Stethoscope, Plane, ShoppingBag, Fuel, Coffee, Waves, Flag, Radio, X, Plus } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

const WIDGETS = [
  { id: 'airport', name: 'Sân bay Quốc tế', icon: <Plane size={20} className="text-blue-400" />, defaultLabel: 'Sân bay Quốc tế Nội Bài' },
  { id: 'hospital', name: 'Bệnh viện Đa khoa', icon: <Stethoscope size={20} className="text-red-400" />, defaultLabel: 'Bệnh viện Chợ Rẫy' },
  { id: 'school', name: 'Trường học / Đại học', icon: <School size={20} className="text-amber-400" />, defaultLabel: 'Trường Quốc tế AIS' },
  { id: 'mall', name: 'TTTM / Siêu thị', icon: <ShoppingBag size={20} className="text-purple-400" />, defaultLabel: 'Vincom Mega Mall' },
  { id: 'beach', name: 'Bãi biển / Du lịch', icon: <Waves size={20} className="text-cyan-400" />, defaultLabel: 'Bãi Sau Vũng Tàu' },
  { id: 'golf', name: 'Sân Golf', icon: <Flag size={20} className="text-green-400" />, defaultLabel: 'Sân Golf Tân Sơn Nhất' },
  { id: 'gas', name: 'Trạm xăng', icon: <Fuel size={20} className="text-orange-400" />, defaultLabel: 'Cây xăng Petrolimex' },
  { id: 'cafe', name: 'Quán Cafe / Ăn uống', icon: <Coffee size={20} className="text-yellow-600" />, defaultLabel: 'Highlands Coffee' },
];

export const WidgetsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<'widget' | 'radar'>('widget');
  const [selectedWidget, setSelectedWidget] = useState(WIDGETS[0]);
  const [label, setLabel] = useState(WIDGETS[0].defaultLabel);

  // Radar
  const [radarColor, setRadarColor] = useState('#3b82f6');
  const [radarRadius, setRadarRadius] = useState(500);

  const { addLayer, playhead, duration, currentCamera } = useProjectStore();

  const handleAdd = () => {
    if (tab === 'widget') {
      const newLayer = {
        id: `widget-layer-${Date.now()}`,
        type: 'widget' as const,
        name: `Tiện ích: ${label}`,
        color: '#3b82f6',
        startTime: playhead,
        endTime: Math.min(playhead + 4.0, duration),
        visible: true,
        locked: false,
        selected: true,
        widgetData: {
          widgetType: selectedWidget.id as any,
          label,
          lngLat: currentCamera.center,
        },
      };
      addLayer(newLayer);
    } else {
      const newLayer = {
        id: `radar-layer-${Date.now()}`,
        type: 'widget' as const,
        name: `Hiệu ứng Radar quét`,
        color: radarColor,
        startTime: playhead,
        endTime: Math.min(playhead + 4.0, duration),
        visible: true,
        locked: false,
        selected: true,
        widgetData: {
          widgetType: 'radar' as const,
          label: 'Vòng quét Radar',
          lngLat: currentCamera.center,
          isRadar: true,
          radarRadius,
          radarColor,
        },
      };
      addLayer(newLayer);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-[500px] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Boxes size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Tiện ích (Widgets) & Hiệu ứng Radar</h2>
              <p className="text-slate-400 text-xs">Biểu tượng địa điểm & Vòng sóng quét highlight vùng</p>
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
            onClick={() => setTab('widget')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              tab === 'widget'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes size={14} />
            Biểu tượng tiện ích (8 Icons)
          </button>
          <button
            type="button"
            onClick={() => setTab('radar')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              tab === 'radar'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Radio size={14} />
            Hiệu ứng sóng quét Radar
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {tab === 'widget' ? (
            <>
              {/* Widgets Grid */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Chọn biểu tượng</label>
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {WIDGETS.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => { setSelectedWidget(w); setLabel(w.defaultLabel); }}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                        selectedWidget.id === w.id
                          ? 'border-blue-500 bg-blue-600/20 shadow-md'
                          : 'border-slate-700/60 bg-[#1e293b]/40 hover:border-slate-500'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                        {w.icon}
                      </div>
                      <span className="text-xs font-semibold text-slate-200">{w.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div className="space-y-1.5 pt-2 border-t border-[#1e293b]">
                <label className="text-xs text-slate-400 font-medium">Tên hiển thị trên bản đồ</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none focus:border-blue-500"
                />
              </div>
            </>
          ) : (
            <>
              {/* Radar Config */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Bán kính quét (Mét)</label>
                  <div className="flex items-center gap-3 bg-[#1e293b]/60 px-3 py-2 rounded-xl border border-slate-700">
                    <input
                      type="range"
                      min={100}
                      max={3000}
                      step={50}
                      value={radarRadius}
                      onChange={(e) => setRadarRadius(Number(e.target.value))}
                      className="flex-1 accent-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-mono font-medium text-blue-400 min-w-[50px] text-right">
                      {radarRadius}m
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Màu sóng quét phát sáng</label>
                  <div className="flex items-center gap-3 bg-[#1e293b]/60 px-3 py-2 rounded-xl border border-slate-700">
                    <input
                      type="color"
                      value={radarColor}
                      onChange={(e) => setRadarColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent"
                    />
                    <span className="text-xs font-mono text-slate-200">{radarColor}</span>
                  </div>
                </div>

                {/* Animation Preview */}
                <div className="h-28 bg-[#1e293b]/50 border border-slate-700/60 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="w-3 h-3 rounded-full bg-blue-500 relative z-10" />
                  <div className="w-12 h-12 rounded-full border border-blue-400/80 absolute animate-ping" />
                  <div className="w-20 h-20 rounded-full border border-blue-400/40 absolute animate-pulse" />
                </div>
              </div>
            </>
          )}

          <button
            type="button"
            onClick={handleAdd}
            className="w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-300 hover:to-indigo-300 shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Plus size={16} />
            Thêm vào tọa độ tâm bản đồ
          </button>
        </div>
      </div>
    </div>
  );
};
