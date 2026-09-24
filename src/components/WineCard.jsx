import React from 'react';
import { Wine, Award, ChevronRight } from 'lucide-react';

export default function WineCard({ wine, onSelect }) {
  if (!wine) return null;

  return (
    <div
      onClick={() => onSelect(wine)}
      className="w-full bg-white hover:bg-[#fdfbf7] border border-[#ebe9e9] hover:border-[#8f3d42]/50 rounded-[24px] p-3.5 transition duration-200 cursor-pointer text-left group shadow-sm hover:shadow-svoe-card transform hover:-translate-y-0.5"
    >
      <div className="flex items-start space-x-3.5">
        {/* Wine thumbnail image or bottle icon */}
        <div className="w-16 h-28 rounded-2xl bg-[#fdf9ed] border border-[#efdbc6] overflow-hidden flex-shrink-0 relative flex items-center justify-center p-1.5 shadow-inner">
          {wine.image_url ? (
            <img
              src={wine.image_url}
              alt={wine.name}
              className="w-full h-full object-contain group-hover:scale-105 transition duration-300 drop-shadow-md"
            />
          ) : (
            <Wine className="w-8 h-8 text-[#8f3d42]" />
          )}
        </div>

        {/* Content & Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] text-[#8f3d42] font-semibold uppercase tracking-wider truncate">
              {wine.category ? `${wine.category} • ` : ''}{wine.sugar_type || 'Сухое'} {wine.vintage_year ? `• ${wine.vintage_year}` : ''}
            </span>
            {/* Roskachestvo rating badge (exact vino-svoe.ru wine-item-rating) */}
            {wine.roskachestvo_score && (
              <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#f8ecc9] text-[#8f3d42] shadow-sm flex-shrink-0 ml-1">
                <Award className="w-3 h-3 text-[#dfa838]" />
                <span className="font-sans text-[11px] font-bold text-[#2c2a28]">{wine.roskachestvo_score}</span>
              </div>
            )}
          </div>

          {/* Wine Name in Playfair Display serif */}
          <h4 className="font-serif font-semibold text-[14.5px] text-[#2c2a28] mt-1 line-clamp-1 group-hover:text-[#8f3d42] transition leading-snug">
            {wine.name}
          </h4>

          {/* Winery and Region */}
          <p className="text-xs text-[#857e79] line-clamp-1 mt-0.5">
            {wine.winery || 'Российская винодельня'} • {wine.region || 'Кубань'}
          </p>

          {/* Price & Grape Variety */}
          <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-[#ebe9e9] text-xs">
            {wine.price_rub ? (
              <span className="font-serif font-bold text-sm text-[#2c2a28]">
                {wine.price_rub} ₽
              </span>
            ) : null}
            <span className={`text-[10px] text-[#857e79] font-medium truncate ${!wine.price_rub ? 'w-full' : 'max-w-[140px]'}`}>
              {(wine.grape_varieties || [])[0] || 'Классический купаж'}
            </span>
          </div>

          {/* Mini 4D Taste Matrix Scales (Sweetness, Body, Acidity, Oak) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-2.5 gap-y-1.5 mt-2 pt-2 border-t border-[#ebe9e9] text-[9px]">
            <div>
              <div className="flex justify-between items-center text-[#857e79] text-[8.5px] font-medium mb-0.5">
                <span className="truncate">Сладость</span>
                <span className="font-mono text-[#dfa838] text-[8px]">{wine.sweetness || 1.2}</span>
              </div>
              <div className="h-1 rounded-full bg-[#ebe9e9] overflow-hidden">
                <div
                  className="h-full bg-[#dfa838] rounded-full"
                  style={{ width: `${((wine.sweetness || 1.2) / 5) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center text-[#857e79] text-[8.5px] font-medium mb-0.5">
                <span className="truncate">Тело</span>
                <span className="font-mono text-[#8f3d42] text-[8px]">{wine.body || 3.0}</span>
              </div>
              <div className="h-1 rounded-full bg-[#ebe9e9] overflow-hidden">
                <div
                  className="h-full bg-[#8f3d42] rounded-full"
                  style={{ width: `${((wine.body || 3.0) / 5) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center text-[#857e79] text-[8.5px] font-medium mb-0.5">
                <span className="truncate">Кислотность</span>
                <span className="font-mono text-[#4b7b65] text-[8px]">{wine.acidity || 3.0}</span>
              </div>
              <div className="h-1 rounded-full bg-[#ebe9e9] overflow-hidden">
                <div
                  className="h-full bg-[#4b7b65] rounded-full"
                  style={{ width: `${((wine.acidity || 3.0) / 5) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center text-[#857e79] text-[8.5px] font-medium mb-0.5">
                <span className="truncate">Дуб</span>
                <span className="font-mono text-[#b87333] text-[8px]">{wine.oak || 2.0}</span>
              </div>
              <div className="h-1 rounded-full bg-[#ebe9e9] overflow-hidden">
                <div
                  className="h-full bg-[#b87333] rounded-full"
                  style={{ width: `${((wine.oak || 2.0) / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
