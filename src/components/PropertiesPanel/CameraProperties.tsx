import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { PropertySection, SliderRow } from './PropertiesPanel';
import type { EasingType } from '../../types/project.types';
import { Camera, Trash2 } from 'lucide-react';

const EASINGS: { id: EasingType; label: string; desc: string }[] = [
  { id: 'ease-in-out', label: 'Mượt hai đầu', desc: 'Ease-in-out đều đặn hai đầu' },
  { id: 'ease-out', label: 'Chậm cuối', desc: 'Ease-out, chậm dần khi đến điểm dừng' },
  { id: 'cinematic', label: 'Điện ảnh', desc: 'Mượt đầu, lướt nhanh rồi chậm dần cuối (Cubic-bezier)' },
];

export const CameraProperties: React.FC = () => {
  const {
    cameraKeyframes, updateCameraKeyframe, deleteCameraKeyframe,
    playhead, setPlayhead, isKeyframeCameraMode,
  } = useProjectStore();

  const activeKf = [...cameraKeyframes].sort(
    (a, b) => Math.abs(a.time - playhead) - Math.abs(b.time - playhead)
  )[0];

  return (
    <div className="p-4 space-y-4 border-b border-[#1e293b] animate-fadeIn bg-[#0a1628]/30">
      <div className="flex items-center gap-2">
        <Camera size={16} className="text-red-400" />
        <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
          Camera Keyframe
        </span>
        {isKeyframeCameraMode && (
          <div className="ml-auto flex items-center gap-1.5 bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-500/30">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
            REC
          </div>
        )}
      </div>

      {cameraKeyframes.length === 0 ? (
        <p className="text-xs text-slate-400 leading-relaxed bg-[#1e293b]/40 p-3 rounded-xl border border-slate-800">
          Bật chế độ Camera trên timeline, chỉnh góc nhìn bản đồ rồi nhấn nút <b className="text-red-400">+K</b> trên preview để thêm keyframe.
        </p>
      ) : (
        <>
          <div className="bg-[#1e293b]/80 border border-slate-700/60 rounded-xl p-3 space-y-2 shadow-sm">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Góc nhìn tại mốc {playhead.toFixed(1)}s
            </p>
            {activeKf && (
              <div className="space-y-1 text-xs">
                <div className="flex justify-between py-0.5 border-b border-slate-800">
                  <span className="text-slate-400">Tọa độ tâm:</span>
                  <span className="text-slate-200 font-mono">
                    {activeKf.center[0].toFixed(3)}, {activeKf.center[1].toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 border-b border-slate-800">
                  <span className="text-slate-400">Độ phóng to (Zoom):</span>
                  <span className="text-slate-200 font-mono font-bold text-blue-400">
                    {activeKf.zoom.toFixed(1)}x
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Góc xoay / Nghiêng 3D:</span>
                  <span className="text-slate-200 font-mono">
                    {activeKf.bearing.toFixed(0)}° / {activeKf.pitch.toFixed(0)}°
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Easing */}
          <PropertySection title="Kiểu chuyển cảnh (Easing)">
            <div className="space-y-1.5">
              {EASINGS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => activeKf && updateCameraKeyframe(activeKf.id, { easing: e.id })}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs border transition-all ${
                    activeKf?.easing === e.id
                      ? 'bg-blue-600/25 border-blue-500 text-blue-200 shadow-md shadow-blue-900/30 font-medium'
                      : 'bg-[#1e293b]/40 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  <div className="font-semibold text-slate-200">{e.label}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5 leading-snug">{e.desc}</div>
                </button>
              ))}
            </div>
          </PropertySection>

          {/* Delay */}
          {activeKf && (
            <PropertySection title="Độ trễ Camera (Delay)">
              <SliderRow
                value={activeKf.delay}
                min={0} max={3} step={0.1}
                onChange={(v) => updateCameraKeyframe(activeKf.id, { delay: v })}
                unit="s"
              />
              <p className="text-[10px] text-slate-400 mt-1">Chờ một khoảng thời gian trước khi camera bắt đầu di chuyển</p>
            </PropertySection>
          )}
        </>
      )}

      {/* Keyframe list */}
      {cameraKeyframes.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
              Danh sách Keyframe ({cameraKeyframes.length})
            </p>
            {activeKf && (
              <button
                onClick={() => deleteCameraKeyframe(activeKf.id)}
                className="text-[10px] text-red-400 hover:text-red-300 hover:bg-red-950/40 px-2 py-0.5 rounded border border-red-500/30 flex items-center gap-1 transition-colors"
                title="Xoá keyframe đang chọn"
              >
                <Trash2 size={10} />
                Xoá mốc này
              </button>
            )}
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {[...cameraKeyframes].sort((a, b) => a.time - b.time).map((kf) => (
              <div
                key={kf.id}
                onClick={() => setPlayhead(kf.time)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all border group ${
                  Math.abs(kf.time - playhead) < 0.1
                    ? 'bg-blue-600/20 text-blue-200 border-blue-500/60 font-semibold shadow'
                    : 'bg-[#1e293b]/40 text-slate-400 border-slate-800 hover:bg-[#1e293b] hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rotate-45 bg-red-400 flex-shrink-0 shadow-sm" />
                  <span className="font-mono text-white font-medium">{kf.time.toFixed(1)}s</span>
                  <span className="text-slate-400">Zoom {kf.zoom.toFixed(1)}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-[10px]">
                    {kf.easing === 'cinematic' ? '🎬 Điện ảnh' : '↔ Mượt'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCameraKeyframe(kf.id);
                    }}
                    className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-60 group-hover:opacity-100"
                    title="Xoá keyframe này"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
