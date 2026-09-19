import React, { useState } from 'react';
import { X, LogIn, UserPlus, Sparkles, Lock, Mail, User } from 'lucide-react';
import { api } from '../services/api';

export default function AuthModal({ isOpen, onClose, onSuccess, initialPrompt }) {
  const [tab, setTab] = useState('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      let res;
      if (tab === 'login') {
        res = await api.login(email, password);
      } else {
        res = await api.register(email, password, firstName || 'Любитель вина');
      }

      if (res.success) {
        onSuccess(res.user);
        onClose();
      } else {
        setErrorMsg(res.error || 'Произошла ошибка при аутентификации');
      }
    } catch (err) {
      setErrorMsg('Сетевая ошибка сервера. Попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsLoading(true);
    const demoEmail = 'sommelier_guest@vino-svoe.ru';
    const res = await api.login(demoEmail, 'secret123');
    setIsLoading(false);
    if (res.success) {
      onSuccess(res.user);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2a28]/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-sm rounded-[32px] bg-[#fefdfa] border border-[#efdbc6] overflow-hidden shadow-svoe-elevated relative text-left">
        
        {/* Header */}
        <div className="p-5 pb-3 bg-[#fdf9ed] border-b border-[#efdbc6] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-[#8f3d42] flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-serif font-semibold text-sm text-[#2c2a28] uppercase tracking-wider">
              {tab === 'register' ? 'Регистрация' : 'Вход в аккаунт'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white hover:bg-[#f8ecc9] text-[#857e79] flex items-center justify-center transition border border-[#efdbc6]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Conversion Promo Banner */}
          <div className="p-3.5 rounded-2xl bg-[#fdf9ed] border border-[#efdbc6] text-xs">
            <h4 className="font-semibold text-[#8f3d42] flex items-center space-x-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#dfa838]" />
              <span>{initialPrompt?.title || 'Возможности личного аккаунта'}</span>
            </h4>
            <p className="text-[#857e79] text-[11px] leading-relaxed">
              {initialPrompt?.subtitle || 'Авторизуйтесь, чтобы разблокировать безлимитный сканер, свободный диалог с AI-сомелье и сохранение вин в личный погреб!'}
            </p>
          </div>

          {/* Tab Switcher (vino-svoe.ru pill style) */}
          <div className="grid grid-cols-2 p-1 rounded-full bg-[#fdf9ed] border border-[#efdbc6] text-xs">
            <button
              onClick={() => { setTab('register'); setErrorMsg(null); }}
              className={`py-1.5 rounded-full font-medium transition ${
                tab === 'register' ? 'bg-[#8f3d42] text-white shadow-sm' : 'text-[#857e79] hover:text-[#2c2a28]'
              }`}
            >
              Регистрация
            </button>
            <button
              onClick={() => { setTab('login'); setErrorMsg(null); }}
              className={`py-1.5 rounded-full font-medium transition ${
                tab === 'login' ? 'bg-[#8f3d42] text-white shadow-sm' : 'text-[#857e79] hover:text-[#2c2a28]'
              }`}
            >
              Вход
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === 'register' && (
              <div>
                <label className="block text-[11px] font-medium text-[#857e79] mb-1">Имя</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#857e79] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full bg-white text-[#2c2a28] text-xs rounded-full pl-9 pr-3 py-2.5 border border-[#d7d4d2] focus:outline-none focus:border-[#8f3d42] transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-medium text-[#857e79] mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#857e79] absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-white text-[#2c2a28] text-xs rounded-full pl-9 pr-3 py-2.5 border border-[#d7d4d2] focus:outline-none focus:border-[#8f3d42] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#857e79] mb-1">Пароль</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#857e79] absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white text-[#2c2a28] text-xs rounded-full pl-9 pr-3 py-2.5 border border-[#d7d4d2] focus:outline-none focus:border-[#8f3d42] transition"
                />
              </div>
            </div>

            {errorMsg && (
              <p className="text-[#723135] text-xs bg-[#fdf6f6] p-2.5 rounded-xl border border-[#edd4d6]">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full svoe-btn-primary bg-[#8f3d42] hover:bg-[#ab494f] text-white font-semibold py-3 px-4 rounded-full text-xs flex items-center justify-center space-x-2 transition shadow-sm active:scale-98 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Секунду...</span>
              ) : tab === 'register' ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Создать аккаунт</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Войти</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Button */}
          <div className="pt-2 border-t border-[#ebe9e9] text-center">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="text-[11px] text-[#8f3d42] hover:underline transition font-medium"
            >
              Войти как гость в 1 клик (Тестовый режим)
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
