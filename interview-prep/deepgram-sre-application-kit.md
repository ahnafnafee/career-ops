# Application Kit: Deepgram — Site Reliability Engineer (AI & ML Infrastructure)

**Date prepared:** 2026-04-28
**Application URL:** https://jobs.ashbyhq.com/deepgram/f424ef6a-c27f-4984-9e77-40a1ad16ae28
**Score:** 4.6/5 (top pick)
**Source files:**
- Eval: `reports/015-deepgram-sre-2026-04-27.md`
- Contacts: `interview-prep/deepgram-sre-contacts.md`
- CV: `output/cv-ahnaf-an-nafee-deepgram-sre-2026-04-27.pdf`
- Cover letter: `output/cover-letter-ahnaf-an-nafee-deepgram-sre-2026-04-27.{pdf,md,tex}`

## Files to upload

| Field | File |
|-------|------|
| Resume / CV | `output/cv-ahnaf-an-nafee-deepgram-sre-2026-04-27.pdf` |
| Cover letter (if separate field exists) | `output/cover-letter-ahnaf-an-nafee-deepgram-sre-2026-04-27.pdf` |
| Cover letter (paste-into-text-area version) | `output/cover-letter-ahnaf-an-nafee-deepgram-sre-2026-04-27.md` |

## Standard contact fields

| Field | Value |
|-------|-------|
| Full name | Ahnaf An Nafee |
| Email | ahnafnafee@gmail.com |
| Phone | 540-252-8738 |
| Location | Fairfax, VA, USA |
| LinkedIn | https://linkedin.com/in/ahnafnafee |
| GitHub | https://github.com/ahnafnafee |
| Portfolio / Website | https://www.ahnafnafee.dev |
| Google Scholar | https://scholar.google.com/citations?user=u15DO0cAAAAJ |
| Pronouns | (leave blank or fill per preference) |

---

## Pre-drafted answers (Ashby standard questions)

> Tone: confident without arrogance. Specific. No "I'm passionate about" / "I would love the opportunity" filler. Answers reference REAL proof points from cv.md.

### "Why are you interested in this role?"

> Your title literally names my stack — Kubernetes, AWS, Terraform — and frames it around AI/ML infrastructure, which is exactly the bridge I've been building toward as a CS PhD researcher. At Paychex I led a cross-team standardization of OpenShift deployment dictionaries across 10+ service teams and automated the TLS certificate lifecycle to eliminate cert-related downtime by 100%. Doing that work for an AI-first company where the reliability bar directly affects model latency and cost is the next step I want.

(~95 words)

### "Why do you want to work at Deepgram?"

> Deepgram sits at the intersection I care about: voice/speech AI shipped as a developer product, with a real engineering blog (Nova-3 STT, Aura TTS) and a hybrid AWS + bare-metal Slurm-on-K8s GPU stack that's interesting to operate. The IBM Watsonx Orchestrate partnership and 200,000-developer footprint mean the SRE role is load-bearing — uptime here translates directly to revenue and customer trust. I've been using Deepgram's API to evaluate STT quality alongside Whisper for personal research, and the platform's responsiveness made it a natural reference point.

(~90 words)

### "Tell us about a relevant project or achievement"

> At Paychex I owned an OpenShift cross-team deployment-dictionary standardization spanning 10+ engineering groups. Configuration drift was costing the platform team weekly incidents and slowing developer velocity. I led the discovery, designed a conflict-free dictionary schema, drove consensus across teams with different priorities, and shipped it. The artifact eliminated dictionary-induced incidents and unblocked deployment automation. The same approach — find the platform-level constraint, design for everyone's needs without negotiating away rigor, ship it — is how I'd approach Deepgram's multi-tenant ML infra reliability.

(~90 words)

### "What makes you a good fit for this position?"

> I'm an unusual mix for an SRE role: 2.5 years of production OpenShift / Kubernetes / AWS at Paychex (RBAC, certificate automation, CI/CD plugin reducing operational spend 10%/year), one year as CTO at Dynasty 11 (AWS migration cutting load + cost 80% via right-sizing, autoscaling, serverless), and an active CS PhD at GMU's DCXR Lab researching generative AI / 3D graphics. The mix means I read PyTorch and reliability dashboards with equal fluency — exactly the profile your AI/ML infra team needs.

(~85 words)

### "How did you hear about this role?"

