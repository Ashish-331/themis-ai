# Themis — Lean Ship It Architecture v3 (Judge-Proof)

> **First Commit - Bharat Builds Tour | Ship It Track**
> **Problem:** Legal notices in English/dense legal jargon cost Indians ₹2000 just to understand a rent agreement or summons.  
> **Solution:** Upload photo → Simple Marathi, Hindi, or Bengali in 5 points + AI scam heuristic + What to do next + Voice.
> **v3 fixes:** SK timestamp-prefix for correct sort + `share` locked to JWT `claims.sub` (closes privacy hole).

---

### 1. Core Principle

> **Coherent, defensible architecture > Maximum service count.**
> Every service must survive: *"Why is this here? Explain in 10 seconds."*

**Lean Stack (Defensible AWS Architecture):**
`React (Amplify) + API Gateway + 2x Lambda + S3 + DynamoDB Single Table + Amazon Textract + Amazon Polly (Neural) + Bedrock / Groq AI Dispatcher`
- **Cognito & IAM:** Role-based security in cloud; `demo-user` in local development.
- **Cedar:** Cut in favor of native IAM execution roles and table partition boundaries. Honest, not decorative.

---

## 2. Architecture

```
[ React on Amplify Hosting ]
        |
        v  (Direct REST / API Gateway Proxy)
[ API Gateway (Prod) ]
   |                |
   | POST /analyze  | GET /history
   v                v
[ Lambda: analyze ] [ Lambda: history ]
   |    |                |
   |    +--→ [ Amazon Textract ]              ← Physical legal notices, stamp paper, seals OCR
   |    |
   |    +--→ [ Amazon Bedrock / Groq AI ]    ← 5-point simplification + scam heuristics + urgency
   |    |
   |    +--→ [ Amazon Polly Neural Voice ]   ← Studio-grade Kajal (hi-IN) voice narration
   |    |
   +---→+--→ [ DynamoDB Single Table ]       ← PK/SK, PAY_PER_REQUEST, ISO8601 sort
   |
[ S3 Bucket: themis-documents-* ]            ← Photos and PDFs via Presigned URLs
```

**Auth & Execution Boundary (Honest Disclosure):**
- **Deployed (Ship It URL):** API Gateway and Lambda operate with least-privilege IAM roles. User documents partitioned by `USER#<id>`.
- **Local Development (`sam local`):** Uses `demo-user` with LocalStack DynamoDB/S3 emulation so development can proceed offline or without cloud expenses.

**Why Single-Table DynamoDB?**
Single-table DynamoDB covers `user → docs → chronologically sorted scans` with sub-10ms latency, zero connection pooling overhead, zero cold-starts, and scales to zero.

---

## 3. Service Justification (10-Second Defense)

| Service | Why It's Here |
|---|---|
| **Amazon Textract** | Physical stamp paper, court notices, and advocates' seals have complex layout. Textract extracts raw text lines with judicial-grade accuracy without bloated Lambda OCR binaries. |
| **Amazon Polly (Neural)** | Accessibility for citizens with low legal literacy. Studio-quality `Kajal (Neural hi-IN & en-IN)` engine provides natural human inflection in Hindi, Marathi, and Indian English, replacing robotic browser speech. |
| **Amazon Bedrock / Groq** | Generative legal reasoning. Uses Bedrock `InvokeModel` API with Claude 3.5 Sonnet / Nova (with high-speed Groq fallback) to simplify archaic legal jargon into 5 plain citizen points. |
| **DynamoDB (Single Table)** | Serverless, zero connection pooling issues. PK (`USER#<id>`) and SK (`DOC#<timestamp>#<docId>`) handle reverse chronological querying natively. |
| **Amazon S3** | 5MB legal photos cannot go into a database. Presigned URLs let the browser upload directly, bypassing Lambda's 6MB payload limit. |
| **Lambda + API Gateway** | Serverless scale-to-zero compute. 2 decoupled functions (`analyze`, `history`) minimize complexity and blast radius. |
| **AWS Amplify Hosting** | 1-click React CI/CD deploy on AWS global edge network. |

