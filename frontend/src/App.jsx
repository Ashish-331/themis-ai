import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  Upload,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Scale,
  History,
  Languages,
  ArrowRight,
  Info,
  Server,
  Database,
  Cpu,
  PhoneCall,
  X,
  FileCheck2,
  Camera
} from 'lucide-react';
import heroImg from './assets/hero.png';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const SAMPLE_DOCS = [
  {
    name: 'Raksha Bandhan Notice (Parody)',
    fileName: 'raksha-bandhan-parody-notice.jpg',
    description: 'Humorous letter under fictional "Personal Emotional Damages Act, 2025"',
    url: '/sample_rakhi_notice.jpg',
    type: 'Parody / Prank'
  },
  {
    name: 'Maharashtra Rent Agreement',
    fileName: 'sample_rent_agreement.png',
    description: 'Official 11-month Leave & License agreement with deposit and notice terms',
    url: '/sample_rent_agreement.png',
    type: 'Legitimate Agreement'
  },
  {
    name: 'Digital Arrest Extortion Notice',
    fileName: 'sample_cyber_arrest_scam.png',
    description: 'Fake CBI/ED extortion notice demanding Rs. 98,500 deposit via UPI within 2 hours',
    url: '/sample_cyber_arrest_scam.png',
    type: 'Cyber Crime Scam'
  },
  {
    name: 'Sec 138 Cheque Bounce Notice',
    fileName: 'sample_cheque_bounce_notice.png',
    description: 'Statutory 15-day demand notice under Negotiable Instruments Act, 1881',
    url: '/sample_cheque_bounce_notice.png',
    type: 'Advocate Legal Notice'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('analyze'); // 'analyze' | 'history'
  const [language, setLanguage] = useState('hindi'); // 'hindi' | 'bengali' | 'marathi'
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(1);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSynthesizingSpeech, setIsSynthesizingSpeech] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioCache, setAudioCache] = useState({});
  const [voiceEngine, setVoiceEngine] = useState('Amazon Polly (Neural)');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showArchModal, setShowArchModal] = useState(false);
  const fileInputRef = useRef(null);

  // Stepper animation timer during analysis
  useEffect(() => {
    let timer;
    if (isAnalyzing) {
      setAnalysisStep(1);
      timer = setInterval(() => {
        setAnalysisStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 2400);
    } else {
      setAnalysisStep(1);
    }
    return () => clearInterval(timer);
  }, [isAnalyzing]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, [currentAudio]);

  // Fetch document history
  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/history?userId=demo-user`);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setHistoryList(data.documents || []);
    } catch (err) {
      console.error('Failed to load history:', err);
      setErrorMessage(`Could not load history from ${API_BASE_URL}. Ensure SAM local API is active.`);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  // Compress large images in browser to avoid Lambda 6MB payload limits
  const processFile = (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB. Please select a smaller document.');
      return;
    }

    setSelectedFile(file);
    setAnalysisResult(null);
    stopSpeech();

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (isPdf) {
      setFilePreview('PDF');
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageBase64(reader.result.split(',')[1]);
        }
      };
      reader.readAsDataURL(file);
      return;
    }

    // Image compression via Canvas
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1600;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFilePreview(dataUrl);
        setImageBase64(dataUrl.split(',')[1]);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSelectSample = async (sample) => {
    setSelectedFile({ name: sample.fileName, size: 85000 });
    setFilePreview(sample.url);
    setAnalysisResult(null);
    stopSpeech();

    try {
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageBase64(reader.result.split(',')[1]);
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.warn('Could not load sample blob:', err);
    }
  };

  // Run document analysis
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    stopSpeech();

    try {
      const payload = {
        fileName: selectedFile.name,
        language: language,
        userId: 'demo-user',
        imageBase64: imageBase64
      };

      const res = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Analysis failed with status ${res.status}`);
      const data = await res.json();
      setAnalysisResult(data);
    } catch (err) {
      console.error('Analyze error:', err);
      setErrorMessage(`Analysis failed: ${err.message}. Check that SAM local API is active at ${API_BASE_URL}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper to get consistent document cache key
  const getDocKey = (result) => result ? (result.SK || result.fileName || 'current-doc') : 'current-doc';

  // Text to Speech: 100% Studio-Quality Amazon Polly Neural Voice with In-Memory Caching
  const toggleSpeech = async () => {
    if (!analysisResult || !analysisResult.summary) return;
    const docKey = getDocKey(analysisResult);

    // If currently speaking, pause it
    if (isSpeaking) {
      if (currentAudio) {
        currentAudio.pause();
      }
      setIsSpeaking(false);
      return;
    }

    // 1. REPLAY CACHED AUDIO: If audio was already generated for this document, replay immediately with 0 fetch
    const cachedBase64 = audioCache[docKey];
    if (cachedBase64) {
      if (currentAudio && currentAudio.docKey === docKey) {
        currentAudio.currentTime = 0;
        await currentAudio.play();
        setIsSpeaking(true);
        return;
      }

      const audio = new Audio(`data:audio/mp3;base64,${cachedBase64}`);
      audio.docKey = docKey;
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      setCurrentAudio(audio);
      await audio.play();
      setIsSpeaking(true);
      return;
    }

    // 2. FIRST-TIME GENERATION: Fetch from Amazon Polly once
    setIsSynthesizingSpeech(true);
    setErrorMessage(null);

    // Build a crisp narration script matching the selected document language
    const currentLang = (analysisResult.language || language || 'hindi').toLowerCase();
    const firstPoint = analysisResult.summary[0] || '';
    const secondPoint = analysisResult.summary[1] || '';
    
    let narrationScript = '';
    if (currentLang === 'marathi') {
      const verdict = analysisResult.isScam 
        ? 'सावधान: हा एक संशयास्पद किंवा अनधिकृत दस्तऐवज आहे.' 
        : 'हा एक अधिकृत कायदेशीर दस्तऐवज आहे.';
      const urgency = analysisResult.urgency ? `वेळ मर्यादा: ${analysisResult.urgency}.` : '';
      narrationScript = `नमस्कार. थेमिस कायदेशीर सहाय्यक. ${verdict} मुख्य मुद्दे: ${firstPoint}. ${secondPoint}. ${urgency} अधिक माहितीसाठी वकिलांचा सल्ला घ्या.`;
    } else if (currentLang === 'bengali') {
      const verdict = analysisResult.isScam 
        ? 'Warning: This document appears to be suspicious or fraudulent.' 
        : 'This appears to be a legitimate legal document.';
      const urgency = analysisResult.urgency ? `Urgency: ${analysisResult.urgency}.` : '';
      narrationScript = `Hello, this is Themis Legal Assistant. ${verdict} Key point: ${firstPoint}. ${urgency} For full verification, please consult a verified legal advocate.`;
    } else {
      // Default Hindi
      const verdict = analysisResult.isScam 
        ? 'सावधान: यह एक संदिग्ध या अनाधिकारिक दस्तावेज़ है।' 
        : 'यह एक वैध कानूनी दस्तावेज़ है।';
      const urgency = analysisResult.urgency ? `समय सीमा: ${analysisResult.urgency}।` : '';
      narrationScript = `नमस्ते। थेमिस कानूनी सहायक। ${verdict} मुख्य बातें: ${firstPoint}। ${secondPoint}। ${urgency} अधिक जानकारी के लिए वकील से परामर्श लें।`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'speak',
          text: narrationScript,
          language: currentLang
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.audioBase64) {
        setAudioCache((prev) => ({
          ...prev,
          [docKey]: data.audioBase64
        }));

        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
        audio.docKey = docKey;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = (e) => {
          console.error('Audio playback error:', e);
          setIsSpeaking(false);
        };
        setCurrentAudio(audio);
        setVoiceEngine(data.voice || 'Amazon Polly (Kajal Neural)');
        await audio.play();
        setIsSpeaking(true);
      } else {
        throw new Error(data.error || 'Amazon Polly did not return audio.');
      }
    } catch (pollyErr) {
      console.error('Amazon Polly Error:', pollyErr);
      setErrorMessage(`Amazon Polly Voice Error: ${pollyErr.message}`);
    } finally {
      setIsSynthesizingSpeech(false);
    }
  };

  const stopSpeech = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setIsSpeaking(false);
    setIsSynthesizingSpeech(false);
  };

  // Convert numerical confidence to qualitative trust level
  const getQualitativeConfidence = (conf) => {
    const val = conf || 0.85;
    if (val >= 0.85) return { label: 'High (उच्च स्तर)', color: 'text-stone-900 bg-stone-100 border-stone-300' };
    if (val >= 0.65) return { label: 'Moderate (मध्यम)', color: 'text-amber-800 bg-amber-50 border-amber-200' };
    return { label: 'Low (संदेहास्पद)', color: 'text-rose-800 bg-rose-50 border-rose-200' };
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-900">
      {/* Top Header - Trust & Dignity */}
      <header className="border-b border-stone-200 bg-white sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-stone-900 text-amber-400 flex items-center justify-center shadow-sm flex-shrink-0">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-stone-900">THEMIS</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-md">
                  न्याय सहायक
                </span>
              </div>
              <p className="text-xs text-stone-600 font-medium hidden sm:block">
                नागरिक कानूनी दस्तावेज़ विश्लेषक व साइबर फ्रॉड जांच (AI Legal Simplifier)
              </p>
            </div>
          </div>

          {/* Citizen Primary Navigation */}
          <div className="flex items-center space-x-2">
            <nav className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-sm font-semibold">
              <button
                onClick={() => setActiveTab('analyze')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  activeTab === 'analyze'
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileText className="w-4 h-4 text-amber-700" />
                <span>दस्तावेज़ जांचें (Analyze)</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                  activeTab === 'history'
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <History className="w-4 h-4 text-amber-700" />
                <span>पुराने दस्तावेज़ (History)</span>
              </button>
            </nav>

            {/* AWS Region Badge (desktop only) */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 bg-stone-50 border border-stone-200 rounded-lg text-[11px] font-mono text-stone-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>ap-south-1</span>
            </div>
          </div>
        </div>
      </header>

      {/* Error Alert Bar */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2 max-w-6xl mx-auto w-full">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* ================= TAB 1: ANALYZE ================= */}
        {activeTab === 'analyze' && (
          <div className="space-y-8">
            {/* Citizen Language Switcher - Touch friendly (min-h 44px) */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-stone-900 flex items-center space-x-2">
                  <Languages className="w-5 h-5 text-amber-600" />
                  <span>सरल भाषा चुनें (Target Simplification Language)</span>
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  दस्तावेज़ के 5 मुख्य बिंदु और ऑडियो किस भाषा में समझना चाहते हैं?
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:w-auto w-full">
                {[
                  { id: 'hindi', label: 'हिंदी (Hindi)', sub: 'राष्ट्रभाषा • देवनागरी' },
                  { id: 'bengali', label: 'বাংলা (Bengali)', sub: 'পূর্বাঞ্চলীয় • বাংলা' },
                  { id: 'marathi', label: 'मराठी (Marathi)', sub: 'महाराष्ट्र • देवनागरी' }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`min-h-[46px] px-4 py-2 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center justify-center cursor-pointer ${
                      language === lang.id
                        ? 'bg-amber-600 border-amber-700 text-white shadow-sm'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span className={`text-[10px] font-normal ${language === lang.id ? 'text-amber-100' : 'text-stone-500'}`}>
                      {lang.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Layout: Left Upload & Samples, Right Results */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Upload & Samples (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Upload Card */}
                <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
                  <h3 className="font-bold text-stone-900 text-base mb-1.5 flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-amber-600" />
                    <span>दस्तावेज़ अपलोड करें (Upload Document)</span>
                  </h3>
                  <p className="text-xs text-stone-600 mb-4">
                    कोर्ट समन, रेंट एग्रीमेंट, पुलिस नोटिस या संदिग्ध बैंक पत्र का फोटो लें या PDF अपलोड करें।
                  </p>

                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-amber-600 bg-amber-50/50 scale-[1.01]'
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
                    <div className="w-13 h-13 rounded-full bg-white border border-stone-200 flex items-center justify-center text-amber-700 shadow-xs mb-3">
                      <Camera className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-stone-800 text-center">
                      फोटो खींचें या फाइल चुनें
                    </span>
                    <span className="text-xs text-stone-500 mt-1">
                      Camera, PNG, JPG, PDF (अधिकतम 10MB)
                    </span>
                  </div>

                  {/* Selected File Card */}
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
                            <span>जांच के लिए तैयार (Ready)</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setFilePreview(null);
                          setImageBase64(null);
                          setAnalysisResult(null);
                        }}
                        className="text-stone-400 hover:text-rose-600 p-1 rounded-md"
                        title="Remove file"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    disabled={!selectedFile || isAnalyzing}
                    onClick={handleAnalyze}
                    className={`w-full mt-5 py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-xs cursor-pointer ${
                      !selectedFile || isAnalyzing
                        ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                        : 'bg-stone-900 hover:bg-stone-800 text-white active:scale-[0.99]'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                        <span>दस्तावेज़ की कानूनी जांच जारी है...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>5 बिंदुओं में समझें ({language.toUpperCase()})</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 1-Click Samples for Testing */}
                <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold tracking-wider text-stone-700 uppercase">
                      नमूना दस्तावेज़ (Sample Documents)
                    </span>
                    <span className="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-medium">
                      तुरंत परीक्षण (1-Click Test)
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {SAMPLE_DOCS.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSample(sample)}
                        className="w-full text-left p-3 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-100/80 hover:border-stone-300 transition-all flex items-center justify-between group cursor-pointer"
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
              </div>

              {/* Right Column: Analysis Results (7 cols) */}
              <div className="lg:col-span-7">
                {/* Empty State: Empathetic 3-Step Citizen Guide */}
                {!analysisResult && !isAnalyzing && (
                  <div className="bg-white border border-stone-200 rounded-2xl p-8 sm:p-10 shadow-xs flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mb-5">
                      <Scale className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold text-stone-900">
                      सरकारी कागज़ या नोटिस का डर खत्म
                    </h3>
                    <p className="text-sm text-stone-600 max-w-md mt-1.5 leading-relaxed">
                      थेमिस (Themis) कठिन कानूनी भाषा को आपकी मातृभाषा में 5 आसान बिंदुओं में बदलता है और फर्जीवाड़े से सचेत करता है।
                    </p>

                    {/* 3 Step Visual */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mt-8 pt-6 border-t border-stone-100 text-left">
                      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70">
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">कदम १</span>
                        <h4 className="text-sm font-bold text-stone-900 mt-2">फोटो या PDF दें</h4>
                        <p className="text-xs text-stone-600 mt-1">मोबाइल से फोटो खींचें या फाइल अपलोड करें।</p>
                      </div>
                      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70">
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">कदम २</span>
                        <h4 className="text-sm font-bold text-stone-900 mt-2">मातृभाषा चुनें</h4>
                        <p className="text-xs text-stone-600 mt-1">हिंदी, बांग्ला या मराठी में सरलीकरण पाएं।</p>
                      </div>
                      <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/70">
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">कदम ३</span>
                        <h4 className="text-sm font-bold text-stone-900 mt-2">सुनें व समझें</h4>
                        <p className="text-xs text-stone-600 mt-1">Amazon Polly की प्राकृतिक आवाज में सुनें।</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Loading Stepper Animation */}
                {isAnalyzing && (
                  <div className="bg-white border border-stone-200 rounded-2xl p-10 shadow-xs flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-700">
                        <Scale className="w-8 h-8 animate-pulse" />
                      </div>
                      <div className="absolute -inset-1.5 rounded-2xl border-2 border-amber-600 border-t-transparent animate-spin"></div>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-stone-900">दस्तावेज़ की गहराई से जांच हो रही है...</h4>
                      <p className="text-xs text-stone-500 mt-1">कृप्या प्रतीक्षा करें, यह प्रक्रिया 4 से 6 सेकंड लेती है।</p>
                    </div>

                    {/* Sequential Progress Steps */}
                    <div className="w-full max-w-sm space-y-3 text-left">
                      <div className={`p-3 rounded-xl border text-xs font-medium flex items-center space-x-3 transition-all ${
                        analysisStep >= 1 ? 'bg-amber-50 border-amber-300 text-stone-900' : 'bg-stone-50 border-stone-200 text-stone-400'
                      }`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          analysisStep > 1 ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {analysisStep > 1 ? '✓' : '1'}
                        </div>
                        <span>१. Amazon Textract से कानूनी शब्दों को पढ़ना (OCR)</span>
                      </div>

                      <div className={`p-3 rounded-xl border text-xs font-medium flex items-center space-x-3 transition-all ${
                        analysisStep >= 2 ? 'bg-amber-50 border-amber-300 text-stone-900' : 'bg-stone-50 border-stone-200 text-stone-400'
                      }`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          analysisStep > 2 ? 'bg-emerald-600 text-white' : (analysisStep === 2 ? 'bg-amber-600 text-white' : 'bg-stone-300 text-stone-600')
                        }`}>
                          {analysisStep > 2 ? '✓' : '2'}
                        </div>
                        <span>२. AI लीगल इंजन द्वारा धाराओं व शर्तों का विश्लेषण</span>
                      </div>

                      <div className={`p-3 rounded-xl border text-xs font-medium flex items-center space-x-3 transition-all ${
                        analysisStep >= 3 ? 'bg-amber-50 border-amber-300 text-stone-900' : 'bg-stone-50 border-stone-200 text-stone-400'
                      }`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          analysisStep === 3 ? 'bg-amber-600 text-white' : 'bg-stone-300 text-stone-600'
                        }`}>
                          3
                        </div>
                        <span>३. फर्जीवाड़े की जांच व मातृभाषा रिपोर्ट तैयार करना</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analysis Results View */}
                {analysisResult && !isAnalyzing && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Top Result Card with Multilingual Audio Player */}
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

                      {/* Amazon Polly Voiceover Button */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={toggleSpeech}
                          disabled={isSynthesizingSpeech}
                          className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 border transition-all cursor-pointer ${
                            isSpeaking
                              ? 'bg-amber-600 text-white border-amber-700 shadow-sm animate-pulse'
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
                              ? 'रुकें (Pause)'
                              : audioCache[getDocKey(analysisResult)]
                              ? 'फिर से सुनें (Replay)'
                              : 'सुनें (Listen Audio)'}
                          </span>
                          {audioCache[getDocKey(analysisResult)] && !isSpeaking && !isSynthesizingSpeech && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-900 font-mono px-1.5 py-0.5 rounded ml-1 border border-emerald-300 font-bold">
                              Cached
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Dominant Scam Risk Assessment Banner (Colorblind-Safe) */}
                    <div
                      className={`p-6 rounded-2xl border-2 shadow-xs flex items-start space-x-4 ${
                        analysisResult.isScam
                          ? 'bg-rose-50/80 border-rose-500 text-rose-950'
                          : 'bg-emerald-50/80 border-emerald-600 text-emerald-950'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                          analysisResult.isScam ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {analysisResult.isScam ? <AlertTriangle className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-extrabold text-lg tracking-tight">
                            {analysisResult.isScam
                              ? '🛑 सावधान: संदिग्ध या फर्जी दस्तावेज़ (Scam / Warning)'
                              : '✅ सुरक्षित: आधिकारिक व वैध कानूनी दस्तावेज़ (Legitimate)'}
                          </h4>

                          {/* Qualitative Confidence Badge */}
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-md border font-semibold ${
                              getQualitativeConfidence(analysisResult.confidence).color
                            }`}
                          >
                            विश्वास स्तर: {getQualitativeConfidence(analysisResult.confidence).label}
                          </span>
                        </div>

                        <p className="text-sm mt-2 font-vernacular leading-relaxed opacity-95">
                          {analysisResult.scamReason}
                        </p>
                      </div>
                    </div>

                    {/* Required Timeline / Urgency Alert */}
                    {analysisResult.urgency && (
                      <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex items-start space-x-3 text-amber-950">
                        <Clock className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                        <div className="text-sm leading-relaxed">
                          <span className="font-bold">आवश्यक समय-सीमा (Timeline): </span>
                          <span className="font-vernacular">{analysisResult.urgency}</span>
                        </div>
                      </div>
                    )}

                    {/* 5-Point Simplified Breakdown */}
                    <div className="bg-white border border-stone-200 p-6 rounded-2xl shadow-xs">
                      <h4 className="text-base font-bold text-stone-900 mb-4 flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-amber-700" />
                        <span>5 मुख्य बिंदु ({analysisResult.language.toUpperCase()})</span>
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
                      <h4 className="text-base font-bold text-stone-900 mb-4 flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                        <span>आगे क्या करें? (Actionable Next Steps)</span>
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
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: HISTORY ================= */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-stone-900 flex items-center space-x-2">
                  <History className="w-5 h-5 text-amber-700" />
                  <span>आपके पुराने दस्तावेज़ (Document History)</span>
                </h2>
                <p className="text-xs text-stone-600 mt-0.5">
                  आपके द्वारा पूर्व में जाँचे गए दस्तावेज़ों के सुरक्षित रिकॉर्ड
                </p>
              </div>

              <button
                onClick={fetchHistory}
                disabled={isLoadingHistory}
                className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold flex items-center space-x-1.5 text-stone-800 shadow-xs cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                <span>रीफ्रेश करें (Refresh)</span>
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
                    onClick={() => {
                      setAnalysisResult(doc);
                      setActiveTab('analyze');
                    }}
                    className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-stone-400 hover:shadow-xs transition-all cursor-pointer group"
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
        )}
      </main>

      {/* Citizen Trust & Helplines Footer */}
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
              onClick={() => setShowArchModal(true)}
              className="text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer flex items-center space-x-1"
            >
              <Server className="w-3.5 h-3.5" />
              <span>AWS Cloud Architecture & Spec (For Evaluators)</span>
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

      {/* Architecture Modal for Judges / Developers */}
      {showArchModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-lg text-stone-900">Themis AWS Serverless Architecture & Stack</h3>
              </div>
              <button
                onClick={() => setShowArchModal(false)}
                className="text-stone-400 hover:text-stone-800 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-stone-700 leading-relaxed">
              <p>
                Themis is built 100% on serverless AWS primitives configured via AWS SAM (<code className="font-mono bg-stone-100 px-1 py-0.5 rounded">template.yaml</code>):
              </p>

              <table className="w-full border border-stone-200 text-left rounded-lg overflow-hidden">
                <thead className="bg-stone-50 text-stone-900 font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">AWS Service</th>
                    <th className="p-2.5">Implementation Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  <tr>
                    <td className="p-2.5 font-semibold text-stone-900">Amazon Textract</td>
                    <td className="p-2.5">Extracts structured raw text from physical notices, seals, and summons with zero server overhead.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-stone-900">Amazon Polly (Neural)</td>
                    <td className="p-2.5">Studio voice <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-amber-900">Kajal (Neural hi-IN & en-IN)</code> provides human-cadence audio narration.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-stone-900">Amazon Bedrock / Groq</td>
                    <td className="p-2.5">Simplifies legal clauses into 5 citizen points, verifies statutory sections, and calculates scam probability.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-stone-900">Amazon DynamoDB</td>
                    <td className="p-2.5">Single-table design (<code className="font-mono bg-stone-100 px-1 py-0.5 rounded">themis-documents</code>) with composite PK/SK and GSI1 for sub-10ms scans.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-stone-900">Amazon S3</td>
                    <td className="p-2.5">Stores multi-megabyte document scans and PDFs with presigned upload URLs.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-semibold text-stone-900">AWS Lambda & SAM</td>
                    <td className="p-2.5">Node.js 22 serverless microservices (<code className="font-mono bg-stone-100 px-1 py-0.5 rounded">analyze</code>, <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">history</code>) scaling to zero.</td>
                  </tr>
                </tbody>
              </table>

              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900 block mb-1">LocalStack & Production Parity:</span>
                LocalStack emulates DynamoDB and S3 for completely offline testing, while Amazon Polly and Textract connect to live AWS Mumbai endpoints (<code className="font-mono bg-stone-100 px-1 py-0.5 rounded">ap-south-1</code>).
              </div>
            </div>

            <div className="border-t border-stone-200 pt-4 text-right">
              <button
                onClick={() => setShowArchModal(false)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close (बंद करें)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
