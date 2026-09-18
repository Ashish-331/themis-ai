# Themis — Guideline (Install → Learn → Build Local → Push AWS)

> **Order for this pass:** install every tool *one by one* with explanation, understand what each one is before touching it, build the entire thing locally end-to-end, then deploy to real AWS at the very end. No code in this doc yet — this is the map, not the build.
>
> **How installs happen:** not by reading this table and copy-pasting blind — go tool by tool, one at a time, **in chat**. Before installing each one, get a plain explanation of what it is and why it's needed here; then install it with commands given and explained as they're run; then verify it worked before moving to the next tool. This file tracks the order and the checklist; the actual walkthrough happens live, tool by tool.
>
> **Reference architecture:** `ARCHITECTURE_LEAN.md v3` (locked) — React (Amplify) + API Gateway (Cognito) + 2x Lambda + S3 + DynamoDB Single Table (PK/SK/GSI1PK) + Bedrock.

---

## Part 1 — Install Everything (guided, one tool at a time)

For each row: **explain what it is → install it together, command by command → verify with the check command → move to the next row.** Don't skip ahead before the current one is confirmed working.

| Order | Tool | What to install | Check it worked |
|---|---|---|---|
| 0 | Terminal + VS Code | VS Code from code.visualstudio.com, use its built-in terminal | `code --version` |
| 1 | Git | usually preinstalled (Mac: Xcode CLT, Win: Git for Windows) | `git --version` |
| 2 | Node.js 20 | nodejs.org → LTS 20.x (matches Lambda `nodejs20.x`) | `node -v` → `v20.x` and `npm -v` |
| 3 | Python 3.11+ | python.org (Mac/Linux usually preinstalled) | `python3 -V` |
| 4 | Docker Desktop | docker.com/products/docker-desktop (Win: needs WSL2) | `docker -v` and `docker ps` (must be running) |
| 5 | AWS CLI | aws.amazon.com/cli or `pip install awscli` | `aws --version` |
| 6 | LocalStack | `pip install localstack` | `localstack --version` |
| 7 | awslocal | `pip install awscli-local` | `awslocal --version` |
| 8 | AWS SAM CLI | See AWS SAM install docs for your OS (needs Docker + Python) | `sam --version` |

**Final confirmation (after all 8 are green):**

```bash
localstack start -d
# wait 30-60s for LocalStack to boot
awslocal dynamodb list-tables
```

An empty `{"TableNames": []}` means the whole toolchain is wired up correctly. Nothing needs to work beyond this for now.

> **Windows note:** Docker Desktop must be running before LocalStack/SAM. If `docker ps` says "cannot connect", start Docker Desktop first.

---

## Part 2 — What Each Tool Actually Is (concepts, no code yet)

**Docker** — runs "containers," which are lightweight, isolated mini-computers-in-a-box. LocalStack runs inside a Docker container. You won't write Docker config yourself for this project; you just need it running in the background.

**Git** — version control. Tracks every change so you can push to GitHub for Amplify and for the hackathon submission.

**Node.js + npm** — runs JavaScript outside the browser. Your Lambdas are Node.js and your React frontend is Node.js. `npm` installs packages.

**Python** — SAM CLI and LocalStack are Python programs. You just need it installed so they can run.

**AWS CLI (`aws`)** — a command-line tool that talks to *real* AWS. Every button you'd click in the AWS web console has an equivalent `aws` command. Configured via `aws configure`.

**LocalStack + `awslocal`** — LocalStack is a program that **pretends to be AWS** (fake DynamoDB, fake S3, fake Lambda, fake Cognito) running entirely on your laptop, inside Docker. `awslocal` is just the `aws` CLI pre-pointed at LocalStack instead of real AWS, so you don't have to type the local endpoint URL every time. Nothing here costs money or touches your real AWS account.

**AWS SAM CLI (`sam`)** — SAM (Serverless Application Model) is AWS's toolkit for *serverless* apps specifically. It does two things: (1) lets you run Lambda functions locally (`sam local invoke`, `sam local start-api`) as if API Gateway were really calling them, and (2) later takes one YAML file (`template.yaml`) describing your whole app and deploys all of it to real AWS with one command (`sam deploy`). Under the hood SAM uses CloudFormation.

