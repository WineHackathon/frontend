import React from 'react';
import { Wine, User, Sparkles, LogIn, Award } from 'lucide-react';
import { getAuthToken } from '../services/api';

export default function Header({ user, remainingScans, onOpenAuth, onOpenProfile, onOpenSommelier }) {
  const isAuth = !!user || !!getAuthToken();

  return (
    <header className="sticky top-0 z-30 w-full px-3 sm:px-6 pt-3 pb-2 max-w-md mx-auto">
      {/* Floating pill navigation matching vino-svoe.ru header */}
      <div className="svoe-header-pill px-4 h-14 flex items-center justify-between shadow-svoe-header">
        
        {/* Brand Logo & Name (vino-svoe.ru style) */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-[#8f3d42] flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Wine className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-serif font-semibold text-lg tracking-tight text-[#2c2a28] block leading-tight">
              Своё Вино
            </span>
            <span className="text-[9px] uppercase tracking-wider text-[#857e79] font-medium block -mt-0.5">
              от РСХБ & Роскачества
            </span>
          </div>
        </div>

        {/* Right actions: Remaining scans badge + Profile/Auth button */}
        <div className="flex items-center space-x-2">
          {!isAuth && (
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#fdf9ed] border border-[#efdbc6] text-[#8f3d42] text-xs font-semibold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8f3d42] animate-pulse"></span>
              <span className="text-[11px]">{remainingScans}/5</span>
            </div>
          )}

          {isAuth ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center space-x-1.5 p-1 pr-2.5 rounded-full bg-white border border-[#efdbc6] hover:border-[#8f3d42] transition text-[#2c2a28] shadow-sm"
              title="Личный кабинет"
            >
              <div className="w-6 h-6 rounded-full bg-[#8f3d42] text-white flex items-center justify-center text-[10px] font-bold">
                {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-medium max-w-[70px] truncate hidden sm:inline">
                {user?.first_name || 'Профиль'}
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="svoe-btn-primary text-xs px-3.5 py-1.5 flex items-center space-x-1.5 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Войти</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
