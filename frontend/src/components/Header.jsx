import React from 'react';
import { Scale, FileText, History, Globe } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, language, setLanguage, t }) {
  return (
    <header className="border-b border-[#ECE7DE] bg-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#181614] text-amber-400 flex items-center justify-center shadow-xs border border-stone-800 flex-shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-stone-900 font-sans">
                {t.brandName}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 rounded-full">
                {t.brandBadge}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium hidden sm:block tracking-tight">
              {t.brandTagline}
            </p>
          </div>
        </div>

        {/* Navigation & Language Switcher */}
        <div className="flex items-center space-x-3">
          {/* Tab Switcher */}
          <nav className="flex bg-stone-100/90 p-1 rounded-xl border border-stone-200/80 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('analyze')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'analyze'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60 font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>{t.tabAnalyze}</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/60 font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <History className="w-3.5 h-3.5 text-amber-700" />
              <span>{t.tabHistory}</span>
            </button>
          </nav>

          {/* Premium Language Pill Toggle (English default, option to convert to Hindi) */}
          <div className="flex items-center bg-stone-100/90 p-1 rounded-xl border border-stone-200/80 text-xs font-medium">
            <button
              onClick={() => setLanguage('english')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                language === 'english'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="Switch to English"
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('hindi')}
              className={`px-2.5 py-1 rounded-lg transition-all font-hindi cursor-pointer ${
                language === 'hindi'
                  ? 'bg-white text-stone-900 shadow-xs font-bold'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
              title="हिंदी में बदलें"
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
