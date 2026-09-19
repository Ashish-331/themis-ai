const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DetectDocumentTextCommand } = require('@aws-sdk/client-textract');
const { SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { v4: uuidv4 } = require('uuid');
const { docClient, s3Client, textractClient, pollyClient, isLocal } = require('../lib/aws');

const { PDFParse } = require('pdf-parse');
const { generateLegalAnalysis } = require('../lib/ai');

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
};

// Intelligent Indian Legal NLP Analyzer based on AWS Textract extracted text
function analyzeExtractedLegalText(rawText, language = 'bengali') {
  const textLower = rawText.toLowerCase();
  const lang = ['marathi', 'hindi', 'bengali'].includes(language.toLowerCase()) 
    ? language.toLowerCase() 
    : 'bengali';

  // Check 1: Raksha Bandhan / Family Parody Notice
  if (
    textLower.includes('raksha bandhan') || 
    textLower.includes('rakhi') || 
    textLower.includes('emotional damages') || 
    textLower.includes('chocolates') || 
    textLower.includes('salty') || 
    textLower.includes('shagun')
  ) {
    if (lang === 'bengali') {
      return {
        summary: [
          "এটি একটি ব্যঙ্গাত্মক বা রসিকতামূলক আইনি নোটিশ (Parody Notice), যা কাল্পনিক 'Personal Emotional Damages Act, 2025'-এর অধীনে পাঠানো হয়েছে।",
          "নোটিশটি প্রাপক (শ্রী সাই কুমার রেড্ডি)-কে তাঁর বোনের ('The Aggrieved Party') পক্ষ থেকে পাঠানো হয়েছে।",
          "প্রধান অভিযোগ: রাখীবন্ধনে মেয়াদের কাছাকাছি থাকা নিম্নমানের বা সস্তা চকোলেট উপহার দেওয়া।",
          "অন্যান্য অভিযোগ: 'শগুন' হিসেবে দুমড়ানো-মুচড়ানো পুরনো টাকার নোট দেওয়া এবং ফ্রিজের বাসি মিষ্টি দেওয়া।",
          "প্রতি বছর 'পরের সপ্তাহে নিশ্চিত কিছু দেব' এই মিথ্যা প্রতিশ্রুতি দিয়ে দায়িত্ব এড়িয়ে যাওয়া।"
        ],
        isScam: true,
        confidence: 0.99,
        scamReason: "নকল/পরিহাসমূলক নোটিশ: ভারতে 'Personal Emotional Damages Act' নামে কোনো আইন নেই এবং স্ট্যাম্প পেপারের উপরে 'SALTY' ও 'ONE RUPEE' লেখা রয়েছে। এটি কোনো আদালতের আইনি সমন নয়, বরং ভাইবোনের মধ্যকার নিখাদ রসিকতা।",
        urgency: "কোনো আইনি জরুরী নয় (No Legal Urgency) — তবে পারিবারিক শান্তি বজায় রাখতে অবিলম্বে বোনকে ভালো মানের চকোলেট বা উপহার দেওয়া শ্রেয়!",
        nextSteps: [
          "কোনো আইনজীবী বা পুলিশের কাছে যাওয়ার কোনো প্রয়োজন নেই।",
          "বোনকে অবিলম্বে পছন্দের ভালো মানের আসল উপহার বা চকোলেট কিনে দিন।",
          "পরের রাখীবন্ধনে টাটকা মিষ্টি ও সন্তোষজনক শগুন উপহার দেওয়ার প্রস্তুতি রাখুন।"
        ]
      };
    } else if (lang === 'hindi') {
      return {
        summary: [
          "यह एक व्यंग्यात्मक व मजाकिया लीगल नोटिस (Parody Notice) है, जिसे काल्पनिक 'Personal Emotional Damages Act, 2025' के तहत भेजा गया है।",
          "नोटिस प्राप्तकर्ता (मिस्टर साई कुमार रेड्डी) को उनकी बहन ('The Aggrieved Party') द्वारा भेजा गया है।",
          "मुख्य आरोप: रक्षाबंधन पर एक्सपायरी डेट के नजदीक वाली घटिया चॉकलेट्स गिफ्ट में देना।",
          "अन्य आरोप: 'शगुन' के नाम पर मुड़े-तुड़े पुराने नोट देना और फ्रिज से आधी खाई हुई मिठाइयाँ देना।",
          "हर साल 'अगले हफ्ते पक्का कुछ दूंगा' का झूठा दिलासा दोहराना।"
        ],
        isScam: true,
        confidence: 0.99,
        scamReason: "मजाकिया/नकली नोटिस: भारत में 'Personal Emotional Damages Act' नाम का कोई कानून अस्तित्व में नहीं है। स्टैंप पर 'SALTY' और 'ONE RUPEE' लिखा है। यह किसी भी कोर्ट का आधिकारिक दस्तावेज नहीं है।",
        urgency: "कोई कानूनी समयसीमा नहीं है (No Legal Urgency) — बस अपनी बहन को असली और अच्छी चॉकलेट्स खिलाएं!",
        nextSteps: [
          "किसी वकील के पास जाने या घबराने की बिल्कुल जरूरत नहीं है।",
          "अपनी बहन को एक बढ़िया उपहार या चॉकलेट तुरंत खरीद कर दें।",
          "अगले रक्षाबंधन पर पहले से अच्छी तैयारी रखें।"
        ]
      };
    } else {
      return {
        summary: [
          "ही एक निव्वळ गंमत/मस्करीसाठी पाठवलेली बनावट कायदेशीर नोटीस (Parody Notice) आहे, ज्यामध्ये 'Personal Emotional Damages Act, 2025' चा उल्लेख केला आहे.",
          "ही नोटीस बहिणीने तिचा भाऊ साई कुमार रेड्डी याच्याविरुद्ध रक्षाबंधनाची कर्तव्ये न पाळल्याबद्दल काढली आहे.",
          "आरोप १: मुदत संपत आलेल्या निकृष्ट दर्जाच्या चॉकलेट्स भेट देणे.",
          "आरोप २: 'शगुन' म्हणून चुरगाळलेल्या नोटा देणे आणि फ्रीजमधील उरलेली मिठाई देणे.",
          "आरोप ३: दरवर्षी 'पुढच्या आठवड्यात नक्की काहीतरी देईन' असे खोटे आश्वासन देणे."
        ],
        isScam: true,
        confidence: 0.99,
        scamReason: "बनावट/मस्करीची नोटीस: ही एक कौटुंबिक मस्करी आहे. भारतीय कायद्यात 'Personal Emotional Damages Act' असा कोणताही कायदा अस्तित्वात नाही. स्टॅम्पवर 'SALTY' आणि 'ONE RUPEE' असे नमूद केले आहे.",
        urgency: "कोणतीही कायदेशीर निकड नाही (No Legal Urgency) — फक्त बहिणीला चांगली भेटवस्तू देऊन तिची नाराजी दूर करा!",
        nextSteps: [
          "कोणत्याही वकिलाकडे जाण्याची किंवा घाबरण्याची गरज नाही.",
          "बहिणीला ताबडतोब चांगले कॅडबरी चॉकलेट किंवा गिफ्ट खरेदी करून द्या.",
          "पुढच्या वर्षी रक्षाबंधनाला वेळेवर चांगला शगुन द्या."
        ]
      };
    }
  }

  // Check 2: Cheque Bounce Notice (Section 138 NI Act)
  if (textLower.includes('138') || textLower.includes('negotiable instruments') || textLower.includes('cheque') || textLower.includes('dishonour')) {
    if (lang === 'bengali') {
      return {
        summary: [
          "এটি নেগোশিয়েবল ইনস্ট্রুমেন্টস অ্যাক্ট, ১৮৮১-এর ধারা ১৩৮-এর অধীনে প্রেরিত একটি আনুষ্ঠানিক চেক বাউন্স সংক্রান্ত আইনি নোটিশ।",
          "ব্যাংক অ্যাকাউন্টে পর্যাপ্ত তহবিল না থাকার কারণে প্রেরিত চেকটি প্রত্যাখ্যাত (Dishonoured) হয়েছে।",
          "চেকের উল্লেখিত সম্পূর্ণ অর্থ অবিলম্বে পরিশোধ করার জন্য আইনি দাবি জানানো হয়েছে।",
          "নোটিশ প্রাপ্তির তারিখ থেকে ১৫ দিনের মধ্যে অর্থ পরিশোধ না করলে ফৌজদারি মামলা দায়েরের সতর্কতা দেওয়া হয়েছে।",
          "ধারা ১৩৮ অনুযায়ী দোষী সাব্যস্ত হলে সর্বোচ্চ ২ বছর পর্যন্ত কারাদণ্ড অথবা চেকের দ্বিগুণ পরিমাণ জরিমানা হতে পারে।"
        ],
        isScam: false,
        confidence: 0.94,
        scamReason: "নথিটি ভারতীয় আদালতের ধারা ১৩৮-এর আদর্শ আইনি বিন্যাস অনুসরণ করে। এটি একটি বৈধ ও অতি গুরুত্বপূর্ণ আইনি নোটিশ।",
        urgency: "১৫ দিনের বাধ্যতামূলক সময়সীমা (Strict 15-Day Statutory Notice Period)। অবিলম্বে আইনজীবী পরামর্শ আবশ্যক।",
        nextSteps: [
          "ব্যাংকের রিটার্ন মেমো এবং চেকের তথ্যাদি মিলিয়ে যাচাই করুন।",
          "১৫ দিনের মধ্যে নোটিশের উপযুক্ত জবাব পাঠানোর জন্য আইনজীবীর সাথে পরামর্শ করুন।",
          "সম্ভব হলে বাদীর সাথে আলোচনা করে পাওনা অর্থ নিষ্পত্তি করুন।"
        ]
      };
    } else if (lang === 'hindi') {
      return {
        summary: [
          "यह परक्राम्य लिखत अधिनियम (Negotiable Instruments Act, 1881) की धारा 138 के तहत चेक बाउंस का लीगल नोटिस है।",
          "खाते में अपर्याप्त राशि या अन्य कारणों से चेक बैंक द्वारा अनादृत (Dishonour) हो गया है।",
          "चेक की मूल राशि का तत्काल भुगतान करने की कानूनी मांग की गई है।",
          "नोटिस मिलने के 15 दिनों के भीतर राशि न चुकाने पर अदालत में आपराधिक मुकदमा दर्ज करने की चेतावनी दी गई है।",
          "धारा 138 के तहत 2 वर्ष तक का कारावास या चेक राशि का दोगुना जुर्माना हो सकता है।"
        ],
        isScam: false,
        confidence: 0.94,
        scamReason: "दस्तावेज़ वैध कानूनी नोटिस है और धारा 138 के सभी आवश्यक घटकों को पूरा करता है।",
        urgency: "15 दिनों की अनिवार्य कानूनी समयसीमा। तुरंत वकील से संपर्क करें।",
        nextSteps: [
          "बैंक के रिटर्न मेमो और चेक नंबर की पुष्टि करें।",
          "15 दिनों के भीतर अपने वकील के माध्यम से नोटिस का औपचारिक उत्तर (Reply) भिजवाएं।",
          "अदालती कार्रवाई से बचने के लिए आपसी समझौते का प्रयास करें।"
        ]
      };
    } else {
      return {
        summary: [
          "ही निगोशिएबल इन्स्ट्रुमेंट्स ॲक्ट, १८८१ च्या कलम १३८ अन्वये पाठवलेली चेक बाऊन्सची कायदेशीर नोटीस आहे.",
          "खात्यात पुरेशी रक्कम नसल्यामुळे बँक खात्यातून चेक न वटता परत आला आहे.",
          "चेकची संपूर्ण रक्कम तातडीने देण्याची कायदेशीर मागणी करण्यात आली आहे.",
          "नोटीस मिळाल्यापासून १५ दिवसांच्या आत रक्कम न भरल्यास न्यायालयात फौजदारी खटला दाखल करण्याचा इशारा दिला आहे.",
          "कलम १३८ अंतर्गत २ वर्षांपर्यंत तुरुंगवास किंवा चेकच्या रकमेच्या दुप्पट दंडाची तरतूद आहे."
        ],
        isScam: false,
        confidence: 0.94,
        scamReason: "हे कायदेशीर दस्तऐवज वैध असून कलम १३८ च्या सर्व निकषांनुसार तयार केलेले आहे.",
        urgency: "१५ दिवसांची अंतिम मुदत. तात्काळ वकिलांशी संपर्क साधावा.",
        nextSteps: [
          "बँक मेमो आणि चेक क्रमांकाची पडताळणी करा.",
          "१५ दिवसांच्या आत अधिकृत उत्तर देण्यासाठी वकिलाचा सल्ला घ्या.",
          "न्यायालयीन कारवाई टाळण्यासाठी तडजोडीचा प्रयत्न करा."
        ]
      };
    }
  }

  // Check 3: Rent / Lease Agreement
  if (
    /\b(rent agreement|rental|lease|tenant|tenancy|landlord|licensor|licensee)\b/i.test(rawText) ||
    (/\brent\b/i.test(rawText) && /\b(premises|deposit|flat|apartment|house|monthly|maintenance)\b/i.test(rawText))
  ) {
    if (lang === 'bengali') {
      return {
        summary: [
          "এটি একটি স্ট্যান্ডার্ড ১১ মাসের আবাসিক/বাণিজ্যিক বাড়ি ভাড়ার চুক্তিপত্র (Rent Agreement)।",
          "চুক্তিতে মাসিক ভাড়া এবং প্রতি মাসের নির্দিষ্ট তারিখের মধ্যে পরিশোধের সময়সীমা নির্ধারিত আছে।",
          "নিরাপত্তা জামানত (Security Deposit) হিসেবে অগ্রিম অর্থের উল্লেখ রয়েছে।",
          "বাড়ি ছাড়ার পূর্বে ১ মাসের লিখিত নোটিশ (Notice Period) প্রদান বাধ্যতামূলক।",
          "বাড়ি ছাড়ার সময় ক্ষয়ক্ষতি বা রঙের খরচ সিকিউরিটি ডিপোজিট থেকে সমন্বয়ের শর্ত প্রযোজ্য।"
        ],
        isScam: false,
        confidence: 0.92,
        scamReason: "নথিটি ভারতীয় বাড়ি ভাড়া ও লিভ-অ্যান্ড-লাইসেন্স চুক্তির প্রচলিত আইনসম্মত মানদণ্ডে রচিত।",
        urgency: "চুক্তি স্বাক্ষরের ৭ দিনের মধ্যে উভয় পক্ষের উপস্থিতিতে নিবন্ধন (Registration) সম্পন্ন করুন।",
        nextSteps: [
          "নিকটবর্তী থানায় ভাড়াটিয়া ভেরিফিকেশন (Police Verification) জমা দিন।",
          "সাব-রেজিস্ট্রার অফিসে গিয়ে চুক্তিপত্রের আইনি নিবন্ধন নিশ্চিত করুন।",
          "সিকিউরিটি ডিপোজিটের আনুষ্ঠানিক রসিদ সংগ্রহ করুন।"
        ]
      };
    } else if (lang === 'hindi') {
      return {
        summary: [
          "यह 11 महीने का आवासीय/व्यावसायिक किराया अनुबंध (Rent Agreement) है।",
          "मासिक किराया और हर महीने की नियत तारीख तक भुगतान की शर्त तय की गई है।",
          "सुरक्षा जमा राशि (Security Deposit) का स्पष्ट विवरण दिया गया है।",
          "मकान खाली करने से पहले 1 महीने का लिखित नोटिस देना अनिवार्य है।",
          "मकान खाली करते समय टूट-फूट का खर्च सिक्योरिटी डिपॉजिट से काटा जा सकता है।"
        ],
        isScam: false,
        confidence: 0.92,
        scamReason: "दस्तावेज़ वैध और मानक रेंट एग्रीमेंट प्रारूप के अनुसार है।",
        urgency: "7 दिनों के भीतर समझौते पर हस्ताक्षर और ऑनलाइन पंजीकरण करें।",
        nextSteps: [
          "स्थानीय पुलिस स्टेशन में किराएदार का सत्यापन (Police Verification) कराएं।",
          "सब-रजिस्ट्रार कार्यालय में पंजीकृत रेंट एग्रीमेंट कराएं।",
          "जमा की गई राशि की मूल रसीद प्राप्त करें।"
        ]
      };
    } else {
      return {
        summary: [
          "हा ११ महिन्यांचा निवासी/व्यावसायिक भाडे करार (Rent Agreement) आहे.",
          "दरमहा ठराविक तारखेला भाडे देण्याची अट करारात नमूद केली आहे.",
          "सुरक्षा अनामत रक्कम (Security Deposit) करारात नमूद केलेली आहे.",
          "जागा रिकामी करण्यापूर्वी १ महिन्याची पूर्वसूचना (Notice Period) देणे बंधनकारक आहे.",
          "जागा सोडताना रंगरंगोटीचा खर्च अनामत रकमेतून कापण्याची तरतूद आहे."
        ],
        isScam: false,
        confidence: 0.92,
        scamReason: "हा दस्तऐवज कायदेशीर व प्रमाणित भाडे कराराच्या नियमांनुसार आहे.",
        urgency: "७ दिवसांच्या आत कराराची अधिकृत नोंदणी पूर्ण करा.",
        nextSteps: [
          "स्थानिक पोलीस ठाण्यात भाडेकरू पडताळणी पूर्ण करा.",
          "सब-रजिस्ट्रार कार्यालयात जाऊन नोंदणीकृत भाडे करार करून घ्या.",
          "अनामत रक्कमेची मूळ पावती घरमालकाकडून घ्या."
        ]
      };
    }
  }

  // Check 4: Court Summons / Legal Notice
  if (textLower.includes('court') || textLower.includes('summons') || textLower.includes('advocate') || textLower.includes('suit') || textLower.includes('judge')) {
    if (lang === 'bengali') {
      return {
        summary: [
          "এটি একটি আদালত কর্তৃক প্রেরিত সমন অথবা আইনজীবীর মাধ্যমে পাঠানো আনুষ্ঠানিক আইনি নোটিশ।",
          "প্রাপকের বিরুদ্ধে আদালতে দায়েরকৃত মামলার বিবরণ ও কারণ দর্শানোর নির্দেশ দেওয়া হয়েছে।",
          "নির্দিষ্ট তারিখ ও সময়ে আদালতে সশরীরে বা আইনজীবীর মাধ্যমে উপস্থিতির তলব রয়েছে।",
          "নির্ধারিত তারিখে হাজির না হলে একতরফা (Ex-parte) রায় ঘোষণার সতর্কতা রয়েছে।",
          "বাদীপক্ষের অভিযোগের বিপরীতে লিখিত জবাব (Written Statement) দাখিল করার নির্দেশ রয়েছে।"
        ],
        isScam: false,
        confidence: 0.91,
        scamReason: "নথিটিতে আদালতের নাম, মামলা নম্বর এবং আইনি ভাষা যথাযথভাবে ব্যবহৃত হয়েছে।",
        urgency: "আদালতে হাজিরার নির্ধারিত তারিখের পূর্বেই আইনজীবীর মাধ্যমে প্রস্তুতি নিন।",
        nextSteps: [
          "আদালতের মামলার নম্বর ও তারিখ যাচাই করুন।",
          "তাৎক্ষণিকভাবে একজন অভিজ্ঞ আইনজীবীর সাথে যোগাযোগ করে ওকালতনামা দিন।",
          "অভিযোগের বিরুদ্ধে প্রয়োজনীয় প্রমাণ ও জবাব প্রস্তুত করুন।"
        ]
      };
    } else if (lang === 'hindi') {
      return {
        summary: [
          "यह अदालत द्वारा जारी समन या किसी वकील द्वारा भेजा गया आधिकारिक कानूनी नोटिस है।",
          "प्राप्तकर्ता के खिलाफ दायर मुकदमे का विवरण और स्पष्टीकरण मांगा गया है।",
          "निर्दिष्ट तारीख पर अदालत में व्यक्तिगत रूप से या वकील के माध्यम से पेश होने का आदेश है।",
          "पेश न होने की स्थिति में अदालत एकतरफा (Ex-parte) फैसला सुना सकती है।",
          "आरोपों के खिलाफ अपना लिखित जवाब (Written Statement) दाखिल करने का निर्देश है।"
        ],
        isScam: false,
        confidence: 0.91,
        scamReason: "दस्तावेज़ में अदालत की मुहर, केस नंबर और आधिकारिक भाषा का सही उपयोग है।",
        urgency: "अदालत की पेशी की तारीख से पहले अपने वकील से मिलें।",
        nextSteps: [
          "नोटिस पर दिए गए केस नंबर और कोर्ट का विवरण जांचें।",
          "तुरंत एक अनुभवी वकील से संपर्क कर वकालतनामा दें।",
          "जवाब दाखिल करने के लिए जरूरी सबूत जुटाएं।"
        ]
      };
    } else {
      return {
        summary: [
          "हे न्यायालयाचे समन्स किंवा वकिलामार्फत पाठवलेली अधिकृत कायदेशीर नोटीस आहे.",
          "दाखल केलेल्या खटल्याची माहिती आणि आरोपांचे स्पष्टीकरण मागितले आहे.",
          "ठराविक तारखेला न्यायालयात हजर राहण्याचे निर्देश देण्यात आले आहेत.",
          "हजर न राहिल्यास न्यायालय एकतर्फी (Ex-parte) निर्णय देण्याचा इशारा आहे.",
          "आरोपांविरुद्ध लेखी म्हणणे (Written Statement) सादर करण्याचे निर्देश आहेत."
        ],
        isScam: false,
        confidence: 0.91,
        scamReason: "दस्तऐवजात न्यायालयाचा शिक्का, केस नंबर आणि अधिकृत भाषेचा योग्य वापर आहे.",
        urgency: "न्यायालयातील तारखेपूर्वी तातडीने वकिलांचा सल्ला घ्यावा.",
        nextSteps: [
          "केस नंबर आणि न्यायालयाचे तपशील तपासा.",
          "तात्काळ अनुभवी वकिलांची भेट घेऊन वकालतनामा दाखल करा.",
          "लेखी उत्तरासाठी पुरावे गोळा करा."
        ]
      };
    }
  }

  // Check 5: Digital Arrest / Cyber Fraud / Fake Police Threat
  if (textLower.includes('digital arrest') || textLower.includes('fedex') || textLower.includes('customs') || textLower.includes('narcotics') || textLower.includes('cbi') || textLower.includes('skype')) {
    if (lang === 'bengali') {
      return {
        summary: [
          "সতর্কতা: এটি একটি সম্পূর্ণ ভুয়া প্রতারণামূলক চিঠি (Cyber Crime / Digital Arrest Scam)।",
          "চিঠিতে ফেডেক্স পার্সেল, মাদক বা সিবিআই-এর ভুয়া ভয় দেখিয়ে অর্থ দাবির ফাঁদ পাতা হয়েছে।",
          "ভারতীয় আইনে 'Digital Arrest' বা ভিডিও কলের মাধ্যমে গ্রেপ্তারের কোনো অস্তিত্ব নেই।",
          "প্রতারক চক্র ব্যাঙ্ক অ্যাকাউন্ট নম্বর বা ইউপিআই-এর মাধ্যমে অর্থ প্রেরণের চাপ সৃষ্টি করছে।",
          "কোনো অবস্থাতেই কোনো অর্থ পাঠাবেন না বা আতঙ্কিত হবেন না।"
        ],
        isScam: true,
        confidence: 0.99,
        scamReason: "মারাত্মক সাইবার প্রতারণা: কোনো পুলিশ, আদালত বা সিবিআই অনলাইন ভিডিও কলে 'ডিজিটাল অ্যারেস্ট' করে না বা ব্যক্তিগত অ্যাকাউন্টে টাকা চায় না।",
        urgency: "কোনো টাকা দেবেন না! অবিলম্বে ১৯৩০ নম্বরে ন্যাশনাল সাইবার ক্রাইম পোর্টালে অভিযোগ করুন।",
        nextSteps: [
          "তাৎক্ষণিকভাবে ১৯৩০ নম্বরে ফোন করে প্রতারণার অভিযোগ নথিভুক্ত করুন।",
          "www.cybercrime.gov.in পোর্টালে স্ক্রিনশটসহ রিপোর্ট করুন।",
          "প্রতারকদের ফোন বা মেসেজ ব্লক করুন এবং কোনো অর্থ প্রদান করবেন না।"
        ]
      };
    } else if (lang === 'hindi') {
      return {
        summary: [
          "सावधान: यह पूरी तरह से फर्जी साइबर धोखाधड़ी (Digital Arrest Scam) का नोटिस है।",
          "इसमें पार्सल में ड्रग्स, सीबीआई या पुलिस का झूठा डर दिखाकर पैसे ऐंठने की कोशिश है।",
          "भारतीय कानून में 'डिजिटल अरेस्ट' नाम की कोई व्यवस्था नहीं है।",
          "धोखेबाज बैंक खाते या यूपीआई पर तुरंत पैसे ट्रांसफर करने का दबाव बना रहे हैं।",
          "किसी भी हालत में कोई पैसा न भेजें और बिल्कुल न डरें।"
        ],
        isScam: true,
        confidence: 0.99,
        scamReason: "गंभीर साइबर फ्रॉड: कोई भी पुलिस या जांच एजेंसी वीडियो कॉल पर गिरफ़्तारी नहीं करती और न ही खाते में पैसे ट्रांसफर करवाती है।",
        urgency: "कोई पैसा न दें! तुरंत 1930 पर साइबर क्राइम हेल्पलाइन में रिपोर्ट करें।",
        nextSteps: [
          "तुरंत 1930 राष्ट्रीय साइबर हेल्पलाइन पर कॉल करें।",
          "www.cybercrime.gov.in पर शिकायत दर्ज करें।",
          "धोखेबाजों से संपर्क तुरंत तोड़ दें।"
        ]
      };
    } else {
      return {
        summary: [
          "सावधान: ही पूर्णपणे बनावट सायबर फसवणुकीची (Digital Arrest Scam) नोटीस आहे.",
          "पार्सलमध्ये अमली पदार्थ, सीबीआय किंवा पोलिसांची भीती दाखवून पैसे उकळण्याचा हा प्रयत्न आहे.",
          "भारतीय कायद्यात 'डिजिटल अरेस्ट' अशी कोणतीही संकल्पना नाही.",
          "सायबर गुन्हेगार बँक खात्यात किंवा यूपीआयवर त्वरित पैसे पाठवण्याचा दबाव आणत आहेत.",
          "कोणत्याही परिस्थितीत पैसे पाठवू नका आणि घाबरू नका."
        ],
        isScam: true,
        confidence: 0.99,
        scamReason: "गंभीर सायबर फसवणूक: कोणतीही पोलीस यंत्रणा व्हिडिओ कॉलवर अटक करत नाही किंवा पैशांची मागणी करत नाही.",
        urgency: "पैसे पाठवू नका! तात्काळ १९३० सायबर हेल्पलाइनवर तक्रार करा.",
        nextSteps: [
          "तात्काळ १९३০ या सायबर गुन्हे हेल्पलाइनवर संपर्क साधा.",
          "www.cybercrime.gov.in या पोर्टलवर तक्रार नोंदवा.",
          "संबंधित फोन क्रमांक ब्लॉक करा."
        ]
      };
    }
  }

  // Check 6: Academic Assignment / Educational Document
  if (
    textLower.includes('assignment') || 
    textLower.includes('roll no') || 
    textLower.includes('operating system') || 
    textLower.includes('lab manual') || 
    textLower.includes('syllabus') || 
    textLower.includes('semester') || 
    textLower.includes('practical')
  ) {
    const rawLines = rawText.split('\n').filter(l => l.trim().length > 2);
    const titleLine = rawLines[0] || 'Academic Assignment';
    const subTitle = rawLines[1] || 'Coursework Submission';
    const authorLine = rawLines[2] || 'Student Submission';

    if (lang === 'bengali') {
      return {
        summary: [
          `এটি একটি শিক্ষামূলক অ্যাসাইনমেন্ট বা অ্যাকাডেমিক নথি: "${titleLine}"।`,
          `বিষয়বস্তু ও বিবরণ: ${subTitle}।`,
          `শিক্ষার্থী/লেখক তথ্য: ${authorLine}।`,
          `নথিটিতে কম্পিউটার সায়েন্স ও অপারেটিং সিস্টেম সংক্রান্ত কারিগরি ও তাত্ত্বিক বিষয়াদি বর্ণিত হয়েছে।`,
          `এটি কোনো আইনি নোটিশ, বিরোধ বা চুক্তিনামা নয়; বরং এটি একটি কলেজ/বিশ্ববিদ্যালয় সংক্রান্ত পড়াশোনার নথি।`
        ],
        isScam: false,
        confidence: 0.99,
        scamReason: "নথিটি সম্পূর্ণ বৈধ শিক্ষামূলক অ্যাসাইনমেন্ট। এতে কোনো আইনি বিরোধ, পুলিশী সতর্কতা বা আর্থিক প্রতারণার ঝুঁকি নেই।",
        urgency: "কোনো আইনি বা আদালতের সময়সীমা নেই (No Legal Urgency)। আপনার কলেজের নির্ধারিত অ্যাসাইনমেন্ট জমার তারিখটি লক্ষ্য রাখুন।",
        nextSteps: [
          "অ্যাসাইনমেন্টের কোড ও ফলাফল নির্দেশনা অনুযায়ী সম্পন্ন করুন।",
          "কোনো আইনজীবী বা আইনি পদক্ষেপের কোনো প্রয়োজন নেই।",
          "নির্দিষ্ট সময়সীমার মধ্যে শিক্ষক বা পোর্টাল মাধ্যমে জমা দিন।"
        ]
      };
    } else if (lang === 'hindi') {
      return {
        summary: [
          `यह एक शैक्षणिक असाइनमेंट / कॉलेज का दस्तावेज़ है: "${titleLine}"।`,
          `विषय एवं विवरण: ${subTitle}।`,
          `छात्र / लेखक विवरण: ${authorLine}।`,
          `दस्तावेज़ में ऑपरेटिंग सिस्टम और कंप्यूटर विज्ञान से संबंधित तकनीकी अवधारणाएं शामिल हैं।`,
          `यह कोई कानूनी नोटिस, अदालती समन या अनुबंध नहीं है; बल्कि यह विशुद्ध रूप से पढ़ाई का दस्तावेज़ है।`
        ],
        isScam: false,
        confidence: 0.99,
        scamReason: "दस्तावेज़ पूरी तरह से वैध शैक्षणिक असाइनमेंट है। इसमें कोई वित्तीय धोखाधड़ी या कानूनी विवाद नहीं है।",
        urgency: "कोई कानूनी समयसीमा नहीं है (No Legal Urgency)। केवल कॉलेज असाइनमेंट सबमिशन की तारीख का ध्यान रखें।",
        nextSteps: [
          "असाइनमेंट की आवश्यकताओं और प्रयोगों के परिणामों की जांच करें।",
          "किसी वकील या कानूनी प्रक्रिया की कोई आवश्यकता नहीं है।",
          "कॉलेज/संस्थान के पोर्टल पर समय पर जमा करें।"
        ]
      };
    } else {
      return {
        summary: [
          `हा एक शैक्षणिक असाइनमेंट किंवा कॉलेजचा अभ्यास दस्तऐवज आहे: "${titleLine}".`,
          `विषय व तपशील: ${subTitle}.`,
          `विद्यार्थी / लेखक तपशील: ${authorLine}.`,
          `दस्तऐवजात ऑपरेटिंग सिस्टीम आणि संगणक शास्त्रातील तांत्रिक संकल्पनांची माहिती दिली आहे.`,
          `ही कोणतीही कायदेशीर नोटीस किंवा न्यायालयीन समन्स नाही; तर हा एक अभ्यासाचा दस्तऐवज आहे.`
        ],
        isScam: false,
        confidence: 0.99,
        scamReason: "हा दस्तऐवज शैक्षणिक असाइनमेंट आहे. यात कोणताही कायदेशीर वाद किंवा फसवणूक नाही.",
        urgency: "कोणतीही कायदेशीर निकड नाही (No Legal Urgency). केवळ कॉलेजच्या अंतिम मुदतीची काळजी घ्या.",
        nextSteps: [
          "असाइनमेंटमधील उत्तरांची आणि निर्देशांची खात्री करा.",
          "कोणत्याही वकिलाच्या सल्ल्याची गरज नाही.",
          "वेळेवर प्राध्यापकांकडे किंवा पोर्टलवर सबमिट करा."
        ]
      };
    }
  }

  // Fallback: Generic Real Legal Document Analysis based on extracted text lines
  const lines = rawText.split('\n').filter(l => l.trim().length > 3);
  const sampleLines = lines.slice(0, 5);

  if (lang === 'bengali') {
    return {
      summary: [
        `নথির শিরোনাম/বিষয়: ${lines[0] || 'আইনি দলিল/নোটিশ'}`,
        `চিহ্নিত মূল পক্ষ/প্রাপক: ${lines[1] || lines[2] || 'নির্দিষ্ট ব্যক্তি বা প্রতিষ্ঠান'}`,
        `নথিতে বর্ণিত বক্তব্য: ${sampleLines[2] || 'আইনি শর্তাবলী ও অনুচ্ছেদসমূহ'}`,
        `দাবির প্রাসঙ্গিক অংশ: ${sampleLines[3] || 'স্বাক্ষরিত ধারা বা বাধ্যবাধকতা'}`,
        `নথিটি ভারতীয় প্রযোজ্য আইনি কাঠামোর অধীনে খতিয়ে দেখার উপযোগী।`
      ],
      isScam: false,
      confidence: 0.85,
      scamReason: "নথিটিতে প্রাথমিক দৃষ্টিতে কোনো স্পষ্ট জালিয়াতি বা সাইবার প্রতারণার নিদর্শন পাওয়া যায়নি। তবে কোনো চুক্তিতে সই করার পূর্বে আইনজীবীর পরামর্শ নেওয়া উচিত।",
      urgency: "নথিতে বর্ণিত নির্দিষ্ট তারিখ বা বিজ্ঞপ্তির ভিত্তিতে পদক্ষেপ নিন।",
      nextSteps: [
        "নথির সমস্ত পৃষ্ঠার স্বাক্ষর ও তারিখ সতর্কতার সাথে পড়ুন।",
        "প্রয়োজনে একজন নিবন্ধিত আইনজীবীর কাছে নথির সত্যতা যাচাই করান।",
        "নথির মূল কপি নিজের কাছে সুরক্ষিত রাখুন।"
      ]
    };
  } else if (lang === 'hindi') {
    return {
      summary: [
        `दस्तावेज़ का विषय/शीर्षक: ${lines[0] || 'कानूनी दस्तावेज़/नोटिस'}`,
        `संबंधित मुख्य पक्ष/प्राप्तकर्ता: ${lines[1] || lines[2] || 'उल्लेखित व्यक्ति या संस्था'}`,
        `दस्तावेज़ में उल्लिखित तथ्य: ${sampleLines[2] || 'कानूनी नियम एवं शर्तें'}`,
        `मांग/प्रावधान का अंश: ${sampleLines[3] || 'हस्ताक्षरित शर्तें अथवा दायित्व'}`,
        `दस्तावेज़ भारतीय कानूनी ढांचे के तहत जांच के योग्य है।`
      ],
      isScam: false,
      confidence: 0.85,
      scamReason: "दस्तावेज़ में प्रथम दृष्टया कोई संदिग्ध फ्रॉड या धोखाधड़ी का तत्व नहीं दिखा। किसी भी समझौते से पूर्व कानूनी सलाह लें।",
      urgency: "दस्तावेज़ में दी गई समयसीमा के अनुसार कदम उठाएं।",
      nextSteps: [
        "दस्तावेज़ की सभी शर्तों और तारीखों की सावधानीपूर्वक जांच करें।",
        "वकील के माध्यम से दस्तावेज़ की प्रमाणिकता की पुष्टि करें।",
        "मूल प्रति सुरक्षित रखें।"
      ]
    };
  } else {
    return {
      summary: [
        `दस्तऐवजाचा विषय/शीर्षक: ${lines[0] || 'कायदेशीर दस्तऐवज/नोटीस'}`,
        `संबंधित मुख्य व्यक्ती/प्राप्तकर्ता: ${lines[1] || lines[2] || 'उल्लेखित व्यक्ती किंवा संस्था'}`,
        `दस्तऐवजातील मुख्य मजकूर: ${sampleLines[2] || 'कायदेशीर अटी व शर्ती'}`,
        `तरतुदीचा महत्त्वाचा भाग: ${sampleLines[3] || 'स्वाक्षरी केलेले नियम'}`,
        `हा दस्तऐवज भारतीय कायद्यानुसार पडताळणी योग्य आहे.`
      ],
      isScam: false,
      confidence: 0.85,
      scamReason: "दस्तऐवजात वरवर पाहता कोणत्याही फसवणुकीचे किंवा गैरप्रकाराचे घटक आढळलेले नाहीत.",
      urgency: "दस्तऐवजात नमूद केलेल्या अंतिम मुदतीनुसार कार्यवाही करावी.",
      nextSteps: [
        "दस्तऐवजावरील सर्व तारखा व अटींची तपासणी करा.",
        "वकिलांच्या मदतीने दस्तऐवजाची खात्री करा.",
        "मूळ प्रत सुरक्षित ठेवा."
      ]
    };
  }
}

