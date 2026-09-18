# Project Guidelines: WeMakeDevs & AWS Hackathon (First Commit)

These guidelines govern development, Git practices, architecture, and submission compliance for the **First Commit Hackathon** (Bharat Builds Tour).

---

## 1. Hackathon Rules & Compliance

- **Development Window:** All project code must be committed during the hackathon period (**Sept 17 – 20, 2026**). Pre-existing private codebases are strictly disqualified.
- **AI Tool Attribution:** 
  - AI coding tools (e.g., Antigravity, Copilot, Claude) are **fully permitted**.
  - Always list the AI tools utilized in your final project write-up / README.
- **Originality & Attribution:** Open-source starter templates and third-party libraries may be used, provided they are cited in the project documentation and license terms are respected.

---

## 2. Git & Commit Best Practices

Judges inspect the Git commit history to verify authentic development activity.

- **Cadence & Granularity:**
  - Make frequent, atomic commits as you build features rather than single large dump commits.
  - Test locally before committing.
- **Commit Messages:**
  - Follow Conventional Commits format:
    - `feat: add user authentication via Amazon Cognito`
    - `fix: resolve DynamoDB query pagination issue`
    - `docs: update setup guide and architecture diagram`
    - `chore: configure localstack environment`
- **Clean Git History:**
  - Avoid committing boilerplate with auto-generated inline comments like `# In production, replace this placeholder...`.
  - Ensure config files from proprietary AI assistants (e.g., `.cursor/`, `.windsurf/`) are excluded via `.gitignore` unless intended for the project.

---

## 3. Security & Cloud Best Practices

- **Never Commit Secrets:**
  - Never commit AWS Access Keys, Secret Keys, database passwords, or JWT secrets.
  - Store all credentials in `.env` (which must be ignored in `.gitignore`).
  - Provide a `.env.example` file showing required environment variables without sensitive values.
- **AWS Credentials Handling:**
  - Use IAM roles and least-privilege permissions where possible.
  - For local development with AWS, utilize AWS CLI profiles (`~/.aws/credentials`) or [LocalStack](https://localstack.cloud/) for zero-cost emulation.
- **Cost Awareness:**
  - Ensure all cloud resources stay within the $100 AWS credits budget.
  - Tear down or shut down unused compute/database resources when not testing.

---

## 4. Architecture & Implementation Guidelines

- **Track Selection Focus:**
  - **Ship It Track:** Prioritize high availability, serverless architecture (AWS Lambda, API Gateway, DynamoDB, Amazon Bedrock, S3), and live deployment.
  - **Build It Track:** Prioritize local-first, containerized, or open-source AWS tooling (SAM CLI, LocalStack, Cedar, OpenSearch, Firecracker).
  - **Best UI Track:** Responsive design, intuitive UX, clean error states, and clear loading indicators.
- **Rule of Execution:**
  > *"A small problem solved exceptionally well beats an ambitious idea half-working."*
  - Build a rock-solid core workflow first before adding secondary bells and whistles.

---

## 5. Submission Deliverables Checklist

Before the submission deadline:

- [ ] **Public GitHub Repository:**
  - Active git commit history within the hackathon dates.
  - Comprehensive `README.md` with problem statement, architecture diagram, setup instructions, and AI attribution.
- [ ] **Demo Video (Maximum 3 Minutes):**
  - Hosted on YouTube (Public or Unlisted).
  - Demonstrates the live working application end-to-end.
  - Clearly explains the problem and showcases how AWS services/tools power the solution.
- [ ] **Write-Up:**
  - Summarizes the problem, technical architecture, AWS integration points, and learnings gained during the hackathon.
