import React from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { PropertySection, SliderRow, ColorRow, TogglePill } from './PropertiesPanel';
import type { AppearEffect, ExitEffect } from '../../types/project.types';

const APPEAR_EFFECTS: { id: AppearEffect; label: string; desc: string }[] = [
  { id: 'draw', label: 'Vẽ viền', desc: 'Viền tự vẽ dần theo chu vi' },
  { id: 'blink', label: 'Nhấp nháy', desc: 'Blink in/out liên tục' },
  { id: 'fade-in', label: 'Hiện dần', desc: 'Fade in mờ đến rõ' },
  { id: 'extrude-3d', label: '3D nổi khối', desc: 'Vùng nổi lên dạng 3D' },
];

const EXIT_EFFECTS: { id: ExitEffect; label: string; desc: string }[] = [
  { id: 'none', label: 'Không', desc: 'Biến mất đột ngột' },
  { id: 'fade-out', label: 'Mờ dần', desc: 'Fade out từ rõ đến mờ' },
  { id: 'retract', label: 'Xoá dần', desc: 'Viền rút ngược về điểm đầu' },
  { id: 'shrink', label: 'Thu nhỏ', desc: 'Co cả vùng về tâm' },
  { id: 'flash', label: 'Loé rồi tắt', desc: 'Sáng bùng lên rồi biến mất' },
];

