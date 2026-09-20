import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ScamAlertBanner({ isScam, scamReason, confidence, t, language }) {
  const isHindi = language === 'hindi';
  const val = confidence || 0.85;

  let confLabel = t.confHigh;
  let confColor = 'text-stone-900 bg-stone-100 border-stone-300/80';

  if (val < 0.65) {
    confLabel = t.confLow;
    confColor = 'text-rose-800 bg-rose-50 border-rose-200';
  } else if (val < 0.85) {
    confLabel = t.confModerate;
    confColor = 'text-amber-800 bg-amber-50 border-amber-200';
  }

  return (
    <div
      className={`p-5 rounded-2xl border border-l-[6px] shadow-xs flex items-start space-x-4 ${
        isScam
          ? 'bg-gradient-to-r from-rose-50/95 via-rose-50/60 to-rose-50/20 border-rose-200/80 border-l-rose-600 text-rose-950'
          : 'bg-gradient-to-r from-emerald-50/95 via-emerald-50/60 to-emerald-50/20 border-emerald-200/80 border-l-emerald-600 text-emerald-950'
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
          isScam ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
        }`}
      >
        {isScam ? <AlertTriangle className="w-6 h-6 stroke-[2]" /> : <ShieldCheck className="w-6 h-6 stroke-[2]" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-base sm:text-lg tracking-tight">
            {isScam ? t.scamTitle : t.legitTitle}
          </h4>

          {/* Qualitative Confidence Pill */}
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold tracking-tight ${confColor}`}>
            {t.confidenceLabel}: {confLabel}
          </span>
        </div>

        <p className={`text-xs sm:text-sm mt-2 leading-relaxed opacity-95 ${isHindi ? 'font-hindi' : 'font-sans'}`}>
          {scamReason}
        </p>
      </div>
    </div>
  );
}
