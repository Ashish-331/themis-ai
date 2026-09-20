import React from 'react';
import { Camera, FileText, CheckCircle2, X, RefreshCw, ArrowRight } from 'lucide-react';

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
  isAnalyzing
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
      <h3 className="font-semibold text-stone-900 text-base mb-1.5">
        दस्तावेज़ अपलोड करें
      </h3>
      <p className="text-xs text-stone-500 mb-4">
        कोर्ट समन, रेंट एग्रीमेंट, पुलिस नोटिस या संदिग्ध बैंक पत्र का फोटो लें या PDF अपलोड करें।
      </p>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-amber-600 bg-amber-50/50'
            : 'border-stone-300 hover:border-amber-600/70 bg-stone-50/70'
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
        <div className="w-12 h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center text-amber-700 shadow-xs mb-3">
          <Camera className="w-6 h-6" />
        </div>
        <span className="text-sm font-semibold text-stone-800 text-center">
          फोटो खींचें या फाइल चुनें
        </span>
        <span className="text-xs text-stone-500 mt-1">
          Camera, PNG, JPG, PDF (अधिकतम 10MB)
        </span>
      </div>

      {/* Selected File Preview Card */}
      {selectedFile && (
        <div className="mt-4 p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            {filePreview && filePreview !== 'PDF' ? (
              <img
                src={filePreview}
                alt="Document Preview"
                className="w-12 h-12 object-cover rounded-lg border border-stone-300 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-amber-100 border border-amber-300 flex flex-col items-center justify-center text-amber-900 flex-shrink-0 font-bold text-xs">
                <FileText className="w-5 h-5" />
                <span>PDF</span>
              </div>
            )}
            <div className="truncate">
              <p className="text-sm font-semibold text-stone-900 truncate">{selectedFile.name}</p>
              <p className="text-xs text-stone-500 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>जांच के लिए तैयार</span>
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveFile();
            }}
            className="text-stone-400 hover:text-rose-600 p-1 rounded-md transition-colors"
            title="Remove file"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Analyze Action Button */}
      <button
        disabled={!selectedFile || isAnalyzing}
        onClick={handleAnalyze}
        className={`w-full mt-5 py-3.5 px-4 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center space-x-2 shadow-xs ${
          !selectedFile || isAnalyzing
            ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
            : 'bg-stone-900 hover:bg-stone-800 text-white active:scale-[0.99]'
        }`}
      >
        {isAnalyzing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>दस्तावेज़ की जांच जारी है...</span>
          </>
        ) : (
          <>
            <ArrowRight className="w-4 h-4 text-amber-400" />
            <span>5 बिंदुओं में समझें</span>
          </>
        )}
      </button>
    </div>
  );
}
