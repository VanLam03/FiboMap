import React, { useState, useRef } from 'react';
import {
  Map, Monitor, Smartphone, Square, Download, Save, Cloud,
  User, UploadCloud, FileDown, Check
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import type { AspectRatio } from '../../types/project.types';
import { ExportModal } from '../ExportModal/ExportModal';
import { AuthModal } from '../Modals/AuthModal';

const aspectRatios: { id: AspectRatio; label: string; icon: React.ReactNode; dims: string }[] = [
  { id: '16:9', label: 'Ngang', icon: <Monitor size={13} />, dims: '1920×1080' },
  { id: '9:16', label: 'Dọc', icon: <Smartphone size={13} />, dims: '1080×1920' },
  { id: '1:1', label: 'Vuông', icon: <Square size={13} />, dims: '1080×1080' },
];

export const Topbar: React.FC = () => {
  const {
    aspectRatio, setAspectRatio, activeView, setActiveView,
    name, setName, exportProjectJSON, importProjectJSON
  } = useProjectStore();

  const [showExport, setShowExport] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNameBlur = () => {
    setName(nameInput);
    setEditingName(false);
  };

  const handleSaveLocal = () => {
    const jsonStr = exportProjectJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_')}.fibomap`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        importProjectJSON(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <header className="flex items-center h-12 px-4 bg-[#0a1628] border-b border-[#1e293b] flex-shrink-0 gap-3 z-50 select-none">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-900/50">
            <Map size={17} className="text-white" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white text-base tracking-tight">FiboMap</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-md shadow-sm">
              PRO
            </span>
          </div>
        </div>

        <div className="w-px h-6 bg-[#1e293b]" />

        {/* Project Name */}
        {editingName ? (
          <input
            className="bg-[#1e293b] text-white text-xs px-2.5 py-1 rounded-lg border border-blue-500 outline-none w-44"
            value={nameInput}
            autoFocus
            onChange={(e) => setNameInput(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
          />
        ) : (
          <button
            className="text-slate-300 text-xs font-medium hover:text-white transition-colors truncate max-w-[160px] hover:bg-[#1e293b] px-2 py-1 rounded-lg text-left"
            onClick={() => { setEditingName(true); setNameInput(name); }}
            title="Click để đổi tên dự án"
          >
            {name}
          </button>
        )}

        {/* View mode toggle: Map vs Media */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex bg-[#1e293b] rounded-xl p-1 gap-1 border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setActiveView('map')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'map'
                  ? 'bg-[#0f172a] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Map size={14} className={activeView === 'map' ? 'text-blue-400' : ''} />
              Bản đồ
            </button>
            <button
              onClick={() => setActiveView('media')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'media'
                  ? 'bg-[#0f172a] text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Monitor size={14} className={activeView === 'media' ? 'text-blue-400' : ''} />
              Nền Media
            </button>
          </div>

          <div className="w-px h-6 bg-[#1e293b] mx-4" />

          {/* Aspect Ratios */}
          <div className="flex bg-[#1e293b] rounded-xl p-1 gap-1 border border-slate-700/60 shadow-inner">
            {aspectRatios.map((ar) => (
              <button
                key={ar.id}
                onClick={() => setAspectRatio(ar.id)}
                title={ar.dims}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  aspectRatio === ar.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {ar.icon}
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".fibomap,.json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[#1e293b]/80 hover:bg-[#1e293b] border border-slate-700/60 transition-all shadow-sm"
            title="Mở file dự án (.fibomap)"
          >
            <UploadCloud size={14} />
            Mở file
          </button>

          <button
            onClick={handleSaveLocal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[#1e293b]/80 hover:bg-[#1e293b] border border-slate-700/60 transition-all shadow-sm"
            title="Lưu file dự án về máy tính"
          >
            {savedSuccess ? <Check size={14} className="text-emerald-400" /> : <FileDown size={14} />}
            <span>{savedSuccess ? 'Đã lưu!' : 'Lưu'}</span>
          </button>

          <button
            onClick={() => setShowAuth(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-[#1e293b]/80 hover:bg-[#1e293b] border border-slate-700/60 transition-all shadow-sm"
            title="Đồng bộ đám mây (Cloud)"
          >
            <Cloud size={14} />
            Cloud
          </button>

          <div className="w-px h-6 bg-[#1e293b] mx-1" />

          {/* Export Video Button */}
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:to-orange-300 shadow-lg shadow-orange-900/40 transition-all duration-150 active:scale-95"
          >
            <Download size={15} />
            Xuất video
          </button>

          <div className="w-px h-6 bg-[#1e293b] mx-1" />

          <button
            onClick={() => setShowAuth(true)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center hover:opacity-80 transition-opacity border border-white/20 shadow"
            title="Tài khoản người dùng"
          >
            <User size={15} className="text-white" />
          </button>
        </div>
      </header>

      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
};