**Cut:** RDS (no JOIN needed), Cedar (plain `if` is honest), 2 extra Lambdas.

---

## 4. DynamoDB Single Table Design

**Table:** `themis-documents` | **Keys:** `PK (S) + SK (S)` | **GSI1:** `GSI1PK (S)` | **Billing:** PAY_PER_REQUEST

| PK | SK | GSI1PK | Attributes | Purpose |
|---|---|---|---|---|
| `USER#<sub>` | `PROFILE` | — | `email, name, role, createdAt` | User profile (from Cognito sub) |
| `USER#<sub>` | `DOC#<ISO8601>#<uuid>` | `DOC#<uuid>` | `s3Key, fileName, language, summary[], isScam, confidence, scamReason, urgency, nextSteps[], disclaimer, owner, sharedWith[], createdAt, parseWarning?` | Document + AI result (SK sorts chronologically via ISO8601 prefix) |
| `USER#<sub>` | `SHARE#<docId>#<lawyerSub>` | — | `docId, lawyerSub, expiryAt` | Optional share record |

**Access Patterns:**
- `Query PK = USER#<sub> with ScanIndexForward=false` → Newest docs first **natively via SK sort** (ISO8601 `2026-09-18T10:00:00.000Z` sorts lexicographically = chronologically). No client-side sort needed.
- `Query GSI1 where GSI1PK = DOC#<uuid>` → Fetch single doc for share/view without knowing owner PK.
- No orphan references — GSI1 is defined on every DOC item; `createdAt` is duplicated in SK for sort + as attribute for display.

**Example DOC Item:**
```json
{
  "PK": "USER#ap-south-1:abc-123",
  "SK": "DOC#2026-09-18T06:35:00.000Z#b12f-uuid",
  "GSI1PK": "DOC#b12f-uuid",
  "s3Key": "uploads/ap-south-1:abc-123/b12f-notice.jpg",
  "language": "marathi",
  "summary": ["11 महिन्यांचे भाडे करार", "भाडे ₹18k"],
  "isScam": false,
  "confidence": 0.72,
  "scamReason": "सामान्य दस्तऐवज, personal UPI नाही",
  "urgency": "7 दिवसांत सही करा",
  "nextSteps": ["पोलीस व्हेरिफिकेशन करा"],
  "disclaimer": "AI heuristic only, not legal advice. Consult lawyer.",
  "parseWarning": false
}
```

---

## 5. Lambda & API Design (2 Functions)

### `POST /analyze` — `analyzeDocument`
**Auth:** `Authorization: Bearer <Cognito idToken>` → `userId = claims.sub`  
**Input:** `multipart: file + language` OR `JSON: { s3Key, language }` (after presigned upload)  
**Flow:**
1. Validate JWT → `userId`
2. `S3 GetObject` → Buffer
3. `Bedrock Converse` (see prompt below)
4. **Robust JSON Parse** (never crash — see §6)
5. `DynamoDB Put` → `PK=USER#sub, SK=DOC#<ISO8601>#<uuid>, GSI1PK=DOC#<uuid>` (timestamp prefix = native sort)
6. Return `200` with `result + confidence + disclaimer + parseWarning`

### `GET /history` & `POST /share` — `history`
**GET /history:** `Query PK=USER#sub with ScanIndexForward=false` → 20 docs, newest first via SK timestamp prefix (no client sort). `userId` comes *only* from `claims.sub`, never query param.  
**POST /share:** `Body: { docId, lawyerSub }` → **Auth source is JWT only:** `requesterSub = event.requestContext.authorizer.claims.sub` (never `body.userId`). Check `if (doc.PK !== USER#${requesterSub}) 403` → `if (doc.isScam) 403` → `Update: SET sharedWith = list_append(sharedWith, :l)` — closes privacy hole.

---

