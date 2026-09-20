import React from 'react';
import { PhoneCall, Server } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function Footer({ onOpenArchModal, t }) {
  const safeT = t || TRANSLATIONS.english;
  return (
    <footer className="border-t border-[#ECE7DE] bg-white py-6 mt-12 text-stone-500 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
          <span className="flex items-center space-x-1.5 font-semibold text-rose-800 bg-rose-50/80 px-2.5 py-1 rounded-lg border border-rose-200/80">
            <PhoneCall className="w-3.5 h-3.5 text-rose-700" />
            <span>{safeT.cyberHelpline}</span>
          </span>
          <span className="flex items-center space-x-1.5 font-medium text-stone-700 bg-stone-100/80 px-2.5 py-1 rounded-lg border border-stone-200/80">
            <span>{safeT.consumerHelpline}</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onOpenArchModal}
            className="text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer flex items-center space-x-1 transition-colors"
          >
            <Server className="w-3.5 h-3.5 text-stone-500" />
            <span>{safeT.techSpecLink}</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 pt-4 border-t border-stone-100 text-center text-stone-400">
        <p className="font-medium text-stone-500">
          {safeT.builtFor}
        </p>
        <p className="text-[11px] text-stone-400 mt-1 max-w-2xl mx-auto leading-relaxed">
          {safeT.disclaimer}
        </p>
      </div>
    </footer>
  );
}