export const AreaProperties: React.FC<{ layerId: string }> = ({ layerId }) => {
  const { layers, updateAreaData, updateLayer } = useProjectStore();
  const layer = layers.find((l) => l.id === layerId);
  const data = layer?.areaData;
  if (!data) return null;

  const update = (updates: Partial<typeof data>) => updateAreaData(layerId, updates as any);
  const selectedExitEffect = EXIT_EFFECTS.find((e) => e.id === data.exitEffect);

  return (
    <div className="p-4 space-y-4 animate-fadeIn">
      {/* Tên vùng */}
      <PropertySection title="Tên vùng khoanh">
        <input
          type="text"
          value={layer.name}
          onChange={(e) => updateLayer(layerId, { name: e.target.value })}
          className="w-full bg-[#1e293b] text-white text-xs px-3 py-2 rounded-xl border border-slate-700 outline-none focus:border-blue-500 font-medium"
          placeholder="Nhập tên vùng..."
        />
        <div className="pt-2">
          <button
            onClick={() => useProjectStore.getState().setIsEditingVertices(!useProjectStore.getState().isEditingVertices)}
            className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-medium border transition-all ${
              useProjectStore.getState().isEditingVertices
                ? 'bg-cyan-600/30 text-cyan-300 border-cyan-500 shadow-sm'
                : 'bg-[#1e293b]/60 text-slate-400 border-slate-700 hover:text-white hover:bg-[#1e293b]'
            }`}
          >
            <span>{useProjectStore.getState().isEditingVertices ? '✓ Đang bật sửa đỉnh neo' : '✎ Chỉnh sửa các điểm neo (Vertices)'}</span>
          </button>
        </div>
      </PropertySection>

      {/* Độ dày viền */}
      <PropertySection title="Độ dày viền (Border Width)">
        <SliderRow
          value={data.borderWidth}
          min={0.5}
          max={10}
          step={0.5}
          onChange={(v) => update({ borderWidth: v })}
          unit="px"
        />
      </PropertySection>

      {/* Kiểu viền */}
      <PropertySection title="Kiểu viền (Border Style)">
        <TogglePill
          value={data.borderStyle === 'solid'}
          labelOn="Nét liền (Solid)"
          labelOff="Nét đứt (Dashed)"
          onChange={(v) => update({ borderStyle: v ? 'solid' : 'dashed' })}
        />
      </PropertySection>

      {/* Màu viền */}
      <PropertySection title="Màu viền (Border Color)">
        <ColorRow
          color={data.borderColor || '#f59e0b'}
          onChange={(c) => update({ borderColor: c })}
        />
      </PropertySection>

      {/* Màu nền */}
      <PropertySection title="Màu nền (Fill Color)">
        <ColorRow
          color={data.fillColor || `${data.borderColor || '#f59e0b'}55`}
          onChange={(c) => update({ fillColor: c })}
        />
      </PropertySection>

      {/* Độ trong suốt nền */}
      <PropertySection title="Độ trong suốt nền (Fill Opacity)">
        <SliderRow
          value={Math.round((data.fillOpacity ?? 0.35) * 100)}
          min={0}
          max={100}
          step={1}
          onChange={(v) => update({ fillOpacity: v / 100 })}
          unit="%"
        />
      </PropertySection>

      <div className="border-t border-[#1e293b] pt-1" />

      {/* Hiệu ứng xuất hiện */}
      <PropertySection title="Hiệu ứng xuất hiện">
        <div className="grid grid-cols-2 gap-1.5">
          {APPEAR_EFFECTS.map((ef) => (
            <button
              key={ef.id}
              onClick={() => update({ appearEffect: ef.id })}
              title={ef.desc}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
                data.appearEffect === ef.id
                  ? 'bg-blue-600/25 border-blue-500 text-blue-300 shadow-md shadow-blue-900/30'
                  : 'bg-[#1e293b]/40 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {ef.label}
            </button>
          ))}
        </div>
      </PropertySection>

      {/* Thời gian xuất hiện */}
      <PropertySection title="Thời gian xuất hiện">
        <SliderRow
          value={data.appearDuration}
          min={0.1}
          max={5}
          step={0.1}
          onChange={(v) => update({ appearDuration: v })}
          unit="s"
        />
      </PropertySection>

      <div className="border-t border-[#1e293b] pt-1" />

      {/* 3D Nổi khối */}
      <PropertySection title="3D Nổi khối (Fill Extrusion)">
        <div className="space-y-2.5">
          <TogglePill
            value={data.is3D}
            labelOn="Bật 3D Nổi khối"
            labelOff="2D Phẳng"
            onChange={(v) => update({ is3D: v })}
          />
          {data.is3D && (
            <div className="space-y-1.5 bg-[#1e293b]/40 p-3 rounded-xl border border-slate-700/60">
              <p className="text-[11px] text-slate-400 font-medium">Độ cao khối nổi (m)</p>
              <SliderRow
                value={data.extrudeHeight}
                min={50}
                max={2500}
                step={50}
                onChange={(v) => update({ extrudeHeight: v })}
                unit="m"
              />
            </div>
          )}
        </div>
      </PropertySection>

      <div className="border-t border-[#1e293b] pt-1" />

      {/* Hiệu ứng kết thúc */}
      <PropertySection title="Hiệu ứng kết thúc">
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {EXIT_EFFECTS.map((ef) => (
            <button
              key={ef.id}
              onClick={() => update({ exitEffect: ef.id })}
              className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border transition-all text-center ${
                data.exitEffect === ef.id
                  ? 'bg-amber-500/25 border-amber-500 text-amber-300 shadow-md shadow-amber-900/20'
                  : 'bg-[#1e293b]/40 border-slate-700/60 text-slate-400 hover:border-slate-500 hover:text-slate-200'
              }`}
            >
              {ef.label}
            </button>
          ))}
        </div>
        {selectedExitEffect && data.exitEffect !== 'none' && (
          <p className="text-[11px] text-slate-400 italic bg-[#1e293b]/40 px-2.5 py-1 rounded-lg border border-slate-800 mb-2">
            {selectedExitEffect.desc}
          </p>
        )}
      </PropertySection>

      {/* Thời gian kết thúc */}
      {data.exitEffect !== 'none' && (
        <PropertySection title="Thời gian kết thúc">
          <SliderRow
            value={data.exitDuration || 0.8}
            min={0.1}
            max={3}
            step={0.1}
            onChange={(v) => update({ exitDuration: v })}
            unit="s"
          />
        </PropertySection>
      )}
    </div>
  );
};
