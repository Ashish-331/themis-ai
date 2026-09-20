import React from 'react';
import { Upload } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-10 shadow-xs flex flex-col items-center text-center">
      <div className="w-18 h-18 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-5">
        <Upload className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-semibold text-stone-900">
        कोई भी कागज़ डालो, हम बताएंगे क्या है
      </h3>
      <p className="text-sm text-stone-500 max-w-md mt-1.5 leading-relaxed">
        कठिन कानूनी भाषा को आपकी मातृभाषा में 5 आसान बिंदुओं में समझें — और फर्जीवाड़े से बचें।
      </p>

      {/* 3 Step Visual */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-8 pt-6 border-t border-stone-100 text-left">
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70">
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">कदम १</span>
          <h4 className="text-sm font-semibold text-stone-900 mt-2">फोटो या PDF दें</h4>
          <p className="text-xs text-stone-600 mt-1">मोबाइल से फोटो खींचें या फाइल अपलोड करें।</p>
        </div>
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70">
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">कदम २</span>
          <h4 className="text-sm font-semibold text-stone-900 mt-2">मातृभाषा चुनें</h4>
          <p className="text-xs text-stone-600 mt-1">हिंदी, बांग्ला या मराठी में सरलीकरण पाएं।</p>
        </div>
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70">
          <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">कदम ३</span>
          <h4 className="text-sm font-semibold text-stone-900 mt-2">सुनें व समझें</h4>
          <p className="text-xs text-stone-600 mt-1">Amazon Polly की प्राकृतिक आवाज में सुनें।</p>
        </div>
      </div>
    </div>
  );
}
