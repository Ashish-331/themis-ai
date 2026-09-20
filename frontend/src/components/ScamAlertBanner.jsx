import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

const getQualitativeConfidence = (conf) => {
  const val = conf || 0.85;
  if (val >= 0.85) return { label: 'उच्च स्तर', color: 'text-stone-900 bg-stone-100 border-stone-300' };
  if (val >= 0.65) return { label: 'मध्यम स्तर', color: 'text-amber-800 bg-amber-50 border-amber-200' };
  return { label: 'संदेहास्पद', color: 'text-rose-800 bg-rose-50 border-rose-200' };
};

export default function ScamAlertBanner({ isScam, scamReason, confidence }) {
  const confData = getQualitativeConfidence(confidence);

  return (
    <div
      className={`p-5 rounded-xl border border-l-[6px] shadow-xs flex items-start space-x-4 ${
        isScam
          ? 'bg-rose-50/70 border-rose-200 border-l-rose-600 text-rose-950'
          : 'bg-emerald-50/70 border-emerald-200 border-l-emerald-600 text-emerald-950'
      }`}
    >
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 shadow-xs ${
          isScam ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
        }`}
      >
        {isScam ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-bold text-lg tracking-tight">
            {isScam
              ? '🛑 सावधान — संदिग्ध या फर्जी दस्तावेज़'
              : '✅ सुरक्षित — आधिकारिक व वैध कानूनी दस्तावेज़'}
          </h4>

          {/* Qualitative Confidence Badge */}
          <span className={`text-xs px-2.5 py-0.5 rounded-md border font-semibold ${confData.color}`}>
            विश्वास स्तर: {confData.label}
          </span>
        </div>

        <p className="text-sm mt-2 font-vernacular leading-relaxed opacity-95">
          {scamReason}
        </p>
      </div>
    </div>
  );
}
