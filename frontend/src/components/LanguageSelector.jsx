import React from 'react';
import { Languages, Check } from 'lucide-react';

const LANGUAGES = [
  { id: 'english', label: 'English', sub: 'Standard Indian Legal Drafting', native: 'English' },
  { id: 'hindi', label: 'हिन्दी', sub: 'सरल नागरिक भाषा (देवनागरी)', native: 'Hindi' }
];

export default function LanguageSelector({ language, setLanguage, t }) {
  return (
    <div className="premium-card rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-sm font-bold text-stone-900 flex items-center space-x-2 tracking-tight">
          <Languages className="w-4 h-4 text-amber-600" />
          <span>{t.targetLangLabel}</span>
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          {t.targetLangDesc}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:w-80 w-full">
        {LANGUAGES.map((lang) => {
          const isSelected = language === lang.id;
          return (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              className={`px-3.5 py-2 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                isSelected
                  ? 'bg-[#181614] border-stone-900 text-white shadow-xs'
                  : 'bg-stone-50/70 border-stone-200/80 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
              }`}
            >
              <div className="text-left">
                <span className={`block font-bold ${lang.id === 'hindi' ? 'font-hindi' : 'font-sans'}`}>
                  {lang.label}
                </span>
                <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-stone-300' : 'text-stone-400'}`}>
                  {lang.native}
                </span>
              </div>
              {isSelected && (
                <div className="w-4 h-4 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center flex-shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
