import React, { useState, useRef, useEffect } from 'react';
import {
  Layers, MousePointer2, Square, Wand2, Minus, Navigation, Upload,
  BarChart2, Mic, LayoutTemplate, MoveUpRight, Type, Sparkles,
  MessageSquare, Boxes, Image, Music, Package, Wrench, Eye, EyeOff, Lock, Trash2,
  Search, Check, ChevronRight, X
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import type { Tool, AreaDrawingMode } from '../../types/project.types';

import { AutoBoundaryModal } from '../Modals/AutoBoundaryModal';
import { AutoRoutingModal } from '../Modals/AutoRoutingModal';
import { TextEffectsModal } from '../Modals/TextEffectsModal';
import { CalloutModal } from '../Modals/CalloutModal';
import { WidgetsModal } from '../Modals/WidgetsModal';
import { ObjectsAndFlagsModal } from '../Modals/ObjectsAndFlagsModal';
import { AudioModal } from '../Modals/AudioModal';
import { TemplatesModal } from '../Modals/TemplatesModal';
import { ShortcutsModal } from '../Modals/ShortcutsModal';
import { TTSModal } from '../Modals/TTSModal';
import { ChartModal } from '../Modals/ChartModal';

interface ToolItem {
  id: Tool;
  label: string;
  icon: React.ReactNode;
  subLabel?: string;
}

const toolRows: ToolItem[][] = [
  [
    { id: 'select', label: 'Chọn', icon: <MousePointer2 size={20} /> },
    { id: 'area', label: 'Khoanh vùng', icon: <Square size={20} /> },
    { id: 'area-auto', label: 'Vùng tự động', icon: <Wand2 size={20} /> },
  ],
  [
    { id: 'line', label: 'Đường', icon: <Minus size={20} /> },
    { id: 'route', label: 'Chọn đường', icon: <Navigation size={20} /> },
    { id: 'import', label: 'Thêm File', icon: <Upload size={20} />, subLabel: 'KML / GeoJSON' },
  ],
  [
    { id: 'chart', label: 'Biểu đồ', icon: <BarChart2 size={20} /> },
    { id: 'tts', label: 'Đọc chữ', icon: <Mic size={20} /> },
    { id: 'templates', label: 'Templates', icon: <LayoutTemplate size={20} /> },
  ],
  [
    { id: 'arrow', label: 'Mũi tên', icon: <MoveUpRight size={20} /> },
    { id: 'text', label: 'Chữ', icon: <Type size={20} /> },
    { id: 'text-effect', label: 'Hiệu ứng chữ', icon: <Sparkles size={20} /> },
  ],
  [
    { id: 'callout', label: 'Call out', icon: <MessageSquare size={20} /> },
    { id: 'widget', label: 'Tiện ích', icon: <Boxes size={20} /> },
    { id: 'media', label: 'Media', icon: <Image size={20} /> },
  ],
  [
    { id: 'audio', label: 'Âm thanh', icon: <Music size={20} /> },
    { id: 'object', label: 'Đối tượng', icon: <Package size={20} /> },
  ],
];

// Area Drawing Sub-tools with crisp custom SVGs matching screenshot
const AREA_SUB_TOOLS: { id: AreaDrawingMode; label: string; icon: React.ReactNode }[] = [
  {
    id: 'polygon',
    label: 'Đa giác',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 22 8.5 18 21 6 21 2 8.5 12 2" />
      </svg>
    ),
  },
  {
    id: 'rectangle',
    label: 'Chữ nhật',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
      </svg>
    ),
  },
  {
    id: 'square',
    label: 'Vuông',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
  },
  {
    id: 'circle',
    label: 'Tròn',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    id: 'freehand',
    label: 'Vẽ tay',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15c2-4 5-6 8-3s6 4 8-1" />
        <circle cx="4" cy="15" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    id: 'pen',
    label: 'Pen tool',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <circle cx="12" cy="12" r="1.5" />
      </svg>
    ),
  },
];

