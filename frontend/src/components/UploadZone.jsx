import React from 'react';
import { Camera, FileText, CheckCircle2, X, RefreshCw, ArrowRight, UploadCloud } from 'lucide-react';
import { TRANSLATIONS } from '../data/translations';

export default function UploadZone({
  selectedFile,
  filePreview,
  fileInputRef,
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileChange,
  handleRemoveFile,
  handleAnalyze,
  isAnalyzing,
  t
}) {
  const safeT = t || TRANSLATIONS.english;
  return (
    <div className="premium-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="font-bold text-stone-900 text-sm tracking-tight">
          {safeT.uploadTitle}
        </h3>
        <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400 bg-stone-100 px-2 py-0.5 rounded">
          OCR & AI
        </span>
      </div>
      <p className="text-xs text-stone-500 mb-4 leading-relaxed">
        {safeT.uploadDesc}
      </p>

      {/* Interactive Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging
            ? 'border-amber-600 bg-amber-50/50 scale-[1.005]'
            : 'border-stone-300/80 hover:border-amber-600/70 bg-[#FAF8F5]/80 hover:bg-[#FAF8F5]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,.pdf"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-center text-amber-700 mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold text-stone-800 text-center tracking-tight">
          {isDragging ? safeT.dragDropActive : safeT.dragDropText}
        </span>
        <span className="text-[11px] text-stone-400 mt-1 font-mono">
          {safeT.supportedFormats}
        </span>
      </div>

      {/* Selected File Card */}
      {selectedFile && (
        <div className="mt-4 p-3 bg-stone-50 border border-stone-200/80 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            {filePreview && filePreview !== 'PDF' ? (
              <img
                src={filePreview}
                alt="Document Preview"
                className="w-12 h-12 object-cover rounded-lg border border-stone-300/80 flex-shrink-0 shadow-2xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-amber-100/70 border border-amber-200 flex flex-col items-center justify-center text-amber-900 flex-shrink-0 font-bold text-[11px] font-mono">
                <FileText className="w-5 h-5 mb-0.5" />
                <span>PDF</span>
              </div>
            )}
            <div className="truncate">
              <p className="text-xs font-bold text-stone-900 truncate tracking-tight">{selectedFile.name}</p>
              <p className="text-[11px] text-stone-500 flex items-center space-x-1 mt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{safeT.readyToAnalyze}</span>
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveFile();
            }}
            className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            title="Remove document"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Analyze Action Button */}
      <button
        disabled={!selectedFile || isAnalyzing}
        onClick={handleAnalyze}
        className={`w-full mt-5 py-3.5 px-4 rounded-xl font-bold text-xs tracking-tight transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer ${
          !selectedFile || isAnalyzing
            ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
            : 'bg-[#181614] hover:bg-stone-800 text-white active:scale-[0.99] border border-stone-800'
        }`}
      >
        {isAnalyzing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>{safeT.analyzingBtn}</span>
          </>
        ) : (
          <>
            <ArrowRight className="w-4 h-4 text-amber-400" />
            <span>{safeT.btnAnalyze}</span>
          </>
        )}
      </button>
    </div>
  );
}
