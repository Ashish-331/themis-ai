export const TRANSLATIONS = {
  english: {
    brandName: 'THEMIS',
    brandBadge: 'Legal Intelligence',
    brandTagline: 'AI Legal Simplifier & Cyber Scam Detection',
    tabAnalyze: 'Analyze Document',
    tabHistory: 'Audit History',
    
    // Language Switcher
    targetLangLabel: 'Language',
    targetLangDesc: 'Target language for simplification & voiceover',
    langEn: 'English',
    langHi: 'हिन्दी',

    // Upload
    uploadTitle: 'Upload Legal Document',
    uploadDesc: 'Upload court summons, lease agreements, statutory notices, or bank letters (PDF, PNG, JPG).',
    dragDropText: 'Take photo or choose document file',
    dragDropActive: 'Drop file here to analyze',
    supportedFormats: 'Camera, PDF, PNG, JPG (up to 10MB)',
    readyToAnalyze: 'Ready for analysis',
    btnAnalyze: 'Simplify in 5 Key Points',
    analyzingBtn: 'Analyzing legal provisions...',

    // Sample Docs
    sampleTitle: 'Verified Sample Documents',
    sampleBadge: '1-Click Demo',

    // Empty State
    emptyTitle: 'Verify Any Legal Document in Seconds',
    emptyDesc: 'Themis converts complex Indian legal language into 5 actionable takeaways in your preferred language and flags extortion scams instantly.',
    step1Title: 'Upload Document',
    step1Desc: 'Take a photo with your mobile or upload a PDF / scan.',
    step2Title: 'Select Language',
    step2Desc: 'Choose English or Hindi for plain-language translation.',
    step3Title: 'Listen & Act',
    step3Desc: 'Read key takeaways or listen via Amazon Polly neural voice.',

    // Stepper
    loadingTitle: 'Analyzing Legal Document...',
    loadingSubtitle: 'Processing through AWS serverless pipeline (~4 to 6s)',
    stepOcr: '1. Extracting text & statutory seals via Amazon Textract',
    stepNlp: '2. Analyzing legal clauses & verifying statutory sections',
    stepScam: '3. Evaluating scam probability & generating summary',

    // Results
    listenAudio: 'Listen Audio',
    pauseAudio: 'Pause',
    replayAudio: 'Replay Audio',
    generatingAudio: 'Synthesizing voice...',
    scamTitle: 'Warning — Suspicious or Fraudulent Document',
    legitTitle: 'Verified — Legitimate Legal Document',
    confidenceLabel: 'Confidence',
    confHigh: 'High Confidence',
    confModerate: 'Moderate',
    confLow: 'Suspicious',
    statutoryTimeline: 'Statutory Urgency & Timeline',
    summaryTitle: '5 Key Takeaways',
    nextStepsTitle: 'Actionable Next Steps',
    disclaimer: 'Themis is an AI heuristic legal assistant, not certified legal counsel. In case of legal dispute, consult an advocate.',

    // History
    historyTitle: 'Your Document Audits',
    historyDesc: 'Secure record of previously analyzed legal notices and contracts',
    refreshHistory: 'Refresh',
    loadingHistory: 'Loading records...',
    emptyHistory: 'No documents audited yet.',
    emptyHistoryDesc: 'When you analyze a notice, contract, or summons, it will be securely recorded here.',
    clickToView: 'Click to view full analysis',

    // Helplines & Footer
    cyberHelpline: 'Cybercrime Helpline: Dial 1930 (cybercrime.gov.in)',
    consumerHelpline: 'National Consumer Helpline: Dial 1915',
    techSpecLink: 'Technical Architecture & Spec',
    builtFor: 'Themis (न्याय सहायक) — Built for WeMakeDevs & AWS First Commit Hackathon',
    closeModal: 'Close'
  },
  hindi: {
    brandName: 'THEMIS',
    brandBadge: 'न्याय सहायक',
    brandTagline: 'नागरिक कानूनी दस्तावेज़ विश्लेषक व साइबर फ्रॉड जांच',
    tabAnalyze: 'दस्तावेज़ जांचें',
    tabHistory: 'पुराने दस्तावेज़',

    // Language Switcher
    targetLangLabel: 'भाषा',
    targetLangDesc: 'सरलीकरण और ऑडियो की भाषा चुनें',
    langEn: 'English',
    langHi: 'हिन्दी',

    // Upload
    uploadTitle: 'दस्तावेज़ अपलोड करें',
    uploadDesc: 'कोर्ट समन, रेंट एग्रीमेंट, पुलिस नोटिस या संदिग्ध बैंक पत्र का फोटो लें या PDF अपलोड करें।',
    dragDropText: 'फोटो खींचें या फाइल चुनें',
    dragDropActive: 'फाइल यहाँ छोड़ें',
    supportedFormats: 'Camera, PDF, PNG, JPG (अधिकतम 10MB)',
    readyToAnalyze: 'जांच के लिए तैयार',
    btnAnalyze: '5 बिंदुओं में समझें',
    analyzingBtn: 'दस्तावेज़ की जांच जारी है...',

    // Sample Docs
    sampleTitle: 'नमूना दस्तावेज़',
    sampleBadge: 'तुरंत जांचें',

    // Empty State
    emptyTitle: 'कोई भी कागज़ डालो, हम बताएंगे क्या है',
    emptyDesc: 'थेमिस कठिन कानूनी भाषा को आपकी भाषा में 5 आसान बिंदुओं में बदलता है और फर्जीवाड़े से सचेत करता है।',
    step1Title: 'फोटो या PDF दें',
    step1Desc: 'मोबाइल से फोटो खींचें या फाइल अपलोड करें।',
    step2Title: 'भाषा चुनें',
    step2Desc: 'अंग्रेजी या हिंदी में सरल व्याख्या प्राप्त करें।',
    step3Title: 'सुनें व समझें',
    step3Desc: 'Amazon Polly की प्राकृतिक आवाज में मुख्य बातें सुनें।',

    // Stepper
    loadingTitle: 'दस्तावेज़ की गहराई से जांच हो रही है...',
    loadingSubtitle: 'कृप्या प्रतीक्षा करें, यह प्रक्रिया 4 से 6 सेकंड लेती है।',
    stepOcr: '१. Amazon Textract से कानूनी शब्दों को पढ़ना (OCR)',
    stepNlp: '२. AI लीगल इंजन द्वारा धाराओं व शर्तों का विश्लेषण',
    stepScam: '३. फर्जीवाड़े की जांच व रिपोर्ट तैयार करना',

    // Results
    listenAudio: 'सुनें',
    pauseAudio: 'रुकें',
    replayAudio: 'फिर से सुनें',
    generatingAudio: 'ऑडियो तैयार हो रहा है...',
    scamTitle: 'सावधान — संदिग्ध या फर्जी दस्तावेज़',
    legitTitle: 'सुरक्षित — आधिकारिक व वैध कानूनी दस्तावेज़',
    confidenceLabel: 'विश्वास स्तर',
    confHigh: 'उच्च स्तर',
    confModerate: 'मध्यम स्तर',
    confLow: 'संदेहास्पद',
    statutoryTimeline: 'आवश्यक समय-सीमा',
    summaryTitle: '5 मुख्य बिंदु',
    nextStepsTitle: 'आगे क्या करें?',
    disclaimer: 'थेमिस एक AI कानूनी सहायता प्रणाली है, अधिकृत वकील नहीं। कानूनी विवाद की स्थिति में वकील से परामर्श लें।',

    // History
    historyTitle: 'आपके पुराने दस्तावेज़',
    historyDesc: 'पूर्व में जाँचे गए दस्तावेज़ों के सुरक्षित रिकॉर्ड',
    refreshHistory: 'रीफ्रेश करें',
    loadingHistory: 'रिकॉर्ड लोड हो रहे हैं...',
    emptyHistory: 'अभी तक कोई दस्तावेज़ सहेजा नहीं गया है।',
    emptyHistoryDesc: 'जब आप कोई कानूनी नोटिस जांचेंगे, वह यहाँ सुरक्षित रहेगा।',
    clickToView: 'क्लिक करके पूरा विवरण देखें',

    // Helplines & Footer
    cyberHelpline: 'साइबर क्राइम हेल्पलाइन: डायल 1930 (cybercrime.gov.in)',
    consumerHelpline: 'राष्ट्रीय उपभोक्ता हेल्पलाइन: डायल 1915',
    techSpecLink: 'तकनीकी विवरण व AWS आर्किटेक्चर',
    builtFor: 'Themis (न्याय सहायक) — Built for WeMakeDevs & AWS First Commit Hackathon',
    closeModal: 'बंद करें'
  }
};

TRANSLATIONS.en = TRANSLATIONS.english;
TRANSLATIONS.hi = TRANSLATIONS.hindi;