## 6. Bedrock — Prompt + Robust Parse Fallback

**Prompt (temp 0.2, maxTokens 2000):**
```
You are Nyaya Sahayak, legal aid for common Indians.
Explain this legal document image in simple {language} for a 10th pass person.
Respond ONLY in JSON: {"summary": ["5 points"], "isScam": boolean, "confidence": 0.0-1.0, "scamReason": "string", "urgency": "string", "nextSteps": ["3 steps"]}
Keep language very simple, no English jargon. Detect scam heuristic (personal UPI, QR, urgency). Include confidence 0-1.
```

**Robust Parse (Lambda never crashes, user never sees silent failure):**
```js
let text = res.output.message.content[0].text
text = text.replace(/```json|```/g, '').trim()
let json
try {
  const m = text.match(/\{[\s\S]*\}/)
  json = m ? JSON.parse(m[0]) : null
} catch {}
if (!json || !json.summary) {
  json = {
    summary: [text.slice(0, 800)],
    isScam: false,
    confidence: 0.5,
    scamReason: "AI response formatting unclear - showing raw output",
    urgency: "",
    nextSteps: ["AI formatting unclear — please try again. If this persists, try a clearer photo."],
    parseWarning: true
  }
}
json.disclaimer = "AI heuristic only, not legal advice. Consult a lawyer/police for urgent notices."
json.confidence = json.confidence ?? 0.65
```
**UI Handling:**
- `parseWarning=true` → Yellow banner: *“⚠️ AI response was not in expected format — showing best available. Try again.”* — not silent, not blaming photo when it was model formatting.
- Normal → Badge: `🤖 AI Check: Scam lag sakta hai — 72% confidence` + small disclaimer text below summary.

---

## 7. S3 Presigned URL Flow

1. React → `POST /analyze` with `fileName` → Lambda `getSignedUrl` (expires 300s) → `{ uploadUrl, s3Key }`
2. React → `PUT uploadUrl` directly to S3
3. React → `POST /analyze { s3Key, language }` → Bedrock

For local mock, `multipart` directly to Lambda is allowed (same handler supports both).

---

## 8. Local-First Dev Flow

```bash
npm run local          # Mock API at http://localhost:4000
# Mocks: Lambda + DynamoDB (local/db.json) + S3 (local/uploads) + Bedrock (dummy Marathi)
# Auth: demo-user only - no Cognito, disclosed in README

cd frontend && npm run dev  # React at http://localhost:5173, VITE_API_URL=http://localhost:4000
```

**Real Bedrock locally (optional):** `.env: USE_MOCK_BEDROCK=false + AWS_ACCESS_KEY_ID` → `local/server.js` calls real Claude.

**SAM Local (needs Docker):** `sam build && sam local start-api --env-vars local/env.json`

---

## 9. SAM Deploy (Ship It URL)

```bash
sam build
sam deploy --guided
# Stack: nyaya-sahayak | Region: ap-south-1 | Outputs: ApiUrl, BucketName, UserPoolId, DocumentsTable
# Frontend:
cd frontend
echo "VITE_API_URL=https://xxx.execute-api.ap-south-1.amazonaws.com/Prod" > .env
npm run build
# Amplify → Host web app → drag frontend/dist
```

**Cost:** Lambda 1M free, DynamoDB 25GB free, S3 5GB free, Bedrock ~₹1.5/notice.

---

## 10. Demo Video Script (3 min)

- **0:00-0:25 Problem:** Real Marathi rent agreement — "My mother got this, we paid ₹1500 to understand."
- **0:25-1:50 Demo:** Upload → Marathi → "Saral Bhasha Me Samjhao" → 5 points + `🤖 72% confidence, not legal advice` badge + Next Steps + 🔊 Voice + History tab with 3 docs + share with lawyer (403 if scam).
- **1:50-2:05 Architecture:** ONE diagram, ONE sentence: *"React on Amplify, API Gateway with Cognito, Lambda, S3 via presigned URL, DynamoDB single table, Bedrock Vision."* No YAML.
- **2:05-3:00 Impact + Learning:** "First time with Bedrock Vision + single-table + presigned S3. Scales to 1M at ₹0 when idle. AI is heuristic — always consult lawyer."

