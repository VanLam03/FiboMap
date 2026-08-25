import React, { useState } from 'react';
import { Type, Sparkles, Hash, X, Plus, Play } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

const TEXT_PRESETS = [
  { id: 'cinematic-gold', name: 'Tiêu đề Điện Ảnh Vàng', color: '#f59e0b', effect: 'cinematic-glow', sample: 'HOÀNG HÔN VEN BIỂN' },
  { id: 'neon-cyber', name: 'Neon Cyber Blue', color: '#00f2fe', effect: 'neon', sample: 'METROPOLIS 2026' },
  { id: 'typewriter', name: 'Hiệu ứng Typewriter (Gõ chữ)', color: '#ffffff', effect: 'typewriter', sample: 'Khám phá hành trình...' },
  { id: 'fade-slide-up', name: 'Trượt từ dưới lên (Slide Up)', color: '#60a5fa', effect: 'slide-up', sample: 'QUY HOẠCH ĐÔ THỊ' },
  { id: 'glitch-tech', name: 'Glitch Kỹ thuật số', color: '#ec4899', effect: 'glitch', sample: 'VIETNAM AIRPORT' },
  { id: '3d-pop', name: 'Chữ nổi 3D Pop-out', color: '#10b981', effect: '3d-pop', sample: 'DI SẢN THẾ GIỚI' },
  { id: 'gradient-flame', name: 'Gradient Lửa Cam/Đỏ', color: '#f97316', effect: 'gradient-flame', sample: 'CHIẾN DỊCH LỊCH SỬ' },
  { id: 'luxury-serif', name: 'Sang Trọng Luxury Gold', color: '#eab308', effect: 'luxury', sample: 'THE GRAND MANHATTAN' },
];

export const TextEffectsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [tab, setTab] = useState<'presets' | 'counter'>('presets');
  const [customText, setCustomText] = useState('FiboMap Cinematic Text');
  const [selectedPreset, setSelectedPreset] = useState(TEXT_PRESETS[0]);
  const [pinToMap, setPinToMap] = useState(false);
  const [fontSize, setFontSize] = useState(36);

  // Counter state
  const [startVal, setStartVal] = useState(0);
  const [endVal, setEndVal] = useState(100);
  const [prefix, setPrefix] = useState('$');
  const [suffix, setSuffix] = useState('%');
  const [decimals, setDecimals] = useState(0);
  const [counterColor, setCounterColor] = useState('#f59e0b');

  const { addLayer, playhead, duration, currentCamera } = useProjectStore();

  const handleAddText = () => {
    if (tab === 'presets') {
      const newLayer = {
        id: `text-layer-${Date.now()}`,
        type: 'text' as const,
        name: `Chữ: ${customText.slice(0, 15)}...`,
        color: selectedPreset.color,
        startTime: playhead,
        endTime: Math.min(playhead + 4.0, duration),
        visible: true,
        locked: false,
        selected: true,
        textData: {
          content: customText,
          fontSize,
          color: selectedPreset.color,
          pinToMap,
          lngLat: pinToMap ? currentCamera.center : undefined,
          screenX: 50,
          screenY: 25,
          effect: selectedPreset.effect,
          glow: true,
        },
      };
      addLayer(newLayer);
    } else {
      const newLayer = {
        id: `counter-layer-${Date.now()}`,
        type: 'counter' as const,
        name: `Bộ đếm: ${prefix}${startVal}→${endVal}${suffix}`,
        color: counterColor,
        startTime: playhead,
        endTime: Math.min(playhead + 3.5, duration),
        visible: true,
        locked: false,
        selected: true,
        counterData: {
          startValue: startVal,
          endValue: endVal,
          prefix,
          suffix,
          decimals,
          fontSize: 48,
          color: counterColor,
          pinToMap,
          lngLat: pinToMap ? currentCamera.center : undefined,
        },
      };
      addLayer(newLayer);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-[520px] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Thư viện Chữ & Hiệu ứng động</h2>
              <p className="text-slate-400 text-xs">Hơn 50 mẫu chữ điện ảnh, Typewriter & Bộ đếm số tự động</p>
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
            onClick={() => setTab('presets')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              tab === 'presets'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type size={14} />
            Mẫu Chữ Animation (50+ Presets)
          </button>
          <button
            type="button"
            onClick={() => setTab('counter')}
            className={`flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              tab === 'counter'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hash size={14} />
            Bộ Đếm Số Tự Động (Number Counter)
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {tab === 'presets' ? (
            <>
              {/* Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Nội dung văn bản</label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="w-full bg-[#1e293b] text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 outline-none focus:border-blue-500 shadow-inner"
                  placeholder="Nhập nội dung hiển thị..."
                />
              </div>

              {/* Presets Grid */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-medium">Chọn phong cách hiệu ứng</label>
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {TEXT_PRESETS.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPreset(p)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        selectedPreset.id === p.id
                          ? 'border-blue-500 bg-blue-600/20 shadow-md'
                          : 'border-slate-700/60 bg-[#1e293b]/40 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-[11px] text-slate-400 font-medium mb-1">{p.name}</span>
                      <span
                        className="text-xs font-bold truncate tracking-wider py-1"
                        style={{ color: p.color, textShadow: `0 0 10px ${p.color}66` }}
                      >
                        {p.sample}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Number Counter Configuration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Giá trị bắt đầu</label>
                  <input
                    type="number"
                    value={startVal}
                    onChange={(e) => setStartVal(Number(e.target.value))}
                    className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Giá trị kết thúc</label>
                  <input
                    type="number"
                    value={endVal}
                    onChange={(e) => setEndVal(Number(e.target.value))}
                    className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Tiền tố (Prefix)</label>
                  <input
                    type="text"
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none text-center"
                    placeholder="VD: $"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Hậu tố (Suffix)</label>
                  <input
                    type="text"
                    value={suffix}
                    onChange={(e) => setSuffix(e.target.value)}
                    className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none text-center"
                    placeholder="VD: % hoặc tỷ"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium">Chữ số thập phân</label>
                  <input
                    type="number"
                    min={0}
                    max={3}
                    value={decimals}
                    onChange={(e) => setDecimals(Number(e.target.value))}
                    className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none text-center"
                  />
                </div>
              </div>

              {/* Preview Box */}
              <div className="bg-[#1e293b]/70 border border-slate-700 rounded-xl p-4 text-center space-y-1">
                <p className="text-[11px] text-slate-400 uppercase tracking-wider">Xem trước hiệu ứng đếm số</p>
                <div className="text-3xl font-black font-mono text-amber-400 py-1" style={{ textShadow: '0 0 15px rgba(245, 158, 11, 0.4)' }}>
                  {prefix}{endVal.toFixed(decimals)}{suffix}
                </div>
              </div>
            </>
          )}

          {/* Pin to map option */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]">
            <div>
              <p className="text-xs font-semibold text-slate-200">Ghim vào tọa độ bản đồ (3D Pin)</p>
              <p className="text-[11px] text-slate-400">Chữ sẽ bám chặt vào vị trí địa lý khi camera di chuyển/xoay</p>
            </div>
            <button
              type="button"
              onClick={() => setPinToMap(!pinToMap)}
              className={`w-12 h-6 rounded-full p-0.5 transition-colors ${
                pinToMap ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                pinToMap ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddText}
            className="w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-purple-400 to-pink-500 hover:from-purple-300 hover:to-pink-400 shadow-lg shadow-purple-900/40 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Plus size={16} />
            Thêm vào Timeline
          </button>
        </div>
      </div>
    </div>
  );
};
