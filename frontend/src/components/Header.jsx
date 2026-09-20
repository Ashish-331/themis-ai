import React from 'react';
import { Scale, FileText, History } from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-40 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center shadow-sm flex-shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xl tracking-tight text-stone-900">THEMIS</span>
              <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-md">
                न्याय सहायक
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium hidden sm:block">
              नागरिक कानूनी दस्तावेज़ विश्लेषक व साइबर फ्रॉड जांच
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'analyze'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-700" />
            <span>दस्तावेज़ जांचें</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <History className="w-4 h-4 text-amber-700" />
            <span>पुराने दस्तावेज़</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
