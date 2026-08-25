import React from 'react';
import { LayoutTemplate, Crown, Building2, History, Compass, Check, X, ArrowRight } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

const TEMPLATES = [
  {
    id: 'bds',
    name: 'Dự Án Bất Động Sản Cao Cấp',
    subtitle: 'Vinhomes Grand Park · TP. Thủ Đức',
    desc: 'Bao gồm góc quay camera 3D từ trên cao sà xuống, callout thông tin 271 ha, đường vành đai 3 phát sáng.',
    icon: <Building2 size={24} className="text-amber-400" />,
    badge: 'HOT BẤT ĐỘNG SẢN',
    color: 'from-amber-500/20 to-orange-500/20',
    borderColor: 'border-amber-500/50',
  },
  {
    id: 'history',
    name: 'Chiến Dịch Lịch Sử & Quân Sự',
    subtitle: 'Chiến dịch Điện Biên Phủ 1954',
    desc: 'Bản đồ phong cách Cổ điển (Vintage), camera xoay quanh thung lũng Mường Thanh, chữ vàng điện ảnh.',
    icon: <History size={24} className="text-red-400" />,
    badge: 'LỊCH SỬ VIỆT NAM',
    color: 'from-red-500/20 to-rose-500/20',
    borderColor: 'border-red-500/50',
  },
  {
    id: 'travel',
    name: 'Hành Trình Du Lịch Xuyên Việt',
    subtitle: 'Hà Nội → Đà Nẵng → Sài Gòn',
    desc: 'Tuyến đường dài nối 3 miền, ô tô và máy bay chuyển động theo tuyến, các icon tiện ích du lịch.',
    icon: <Compass size={24} className="text-blue-400" />,
    badge: 'DU LỊCH & VLOG',
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/50',
  },
];

export const TemplatesModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { loadTemplate } = useProjectStore();

  const handleApplyTemplate = (id: string) => {
    loadTemplate(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-[580px] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black shadow-md">
              <Crown size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-semibold text-white text-sm">Kho Mẫu Dự Án Dựng Sẵn (Templates)</h2>
                <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                  PRO MAX
                </span>
              </div>
              <p className="text-slate-400 text-xs">Load trọn bộ Keyframe Camera, Callout, Tuyến đường & Chữ chỉ với 1 Click</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className={`p-4 rounded-2xl border ${tpl.borderColor} bg-gradient-to-r ${tpl.color} hover:scale-[1.01] transition-all flex flex-col gap-2.5`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-900/80 border border-slate-700 flex items-center justify-center shadow">
                    {tpl.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{tpl.name}</h3>
                    <p className="text-xs text-amber-300/90 font-medium">{tpl.subtitle}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-300 bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
                  {tpl.badge}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/5">
                {tpl.desc}
              </p>

              <button
                type="button"
                onClick={() => handleApplyTemplate(tpl.id)}
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                <span>Tải Mẫu Này Vào Dự Án</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
