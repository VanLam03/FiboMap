import React, { useState } from 'react';
import { Mic, Volume2, Play, Pause, Check, X, Sparkles, Wand2 } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

const VOICES = [
  { id: 'hn-female', name: 'Thuỳ Dung', region: 'Hà Nội (Bắc)', gender: 'Nữ · Truyền cảm' },
  { id: 'hn-male', name: 'Mạnh Cường', region: 'Hà Nội (Bắc)', gender: 'Nam · Trầm ấm' },
  { id: 'sg-female', name: 'Kim Ngân', region: 'TP. Hồ Chí Minh (Nam)', gender: 'Nữ · Nhẹ nhàng' },
  { id: 'sg-male', name: 'Minh Hoàng', region: 'TP. Hồ Chí Minh (Nam)', gender: 'Nam · Tự tin' },
];

export const TTSModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [text, setText] = useState('Chào mừng quý vị đến với đại dự án quy hoạch hạ tầng trọng điểm, kết nối trực tiếp các tuyến đường huyết mạch.');
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0].id);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [previewing, setPreviewing] = useState(false);

  const { addLayer, playhead, duration } = useProjectStore();

  const handleSpeakPreview = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (previewing) {
        setPreviewing(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;
      utterance.pitch = pitch;
      utterance.lang = 'vi-VN';
      utterance.onend = () => setPreviewing(false);
      utterance.onerror = () => setPreviewing(false);
      setPreviewing(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAddToTimeline = () => {
    // Estimate audio duration based on word count & speed
    const wordCount = text.trim().split(/\s+/).length;
    const estDuration = Math.max(2, Math.min(30, (wordCount / (2.5 * speed))));

    addLayer({
      id: `tts-${Date.now()}`,
      type: 'audio',
      name: `🎤 Giọng đọc: ${VOICES.find(v => v.id === selectedVoice)?.name}`,
      color: '#ef4444',
      startTime: playhead,
      endTime: Math.min(playhead + estDuration, duration),
      visible: true,
      locked: false,
      selected: true,
      audioData: {
        title: text.slice(0, 35) + '...',
        volume: 100,
        soundEffectType: 'voiceover',
      },
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-[520px] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Mic size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Đọc chữ AI (Text-to-Speech)</h2>
              <p className="text-slate-400 text-xs">Tạo giọng đọc thuyết minh tự động bằng AI tiếng Việt</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Text Input */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Nội dung thuyết minh (Kịch bản)</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              className="w-full bg-[#1e293b] text-white text-xs p-3 rounded-xl border border-slate-700 outline-none focus:border-rose-500 transition-colors resize-none leading-relaxed"
              placeholder="Nhập văn bản cần đọc..."
            />
          </div>

          {/* Voice Selector */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Chọn giọng đọc tiếng Việt</label>
            <div className="grid grid-cols-2 gap-2">
              {VOICES.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVoice(v.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    selectedVoice === v.id
                      ? 'border-rose-500 bg-rose-500/15 text-white shadow-sm'
                      : 'border-slate-700/60 bg-[#1e293b]/40 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-rose-300">{v.name}</span>
                    <span className="text-[10px] text-slate-400">{v.region}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">{v.gender}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Speed slider */}
          <div className="space-y-1.5 bg-[#1e293b]/40 p-3 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Tốc độ đọc</span>
              <span className="font-mono text-rose-400 font-bold">{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={0.7}
              max={1.6}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-[#1e293b]">
            <button
              onClick={handleSpeakPreview}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 bg-[#1e293b] hover:bg-[#283858] text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              {previewing ? <Pause size={14} className="text-rose-400" /> : <Play size={14} className="text-rose-400" />}
              <span>{previewing ? 'Dừng nghe thử' : 'Nghe thử giọng đọc'}</span>
            </button>

            <button
              onClick={handleAddToTimeline}
              className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Wand2 size={14} />
              <span>Thêm vào Timeline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
