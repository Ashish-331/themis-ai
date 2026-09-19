# Themis (न्याय सहायक) ⚖️
### AI-Powered Indian Legal Document Simplifier & Scam Detection Engine
**Built for the WeMakeDevs & AWS First Commit Hackathon 2026 (Ship It Track)**

---

## 📌 Problem Statement

Every day, millions of Indian citizens receive intimidating legal documents—court summons, landlord eviction threats, police notices, and increasingly, **fraudulent cyber-crime scams** (such as fake "Digital Arrest" notices, bogus CBI extortion demands, and unverified bank freeze letters).

Because Indian legal language is dense, archaic, and predominantly written in English or formal legal jargon, ordinary citizens panic, fall prey to extortion, or fail to respond within statutory deadlines.

**Themis (न्याय सहायक)** solves this:
1. Citizens upload a photo or PDF of any legal notice or contract.
2. **Amazon Textract** extracts the document text from physical photographs or scans, and a native parser extracts text from digital PDFs.
3. The cognitive engine simplifies the document into an accessible **5-point citizen breakdown** in **Hindi (हिंदी)**, **Bengali (বাংলা)**, or **Marathi (मराठी)**.
4. It performs **Scam & Parody Detection**, cross-referencing Indian statutory laws to calculate an Authenticity Confidence Score and identify spoofed acts (e.g., fictitious acts like *"Personal Emotional Damages Act, 2023"* or fake CBI digital arrest warrants).
5. It flags statutory timelines and specifies **3 actionable, practical next steps**.
6. **Amazon Polly Neural Voice (`Kajal - hi-IN`)** narrates the legal breakdown in human-like studio quality for citizens with low literacy or visual impairment.

---

## 🏗️ Architecture & AWS Services

```
[ User Browser / Mobile Web ]
            │
            ▼
   [ AWS Amplify Hosting ]
            │
            ▼
  [ Amazon API Gateway ]
            │
            ▼
    [ AWS Lambda ]  <─── Least-Privilege IAM Roles
      ├── Amazon Textract         (Document OCR on physical images / summons)
      ├── Amazon Polly            (Neural speech synthesis - Studio Kajal hi-IN)
      ├── Amazon Bedrock / Groq   (Generative AI legal analysis & statutory breakdown)
      ├── Amazon S3               (Presigned upload storage for original documents)
      └── Amazon DynamoDB         (Single-Table Design: USER#<id> -> DOC#<timestamp>)
```

### AWS Services Utilized

| AWS Service | Role in Themis | Architectural Justification |
| :--- | :--- | :--- |
| **Amazon Textract** | Multi-page Document OCR | High-accuracy detection of stamp paper, judicial headings, advocate stamps, and handwritten annotations. |
| **Amazon Polly** | Neural Voice Narration | Generates studio-quality, natural human voiceover (`Kajal - hi-IN`) for vernacular accessibility. |
| **Amazon Bedrock** | Generative Legal AI | Uses Converse API with Claude 3.5 Sonnet / Amazon Nova for nuance extraction and statutory analysis. |
| **Amazon DynamoDB** | Single-Table Persistence | Stores scans, scam scores, and historical breakdowns indexed by `USER#<sub/id>` sorted chronologically. |
| **Amazon S3** | Document Blob Vault | Stores raw high-resolution notice scans and PDFs with presigned URL upload security. |
| **AWS Lambda** | Serverless Compute | Powers `/analyze` and `/history` endpoints with auto-scaling and zero idle cost. |
| **Amazon API Gateway** | Managed REST API | Provides secure routing, preflight CORS handling, and throttling protection. |
| **AWS SAM** | Infrastructure as Code | Full declarative template (`template.yaml`) for automated 1-click cloud deployments. |
| **AWS Amplify** | Frontend CI/CD & Hosting | Builds and hosts the React + Vite single-page application on AWS global edge network. |

---

## 🛡️ Themis Cognitive AI Engine

