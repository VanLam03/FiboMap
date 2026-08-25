import React, { useState } from 'react';
import { Music, Play, Volume2, Upload, X, Plus } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

const SOUND_EFFECTS = [
  { id: 'cinematic-whoosh', name: 'Cinematic Whoosh (Chuyển cảnh camera)', duration: '1.5s', category: 'Chuyển động' },
  { id: 'map-pin-drop', name: 'Map Pin Drop (Tiếng cắm cờ / ghim)', duration: '0.8s', category: 'Tương tác' },
  { id: 'tech-click', name: 'Kỹ thuật số Click (Radar Scan)', duration: '1.2s', category: 'Kỹ thuật' },
  { id: 'car-accelerate', name: 'Tiếng động cơ xe chạy trên đường', duration: '3.0s', category: 'Phương tiện' },
  { id: 'airplane-flyby', name: 'Máy bay lướt qua bầu trời', duration: '4.0s', category: 'Phương tiện' },
  { id: 'ambient-piano', name: 'Nhạc nền Piano điện ảnh sâu lắng', duration: '5.0s', category: 'Nhạc nền' },
];

export const AudioModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedSound, setSelectedSound] = useState(SOUND_EFFECTS[0]);
  const [volume, setVolume] = useState(80);
  const { addLayer, playhead, duration } = useProjectStore();

  const handleAddAudio = () => {
    const newLayer = {
      id: `audio-layer-${Date.now()}`,
      type: 'audio' as const,
      name: `Âm thanh: ${selectedSound.name.slice(0, 18)}...`,
      color: '#ec4899',
      startTime: playhead,
      endTime: Math.min(playhead + parseFloat(selectedSound.duration), duration),
      visible: true,
      locked: false,
      selected: true,
      audioData: {
        title: selectedSound.name,
        volume: volume / 100,
        soundEffectType: selectedSound.id,
      },
    };
    addLayer(newLayer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-[500px] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Music size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Kho Hiệu ứng Âm thanh & Lồng tiếng</h2>
              <p className="text-slate-400 text-xs">Hiệu ứng tiếng động bản đồ, tiếng xe, máy bay và nhạc nền</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Sound list */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Chọn âm thanh mẫu</label>
            <div className="space-y-2">
              {SOUND_EFFECTS.map((snd) => (
                <div
                  key={snd.id}
                  onClick={() => setSelectedSound(snd)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    selectedSound.id === snd.id
                      ? 'border-pink-500 bg-pink-500/15 text-white shadow-md'
                      : 'border-slate-700/60 bg-[#1e293b]/40 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-pink-400">
                      <Play size={14} className="ml-0.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white">{snd.name}</h4>
                      <span className="text-[10px] text-slate-400">{snd.category} · {snd.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div className="space-y-1.5 pt-2 border-t border-[#1e293b]">
            <label className="text-xs text-slate-400 font-medium">Âm lượng phát (Volume)</label>
            <div className="flex items-center gap-3 bg-[#1e293b]/60 px-3 py-2 rounded-xl border border-slate-700">
              <Volume2 size={16} className="text-pink-400" />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="flex-1 accent-pink-500 cursor-pointer"
              />
              <span className="text-xs font-mono font-medium text-pink-400 min-w-[40px] text-right">
                {volume}%
              </span>
            </div>
          </div>

          {/* Custom audio upload */}
          <div className="border border-dashed border-slate-700 hover:border-slate-500 p-4 rounded-xl text-center bg-[#1e293b]/20 cursor-pointer transition-colors">
            <Upload size={20} className="text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs font-medium text-slate-300">Tải file âm thanh từ máy tính (.MP3, .WAV)</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Dung lượng tối đa 25 MB</p>
          </div>

          <button
            type="button"
            onClick={handleAddAudio}
            className="w-full py-3 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-300 hover:to-rose-400 shadow-lg shadow-pink-900/40 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <Plus size={16} />
            Thêm Track Âm Thanh vào Timeline
          </button>
        </div>
      </div>
    </div>
  );
};