export const Sidebar: React.FC = () => {
  const {
    activeTool, setActiveTool,
    areaDrawingMode, setAreaDrawingMode,
    layers, selectLayer, selectedLayerId, updateLayer, deleteLayer,
    addLayer, playhead, duration, currentCamera
  } = useProjectStore();

  const [modalType, setModalType] = useState<string | null>(null);
  const [showAreaPopover, setShowAreaPopover] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleToolClick = (tool: Tool) => {
    setActiveTool(tool);

    if (tool === 'area') {
      setShowAreaPopover(true);
    } else {
      setShowAreaPopover(false);
    }

    if (tool === 'area-auto') setModalType('boundary');
    else if (tool === 'route') setModalType('routing');
    else if (tool === 'chart') setModalType('chart');
    else if (tool === 'tts') setModalType('tts');
    else if (tool === 'text' || tool === 'text-effect') setModalType('text');
    else if (tool === 'callout') setModalType('callout');
    else if (tool === 'widget') setModalType('widget');
    else if (tool === 'object') setModalType('object');
    else if (tool === 'audio') setModalType('audio');
    else if (tool === 'templates') setModalType('templates');
    else if (tool === 'import') fileInputRef.current?.click();
    else if (tool === 'arrow') {
      addLayer({
        id: `arrow-layer-${Date.now()}`,
        type: 'arrow',
        name: 'Mũi tên chỉ hướng',
        color: '#f59e0b',
        startTime: playhead,
        endTime: Math.min(playhead + 3.5, duration),
        visible: true,
        locked: false,
        selected: true,
        arrowData: {
          from: [currentCamera.center[0] - 0.05, currentCamera.center[1] - 0.05],
          to: currentCamera.center,
          color: '#f59e0b',
          width: 3.5,
          headSize: 18,
          curvature: 0.2,
          animated: true,
        },
      });
    }
  };

  const handleImportGeoJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);
        addLayer({
          id: `import-${Date.now()}`,
          type: 'area',
          name: `File: ${file.name}`,
          color: '#3b82f6',
          startTime: playhead,
          endTime: Math.min(playhead + 4.0, duration),
          visible: true,
          locked: false,
          selected: true,
          areaData: {
            geojson: parsed,
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: '#3b82f6',
            fillColor: '#3b82f633',
            fillOpacity: 0.3,
            appearEffect: 'draw',
            appearDuration: 1.2,
            exitEffect: 'fade-out',
            exitDuration: 0.8,
            is3D: true,
            extrudeHeight: 600,
          },
        });
      } catch (err) {
        alert('File không đúng định dạng GeoJSON hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <aside className="flex flex-col bg-[#0f172a] border-r border-[#1e293b] w-[260px] flex-shrink-0 select-none overflow-y-auto custom-scrollbar relative">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-12 border-b border-[#1e293b] flex-shrink-0 bg-[#0a1628]/60">
          <div className="flex items-center gap-2">
            <Wrench size={15} className="text-blue-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Bộ công cụ
            </span>
          </div>
          <button
            onClick={() => setShowShortcuts(true)}
            className="text-[10px] text-slate-400 hover:text-white bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700 hover:border-slate-500 transition-all"
            title="Xem danh sách phím tắt"
          >
            Phím tắt
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImportGeoJSON}
          accept=".geojson,.json,.kml"
          className="hidden"
        />

        <div className="flex-1 p-3 space-y-3">
          {/* Main Tools Grid */}
          {toolRows.map((row, rowIdx) => (
            <div key={rowIdx} className="relative">
              <div className="grid grid-cols-3 gap-2">
                {row.map((tool) => {
                  const isActive = activeTool === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool.id)}
                      className={`
                        relative flex flex-col items-center justify-center gap-1.5
                        rounded-xl py-3 px-1.5 transition-all duration-150 group min-h-[68px]
                        ${isActive
                          ? 'bg-blue-600/20 border-2 border-blue-500 text-blue-300 shadow-md shadow-blue-900/30'
                          : 'text-slate-400 hover:text-white hover:bg-[#1e293b] border border-[#1e293b]/80 hover:border-slate-600 shadow-sm'
                        }
                      `}
                      title={tool.label}
                    >
                      <span className={`transition-transform group-hover:scale-110 ${
                        isActive ? 'text-blue-400' : 'text-slate-300 group-hover:text-white'
                      }`}>
                        {tool.icon}
                      </span>

                      <div className="flex flex-col items-center">
                        <span className="text-[11px] leading-tight font-medium text-center">
                          {tool.label}
                        </span>
                        {tool.subLabel && (
                          <span className="text-[8px] text-slate-500 mt-0.5 leading-none">{tool.subLabel}</span>
                        )}
                      </div>

                      {isActive && (
                        <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r" />
                      )}
                    </button>
                  );
                })}
              </div>

              {rowIdx < toolRows.length - 1 && (
                <div className="mt-3 border-b border-[#1e293b]/70" />
              )}
            </div>
          ))}
        </div>

        {/* Shortcuts button at bottom */}
        <div className="border-t border-[#1e293b] p-2.5 bg-[#0a1628]/40">
          <button
            onClick={() => setShowShortcuts(true)}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-[#1e293b] transition-all py-2 rounded-lg border border-transparent hover:border-slate-700"
          >
            <Layers size={15} />
            <span className="text-xs font-medium">Bảng phím tắt & Hướng dẫn</span>
          </button>
        </div>
      </aside>

      {/* ── Floating Popover: "Kiểu khoanh vùng" (Matches user screenshot 100%) ── */}
      {showAreaPopover && activeTool === 'area' && (
        <div
          ref={popoverRef}
          className="fixed left-[272px] top-[74px] z-50 bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl p-4 w-[360px] animate-slideUp select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="font-bold text-white text-sm">Kiểu khoanh vùng</h3>
            <button
              onClick={() => setShowAreaPopover(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Row 1: Đa giác | Chữ nhật | Vuông | Tròn */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {AREA_SUB_TOOLS.slice(0, 4).map((sub) => {
              const isSelected = areaDrawingMode === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setAreaDrawingMode(sub.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all min-h-[66px] ${
                    isSelected
                      ? 'bg-blue-600/25 border-blue-500 text-blue-300 shadow-md shadow-blue-900/40'
                      : 'bg-[#141e38]/70 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-[#1a294d]'
                  }`}
                  title={sub.label}
                >
                  <span className={isSelected ? 'text-blue-400 scale-105' : 'text-slate-300'}>
                    {sub.icon}
                  </span>
                  <span className="text-[11px] font-medium mt-1.5 leading-none text-center">
                    {sub.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Row 2: Vẽ tay | Pen tool */}
          <div className="grid grid-cols-4 gap-2 mb-3.5">
            {AREA_SUB_TOOLS.slice(4).map((sub) => {
              const isSelected = areaDrawingMode === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setAreaDrawingMode(sub.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all min-h-[66px] ${
                    isSelected
                      ? 'bg-blue-600/25 border-blue-500 text-blue-300 shadow-md shadow-blue-900/40'
                      : 'bg-[#141e38]/70 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-[#1a294d]'
                  }`}
                  title={sub.label}
                >
                  <span className={isSelected ? 'text-blue-400 scale-105' : 'text-slate-300'}>
                    {sub.icon}
                  </span>
                  <span className="text-[11px] font-medium mt-1.5 leading-none text-center">
                    {sub.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Hint Text with highlights matching screenshot */}
          <div
            onClick={() => {
              setShowAreaPopover(false);
              setModalType('boundary');
            }}
            className="pt-2 border-t border-[#1e293b]/70 cursor-pointer group"
          >
            <p className="text-[11px] text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
              Muốn lấy sẵn ranh giới <span className="font-bold text-slate-200">xã / phường / tỉnh</span> mà không phải vẽ tay? Dùng công cụ <span className="font-bold text-blue-400 group-hover:underline">Khoanh vùng tự động</span> ngay bên dưới — gõ tên là tự khoanh.
            </p>
          </div>
        </div>
      )}

      {/* Interactive Modals */}
      {modalType === 'boundary' && <AutoBoundaryModal onClose={() => setModalType(null)} />}
      {modalType === 'routing' && <AutoRoutingModal onClose={() => setModalType(null)} />}
      {modalType === 'chart' && <ChartModal onClose={() => setModalType(null)} />}
      {modalType === 'tts' && <TTSModal onClose={() => setModalType(null)} />}
      {modalType === 'text' && <TextEffectsModal onClose={() => setModalType(null)} />}
      {modalType === 'callout' && <CalloutModal onClose={() => setModalType(null)} />}
      {modalType === 'widget' && <WidgetsModal onClose={() => setModalType(null)} />}
      {modalType === 'object' && <ObjectsAndFlagsModal onClose={() => setModalType(null)} />}
      {modalType === 'audio' && <AudioModal onClose={() => setModalType(null)} />}
      {modalType === 'templates' && <TemplatesModal onClose={() => setModalType(null)} />}
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </>
  );
};