> I systematically scan AI-first company portals weekly. Deepgram surfaced through your Ashby board, scored highest in my own role-fit evaluation, and the title's explicit Kubernetes + AWS + Terraform framing matched my hands-on stack 1:1.

(~35 words)

### "What's something interesting you've worked on recently?" (variant)

> At Paychex I built a Gradle plugin for container image certification that became a CI/CD checkpoint across the platform. It reduced build-pipeline congestion and cut operational expenses by ~10% annually. The interesting part wasn't the plugin itself — it was the certification protocol design (which images need re-cert, when, and how to skip safely). That's the kind of small, well-scoped reliability tooling that compounds.

(~65 words)

---

## Sensitive-question playbook

### Work authorization questions (likely asked)

**Q: "Are you legally authorized to work in the United States?"**
- Answer: **Yes.** (Truthful — you have current authorization for your PhD program / OPT.)

**Q: "Will you now or in the future require sponsorship for employment visa status (e.g., H-1B)?"**
- Answer: **Yes.**
- Reason this must be answered truthfully: it's a direct legal/eligibility question. Saying "No" when sponsorship is required is grounds for rescinded offers later.
- Memory rule applies: don't volunteer this elsewhere (cover letter, summary, intro), but answer truthfully when explicitly asked.
- Mistral was the only top-pick that explicitly offers sponsorship. Deepgram's posture is unconfirmed — be ready that this answer may filter the application out, in which case proceed to recruiter conversation via Mark Butler (Talent Acquisition Manager — see contacts file) to confirm sponsorship policy before investing further interview time.

### Salary expectation question (sometimes asked)

**Q: "What are your salary expectations?"**
- Recommended answer: `$160,000 – $210,000 base + equity + benefits, flexible based on full package and role scope.`
- Or, if it's a single number: `$185,000 base, with flexibility based on equity grant and benefits.`
- Don't go lower than $160K (your stated minimum from `config/profile.yml`).

### Start date

**Q: "When can you start?"**
- Recommended: `Flexible — 2-4 weeks after offer acceptance to coordinate with my PhD program.`

### Diversity / demographics questions

- These are voluntary in the US. Answer per personal preference. Refusal does not affect application.

---

## Tactical notes for THIS application

1. **Recruiter parallel touch.** Right after submitting the form (or within 24 hours), send the Recruiter draft message to Mark Butler from `interview-prep/deepgram-sre-contacts.md`. Application + warm recruiter touch is the highest-conversion combo.

2. **Don't message Kris Efland (VP Eng) until after the recruiter conversation.** Premature exec-level outreach can feel pushy. Hold him as an escalation path if recruiter goes silent for 7+ days.

3. **Cover letter delivery.** Ashby usually gives a single "Cover Letter" upload field. Use the PDF. If they have a "tell us why" text-area instead of an upload, paste from the .md version.

4. **Terraform gap.** Do NOT volunteer this in the application form — your CV lists Terraform under skills. If asked in screen ("How much Terraform have you written?"), be honest: "I've worked with IaC patterns and read/modified Terraform but most of my hands-on IaC has been Helm + Gradle plugins; I'd be ramping in the first 30 days."

5. **PhD framing.** When asked about education or "current commitments," frame the PhD as a multiplier ("CS research at GMU's DCXR Lab on generative AI / 3D graphics") rather than a constraint. Deepgram's research culture should view it as a plus.

6. **Pause before clicking Submit.** Per career-ops ethical rule. Review every field once. Confirm uploads attached. Then submit.

---

## Post-submit checklist

After you click Submit:

1. Update `data/applications.md`:
   - Find row #15 (Deepgram SRE)
   - Change `Status: Evaluated` → `Status: Applied`
   - Change `Date: 2026-04-27` → `Date: <today>`
   - Add note in Notes column: "Applied via Ashby; recruiter touch sent same day to Mark Butler"
2. Send the recruiter draft from contacts file (Mark Butler, LinkedIn or email if surfaced)
3. Add a calendar reminder for **<today + 7 days>** to follow up if no response
4. Tell me you submitted — I'll do steps 1-3 for you if you say "I applied to #15"

## Cadence after Applied

| Days since apply | Action |
|------------------|--------|
| 0 | Send recruiter LinkedIn message (Mark Butler) |
| 7 | First follow-up email if no response (the cadence script will flag it) |
| 14 | Second follow-up — short, new angle (relevant insight or update) |
| 21+ | If still cold: mark as `Discarded` or escalate via Kris Efland (VP Eng) |
