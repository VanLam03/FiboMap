import React, { useState } from 'react';
import { BarChart2, TrendingUp, PieChart, Check, X, Plus, Trash2 } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

const CHART_PRESETS = [
  {
    title: 'Tăng trưởng giá bất động sản',
    type: 'bar',
    items: [
      { label: '2022', value: 45, unit: 'Tr/m²' },
      { label: '2023', value: 58, unit: 'Tr/m²' },
      { label: '2024', value: 75, unit: 'Tr/m²' },
      { label: '2025 (Dự kiến)', value: 92, unit: 'Tr/m²' },
    ],
  },
  {
    title: 'Cơ cấu quy hoạch sử dụng đất',
    type: 'percentage',
    items: [
      { label: 'Đất ở đô thị', value: 42, unit: '%' },
      { label: 'Cây xanh & Công viên', value: 28, unit: '%' },
      { label: 'Giao thông hạ tầng', value: 20, unit: '%' },
      { label: 'Thương mại dịch vụ', value: 10, unit: '%' },
    ],
  },
  {
    title: 'Mật độ cư dân dự kiến',
    type: 'counter',
    items: [
      { label: 'Giai đoạn 1', value: 15000, unit: 'Người' },
      { label: 'Giai đoạn 2', value: 45000, unit: 'Người' },
      { label: 'Hoàn thiện', value: 80000, unit: 'Người' },
    ],
  },
];

export const ChartModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [chartColor, setChartColor] = useState('#3b82f6');
  const { addLayer, playhead, duration } = useProjectStore();

  const handleAddChartToMap = () => {
    const preset = CHART_PRESETS[selectedPreset];

    addLayer({
      id: `chart-${Date.now()}`,
      type: 'text',
      name: `📊 ${preset.title}`,
      color: chartColor,
      startTime: playhead,
      endTime: Math.min(playhead + 5.0, duration),
      visible: true,
      locked: false,
      selected: true,
      textData: {
        content: `${preset.title.toUpperCase()}\n` + preset.items.map(i => `• ${i.label}: ${i.value} ${i.unit}`).join('\n'),
        fontSize: 22,
        color: '#ffffff',
        pinToMap: false,
        effect: 'drop-shadow',
        glow: true,
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-[500px] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BarChart2 size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Biểu đồ & Số liệu thống kê</h2>
              <p className="text-slate-400 text-xs">Tạo bảng thống kê tăng trưởng, quy hoạch trực quan</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Preset selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Chọn mẫu biểu đồ số liệu</label>
            <div className="space-y-2">
              {CHART_PRESETS.map((p, idx) => (
                <div
                  key={p.title}
                  onClick={() => setSelectedPreset(idx)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedPreset === idx
                      ? 'border-amber-500 bg-amber-500/15 text-white shadow-sm'
                      : 'border-slate-700/60 bg-[#1e293b]/40 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-amber-400">{p.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{p.items.length} chỉ số</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {p.items.map((item, i) => (
                      <div key={i} className="bg-black/30 px-2 py-1 rounded text-[10px] text-slate-300 flex justify-between">
                        <span>{item.label}</span>
                        <span className="font-bold text-amber-400">{item.value} {item.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Color selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Màu sắc chủ đạo</label>
            <div className="flex gap-2">
              {['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'].map((c) => (
                <button
                  key={c}
                  onClick={() => setChartColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    chartColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleAddChartToMap}
            className="w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-300 shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <TrendingUp size={16} />
            <span>Thêm biểu đồ số liệu vào bản đồ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
