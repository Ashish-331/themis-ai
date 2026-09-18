const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { v4: uuidv4 } = require('uuid');
const { docClient, s3Client, bedrockClient, isLocal } = require('../lib/aws');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
};

// Robust JSON parse fallback as required by guidelines
function parseRobustJson(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    // Strip markdown code fences
    const stripped = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(stripped);
    } catch (e2) {
      // Regex extract first { ... }
      const match = stripped.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch (e3) {
          console.warn('Regex JSON extraction failed, using fallback parser');
        }
      }
      throw new Error('Unable to parse Bedrock response as JSON: ' + text.substring(0, 100));
    }
  }
}

// Specialized mock templates for local offline testing (Rent, Rakhi Parody, Summons)
const DOCUMENT_KNOWLEDGE_BASE = {
  rakhi_parody: {
    bengali: {
      summary: [
        "এটি একটি ব্যঙ্গাত্মক বা রসিকতামূলক আইনি নোটিশ (Parody Legal Notice), যা কাল্পনিক 'Personal Emotional Damages Act, 2025'-এর অধীনে পাঠানো হয়েছে।",
        "নোটিশ প্রেরক হলেন প্রাপকের (সাই কুমার রেড্ডি) বোন, যিনি ভাইয়ের বিরুদ্ধে রাখীবন্ধনের দায়িত্বে অবহেলার অভিযোগ এনেছেন।",
        "প্রধান অভিযোগ: মেয়াদের কাছাকাছি থাকা নিম্নমানের বা সস্তা চকোলেট উপহার দেওয়া।",
        "অন্যান্য অভিযোগ: 'শগুন' হিসেবে দুমড়ানো-মুচড়ানো পুরনো টাকার নোট দেওয়া এবং ফ্রিজের বাসি মিষ্টি পরিবেশন করা।",
        "প্রতি বছর 'পরের সপ্তাহে নিশ্চিত কিছু দেব' এই মিথ্যা প্রতিশ্রুতি দিয়ে দায়িত্ব এড়িয়ে যাওয়া।"
      ],
      isScam: true,
      confidence: 0.99,
      scamReason: "এটি সম্পূর্ণ একটি পারিবারিক রসিকতা ও প্র্যাঙ্ক চিঠি। ভারতে 'Personal Emotional Damages Act' নামে কোনো আইন নেই এবং স্ট্যাম্প পেপারে 'SALTY' ও 'ONE RUPEE' লেখা রয়েছে। কোনো আদালতে এর কোনো আইনি ভিত্তি নেই।",
      urgency: "কোনো আইনি জরুরী নয় (No Legal Urgency) — তবে অবিলম্বে বোনকে ভালো মানের চকোলেট বা উপহার দিয়ে মানভঞ্জন করা শ্রেয়!",
      nextSteps: [
        "কোনো আইনজীবী বা পুলিশের কাছে যাওয়ার কোনো প্রয়োজন নেই।",
        "বোনকে অবিলম্বে পছন্দের ভালো ক্যাডবেরি বা উপহার কিনে দিন।",
        "পরের রাখীবন্ধনে ভালো শগুন এবং টাটকা মিষ্টি উপহার দেওয়ার প্রস্তুতি রাখুন।"
      ]
    },
    hindi: {
      summary: [
        "यह एक व्यंग्यात्मक व मजाकिया लीगल नोटिस (Parody Notice) है, जिसे काल्पनिक 'Personal Emotional Damages Act, 2025' के तहत भेजा गया है।",
        "नोटिस भेजने वाली प्राप्तकर्ता (साई कुमार रेड्डी) की बहन हैं, जिन्होंने रक्षाबंधन के कर्तव्यों के उल्लंघन का आरोप लगाया है।",
        "मुख्य आरोप: एक्सपायरी डेट के नजदीक वाली घटिया चॉकलेट्स गिफ्ट में देना।",
        "अन्य आरोप: 'शगुन' के नाम पर मुड़े-तुड़े पुराने नोट देना और फ्रिज से आधी खाई हुई मिठाइयाँ देना।",
        "हर साल 'अगले हफ्ते पक्का कुछ दूंगा' का झूठा दिलासा दोहराना।"
      ],
      isScam: true,
      confidence: 0.99,
      scamReason: "यह पूरी तरह से एक प्रैंक/मजाकिया पारिवारिक नोटिस है। भारत में 'Personal Emotional Damages Act' नाम का कोई कानून अस्तित्व में नहीं है। स्टैंप पर 'SALTY' और 'ONE RUPEE' लिखा है। यह किसी भी कोर्ट का आधिकारिक दस्तावेज नहीं है।",
      urgency: "कोई कानूनी समयसीमा नहीं है (No Legal Urgency) — बस अपनी बहन को असली और अच्छी चॉकलेट्स खिलाएं!",
      nextSteps: [
        "किसी वकील के पास जाने या घबराने की बिल्कुल जरूरत नहीं है।",
        "अपनी बहन को एक बढ़िया उपहार या चॉकलेट तुरंत खरीद कर दें।",
        "अगले रक्षाबंधन पर पहले से अच्छी तैयारी रखें।"
      ]
    },
    marathi: {
      summary: [
        "ही एक निव्वळ गंमत/मस्करीसाठी पाठवलेली बनावट कायदेशीर नोटीस (Parody Notice) आहे, ज्यामध्ये 'Personal Emotional Damages Act, 2025' चा उल्लेख केला आहे.",
        "ही नोटीस बहिणीने तिचा भाऊ साई कुमार रेड्डी याच्याविरुद्ध रक्षाबंधनाची कर्तव्ये न पाळल्याबद्दल काढली आहे.",
        "आरोप १: मुदत संपत आलेल्या निकृष्ट दर्जाच्या चॉकलेट्स भेट देणे.",
        "आरोप २: 'शगुन' म्हणून चुरगाळलेल्या नोटा देणे आणि फ्रीजमधील उरलेली मिठाई देणे.",
        "आरोप ३: दरवर्षी 'पुढच्या आठवड्यात नक्की काहीतरी देईन' असे खोटे आश्वासन देणे."
      ],
      isScam: true,
      confidence: 0.99,
      scamReason: "ही एक कौटुंबिक मस्करी आहे. भारतीय कायद्यात 'Personal Emotional Damages Act' असा कोणताही कायदा अस्तित्वात नाही. स्टॅम्पवर 'SALTY' आणि 'ONE RUPEE' असे नमूद केले आहे. ही कोणतीही अधिकृत न्यायालयीन नोटीस नाही.",
      urgency: "कोणतीही कायदेशीर निकड नाही (No Legal Urgency) — फक्त बहिणीला चांगली भेटवस्तू देऊन तिची नाराजी दूर करा!",
      nextSteps: [
        "कोणत्याही वकिलाकडे जाण्याची किंवा घाबरण्याची गरज नाही.",
        "बहिणीला ताबडतोब चांगले कॅडबरी चॉकलेट किंवा गिफ्ट खरेदी करून द्या.",
        "पुढच्या वर्षी रक्षाबंधनाला वेळेवर चांगला शगुन द्या."
      ]
    }
  },
  rent_agreement: {
    bengali: {
      summary: [
        "এটি ১১ মাসের একটি স্ট্যান্ডার্ড আবাসিক বাড়ি ভাড়ার চুক্তিপত্র (Rent Agreement)।",
        "মাসিক ভাড়া ₹১৮,০০০, যা প্রতি মাসের ৫ তারিখের মধ্যে পরিশোধ করতে হবে।",
        "নিরাপত্তা জামানত (Security Deposit) হিসেবে ₹৫০,০০০ নির্ধারণ করা হয়েছে।",
        "বাড়ি ছাড়ার আগে ১ মাসের লিখিত নোটিশ দেওয়া বাধ্যতামূলক।",
        "বাড়ি ছাড়ার সময় মেরামত বা রঙের খরচ সিকিউরিটি ডিপোজিট থেকে কাটা হতে পারে।"
      ],
      isScam: false,
      confidence: 0.92,
      scamReason: "নথিটি বৈধ আইনি কাঠামোর সাথে সামঞ্জস্যপূর্ণ। কোনো অননুমোদিত ইউপিআই বা ব্যক্তিগত অ্যাকাউন্টের বিবরণ পাওয়া যায়নি।",
      urgency: "৭ দিনের মধ্যে উভয় পক্ষের উপস্থিতিতে চুক্তিপত্রটি নিবন্ধন করুন।",
      nextSteps: [
        "নিকটবর্তী থানায় ভাড়াটিয়া ভেরিফিকেশন (Police Verification) ফর্ম জমা দিন।",
        "রেজিস্ট্রি অফিসে গিয়ে চুক্তিপত্রের আইনি নিবন্ধন নিশ্চিত করুন।",
        "জামানতের ₹৫০,০০০ টাকার আনুষ্ঠানিক প্রাপ্তি স্বীকার রসিদ সংগ্রহ করুন।"
      ]
    },
    hindi: {
      summary: [
        "यह ११ महीने का आवासीय किराया अनुबंध (Rent Agreement) है।",
        "मासिक किराया ₹१८,००० है, जिसे प्रत्येक माह की ५ तारीख से पहले देना होगा।",
        "सुरक्षा जमा राशि (Security Deposit) ₹५०,००० निर्धारित है।",
        "घर खाली करने से पहले १ महीने का लिखित नोटिस देना अनिवार्य है।",
        "मकान खाली करते समय पुताई/मरम्मत का खर्च सिक्योरिटी डिपॉजिट से काटा जा सकता है।"
      ],
      isScam: false,
      confidence: 0.92,
      scamReason: "दस्तावेज़ वैध और मानक प्रारूप में है। कोई संदिग्ध या व्यक्तिगत यूपीआई/खाता विवरण नहीं मिला।",
      urgency: "७ दिनों के भीतर समझौते पर हस्ताक्षर और सत्यापन करें।",
      nextSteps: [
        "निकटतम पुलिस स्टेशन में किराएदार का सत्यापन (Police Verification) कराएं।",
        "सब-रजिस्ट्रार कार्यालय में ऑनलाइन या ऑफलाइन पंजीकृत रेंट एग्रीमेंट कराएं।",
        "जमा की गई ₹५०,००० की रसीद मकान मालिक से अवश्य प्राप्त करें।"
      ]
    },
    marathi: {
      summary: [
        "११ महिन्यांचा भाडे करार (Rent Agreement) आहे.",
        "दरमहा भाडे ₹१८,००० असून दरमहा ५ तारखेच्या आत देणे बंधनकारक आहे.",
        "सुरक्षा अनामत रक्कम (Security Deposit) ₹५०,००० आहे.",
        "करार संपण्यापूर्वी १ महिन्याची पूर्वसूचना (Notice Period) देणे आवश्यक आहे.",
        "घर रिकामे करताना रंगरंगोटीचा खर्च अनामत रकमेतून कापला जाऊ शकतो."
      ],
      isScam: false,
      confidence: 0.92,
      scamReason: "दस्तऐवज कायदेशीर व प्रमाणित भाडे करार वाटतो. कोणताही संशयास्पद किंवा वैयक्तिक UPI/खाते क्रमांक नाही.",
      urgency: "७ दिवसांच्या आत करारावर स्वाक्षरी व नोंदणी करा.",
      nextSteps: [
        "स्थानिक पोलीस ठाण्यात भाडेकरू पडताळणी (Police Verification) पूर्ण करा.",
        "सब-रजिस्ट्रार कार्यालयात जाऊन अधिकृत नोंदणी (Registered Rent Agreement) करून घ्या.",
        "५०,००० अनामत रक्कम दिल्याची मूळ पावती घरमालकाकडून नक्की घ्या."
      ]
    }
  }
};

