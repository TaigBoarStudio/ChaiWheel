import React from "react";
import { X, Calendar, MapPin, Award, Thermometer, Clock, RefreshCw } from "lucide-react";
import { Tea } from "../types";
import { FLAVOR_CATEGORIES } from "../data/flavors";

interface TeaDetailProps {
  tea: Tea;
  onClose: () => void;
  onClearSelection: () => void;
}

export const TeaDetail: React.FC<TeaDetailProps> = ({ tea, onClose, onClearSelection }) => {
  return (
    <div id={`tea-detail-modal-${tea.id}`} className="bg-[#121417] border border-white/5 rounded-3xl p-6 md:p-8 max-w-2xl w-full mx-auto shadow-2xl relative">
      
      {/* Absolute Close */}
      <button
        onClick={onClose}
        id="close-detail-modal-btn"
        className="absolute right-5 top-5 text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-xl transition-all cursor-pointer"
        title="Закрыть"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Title block */}
      <div className="mb-6 border-b border-white/5 pb-5 pr-10">
        <span className="text-[10px] font-mono font-bold tracking-widest px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg uppercase">
          {tea.type}
        </span>
        <h2 className="text-xl md:text-2xl font-bold text-white mt-3 font-sans tracking-tight">
          {tea.name}
        </h2>
        
        {/* Rating Stars */}
        <div className="flex items-center gap-1 mt-2">
          {[1, 2, 3, 4, 5].map(star => (
            <span key={star} className="text-lg">
              {star <= tea.rating ? (
                <span className="text-emerald-400">★</span>
              ) : (
                <span className="text-slate-800">☆</span>
              )}
            </span>
          ))}
          <span className="text-xs text-slate-500 font-mono ml-1.5">
            добавлено: {new Date(tea.dateAdded).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
      </div>

      {/* Grid: Stats and Brewing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        
        {/* Origin & Info */}
        <div className="space-y-2.5 p-4 bg-[#1C1F24] border border-white/5 rounded-2xl">
          <div className="flex items-center gap-2.5 text-xs">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">Происхождение</span>
              <span className="text-slate-200 font-medium">{tea.origin}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <Calendar className="w-4 h-4 text-emerald-450 shrink-0" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">Год урожая</span>
              <span className="text-slate-200 font-medium">{tea.year} год</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <Award className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">Производитель / Сбор</span>
              <span className="text-slate-200 font-medium">{tea.producer}</span>
            </div>
          </div>
        </div>

        {/* Brewing guidelines */}
        <div className="space-y-2.5 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
          <h4 className="text-[10px] font-mono tracking-widest text-emerald-400 uppercase font-semibold mb-1">Рецепт заваривания</h4>

          <div className="flex items-center gap-2.5 text-xs">
            <Thermometer className="w-4 h-4 text-emerald-450 shrink-0" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">Вода</span>
              <span className="text-slate-200 font-medium font-mono">{tea.brewTemp} °C</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <Clock className="w-4 h-4 text-emerald-450 shrink-0" />
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-mono tracking-wider">Экспозиция</span>
              <span className="text-slate-200 font-medium font-mono">{tea.brewTime}</span>
            </div>
          </div>
          
          <div className="text-[10px] text-emerald-500/85 leading-relaxed font-sans">
            * Рекомендуется заваривать методом пролива (гунфу ча) в глиняном чайнике или гайвани для раскрытия всех нюансов.
          </div>
        </div>

      </div>

      {/* Tasting notes */}
      <div className="mb-6">
        <h4 className="text-xs font-mono tracking-widest text-slate-400 uppercase font-bold mb-2">Органолептический профиль</h4>
        <p className="text-sm bg-[#1C1F24]/50 border border-white/5 p-4 rounded-2xl text-slate-300 leading-relaxed italic shadow-sm">
          &ldquo;{tea.notes}&rdquo;
        </p>
      </div>

      {/* Associated flavors list colored by wheel code */}
      <div>
        <h4 className="text-xs font-mono tracking-widest text-slate-400 uppercase font-bold mb-2.5">
          Детали вкусового спектра ({tea.flavors.length})
        </h4>
        <div className="flex flex-wrap gap-2">
          {tea.flavors.map(flavor => {
            // Find parent category to fetch color
            const cat = FLAVOR_CATEGORIES.find(c => c.items.includes(flavor));
            return (
              <div
                key={flavor}
                style={{ borderColor: cat ? cat.color : "#333", backgroundColor: cat ? `${cat.color}20` : "#1b1d22" }}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-transform hover:scale-105 duration-100"
              >
                <span
                  style={{ backgroundColor: cat ? cat.color : "#555" }}
                  className="w-2 h-2 rounded-full shadow-sm"
                />
                <span className="text-slate-200">{flavor}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action bar */}
      <div className="mt-8 border-t border-white/5 pt-5 flex justify-between items-center text-xs text-slate-500">
        <span className="font-mono">Каталог чая &bull; Колесо вкусов</span>
        <button
          onClick={onClearSelection}
          className="text-slate-400 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-white/5 transition-all font-mono uppercase font-semibold cursor-pointer"
          id="focus-unselect-btn"
        >
          <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
          Снять фокус на колесе
        </button>
      </div>

    </div>
  );
};
