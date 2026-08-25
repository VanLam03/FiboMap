import React, { useState, useEffect } from 'react';
import { Download, X, CheckCircle2 } from 'lucide-react';
import { useProjectStore } from '../../store/useProjectStore';

interface ExportModalProps {
  onClose: () => void;
}

const resolutions = ['Full HD (1080p)', '2K (1440p)', '4K (2160p)'];
const fpsOptions = [24, 30, 60];
const formats = ['MP4 (H.264)', 'WebM (VP9)'];

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const { name, aspectRatio, duration } = useProjectStore();
  const [resolution, setResolution] = useState(resolutions[0]);
  const [fps, setFps] = useState(30);
  const [format, setFormat] = useState(formats[0]);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setProgress(0);
  };

  useEffect(() => {
    if (!exporting || done) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          setDone(true);
          clearInterval(interval);
          return 100;
        }
        return p + Math.random() * 4 + 1;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [exporting, done]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-[440px] animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Download size={16} className="text-black" />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Xuất video</h2>
              <p className="text-slate-500 text-xs">{name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!exporting ? (
            <>
              {/* Resolution */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Độ phân giải</label>
                <div className="flex gap-2">
                  {resolutions.map((r) => (
                    <button
                      key={r}
                      onClick={() => setResolution(r)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        resolution === r
                          ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                          : 'border-[#1e293b] text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {r.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* FPS */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">FPS</label>
                <div className="flex gap-2">
                  {fpsOptions.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFps(f)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        fps === f
                          ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                          : 'border-[#1e293b] text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {f}fps
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">Định dạng</label>
                <div className="flex gap-2">
                  {formats.map((f) => (
                    <button
                      key={f}
                      onClick={() => setFormat(f)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        format === f
                          ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                          : 'border-[#1e293b] text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-[#1e293b] rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tỉ lệ</span>
                  <span className="text-slate-300">{aspectRatio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Thời lượng</span>
                  <span className="text-slate-300">{duration.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Kích thước ước tính</span>
                  <span className="text-slate-300">~42 MB</span>
                </div>
              </div>

              <button
                onClick={handleExport}
                className="w-full py-2.5 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-lg shadow-orange-900/30 transition-all active:scale-98"
              >
                Bắt đầu xuất video
              </button>
            </>
          ) : done ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 size={48} className="text-green-400 mx-auto" />
              <div>
                <p className="text-white font-medium">Xuất video thành công!</p>
                <p className="text-slate-400 text-xs mt-1">{name}.mp4 — 42 MB</p>
              </div>
              <a
                href="#"
                className="inline-block px-6 py-2 rounded-xl font-semibold text-sm text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 transition-all"
                onClick={(e) => { e.preventDefault(); onClose(); }}
              >
                Tải xuống
              </a>
            </div>
          ) : (
            <div className="py-6 space-y-4">
              <div className="text-center">
                <p className="text-slate-300 text-sm font-medium">Đang xuất video...</p>
                <p className="text-slate-500 text-xs mt-1">{Math.round(progress)}% · Còn khoảng {Math.max(0, Math.round((100 - progress) / 8))}s</p>
              </div>
              <div className="bg-[#1e293b] rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {['Render frame', 'Encode', 'Finalize'].map((s, i) => (
                  <div key={s} className={`p-2 rounded-lg ${progress > i * 33 ? 'bg-blue-500/10 text-blue-300' : 'bg-[#1e293b] text-slate-600'}`}>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
