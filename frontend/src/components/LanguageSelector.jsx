import React from 'react';

const LANGUAGES = [
  { id: 'hindi', label: 'हिंदी', sub: 'Hindi' },
  { id: 'bengali', label: 'বাংলা', sub: 'Bengali' },
  { id: 'marathi', label: 'मराठी', sub: 'Marathi' }
];

export default function LanguageSelector({ language, setLanguage }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-stone-900">
          सरल भाषा चुनें
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          दस्तावेज़ किस भाषा में समझना चाहते हैं?
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:w-auto w-full">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            onClick={() => setLanguage(lang.id)}
            className={`min-h-[46px] px-4 py-2 rounded-xl border text-sm font-semibold transition-colors flex flex-col items-center justify-center ${
              language === lang.id
                ? 'bg-amber-600 border-amber-700 text-white shadow-sm'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
            }`}
          >
            <span>{lang.label}</span>
            <span className={`text-[10px] font-normal ${language === lang.id ? 'text-amber-100' : 'text-stone-400'}`}>
              {lang.sub}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
