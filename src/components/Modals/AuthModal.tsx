import React, { useState } from 'react';
import { LogIn, Mail, Globe, CheckCircle2, X, ArrowRight } from 'lucide-react';

export const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setOtpSent(true);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp) setLoggedIn(true);
  };

  const handleGoogleLogin = () => {
    setLoggedIn(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl shadow-2xl w-[440px] flex flex-col overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e293b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <LogIn size={16} />
            </div>
            <div>
              <h2 className="font-semibold text-white text-sm">Đăng nhập tài khoản</h2>
              <p className="text-slate-400 text-xs">Đồng bộ dự án đám mây & kích hoạt tính năng PRO</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1e293b] transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {loggedIn ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 size={48} className="text-emerald-400 mx-auto" />
              <div>
                <p className="text-white font-semibold text-base">Đăng nhập thành công!</p>
                <p className="text-slate-400 text-xs mt-1">Dự án của bạn đã được kết nối với Cloud.</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-semibold text-xs text-black bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 transition-all"
              >
                Hoàn tất & Tiếp tục
              </button>
            </div>
          ) : (
            <>
              {/* Google OAuth button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-2.5 shadow-md transition-all active:scale-98"
              >
                <Globe size={18} className="text-blue-500" />
                <span>Tiếp tục với Google OAuth</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-[11px] text-slate-500 font-medium">hoặc dùng Email</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Email Form */}
              {!otpSent ? (
                <form onSubmit={handleSendOTP} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">Địa chỉ Email</label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tenban@gmail.com"
                        className="w-full bg-[#1e293b] text-white text-xs pl-10 pr-3 py-2.5 rounded-xl border border-slate-700 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Gửi mã xác thực OTP</span>
                    <ArrowRight size={13} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-3 animate-fadeIn">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400 font-medium">Nhập mã OTP (gửi về {email})</label>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Nhập mã 6 chữ số..."
                      className="w-full bg-[#1e293b] text-white text-xs px-3 py-2.5 rounded-xl border border-slate-700 outline-none focus:border-blue-500 text-center font-mono tracking-widest text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-semibold text-xs text-black bg-amber-400 hover:bg-amber-300 transition-all"
                  >
                    Xác nhận đăng nhập
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