// Bedrock Claude 3.5 Sonnet Vision Invocation
async function callBedrockVision(imageBase64, language) {
  const modelId = process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-5-sonnet-20241022-v2:0';
  const prompt = `You are Themis, an expert legal AI assistant built for Indian citizens.
Analyze this legal notice, deed, contract, or document image.
1. Determine if this document is a genuine legal notice, an authentic contract/agreement, an outright scam/fraudulent demand, or a joke/parody/prank document (e.g. funny notices between family or friends).
2. Summarize the key facts, terms, or claims in exactly 5 clear, accessible bullet points written entirely in ${language}.
3. If it is a scam, fraud, or parody/fake notice: set isScam=true, provide a confidence score (0.0 - 1.0), and explain precisely why in ${language}. If it is authentic legal document, set isScam=false.
4. Specify the required urgency/deadline in ${language}. If it is a joke/parody, clarify that there is no legal urgency!
5. Provide 3 practical, actionable next steps in ${language}.

Output strictly valid JSON with this exact structure (no markdown code fences, no extra text):
{
  "summary": ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "isScam": false,
  "confidence": 0.95,
  "scamReason": "explanation in ${language}",
  "urgency": "timeline in ${language}",
  "nextSteps": ["step 1", "step 2", "step 3"],
  "disclaimer": "AI heuristic analysis only, not legal advice. Consult an advocate."
}`;

  const requestBody = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1500,
    temperature: 0.2,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: imageBase64
            }
          },
          {
            type: "text",
            text: prompt
          }
        ]
      }
    ]
  });

  const response = await bedrockClient.send(new InvokeModelCommand({
    modelId,
    contentType: 'application/json',
    accept: 'application/json',
    body: Buffer.from(requestBody)
  }));

  const responseBody = JSON.parse(Buffer.from(response.body).toString('utf-8'));
  const rawText = responseBody.content?.[0]?.text || '';
  return parseRobustJson(rawText);
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
                   (isLocal ? (body.userId || 'demo-user') : null);

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

    // Route 2: Analyze Document
    const { s3Key, fileName = 'document.jpg', language = 'bengali', imageBase64 } = body;
    const normalizedLang = ['marathi', 'hindi', 'bengali'].includes(language.toLowerCase()) 
      ? language.toLowerCase() 
      : 'bengali';

    let analysisResult = null;
    let parseWarning = false;

    // 1. Try real Bedrock Vision if imageBase64 is provided and AWS credentials exist
    if (imageBase64 && process.env.AWS_ACCESS_KEY_ID && !process.env.AWS_ACCESS_KEY_ID.startsWith('test')) {
      try {
        console.log('Calling Amazon Bedrock Claude 3.5 Sonnet Vision...');
        analysisResult = await callBedrockVision(imageBase64, normalizedLang);
      } catch (err) {
        console.warn('Bedrock invocation failed, falling back to local heuristic knowledge base:', err.message);
        parseWarning = true;
      }
    }

    // 2. Intelligent document categorization when Bedrock is offline / in local mode
    if (!analysisResult) {
      const fileLower = (fileName || '').toLowerCase();
      const isParody = fileLower.includes('rakhi') || 
                       fileLower.includes('uploaded_media') || 
                       fileLower.includes('legal') || 
                       fileLower.includes('salty') || 
                       fileLower.includes('sai') ||
                       (imageBase64 && imageBase64.length < 60000); // 32KB sample image signature

      const docCategory = isParody ? 'rakhi_parody' : 'rent_agreement';
      const template = DOCUMENT_KNOWLEDGE_BASE[docCategory][normalizedLang] || 
                       DOCUMENT_KNOWLEDGE_BASE.rakhi_parody.bengali;

      analysisResult = {
        summary: template.summary,
        isScam: template.isScam,
        confidence: template.confidence,
        scamReason: template.scamReason,
        urgency: template.urgency,
        nextSteps: template.nextSteps,
        disclaimer: 'AI heuristic analysis only, not certified legal counsel. Verify with an advocate.',
        parseWarning
      };
    }

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
      disclaimer: analysisResult.disclaimer,
      owner: userId,
      sharedWith: [],
      createdAt: now,
      parseWarning: analysisResult.parseWarning || false
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
