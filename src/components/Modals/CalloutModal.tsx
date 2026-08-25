import React, { useState } from 'react';
import { MessageSquare, MapPin, Building, Phone, Video, Share2, X, Plus } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

const CALLOUT_TEMPLATES = [
  {
    id: 'location',
    name: '📌 Ghim vị trí (Location Pin)',
    desc: 'Hiển thị tên địa danh, tọa độ và địa chỉ chi tiết',
    icon: <MapPin size={18} className="text-red-400" />,
    defaultTitle: 'Hồ Hoàn Kiếm (Hồ Gươm)',
    defaultSubtitle: 'Quận Hoàn Kiếm, Thủ đô Hà Nội',
    theme: 'location' as const,
  },
  {
    id: 'real_estate',
    name: '🏢 Bất Động Sản & Dự Án',
    desc: 'Hiển thị giá bán, quy mô diện tích, chủ đầu tư',
    icon: <Building size={18} className="text-amber-400" />,
    defaultTitle: 'Vinhomes Central Park',
    defaultSubtitle: 'Bình Thạnh, TP. Hồ Chí Minh',
    price: 'Từ 4.8 Tỷ/căn',
    area: 'Quy mô 43.91 ha',
    theme: 'real_estate' as const,
  },
  {
    id: 'social_tiktok',
    name: '🎵 Kênh TikTok / Facebook',
    desc: 'Hiển thị ID kênh, avatar và lượng người theo dõi',
    icon: <Share2 size={18} className="text-pink-400" />,
    defaultTitle: '@fibomap.official',
    defaultSubtitle: '1.2M Followers · Video Bản Đồ',
    theme: 'social_tiktok' as const,
  },
  {
    id: 'phone',
    name: '📞 Hotline / Tư Vấn Bất Động Sản',
    desc: 'Số điện thoại liên hệ nổi bật trên khung chú thích',
    icon: <Phone size={18} className="text-green-400" />,
    defaultTitle: 'Phòng Kinh Doanh Dự Án',
    defaultSubtitle: 'Hotline 24/7: 0988.123.456',
    phoneNumber: '0988.123.456',
    theme: 'phone' as const,
  },
  {
    id: 'media',
    name: '🖼️ Khung Nối Video / Ảnh Cá Nhân',
    desc: 'Nối video/ảnh vào một điểm neo cố định trên bản đồ',
    icon: <Video size={18} className="text-blue-400" />,
    defaultTitle: 'Hình ảnh thực tế công trình',
    defaultSubtitle: 'Cập nhật tiến độ thi công tháng 8/2026',
    theme: 'media' as const,
  },
];

export const CalloutModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(CALLOUT_TEMPLATES[0]);
  const [title, setTitle] = useState(CALLOUT_TEMPLATES[0].defaultTitle);
  const [subtitle, setSubtitle] = useState(CALLOUT_TEMPLATES[0].defaultSubtitle);
  const [price, setPrice] = useState(CALLOUT_TEMPLATES[1].price || '');
  const [area, setArea] = useState(CALLOUT_TEMPLATES[1].area || '');
  const { addLayer, playhead, duration, currentCamera } = useProjectStore();

  const handleSelectTemplate = (tpl: typeof CALLOUT_TEMPLATES[0]) => {
    setSelectedTemplate(tpl);
    setTitle(tpl.defaultTitle);
    setSubtitle(tpl.defaultSubtitle);
    if (tpl.price) setPrice(tpl.price);
    if (tpl.area) setArea(tpl.area);
  };

  const handleAddCallout = () => {
    const newLayer = {
      id: `callout-layer-${Date.now()}`,
      type: 'callout' as const,
      name: `Callout: ${title.slice(0, 15)}...`,
      color: '#f59e0b',
      startTime: playhead,
      endTime: Math.min(playhead + 4.0, duration),
      visible: true,
      locked: false,
      selected: true,
      calloutData: {
        title,
        subtitle,
        theme: selectedTemplate.theme,
        lngLat: currentCamera.center,
        price: selectedTemplate.theme === 'real_estate' ? price : undefined,
        area: selectedTemplate.theme === 'real_estate' ? area : undefined,
      },
    };
    addLayer(newLayer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-[520px] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <MessageSquare size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Khung chú thích (Callout Presets)</h2>
              <p className="text-slate-400 text-xs">Nhiều mẫu khung chú thích đa dạng, ghim tọa độ trên bản đồ</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Templates Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Chọn mẫu khung Callout</label>
            <div className="space-y-1.5">
              {CALLOUT_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    selectedTemplate.id === tpl.id
                      ? 'border-amber-500 bg-amber-500/15 text-white shadow-sm'
                      : 'border-slate-700/60 bg-[#1e293b]/40 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {tpl.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-white">{tpl.name}</h4>
                    <p className="text-[11px] text-slate-400 truncate">{tpl.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form input */}
          <div className="space-y-3 pt-2 border-t border-[#1e293b]">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Tiêu đề chính</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Mô tả phụ</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none focus:border-amber-500"
              />
            </div>

            {selectedTemplate.theme === 'real_estate' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Giá bán</label>
                  <input
                    type="text"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none"
                    placeholder="VD: Từ 3.5 Tỷ"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 font-medium">Diện tích / Quy mô</label>
                  <input
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none"
                    placeholder="VD: 50 ha"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddCallout}
            className="w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-lg shadow-amber-900/40 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Plus size={16} />
            Đặt Callout tại vị trí tâm bản đồ
          </button>
        </div>
      </div>
    </div>
  );
};
