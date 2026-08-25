import React, { useRef, useCallback, useEffect, useState } from 'react';
import {
  Menu, Undo2, Redo2, Scissors, Trash2, Maximize2, Minimize2,
  SkipBack, Play, Pause, SkipForward, Eye, EyeOff, MoreHorizontal,
  Plus, Minus, RefreshCw, Magnet, Check, Sparkles, Layers,
  Lock
} from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';
import type { TimelineLayer } from '../../types/project.types';

const RULER_HEIGHT = 26;
const TRACK_HEIGHT = 42;
const LABEL_WIDTH = 160;

function formatTime(t: number) {
  const s = Math.floor(t);
  const ms = Math.round((t - s) * 10);
  return `${s}.${ms}s`;
}

function formatTimeMMSS(t: number) {
  const s = Math.floor(t);
  const f = Math.round((t - s) * 30);
  return `${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
}

const LAYER_TYPE_COLORS: Record<string, string> = {
  area: '#f59e0b',
  text: '#3b82f6',
  line: '#10b981',
  route: '#06b6d4',
  arrow: '#f97316',
  callout: '#ec4899',
  widget: '#8b5cf6',
  object: '#0ea5e9',
  counter: '#84cc16',
  audio: '#ef4444',
};

const LAYER_TYPE_EMOJI: Record<string, string> = {
  area: '🗺',
  text: '📝',
  line: '✏️',
  route: '🛣',
  arrow: '➡️',
  callout: '💬',
  widget: '📡',
  object: '📦',
  counter: '🔢',
  audio: '🎵',
};

// ─── Playhead Component ────────────────────────────────────────────────────────
const Playhead: React.FC<{
  playhead: number;
  zoom: number;
  trackCount: number;
}> = ({ playhead, zoom, trackCount }) => {
  const x = playhead * zoom + LABEL_WIDTH;
  return (
    <div
      className="absolute top-0 pointer-events-none z-30 flex flex-col items-center"
      style={{ left: x, height: RULER_HEIGHT + Math.max(1, trackCount + 1) * TRACK_HEIGHT + 80 }}
    >
      {/* Top cyan marker */}
      <div className="w-3.5 h-3.5 -translate-x-1/2 flex items-center justify-center bg-cyan-400 rounded-sm shadow-md shadow-cyan-500/50">
        <div className="w-1.5 h-1.5 bg-[#0a1128] rounded-full" />
      </div>
      {/* Cyan vertical indicator line */}
      <div className="w-[1.5px] bg-cyan-400/90 h-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
    </div>
  );
};

// ─── Ruler Component ──────────────────────────────────────────────────────────
const Ruler: React.FC<{
  duration: number;
  zoom: number;
  isSnapping: boolean;
  onSeek: (t: number) => void;
}> = ({ duration, zoom, isSnapping, onSeek }) => {
  const ticks = [];
  const step = zoom >= 70 ? 1 : zoom >= 35 ? 2 : 5;
  for (let t = 0; t <= Math.ceil(duration) + 1; t += step) {
    ticks.push(t);
  }

  return (
    <div
      className="relative bg-[#0b1329] border-b border-[#182442] flex-shrink-0 cursor-crosshair select-none"
      style={{ height: RULER_HEIGHT, paddingLeft: LABEL_WIDTH }}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        let t = (e.clientX - rect.left - LABEL_WIDTH) / zoom;
        if (isSnapping) {
          t = Math.round(t * 2) / 2; // snap to 0.5s
        }
        if (t >= 0) onSeek(Math.min(t, duration));
      }}
    >
      <div className="relative h-full">
        {ticks.map((t) => (
          <div
            key={t}
            className="absolute top-0 flex flex-col items-start"
            style={{ left: t * zoom }}
          >
            <div className="w-px h-2.5 bg-slate-600/80" />
            <span className="text-[10px] text-slate-400 font-mono pl-1 select-none">{t}s</span>
          </div>
        ))}
        {/* Subtle sub-ticks */}
        {zoom >= 50 && Array.from({ length: Math.ceil(duration * 2) + 2 }, (_, i) => i * 0.5).map((t) => (
          !Number.isInteger(t) && (
            <div
              key={`sub-${t}`}
              className="absolute bottom-0"
              style={{ left: t * zoom }}
            >
              <div className="w-px h-1.5 bg-slate-700/60" />
            </div>
          )
        ))}
      </div>
    </div>
  );
};

// ─── Camera Track Component ───────────────────────────────────────────────────
const CameraTrack: React.FC<{
  keyframes: { id: string; time: number }[];
  duration: number;
  zoom: number;
  onSeek: (t: number) => void;
}> = ({ keyframes, duration, zoom, onSeek }) => {
  const { deleteCameraKeyframe } = useProjectStore();

  return (
    <div className="flex items-stretch flex-shrink-0" style={{ height: TRACK_HEIGHT }}>
      {/* Label */}
      <div
        className="flex items-center gap-2.5 flex-shrink-0 h-full px-3.5 bg-[#0a1126] border-b border-r border-[#182442] select-none"
        style={{ width: LABEL_WIDTH }}
      >
        <div className="text-[#c084fc] flex items-center justify-center">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
            <circle cx="12" cy="13" r="3"/>
          </svg>
        </div>
        <span className="text-xs text-[#c084fc] font-medium tracking-wide">Camera</span>
      </div>

      {/* Track area */}
      <div
        className="relative flex-1 h-full bg-[#080e22] border-b border-[#182442] overflow-hidden cursor-crosshair"
        style={{ minWidth: duration * zoom + 40 }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const t = (e.clientX - rect.left) / zoom;
          onSeek(Math.max(0, Math.min(t, duration)));
        }}
      >
        {/* Subtle grid lines for each second */}
        {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => i).map((s) => (
          <div
            key={`grid-${s}`}
            className="absolute top-0 bottom-0 w-px bg-[#141e38]/40 pointer-events-none"
            style={{ left: s * zoom }}
          />
        ))}

        {/* Camera track subtle guide line */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-purple-500/10" />

        {/* Keyframe diamonds */}
        {keyframes.map((kf) => (
          <div
            key={kf.id}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group z-10"
            style={{ left: kf.time * zoom }}
            onClick={(e) => {
              e.stopPropagation();
              onSeek(kf.time);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (window.confirm(`Xoá keyframe camera tại mốc ${formatTime(kf.time)}?`)) {
                deleteCameraKeyframe(kf.id);
              }
            }}
          >
            <div
              className="w-3.5 h-3.5 rotate-45 bg-purple-500 border-2 border-purple-200/90 cursor-pointer hover:bg-purple-400 hover:scale-125 transition-all shadow-lg shadow-purple-500/50"
              title={`Keyframe: ${formatTime(kf.time)} (Click để đến mốc · Chuột phải để xoá)`}
            />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] text-purple-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity font-mono bg-black/80 px-1 rounded pointer-events-none">
              {formatTime(kf.time)}
            </div>
          </div>
        ))}

        {/* Connection line between keyframes */}
        {keyframes.length > 1 && [...keyframes].sort((a, b) => a.time - b.time).map((kf, i, arr) => {
          if (i === arr.length - 1) return null;
          const x1 = kf.time * zoom;
          const x2 = arr[i + 1].time * zoom;
          return (
            <div
              key={`line-${kf.id}`}
              className="absolute top-1/2 h-[2px] bg-purple-500/30"
              style={{ left: x1, width: x2 - x1 }}
            />
          );
        })}
      </div>
    </div>
  );
};

// ─── Layer Track Component ────────────────────────────────────────────────────
const LayerTrack: React.FC<{
  layer: TimelineLayer;
  duration: number;
  zoom: number;
  isSnapping: boolean;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onSeek: (t: number) => void;
}> = ({ layer, duration, zoom, isSnapping, isSelected, onSelect, onSeek }) => {
  const { updateLayer, deleteLayer, moveSelectedLayers, layers } = useProjectStore();
  const blockRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ type: 'move' | 'left' | 'right'; startX: number; startStart: number; startEnd: number; isMulti: boolean } | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const color = LAYER_TYPE_COLORS[layer.type] || layer.color;
  const emoji = LAYER_TYPE_EMOJI[layer.type] || '';

  const snapVal = (val: number) => {
    if (!isSnapping) return val;
    return Math.round(val * 2) / 2; // snap to 0.5s step
  };

  const startDrag = (type: 'move' | 'left' | 'right', e: React.MouseEvent) => {
    if (layer.locked) return;
    e.stopPropagation();

    const selectedCount = layers.filter(l => l.selected).length;
    const isMulti = type === 'move' && selectedCount > 1 && layer.selected;

    dragRef.current = {
      type,
      startX: e.clientX,
      startStart: layer.startTime,
      startEnd: layer.endTime,
      isMulti,
    };

    let lastMovedDx = 0;

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const totalDx = (ev.clientX - dragRef.current.startX) / zoom;
      const { type, startStart, startEnd, isMulti } = dragRef.current;

      if (isMulti) {
        // Multi-block movement
        const delta = totalDx - lastMovedDx;
        lastMovedDx = totalDx;
        moveSelectedLayers(delta);
      } else if (type === 'move') {
        const len = startEnd - startStart;
        let ns = snapVal(Math.max(0, startStart + totalDx));
        let ne = ns + len;
        if (ne > duration) { ne = duration; ns = Math.max(0, ne - len); }
        updateLayer(layer.id, { startTime: ns, endTime: ne });
      } else if (type === 'left') {
        const ns = snapVal(Math.max(0, Math.min(startStart + totalDx, startEnd - 0.2)));
        updateLayer(layer.id, { startTime: ns });
      } else {
        const ne = snapVal(Math.min(duration, Math.max(startEnd + totalDx, startStart + 0.2)));
        updateLayer(layer.id, { endTime: ne });
      }
    };

    const onMouseUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const blockLeft = layer.startTime * zoom;
  const blockWidth = (layer.endTime - layer.startTime) * zoom;

  return (
    <div
      className={`flex items-stretch flex-shrink-0 cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-950/25' : 'hover:bg-[#0f1d3d]/50'
      }`}
      style={{ height: TRACK_HEIGHT }}
      onClick={onSelect}
    >
      {/* Label */}
      <div
        className={`flex items-center gap-2 flex-shrink-0 h-full px-3 bg-[#0a1126] border-b border-r border-[#182442] ${
          isSelected ? 'bg-blue-900/30 font-semibold' : ''
        }`}
        style={{ width: LABEL_WIDTH }}
      >
        <div
          className="w-2.5 h-2.5 rounded-sm flex-shrink-0 shadow-sm"
          style={{ background: color }}
        />
        <span className="text-[11px] mr-0.5">{emoji}</span>
        <span className="text-xs text-slate-300 truncate flex-1 font-medium">{layer.name}</span>
        <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
          <button
            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
            onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
            title={layer.visible ? 'Ẩn lớp' : 'Hiện lớp'}
          >
            {layer.visible ? <Eye size={11} /> : <EyeOff size={11} className="text-slate-600" />}
          </button>
          <button
            className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
            onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }); }}
            title={layer.locked ? 'Mở khoá lớp' : 'Khoá lớp'}
          >
            <Lock size={11} className={layer.locked ? 'text-amber-400' : ''} />
          </button>
          <div className="relative">
            <button
              className="w-5 h-5 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            >
              <MoreHorizontal size={11} />
            </button>
            {showMenu && (
              <div
                className="absolute right-0 top-6 z-50 bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl py-1 min-w-[120px]"
                onMouseLeave={() => setShowMenu(false)}
              >
                <button
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-300 hover:bg-[#1e293b] hover:text-white transition-colors"
                  onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); setShowMenu(false); }}
                >
                  <Trash2 size={11} className="text-red-400" /> Xoá lớp
                </button>
                <button
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-slate-300 hover:bg-[#1e293b] hover:text-white transition-colors"
                  onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }); setShowMenu(false); }}
                >
                  <Lock size={11} className="text-amber-400" /> {layer.locked ? 'Mở khoá' : 'Khoá lớp'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Track area */}
      <div
        className="relative h-full border-b border-[#182442] overflow-hidden flex-1 cursor-crosshair bg-[#080e22]"
        style={{ minWidth: duration * zoom + 40 }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          let t = (e.clientX - rect.left) / zoom;
          if (isSnapping) t = Math.round(t * 2) / 2;
          onSeek(Math.max(0, Math.min(t, duration)));
        }}
      >
        {/* Subtle grid lines for each second */}
        {Array.from({ length: Math.ceil(duration) + 1 }, (_, i) => i).map((s) => (
          <div
            key={`grid-layer-${s}`}
            className="absolute top-0 bottom-0 w-px bg-[#141e38]/40 pointer-events-none"
            style={{ left: s * zoom }}
          />
        ))}

        {/* Layer Block */}
        <div
          ref={blockRef}
          className={`absolute top-1.5 bottom-1.5 rounded-md flex items-center select-none ${
            layer.locked ? 'cursor-not-allowed opacity-60' : 'cursor-grab active:cursor-grabbing'
          } ${
            isSelected
              ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-900/50'
              : 'shadow-sm'
          }`}
          style={{
            left: blockLeft,
            width: Math.max(blockWidth, 4),
            background: `${color}28`,
            borderLeft: `4px solid ${color}`,
            borderTop: `1px solid ${color}60`,
            borderRight: `1px solid ${color}60`,
            borderBottom: `1px solid ${color}60`,
          }}
          onMouseDown={(e) => startDrag('move', e)}
        >
          {/* Left resize handle */}
          <div
            className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 hover:bg-white/20"
            onMouseDown={(e) => { e.stopPropagation(); startDrag('left', e); }}
          />
          {/* Label inside block */}
          {blockWidth > 45 && (
            <span
              className="text-[10px] truncate px-2 pointer-events-none select-none font-semibold text-white drop-shadow"
            >
              {emoji} {layer.name}
            </span>
          )}
          {/* Right resize handle */}
          <div
            className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10 hover:bg-white/20"
            onMouseDown={(e) => { e.stopPropagation(); startDrag('right', e); }}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Main Timeline Component ───────────────────────────────────────────────────
export const Timeline: React.FC = () => {
  const {
    layers, cameraKeyframes, duration, setDuration,
    playhead, setPlayhead, isPlaying, setIsPlaying,
    selectedLayerId, selectLayer, selectAllLayers, selectMultipleLayers, toggleSelectLayer,
    timelineZoom, setTimelineZoom,
    isKeyframeCameraMode, setKeyframeCameraMode,
    undo, redo, deleteLayer, deleteSelectedLayers,
  } = useProjectStore();

  const trackAreaRef = useRef<HTMLDivElement>(null);
  const playbackRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // States for interactive controls
  const [isSnapping, setIsSnapping] = useState(true);
  const [isLooping, setIsLooping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [tempDuration, setTempDuration] = useState(duration.toString());

  // Marquee selection state
  const [marquee, setMarquee] = useState<{ startX: number; startY: number; currentX: number; currentY: number } | null>(null);
  const isMarqueeDragging = useRef(false);

  // Keep tempDuration synced with duration
  useEffect(() => {
    setTempDuration(duration.toString());
  }, [duration]);

  // Playback animation engine
  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now();
      const tick = (now: number) => {
        const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
        lastTimeRef.current = now;
        const currentT = useProjectStore.getState().playhead;
        const nextT = currentT + dt;

        if (nextT >= duration) {
          if (isLooping) {
            setPlayhead(0);
          } else {
            setPlayhead(0);
            setIsPlaying(false);
            return;
          }
        } else {
          setPlayhead(nextT);
        }
        playbackRef.current = requestAnimationFrame(tick);
      };

      playbackRef.current = requestAnimationFrame(tick);
    } else {
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current);
        playbackRef.current = null;
      }
    }
    return () => {
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current);
        playbackRef.current = null;
      }
    };
  }, [isPlaying, duration, setIsPlaying, setPlayhead, isLooping]);

  const handleSeek = useCallback((t: number) => {
    setPlayhead(t);
  }, [setPlayhead]);

  // Split layer action (Cut)
  const handleCut = useCallback(() => {
    const state = useProjectStore.getState();
    let target = state.layers.find(l => l.id === state.selectedLayerId);
    if (!target) {
      target = state.layers.find(l => state.playhead > l.startTime && state.playhead < l.endTime);
    }

    if (target && state.playhead > target.startTime && state.playhead < target.endTime) {
      const newLayer: TimelineLayer = {
        ...target,
        id: `layer-${Date.now()}`,
        name: `${target.name} (phần 2)`,
        startTime: state.playhead,
      };
      state.updateLayer(target.id, { endTime: state.playhead });
      state.addLayer(newLayer);
      state.selectLayer(newLayer.id);
    }
  }, []);

  // Delete action (Handles single, multi-selected, or camera keyframe)
  const handleDelete = useCallback(() => {
    const state = useProjectStore.getState();
    const selectedCount = state.layers.filter(l => l.selected || l.id === state.selectedLayerId).length;
    if (selectedCount > 1) {
      state.deleteSelectedLayers();
    } else if (state.selectedLayerId) {
      state.deleteLayer(state.selectedLayerId);
    } else {
      const kf = state.cameraKeyframes.find(k => Math.abs(k.time - state.playhead) < 0.1);
      if (kf) {
        state.deleteCameraKeyframe(kf.id);
      }
    }
  }, []);

  // Keyboard shortcuts (including Ctrl+A and Delete)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Ctrl+A / Cmd+A -> Select all layers
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') {
        e.preventDefault();
        selectAllLayers();
      }

      if (e.code === 'Space') { e.preventDefault(); setIsPlaying(!isPlaying); }
      if (e.code === 'ArrowLeft') setPlayhead(Math.max(0, playhead - (e.shiftKey ? 1 : 1 / 30)));
      if (e.code === 'ArrowRight') setPlayhead(Math.min(duration, playhead + (e.shiftKey ? 1 : 1 / 30)));
      if (e.code === 'Home') setPlayhead(0);
      if (e.code === 'End') setPlayhead(duration);
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyB') { e.preventDefault(); handleCut(); }
      if (e.code === 'Delete' || e.code === 'Backspace') { handleDelete(); }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPlaying, playhead, duration, handleCut, handleDelete, undo, redo, selectAllLayers, setIsPlaying, setPlayhead]);

  // Handle Layer Selection Click
  const handleLayerClick = (id: string, e: React.MouseEvent) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      toggleSelectLayer(id);
    } else {
      selectLayer(id);
    }
  };

  // Marquee rectangle drag selection on track container
  const handleMouseDownTracks = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger marquee if clicking on background of track container
    if ((e.target as HTMLElement).closest('.cursor-grab')) return;

    const rect = trackAreaRef.current?.getBoundingClientRect();
    if (!rect) return;

    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    isMarqueeDragging.current = true;
    setMarquee({ startX, startY, currentX: startX, currentY: startY });

    const onMouseMove = (ev: MouseEvent) => {
      if (!isMarqueeDragging.current || !rect) return;
      const currentX = ev.clientX - rect.left;
      const currentY = ev.clientY - rect.top;
      setMarquee(prev => prev ? { ...prev, currentX, currentY } : null);

      // Compute time interval from marquee
      const minX = Math.min(startX, currentX) - LABEL_WIDTH;
      const maxX = Math.max(startX, currentX) - LABEL_WIDTH;

      if (maxX > minX && timelineZoom > 0) {
        const minT = Math.max(0, minX / timelineZoom);
        const maxT = Math.max(0, maxX / timelineZoom);

        // Find layers overlapping with [minT, maxT]
        const intersectingIds = layers
          .filter(l => !(l.endTime < minT || l.startTime > maxT))
          .map(l => l.id);

        if (intersectingIds.length > 0) {
          selectMultipleLayers(intersectingIds);
        }
      }
    };

    const onMouseUp = () => {
      isMarqueeDragging.current = false;
      setMarquee(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Progress percentage
  const progress = duration > 0 ? (playhead / duration) * 100 : 0;

  return (
    <div
      className="flex flex-col bg-[#070d1e] border-t border-[#182442] flex-shrink-0 select-none transition-all duration-200"
      style={{ height: isExpanded ? 360 : 230 }}
    >
      {/* ── Top Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center h-11 px-3 bg-[#0d152a] border-b border-[#182442] flex-shrink-0 gap-2 relative">
        {/* Menu & Title */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 mr-2 hover:bg-[#141e38] px-2 py-1 rounded-lg transition-colors"
            title="Tuỳ chọn Timeline & Lớp"
          >
            <Menu size={16} className="text-slate-300" />
            <span className="text-sm font-bold text-white tracking-tight">Timeline & Lớp</span>
          </button>

          {/* Menu Dropdown */}
          {showMenu && (
            <div
              className="absolute left-0 top-9 z-50 bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl py-1.5 min-w-[240px] animate-fadeIn"
              onMouseLeave={() => setShowMenu(false)}
            >
              <button
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-cyan-300 hover:bg-cyan-950/30 transition-colors text-left"
                onClick={() => {
                  selectAllLayers();
                  setShowMenu(false);
                }}
              >
                <Layers size={13} />
                <span>Chọn tất cả lớp (Ctrl + A)</span>
              </button>
              <button
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-slate-300 hover:bg-[#1e293b] hover:text-white transition-colors text-left"
                onClick={() => {
                  setKeyframeCameraMode(true);
                  setShowMenu(false);
                }}
              >
                <span className="text-purple-400">◊</span>
                <span>Bật ghi Keyframe Camera</span>
              </button>
              <button
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-slate-300 hover:bg-[#1e293b] hover:text-white transition-colors text-left"
                onClick={() => {
                  setShowDurationModal(true);
                  setShowMenu(false);
                }}
              >
                <span>⏱</span>
                <span>Cài đặt thời lượng video...</span>
              </button>
              <div className="border-t border-[#1e293b] my-1" />
              <button
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-amber-300 hover:bg-amber-950/30 transition-colors text-left"
                onClick={() => {
                  if (window.confirm('Đặt lại thời lượng về 12.0s?')) {
                    setDuration(12.0);
                  }
                  setShowMenu(false);
                }}
              >
                <RefreshCw size={12} />
                <span>Đặt lại thời lượng (12.0s)</span>
              </button>
              <button
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-xs text-red-400 hover:bg-red-950/30 transition-colors text-left"
                onClick={() => {
                  if (window.confirm('Xoá tất cả các lớp trên timeline?')) {
                    useProjectStore.setState({ layers: [], selectedLayerId: null } as any);
                  }
                  setShowMenu(false);
                }}
              >
                <Trash2 size={12} />
                <span>Xoá tất cả các lớp (Clear All)</span>
              </button>
            </div>
          )}
        </div>

        {/* Undo */}
        <button
          onClick={undo}
          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white bg-[#141e38] hover:bg-[#1c2a4f] border border-[#223159] rounded-lg transition-all shadow-sm active:scale-95"
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo2 size={13} />
        </button>

        {/* Redo */}
        <button
          onClick={redo}
          className="w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white bg-[#141e38] hover:bg-[#1c2a4f] border border-[#223159] rounded-lg transition-all shadow-sm active:scale-95"
          title="Làm lại (Ctrl+Y)"
        >
          <Redo2 size={13} />
        </button>

        {/* Separator */}
        <div className="w-px h-5 bg-[#223159] mx-1" />

        {/* Camera Pill Button */}
        <button
          onClick={() => setKeyframeCameraMode(!isKeyframeCameraMode)}
          className={`flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-medium border transition-all shadow-sm active:scale-95 ${
            isKeyframeCameraMode
              ? 'bg-purple-600/30 text-purple-200 border-purple-500 shadow-purple-900/40'
              : 'bg-[#141e38] text-slate-200 border-[#223159] hover:bg-[#1c2a4f] hover:text-white'
          }`}
          title="Bật/tắt chế độ ghi keyframe camera (+K)"
        >
          <span className="text-purple-400 font-bold text-xs">◊</span>
          <span>Camera</span>
          {isKeyframeCameraMode && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping ml-0.5" />}
        </button>

        {/* Separator */}
        <div className="w-px h-5 bg-[#223159] mx-1" />

        {/* Cut Button */}
        <button
          onClick={handleCut}
          className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-medium text-slate-200 bg-[#141e38] hover:bg-[#1c2a4f] hover:text-white border border-[#223159] transition-all shadow-sm active:scale-95"
          title="Cắt layer tại vị trí playhead (Ctrl+B)"
        >
          <Scissors size={12} className="text-slate-300" />
          <span>Cắt</span>
        </button>

        {/* Delete Button */}
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-2.5 h-7 rounded-lg text-xs font-medium text-slate-200 bg-[#141e38] hover:bg-red-950/60 hover:text-red-300 hover:border-red-500/50 border border-[#223159] transition-all shadow-sm active:scale-95"
          title="Xoá layer hoặc keyframe đã chọn (Delete / Backspace)"
        >
          <Trash2 size={12} className="text-slate-300" />
          <span>Xoá</span>
        </button>

        {/* Separator */}
        <div className="w-px h-5 bg-[#223159] mx-1" />

        {/* Magnet / Snap Button */}
        <button
          onClick={() => setIsSnapping(!isSnapping)}
          className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all shadow-sm active:scale-95 ${
            isSnapping
              ? 'bg-[#141e38] text-cyan-400 border-cyan-500/60 shadow-cyan-950/40'
              : 'bg-[#141e38] text-slate-500 border-[#223159] hover:text-slate-300'
          }`}
          title={isSnapping ? 'Đang bật hít mốc thời gian (Snap 0.5s)' : 'Tắt hít mốc thời gian'}
        >
          <Magnet size={13} />
        </button>

        {/* Separator */}
        <div className="w-px h-5 bg-[#223159] mx-1" />

        {/* Duration Display (Clickable to edit) */}
        <div className="relative">
          <button
            onClick={() => setShowDurationModal(!showDurationModal)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs text-slate-300 hover:bg-[#141e38] hover:text-white transition-colors border border-transparent hover:border-[#223159]"
            title="Nhấp để đổi thời lượng video"
          >
            <span>Thời lượng</span>
            <span className="font-bold text-white font-mono bg-[#141e38] px-1.5 py-0.5 rounded border border-[#223159]">
              {duration.toFixed(1)}s
            </span>
          </button>

          {/* Quick Duration Picker Modal */}
          {showDurationModal && (
            <div
              className="absolute left-0 top-9 z-50 bg-[#0f172a] border border-[#1e293b] rounded-xl shadow-2xl p-3 w-56 animate-fadeIn"
              onMouseLeave={() => setShowDurationModal(false)}
            >
              <p className="text-[11px] font-semibold text-slate-300 mb-2">Đổi thời lượng video</p>
              <div className="flex items-center gap-2 mb-2.5">
                <input
                  type="number"
                  min={1}
                  max={120}
                  step={0.5}
                  value={tempDuration}
                  onChange={(e) => setTempDuration(e.target.value)}
                  className="flex-1 bg-[#1e293b] text-white text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 outline-none focus:border-blue-500 font-mono text-center"
                />
                <button
                  onClick={() => {
                    const val = parseFloat(tempDuration);
                    if (!isNaN(val) && val > 0) {
                      setDuration(val);
                      setShowDurationModal(false);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-2.5 py-1.5 rounded-lg font-medium shadow"
                >
                  Lưu
                </button>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[5, 10, 12, 15, 20, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => {
                      setDuration(sec);
                      setTempDuration(sec.toString());
                      setShowDurationModal(false);
                    }}
                    className={`py-1 rounded text-[10px] font-mono border transition-colors ${
                      duration === sec
                        ? 'bg-blue-600/30 text-blue-300 border-blue-500 font-bold'
                        : 'bg-[#1e293b]/60 text-slate-400 border-slate-700/60 hover:text-white hover:bg-[#1e293b]'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Zoom Slider */}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={() => setTimelineZoom(Math.max(30, timelineZoom - 10))}
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Thu nhỏ timeline"
          >
            <Minus size={12} />
          </button>

          {/* Slider track with blue thumb */}
          <div className="relative w-20 flex items-center">
            <input
              type="range"
              min={30}
              max={150}
              value={timelineZoom}
              onChange={(e) => setTimelineZoom(Number(e.target.value))}
              className="w-full h-1 bg-[#1a264a] rounded-lg appearance-none cursor-pointer accent-blue-400"
            />
          </div>

          <button
            onClick={() => setTimelineZoom(Math.min(150, timelineZoom + 10))}
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Phóng to timeline"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* Maximize / Minimize Timeline Height Toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ml-1 ${
            isExpanded ? 'text-cyan-400 bg-[#141e38]' : 'text-slate-400 hover:text-white hover:bg-[#141e38]'
          }`}
          title={isExpanded ? 'Thu gọn Timeline' : 'Mở rộng Timeline'}
        >
          {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
      </div>

      {/* ── Tracks Area (Ruler + Camera Track + Layer Tracks) ───────────────────── */}
      <div
        className="flex-1 overflow-auto relative bg-[#070d1e]"
        ref={trackAreaRef}
        onMouseDown={handleMouseDownTracks}
      >
        <div style={{ minWidth: LABEL_WIDTH + duration * timelineZoom + 80 }}>
          {/* Ruler Header */}
          <Ruler
            duration={duration}
            zoom={timelineZoom}
            isSnapping={isSnapping}
            onSeek={handleSeek}
          />

          {/* Camera Track (Always on top) */}
          <CameraTrack
            keyframes={cameraKeyframes}
            duration={duration}
            zoom={timelineZoom}
            onSeek={handleSeek}
          />

          {/* Dynamic Layer Tracks */}
          {layers.map((layer) => (
            <LayerTrack
              key={layer.id}
              layer={layer}
              duration={duration}
              zoom={timelineZoom}
              isSnapping={isSnapping}
              isSelected={Boolean(layer.selected || selectedLayerId === layer.id)}
              onSelect={(e) => handleLayerClick(layer.id, e)}
              onSeek={handleSeek}
            />
          ))}

          {/* Playhead Overlay */}
          <Playhead
            playhead={playhead}
            zoom={timelineZoom}
            trackCount={layers.length}
          />

          {/* Marquee Rectangle Box */}
          {marquee && (
            <div
              className="absolute pointer-events-none z-20 border border-cyan-400 bg-cyan-400/15 rounded shadow-sm"
              style={{
                left: Math.min(marquee.startX, marquee.currentX),
                top: Math.min(marquee.startY, marquee.currentY),
                width: Math.abs(marquee.currentX - marquee.startX),
                height: Math.abs(marquee.currentY - marquee.startY),
              }}
            />
          )}
        </div>
      </div>

      {/* ── Playback Controls Bar at bottom ────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-3 py-1.5 border-t border-[#182442] bg-[#091024] flex-shrink-0">
        {/* Progress Bar */}
        <div
          className="flex-1 h-1.5 bg-[#141e38] rounded-full overflow-hidden cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            let t = ((e.clientX - rect.left) / rect.width) * duration;
            if (isSnapping) t = Math.round(t * 2) / 2;
            handleSeek(Math.max(0, Math.min(t, duration)));
          }}
        >
          <div
            className="h-full bg-cyan-400 rounded-full transition-none shadow-[0_0_6px_rgba(6,182,212,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setPlayhead(0)}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Về đầu (Home)"
          >
            <SkipBack size={13} />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-900/50 transition-all active:scale-95"
            title="Phát/Dừng (Space)"
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
          </button>

          <button
            onClick={() => setPlayhead(Math.min(duration, playhead + 1 / 30))}
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            title="Tiến 1 khung"
          >
            <SkipForward size={13} />
          </button>
        </div>

        {/* Time code */}
        <div className="text-xs font-mono flex-shrink-0 text-slate-400">
          <span className="text-white font-bold">{formatTimeMMSS(playhead)}</span>
          <span className="mx-1 text-slate-600">/</span>
          <span>{formatTimeMMSS(duration)}</span>
        </div>

        {/* Loop toggle */}
        <button
          onClick={() => setIsLooping(!isLooping)}
          className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
            isLooping ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
          }`}
          title="Vòng lặp (Loop)"
        >
          <RefreshCw size={11} />
        </button>
      </div>
    </div>
  );
};
