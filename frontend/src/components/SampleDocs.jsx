import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function SampleDocs({ sampleDocs, onSelectSample }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold tracking-wider text-stone-700 uppercase">
          नमूना दस्तावेज़
        </span>
        <span className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-medium">
          तुरंत जांचें
        </span>
      </div>

      <div className="space-y-2.5">
        {sampleDocs.map((sample, idx) => (
          <button
            key={idx}
            onClick={() => onSelectSample(sample)}
            className="w-full text-left p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-100/80 hover:border-stone-300 transition-colors flex items-center justify-between group"
          >
            <div className="pr-2">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-semibold text-stone-900 group-hover:text-amber-800 transition-colors">
                  {sample.name}
                </p>
                <span className="text-[10px] px-1.5 py-0.2 bg-stone-200 text-stone-700 rounded font-medium">
                  {sample.type}
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-0.5 line-clamp-1">{sample.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-transform group-hover:translate-x-1 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
