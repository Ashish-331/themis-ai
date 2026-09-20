import React from 'react';
import { PhoneCall, Server } from 'lucide-react';

export default function Footer({ onOpenArchModal }) {
  return (
    <footer className="border-t border-stone-200 bg-white py-6 mt-12 text-stone-600 text-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-stone-700">
          <span className="flex items-center space-x-1.5 font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
            <PhoneCall className="w-3.5 h-3.5 text-rose-700" />
            <span>साइबर क्राइम हेल्पलाइन: डायल 1930 (cybercrime.gov.in)</span>
          </span>
          <span className="flex items-center space-x-1.5 font-medium text-stone-700 bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200">
            <span>राष्ट्रीय उपभोक्ता हेल्पलाइन: डायल 1915</span>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={onOpenArchModal}
            className="text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer flex items-center space-x-1 transition-colors"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Technical Details</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4 pt-4 border-t border-stone-100 text-center text-stone-500">
        <p>
          Themis (न्याय सहायक) — Built for WeMakeDevs & AWS First Commit Hackathon (Ship It Track)
        </p>
        <p className="text-[11px] text-stone-400 mt-1">
          Disclaimer: Themis is an AI heuristic assistance tool, not certified legal counsel. In case of legal dispute, consult an advocate.
        </p>
      </div>
    </footer>
  );
}
