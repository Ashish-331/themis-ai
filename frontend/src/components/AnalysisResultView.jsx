import React from 'react';
import { Volume2, VolumeX, RefreshCw, Clock, ArrowRight } from 'lucide-react';
import ScamAlertBanner from './ScamAlertBanner';

export default function AnalysisResultView({
  analysisResult,
  isSpeaking,
  isSynthesizingSpeech,
  toggleSpeech,
  hasCachedAudio
}) {
  if (!analysisResult) return null;

  return (
    <div className="space-y-6">
      {/* Top Header Card with Multilingual Audio Player */}
      <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase bg-stone-100 text-stone-800 px-2.5 py-0.5 rounded border border-stone-300">
              {analysisResult.language}
            </span>
            <span className="text-xs text-stone-500 font-mono">
              {new Date(analysisResult.createdAt).toLocaleTimeString()}
            </span>
          </div>
          <h3 className="font-bold text-stone-900 text-lg mt-1 truncate max-w-md">
            {analysisResult.fileName}
          </h3>
        </div>

        {/* Audio Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSpeech}
            disabled={isSynthesizingSpeech}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 border transition-colors cursor-pointer ${
              isSpeaking
                ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                : isSynthesizingSpeech
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-stone-900 hover:bg-stone-800 text-white border-stone-900 shadow-xs'
            }`}
          >
            {isSynthesizingSpeech ? (
              <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
            ) : isSpeaking ? (
              <VolumeX className="w-4 h-4 text-white" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
            <span>
              {isSynthesizingSpeech
                ? 'ऑडियो तैयार हो रहा है...'
                : isSpeaking
                ? 'रुकें'
                : hasCachedAudio
                ? 'फिर से सुनें'
                : 'सुनें'}
            </span>
          </button>
        </div>
      </div>

      {/* Scam Assessment Banner */}
      <ScamAlertBanner
        isScam={analysisResult.isScam}
        scamReason={analysisResult.scamReason}
        confidence={analysisResult.confidence}
      />

      {/* Required Timeline / Urgency Alert */}
      {analysisResult.urgency && (
        <div className="bg-amber-50/80 border border-amber-300 border-l-[4px] border-l-amber-500 p-4 rounded-xl flex items-start space-x-3 text-amber-950">
          <Clock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <span className="font-bold">आवश्यक समय-सीमा: </span>
            <span className="font-vernacular">{analysisResult.urgency}</span>
          </div>
        </div>
      )}

      {/* 5-Point Simplified Breakdown */}
      <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-xs">
        <h4 className="text-base font-semibold text-stone-900 mb-4">
          5 मुख्य बिंदु
        </h4>

        <ul className="space-y-3.5">
          {analysisResult.summary.map((point, index) => (
            <li key={index} className="flex items-start space-x-3.5 text-stone-900">
              <span className="w-6 h-6 rounded-full bg-stone-900 text-amber-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
                {index + 1}
              </span>
              <span className="font-vernacular text-base leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommended Next Steps */}
      <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-xs">
        <h4 className="text-base font-semibold text-stone-900 mb-4">
          आगे क्या करें?
        </h4>

        <div className="space-y-2.5">
          {analysisResult.nextSteps.map((step, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start space-x-3 text-sm text-stone-800"
            >
              <ArrowRight className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-1" />
              <span className="font-vernacular text-sm leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Disclaimer */}
      <p className="text-xs text-stone-500 italic text-center px-4">
        * {analysisResult.disclaimer}
      </p>
    </div>
  );
}
