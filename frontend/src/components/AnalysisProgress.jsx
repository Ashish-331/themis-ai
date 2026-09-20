import React from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function AnalysisProgress({ analysisStep, t }) {
  const safeT = t || TRANSLATIONS.english;
  return (
    <div className="premium-card rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-center text-amber-700 shadow-2xs">
        <RefreshCw className="w-6 h-6 animate-spin stroke-[2]" />
      </div>

      <div>
        <h4 className="text-xl font-display text-stone-900 tracking-tight">
          {safeT.loadingTitle}
        </h4>
        <p className="text-xs text-stone-400 mt-1 font-mono">
          {safeT.loadingSubtitle}
        </p>
      </div>

      {/* Sequential Pipeline Steps */}
      <div className="w-full max-w-md space-y-2.5 text-left">
        {[
          { step: 1, text: safeT.stepOcr },
          { step: 2, text: safeT.stepNlp },
          { step: 3, text: safeT.stepScam }
        ].map((item) => {
          const isDone = analysisStep > item.step;
          const isCurrent = analysisStep === item.step;

          return (
            <div
              key={item.step}
              className={`p-3 rounded-xl border text-xs font-medium flex items-center space-x-3 transition-all ${
                isCurrent
                  ? 'bg-amber-50/60 border-amber-300/80 text-stone-900 shadow-2xs'
                  : isDone
                  ? 'bg-stone-50/70 border-stone-200/80 text-stone-800'
                  : 'bg-stone-50/40 border-stone-200/40 text-stone-400'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                  isDone
                    ? 'bg-emerald-600 text-white'
                    : isCurrent
                    ? 'bg-amber-600 text-white'
                    : 'bg-stone-200 text-stone-500'
                }`}
              >
                {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : item.step}
              </div>
              <span className="leading-snug">{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
