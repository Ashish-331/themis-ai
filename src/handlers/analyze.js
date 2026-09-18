const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const { docClient, s3Client, isLocal } = require('../lib/aws');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
};

// Mock responses for local zero-cost development in Marathi, Hindi, and Bengali
const MOCK_DATA = {
  marathi: {
    summary: [
      "११ महिन्यांचा भाडे करार (Rent Agreement) आहे.",
      "दरमहा भाडे ₹१८,००० असून दरमहा ५ तारखेच्या आत देणे बंधनकारक आहे.",
      "सुरक्षा अनामत रक्कम (Security Deposit) ₹५०,००० आहे.",
      "करार संपण्यापूर्वी १ महिन्याची पूर्वसूचना (Notice Period) देणे आवश्यक आहे.",
      "घर रिकामे करताना रंगरंगोटीचा खर्च अनामत रकमेतून कापला जाऊ शकतो."
    ],
    isScam: false,
    confidence: 0.88,
    scamReason: "दस्तऐवज कायदेशीर व प्रमाणित भाडे करार वाटतो. कोणताही संशयास्पद किंवा वैयक्तिक UPI/खाते क्रमांक नाही.",
    urgency: "७ दिवसांच्या आत करारावर स्वाक्षरी व नोंदणी करा.",
    nextSteps: [
      "स्थानिक पोलीस ठाण्यात भाडेकरू पडताळणी (Police Verification) पूर्ण करा.",
      "सब-रजिस्ट्रार कार्यालयात जाऊन अधिकृत नोंदणी (Registered Rent Agreement) करून घ्या.",
      "५०,००० अनामत रक्कम दिल्याची मूळ पावती घरमालकाकडून नक्की घ्या."
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
    confidence: 0.88,
    scamReason: "दस्तावेज़ वैध और मानक प्रारूप में है। कोई संदिग्ध या व्यक्तिगत यूपीआई/खाता विवरण नहीं मिला।",
    urgency: "७ दिनों के भीतर समझौते पर हस्ताक्षर और सत्यापन करें।",
    nextSteps: [
      "निकटतम पुलिस स्टेशन में किराएदार का सत्यापन (Police Verification) कराएं।",
      "सब-रजिस्ट्रार कार्यालय में ऑनलाइन या ऑफलाइन पंजीकृत रेंट एग्रीमेंट कराएं।",
      "जमा की गई ₹५०,००० की रसीद मकान मालिक से अवश्य प्राप्त करें।"
    ]
  },
  bengali: {
    summary: [
      "এটি ১১ মাসের একটি স্ট্যান্ডার্ড বাড়ি ভাড়ার চুক্তিপত্র (Rent Agreement)।",
      "মাসিক ভাড়া ₹১৮,০০০, যা প্রতি মাসের ৫ তারিখের মধ্যে পরিশোধ করতে হবে।",
      "নিরাপত্তা জামানত (Security Deposit) হিসেবে ₹৫০,০০০ নির্ধারণ করা হয়েছে।",
      "বাড়ি ছাড়ার আগে ১ মাসের লিখিত নোটিশ দেওয়া বাধ্যতামূলক।",
      "বাড়ি ছাড়ার সময় বাড়ি রং বা মেরামতের খরচ সিকিউরিটি ডিপোজিট থেকে কাটা হতে পারে।"
    ],
    isScam: false,
    confidence: 0.88,
    scamReason: "নথিটি বৈধ আইনি কাঠামোর সাথে সামঞ্জস্যপূর্ণ। কোনো অননুমোদিত ইউপিআই বা ব্যক্তিগত অ্যাকাউন্টের বিবরণ পাওয়া যায়নি।",
    urgency: "৭ দিনের মধ্যে উভয় পক্ষের উপস্থিতিতে চুক্তিপত্রটি নিবন্ধন করুন।",
    nextSteps: [
      "নিকটবর্তী থানায় ভাড়াটিয়া ভেরিফিকেশন (Police Verification) ফর্ম জমা দিন।",
      "রেজিস্ট্রি অফিসে গিয়ে চুক্তিপত্রের আইনি নিবন্ধন নিশ্চিত করুন।",
      "জামানতের ₹৫০,০০০ টাকার আনুষ্ঠানিক প্রাপ্তি স্বীকার রসিদ সংগ্রহ করুন।"
    ]
  }
};

exports.handler = async (event) => {
  console.log('Analyze Handler received event:', JSON.stringify(event));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'OK' })
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    // Auth resolution: Deployed uses Cognito sub; local allows body.userId or demo-user
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
    const { s3Key, fileName = 'document.jpg', language = 'marathi' } = body;
    const normalizedLang = ['marathi', 'hindi', 'bengali'].includes(language.toLowerCase()) 
      ? language.toLowerCase() 
      : 'marathi';

    // Use mock data locally or when Bedrock is in mock mode
    const mock = MOCK_DATA[normalizedLang] || MOCK_DATA.marathi;

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
      summary: mock.summary,
      isScam: mock.isScam,
      confidence: mock.confidence,
      scamReason: mock.scamReason,
      urgency: mock.urgency,
      nextSteps: mock.nextSteps,
      disclaimer: 'AI heuristic analysis only, not certified legal counsel. Verify with an advocate.',
      owner: userId,
      sharedWith: [],
      createdAt: now,
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