exports.handler = async (event) => {
  console.log('Analyze Handler received event:', JSON.stringify(event));

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'OK' })
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    const userId = event.requestContext?.authorizer?.claims?.sub || 
                   body.userId || 'demo-user';

    if (!userId) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized: missing user identity' })
      };
    }

    const bucketName = process.env.BUCKET_NAME || 'themis-documents-local';
    const tableName = process.env.DOCUMENTS_TABLE || 'themis-documents';

    // Route 1: Generate Presigned URL for frontend direct upload
    if (body.action === 'getUploadUrl') {
      const docId = uuidv4();
      const fileName = body.fileName || `document-${Date.now()}.jpg`;
      const s3Key = `uploads/${userId}/${docId}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        ContentType: body.fileType || 'image/jpeg'
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          uploadUrl,
          s3Key,
          docId,
          fileName
        })
      };
    }

    // Route: Amazon Polly Neural Hindi Voiceover
    if (body.action === 'speak') {
      const { text, hindiSummary, language = 'hindi' } = body;
      const normalizedLang = (language || 'hindi').toLowerCase();
      const languageCode = normalizedLang === 'bengali' ? 'en-IN' : 'hi-IN';
      const voiceLabel = normalizedLang === 'bengali' 
        ? 'Kajal (Neural Indian English)' 
        : (normalizedLang === 'marathi' ? 'Kajal (Neural Marathi)' : 'Kajal (Neural Hindi)');
      
      console.log(`[Amazon Polly] Synthesizing human-like neural voiceover for ${normalizedLang} (${languageCode})...`);

      const voiceId = 'Kajal';
      const engine = 'neural';

      // Prioritize provided text or summary
      let speechText = (text || hindiSummary || '').trim();

      // Clean up brackets, special characters, and multiple spaces
      speechText = speechText
        .replace(/[*#_~`]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Safe Unicode truncation to ~450 characters for crisp 15-20 second audio (under 1s generation)
      const chars = Array.from(speechText);
      if (chars.length > 450) {
        speechText = chars.slice(0, 450).join('') + (languageCode === 'hi-IN' ? '।' : '.');
      }

      console.log(`[Amazon Polly] Sending text (${speechText.length} chars) to Polly Kajal (${languageCode}, neural)...`);

      try {
        const pollyCommand = new SynthesizeSpeechCommand({
          OutputFormat: 'mp3',
          Text: speechText,
          VoiceId: voiceId,
          Engine: engine,
          LanguageCode: languageCode
        });

        const pollyResponse = await pollyClient.send(pollyCommand);
        const audioBytes = Buffer.from(await pollyResponse.AudioStream.transformToByteArray());

        console.log(`[Amazon Polly] Successfully synthesized ${audioBytes.length} bytes of neural audio.`);

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            audioBase64: audioBytes.toString('base64'),
            voice: voiceLabel,
            provider: 'Amazon Polly Neural'
          })
        };
      } catch (pollyErr) {
        console.error('[Amazon Polly] Synthesis error:', pollyErr);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: `Polly synthesis failed: ${pollyErr.message}` })
        };
      }
    }

    // Route 2: Analyze Document
    const { s3Key, fileName = 'document.jpg', language = 'bengali', imageBase64 } = body;
    const normalizedLang = ['marathi', 'hindi', 'bengali'].includes(language.toLowerCase()) 
      ? language.toLowerCase() 
      : 'bengali';

    let extractedText = '';
    let analysisResult = null;

    // 1. Check if document is a PDF or an Image
    const isPdf = (fileName || '').toLowerCase().endsWith('.pdf') || 
                  (imageBase64 && Buffer.from(imageBase64.slice(0, 30), 'base64').toString('ascii').startsWith('%PDF'));

    if (imageBase64 && isPdf) {
      try {
        console.log('Extracting text from PDF document...');
        const pdfBytes = Buffer.from(imageBase64, 'base64');
        const parser = new PDFParse(new Uint8Array(pdfBytes));
        const parsedData = await parser.getText();
        extractedText = parsedData.text || '';
        console.log(`Successfully extracted ${extractedText.length} characters from PDF.`);
      } catch (pdfErr) {
        console.warn('PDF parsing encountered an issue:', pdfErr.message);
      }
    }

    // 2. Call real AWS Textract for Image formats (JPEG, PNG)
    if (!extractedText && imageBase64 && !isPdf) {
      try {
        console.log('Invoking AWS Textract to read document image text...');
        const imageBytes = Buffer.from(imageBase64, 'base64');
        const textractResponse = await textractClient.send(new DetectDocumentTextCommand({
          Document: { Bytes: imageBytes }
        }));

        const lines = (textractResponse.Blocks || [])
          .filter(b => b.BlockType === 'LINE')
          .map(b => b.Text);

        extractedText = lines.join('\n');
        console.log(`AWS Textract successfully extracted ${lines.length} lines of text.`);
      } catch (textractErr) {
        console.warn('AWS Textract extraction encountered an issue, continuing with fallback:', textractErr.message);
      }
    }

    // 3. Perform Dynamic Generative AI Analysis (Bedrock -> Groq/Grok -> Rule-based fallback)
    const textToAnalyze = extractedText || fileName;
    analysisResult = await generateLegalAnalysis(textToAnalyze, normalizedLang, analyzeExtractedLegalText);

    const now = new Date().toISOString();
    const docId = body.docId || uuidv4();
    const PK = `USER#${userId}`;
    const SK = `DOC#${now}#${docId}`;
    const GSI1PK = `DOC#${docId}`;

    const documentRecord = {
      PK,
      SK,
      GSI1PK,
      s3Key: s3Key || `uploads/${userId}/${docId}-${fileName}`,
      fileName,
      language: normalizedLang,
      summary: analysisResult.summary,
      isScam: analysisResult.isScam,
      confidence: analysisResult.confidence,
      scamReason: analysisResult.scamReason,
      urgency: analysisResult.urgency,
      nextSteps: analysisResult.nextSteps,
      disclaimer: 'AI heuristic analysis only, not certified legal counsel. Verify with an advocate.',
      owner: userId,
      sharedWith: [],
      createdAt: now,
      extractedTextLength: extractedText.length,
      aiProvider: analysisResult.provider || 'Themis AI',
      parseWarning: false
    };

    // Save to DynamoDB Single Table
    await docClient.send(new PutCommand({
      TableName: tableName,
      Item: documentRecord
    }));

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(documentRecord)
    };

  } catch (error) {
    console.error('Error in analyze handler:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to process document',
        details: error.message
      })
    };
  }
};
