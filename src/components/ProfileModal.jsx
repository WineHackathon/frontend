import React, { useState, useEffect } from 'react';
import { X, LogOut, Wine, History, Sparkles, Compass } from 'lucide-react';
import { api } from '../services/api';
import WineCard from './WineCard';

export default function ProfileModal({ isOpen, onClose, user, onLogout, onSelectWine }) {
  const [activeTab, setActiveTab] = useState('cellar');
  const [cellarItems, setCellarItems] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [cellar, scans] = await Promise.all([
          api.getCellar(),
          api.getScanHistory(),
        ]);
        setCellarItems(cellar);
        setScanHistory(scans);
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const tasteProfile = user?.taste_profile || {
    sweetness_pref: 1.2,
    body_pref: 4.2,
    acidity_pref: 3.4,
    oak_pref: 3.5,
    preferred_categories: ['Красное', 'Белое'],
    favorite_aromas: ['вишня', 'дуб', 'смородина', 'ваниль'],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2a28]/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-lg h-[88vh] max-h-[750px] rounded-[32px] bg-[#fefdfa] border border-[#efdbc6] overflow-hidden shadow-svoe-elevated flex flex-col text-left">
        
        {/* Header */}
        <div className="p-4 sm:p-5 pb-3 bg-[#fdf9ed] border-b border-[#efdbc6] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#8f3d42] border border-[#723135] flex items-center justify-center text-white font-bold font-serif text-base shadow-sm">
              {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="font-serif font-semibold text-base text-[#2c2a28]">
                {user?.first_name || 'Пользователь'}
              </h3>
              <p className="text-xs text-[#857e79]">{user?.email || 'user@example.com'}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => { onLogout(); onClose(); }}
              className="p-2 rounded-full bg-white hover:bg-[#edd4d6] text-[#857e79] hover:text-[#8f3d42] transition border border-[#efdbc6]"
              title="Выйти из аккаунта"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white hover:bg-[#f8ecc9] text-[#2c2a28] transition border border-[#efdbc6]"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 p-1 mx-4 mt-3 rounded-full bg-[#fdf9ed] border border-[#efdbc6] text-xs flex-shrink-0">
          <button
            onClick={() => setActiveTab('cellar')}
            className={`py-1.5 rounded-full font-medium transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'cellar' ? 'bg-[#8f3d42] text-white shadow-sm' : 'text-[#857e79] hover:text-[#2c2a28]'
            }`}
          >
            <Wine className="w-3.5 h-3.5" />
            <span>Погреб ({cellarItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('scans')}
            className={`py-1.5 rounded-full font-medium transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'scans' ? 'bg-[#8f3d42] text-white shadow-sm' : 'text-[#857e79] hover:text-[#2c2a28]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Сканы ({scanHistory.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('taste')}
            className={`py-1.5 rounded-full font-medium transition flex items-center justify-center space-x-1.5 ${
              activeTab === 'taste' ? 'bg-[#8f3d42] text-white shadow-sm' : 'text-[#857e79] hover:text-[#2c2a28]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Вкус</span>
          </button>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fefdfa]">
          
          {/* Tab 1: Cellar */}
          {activeTab === 'cellar' && (
            <div className="space-y-2.5">
              {cellarItems.length === 0 ? (
                <div className="text-center py-12 text-[#857e79] space-y-2">
                  <Wine className="w-10 h-10 mx-auto text-[#d7d4d2]" />
                  <p className="text-sm font-medium text-[#2c2a28]">Ваш винный погреб пока пуст</p>
                  <p className="text-xs">
                    Отсканируйте этикетку или спросите сомелье, чтобы добавить вино в коллекцию.
                  </p>
                </div>
              ) : (
                cellarItems.map((item, idx) => (
                  <div key={idx} className="relative">
                    <WineCard
                      wine={item.wine || item}
                      onSelect={(w) => { onClose(); onSelectWine(w); }}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Scan History */}
          {activeTab === 'scans' && (
            <div className="space-y-2">
              {scanHistory.length === 0 ? (
                <div className="text-center py-12 text-[#857e79] space-y-2">
                  <History className="w-10 h-10 mx-auto text-[#d7d4d2]" />
                  <p className="text-sm font-medium text-[#2c2a28]">История сканирований пуста</p>
                  <p className="text-xs">
                    Здесь будут сохраняться все распознанные вами винные этикетки.
                  </p>
                </div>
              ) : (
                scanHistory.map((scan, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-[#ebe9e9] flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-[#f9f1f1] flex items-center justify-center text-[#8f3d42] border border-[#edd4d6]">
                        <Wine className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-semibold text-[#2c2a28] text-xs">
                          {scan.wine_name || scan.predicted_slug || 'Вино из реестра'}
                        </h5>
                        <p className="text-[10px] text-[#857e79]">
                          {new Date(scan.created_at || Date.now()).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#fdf9ed] text-[#8f3d42] border border-[#efdbc6] font-semibold">
                      Успешно
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Aggregated Taste Profile (Scheme 2 - Вкусовой профиль) */}
          {activeTab === 'taste' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#fdf9ed] border border-[#efdbc6] space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-semibold text-sm text-[#2c2a28] flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 text-[#dfa838]" />
                    <span>Адаптивный профиль предпочтений</span>
                  </h4>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-white text-[#8f3d42] border border-[#efdbc6] font-medium">
                    EMA-Агрегация
                  </span>
                </div>
                <p className="text-xs text-[#857e79] leading-relaxed">
                  Профиль автоматически обучается на основе ваших диалогов с сомелье и оценок вин в погребе.
                </p>

                {/* 4D Scales */}
                <div className="space-y-2.5 pt-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-[#2c2a28]">
                      <span>Сладость</span>
                      <span className="font-mono text-[#dfa838] font-bold">{tasteProfile.sweetness_pref || 1.2} / 5</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white border border-[#efdbc6] overflow-hidden">
                      <div className="h-full bg-[#dfa838] rounded-full" style={{ width: `${((tasteProfile.sweetness_pref || 1.2) / 5) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-[#2c2a28]">
                      <span>Тело / Плотность</span>
                      <span className="font-mono text-[#8f3d42] font-bold">{tasteProfile.body_pref || 4.2} / 5</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white border border-[#efdbc6] overflow-hidden">
                      <div className="h-full bg-[#8f3d42] rounded-full" style={{ width: `${((tasteProfile.body_pref || 4.2) / 5) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-[#2c2a28]">
                      <span>Кислотность</span>
                      <span className="font-mono text-[#4b7b65] font-bold">{tasteProfile.acidity_pref || 3.4} / 5</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white border border-[#efdbc6] overflow-hidden">
                      <div className="h-full bg-[#4b7b65] rounded-full" style={{ width: `${((tasteProfile.acidity_pref || 3.4) / 5) * 100}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 text-[#2c2a28]">
                      <span>Выдержка в дубе</span>
                      <span className="font-mono text-[#b87333] font-bold">{tasteProfile.oak_pref || 3.5} / 5</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white border border-[#efdbc6] overflow-hidden">
                      <div className="h-full bg-[#b87333] rounded-full" style={{ width: `${((tasteProfile.oak_pref || 3.5) / 5) * 100}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Favorite Aromas */}
                {tasteProfile.favorite_aromas && tasteProfile.favorite_aromas.length > 0 && (
                  <div className="pt-2 border-t border-[#efdbc6]">
                    <span className="text-[10px] uppercase font-bold text-[#857e79] block mb-1.5">
                      Любимые ароматы
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {tasteProfile.favorite_aromas.map((a, i) => (
                        <span key={i} className="px-2.5 py-0.5 rounded-full bg-white text-[#8f3d42] border border-[#efdbc6] text-[10px] font-medium">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
