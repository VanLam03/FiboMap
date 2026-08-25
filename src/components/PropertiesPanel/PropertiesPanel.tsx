import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { AreaProperties } from './AreaProperties';
import { CameraProperties } from './CameraProperties';
import {
  Settings2, Layers, ChevronDown, ChevronUp,
  Type, MapPin, Navigation, Mic, Square, BarChart2,
  MessageSquare, Radio, Package, AlignLeft
} from 'lucide-react';

const LAYER_TYPE_ICON: Record<string, React.ReactNode> = {
  area: <Square size={13} className="text-amber-400" />,
  text: <Type size={13} className="text-blue-400" />,
  line: <Navigation size={13} className="text-emerald-400" />,
  route: <Navigation size={13} className="text-cyan-400" />,
  arrow: <Navigation size={13} className="text-orange-400" />,
  callout: <MessageSquare size={13} className="text-pink-400" />,
  widget: <Radio size={13} className="text-purple-400" />,
  object: <Package size={13} className="text-sky-400" />,
  counter: <BarChart2 size={13} className="text-lime-400" />,
  audio: <Mic size={13} className="text-rose-400" />,
};

export const PropertiesPanel: React.FC = () => {
  const { selectedLayerId, layers, isKeyframeCameraMode } = useProjectStore();
  const selectedLayers = layers.filter((l) => l.selected || l.id === selectedLayerId);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  return (
    <aside className="flex flex-col bg-[#0f172a] border-l border-[#1e293b] w-[340px] flex-shrink-0 select-none overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 h-11 border-b border-[#1e293b] flex-shrink-0 bg-[#0a1628]/60">
        <Settings2 size={16} className="text-blue-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
          Khung thuộc tính
        </span>
        {selectedLayers.length > 1 ? (
          <div className="ml-auto flex items-center gap-1.5 bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/40 text-[11px] font-semibold">
            <span>{selectedLayers.length} lớp đã chọn</span>
          </div>
        ) : selectedLayer && (
          <div className="ml-auto flex items-center gap-1.5 bg-[#1e293b] px-2 py-0.5 rounded-full border border-slate-700">
            {LAYER_TYPE_ICON[selectedLayer.type]}
            <span className="text-[11px] text-slate-300 font-medium truncate max-w-[110px]">
              {selectedLayer.name}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Camera keyframe properties (when camera mode active) */}
        {isKeyframeCameraMode && <CameraProperties />}

        {/* Multi-layer selection view */}
        {selectedLayers.length > 1 ? (
          <MultiLayerProperties layers={selectedLayers} />
        ) : selectedLayer ? (
          <>
            {selectedLayer.type === 'area' && <AreaProperties layerId={selectedLayer.id} />}
            {selectedLayer.type === 'text' && <TextProperties layerId={selectedLayer.id} />}
            {selectedLayer.type === 'line' && <LineProperties layerId={selectedLayer.id} />}
            {selectedLayer.type === 'route' && <LineProperties layerId={selectedLayer.id} />}
            {selectedLayer.type === 'arrow' && <ArrowProperties layerId={selectedLayer.id} />}
            {selectedLayer.type === 'callout' && <CalloutProperties layerId={selectedLayer.id} />}
            {selectedLayer.type === 'widget' && <WidgetProperties layerId={selectedLayer.id} />}
            {selectedLayer.type === 'object' && <ObjectProperties layerId={selectedLayer.id} />}
            {selectedLayer.type === 'counter' && <CounterProperties layerId={selectedLayer.id} />}
            {/* Time range always shown */}
            <LayerTimingSection layer={selectedLayer} />
          </>
        ) : !isKeyframeCameraMode && (
          <div className="flex flex-col items-center justify-center gap-3.5 p-8 text-center h-full">
            <div className="w-14 h-14 rounded-2xl bg-[#1e293b]/80 border border-slate-700/60 flex items-center justify-center shadow-inner">
              <Layers size={24} className="text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-300 font-semibold">Chưa chọn đối tượng</p>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-[220px]">
                Click vào một lớp hoặc quét chuột chọn nhiều lớp trên Timeline để tùy chỉnh thuộc tính hàng loạt
              </p>
            </div>
            {/* Quick tips */}
            <div className="w-full mt-2 space-y-2">
              {[
                { icon: '🎬', tip: 'Bật Camera mode → Di chuyển bản đồ → +K để thêm keyframe' },
                { icon: '🗺️', tip: 'Vẽ vùng → Click vào lớp trên timeline để chỉnh màu, hiệu ứng 3D' },
                { icon: '⌨️', tip: 'Space = Phát/Dừng · Shift+Kéo = Xoay 3D bản đồ' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 bg-[#1e293b]/40 border border-slate-800 rounded-xl px-3 py-2 text-left">
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{item.tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

// ─── Layer Timing Section ──────────────────────────────────────────────────────
const LayerTimingSection: React.FC<{ layer: { id: string; startTime: number; endTime: number; name: string } }> = ({ layer }) => {
  const { updateLayer } = useProjectStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-[#1e293b] mx-4 mt-2 pt-2 pb-4">
      <button
        className="flex items-center gap-2 w-full text-left"
        onClick={() => setOpen(!open)}
      >
        <AlignLeft size={12} className="text-slate-500" />
        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex-1">Thời gian Layer</span>
        {open ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-slate-500 mb-1">Bắt đầu (s)</p>
            <input
              type="number"
              value={layer.startTime.toFixed(1)}
              min={0}
              step={0.1}
              onChange={(e) => updateLayer(layer.id, { startTime: parseFloat(e.target.value) })}
              className="w-full bg-[#1e293b] text-white text-xs px-2 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-blue-500 text-center font-mono"
            />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-1">Kết thúc (s)</p>
            <input
              type="number"
              value={layer.endTime.toFixed(1)}
              min={0}
              step={0.1}
              onChange={(e) => updateLayer(layer.id, { endTime: parseFloat(e.target.value) })}
              className="w-full bg-[#1e293b] text-white text-xs px-2 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-blue-500 text-center font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Text Properties ──────────────────────────────────────────────────────────
const TextProperties: React.FC<{ layerId: string }> = ({ layerId }) => {
  const { layers, updateLayer } = useProjectStore();
  const layer = layers.find((l) => l.id === layerId);
  const data = layer?.textData;
  if (!data) return null;

  const TEXT_EFFECTS = [
    { id: 'none', label: 'Không' },
    { id: 'fade-in', label: 'Hiện mờ' },
    { id: 'neon', label: 'Neon' },
    { id: 'cinematic-glow', label: 'Điện ảnh' },
    { id: 'typewriter', label: 'Đánh máy' },
    { id: 'drop-shadow', label: 'Đổ bóng' },
  ];

  return (
    <div className="p-4 space-y-4 animate-fadeIn">
      <PropertySection title="Nội dung văn bản">
        <textarea
          className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-[#334155] outline-none resize-none focus:border-blue-500 transition-colors shadow-inner"
          rows={3}
          value={data.content}
          onChange={(e) => updateLayer(layerId, { textData: { ...data, content: e.target.value } })}
        />
      </PropertySection>
      <PropertySection title="Cỡ chữ (Font Size)">
        <SliderRow
          value={data.fontSize}
          min={8} max={96}
          onChange={(v) => updateLayer(layerId, { textData: { ...data, fontSize: v } })}
          unit="px"
        />
      </PropertySection>
      <PropertySection title="Màu chữ">
        <ColorRow
          color={data.color}
          onChange={(c) => updateLayer(layerId, { textData: { ...data, color: c } })}
        />
      </PropertySection>
      <PropertySection title="Hiệu ứng chữ">
        <div className="grid grid-cols-3 gap-1.5">
          {TEXT_EFFECTS.map((ef) => (
            <button
              key={ef.id}
              onClick={() => updateLayer(layerId, { textData: { ...data, effect: ef.id as any } })}
              className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                (data.effect || 'none') === ef.id
                  ? 'bg-blue-600/25 border-blue-500 text-blue-300'
                  : 'bg-[#1e293b]/40 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {ef.label}
            </button>
          ))}
        </div>
      </PropertySection>
      <PropertySection title="Hiệu ứng phát sáng (Glow)">
        <TogglePill
          value={data.glow ?? false}
          labelOn="Bật Glow"
          labelOff="Tắt"
          onChange={(v) => updateLayer(layerId, { textData: { ...data, glow: v } })}
        />
      </PropertySection>
      <PropertySection title="Tọa độ hiển thị">
        <TogglePill
          value={data.pinToMap}
          labelOn="Ghim vào bản đồ (3D)"
          labelOff="Cố định màn hình"
          onChange={(v) => updateLayer(layerId, { textData: { ...data, pinToMap: v } })}
        />
      </PropertySection>
    </div>
  );
};

// ─── Line Properties ──────────────────────────────────────────────────────────
const LineProperties: React.FC<{ layerId: string }> = ({ layerId }) => {
  const { layers, updateLayer } = useProjectStore();
  const layer = layers.find((l) => l.id === layerId);
  const data = layer?.lineData;
  if (!data) return null;

  return (
    <div className="p-4 space-y-4 animate-fadeIn">
      <PropertySection title="Loại lớp">
        <div className="bg-[#1e293b]/60 px-3 py-2 rounded-xl border border-slate-700/60 text-xs text-slate-300 font-mono">
          {layer?.type === 'route' ? '🛣️ Tuyến đường tự động (OSRM)' : '✏️ Đường thủ công'}
        </div>
      </PropertySection>
      <PropertySection title="Màu đường">
        <ColorRow color={data.color} onChange={(c) => updateLayer(layerId, { lineData: { ...data, color: c } })} />
      </PropertySection>
      <PropertySection title="Độ rộng (Width)">
        <SliderRow value={data.width} min={1} max={12} step={0.5} onChange={(v) => updateLayer(layerId, { lineData: { ...data, width: v } })} unit="px" />
      </PropertySection>
      <PropertySection title="Hiệu ứng phát sáng (Glow)">
        <TogglePill value={data.glow ?? false} labelOn="Bật phát sáng" labelOff="Tắt" onChange={(v) => updateLayer(layerId, { lineData: { ...data, glow: v } })} />
      </PropertySection>
      {data.distanceKm && (
        <PropertySection title="Khoảng cách tuyến đường">
          <div className="bg-[#1e293b]/60 px-3 py-2 rounded-xl border border-slate-700/60 text-xs text-emerald-300 font-mono font-bold">
            📏 {data.distanceKm} km
          </div>
        </PropertySection>
      )}
    </div>
  );
};

// ─── Arrow Properties ─────────────────────────────────────────────────────────
const ArrowProperties: React.FC<{ layerId: string }> = ({ layerId }) => {
  const { layers, updateLayer } = useProjectStore();
  const layer = layers.find((l) => l.id === layerId);
  const data = layer?.arrowData;
  if (!data) return null;

  return (
    <div className="p-4 space-y-4 animate-fadeIn">
      <PropertySection title="Màu mũi tên">
        <ColorRow color={data.color} onChange={(c) => updateLayer(layerId, { arrowData: { ...data, color: c } })} />
      </PropertySection>
      <PropertySection title="Độ dày">
        <SliderRow value={data.width} min={1} max={10} step={0.5} onChange={(v) => updateLayer(layerId, { arrowData: { ...data, width: v } })} unit="px" />
      </PropertySection>
      <PropertySection title="Kích thước đầu mũi">
        <SliderRow value={data.headSize} min={5} max={40} onChange={(v) => updateLayer(layerId, { arrowData: { ...data, headSize: v } })} unit="px" />
      </PropertySection>
      <PropertySection title="Độ uốn cong">
        <SliderRow value={data.curvature} min={0} max={1} step={0.05} onChange={(v) => updateLayer(layerId, { arrowData: { ...data, curvature: v } })} />
      </PropertySection>
      <PropertySection title="Hiệu ứng di chuyển">
        <TogglePill value={data.animated} labelOn="Chuyển động (Animated)" labelOff="Cố định" onChange={(v) => updateLayer(layerId, { arrowData: { ...data, animated: v } })} />
      </PropertySection>
    </div>
  );
};

// ─── Callout Properties ───────────────────────────────────────────────────────
const CalloutProperties: React.FC<{ layerId: string }> = ({ layerId }) => {
  const { layers, updateLayer } = useProjectStore();
  const layer = layers.find((l) => l.id === layerId);
  const data = layer?.calloutData;
  if (!data) return null;

  const THEMES = [
    { id: 'location', label: '📍 Địa điểm' },
    { id: 'real_estate', label: '🏢 Bất động sản' },
    { id: 'social_tiktok', label: '📱 Social Media' },
    { id: 'phone', label: '📞 Hotline' },
    { id: 'media', label: '🎬 Media' },
  ];

  return (
    <div className="p-4 space-y-4 animate-fadeIn">
      <PropertySection title="Chủ đề Callout">
        <div className="space-y-1.5">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => updateLayer(layerId, { calloutData: { ...data, theme: t.id as any } })}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                data.theme === t.id
                  ? 'bg-pink-600/20 border-pink-500 text-pink-300'
                  : 'bg-[#1e293b]/40 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </PropertySection>
      <PropertySection title="Tiêu đề">
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateLayer(layerId, { calloutData: { ...data, title: e.target.value } })}
          className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-[#334155] outline-none focus:border-blue-500 transition-colors"
          placeholder="Tên địa điểm, dự án..."
        />
      </PropertySection>
      <PropertySection title="Phụ đề">
        <input
          type="text"
          value={data.subtitle || ''}
          onChange={(e) => updateLayer(layerId, { calloutData: { ...data, subtitle: e.target.value } })}
          className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-[#334155] outline-none focus:border-blue-500 transition-colors"
          placeholder="Địa chỉ, mô tả ngắn..."
        />
      </PropertySection>
      {(data.theme === 'real_estate') && (
        <>
          <PropertySection title="Giá">
            <input
              type="text"
              value={data.price || ''}
              onChange={(e) => updateLayer(layerId, { calloutData: { ...data, price: e.target.value } })}
              className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-[#334155] outline-none focus:border-blue-500 transition-colors"
              placeholder="Từ 2.5 Tỷ/căn..."
            />
          </PropertySection>
          <PropertySection title="Diện tích">
            <input
              type="text"
              value={data.area || ''}
              onChange={(e) => updateLayer(layerId, { calloutData: { ...data, area: e.target.value } })}
              className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-[#334155] outline-none focus:border-blue-500 transition-colors"
              placeholder="271 ha..."
            />
          </PropertySection>
        </>
      )}
    </div>
  );
};

// ─── Widget Properties ────────────────────────────────────────────────────────
const WidgetProperties: React.FC<{ layerId: string }> = ({ layerId }) => {
  const { layers, updateLayer } = useProjectStore();
  const layer = layers.find((l) => l.id === layerId);
  const data = layer?.widgetData;
  if (!data) return null;

  return (
    <div className="p-4 space-y-4 animate-fadeIn">
      <PropertySection title="Loại tiện ích">
        <div className="bg-[#1e293b]/60 px-3 py-2 rounded-xl border border-slate-700/60 text-xs text-purple-300 font-semibold">
          {data.isRadar ? '📡 Radar / Sóng xung kích' : `🔘 Icon: ${data.label}`}
        </div>
      </PropertySection>
      <PropertySection title="Nhãn hiển thị">
        <input
          type="text"
          value={data.label}
          onChange={(e) => updateLayer(layerId, { widgetData: { ...data, label: e.target.value } })}
          className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-[#334155] outline-none focus:border-blue-500 transition-colors"
          placeholder="Nhãn widget..."
        />
      </PropertySection>
      <PropertySection title="Loại hiệu ứng">
        <TogglePill
          value={data.isRadar ?? false}
          labelOn="🔴 Radar Pulse"
          labelOff="📍 Icon Tiện ích"
          onChange={(v) => updateLayer(layerId, { widgetData: { ...data, isRadar: v } })}
        />
      </PropertySection>
    </div>
  );
};

// ─── Object Properties ────────────────────────────────────────────────────────
const ObjectProperties: React.FC<{ layerId: string }> = ({ layerId }) => {
  const { layers, updateLayer } = useProjectStore();
  const layer = layers.find((l) => l.id === layerId);
  const data = layer?.objectData;
  if (!data) return null;

  const TYPES = [
    { id: 'airplane', label: '✈️ Máy bay', desc: 'Di chuyển theo tuyến đường' },
    { id: 'car', label: '🚗 Xe hơi', desc: 'Xe di chuyển trên đường' },
    { id: 'person', label: '🚶 Người', desc: 'Nhân vật di chuyển' },
    { id: 'ship', label: '🚢 Tàu thuyền', desc: 'Di chuyển trên biển/sông' },
    { id: 'flag', label: '🚩 Quốc kỳ', desc: 'Quốc kỳ quốc gia' },
  ];

  return (
    <div className="p-4 space-y-4 animate-fadeIn">
      <PropertySection title="Loại đối tượng">
        <div className="space-y-1.5">
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => updateLayer(layerId, { objectData: { ...data, objectType: t.id as any } })}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                data.objectType === t.id
                  ? 'bg-sky-600/20 border-sky-500 text-sky-300'
                  : 'bg-[#1e293b]/40 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              <span className="font-semibold">{t.label}</span>
              <span className="text-slate-500 ml-2 text-[10px]">{t.desc}</span>
            </button>
          ))}
        </div>
      </PropertySection>
      {data.objectType === 'flag' && (
        <PropertySection title="Quốc gia">
          <input
            type="text"
            value={data.countryName || ''}
            onChange={(e) => updateLayer(layerId, { objectData: { ...data, countryName: e.target.value } })}
            className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-[#334155] outline-none focus:border-blue-500 transition-colors"
            placeholder="Việt Nam, Nhật Bản..."
          />
        </PropertySection>
      )}
      <PropertySection title="Tốc độ di chuyển">
        <SliderRow
          value={data.speed || 1}
          min={0.1} max={5} step={0.1}
          onChange={(v) => updateLayer(layerId, { objectData: { ...data, speed: v } })}
          unit="x"
        />
      </PropertySection>
    </div>
  );
};

// ─── Counter Properties ───────────────────────────────────────────────────────
const CounterProperties: React.FC<{ layerId: string }> = ({ layerId }) => {
  const { layers, updateLayer } = useProjectStore();
  const layer = layers.find((l) => l.id === layerId);
  const data = layer?.counterData;
  if (!data) return null;

  return (
    <div className="p-4 space-y-4 animate-fadeIn">
      <PropertySection title="Giá trị bắt đầu">
        <input
          type="number"
          value={data.startValue}
          onChange={(e) => updateLayer(layerId, { counterData: { ...data, startValue: parseFloat(e.target.value) } })}
          className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-[#334155] outline-none focus:border-blue-500 transition-colors font-mono text-center"
        />
      </PropertySection>
      <PropertySection title="Giá trị kết thúc">
        <input
          type="number"
          value={data.endValue}
          onChange={(e) => updateLayer(layerId, { counterData: { ...data, endValue: parseFloat(e.target.value) } })}
          className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-[#334155] outline-none focus:border-blue-500 transition-colors font-mono text-center"
        />
      </PropertySection>
      <PropertySection title="Tiền tố / Hậu tố">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-[10px] text-slate-500 mb-1">Tiền tố (Prefix)</p>
            <input
              type="text"
              value={data.prefix || ''}
              onChange={(e) => updateLayer(layerId, { counterData: { ...data, prefix: e.target.value } })}
              className="w-full bg-[#1e293b] text-white text-xs px-2 py-1.5 rounded-lg border border-[#334155] outline-none focus:border-blue-500 font-mono text-center"
              placeholder="$, +..."
            />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-1">Hậu tố (Suffix)</p>
            <input
              type="text"
              value={data.suffix || ''}
              onChange={(e) => updateLayer(layerId, { counterData: { ...data, suffix: e.target.value } })}
              className="w-full bg-[#1e293b] text-white text-xs px-2 py-1.5 rounded-lg border border-[#334155] outline-none focus:border-blue-500 font-mono text-center"
              placeholder="%,  km²..."
            />
          </div>
        </div>
      </PropertySection>
      <PropertySection title="Màu số">
        <ColorRow
          color={data.color || '#f59e0b'}
          onChange={(c) => updateLayer(layerId, { counterData: { ...data, color: c } })}
        />
      </PropertySection>
      <PropertySection title="Cỡ chữ">
        <SliderRow value={data.fontSize || 48} min={16} max={120} onChange={(v) => updateLayer(layerId, { counterData: { ...data, fontSize: v } })} unit="px" />
      </PropertySection>
    </div>
  );
};

// ─── Shared UI primitives ─────────────────────────────────────────────────────
export const PropertySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-1.5">
    <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">{title}</p>
    {children}
  </div>
);

export const SliderRow: React.FC<{
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void;
  unit?: string;
}> = ({ value, min, max, step = 0.1, onChange, unit = '' }) => (
  <div className="flex items-center gap-3 bg-[#1e293b]/60 px-3 py-2 rounded-xl border border-slate-700/60">
    <input
      type="range"
      min={min} max={max} step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="flex-1 accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
    />
    <span className="text-xs font-mono font-medium text-slate-200 min-w-[42px] text-right bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
      {value.toFixed(step < 1 ? 1 : 0)}{unit}
    </span>
  </div>
);

export const TogglePill: React.FC<{
  value: boolean;
  labelOn: string;
  labelOff: string;
  onChange: (v: boolean) => void;
}> = ({ value, labelOn, labelOff, onChange }) => (
  <div className="flex bg-[#1e293b] rounded-xl p-1 gap-1 border border-slate-700/60 shadow-inner">
    <button
      onClick={() => onChange(true)}
      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
        value
          ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
          : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {labelOn}
    </button>
    <button
      onClick={() => onChange(false)}
      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
        !value
          ? 'bg-[#0f172a] text-white shadow-md'
          : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {labelOff}
    </button>
  </div>
);

export const ColorRow: React.FC<{ color: string; onChange: (c: string) => void }> = ({ color, onChange }) => {
  const PALETTE = [
    '#f5b942', '#f97316', '#ef4444', '#ec4899', '#8b5cf6',
    '#3b82f6', '#06b6d4', '#10b981', '#16a34a', '#ffffff',
    '#64748b', '#000000',
  ];
  const uid = Math.random().toString(36).slice(2);
  return (
    <div className="space-y-2.5 bg-[#1e293b]/60 p-3 rounded-xl border border-slate-700/60">
      <div className="flex items-center gap-2.5">
        <div
          className="w-10 h-10 rounded-xl border-2 border-[#334155] cursor-pointer flex-shrink-0 shadow-md hover:scale-105 transition-transform"
          style={{ background: color }}
          onClick={() => document.getElementById(`ci-${uid}`)?.click()}
        />
        <input
          id={`ci-${uid}`}
          type="color"
          value={color.startsWith('#') && color.length === 7 ? color : '#f5b942'}
          onChange={(e) => onChange(e.target.value)}
          className="sr-only"
        />
        <input
          type="text"
          value={color}
          onChange={(e) => { if (/^#[0-9a-fA-F]{0,8}$/.test(e.target.value)) onChange(e.target.value); }}
          className="flex-1 bg-[#0f172a] text-white text-xs px-3 py-2 rounded-lg border border-[#334155] outline-none focus:border-blue-500 font-mono tracking-wider"
          maxLength={9}
        />
      </div>
      <div className="flex gap-2 flex-wrap pt-1">
        {PALETTE.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-125 shadow-sm ${
              color.toLowerCase() === c.toLowerCase() ? 'border-white scale-110 shadow-white/30' : 'border-transparent'
            }`}
            style={{ background: c }}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Multi-Layer Bulk Properties Component (Matches Screenshot) ─────────────────
export const MultiLayerProperties: React.FC<{ layers: any[] }> = ({ layers }) => {
  const {
    setSelectedLayersDuration,
    adjustSelectedLayersDuration,
    sequenceSelectedLayers,
    deleteSelectedLayers,
  } = useProjectStore();

  // Compute average duration of selected layers
  const avgDuration = layers.length > 0
    ? layers.reduce((acc, l) => acc + (l.endTime - l.startTime), 0) / layers.length
    : 5.0;

  const [targetDuration, setTargetDuration] = useState(avgDuration);

  useEffect(() => {
    setTargetDuration(avgDuration);
  }, [layers.length, avgDuration]);

  const handleSliderChange = (newVal: number) => {
    setTargetDuration(newVal);
    setSelectedLayersDuration(newVal);
  };

  return (
    <div className="p-4 space-y-4 animate-fadeIn">
      {/* Title block with rounded square badge */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#141f36] border border-[#223354] flex items-center justify-center flex-shrink-0 shadow-inner">
          <div className="w-4 h-4 rounded border-2 border-slate-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white leading-tight">
            Đã chọn {layers.length} lớp
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Chỉnh & xoá hàng loạt
          </p>
        </div>
      </div>

      {/* Helper description text */}
      <p className="text-[11px] text-slate-400 leading-relaxed">
        Kéo một clip/keyframe đã chọn để dời cả nhóm; kéo mép clip để đổi độ dài cả nhóm.
      </p>

      {/* Set same duration slider */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white">Đặt cùng độ dài (s)</span>
          <span className="text-xs font-mono font-medium text-slate-300">
            {targetDuration.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={0.5}
            max={20}
            step={0.1}
            value={targetDuration}
            onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-[#1e293b] rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>
      </div>

      {/* Quick +/- 0.5s buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            adjustSelectedLayersDuration(-0.5);
            setTargetDuration(prev => Math.max(0.5, prev - 0.5));
          }}
          className="flex-1 py-2 px-3 rounded-xl bg-[#141f36] hover:bg-[#1c2c4d] border border-slate-700/60 text-xs font-medium text-slate-200 transition-all shadow-sm active:scale-98 text-center"
        >
          − 0.5s
        </button>
        <button
          onClick={() => {
            adjustSelectedLayersDuration(0.5);
            setTargetDuration(prev => prev + 0.5);
          }}
          className="flex-1 py-2 px-3 rounded-xl bg-[#141f36] hover:bg-[#1c2c4d] border border-slate-700/60 text-xs font-medium text-slate-200 transition-all shadow-sm active:scale-98 text-center"
        >
          + 0.5s
        </button>
      </div>

      {/* Sequence consecutive button */}
      <button
        onClick={sequenceSelectedLayers}
        className="w-full py-2.5 px-4 rounded-xl bg-[#141f36] hover:bg-[#1c2c4d] border border-slate-700/60 text-xs font-semibold text-white transition-all shadow-sm active:scale-98 flex items-center justify-center gap-1.5"
      >
        <span>⇥</span>
        <span>Xếp khít nối tiếp</span>
      </button>

      {/* Delete selected items button */}
      <button
        onClick={deleteSelectedLayers}
        className="w-full py-2.5 px-4 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/40 text-xs font-semibold text-rose-400 transition-all shadow-sm active:scale-98 flex items-center justify-center gap-1.5"
      >
        <span>Xoá {layers.length} mục đã chọn</span>
      </button>
    </div>
  );
};

