import React, { useState } from 'react';
import {
  Bot,
  ChevronDown,
  Globe,
  Lock,
  User,
  AlertCircle,
} from 'lucide-react';
import { UserProfile } from '../types';
import cartoonIllustration from '../assets/images/light_robot_workspace_1786974701298.jpg';
import { INITIAL_USER } from '../utils/mockData';

interface LoginPageProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin@2026');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [language, setLanguage] = useState('简体中文');
  const [showLangMenu, setShowLangMenu] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      if (username.trim() === 'admin' && password === 'admin@2026') {
        onLogin(INITIAL_USER);
      } else {
        setErrorMsg('用户名或密码错误（账号: admin，密码: admin@2026）');
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen w-full flex bg-white text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* Left Visual Illustration Area (Large Light Pastel 3D Cartoon Workspace) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-[#eef6ff] via-[#f3f7fd] to-[#e8f0fe] items-center justify-center p-8 sm:p-10 overflow-hidden border-r border-slate-100">
        {/* Soft pastel background ambient shapes */}
        <div className="absolute -top-16 -left-16 w-80 h-80 bg-blue-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -right-16 w-80 h-80 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-8 w-32 h-32 bg-sky-100/60 rounded-full blur-2xl" />

        {/* Large 3D Cartoon AI Character & Platform Card */}
        <div className="relative z-10 w-full h-full max-w-lg max-h-[85vh] flex items-center justify-center">
          <div className="w-full bg-white/75 backdrop-blur-xl rounded-3xl p-3 sm:p-4 border border-white shadow-2xl shadow-blue-500/10">
            <img
              src={cartoonIllustration}
              alt="智聘AI 智能体工作台"
              className="w-full h-auto object-cover rounded-2xl drop-shadow-sm select-none pointer-events-none"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Right Login Pane (Pure White, Crisp) */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 relative">
        
        {/* Top Header with Language Dropdown */}
        <div className="flex justify-end relative">
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs text-slate-600 transition"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{language}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)} />
                <div className="absolute right-0 mt-1 w-28 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 text-xs">
                  <button
                    onClick={() => {
                      setLanguage('简体中文');
                      setShowLangMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium"
                  >
                    简体中文
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('English');
                      setShowLangMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700"
                  >
                    English
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Center Login Box */}
        <div className="max-w-md w-full mx-auto my-auto space-y-8">
          
          {/* Brand Logo & Title */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Bot className="w-7 h-7" />
              </div>
              <span className="text-3xl font-black text-slate-900 tracking-tight">智聘AI</span>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-8 sm:p-9 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900">账号登录</h2>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">用户名</label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名 (admin)"
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">密码</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码 (admin@2026)"
                    required
                    className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl text-sm shadow-sm transition disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>登录</span>
                )}
              </button>

              <div className="flex items-center justify-start text-xs pt-1">
                <span className="text-blue-600 hover:underline cursor-pointer">忘记密码？</span>
              </div>
            </form>
          </div>

        </div>

        {/* Bottom spacer */}
        <div className="h-6" />

      </div>
    </div>
  );
};

