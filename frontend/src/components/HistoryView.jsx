import React from 'react';
import { RefreshCw, FileText, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

export default function HistoryView({
  historyList,
  isLoadingHistory,
  fetchHistory,
  onSelectDoc
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">
            आपके पुराने दस्तावेज़
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            पूर्व में जाँचे गए दस्तावेज़ों के रिकॉर्ड
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={isLoadingHistory}
          className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 text-stone-800 shadow-xs cursor-pointer transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
          <span>रीफ्रेश करें</span>
        </button>
      </div>

      {isLoadingHistory && (
        <div className="text-center py-16 text-stone-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-700" />
          <p className="text-sm font-medium">रिकॉर्ड लोड हो रहे हैं...</p>
        </div>
      )}

      {!isLoadingHistory && historyList.length === 0 && (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-16 text-center text-stone-500">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-stone-400" />
          <p className="text-sm font-semibold text-stone-700">अभी तक कोई दस्तावेज़ सहेजा नहीं गया है।</p>
          <p className="text-xs text-stone-500 mt-1">जब आप कोई कानूनी नोटिस जांचेंगे, वह यहाँ सुरक्षित रहेगा।</p>
        </div>
      )}

      {!isLoadingHistory && historyList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {historyList.map((doc, idx) => (
            <div
              key={idx}
              onClick={() => onSelectDoc(doc)}
              className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-stone-400 hover:shadow-xs transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center space-x-1 ${
                      doc.isScam
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {doc.isScam ? <AlertTriangle className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{doc.isScam ? 'Scam Warning' : 'Legitimate'}</span>
                  </span>
                  <span className="text-xs font-mono uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                    {doc.language}
                  </span>
                </div>

                <span className="text-xs text-stone-500 font-mono">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h4 className="font-bold text-stone-900 text-base mt-3 truncate group-hover:text-amber-800 transition-colors">
                {doc.fileName}
              </h4>

              <p className="text-xs text-stone-600 mt-1 font-vernacular line-clamp-2">
                {doc.summary && doc.summary[0]}
              </p>

              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
                <span>क्लिक करके पूरा विवरण देखें</span>
                <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-stone-800 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
