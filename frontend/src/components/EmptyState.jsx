import React from 'react';
import { Scale, Upload, ShieldCheck, Headphones } from 'lucide-react';

export default function EmptyState({ t }) {
  return (
    <div className="premium-card rounded-2xl p-8 sm:p-10 flex flex-col items-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-center text-amber-700 mb-5 shadow-2xs">
        <Scale className="w-8 h-8 stroke-[1.75]" />
      </div>
      
      <h3 className="text-2xl sm:text-3xl font-display text-stone-900 tracking-tight">
        {t.emptyTitle}
      </h3>
      <p className="text-xs sm:text-sm text-stone-500 max-w-lg mt-2 leading-relaxed">
        {t.emptyDesc}
      </p>

      {/* 3 Step Editorial Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full mt-8 pt-6 border-t border-stone-100 text-left">
        <div className="p-4 rounded-xl bg-[#FAF8F5]/80 border border-stone-200/70 hover:border-stone-300 transition-colors">
          <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-900 flex items-center justify-center text-xs font-bold mb-3">
            <Upload className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-bold text-stone-900">{t.step1Title}</h4>
          <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">{t.step1Desc}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F5]/80 border border-stone-200/70 hover:border-stone-300 transition-colors">
          <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-900 flex items-center justify-center text-xs font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-bold text-stone-900">{t.step2Title}</h4>
          <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">{t.step2Desc}</p>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF8F5]/80 border border-stone-200/70 hover:border-stone-300 transition-colors">
          <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-900 flex items-center justify-center text-xs font-bold mb-3">
            <Headphones className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-bold text-stone-900">{t.step3Title}</h4>
          <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">{t.step3Desc}</p>
        </div>
      </div>
    </div>
  );
}
