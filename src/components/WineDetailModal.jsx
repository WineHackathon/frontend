import React, { useState, useEffect } from 'react';
import {
  X,
  Award,
  Wine,
  Utensils,
  Bookmark,
  Check,
  Tag,
  Compass,
  Thermometer,
  Calendar,
  Clock,
  Droplets,
  Grape,
  Percent,
  MapPin,
  Sparkles,
  Bot,
  ChevronRight,
  Share2
} from 'lucide-react';
import { api, getAuthToken } from '../services/api';

export default function WineDetailModal({ wine, onClose, onOpenAuth, onAskSommelier }) {
  const [addedStatus, setAddedStatus] = useState(null);
  const [cellarStatus, setCellarStatus] = useState(null); // 'in_cellar' | 'wishlist' | null
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('characteristics'); // 'characteristics' | 'taste' | 'gastronomy'
  const [imgFailed, setImgFailed] = useState(false);

  const isAuth = !!getAuthToken();

  useEffect(() => {
    setImgFailed(false);
    if (!wine) {
      setCellarStatus(null);
      setAddedStatus(null);
      return;
    }
    let isMounted = true;
    api.getCellar().then((items) => {
      if (!isMounted || !Array.isArray(items)) return;
      const found = items.find((item) =>
        (item.wine_id && item.wine_id === wine.id) ||
        (item.wine?.slug && item.wine?.slug === wine.slug) ||
        (item.wine_slug && item.wine_slug === wine.slug)
      );
      if (found) {
        setCellarStatus(found.status || 'in_cellar');
      } else {
        setCellarStatus(null);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [wine]);

  if (!wine) return null;

  const handleAddToCellar = async (status) => {
    if (!isAuth) {
      onOpenAuth({
        title: 'Винный погреб доступен авторизованным',
        subtitle: 'Зарегистрируйтесь, чтобы сохранять вина в личный погреб или вишлист!'
      });
      return;
    }

    setIsSaving(true);
    try {
      await api.addToCellar(wine, status);
      setCellarStatus(status);
      setAddedStatus(status);
      setTimeout(() => setAddedStatus(null), 2500);
    } catch (e) {
      console.error('Error adding to cellar:', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Default dish pairings tailored to category
  const isRed = wine.category?.toLowerCase().includes('красн') || wine.name?.toLowerCase().includes('саперави') || wine.name?.toLowerCase().includes('каберне');
  const defaultDishes = isRed ? [
    {
      name: 'Стейк рибай медиум',
      category: 'Мясо на углях',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=80',
      reason: 'Сочность и насыщенные волокна мяса сглаживают танины вина'
    },
    {
      name: 'Утиная грудка',
      category: 'Птица',
      image: 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&auto=format&fit=crop&q=80',
      reason: 'Ягодные ноты вина великолепно дополняют деликатный вкус дичи'
    },
    {
      name: 'Выдержанный пармезан',
      category: 'Сыры',
      image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&auto=format&fit=crop&q=80',
      reason: 'Кристаллы соли и плотная структура сыра усиливают букет'
    },
    {
      name: 'Телячьи щечки',
      category: 'Томленые блюда',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80',
      reason: 'Пряный соус гармонирует с нотами дубовой выдержки'
    }
  ] : [
    {
      name: 'Устрицы и гребешки',
      category: 'Морепродукты',
      image: 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=300&auto=format&fit=crop&q=80',
      reason: 'Минеральная солоноватость моллюсков подчеркивает свежую кислотность'
    },
    {
      name: 'Филе дорадо на пару',
      category: 'Белая рыба',
      image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&auto=format&fit=crop&q=80',
      reason: 'Нежная текстура рыбы не перебивает тонкие фруктовые ароматы'
    },
    {
      name: 'Сыр Бри и Камамбер',
      category: 'Мягкие сыры',
      image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&auto=format&fit=crop&q=80',
      reason: 'Сливочная сердцевина смягчает цитрусовые ноты вина'
    },
    {
      name: 'Ризотто со спаржей',
      category: 'Паста и ризотто',
      image: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=300&auto=format&fit=crop&q=80',
      reason: 'Травянистая свежесть блюда создает идеальный баланс'
    }
  ];

  const getDishImage = (name = '', category = '', idx = 0) => {
    const text = `${name} ${category}`.toLowerCase();
    if (text.includes('утк') || text.includes('птиц') || text.includes('куриц') || text.includes('индейк')) {
      return 'https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&auto=format&fit=crop&q=80';
    }
    if (text.includes('стейк') || text.includes('мяс') || text.includes('говядин') || text.includes('рибай') || text.includes('телятин')) {
      return 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300&auto=format&fit=crop&q=80';
    }
    if (text.includes('сыр') || text.includes('пармезан') || text.includes('бри') || text.includes('камамбер') || text.includes('чеддер')) {
      return 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300&auto=format&fit=crop&q=80';
    }
    if (text.includes('рыб') || text.includes('дорадо') || text.includes('сибас') || text.includes('лосос') || text.includes('форел')) {
      return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=300&auto=format&fit=crop&q=80';
    }
    if (text.includes('устриц') || text.includes('гребешк') || text.includes('морепродукт') || text.includes('миди') || text.includes('креветк')) {
      return 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=300&auto=format&fit=crop&q=80';
    }
    if (text.includes('паст') || text.includes('ризотто') || text.includes('спагетти')) {
      return 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=300&auto=format&fit=crop&q=80';
    }
    return defaultDishes[idx % defaultDishes.length]?.image;
  };

  const dishes = wine.pairings && wine.pairings.length > 0
    ? wine.pairings.map((p, i) => ({
        name: p.dish_name,
        category: p.food_category || 'Гастрономия',
        image: getDishImage(p.dish_name, p.food_category, i),
        reason: p.recommendation_reason
      }))
    : defaultDishes;

  // AI sommelier starter questions
  const sommelierPrompts = [
    `С чем лучше подать вино ${wine.name}?`,
    `Нужна ли декантация вину ${wine.name}?`,
    `Какая идеальная температура подачи для ${wine.name}?`,
    `Посоветуй похожие российские вина в стиле ${wine.name}`
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2a28]/65 backdrop-blur-md p-2 sm:p-4 overflow-y-auto overflow-x-hidden animate-fadeIn w-full max-w-full">
      
      {/* Container matching vino-svoe.ru card layout */}
      <div className="w-full max-w-4xl rounded-[28px] sm:rounded-[32px] bg-[#fefdfa] border border-[#efdbc6] overflow-hidden shadow-svoe-elevated relative my-auto max-h-[92vh] flex flex-col min-w-0 max-w-full box-border">
        
        {/* Top Breadcrumbs & Close Action Bar */}
        <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-[#efdbc6] bg-[#fdf9ed]/80 backdrop-blur-sm min-w-0">
          {/* Breadcrumbs (vino-svoe.ru exact style) */}
          <nav className="flex items-center space-x-1.5 text-xs text-[#857e79] overflow-hidden truncate min-w-0 mr-2">
            <span className="hover:text-[#7b3528] cursor-pointer flex-shrink-0">Главная</span>
            <ChevronRight className="w-3 h-3 text-[#d7d4d2] flex-shrink-0" />
            <span className="hover:text-[#7b3528] cursor-pointer flex-shrink-0">Каталог вин</span>
            <ChevronRight className="w-3 h-3 text-[#d7d4d2] flex-shrink-0" />
            <span className="text-[#8f3d42] font-medium truncate">{wine.name}</span>
          </nav>

          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: wine.name, url: window.location.href }).catch(() => {});
                }
              }}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#f8ecc9] text-[#857e79] hover:text-[#8f3d42] flex items-center justify-center transition border border-[#efdbc6] shadow-sm"
              title="Поделиться"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white hover:bg-[#f8ecc9] text-[#2c2a28] flex items-center justify-center transition border border-[#efdbc6] shadow-sm active:scale-95"
              title="Закрыть"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Main Content: Two Columns on md+ */}
        <div className="p-3.5 sm:p-6 sm:pb-8 overflow-y-auto overflow-x-hidden bg-[#fefdfa] space-y-6 w-full max-w-full min-w-0 box-border">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start w-full min-w-0">
            
            {/* LEFT COLUMN: Bottle Showcase on Warm Cream Pedestal (vino-svoe.ru style) */}
            <div className="md:col-span-5 flex flex-col items-center w-full min-w-0">
              <div className="w-full relative rounded-3xl bg-gradient-to-b from-[#fdf9ed] via-[#fbf6e8] to-[#fefdfa] border border-[#efdbc6] p-6 pt-8 pb-6 flex flex-col items-center shadow-sm">
                
                {/* Category chip on top of bottle */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8f3d42] bg-white/90 backdrop-blur-sm border border-[#efdbc6] px-3 py-1 rounded-full shadow-sm">
                    {wine.category || 'Вино России'}
                  </span>
                </div>

                {/* Roskachestvo Medal Ribbon */}
                {wine.roskachestvo_score && (
                  <div className="absolute top-4 right-4 z-10 flex items-center space-x-1 bg-[#f8ecc9] border border-[#dfa838]/30 px-2.5 py-1 rounded-full shadow-sm">
                    <Award className="w-3.5 h-3.5 text-[#dfa838]" />
                    <span className="text-[11px] font-bold text-[#8f3d42]">
                      {wine.roskachestvo_score}
                    </span>
                  </div>
                )}

                {/* Bottle Presentation with Pedestal Shadow */}
                <div className="relative my-4 flex items-center justify-center h-64 sm:h-72 w-full">
                  {/* Subtle pedestal circular shadow */}
                  <div className="absolute bottom-2 w-32 h-6 bg-[#2c2a28]/10 rounded-[100%] blur-md"></div>
                  
                  {wine.image_url && !imgFailed ? (
                    <img
                      src={wine.image_url.split('?')[0]}
                      alt=""
                      onError={() => setImgFailed(true)}
                      className="h-full object-contain filter drop-shadow-md z-10 transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    /* Stylized Realistic Wine Bottle Graphic */
                    <div className="relative h-full flex flex-col items-center justify-center z-10 transition-transform duration-300 hover:scale-105">
                      <div className={`w-14 sm:w-16 h-56 rounded-t-2xl rounded-b-xl border-2 border-white shadow-xl flex flex-col items-center overflow-hidden ${
                        isRed ? 'bg-gradient-to-b from-[#4a121a] via-[#722026] to-[#3a0d14]' : 'bg-gradient-to-b from-[#e6dfbe] via-[#f7f0cf] to-[#cfc493]'
                      }`}>
                        {/* Foil Neck Capsule */}
                        <div className="w-full h-12 bg-gradient-to-r from-[#dfa838] via-[#ffd778] to-[#be8e28] border-b border-[#efdbc6] flex items-center justify-center">
                          <span className="text-[8px] font-serif font-bold text-[#2c2a28] tracking-widest">РСХБ</span>
                        </div>
                        {/* Glass Body & Authentic Paper Label */}
                        <div className="flex-1 w-full flex items-center justify-center p-1.5">
                          <div className="w-full h-24 bg-[#fffdf7] rounded-sm p-1 border border-[#ebe5d3] shadow-sm flex flex-col items-center justify-between text-center">
                            <span className="text-[6px] uppercase tracking-widest text-[#857e79] font-medium">Своё Вино</span>
                            <span className="font-serif font-bold text-[8px] text-[#2c2a28] leading-tight line-clamp-2 px-0.5">
                              {wine.name}
                            </span>
                            <div className="w-4 h-[1px] bg-[#8f3d42]"></div>
                            <span className="text-[6px] font-mono text-[#8f3d42] font-semibold">
                              {wine.vintage_year || '2022'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Terroir & Origin Tag */}
                <div className="mt-2 text-center">
                  <span className="text-xs font-medium text-[#2c2a28] flex items-center justify-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#8f3d42]" />
                    <span>{wine.region || 'Кубань. Таманский полуостров'}</span>
                  </span>
                  <span className="text-[11px] text-[#857e79] block mt-0.5">
                    ЗГУ (Защищенное географическое указание)
                  </span>
                </div>

              </div>

              {/* Quick AI-Sommelier Consult Card */}
              <div className="w-full mt-4 p-4 rounded-2xl bg-[#fdf9ed] border border-[#efdbc6] text-left">
                <div className="flex items-center space-x-2 text-[#8f3d42] mb-2 font-semibold text-xs">
                  <Bot className="w-4 h-4" />
                  <span>Персональный совет от ИИ-сомелье</span>
                </div>
                <div className="space-y-1.5">
                  {sommelierPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => onAskSommelier ? onAskSommelier(wine, prompt) : null}
                      className="w-full text-left text-[11px] text-[#2c2a28] hover:text-[#8f3d42] bg-white hover:bg-[#f8ecc9] border border-[#efdbc6]/70 rounded-full px-3 py-1.5 transition flex items-center justify-between group"
                    >
                      <span className="truncate">{prompt}</span>
                      <ChevronRight className="w-3 h-3 text-[#857e79] group-hover:text-[#8f3d42] flex-shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Title, Manufacturer, Public Rating, Specs & Gastronomy */}
            <div className="md:col-span-7 flex flex-col space-y-5 text-left w-full min-w-0">
              
              {/* Main Title Block (wine-main-title-block from vino-svoe.ru) */}
              <div className="border-b border-[#efdbc6] pb-4 min-w-0">
                
                {/* Manufacturer Link */}
                <div className="wine-main-title-block__manufacturer flex items-center space-x-1.5 min-w-0">
                  <span className="text-xs uppercase tracking-wider text-[#857e79] font-semibold flex-shrink-0">Производитель:</span>
                  <span className="text-sm font-medium text-[#7b3528] hover:underline cursor-pointer truncate">
                    {wine.winery || 'Поместье Голубицкое'}
                  </span>
                </div>

                {/* Wine Name in Playfair Display */}
                <h1 className="wine-main-title-block__title text-2xl sm:text-3xl lg:text-4xl break-words">
                  {wine.name}
                </h1>

                {/* Rating & Price Row */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 min-w-0">
                  
                  {/* Public Roskachestvo Badge */}
                  <div className="wine-main-title-block__rating_public shadow-sm max-w-full min-w-0">
                    <Award className="w-4 h-4 text-[#dfa838] flex-shrink-0" />
                    <span className="text-sm font-bold text-[#8f3d42] flex-shrink-0">
                      {wine.roskachestvo_score ? `${wine.roskachestvo_score} / 100` : '4.87 / 5'}
                    </span>
                    <span className="text-[11px] text-[#7b3528] font-medium border-l border-[#dfa838]/30 pl-2 truncate min-w-0">
                      Роскачество «Винный гид»
                    </span>
                  </div>

                  {/* Cellar / Wishlist Status Badge */}
                  {cellarStatus === 'in_cellar' && (
                    <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] text-xs font-semibold shadow-sm">
                      <Check className="w-3.5 h-3.5 text-[#059669]" />
                      <span>В вашем погребе</span>
                    </div>
                  )}
                  {cellarStatus === 'wishlist' && (
                    <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#fffbeb] border border-[#fde68a] text-[#92400e] text-xs font-semibold shadow-sm">
                      <Bookmark className="w-3.5 h-3.5 text-[#d97706]" />
                      <span>В вашем вишлисте</span>
                    </div>
                  )}

                  {/* Price */}
                  {wine.price_rub ? (
                    <div className="flex items-baseline space-x-1">
                      <span className="text-xs text-[#857e79]">цена:</span>
                      <span className="font-serif font-bold text-2xl text-[#8f3d42]">
                        ~{wine.price_rub} ₽
                      </span>
                    </div>
                  ) : null}

                </div>

              </div>

              {/* Navigation Tabs for Details */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 border-b border-[#ebe9e9] pb-2 text-xs font-semibold overflow-x-auto no-scrollbar w-full max-w-full min-w-0">
                <button
                  onClick={() => setActiveTab('characteristics')}
                  className={`pb-2 px-2.5 sm:px-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'characteristics'
                      ? 'border-[#8f3d42] text-[#8f3d42]'
                      : 'border-transparent text-[#857e79] hover:text-[#2c2a28]'
                  }`}
                >
                  Характеристики
                </button>
                <button
                  onClick={() => setActiveTab('taste')}
                  className={`pb-2 px-2.5 sm:px-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'taste'
                      ? 'border-[#8f3d42] text-[#8f3d42]'
                      : 'border-transparent text-[#857e79] hover:text-[#2c2a28]'
                  }`}
                >
                  Вкусовой профиль
                </button>
                <button
                  onClick={() => setActiveTab('gastronomy')}
                  className={`pb-2 px-2.5 sm:px-3 border-b-2 transition whitespace-nowrap flex-shrink-0 ${
                    activeTab === 'gastronomy'
                      ? 'border-[#8f3d42] text-[#8f3d42]'
                      : 'border-transparent text-[#857e79] hover:text-[#2c2a28]'
                  }`}
                >
                  Гастрономия
                </button>
              </div>

              {/* TAB 1: Key Characteristics (wine-detail-info authentic cards) */}
              {activeTab === 'characteristics' && (
                <div className="space-y-4 w-full min-w-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
                    
                    {/* 1. Цвет и категория */}
                    <div className="wine-detail-info__detail p-3 rounded-2xl bg-[#fdf9ed]/60 border border-[#efdbc6]/80 min-w-0">
                      <div className="wine-detail-info__detail-image text-[#8f3d42] flex-shrink-0">
                        <Droplets className="w-5 h-5 text-[#8f3d42]" />
                      </div>
                      <div className="wine-detail-info__detail-content min-w-0">
                        <p className="wine-detail-info__detail-label">Цвет и тип</p>
                        <p className="wine-detail-info__detail-value break-words">
                          {wine.category || 'Белое'}, {wine.sugar_type || 'Сухое'}
                        </p>
                      </div>
                    </div>

                    {/* 2. Сортовой состав */}
                    <div className="wine-detail-info__detail p-3 rounded-2xl bg-[#fdf9ed]/60 border border-[#efdbc6]/80 min-w-0">
                      <div className="wine-detail-info__detail-image text-[#7b3528] flex-shrink-0">
                        <Grape className="w-5 h-5 text-[#7b3528]" />
                      </div>
                      <div className="wine-detail-info__detail-content min-w-0">
                        <p className="wine-detail-info__detail-label">Сортовой состав</p>
                        <p className="wine-detail-info__detail-value break-words">
                          {(wine.grape_varieties || []).join(', ') || 'Шардоне 100%'}
                        </p>
                      </div>
                    </div>

                    {/* 3. Крепость / Алкоголь */}
                    <div className="wine-detail-info__detail p-3 rounded-2xl bg-[#fdf9ed]/60 border border-[#efdbc6]/80 min-w-0">
                      <div className="wine-detail-info__detail-image text-[#8f3d42] flex-shrink-0">
                        <Percent className="w-5 h-5 text-[#8f3d42]" />
                      </div>
                      <div className="wine-detail-info__detail-content min-w-0">
                        <p className="wine-detail-info__detail-label">Крепость</p>
                        <p className="wine-detail-info__detail-value break-words">
                          {wine.alcohol_pct ? `${wine.alcohol_pct}% об.` : '12.5–13.5% об.'}
                        </p>
                      </div>
                    </div>

                    {/* 4. Сахар */}
                    <div className="wine-detail-info__detail p-3 rounded-2xl bg-[#fdf9ed]/60 border border-[#efdbc6]/80 min-w-0">
                      <div className="wine-detail-info__detail-image text-[#dfa838] flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-[#dfa838]" />
                      </div>
                      <div className="wine-detail-info__detail-content min-w-0">
                        <p className="wine-detail-info__detail-label">Сахар</p>
                        <p className="wine-detail-info__detail-value break-words">
                          {wine.sugar_type || 'Сухое'} (до 4.0 г/дм³)
                        </p>
                      </div>
                    </div>

                    {/* 5. Год урожая (Винтаж) */}
                    <div className="wine-detail-info__detail p-3 rounded-2xl bg-[#fdf9ed]/60 border border-[#efdbc6]/80 min-w-0">
                      <div className="wine-detail-info__detail-image text-[#2c2a28] flex-shrink-0">
                        <Calendar className="w-5 h-5 text-[#2c2a28]" />
                      </div>
                      <div className="wine-detail-info__detail-content min-w-0">
                        <p className="wine-detail-info__detail-label">Год урожая</p>
                        <p className="wine-detail-info__detail-value break-words">
                          {wine.vintage_year ? `${wine.vintage_year} год` : '2022 год'}
                        </p>
                      </div>
                    </div>

                    {/* 6. Температура подачи */}
                    <div className="wine-detail-info__detail p-3 rounded-2xl bg-[#fdf9ed]/60 border border-[#efdbc6]/80 min-w-0">
                      <div className="wine-detail-info__detail-image text-[#4b7b65] flex-shrink-0">
                        <Thermometer className="w-5 h-5 text-[#4b7b65]" />
                      </div>
                      <div className="wine-detail-info__detail-content min-w-0">
                        <p className="wine-detail-info__detail-label">Температура подачи</p>
                        <p className="wine-detail-info__detail-value break-words">
                          {isRed ? '16–18 °C' : '10–12 °C'}
                        </p>
                      </div>
                    </div>

                    {/* 7. Потенциал выдержки */}
                    <div className="wine-detail-info__detail p-3 rounded-2xl bg-[#fdf9ed]/60 border border-[#efdbc6]/80 min-w-0">
                      <div className="wine-detail-info__detail-image text-[#b87333] flex-shrink-0">
                        <Clock className="w-5 h-5 text-[#b87333]" />
                      </div>
                      <div className="wine-detail-info__detail-content min-w-0">
                        <p className="wine-detail-info__detail-label">Потенциал выдержки</p>
                        <p className="wine-detail-info__detail-value break-words">
                          {isRed ? '5–8 лет' : '3–5 лет'}
                        </p>
                      </div>
                    </div>

                    {/* 8. Терруар / Регион */}
                    <div className="wine-detail-info__detail p-3 rounded-2xl bg-[#fdf9ed]/60 border border-[#efdbc6]/80 min-w-0">
                      <div className="wine-detail-info__detail-image text-[#7b3528] flex-shrink-0">
                        <Compass className="w-5 h-5 text-[#7b3528]" />
                      </div>
                      <div className="wine-detail-info__detail-content min-w-0">
                        <p className="wine-detail-info__detail-label">Терруар</p>
                        <p className="wine-detail-info__detail-value break-words" title={wine.region || 'Кубань. Таманский полуостров'}>
                          {wine.region || 'Кубань. Таманский п-ов'}
                        </p>
                      </div>
                    </div>

                  </div>

                  {/* Sommelier Tasting Note */}
                  {wine.description && (
                    <div className="p-4 rounded-2xl bg-white border border-[#ebe9e9] shadow-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#857e79] mb-1.5 flex items-center space-x-1.5">
                        <Wine className="w-4 h-4 text-[#8f3d42]" />
                        <span>Описание сомелье</span>
                      </h4>
                      <p className="text-sm text-[#2c2a28] leading-relaxed font-serif italic">
                        «{wine.description}»
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Taste Matrix & Aromatics */}
              {activeTab === 'taste' && (
                <div className="space-y-4">
                  {/* 4D Matrix Bars */}
                  <div className="p-4 rounded-2xl bg-[#fdf9ed] border border-[#efdbc6] shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#8f3d42] flex items-center space-x-1.5">
                        <Compass className="w-4 h-4" />
                        <span>4D Вкусовая матрица</span>
                      </h4>
                      <span className="text-[10px] text-[#857e79]">Шкала от 1 до 5</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* Sweetness */}
                      <div>
                        <div className="flex justify-between text-[#2c2a28] text-[11px] mb-1">
                          <span className="font-medium">Сладость</span>
                          <span className="font-mono font-bold text-[#dfa838]">{wine.sweetness || 1.2} / 5</span>
                        </div>
                        <div className="h-2 rounded-full bg-white border border-[#efdbc6] overflow-hidden">
                          <div
                            className="h-full bg-[#dfa838] rounded-full transition-all duration-700"
                            style={{ width: `${((wine.sweetness || 1.2) / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Body */}
                      <div>
                        <div className="flex justify-between text-[#2c2a28] text-[11px] mb-1">
                          <span className="font-medium">Тельность и плотность</span>
                          <span className="font-mono font-bold text-[#8f3d42]">{wine.body || 3.0} / 5</span>
                        </div>
                        <div className="h-2 rounded-full bg-white border border-[#efdbc6] overflow-hidden">
                          <div
                            className="h-full bg-[#8f3d42] rounded-full transition-all duration-700"
                            style={{ width: `${((wine.body || 3.0) / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Acidity */}
                      <div>
                        <div className="flex justify-between text-[#2c2a28] text-[11px] mb-1">
                          <span className="font-medium">Свежесть и кислотность</span>
                          <span className="font-mono font-bold text-[#4b7b65]">{wine.acidity || 3.2} / 5</span>
                        </div>
                        <div className="h-2 rounded-full bg-white border border-[#efdbc6] overflow-hidden">
                          <div
                            className="h-full bg-[#4b7b65] rounded-full transition-all duration-700"
                            style={{ width: `${((wine.acidity || 3.2) / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Tannins / Oak */}
                      <div>
                        <div className="flex justify-between text-[#2c2a28] text-[11px] mb-1">
                          <span className="font-medium">Танины и выдержка в дубе</span>
                          <span className="font-mono font-bold text-[#b87333]">{wine.oak || 2.0} / 5</span>
                        </div>
                        <div className="h-2 rounded-full bg-white border border-[#efdbc6] overflow-hidden">
                          <div
                            className="h-full bg-[#b87333] rounded-full transition-all duration-700"
                            style={{ width: `${((wine.oak || 2.0) / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Aroma & Palate Tags */}
                  <div className="p-4 rounded-2xl bg-white border border-[#ebe9e9] shadow-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#857e79] mb-2.5 flex items-center space-x-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#8f3d42]" />
                      <span>Дескрипторы вкуса и аромата</span>
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(wine.aroma_tags && wine.aroma_tags.length > 0 ? wine.aroma_tags : ['Белый персик', 'Цитрусовые', 'Минералы', 'Белые цветы', 'Сливочное масло']).map((tag, idx) => (
                        <span
                          key={`aroma-${idx}`}
                          className="px-3 py-1 rounded-full bg-[#f9f1f1] border border-[#edd4d6] text-[#8f3d42] text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                      {(wine.flavor_tags || ['Долгое послевкусие', 'Округлая свежесть']).map((tag, idx) => (
                        <span
                          key={`flavor-${idx}`}
                          className="px-3 py-1 rounded-full bg-white border border-[#d7d4d2] text-[#2c2a28] text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Gastronomy (wine-dishes-list & wine-dish-item) */}
              {activeTab === 'gastronomy' && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="wine-dishes-list-icon">
                      <Utensils className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="wine-dishes-list-label">Гастрономические рекомендации</h4>
                      <p className="text-xs text-[#857e79]">Идеальные сочетания с блюдами русской и европейской кухни</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {dishes.map((dish, idx) => (
                      <div key={idx} className="wine-dish-item">
                        <img
                          src={dish.image}
                          alt={dish.name}
                          className="wine-dish-item__image"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                        <h5 className="wine-dish-item__name">
                          {dish.name}
                        </h5>
                        <span className="text-[9px] text-[#857e79] font-normal">
                          {dish.category}
                        </span>
                        {dish.reason && (
                          <p className="text-[9px] text-[#857e79] text-center line-clamp-2 mt-0.5">
                            {dish.reason}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

        {/* Footer Actions: Exact vino-svoe.ru Primary & Secondary buttons */}
        <div className="p-3.5 sm:p-5 bg-[#fdf9ed] border-t border-[#efdbc6] flex flex-wrap items-center justify-between gap-3 w-full min-w-0">
          
          {wine.price_rub ? (
            <div className="flex items-baseline space-x-2 min-w-0">
              <span className="text-xs text-[#857e79]">Ориентир цены:</span>
              <span className="font-serif font-bold text-lg sm:text-xl text-[#8f3d42]">
                ~{wine.price_rub} ₽
              </span>
            </div>
          ) : <div />}

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-1 sm:flex-initial justify-end min-w-0">
            {/* Wishlist Button */}
            <button
              onClick={() => handleAddToCellar('wishlist')}
              disabled={isSaving || cellarStatus === 'wishlist' || cellarStatus === 'in_cellar'}
              className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-full border text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-sm shrink-0 sm:shrink ${
                cellarStatus === 'wishlist'
                  ? 'bg-[#fffbeb] border-[#fde68a] text-[#92400e] cursor-default'
                  : cellarStatus === 'in_cellar'
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-white hover:bg-[#f8ecc9] border-[#efdbc6] text-[#8f3d42] active:scale-95'
              }`}
              title={cellarStatus === 'in_cellar' ? 'Вино уже в вашем погребе' : 'Добавить в вишлист'}
            >
              {addedStatus === 'wishlist' || cellarStatus === 'wishlist' ? (
                <>
                  <Check className="w-4 h-4 text-[#d97706]" />
                  <span>В вишлисте</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-[#8f3d42]" />
                  <span>В вишлист</span>
                </>
              )}
            </button>

            {/* Primary Add to Cellar Button */}
            <button
              onClick={() => handleAddToCellar('in_cellar')}
              disabled={isSaving || cellarStatus === 'in_cellar'}
              className={`flex-1 sm:flex-initial font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-full text-xs sm:text-sm flex items-center justify-center space-x-2 transition shadow-sm min-w-0 sm:min-w-[170px] ${
                cellarStatus === 'in_cellar'
                  ? 'bg-[#ecfdf5] border border-[#a7f3d0] text-[#065f46] cursor-default'
                  : 'svoe-btn-primary bg-[#8f3d42] hover:bg-[#ab494f] text-white active:scale-95'
              }`}
            >
              {addedStatus === 'in_cellar' || cellarStatus === 'in_cellar' ? (
                <>
                  <Check className="w-4 h-4 text-[#059669]" />
                  <span>Уже в погребе</span>
                </>
              ) : (
                <>
                  <Wine className="w-4 h-4 text-white" />
                  <span>{cellarStatus === 'wishlist' ? 'Куплено! В погреб' : 'В мой погреб'}</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