**Lambda** — a way to run a function without managing a server. AWS runs your code only when something triggers it (a request comes in), then shuts it down. No server is "always on." Your two Lambdas are `analyzeDocument` and `history`.

**API Gateway** — the "front door" that turns an HTTP request from the internet into a Lambda invocation, and turns the Lambda's response back into an HTTP response. It's the thing that gives your backend a real URL (`https://xxx.execute-api...`). With Cognito, it also checks the JWT before letting the request reach Lambda.

**DynamoDB** — AWS's NoSQL database. No tables-with-JOINs like SQL; instead you design around `PK` (partition key) / `SK` (sort key) and query patterns you know in advance. This project uses **one single table** for everything (`PK=USER#sub, SK=DOC#<ISO8601>#<uuid>`, `GSI1PK=DOC#<uuid>`). `PAY_PER_REQUEST` means it scales to zero.

**S3** — file/object storage. Photos go here, not in DynamoDB. You'll use **presigned URLs** — temporary permission slips (valid 5 min) that let the browser upload a file directly to S3 without your backend touching the bytes.

**Bedrock** — AWS's gateway to foundation models (Claude 3.5 Sonnet). This is the **only** piece that *can't* be faked by LocalStack — it needs your real AWS account and model access, even during local development. Local mock uses dummy Marathi while real Bedrock is wired later.

**Cognito** — AWS's user-accounts-and-login service. Handles signup/signin, email OTP, and issues JWTs (signed tokens) that API Gateway can verify. Deployed build enforces it; local mock uses `demo-user` only (disclosed, not hidden).

**Amplify Hosting** — takes your built React app (static HTML/CSS/JS) and serves it publicly with one command / drag-and-drop. Gives your Ship It URL for the frontend.

**CloudFormation (under SAM)** — the AWS service that actually creates/updates/deletes real AWS resources based on a YAML template. SAM is a simplified layer on top of it for serverless apps.

---

## Part 3 — Build Everything Locally (in order)

Do these in order. Each step has a clear "done" check.

> **Prereq before step 1:** `cp .env.example local/env.json` and `.env` — so Lambdas know `BUCKET_NAME`, `DOCUMENTS_TABLE`, `BEDROCK_MODEL_ID`. The AI agent will create these with you.

**1. DynamoDB table locally — single table**
```bash
awslocal dynamodb create-table --cli-input-json file://local/dynamodb-create.json
awslocal dynamodb list-tables  # see nyaya-documents
awslocal dynamodb put-item --table-name nyaya-documents --item '{"PK":{"S":"USER#demo-user"},"SK":{"S":"PROFILE"},"email":{"S":"demo@nyaya.local"}}'
awslocal dynamodb query --table-name nyaya-documents --key-condition-expression "PK = :pk" --expression-attribute-values '{":pk":{"S":"USER#demo-user"}}'
```
*Done when query returns your test item.*

**2. S3 bucket locally**
```bash
awslocal s3 mb s3://nyaya-documents-local
awslocal s3 ls  # see bucket
# presigned URL flow test:
awslocal s3 presign s3://nyaya-documents-local/test.jpg --expires-in 300
curl -X PUT --upload-file ./test.jpg "https://...presigned..."
awslocal s3 ls s3://nyaya-documents-local --recursive  # file landed
```
*Done when upload appears in `ls`.*

**3. Lambda functions, invoked locally (no API Gateway yet)**
```bash
sam build
sam local invoke AnalyzeDocumentFunction --event events/analyze-event.json --env-vars local/env.json
sam local invoke HistoryFunction --event events/history-event.json --env-vars local/env.json
```
*Done when both return 200 with JSON (mock Bedrock at this stage).*

**4. API Gateway, simulated**
```bash
# template.yaml must wire: POST /analyze → AnalyzeDocument, GET /history → History
sam local start-api --env-vars local/env.json
# in another terminal:
curl -X POST http://127.0.0.1:3000/analyze -F "file=@test.jpg" -F "language=marathi"
curl "http://127.0.0.1:3000/history?userId=demo-user"
```
*Done when curl returns same JSON as `sam local invoke` did, but via HTTP.*

