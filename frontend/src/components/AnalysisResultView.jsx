import React from 'react';
import { Volume2, VolumeX, RefreshCw, Clock, ArrowRight } from 'lucide-react';
import ScamAlertBanner from './ScamAlertBanner';
import { TRANSLATIONS } from '../data/translations';

export default function AnalysisResultView({
  analysisResult,
  isSpeaking,
  isSynthesizingSpeech,
  toggleSpeech,
  hasCachedAudio,
  t,
  language
}) {
  if (!analysisResult) return null;
  const safeT = t || TRANSLATIONS.english;
  const isHindi = language === 'hindi';

  return (
    <div className="space-y-6">
      {/* Top Header Card with Amazon Polly Audio Player */}
      <div className="premium-card p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono font-bold uppercase bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded border border-stone-200">
              {analysisResult.language || language}
            </span>
            <span className="text-xs text-stone-400 font-mono">
              {new Date(analysisResult.createdAt || Date.now()).toLocaleTimeString()}
            </span>
          </div>
          <h3 className="font-bold text-stone-900 text-base sm:text-lg mt-1 truncate max-w-md tracking-tight">
            {analysisResult.fileName}
          </h3>
        </div>

        {/* Amazon Polly Audio Trigger Pill */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleSpeech}
            disabled={isSynthesizingSpeech}
            className={`min-h-[42px] px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                : isSynthesizingSpeech
                ? 'bg-amber-50 text-amber-900 border-amber-300'
                : 'bg-[#181614] hover:bg-stone-800 text-white border-stone-900 shadow-xs'
            }`}
          >
            {isSynthesizingSpeech ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
            ) : isSpeaking ? (
              <VolumeX className="w-3.5 h-3.5 text-white" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>
              {isSynthesizingSpeech
                ? safeT.generatingAudio
                : isSpeaking
                ? safeT.pauseAudio
                : hasCachedAudio
                ? safeT.replayAudio
                : safeT.listenAudio}
            </span>
          </button>
        </div>
      </div>

      {/* Scam Assessment Banner */}
      <ScamAlertBanner
        isScam={analysisResult.isScam}
        scamReason={analysisResult.scamReason}
        confidence={analysisResult.confidence}
        t={safeT}
        language={language}
      />

      {/* Statutory Timeline & Urgency Alert */}
      {analysisResult.urgency && (
        <div className="bg-amber-50/80 border border-amber-300/90 border-l-[5px] border-l-amber-500 p-4 rounded-xl flex items-start space-x-3 text-amber-950">
          <Clock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <span className="font-bold">{safeT.statutoryTimeline}: </span>
            <span className={isHindi ? 'font-hindi' : 'font-sans'}>{analysisResult.urgency}</span>
          </div>
        </div>
      )}

      {/* 5-Point Simplified Breakdown */}
      <div className="premium-card p-6 rounded-2xl">
        <h4 className="text-base font-display sm:text-lg text-stone-900 mb-4 tracking-tight">
          {safeT.summaryTitle}
        </h4>

        <ul className="space-y-3.5">
          {(analysisResult.summary || []).map((point, index) => (
            <li key={index} className="flex items-start space-x-3.5 text-stone-800">
              <span className="w-5 h-5 rounded-full bg-stone-900 text-amber-300 flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5 shadow-2xs">
                {index + 1}
              </span>
              <span className={`text-xs sm:text-sm leading-relaxed ${isHindi ? 'font-hindi' : 'font-sans'}`}>
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recommended Next Steps */}
      <div className="premium-card p-6 rounded-2xl">
        <h4 className="text-base font-display sm:text-lg text-stone-900 mb-4 tracking-tight">
          {safeT.nextStepsTitle}
        </h4>

        <div className="space-y-2.5">
          {(analysisResult.nextSteps || []).map((step, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl bg-[#FAF8F5]/80 border border-stone-200/70 flex items-start space-x-3 text-xs sm:text-sm text-stone-800"
            >
              <ArrowRight className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <span className={`leading-relaxed ${isHindi ? 'font-hindi' : 'font-sans'}`}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Disclaimer */}
      <p className="text-[11px] text-stone-400 italic text-center px-4 leading-normal">
        * {analysisResult.disclaimer || safeT.disclaimer}
      </p>
    </div>
  );
}
