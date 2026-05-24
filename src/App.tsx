import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Plus,
  Filter,
  Database,
  HelpCircle,
  Sparkles,
  Check,
  RotateCcw,
  TrendingUp,
  Compass,
  BookOpen,
  Info,
  SlidersHorizontal,
  Cloud,
  ChevronDown,
  X
} from "lucide-react";

import { Tea, GoogleSheetsConfig } from "./types";
import { START_TEAS } from "./data/mockTeas";
import { FLAVOR_CATEGORIES } from "./data/flavors";
import { fetchTeas, addTea, getSheetsConfig, saveSheetsConfig, testSheetsConnection } from "./utils/sheets";

// Import components
import { FlavorWheel } from "./components/FlavorWheel";
import { TeaForm } from "./components/TeaForm";
import { TeaDetail } from "./components/TeaDetail";
import { SheetsHelp } from "./components/SheetsHelp";

export default function App() {
  // Teas data and loading states
  const [teas, setTeas] = useState<Tea[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromSheets, setFromSheets] = useState(false);

  // Configuration for Google Sheets sync
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(getSheetsConfig());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [tempWebAppUrl, setTempWebAppUrl] = useState(sheetsConfig.webAppUrl);

  // Filtering, Searching & Sorting States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("all");
  const [selectedAuthorFilter, setSelectedAuthorFilter] = useState("all");
  const [activeWheelFilter, setActiveWheelFilter] = useState<string | null>(null); // flavor or category selected on wheel
  const [sortBy, setSortBy] = useState<"date" | "rating" | "year">("date");
  const [hoveredWheelItem, setHoveredWheelItem] = useState<string | null>(null);

  // Active viewing/adding states
  const [selectedTea, setSelectedTea] = useState<Tea | null>(null);
  const [isAddingTea, setIsAddingTea] = useState(false);
  const [addingTeaFlavors, setAddingTeaFlavors] = useState<string[]>([]);
  const [isShowingHelp, setIsShowingHelp] = useState(false);
  const [isShowingSettings, setIsShowingSettings] = useState(false);

  // Feedback notifications (Toasts)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Load teas initially and whenever sheets config changes
  const loadTeas = async (config: GoogleSheetsConfig = sheetsConfig) => {
    setLoading(true);
    try {
      const response = await fetchTeas(config, START_TEAS);
      setTeas(response.teas);
      setFromSheets(response.fromSheets);
    } catch (err) {
      showToast("Ошибка подключения к базе данных", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeas();
  }, []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Synchronize dynamic lists & options
  const teaTypes = useMemo(() => {
    const types = new Set(teas.map(t => t.type));
    return ["all", ...Array.from(types)];
  }, [teas]);

  // Handle adding new tea tasting record
  const handleAddTeaSubmit = async (newTea: Tea) => {
    setLoading(true);
    try {
      const result = await addTea(sheetsConfig, newTea, teas);
      
      // Prepend to current state to avoid slow layout updates
      setTeas(prev => [newTea, ...prev]);
      setIsAddingTea(false);
      setSelectedTea(newTea); // Instantly highlight newly added tea
      
      if (result.fromSheets) {
        showToast("Успешно добавлено в Google Таблицу!", "success");
      } else {
        showToast("Сохранено локально в журнал!", "success");
      }
    } catch (err) {
      showToast("Произошла ошибка при сохранении", "error");
    } finally {
      setLoading(false);
    }
  };

  // Test and save Google Sheet integration URL
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempWebAppUrl.trim()) {
      // Revert to local state only
      const disabledConfig = { webAppUrl: "", sheetId: "", isConfigured: false };
      setSheetsConfig(disabledConfig);
      saveSheetsConfig(disabledConfig);
      await loadTeas(disabledConfig);
      setIsShowingSettings(false);
      showToast("Переключено в локальный оффлайн-режим", "success");
      return;
    }

    setIsTestingConnection(true);
    const isValid = await testSheetsConnection(tempWebAppUrl.trim());
    setIsTestingConnection(false);

    if (isValid) {
      const newConfig = {
        webAppUrl: tempWebAppUrl.trim(),
        sheetId: "",
        isConfigured: true
      };
      setSheetsConfig(newConfig);
      saveSheetsConfig(newConfig);
      await loadTeas(newConfig);
      setIsShowingSettings(false);
      showToast("Google Sheets подключены успешно!", "success");
    } else {
      showToast("Не удалось подключиться. Проверьте правильность ссылки или доступ в Apps Script.", "error");
    }
  };

  // Perform filtering & sorting rules (Client-Side)
  const filteredTeas = useMemo(() => {
    return teas
      .filter(tea => {
        // 1. Text Search Filter (Matches name, origin, or notes)
        const matchesSearch =
          tea.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tea.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tea.notes.toLowerCase().includes(searchQuery.toLowerCase());

        // 2. Class Type Dropdown Filter
        const matchesType = selectedTypeFilter === "all" || tea.type === selectedTypeFilter;

        // 3. Reviewer/Author Filter
        const matchesAuthor = selectedAuthorFilter === "all" || tea.author === selectedAuthorFilter;

        // 4. Wheel filter (Category click or Aroma click)
        let matchesWheel = true;
        if (activeWheelFilter) {
          // Check if activeWheelFilter is a category name
          const isCategory = FLAVOR_CATEGORIES.some(c => c.name === activeWheelFilter);
          if (isCategory) {
            const cat = FLAVOR_CATEGORIES.find(c => c.name === activeWheelFilter);
            matchesWheel = tea.flavors.some(f => cat?.items.includes(f));
          } else {
            // It's a specific flavor/aroma item
            matchesWheel = tea.flavors.includes(activeWheelFilter);
          }
        }

        return matchesSearch && matchesType && matchesWheel && matchesAuthor;
      })
      .sort((a, b) => {
        // Sorting criteria
        if (sortBy === "rating") {
          return b.rating - a.rating;
        }
        if (sortBy === "year") {
          const yA = typeof a.year === "number" ? a.year : parseInt(String(a.year)) || 0;
          const yB = typeof b.year === "number" ? b.year : parseInt(String(b.year)) || 0;
          return yB - yA;
        }
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      });
  }, [teas, searchQuery, selectedTypeFilter, activeWheelFilter, sortBy]);

  // Compute analytics
  const analytics = useMemo(() => {
    if (teas.length === 0) return { count: 0, avgRating: 0, favoriteCategories: [] };
    
    // Total Count
    const count = teas.length;
    
    // Average rating
    const avgRating = teas.reduce((sum, t) => sum + t.rating, 0) / count;

    // Flavor categories counters
    const catCounts: { [key: string]: number } = {};
    FLAVOR_CATEGORIES.forEach(c => {
      catCounts[c.name] = 0;
    });

    teas.forEach(t => {
      t.flavors.forEach(flavor => {
        const cat = FLAVOR_CATEGORIES.find(c => c.items.includes(flavor));
        if (cat) {
          catCounts[cat.name] = (catCounts[cat.name] || 0) + 1;
        }
      });
    });

    // Top categories
    const favoriteCategories = Object.entries(catCounts)
      .map(([name, val]) => ({ name, value: val }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .filter(item => item.value > 0);

    return {
      count,
      avgRating: Number(avgRating.toFixed(1)),
      favoriteCategories
    };
  }, [teas]);

  return (
    <div className="min-h-screen bg-[#0A0B0C] text-slate-200 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#121417]/90 backdrop-blur-md border-b border-white/5 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-3">
          
          {/* Logo brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setSelectedTea(null); setActiveWheelFilter(null); }}>
            <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="text-lg font-bold text-black">🍵</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-mono text-emerald-400 font-bold block leading-none">TEALOG 2026</span>
              <h1 className="text-base font-extrabold text-white tracking-tight font-sans">КОЛЕСО АРОМАТОВ ЧАЯ</h1>
            </div>
          </div>

          {/* Database Setup State Badge */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsShowingSettings(!isShowingSettings)}
              id="settings-trigger-btn"
              className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                sheetsConfig.isConfigured
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-[#1C1F24] border-white/10 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              {sheetsConfig.isConfigured ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  Google Sheets: Активно
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5 text-slate-500" />
                  Локальный режим
                </>
              )}
            </button>

            <button
              onClick={() => setIsShowingHelp(!isShowingHelp)}
              id="help-trigger-btn"
              className="p-2 rounded-lg bg-[#1C1F24] border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all font-semibold cursor-pointer"
              title="Инструкция API"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. Primary layout container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6">
        
        {/* Connection/Actions Drawer Banner (If open) */}
        <AnimatePresence>
          {isShowingSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
              id="settings-drawer"
            >
              <div className="bg-[#121417] border border-white/5 rounded-3xl p-6 max-w-2xl mx-auto space-y-4 shadow-2xl">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-emerald-500" />
                    Настройка Google Sheets Синхронизации
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Укажите адрес веб-приложения Google Apps Script для автоматического двустороннего сохранения чая. Оставьте пустым, чтобы выключить и использовать браузерную базу LocalStorage.
                  </p>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-slate-400 text-xs font-mono font-medium mb-1.5 uppercase">
                      Ссылка Web App (URL)
                    </label>
                    <input
                      type="url"
                      value={tempWebAppUrl}
                      onChange={e => setTempWebAppUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/AKfyc...exec"
                      className="w-full bg-[#1C1F24] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="flex justify-end gap-2 text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setIsShowingSettings(false)}
                      className="px-3.5 py-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg font-mono font-bold uppercase cursor-pointer"
                    >
                      Отмена
                    </button>
                    <button
                      type="submit"
                      disabled={isTestingConnection}
                      className="px-4.5 py-2.5 bg-emerald-600 text-white font-bold font-mono uppercase rounded-lg hover:bg-emerald-500 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      id="save-db-btn"
                    >
                      {isTestingConnection ? "Проверка связи..." : "Сохранить и подключить"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {isShowingHelp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
              id="help-drawer"
            >
              <div className="relative">
                <button
                  onClick={() => setIsShowingHelp(false)}
                  className="absolute top-6 right-6 p-2 rounded-lg bg-[#1C1F24] hover:bg-white/5 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <SheetsHelp />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. Global Analytics dashboard meters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="analytics-grid">
          
          <div className="bg-[#121417]/80 border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5.5 h-5.5 text-emerald-400" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block">Дегустаций введено</span>
              <span className="text-2xl font-black text-white font-mono">
                {analytics.count} <span className="text-xs font-normal text-slate-400">сортов</span>
              </span>
            </div>
          </div>

          <div className="bg-[#121417]/80 border border-white/5 rounded-2xl p-4 flex items-center gap-4 shadow-md">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5.5 h-5.5 text-emerald-400" />
            </div>
            <div>
              <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block">Средняя Оценка</span>
              <span className="text-2xl font-black text-white font-mono">
                {analytics.avgRating} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
              </span>
            </div>
          </div>

          <div className="bg-[#121417]/80 border border-white/5 rounded-2xl p-4 flex items-center gap-4 col-span-1 md:col-span-2 shadow-md">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5.5 h-5.5 text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider block mb-1">Приоритеты во вкусах</span>
              <div className="flex gap-2 overflow-x-auto scrollbar-none py-0.5">
                {analytics.favoriteCategories.length > 0 ? (
                  analytics.favoriteCategories.map((item, i) => (
                    <span
                      key={item.name}
                      className="text-[10px] font-semibold bg-[#1C1F24] px-2.5 py-1 rounded-lg text-slate-200 shrink-0 border border-white/5"
                    >
                      #{i + 1} {item.name} ({item.value})
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">Настройте колесо, оценив несколько чаев</span>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 4. Interactive Wheel & Log Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Wheel - Takes 7 cols on lg sizes */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-xs font-mono tracking-widest text-slate-400 uppercase font-bold flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-500" />
                Компактный сенсорный пульт
              </h3>
              {activeWheelFilter && (
                <button
                  onClick={() => { setActiveWheelFilter(null); setSelectedTea(null); }}
                  className="text-[10px] font-semibold font-mono text-emerald-400 hover:text-white px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md transition-all uppercase cursor-pointer"
                >
                  Сбросить фильтр
                </button>
              )}
            </div>

            <FlavorWheel
              selectedTea={selectedTea}
              activeFilter={activeWheelFilter}
              onSelectFilter={(filter) => {
                setActiveWheelFilter(filter);
                setSelectedTea(null); // Clear selected tea focus when user filters by flavor
              }}
              hoveredItem={hoveredWheelItem}
              setHoveredItem={setHoveredWheelItem}
              isAddingMode={isAddingTea}
              addingFlavors={addingTeaFlavors}
              onToggleAddingFlavor={(flavor) => {
                setAddingTeaFlavors(prev =>
                  prev.includes(flavor)
                    ? prev.filter(f => f !== flavor)
                    : [...prev, flavor]
                );
              }}
            />

            <div className="bg-[#121417]/80 border border-white/5 p-4 rounded-2xl text-xs text-slate-400 flex gap-2.5 shadow-md">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                {isAddingTea ? (
                  <>
                    <strong className="text-emerald-400 font-bold uppercase tracking-wider font-mono text-[10px] block mb-1">Режим выбора вкусов:</strong>
                    Кликайте прямо по секторам колеса (ароматы на внешнем кольце, категории на внутреннем) для мгновенного добавления или удаления их из рецепта нового чая.
                  </>
                ) : selectedTea ? (
                  <>
                    Выделены дегустационные ноты для <strong className="text-white">{selectedTea.name}</strong>. Кликните в центр колеса, чтобы вернуться к полному каталогу.
                  </>
                ) : activeWheelFilter ? (
                  <>
                    Показаны чаи, обладающие свойством <strong className="text-emerald-400">{activeWheelFilter}</strong>. Кликните по колесу или в центр для отмены.
                  </>
                ) : (
                  <>
                    Кликайте на сектора колеса для прямой фильтрации каталога, либо выберите чай из списка справа, чтобы подсветить его вкусовой букет.
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tasting database log, details and Form - Takes 5 cols on lg */}
          <div className="lg:col-span-5 space-y-6">
            
            <AnimatePresence mode="wait">
              {isAddingTea ? (
                // Adding Tea Form Modal Layer
                <motion.div
                  key="add-tea-form"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <TeaForm
                    onAddTea={handleAddTeaSubmit}
                    onClose={() => setIsAddingTea(false)}
                    selectedFlavors={addingTeaFlavors}
                    setSelectedFlavors={setAddingTeaFlavors}
                  />
                </motion.div>
              ) : selectedTea ? (
                // Detailed card presentation of selected tea
                <motion.div
                  key="tea-detail-card"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                >
                  <TeaDetail
                    tea={selectedTea}
                    onClose={() => setSelectedTea(null)}
                    onClearSelection={() => {
                      setSelectedTea(null);
                      setActiveWheelFilter(null);
                    }}
                  />
                </motion.div>
              ) : (
                // Normal Tea Catalog panel
                <motion.div
                  key="tea-log-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                  id="catalog-panel"
                >
                  
                  {/* Title & Add button */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span>Журнал Дегустаций</span>
                        <span className="text-xs px-2 py-0.5 bg-[#1b1e22] rounded-full font-mono text-slate-400 border border-white/5">
                          {filteredTeas.length} из {teas.length}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Управляйте коллекцией и фиксируйте органолептические спектры</p>
                    </div>

                    <button
                      onClick={() => {
                        setIsAddingTea(true);
                        setAddingTeaFlavors([]);
                        setSelectedTea(null);
                        setActiveWheelFilter(null);
                      }}
                      id="add-tea-trigger-btn"
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase font-mono tracking-wider shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-white" />
                      Новый Чай
                    </button>
                  </div>

                  {/* Filter panel, Sorting & Search bar (Bento box look) */}
                  <div className="bg-[#121417]/80 border border-white/5 rounded-2xl p-4 text-xs space-y-3.5 shadow-md">
                    
                    {/* First line: Search bar & select class */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      <div className="relative sm:col-span-7">
                        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          id="tea-search-input"
                          type="text"
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Поиск по названию, нотам, региону..."
                          className="w-full bg-[#1C1F24] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/40"
                        />
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="text-slate-500 hover:text-white absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                          >
                            Сбросить
                          </button>
                        )}
                      </div>

                      <div className="relative sm:col-span-5">
                        <select
                          id="tea-type-filter"
                          value={selectedTypeFilter}
                          onChange={e => setSelectedTypeFilter(e.target.value)}
                          className="w-full bg-[#1C1F24] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/40 appearance-none cursor-pointer"
                        >
                          <option value="all" className="bg-[#121417]">Все категории чая</option>
                          {teaTypes.filter(t => t !== "all").map(type => (
                            <option key={type} value={type} className="bg-[#121417]">{type}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Degustator filter switcher */}
                    <div className="flex flex-wrap items-center gap-2 bg-[#1C1F24]/30 p-2 border border-white/5 rounded-xl">
                      <span className="text-slate-400 font-mono pl-1 shrink-0">Дегустатор:</span>
                      <div className="flex bg-[#121417]/80 p-0.5 rounded-lg border border-white/5 shrink-0">
                        {[
                          { id: "all", label: "Все" },
                          { id: "Александр", label: "Александр" },
                          { id: "Дмитрий", label: "Дмитрий" }
                        ].map(user => (
                          <button
                            key={user.id}
                            onClick={() => setSelectedAuthorFilter(user.id)}
                            className={`px-3.5 py-1 rounded-md transition-all text-[11px] font-semibold cursor-pointer ${
                              selectedAuthorFilter === user.id
                                ? "bg-sky-500/15 text-sky-400 font-bold border border-sky-500/20 shadow-sm"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {user.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Second line: Sorting buttons & custom labels */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-t border-white/5 pt-3">
                      
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-450" />
                        <span className="text-slate-400 font-mono">Сортировка:</span>
                        <div className="flex bg-[#1C1F24] p-0.5 rounded-lg border border-white/5 shrink-0">
                          <button
                            onClick={() => setSortBy("date")}
                            className={`px-3 py-1 rounded-md transition-all text-[11px] cursor-pointer ${
                              sortBy === "date" ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            По дате
                          </button>
                          <button
                            onClick={() => setSortBy("rating")}
                            className={`px-3 py-1 rounded-md transition-all text-[11px] cursor-pointer ${
                              sortBy === "rating" ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            По оценке
                          </button>
                          <button
                            onClick={() => setSortBy("year")}
                            className={`px-3 py-1 rounded-md transition-all text-[11px] cursor-pointer ${
                              sortBy === "year" ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            По году
                          </button>
                        </div>
                      </div>

                      {/* Displaying active filters tags explicitly for supreme UX transparency */}
                      {activeWheelFilter && (
                        <div className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 shrink-0">
                          <span>Фильтр колеса: <strong>{activeWheelFilter}</strong></span>
                          <button
                            onClick={() => setActiveWheelFilter(null)}
                            className="hover:bg-emerald-500/20 hover:text-white p-0.5 bg-emerald-500/10 rounded cursor-pointer"
                          >
                            &times;
                          </button>
                        </div>
                      )}

                    </div>

                  </div>

                  {/* List of Teas */}
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#1C1F24]">
                    {loading ? (
                      <div className="text-center py-10 space-y-2">
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="text-xs text-slate-500 font-mono">Загрузка дегустационных записей...</p>
                      </div>
                    ) : filteredTeas.length === 0 ? (
                      <div className="bg-[#121417]/30 border border-dashed border-white/5 rounded-2xl py-12 px-6 text-center space-y-3">
                        <p className="text-sm text-slate-400">Записей не обнаружено</p>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                          Попробуйте сбросить поисковый запрос, ярлык колеса вкусового профиля, или добавьте новую запись о дегустации.
                        </p>
                        <div className="pt-2 flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setSelectedTypeFilter("all");
                              setActiveWheelFilter(null);
                            }}
                            className="px-3.5 py-1.5 font-mono text-xs bg-[#121417] border border-white/5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                          >
                            Сбросить фильтры
                          </button>
                        </div>
                      </div>
                    ) : (
                      filteredTeas.map(tea => (
                        <div
                          key={tea.id}
                          className="bg-[#121417]/80 border border-white/5 hover:border-emerald-500/30 p-4 rounded-2xl hover:bg-[#121417] transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer group shadow-sm"
                          onClick={() => setSelectedTea(tea)}
                        >
                          {/* Info block */}
                          <div className="space-y-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono uppercase bg-[#1C1F24] border border-white/5 px-2 py-0.5 rounded text-slate-400 font-bold">
                                {tea.type}
                              </span>
                              {tea.author && (
                                <span className="text-[9px] font-mono uppercase bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded text-sky-400 font-bold">
                                  {tea.author}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500 font-mono">
                                {String(tea.year).trim() === "-" || !tea.year ? "—" : `${tea.year} год`}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                              {tea.name}
                            </h3>
                            <div className="text-xs text-slate-400 flex items-center gap-1">
                              <span className="text-slate-500">Вкусовой след: </span>
                              <span className="truncate max-w-[320px] text-slate-300">
                                {tea.flavors.slice(0, 4).join(", ")}
                                {tea.flavors.length > 4 ? `... (+${tea.flavors.length - 4})` : ""}
                              </span>
                            </div>
                          </div>

                          {/* Ratings + Navigation */}
                          <div className="flex sm:flex-col items-end shrink-0 gap-2 sm:gap-0">
                            <div className="text-emerald-400 font-sans tracking-tight text-sm font-bold">
                              {"★".repeat(tea.rating)}
                              <span className="text-slate-800">{"☆".repeat(5 - tea.rating)}</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {tea.origin.length > 14 ? `${tea.origin.slice(0, 13)}...` : tea.origin}
                            </span>
                          </div>

                        </div>
                      ))
                    )}
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>

      </main>

      {/* 5. Minimalist Toast Alerts */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-3 border backdrop-blur-md"
            style={{
              backgroundColor: toast.type === "success" ? "rgba(6, 78, 59, 0.93)" : "rgba(127, 29, 29, 0.93)",
              borderColor: toast.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
              color: toast.type === "success" ? "#a7f3d0" : "#fca5a5"
            }}
          >
            {toast.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-450 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className="font-sans font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Legal human Footer */}
      <footer className="border-t border-white/5 bg-[#0A0B0C] mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-2">
          <p className="font-sans">
            &copy; 184a9aee-8129-4967-b135-9fd8b5ba0755 &bull; Колесо Ароматов Чая &bull; TeaLog 2026
          </p>
          <p className="font-mono text-[10px] text-slate-600">
            Опубликовано на GitHub Pages &bull; Поддержка двустороннего Google Sheets API
          </p>
        </div>
      </footer>

    </div>
  );
}
