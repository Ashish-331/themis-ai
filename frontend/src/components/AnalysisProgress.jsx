import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function AnalysisProgress({ analysisStep }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-10 shadow-xs flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-700">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>

      <div>
        <h4 className="text-lg font-semibold text-stone-900">दस्तावेज़ की जांच हो रही है...</h4>
        <p className="text-xs text-stone-500 mt-1">4 से 6 सेकंड लगते हैं</p>
      </div>

      {/* Sequential Progress Steps */}
      <div className="w-full max-w-sm space-y-3 text-left">
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center space-x-3 transition-colors ${
            analysisStep >= 1 ? 'bg-amber-50 border-amber-300 text-stone-900' : 'bg-stone-50 border-stone-200 text-stone-400'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              analysisStep > 1 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}
          >
            {analysisStep > 1 ? '✓' : '1'}
          </div>
          <span>१. Amazon Textract से कानूनी शब्दों को पढ़ना (OCR)</span>
        </div>

        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center space-x-3 transition-colors ${
            analysisStep >= 2 ? 'bg-amber-50 border-amber-300 text-stone-900' : 'bg-stone-50 border-stone-200 text-stone-400'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              analysisStep > 2 ? 'bg-emerald-600 text-white' : analysisStep === 2 ? 'bg-amber-600 text-white' : 'bg-stone-300 text-stone-600'
            }`}
          >
            {analysisStep > 2 ? '✓' : '2'}
          </div>
          <span>२. AI लीगल इंजन द्वारा धाराओं व शर्तों का विश्लेषण</span>
        </div>

        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center space-x-3 transition-colors ${
            analysisStep >= 3 ? 'bg-amber-50 border-amber-300 text-stone-900' : 'bg-stone-50 border-stone-200 text-stone-400'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              analysisStep === 3 ? 'bg-amber-600 text-white' : 'bg-stone-300 text-stone-600'
            }`}
          >
            3
          </div>
          <span>३. फर्जीवाड़े की जांच व मातृभाषा रिपोर्ट तैयार करना</span>
        </div>
      </div>
    </div>
  );
}
