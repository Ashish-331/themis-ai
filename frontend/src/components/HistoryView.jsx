import React from 'react';
import { RefreshCw, FileText, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function HistoryView({
  historyList,
  isLoadingHistory,
  fetchHistory,
  onSelectDoc,
  t,
  language
}) {
  const safeT = t || TRANSLATIONS.english;
  const isHindi = language === 'hindi';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display text-stone-900 tracking-tight">
            {safeT.historyTitle}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {safeT.historyDesc}
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={isLoadingHistory}
          className="px-3.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-xl text-xs font-bold flex items-center space-x-1.5 text-stone-800 shadow-2xs cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin text-amber-600' : ''}`} />
          <span>{safeT.refreshHistory}</span>
        </button>
      </div>

      {isLoadingHistory && (
        <div className="text-center py-16 text-stone-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-700" />
          <p className="text-xs font-medium">{safeT.loadingHistory}</p>
        </div>
      )}

      {!isLoadingHistory && historyList.length === 0 && (
        <div className="premium-card border-dashed rounded-2xl p-16 text-center text-stone-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-stone-400" />
          <p className="text-sm font-bold text-stone-700">{safeT.emptyHistory}</p>
          <p className="text-xs text-stone-400 mt-1">{safeT.emptyHistoryDesc}</p>
        </div>
      )}

      {!isLoadingHistory && historyList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {historyList.map((doc, idx) => (
            <div
              key={idx}
              onClick={() => onSelectDoc(doc)}
              className="premium-card premium-card-hover p-5 rounded-2xl cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1 ${
                      doc.isScam
                        ? 'bg-rose-100/80 text-rose-800 border border-rose-200/80'
                        : 'bg-emerald-100/80 text-emerald-800 border border-emerald-200/80'
                    }`}
                  >
                    {doc.isScam ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                    <span>{doc.isScam ? 'Scam Warning' : 'Legitimate'}</span>
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                    {doc.language}
                  </span>
                </div>

                <span className="text-[11px] text-stone-400 font-mono">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h4 className="font-bold text-stone-900 text-sm mt-3 truncate group-hover:text-amber-800 transition-colors tracking-tight">
                {doc.fileName}
              </h4>

              <p className={`text-xs text-stone-500 mt-1.5 line-clamp-2 leading-relaxed ${isHindi ? 'font-hindi' : 'font-sans'}`}>
                {doc.summary && doc.summary[0]}
              </p>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400 font-medium">
                <span>{safeT.clickToView}</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-900 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
