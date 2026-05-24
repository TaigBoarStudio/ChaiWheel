import React, { useState } from "react";
import { GOOGLE_APPS_SCRIPT_CODE } from "../utils/sheets";
import { Check, Copy, ShieldCheck, FileSpreadsheet } from "lucide-react";

export const SheetsHelp: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#121417] border border-white/5 rounded-3xl p-6 md:p-8 max-w-3xl w-full mx-auto shadow-2xl space-y-6">
      
      {/* Title */}
      <div className="border-b border-white/5 pb-4">
        <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2.5">
          <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
          Инструкция: Настройка Google Sheets API
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Поскольку приложение публикуется на static-хостинге GitHub Pages без выделенного бэкенда, связь под капотом реализуется через Google Apps Script. Это безопасно и не требует паролей.
        </p>
      </div>

      {/* Checklist Steps */}
      <div className="space-y-4 text-xs md:text-sm text-slate-300">
        
        <div className="flex gap-3">
          <span className="w-5 h-5 shrink-0 rounded-full bg-[#1C1F24] border border-white/5 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">1</span>
          <div>
            <p className="font-bold text-slate-200">Создайте новую Google Таблицу</p>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Создайте обычную таблицу в вашем Google аккаунте. В верхнем меню выберите: <strong className="text-slate-300">Расширения (Extensions) &rarr; Apps Script</strong>.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="w-5 h-5 shrink-0 rounded-full bg-[#1C1F24] border border-white/5 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">2</span>
          <div className="w-full">
            <p className="font-bold text-slate-200">Вставьте код API-коннектора</p>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed mb-2">
              Удалите весь шаблонный код в окне редактора Apps Script и вставьте этот специальный код обработчика запросов GET и POST:
            </p>
            
            {/* Copy code container */}
            <div className="bg-[#0A0B0C] border border-white/10 rounded-xl p-3 relative max-h-[160px] overflow-y-auto font-mono text-[10px] text-slate-300 scrollbar-thin scrollbar-thumb-[#1C1F24]">
              <button
                type="button"
                onClick={handleCopyCode}
                className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1 bg-[#1C1F24]/80 hover:bg-[#1C1F24] text-[10px] text-slate-200 rounded-lg transition-all border border-white/5 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Код скопирован" : "Копировать код"}
              </button>
              <pre>{GOOGLE_APPS_SCRIPT_CODE}</pre>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="w-5 h-5 shrink-0 rounded-full bg-[#1C1F24] border border-white/5 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">3</span>
          <div>
            <p className="font-bold text-slate-200">Опубликуйте как Веб-приложение</p>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              В правом верхнем углу редактора Apps Script нажмите кнопку <strong className="text-slate-300">Начать развертывание (Deploy) &rarr; Новое развертывание (New deployment)</strong>.
            </p>
            <ul className="list-disc pl-4 mt-2 space-y-1 text-xs text-slate-400">
              <li>Выберите тип: <strong className="text-slate-300">Веб-приложение (Web app)</strong></li>
              <li>Запуск от имени (Execute as): <strong className="text-slate-300">Я (Ваша почта)</strong></li>
              <li>Кто имеет доступ (Who has access): <strong className="text-slate-300">Все (Anyone)</strong> &mdash; <em>это нужно, чтобы GitHub Pages мог посылать запросы</em></li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3">
          <span className="w-5 h-5 shrink-0 rounded-full bg-[#1C1F24] border border-white/5 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">4</span>
          <div>
            <p className="font-bold text-slate-200">Скопируйте URL веб-приложения и вставьте в настройки</p>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Нажмите кнопку развертывания, выдайте необходимые разрешения (Google предупредит о безопасности приложения, нажмите &ldquo;Advanced&rdquo; и продолжите). Скопируйте полученную ссылку, оканчивающуюся на <code className="text-emerald-450 font-mono">/exec</code>.
            </p>
            <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
              Эту ссылку вставьте в поле <strong className="text-slate-300">«Ссылка Web App»</strong> во вкладке настроек базы данных на главной панели! Готово — теперь все новые дегустации мгновенно сохраняются в Google Таблицу на вашем Диске!
            </p>
          </div>
        </div>

      </div>

      {/* Safety benefits callout */}
      <div className="bg-emerald-950/10 border border-emerald-500/15 rounded-2xl p-4 flex gap-3 text-emerald-300 text-xs shadow-inner">
        <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
        <div>
          <span className="font-bold block mb-0.5 text-white">Безопасность ваших данных</span>
          <span className="text-slate-400 block leading-relaxed">
            При таком подходе ваши Google-пароли, аккаунты или секретные ключи разработчика никогда не публикуются на GitHub. Передаются исключительно текстовые поля чая, зафиксированные в вашей собственной таблице.
          </span>
        </div>
      </div>

    </div>
  );
};
