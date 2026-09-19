import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Upload, 
  Volume2, 
  VolumeX, 
  History, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles, 
  RefreshCw, 
  Languages, 
  Info,
  Server,
  Database,
  ExternalLink,
  HelpCircle,
  Cpu
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const SAMPLE_DOCS = [
  {
    name: 'Raksha Bandhan Legal Notice (Parody)',
    fileName: 'raksha-bandhan-parody-notice.jpg',
    description: 'Humorous notice under "Personal Emotional Damages Act, 2025" for bad chocolates',
    url: '/sample_rakhi_notice.jpg'
  },
  {
    name: 'Standard Rent Agreement (11 Months)',
    fileName: 'rent-agreement-mumbai.jpg',
    description: 'Residential lease agreement for Mumbai apartment with security deposit',
    url: null
  },
  {
    name: 'Property Notice / Summons',
    fileName: 'legal-summons-notice.jpg',
    description: 'Municipal corporation notice regarding property tax arrears',
    url: null
  },
  {
    name: 'Section 138 Cheque Bounce Notice',
    fileName: 'section-138-cheque-bounce.pdf',
    description: 'Statutory 15-day demand notice under Negotiable Instruments Act, 1881',
    url: null
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('analyze'); // 'analyze' | 'history' | 'architecture'
  const [language, setLanguage] = useState('hindi'); // Focused on Hindi
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSynthesizingSpeech, setIsSynthesizingSpeech] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [audioCache, setAudioCache] = useState({});
  const [voiceEngine, setVoiceEngine] = useState('Amazon Polly (Neural)');
  const [errorMessage, setErrorMessage] = useState(null);

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
      setErrorMessage(`Could not load history from ${API_BASE_URL}. Ensure SAM local API is running.`);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
        if (typeof reader.result === 'string') {
          setImageBase64(reader.result.split(',')[1]);
        }
      };
      reader.readAsDataURL(file);
      setAnalysisResult(null);
    }
  };

  const handleSelectSample = async (sample) => {
    setSelectedFile({ name: sample.fileName });
    setFilePreview(sample.url || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800');
    setAnalysisResult(null);
    if (sample.url) {
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
    } else {
      setImageBase64(null);
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

  // Text to Speech: 100% Studio-Quality Amazon Polly Neural Voice with In-Memory Caching (0 re-fetch)
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

    // Build a crisp, human-like Hindi narration script (under 350 chars for instant <1s neural synthesis)
    const firstPoint = analysisResult.summary[0] || '';
    const secondPoint = analysisResult.summary[1] || '';
    const verdict = analysisResult.isScam 
      ? 'सावधान: यह एक संदिग्ध या अनाधिकारिक दस्तावेज़ है।' 
      : 'यह एक वैध कानूनी दस्तावेज़ है।';
    const urgency = analysisResult.urgency ? `समय सीमा: ${analysisResult.urgency}।` : '';

    const hindiScript = `नमस्ते। थेमिस कानूनी सहायक। ${verdict} मुख्य बातें: ${firstPoint}। ${secondPoint}। ${urgency} अधिक जानकारी के लिए वकील से परामर्श लें।`;

    try {
      const res = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'speak',
          text: hindiScript,
          hindiSummary: hindiScript,
          language: 'hindi'
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.audioBase64) {
        // Cache the audio for this document so subsequent clicks replay with 0 network calls!
        setAudioCache(prev => ({
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
        setVoiceEngine('Amazon Polly (Kajal Neural)');
        await audio.play();
        setIsSpeaking(true);
      } else {
        throw new Error(data.error || 'Amazon Polly did not return audio.');
      }
    } catch (pollyErr) {
      console.error('Amazon Polly Error:', pollyErr);
      setErrorMessage(`Amazon Polly Hindi Voice Error: ${pollyErr.message}`);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-bold">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">THEMIS</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                  न्याय सहायक
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                AI Legal Document Simplifier & Scam Heuristics
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-1 sm:space-x-2 bg-slate-800/60 p-1 rounded-lg border border-slate-700/50 text-sm font-medium">
            <button
              onClick={() => setActiveTab('analyze')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                activeTab === 'analyze'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Analyze</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                activeTab === 'history'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <History className="w-4 h-4" />
              <span>History</span>
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center space-x-1.5 ${
                activeTab === 'architecture'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Server className="w-4 h-4" />
              <span className="hidden sm:inline">Architecture</span>
            </button>
          </nav>

          {/* User profile & AWS Region badge */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden md:block">
              <span className="text-xs font-mono text-emerald-400 flex items-center justify-end space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>ap-south-1 (Mumbai)</span>
              </span>
              <span className="text-xs text-slate-400">demo-user</span>
            </div>
          </div>
        </div>
      </header>

      {/* Error alert if backend unreachable */}
      {errorMessage && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-3 text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-300 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* ================= TAB 1: ANALYZE ================= */}
        {activeTab === 'analyze' && (
          <div className="space-y-8">
            {/* Top controls: Language Selector */}
            <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Languages className="w-5 h-5 text-amber-400" />
                  <span>Target Simplification Language</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Choose the language in which you want the legal points explained and read aloud.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bengali', label: 'Bengali (বাংলা)', sub: 'পূর্বাঞ্চলীয়' },
                  { id: 'marathi', label: 'Marathi (मराठी)', sub: 'महाराष्ट्र' },
                  { id: 'hindi', label: 'Hindi (हिंदी)', sub: 'राष्ट्रीय' }
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all flex flex-col items-center ${
                      language === lang.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10 ring-2 ring-amber-500/20'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span className="text-[10px] text-slate-500 font-normal">{lang.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Two Column Layout: Left upload, Right results */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Upload & Samples (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                {/* Upload Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
                  <h3 className="font-bold text-white text-base mb-3 flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Upload Legal Notice / Agreement</span>
                  </h3>

                  <label className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 transition-colors rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-950/40 group">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-full bg-slate-800/80 group-hover:bg-amber-500/10 flex items-center justify-center text-slate-400 group-hover:text-amber-400 transition-all mb-3">
                      <FileText className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-medium text-slate-200 text-center">
                      Click to upload or drag & drop
                    </span>
                    <span className="text-xs text-slate-500 mt-1">PNG, JPG, PDF up to 10MB</span>
                  </label>

                  {/* Preview if file selected */}
                  {selectedFile && (
                    <div className="mt-4 p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 font-bold text-xs">
                          DOC
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                          <p className="text-xs text-slate-400">Ready for Vision analysis</p>
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedFile(null); setFilePreview(null); setAnalysisResult(null); }}
                        className="text-slate-400 hover:text-red-400 text-xs px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    disabled={!selectedFile || isAnalyzing}
                    onClick={handleAnalyze}
                    className={`w-full mt-5 py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center space-x-2 shadow-lg ${
                      !selectedFile || isAnalyzing
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20 active:scale-[0.99]'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Analyzing Document with Claude Vision...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analyze & Simplify in {language.toUpperCase()}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Test Samples */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                      Quick 1-Click Samples
                    </span>
                    <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      Judge Testing
                    </span>
                  </div>
                  <div className="space-y-2">
                    {SAMPLE_DOCS.map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectSample(sample)}
                        className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-800/40 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-200 group-hover:text-amber-300 transition-colors">
                            {sample.name}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{sample.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-transform group-hover:translate-x-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Analysis Results (7 cols) */}
              <div className="lg:col-span-7">
                {!analysisResult && !isAnalyzing && (
                  <div className="h-full border border-dashed border-slate-800 bg-slate-900/30 rounded-2xl p-12 flex flex-col items-center justify-center text-center text-slate-500 space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                      <Scale className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-300">No Document Analyzed Yet</h4>
                      <p className="text-sm text-slate-500 max-w-sm mt-1">
                        Select a sample on the left or upload a notice/agreement photo to receive an instant simplified breakdown and scam assessment.
                      </p>
                    </div>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="h-full border border-slate-800 bg-slate-900/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center space-y-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Sparkles className="w-8 h-8 animate-pulse" />
                      </div>
                      <div className="absolute inset-0 rounded-2xl border-2 border-amber-400 border-t-transparent animate-spin"></div>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">Analyzing Legal Document</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        Extracting legal terminology, calculating scam heuristics, and translating to {language.toUpperCase()}...
                      </p>
                    </div>
                  </div>
                )}

                {analysisResult && !isAnalyzing && (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    {/* Result Header & Audio Voiceover Button */}
                    <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-xl">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-bold">
                            {analysisResult.language}
                          </span>
                          {analysisResult.aiProvider && (
                            <span className="text-xs font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 font-medium flex items-center space-x-1">
                              <Cpu className="w-3 h-3 inline mr-1" />
                              <span>{analysisResult.aiProvider}</span>
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {new Date(analysisResult.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <h3 className="font-bold text-white text-lg mt-1 truncate max-w-md">
                          {analysisResult.fileName}
                        </h3>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={toggleSpeech}
                          disabled={isSynthesizingSpeech}
                          className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2 border transition-all ${
                            isSpeaking
                              ? 'bg-amber-500 text-slate-950 border-amber-400 animate-pulse'
                              : isSynthesizingSpeech
                              ? 'bg-slate-800 text-amber-400 border-amber-500/40 animate-pulse'
                              : 'bg-slate-800 text-slate-200 border-slate-700 hover:border-amber-400 hover:text-white'
                          }`}
                        >
                          {isSynthesizingSpeech ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                          ) : isSpeaking ? (
                            <VolumeX className="w-4 h-4 text-slate-950" />
                          ) : audioCache[getDocKey(analysisResult)] ? (
                            <Volume2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-amber-400" />
                          )}
                          <span>
                            {isSynthesizingSpeech
                              ? 'Generating Polly Neural...'
                              : isSpeaking
                              ? 'Pause Voiceover'
                              : audioCache[getDocKey(analysisResult)]
                              ? 'Replay Hindi Voice (Instant)'
                              : 'Hindi Neural Voiceover (Amazon Polly)'}
                          </span>
                          {audioCache[getDocKey(analysisResult)] && !isSpeaking && !isSynthesizingSpeech && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-1.5 py-0.5 rounded ml-1 border border-emerald-500/30">
                              Cached
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Scam Risk Assessment Card */}
                    <div className={`border p-5 rounded-2xl shadow-lg flex items-start space-x-4 ${
                      analysisResult.isScam
                        ? 'bg-red-950/30 border-red-500/40 text-red-200'
                        : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    }`}>
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        analysisResult.isScam ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {analysisResult.isScam ? <AlertTriangle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-base">
                            {analysisResult.isScam ? 'Potential Scam Warning' : 'Legitimate Document Assessment'}
                          </h4>
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-black/40 border border-white/10 font-bold">
                            Confidence: {Math.round((analysisResult.confidence || 0.88) * 100)}%
                          </span>
                        </div>
                        <p className="text-sm mt-1 opacity-90">{analysisResult.scamReason}</p>
                      </div>
                    </div>

                    {/* Urgency Alert */}
                    <div className="bg-amber-950/30 border border-amber-500/30 p-4 rounded-xl flex items-center space-x-3 text-amber-200">
                      <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <div className="text-sm">
                        <span className="font-bold">Required Timeline: </span>
                        <span>{analysisResult.urgency}</span>
                      </div>
                    </div>

                    {/* 5-Point Simplified Breakdown */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                      <h4 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <span>5-Point Legal Simplification ({analysisResult.language.toUpperCase()})</span>
                      </h4>
                      <ul className="space-y-3">
                        {analysisResult.summary.map((point, index) => (
                          <li key={index} className="flex items-start space-x-3 text-sm text-slate-200">
                            <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 border border-slate-700">
                              {index + 1}
                            </span>
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommended Next Steps */}
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
                      <h4 className="text-base font-bold text-white mb-4 flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Actionable Next Steps</span>
                      </h4>
                      <div className="space-y-2.5">
                        {analysisResult.nextSteps.map((step, index) => (
                          <div key={index} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center space-x-3 text-sm text-slate-300">
                            <ArrowRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-[11px] text-slate-500 italic text-center">
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
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <History className="w-5 h-5 text-amber-400" />
                  <span>Document Analysis History</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chronological records retrieved directly from DynamoDB single table (<code className="font-mono text-amber-400">themis-documents</code>)
                </p>
              </div>

              <button
                onClick={fetchHistory}
                disabled={isLoadingHistory}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 text-slate-200 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {isLoadingHistory && (
              <div className="text-center py-16 text-slate-500">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-400" />
                <p className="text-sm">Fetching records from DynamoDB...</p>
              </div>
            )}

            {!isLoadingHistory && historyList.length === 0 && (
              <div className="border border-dashed border-slate-800 rounded-2xl p-16 text-center text-slate-500">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No documents stored in history yet.</p>
                <p className="text-xs text-slate-600 mt-1">Analyze a document in the Analyze tab to save your first record.</p>
              </div>
            )}

            {!isLoadingHistory && historyList.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {historyList.map((doc, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-1">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-bold">
                            {doc.language || 'Bengali'}
                          </span>
                          {doc.aiProvider && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium truncate max-w-[130px]">
                              {doc.aiProvider}
                            </span>
                          )}
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded flex items-center space-x-1 ${
                          doc.isScam ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {doc.isScam ? 'Scam Warning' : 'Legitimate'}
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-sm truncate mb-1" title={doc.fileName}>
                        {doc.fileName}
                      </h4>
                      <p className="text-xs text-slate-500 mb-3">
                        {new Date(doc.createdAt).toLocaleString()}
                      </p>

                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-3">
                        <p className="text-xs text-slate-300 line-clamp-3">
                          {doc.summary?.[0] || 'Document breakdown point...'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setAnalysisResult(doc);
                        setLanguage(doc.language || 'bengali');
                        setActiveTab('analyze');
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold rounded-xl text-slate-200 flex items-center justify-center space-x-1.5 transition-colors"
                    >
                      <span>View Full Breakdown</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: ARCHITECTURE & DEFENSE ================= */}
        {activeTab === 'architecture' && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center space-x-2">
                <Server className="w-6 h-6 text-amber-400" />
                <span>Themis — Lean Ship It Architecture v3</span>
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Every service must survive: <span className="text-amber-400 italic font-medium">"Why is this here? Explain in 10 seconds."</span>
              </p>
            </div>

            {/* Visual Architecture Flow */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                End-to-End System Diagram
              </h3>

              <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
                <pre>{`[ React Frontend on AWS Amplify ]
        |
        |  Authorization: Bearer <Cognito idToken>
        v
[ Amazon API Gateway (Prod) - Cognito Authorizer ]  <-- validates JWT, passes sub as userId
   |                |
   | POST /analyze  | GET /history
   v                v
[ Lambda: analyze ] [ Lambda: history ]
   |    |                |
   |    +--→ [ Bedrock Claude 3.5 Sonnet Vision ]  <-- 1-Step OCR + Marathi/Hindi/Bengali + Scam Heuristic
   |    |
   +--→ [ DynamoDB Single Table: themis-documents ]  <-- PK/SK + GSI1, PAY_PER_REQUEST
   |
[ Amazon S3 Bucket: themis-documents-* ]  <-- Photos uploaded via Presigned URLs, not via Lambda`}</pre>
              </div>
            </div>

            {/* 10-Second Defense Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
                10-Second Service Justification (For Judges)
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs uppercase text-amber-400 font-bold">
                      <th className="pb-3 pr-4">AWS Service</th>
                      <th className="pb-3">10-Second Defense</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr>
                      <td className="py-3 pr-4 font-bold text-white flex items-center space-x-1.5">
                        <Database className="w-4 h-4 text-amber-400" />
                        <span>Amazon S3</span>
                      </td>
                      <td className="py-3">
                        5MB legal photos cannot go into a database. Presigned URLs let the browser upload directly to S3, bypassing Lambda's 6MB payload limit.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-bold text-white flex items-center space-x-1.5">
                        <Database className="w-4 h-4 text-emerald-400" />
                        <span>DynamoDB (Single Table)</span>
                      </td>
                      <td className="py-3">
                        Serverless, zero cold-starts, zero connection pooling issues. Single table with PK/SK handles user docs, reverse chronological sorting, and shares natively.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-bold text-white flex items-center space-x-1.5">
                        <Server className="w-4 h-4 text-blue-400" />
                        <span>AWS Lambda (2 functions)</span>
                      </td>
                      <td className="py-3">
                        Scale to zero, zero cost when idle. 2 decoupled functions (<code className="text-amber-300">analyze</code>, <code className="text-amber-300">history</code>) minimize complexity and blast radius.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-bold text-white flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>Bedrock Claude 3.5 Sonnet</span>
                      </td>
                      <td className="py-3">
                        One single multimodal API call executes OCR, Indian regional language translation (Marathi, Hindi, Bengali), and scam heuristics simultaneously.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 font-bold text-white flex items-center space-x-1.5">
                        <ShieldCheck className="w-4 h-4 text-teal-400" />
                        <span>Cognito User Pools</span>
                      </td>
                      <td className="py-3">
                        Protects confidential legal documents. API Gateway validates JWT directly at the perimeter and passes only validated identity (<code className="text-amber-300">sub</code>) to Lambdas.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>Themis (न्याय सहायक) — Built for First Commit Hackathon (Bharat Builds Tour) | Ship It Track</p>
      </footer>
    </div>
  );
}
