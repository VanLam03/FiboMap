import React from 'react';
import { Keyboard, X } from 'lucide-react';

const SHORTCUTS = [
  { key: 'Space', desc: 'Phát / Tạm dừng phát video trên Timeline' },
  { key: 'Shift + Kéo chuột', desc: 'Xoay ngang và nghiêng bản đồ 3D (Bearing & Pitch)' },
  { key: 'Shift + Mũi tên', desc: 'Xoay bản đồ theo từng bước góc độ' },
  { key: 'Ctrl + B', desc: 'Cắt (Split) lớp được chọn tại vị trí con trỏ thời gian' },
  { key: 'Ctrl + Z', desc: 'Hoàn tác thao tác trước (Undo)' },
  { key: 'Ctrl + Y', desc: 'Làm lại thao tác vừa hoàn tác (Redo)' },
  { key: 'Mũi tên Trái / Phải', desc: 'Di chuyển 1 khung hình (Frame by Frame)' },
  { key: 'Alt + Click', desc: 'Lật qua từng lớp đối tượng bị che khuất' },
  { key: 'Delete / Backspace', desc: 'Xoá lớp đối tượng đang chọn' },
];

export const ShortcutsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-[480px] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Keyboard size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Phím tắt thao tác nhanh (Shortcuts)</h2>
              <p className="text-slate-400 text-xs">Tăng tốc độ dựng video bản đồ chuyên nghiệp</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#1e293b]/60 border border-slate-700/60"
            >
              <span className="text-xs text-slate-300">{s.desc}</span>
              <kbd className="px-2 py-1 rounded-lg bg-slate-800 text-blue-300 font-mono text-xs border border-slate-700 shadow-sm flex-shrink-0">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
