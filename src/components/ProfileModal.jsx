import React, { useState, useEffect } from 'react';
import { X, LogOut, Wine, Bookmark, History, Sparkles, Compass, Trash2, Check, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import WineCard from './WineCard';

export default function ProfileModal({ isOpen, onClose, user, onLogout, onSelectWine, initialTab = 'cellar' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [cellarItems, setCellarItems] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const [cellar, scans] = await Promise.all([
          api.getCellar(),
          api.getScanHistory(),
        ]);
        setCellarItems(cellar || []);
        setScanHistory(scans || []);
      } catch (err) {
        console.error('Error loading profile data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  // Разделение: Погреб (купленные / в коллекции) и Вишлист (хочу купить)
  const cellarOnly = cellarItems.filter(item => item.status !== 'wishlist');
  const wishlistOnly = cellarItems.filter(item => item.status === 'wishlist');

  const handleRemoveItem = async (itemId) => {
    await api.removeFromCellar(itemId);
    setCellarItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleMoveToCellar = async (item) => {
    const wine = item.wine || item;
    await api.addToCellar(wine, 'in_cellar');
    if (item.id) {
      await api.removeFromCellar(item.id);
    }
    const updated = await api.getCellar();
    setCellarItems(updated || []);
  };

  const tasteProfile = user?.taste_profile || {
    sweetness_pref: 1.2,
    body_pref: 4.2,
    acidity_pref: 3.4,
    oak_pref: 3.5,
    preferred_categories: ['Красное', 'Белое'],
    favorite_aromas: ['вишня', 'дуб', 'смородина', 'ваниль'],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2a28]/60 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
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

        {/* 4 Tabs Switcher: Погреб, Вишлист, Сканы, Вкус */}
        <div className="grid grid-cols-4 p-1 mx-3 sm:mx-4 mt-3 rounded-2xl bg-[#fdf9ed] border border-[#efdbc6] text-[11px] flex-shrink-0">
          <button
            onClick={() => setActiveTab('cellar')}
            className={`py-1.5 rounded-xl font-medium transition flex items-center justify-center space-x-1 ${
              activeTab === 'cellar' ? 'bg-[#8f3d42] text-white shadow-sm' : 'text-[#857e79] hover:text-[#2c2a28]'
            }`}
          >
            <Wine className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Погреб ({cellarOnly.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`py-1.5 rounded-xl font-medium transition flex items-center justify-center space-x-1 ${
              activeTab === 'wishlist' ? 'bg-[#8f3d42] text-white shadow-sm' : 'text-[#857e79] hover:text-[#2c2a28]'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Вишлист ({wishlistOnly.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('scans')}
            className={`py-1.5 rounded-xl font-medium transition flex items-center justify-center space-x-1 ${
              activeTab === 'scans' ? 'bg-[#8f3d42] text-white shadow-sm' : 'text-[#857e79] hover:text-[#2c2a28]'
            }`}
          >
            <History className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">Сканы ({scanHistory.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('taste')}
            className={`py-1.5 rounded-xl font-medium transition flex items-center justify-center space-x-1 ${
              activeTab === 'taste' ? 'bg-[#8f3d42] text-white shadow-sm' : 'text-[#857e79] hover:text-[#2c2a28]'
            }`}
          >
            <Compass className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Вкус</span>
          </button>
        </div>

        {/* Body Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fefdfa]">
          
          {/* TAB 1: CELLAR (ПОГРЕБ — КУПЛЕННЫЕ ВИНА) */}
          {activeTab === 'cellar' && (
            <div className="space-y-2.5">
              {cellarOnly.length === 0 ? (
                <div className="text-center py-12 text-[#857e79] space-y-2">
                  <Wine className="w-10 h-10 mx-auto text-[#d7d4d2]" />
                  <p className="text-sm font-medium text-[#2c2a28]">Ваш винный погреб пока пуст</p>
                  <p className="text-xs max-w-xs mx-auto text-[#857e79]">
                    Сохраняйте вина, которые вы уже купили или храните в коллекции. Нажмите «В погреб» в карточке вина.
                  </p>
                </div>
              ) : (
                cellarOnly.map((item, idx) => {
                  const wine = item.wine || item;
                  return (
                    <div key={item.id || idx} className="relative group">
                      <WineCard
                        wine={wine}
                        onSelect={(w) => { onClose(); onSelectWine(w); }}
                      />
                      <div className="absolute top-3 right-3 flex items-center space-x-1.5 z-10">
                        {item.bottles_count > 1 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#8f3d42] text-white text-[10px] font-bold shadow-sm">
                            {item.bottles_count} шт.
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id);
                          }}
                          className="p-1.5 rounded-full bg-white/95 hover:bg-red-50 text-[#857e79] hover:text-red-600 transition border border-[#ebe9e9] opacity-75 group-hover:opacity-100 shadow-sm"
                          title="Удалить из погреба"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: WISHLIST (ВИШЛИСТ — ХОЧУ КУПИТЬ) */}
          {activeTab === 'wishlist' && (
            <div className="space-y-2.5">
              {wishlistOnly.length === 0 ? (
                <div className="text-center py-12 text-[#857e79] space-y-2">
                  <Bookmark className="w-10 h-10 mx-auto text-[#d7d4d2]" />
                  <p className="text-sm font-medium text-[#2c2a28]">Ваш вишлист пока пуст</p>
                  <p className="text-xs max-w-xs mx-auto text-[#857e79]">
                    Добавляйте понравившиеся вина в список желаний, чтобы не забыть купить их в винотеке или ресторане.
                  </p>
                </div>
              ) : (
                wishlistOnly.map((item, idx) => {
                  const wine = item.wine || item;
                  return (
                    <div
                      key={item.id || idx}
                      className="p-3.5 rounded-2xl bg-white border border-[#ebe9e9] hover:border-[#8f3d42]/40 transition shadow-sm space-y-2.5"
                    >
                      <div
                        className="flex items-start space-x-3.5 cursor-pointer"
                        onClick={() => { onClose(); onSelectWine(wine); }}
                      >
                        <div className="w-14 h-22 rounded-xl bg-[#fdf9ed] border border-[#efdbc6] overflow-hidden flex-shrink-0 flex items-center justify-center p-1.5 shadow-inner">
                          {wine.image_url ? (
                            <img
                              src={wine.image_url}
                              alt={wine.name}
                              className="w-full h-full object-contain drop-shadow-sm"
                            />
                          ) : (
                            <Wine className="w-6 h-6 text-[#8f3d42]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-[#8f3d42] font-semibold uppercase tracking-wider truncate">
                              {wine.category ? `${wine.category} • ` : ''}{wine.sugar_type || 'Сухое'}
                            </span>
                            {wine.price_rub && (
                              <span className="font-serif font-bold text-sm text-[#2c2a28]">
                                {wine.price_rub} ₽
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif font-semibold text-sm text-[#2c2a28] hover:text-[#8f3d42] transition truncate mt-0.5">
                            {wine.name}
                          </h4>
                          <p className="text-xs text-[#857e79] truncate mt-0.5">
                            {wine.winery || 'Российская винодельня'} {wine.region ? `(${wine.region})` : ''}
                          </p>
                          <div className="mt-1 flex items-center space-x-2 text-[10px] text-[#857e79]">
                            <span>{(wine.grape_varieties || [])[0] || 'Купаж'}</span>
                            {wine.roskachestvo_score && (
                              <span className="text-[#dfa838] font-bold">★ {wine.roskachestvo_score}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons: Move to cellar / Remove */}
                      <div className="flex items-center justify-between pt-2 border-t border-[#f5f0e8]">
                        <button
                          onClick={() => handleMoveToCellar(item)}
                          className="flex-1 mr-2 py-1.5 px-3 rounded-xl bg-[#8f3d42] hover:bg-[#723135] text-white text-xs font-medium flex items-center justify-center space-x-1.5 transition shadow-sm active:scale-98"
                          title="Куплено! Перенести в погреб"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Купил! В погреб</span>
                        </button>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 rounded-xl bg-[#fdf9ed] hover:bg-red-50 text-[#857e79] hover:text-red-600 transition border border-[#efdbc6]"
                          title="Удалить из вишлиста"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: SCAN HISTORY (СКАНИРОВАНИЯ С РУССКИМИ НАЗВАНИЯМИ И ФОТО) */}
          {activeTab === 'scans' && (
            <div className="space-y-2">
              {scanHistory.length === 0 ? (
                <div className="text-center py-12 text-[#857e79] space-y-2">
                  <History className="w-10 h-10 mx-auto text-[#d7d4d2]" />
                  <p className="text-sm font-medium text-[#2c2a28]">История сканирований пуста</p>
                  <p className="text-xs max-w-xs mx-auto text-[#857e79]">
                    Здесь будут сохраняться все распознанные вами винные этикетки с фотографиями и оценками.
                  </p>
                </div>
              ) : (
                scanHistory.map((scan, idx) => {
                  const wine = scan.wine || null;
                  const displayName = wine?.name || scan.wine_name || (scan.predicted_slug ? scan.predicted_slug.replace(/-/g, ' ') : 'Распознанное вино');
                  const displayCategory = wine?.category || scan.wine_category || 'Вино России';
                  const displayWinery = wine?.winery || 'Винодельня России';
                  const displayImage = wine?.image_url || null;

                  return (
                    <div
                      key={scan.id || idx}
                      onClick={() => {
                        if (wine) {
                          onClose();
                          onSelectWine(wine);
                        } else if (scan.predicted_slug) {
                          onClose();
                          onSelectWine({ slug: scan.predicted_slug, name: displayName, category: displayCategory });
                        }
                      }}
                      className="p-3 rounded-2xl bg-white hover:bg-[#fdfbf7] border border-[#ebe9e9] hover:border-[#8f3d42]/40 transition shadow-sm flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-12 h-16 rounded-xl bg-[#fdf9ed] border border-[#efdbc6] overflow-hidden flex-shrink-0 flex items-center justify-center p-1 shadow-inner">
                          {displayImage ? (
                            <img
                              src={displayImage}
                              alt={displayName}
                              className="w-full h-full object-contain group-hover:scale-105 transition duration-300 drop-shadow-sm"
                            />
                          ) : (
                            <Wine className="w-6 h-6 text-[#8f3d42]" />
                          )}
                        </div>
                        <div className="min-w-0 pr-2">
                          <span className="text-[10px] text-[#8f3d42] font-semibold uppercase tracking-wider block">
                            {displayCategory} {wine?.sugar_type ? `• ${wine.sugar_type}` : ''}
                          </span>
                          <h5 className="font-serif font-semibold text-[#2c2a28] text-xs truncate group-hover:text-[#8f3d42] transition">
                            {displayName}
                          </h5>
                          <p className="text-[11px] text-[#857e79] truncate mt-0.5">
                            {displayWinery} • {new Date(scan.created_at || Date.now()).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fdf9ed] text-[#8f3d42] border border-[#efdbc6] font-semibold">
                          {scan.confidence ? `${Math.round(scan.confidence * 100)}%` : 'Распознано'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#857e79] group-hover:text-[#8f3d42] transition group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: AGGREGATED TASTE PROFILE (ВКУСОВОЙ ПРОФИЛЬ) */}
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
