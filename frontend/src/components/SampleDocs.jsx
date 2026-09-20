import React from 'react';
import { ArrowRight, FileCheck } from 'lucide-react';

export default function SampleDocs({ sampleDocs, onSelectSample, language, t }) {
  const isHindi = language === 'hindi';

  return (
    <div className="premium-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-xs font-bold tracking-tight text-stone-800 flex items-center space-x-1.5">
          <FileCheck className="w-3.5 h-3.5 text-amber-700" />
          <span>{t.sampleTitle}</span>
        </span>
        <span className="text-[10px] text-amber-800 bg-amber-50/80 px-2 py-0.5 rounded-full border border-amber-200/80 font-medium">
          {t.sampleBadge}
        </span>
      </div>

      <div className="space-y-2">
        {sampleDocs.map((sample, idx) => {
          const docName = typeof sample.name === 'object' ? (isHindi ? sample.name.hi : sample.name.en) : sample.name;
          const docDesc = typeof sample.description === 'object' ? (isHindi ? sample.description.hi : sample.description.en) : sample.description;
          const docType = typeof sample.type === 'object' ? (isHindi ? sample.type.hi : sample.type.en) : sample.type;

          return (
            <button
              key={idx}
              onClick={() => onSelectSample(sample)}
              className="w-full text-left p-3 rounded-xl border border-stone-200/70 bg-[#FAF8F5]/60 hover:bg-stone-50 hover:border-amber-600/40 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="pr-2 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-xs font-bold text-stone-900 group-hover:text-amber-800 transition-colors truncate">
                    {docName}
                  </p>
                  <span className="text-[10px] px-1.5 py-0.2 bg-stone-200/70 text-stone-600 rounded font-medium flex-shrink-0">
                    {docType}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1 leading-normal">
                  {docDesc}
                </p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900 transition-transform group-hover:translate-x-0.5 flex-shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
