# Evaluation: Anthropic — [Expression of Interest] Research Scientist / Engineer, Honesty

**Date:** 2026-04-27
**URL:** https://job-boards.greenhouse.io/anthropic/jobs/4532887008
**Archetype:** AI Researcher (primary) / AI Infrastructure (secondary)
**Score:** 2.8/5
**Legitimacy:** Proceed with Caution
**Verification:** unconfirmed (batch mode)
**PDF:** pending

---

## A) Role Summary

| Field | Value |
|-------|-------|
| Archetype | AI Researcher / Alignment-Safety (Finetuning Alignment team) |
| Domain | LLM safety, hallucination reduction, calibration, RAG |
| Function | Research + build (data pipelines, classifiers, evals, RL envs) |
| Seniority | Research Scientist or Research Engineer (level varies) |
| Remote | Hybrid; 25% in-office min (NYC preferred, SF optional) |
| Team size | Not stated — Finetuning Alignment team, Honesty subteam |
| TL;DR | Build training data pipelines, hallucination classifiers, honesty benchmarks, and RL environments to reduce model deception/fabrication. |

**Important context:** This is `[Expression of Interest]` — Anthropic explicitly states the team is at headcount capacity for 2025 and this is a talent pool for future openings, not an active req. No guaranteed hiring window.

## B) CV Match

| JD Requirement | CV Evidence | Status |
|----------------|-------------|--------|
| MS/PhD in CS/ML | `cv.md` L59-60: "PhD in Computer Science — George Mason University, DCXR Lab" | Match (in-progress) |
| Strong Python | `cv.md` L72: Python listed; Paychex/Dynasty 11 work | Partial — no LLM-specific Python shown |
| Industry experience finetuning LLMs + classifier training | None on CV | **Gap (hard)** |
| Experimental design + statistical analysis for calibration/accuracy | None explicit; PhD research adjacent | **Gap (medium)** |
| Dataset curation for LLM finetuning | None on CV | **Gap (hard)** |
| Uncertainty/calibration/truthfulness metrics | None on CV | **Gap (hard)** |
| Published research on hallucination prevention / factual grounding | DCXR Lab work is AI/3D graphics — not NLP/LLM honesty | **Gap (hard, preferred)** |
| RLHF experience for truthfulness | None | **Gap (hard, preferred)** |
| RAG systems experience | None on CV | **Gap (medium)** |
| Commitment to AI safety | DCXR Lab AI research signals interest, but no safety publications | Weak signal |

**Gaps & Mitigation:**
1. **No LLM finetuning / RLHF / hallucination work** — hard blocker. Mitigation: this is the *core* of the role; no quick mitigation. Would need months of focused interpretability/alignment work + a paper.
2. **No alignment/safety publications** — preferred but heavily weighted. Mitigation: DCXR Lab AI/3D graphics research does not transfer to honesty/calibration research.
3. **DevOps/Infra strengths are tangential** — CI/CD, K8s, OpenShift skills don't map to this role's data-curation + RL-environment work. Could pivot the framing toward "AI Infrastructure for safety teams" but the JD is squarely IC research, not infra.

## C) Level and Strategy

- **JD Level:** Research Scientist OR Research Engineer (level matched to experience). Anthropic ranges $315K-$560K imply IC2-IC4 bands.
- **Candidate's natural level:** PhD-track AI Researcher OR Mid-Senior AI Infra Engineer — neither is a clean fit for an alignment finetuning IC role.
- **Sell Senior Without Lying:** Lean on (a) PhD researcher mindset (DCXR Lab), (b) production systems experience as differentiator vs pure-research candidates, (c) former CTO leadership signal. Honest framing: "I bring infrastructure + research perspective to safety teams." But this is a *research* role, not an infra-for-research role.
- **If downleveled:** Realistically the gap is too wide to downlevel into. A more honest path is the **AI Infrastructure / ML Platform** track at Anthropic (separate reqs), where DevOps/OpenShift/K8s skills are first-class.

## D) Comp and Demand

| Source | Range | Notes |
|--------|-------|-------|
| Levels.fyi (Research Scientist, Anthropic) | $320K-$1.05M+ TC; median ~$746K | Includes equity at $61.5B valuation |
| JD-stated range | **$350K-$500K USD** | Posted on the listing itself |
| Levels.fyi (similar Research Engineer, Tokens / Interpretability) | $315K-$560K | Comparable bands |
| Candidate target | $160K-$210K | JD floor 67% above candidate ceiling |

**Demand:** Alignment/safety research is one of Anthropic's top investment areas; competition is fierce — typically PhD + papers in interpretability/RLHF/alignment. Comp is well above candidate target (positive if hired), but bar is high.

## E) Customization Plan