---

## 11. Q&A Defense Cheat Sheet

**Q: Why DynamoDB not RDS?**  
A: "Single-table covers all patterns without JOINs, no VPC, scales to zero with Lambda. RDS adds cold start for zero user benefit."

**Q: Why Cognito? Why not demo-user?**  
A: "Legal docs are sensitive. Deployed API enforces Cognito JWT via API Gateway authorizer; Lambda trusts only claims.sub. Local mock uses demo-user so we can build without AWS, disclosed in README."

**Q: What if Bedrock JSON is malformed?**  
A: "We strip fences, regex-extract JSON, try/catch, fallback to raw text with parseWarning banner — Lambda never crashes, user sees yellow warning, not silent failure."

**Q: What if scam detection is wrong?**  
A: "It's a heuristic with confidence score and disclaimer — AI-assisted, not authoritative. UI says 'not legal advice, consult lawyer.' We signal uncertainty rather than false certainty."

**Q: Why 2 Lambdas not 4?**  
A: "Fewer moving parts = reliable demo in 4 days. Share is an update, not a service."

---

## 12. Submission Checklist

- [ ] Live URL: `ApiUrl` from `sam deploy` (Cognito-protected)
- [ ] GitHub: `template.yaml` + `local/server.js` + this doc + ONE diagram (no YAML dump)
- [ ] Demo video (YouTube unlisted, 3 min) with disclaimer line
- [ ] README states: `S3 + DynamoDB Single Table (PK/SK/GSI1) + Lambda (2) + API Gateway (Cognito) + Bedrock + Amplify` + auth boundary disclosure
- [ ] No RDS/Cedar unless defensible; if cut, stated honestly

---

**v3 locked. Build this — survives close reading, demo, and Q&A.**

---

### Patch Notes v2 → v3 (Exact Code to Drop In)

**SK timestamp-prefix fix (DynamoDB sort):**
```js
// analyzeDocument Lambda
const now = new Date().toISOString() // 2026-09-18T06:35:00.000Z — lexicographically sortable
const docId = uuidv4()
const SK = `DOC#${now}#${docId}`
const GSI1PK = `DOC#${docId}`
await docClient.send(new PutCommand({
  TableName: process.env.DOCUMENTS_TABLE,
  Item: { PK: `USER#${userId}`, SK, GSI1PK, createdAt: now, ...result }
}))
// history Lambda
const res = await docClient.send(new QueryCommand({
  TableName: process.env.DOCUMENTS_TABLE,
  KeyConditionExpression: "PK = :pk",
  ExpressionAttributeValues: { ":pk": `USER#${requesterSub}` },
  ScanIndexForward: false // newest first, no client sort
}))
```

**Share Lambda — lock auth to JWT (closes privacy hole):**
```js
// NEVER trust body.userId
export const handler = async (event) => {
  const requesterSub = event.requestContext?.authorizer?.claims?.sub
  if (!requesterSub) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized - missing Cognito JWT" }) }
  
  const { docId, lawyerSub } = JSON.parse(event.body) // docId + lawyer only, no userId
  const { Items } = await docClient.send(new QueryCommand({
    TableName: process.env.DOCUMENTS_TABLE,
    IndexName: "GSI1",
    KeyConditionExpression: "GSI1PK = :g",
    ExpressionAttributeValues: { ":g": `DOC#${docId}` }
  }))
  const doc = Items[0]
  if (!doc || doc.PK !== `USER#${requesterSub}`) return { statusCode: 403, body: JSON.stringify({ error: "Forbidden - not owner" }) }
  if (doc.isScam) return { statusCode: 403, body: JSON.stringify({ error: "Cannot share scam-flagged doc" }) }
  // ... update
}
```
