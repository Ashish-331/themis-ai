import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

import Header from './components/Header';
import LanguageSelector from './components/LanguageSelector';
import UploadZone from './components/UploadZone';
import SampleDocs from './components/SampleDocs';
import EmptyState from './components/EmptyState';
import AnalysisProgress from './components/AnalysisProgress';
import AnalysisResultView from './components/AnalysisResultView';
import HistoryView from './components/HistoryView';
import ArchitectureModal from './components/ArchitectureModal';
import Footer from './components/Footer';

import { SAMPLE_DOCS } from './data/sampleDocs';
import { TRANSLATIONS } from './data/translations';

const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

export default function App() {
  const [activeTab, setActiveTab] = useState('analyze'); // 'analyze' | 'history'
  const [language, setLanguage] = useState('english'); // 'english' (default) | 'hindi'
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
  const [, setVoiceEngine] = useState('Amazon Polly (Neural)');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showArchModal, setShowArchModal] = useState(false);
  const fileInputRef = useRef(null);

  // Active translation dictionary
  const t = TRANSLATIONS[language] || TRANSLATIONS.english;

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

  // Compress large images in browser to avoid Lambda payload limits
  const processFile = (file) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File size exceeds 10MB limit. Please select a smaller document scan.');
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

    // Canvas image compression
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

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setImageBase64(null);
    setAnalysisResult(null);
    stopSpeech();
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

    // 1. REPLAY CACHED AUDIO
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

    const currentLang = (analysisResult.language || language || 'english').toLowerCase();
    const firstPoint = analysisResult.summary[0] || '';
    const secondPoint = analysisResult.summary[1] || '';
    
    let narrationScript = '';
    if (currentLang === 'hindi') {
      const verdict = analysisResult.isScam 
        ? 'सावधान: यह एक संदिग्ध या अनाधिकारिक दस्तावेज़ है।' 
        : 'यह एक वैध कानूनी दस्तावेज़ है।';
      const urgency = analysisResult.urgency ? `समय सीमा: ${analysisResult.urgency}।` : '';
      narrationScript = `नमस्ते। थेमिस कानूनी सहायक। ${verdict} मुख्य बातें: ${firstPoint}। ${secondPoint}। ${urgency} अधिक जानकारी के लिए वकील से परामर्श लें।`;
    } else {
      // Default English
      const verdict = analysisResult.isScam 
        ? 'Warning: This document appears to be suspicious or fraudulent.' 
        : 'This document appears to be a legitimate legal instrument.';
      const urgency = analysisResult.urgency ? `Urgency and timeline: ${analysisResult.urgency}.` : '';
      narrationScript = `Hello, this is Themis Legal Assistant. ${verdict} Key takeaways: ${firstPoint}. ${secondPoint}. ${urgency} For full legal verification, please consult a qualified advocate.`;
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

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-950">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        t={t}
      />

      {/* Error Alert Bar */}
      {errorMessage && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-3 text-rose-800 text-xs sm:text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2 max-w-6xl mx-auto w-full">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-700 hover:text-rose-900 text-xs font-bold px-2 py-1 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {activeTab === 'analyze' && (
          <div className="space-y-6">
            <LanguageSelector language={language} setLanguage={setLanguage} t={t} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Upload & Verified Samples */}
              <div className="lg:col-span-5 space-y-6">
                <UploadZone
                  selectedFile={selectedFile}
                  filePreview={filePreview}
                  fileInputRef={fileInputRef}
                  isDragging={isDragging}
                  handleDragOver={handleDragOver}
                  handleDragLeave={handleDragLeave}
                  handleDrop={handleDrop}
                  handleFileChange={handleFileChange}
                  handleRemoveFile={handleRemoveFile}
                  handleAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                  t={t}
                />

                <SampleDocs
                  sampleDocs={SAMPLE_DOCS}
                  onSelectSample={handleSelectSample}
                  language={language}
                  t={t}
                />
              </div>

              {/* Right Column: Dynamic Analysis Output */}
              <div className="lg:col-span-7">
                {!analysisResult && !isAnalyzing && <EmptyState t={t} />}

                {isAnalyzing && <AnalysisProgress analysisStep={analysisStep} t={t} />}

                {analysisResult && !isAnalyzing && (
                  <AnalysisResultView
                    analysisResult={analysisResult}
                    isSpeaking={isSpeaking}
                    isSynthesizingSpeech={isSynthesizingSpeech}
                    toggleSpeech={toggleSpeech}
                    hasCachedAudio={Boolean(audioCache[getDocKey(analysisResult)])}
                    t={t}
                    language={language}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryView
            historyList={historyList}
            isLoadingHistory={isLoadingHistory}
            fetchHistory={fetchHistory}
            onSelectDoc={(doc) => {
              setAnalysisResult(doc);
              setActiveTab('analyze');
            }}
            t={t}
            language={language}
          />
        )}
      </main>

      <Footer onOpenArchModal={() => setShowArchModal(true)} t={t} />

      <ArchitectureModal
        isOpen={showArchModal}
        onClose={() => setShowArchModal(false)}
        t={t}
      />
    </div>
  );
}