| # | Section | Current | Proposed | Why |
|---|---------|---------|----------|-----|
| 1 | Summary | "DevOps Engineer & AI Researcher" | Add line: "PhD researcher exploring AI systems and reliability." | Bridges infra + AI research framing |
| 2 | Experience | DevOps bullets dominate | Lead with PhD/DCXR research bullets if applying | Match research-first JD |
| 3 | Skills | Generative AI generic | Add specifics: "PyTorch, LLM finetuning (study), evaluation frameworks" — only if true | ATS keywords; avoid fabrication |
| 4 | Projects | None listed | Add 1-2 alignment-adjacent side projects (eval harness, hallucination classifier toy) before applying | Demonstrate interest concretely |
| 5 | LinkedIn headline | DevOps + AI Researcher | Same; do not over-pivot to "alignment researcher" without proof | Honesty (ironically, given the role) |

**Verdict:** customization alone cannot close the research-publication gap.

## F) Interview Plan

Given low fit, interview prep is speculative. If invited:

| # | JD Requirement | STAR+R Story | S | T | A | R | Reflection |
|---|----------------|--------------|---|---|---|---|------------|
| 1 | Experimental design | DCXR Lab research methodology | PhD lab | Run AI/graphics experiments | Designed evaluation protocol | Reproducible results | Tighter eval design = better claims |
| 2 | Production data pipelines | Paychex deployment dictionaries | Cross-team config conflicts | Standardize 100+ deployment configs | Built config validation pipeline | 0 config conflicts post-rollout | Validation early beats incidents |
| 3 | Cross-team collaboration | OpenShift RBAC at Paychex | Translate dev needs to security | Partnered with infra/security | Shipped RBAC framework | Streamlined ops | Security-as-code beats ad hoc tickets |
| 4 | Automation reducing manual work | Dynasty 11 GitHub Actions | Manual deploys eating time | Built CI/CD with Maven | 85% manual reduction | Faster release cycles | Pipeline-as-code is non-negotiable |
| 5 | Technical leadership | CTO at Dynasty 11 | Set tech vision | Led engineering teams | AWS migration → 80% cost cut | Org-level scale | Leadership = enabling others, not heroics |
| 6 | AI safety motivation | DCXR Lab interest in AI reliability | Bridge graphics → safety | Self-study alignment | (in progress) | (in progress) | Need concrete project to claim this |

**Red-flag questions:** "What papers have you published on alignment/honesty?" — honest answer: DCXR Lab work is in AI/3D graphics, not NLP safety. Show genuine interest + production-systems angle.

## G) Posting Legitimacy

**Assessment:** **Proceed with Caution**

| Signal | Finding | Weight |
|--------|---------|--------|
| Posted on official Anthropic Greenhouse | Yes (job-boards.greenhouse.io/anthropic) | Positive |
| Tech specificity | High — names RAG, RLHF, classifiers, RL envs, calibration metrics | Positive |
| Salary disclosed | Yes — $350K-$500K | Positive |
| Apply button / Visa sponsorship | Available per JD | Positive |
| **`[Expression of Interest]` flag** | **Talent pool, not an open req. JD: "Currently at headcount capacity for 2025"** | **Concerning** |
| Hiring timeline | Indefinite — pipeline for "future growth" | Concerning |
| Reposting | Common pattern across Anthropic EoI postings (Interpretability, Model Evals, etc.) | Neutral |

**Context Notes:**
- This is NOT a ghost job — Anthropic publishes EoI postings transparently and uses them to (a) build pipeline, (b) redirect strong candidates to adjacent open reqs.
- Realistic expectation: response time may be long, no guaranteed interview, may be redirected to a different team.
- No visa-sponsorship blocker stated; sponsorship is available.

## H) Draft Application Answers

(Skipped — score < 4.5)

---

## Recommendation

**Do NOT apply at this time.** Score 2.8/5. The research-publication and LLM-finetuning gaps are too wide to bridge with a strong cover letter. This role targets candidates with alignment/interpretability papers and direct RLHF experience — neither is on the candidate's CV. The DevOps/Infra strengths are world-class but don't map to this IC research role.

**Better paths at Anthropic:**
1. AI Infrastructure / ML Platform Engineer reqs — DevOps + OpenShift + K8s + AWS skills are first-class fit.
2. Build 1-2 alignment-adjacent projects (eval harness, hallucination detection on open models) over 6-12 months, then revisit.
3. Use the EoI URL only if pivoting hard into safety research with a concrete project portfolio.

---

## Extracted keywords

hallucination reduction, language model finetuning, RLHF, retrieval-augmented generation (RAG), classifier training, honesty benchmarks, calibration, model evaluation, factual grounding, AI safety, alignment, dataset curation, training data pipelines, RL environments, human feedback, truthfulness metrics, uncertainty estimation, Python, PyTorch, statistical analysis