Themis employs a resilient, multi-tiered AI dispatcher:
1. **Primary Generative Engine:** Amazon Bedrock Converse API (`anthropic.claude-3-5-sonnet` / Amazon Nova).
2. **High-Speed Fallback Engine:** Groq API (`openai/gpt-oss-120b` and `qwen/qwen3.8-27b`) for rapid response times and high token throughput.
3. **Deterministic Safety Fallback:** Rule-based statutory NLP analyzer with Indian Penal Code / BNS, Section 138 NI Act, and parody detection heuristics to guarantee 100% uptime even if external LLM APIs face connectivity issues.

---

## ⚡ Quickstart & Local Development

### Prerequisites
- Node.js v20+
- Docker & AWS SAM CLI
- LocalStack (for local AWS service emulation)

### 1. Clone & Install
```bash
git clone https://github.com/Ashish-331/themis-ai.git
cd themis-ai
cd src && npm install && cd ..
cd frontend && npm install && cd ..
```

### 2. Configure Environment
Copy the example environment files:
```bash
cp local/env.example.json local/env.json
```
Populate your credentials in `local/env.json` (this file is gitignored for security).

### 3. Start Local Emulation & Resources
```bash
# 1. Start LocalStack
docker run -d --name localstack_main -p 4566:4566 -e SERVICES=dynamodb,s3 localstack/localstack:3.8.1

# 2. Initialize LocalStack DynamoDB Table & S3 Bucket
aws --endpoint-url=http://localhost:4566 dynamodb create-table \
  --table-name themis-documents \
  --attribute-definitions AttributeName=PK,AttributeType=S AttributeName=SK,AttributeType=S AttributeName=GSI1PK,AttributeType=S \
  --key-schema AttributeName=PK,KeyType=HASH AttributeName=SK,KeyType=RANGE \
  --global-secondary-indexes "IndexName=GSI1,KeySchema=[{AttributeName=GSI1PK,KeyType=HASH}],Projection={ProjectionType=ALL}" \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1

aws --endpoint-url=http://localhost:4566 s3 mb s3://themis-documents-local --region ap-south-1

# 3. Run Backend Test Suite
cd src && npm test && cd ..

# 4. Build and start SAM Local API
sam build
sam local start-api --env-vars local/env.json --port 3000 --skip-pull-image

# 5. Start Frontend Dev Server
cd frontend && npm run dev
```
Open **`http://localhost:5173`** in your browser.

---

## 🚀 Cloud Deployment to Real AWS

Deploy the complete serverless backend using AWS SAM:

```bash
# Guided 1-click deployment to your AWS account
sam build
sam deploy --guided
```

SAM will provision:
- The DynamoDB Single-Table (`themis-documents`)
- The S3 Document Bucket (`themis-documents-<account>-<region>`)
- IAM Execution Roles with least-privilege policies
- API Gateway endpoints and Lambda functions

### Deploy Frontend to AWS Amplify:
1. Connect your GitHub repository to **AWS Amplify Hosting**.
2. Set the build environment variable `VITE_API_URL` to your deployed API Gateway stage URL (`https://<api-id>.execute-api.<region>.amazonaws.com/Prod`).
3. Deploy automatically via the included [`amplify.yml`](amplify.yml).

---

## 🤖 Mandatory Hackathon AI Tool Attribution

In strict accordance with the **WeMakeDevs & AWS First Commit Hackathon** guidelines, we transparently disclose and attribute all AI tools utilized during the conception, development, and debugging of this project:

- **Google Antigravity (Advanced Agentic AI Assistant):** Assisted in full-stack pair programming, AWS SAM template restructuring, LocalStack container orchestration, and debugging Linux audio pipelines.
- **Anthropic Claude 3.5 Sonnet / AWS Bedrock:** Utilized in the generative prompt engineering pipeline for Indian legal text simplification and statutory cross-referencing.
- **Groq LPU Inference (`openai/gpt-oss-120b` & `qwen/qwen3.8-27b`):** Employed for real-time generative translation and Indian vernacular synthesis.
- **Amazon Polly Neural TTS (`Kajal`):** Used directly as an AWS service for real-time natural speech synthesis.

All architectural decisions, repository design, statutory legal logic, and security configurations were authored and reviewed by the project creator.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