**5. Bedrock (real account needed here)**
- In **real** AWS Console → Bedrock → Model access → Enable `Anthropic Claude 3.5 Sonnet` (takes 1-5 min).
- From a plain script (not yet inside Lambda), call Bedrock with a test image, inspect raw output.
- Wire the **robust JSON parse fallback** (strip fences → regex extract → try/catch → fallback with `parseWarning` + yellow banner). Test with a malformed response on purpose.
*Done when real Marathi JSON comes back, and malformed case shows warning not crash.*

**6. Wire it all together locally**
```bash
sam local start-api --env-vars local/env.json
# Now Lambda calls real Bedrock + local DynamoDB + local S3, all reachable via http://127.0.0.1:3000
```
*Done when a curl upload hits local S3, triggers Bedrock, and appears in `awslocal dynamodb query`.*

**7. Frontend, local**
```bash
cd frontend
echo "VITE_API_URL=http://127.0.0.1:3000" > .env
npm run dev  # http://localhost:5173
```
Test full flow: upload → analyze → History tab → share button. All end-to-end **without touching real AWS infra**.
*Done when browser flow works with local API.*

**8. Cognito locally (learning only)**
```bash
awslocal cognito-idp create-user-pool --pool-name nyaya-local
awslocal cognito-idp sign-up --client-id xxx --username test@nyaya.local --password Test1234!
awslocal cognito-idp admin-confirm-sign-up --user-pool-id xxx --username test@nyaya.local
```
Get a token, call `curl -H "Authorization: Bearer <token>" http://127.0.0.1:3000/history`
> **Warning:** `sam local start-api` **ignores** `CognitoAuthorizer` by default — it will let requests through even without a valid JWT. This step is for *learning* signup flow only. Real JWT gating is only verified after `sam deploy` to real AWS.

**9. Break it on purpose, locally**
- Bad photo (blurry) → should show `parseWarning` yellow banner, not crash.
- Try to fetch another user's doc via GSI1 → should 403 (owner check via `claims.sub`).
- Call `/history` with no token after deploy → should 401.
*Done when all three fail gracefully before ever deploying.*

---

## Part 4 — Push to Real AWS

```bash
# 1. Point CLI to real AWS (separate from awslocal)
aws configure
# AWS Access Key ID: from AWS Builder Center / IAM
# Secret: ...
# Region: ap-south-1 (Mumbai)
# Output: json

# 2. Deploy same template.yaml you tested locally — now it creates REAL resources
sam build
sam deploy --guided
# Stack Name: nyaya-sahayak
# Region: ap-south-1
# Confirm changes: Y, Allow IAM: Y, Save samconfig.toml: Y
# Outputs → note these:
#   ApiUrl: https://xxx.execute-api.ap-south-1.amazonaws.com/Prod
#   UserPoolId: ap-south-1_XXXX
#   UserPoolClientId: xxx
#   BucketName: nyaya-documents-xxx
#   DocumentsTable: nyaya-documents-xxx

# 3. Point frontend to real API, rebuild, deploy
cd frontend
echo "VITE_API_URL=https://xxx.execute-api.ap-south-1.amazonaws.com/Prod" > .env
echo "VITE_USER_POOL_ID=ap-south-1_XXXX" >> .env
echo "VITE_USER_POOL_CLIENT_ID=xxx" >> .env
npm run build
# Amplify Hosting: AWS Console → Amplify → Host web app → Drag frontend/dist folder
# OR: amplify publish

# 4. Re-run the exact same "break it on purpose" checks against the REAL deployed URL
curl https://xxx.execute-api.ap-south-1.amazonaws.com/Prod/history -H "Authorization: Bearer <real-token>"
# Expect 200 with your docs, 401 without token, 403 for other user's doc

# 5. Record demo video against the real, deployed link (not localhost)
```

> If a step in Part 1 or 2 doesn't make sense once you're doing it, **stop there and ask** — this doc is the map, not a substitute for working through it together tool by tool.

---

**Checklist (tick as you go):**
- [ ] Part 1: 8 tools green + `awslocal dynamodb list-tables` empty
- [ ] Part 2: Can explain each tool in one sentence
- [ ] Part 3: DynamoDB + S3 + 2 Lambdas + API Gateway all work via `sam local`
- [ ] Part 3: Bedrock real call + robust parse + wired via `sam local start-api`
- [ ] Part 3: Frontend localhost → local API → full flow
- [ ] Part 3: Cognito signup locally + break tests graceful
- [ ] Part 4: `sam deploy` → real ApiUrl + Amplify URL + re-tested
