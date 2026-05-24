import React, { useState } from "react";
import { Plus, X, Search, Check, AlertCircle } from "lucide-react";
import { FLAVOR_CATEGORIES } from "../data/flavors";
import { Tea } from "../types";

interface TeaFormProps {
  onAddTea: (newTea: Tea) => void;
  onClose: () => void;
  selectedFlavors?: string[];
  setSelectedFlavors?: React.Dispatch<React.SetStateAction<string[]>>;
}

export const TeaForm: React.FC<TeaFormProps> = ({
  onAddTea,
  onClose,
  selectedFlavors: propSelectedFlavors,
  setSelectedFlavors: propSetSelectedFlavors,
}) => {
  // Form values state
  const [name, setName] = useState("");
  const [type, setType] = useState("Шу Пуэр");
  const [author, setAuthor] = useState("Александр"); // "Александр" or "Дмитрий"
  const [origin, setOrigin] = useState("");
  const [year, setYear] = useState<number | "">(new Date().getFullYear());
  const [producer, setProducer] = useState("");
  const [rating, setRating] = useState(5);
  const [brewTemp, setBrewTemp] = useState<number>(95);
  const [brewTime, setBrewTime] = useState("20-30 сек");
  const [notes, setNotes] = useState("");
  
  // Selected flavors from the wheel
  const [localSelectedFlavors, setLocalSelectedFlavors] = useState<string[]>([]);
  const selectedFlavors = propSelectedFlavors !== undefined ? propSelectedFlavors : localSelectedFlavors;
  const setSelectedFlavors = propSetSelectedFlavors !== undefined ? propSetSelectedFlavors : setLocalSelectedFlavors;
  
  // Visual search/filter for flavors in the form
  const [flavorSearch, setFlavorSearch] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("earthy");

  // Validation state
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Core tea types predefined for quick selection
  const TEA_TYPES = [
    "Шу Пуэр",
    "Шэн Пуэр",
    "Сильнопрогретый Улун",
    "Слабопрогретый Улун",
    "Тайваньский Улун",
    "Красный чай",
    "Зеленый чай",
    "Белый чай",
    "Желтый чай",
    "Габа чай",
    "Травяной сбор"
  ];

  const handleToggleFlavor = (flavor: string) => {
    if (selectedFlavors.includes(flavor)) {
      setSelectedFlavors(selectedFlavors.filter(f => f !== flavor));
    } else {
      setSelectedFlavors([...selectedFlavors, flavor]);
    }
  };

  // Field validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!name.trim()) newErrors.name = "Название чая обязательно";
    else if (name.trim().length < 3) newErrors.name = "Название должно быть не менее 3 символов";

    if (!origin.trim()) newErrors.origin = "Происхождение (регион) обязательно для заполнения";

    const currentYear = new Date().getFullYear();
    if (year === "" || Number.isNaN(year)) {
      newErrors.year = "Год урожая обязателен";
    } else if (Number(year) < 1800 || Number(year) > currentYear + 1) {
      newErrors.year = `Введите корректный год (1800 - ${currentYear + 1})`;
    }

    if (brewTemp < 50 || brewTemp > 100) {
      newErrors.brewTemp = "Температура заваривания должна быть в диапазоне от 50°C до 100°C";
    }

    if (!notes.trim()) {
      newErrors.notes = "Заметки дегустатора обязательны";
    } else if (notes.trim().length < 10) {
      newErrors.notes = "Опишите подробнее ваши ощущения (минимум 10 символов)";
    }

    if (selectedFlavors.length === 0) {
      newErrors.flavors = "Выберите хотя бы один аромат/вкус на колесе";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const newTea: Tea = {
      id: "tea_" + Date.now(),
      name: name.trim(),
      type,
      origin: origin.trim(),
      year: Number(year),
      producer: producer.trim() || "Неизвестен",
      rating,
      brewTemp,
      brewTime: brewTime.trim() || `${brewTemp > 90 ? "15-30" : "10-25"} сек`,
      flavors: selectedFlavors,
      notes: notes.trim(),
      dateAdded: new Date().toISOString(),
      author
    };

    onAddTea(newTea);
  };

  // Filter flavors by search term in real-time
  const filteredFlavors = FLAVOR_CATEGORIES.map(category => {
    const matchingItems = category.items.filter(item =>
      item.toLowerCase().includes(flavorSearch.toLowerCase())
    );
    return {
      ...category,
      items: matchingItems
    };
  }).filter(category => category.items.length > 0);

  return (
    <div id="add-tea-form-container" className="bg-[#121417] border border-white/5 rounded-3xl p-6 md:p-8 max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto shadow-2xl relative scrollbar-thin scrollbar-thumb-[#1C1F24]">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
        <div>
          <h2 id="form-heading" className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            Новая чайная дегустация
          </h2>
          <p className="text-xs text-slate-400 mt-1">Добавление записи в журнал и синхронизация по API</p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white hover:bg-white/5 p-2 rounded-xl transition-all cursor-pointer"
          id="close-form-btn"
          type="button"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core fields validation error banner */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-950/40 border border-red-500/30 p-4 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Пожалуйста, исправьте следующие ошибки:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                {Object.values(errors).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT COLUMN - TEXT FIELDS */}
          <div className="space-y-4">
            
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">
                Кто дегустирует <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["Александр", "Дмитрий"].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setAuthor(u)}
                    className={`px-4 py-2.5 rounded-xl border text-xs font-semibold uppercase font-mono tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      author === u
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-md"
                        : "bg-[#1C1F24] border-white/5 hover:border-emerald-500/35 text-slate-400"
                    }`}
                  >
                    <span 
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        author === u ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] scale-110" : "bg-slate-700"
                      }`} 
                    />
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">
                Название чая <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="например, Те Гуань Инь «Нянь Хуа»"
                className={`w-full bg-[#1C1F24] border ${errors.name ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/40`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">
                  Вид / Категория <span className="text-red-400">*</span>
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full bg-[#1C1F24] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/40 appearance-none cursor-pointer"
                >
                  {TEA_TYPES.map(t => (
                    <option key={t} value={t} className="bg-[#121417]">{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">
                  Год сбора <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={year === "" ? "" : year}
                  onChange={e => setYear(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="2026"
                  className={`w-full bg-[#1C1F24] border ${errors.year ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-emerald-500/40`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">
                  Регион сбора <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  placeholder="Юньнань, Мэнхай"
                  className={`w-full bg-[#1C1F24] border ${errors.origin ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-emerald-500/40`}
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">
                  Производитель
                </label>
                <input
                  type="text"
                  value={producer}
                  onChange={e => setProducer(e.target.value)}
                  placeholder="например, DaoChai"
                  className="w-full bg-[#1C1F24] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-emerald-500/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">
                  Заваривание (°C) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={brewTemp}
                  onChange={e => setBrewTemp(Number(e.target.value))}
                  min={50}
                  max={100}
                  className="w-full bg-[#1C1F24] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">
                  Экспозиция / Время
                </label>
                <input
                  type="text"
                  value={brewTime}
                  onChange={e => setBrewTime(e.target.value)}
                  placeholder="20 сек проливом"
                  className="w-full bg-[#1C1F24] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-emerald-500/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">
                Личная Оценка чая
              </label>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                   <button
                     key={star}
                     type="button"
                     onClick={() => setRating(star)}
                     className="text-2xl transition-transform hover:scale-115 duration-100 cursor-pointer text-slate-800"
                   >
                     {star <= rating ? (
                       <span className="text-emerald-400">★</span>
                     ) : (
                       <span className="text-slate-800">☆</span>
                     )}
                   </button>
                ))}
                <span className="text-xs text-slate-500 font-mono ml-2">({rating} из 5)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5 font-semibold">
                Заметки дегустатора <span className="text-red-400">*</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Как пахнет сухой лист? Каков настой на вкус? Какое послевкусие? Опишите ваши впечатления от чаепития..."
                rows={4}
                className={`w-full bg-[#1C1F24] border ${errors.notes ? "border-red-500" : "border-white/10"} rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-650 focus:outline-none focus:border-emerald-500/40 resize-none`}
              />
            </div>

          </div>

          {/* RIGHT COLUMN - VISUAL FLAVOR SELECTOR */}
          <div className="space-y-4 flex flex-col h-full max-h-[500px]">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1 font-semibold">
                Выберите вкусы с колеса <span className="text-red-400">*</span>
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Выбранные вкусы встроятся в интерактивное колесо дегустаций ({selectedFlavors.length} выбрано)
              </p>
            </div>

            {/* Selected Tags list */}
            {selectedFlavors.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-3.5 bg-[#121417]/90 border border-white/5 rounded-2xl max-h-[100px] overflow-y-auto">
                {selectedFlavors.map(flavor => {
                  const cat = FLAVOR_CATEGORIES.find(c => c.items.includes(flavor));
                  return (
                    <span
                      key={flavor}
                      style={{ backgroundColor: `${cat?.color}30`, borderColor: cat?.color }}
                      className="text-[11px] font-medium text-slate-200 border px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0"
                    >
                      {flavor}
                      <button
                        type="button"
                        onClick={() => handleToggleFlavor(flavor)}
                        className="hover:bg-white/10 p-0.5 rounded-md cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Search items inside the wheel */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={flavorSearch}
                onChange={e => setFlavorSearch(e.target.value)}
                placeholder="Поиск по 155 ароматам..."
                className="w-full bg-[#1C1F24] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/40"
              />
              {flavorSearch && (
                <button
                  type="button"
                  onClick={() => setFlavorSearch("")}
                  className="text-slate-500 hover:text-white absolute right-3 top-1/2 -translate-y-1/2 text-xs cursor-pointer"
                >
                  Очистить
                </button>
              )}
            </div>

            {/* Flavor Directory */}
            <div className="border border-white/5 rounded-2xl flex-1 overflow-y-auto bg-[#1C1F24]/30">
              {filteredFlavors.map(category => (
                <div key={category.id} className="border-b border-white/5 last:border-0">
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                    className="w-full flex justify-between items-center px-4 py-2.5 text-left hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-xs font-semibold text-slate-200">
                        {category.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 bg-[#121417] rounded-md border border-white/5">
                      {category.items.length}
                    </span>
                  </button>

                  {(expandedCategory === category.id || flavorSearch) && (
                    <div className="px-4 pb-3.5 pt-1 grid grid-cols-2 gap-1.5 bg-black/10">
                      {category.items.map(item => {
                        const isChecked = selectedFlavors.includes(item);
                        return (
                          <button
                            type="button"
                            key={item}
                            onClick={() => handleToggleFlavor(item)}
                            className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg border text-[11px] transition-all cursor-pointer ${
                              isChecked
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-md"
                                : "bg-[#121417] border-white/5 hover:border-emerald-500/35 text-slate-400"
                            }`}
                          >
                            <span className="truncate pr-1">{item}</span>
                            {isChecked && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* Footer actions */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row gap-3 justify-end items-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all font-mono uppercase cursor-pointer"
          >
            Отмена
          </button>
          
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all font-mono uppercase shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            Записать в журнал
          </button>
        </div>

      </form>
    </div>
  );
};
