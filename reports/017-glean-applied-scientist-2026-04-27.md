# Glean — Senior/Staff Applied Scientist

**Date:** 2026-04-27
**URL:** https://job-boards.greenhouse.io/gleanwork/jobs/4424103005
**Archetype:** AI Researcher / Applied Science (experimentation + LLM evaluation)
**Score:** 2.4/5
**Legitimacy:** High Confidence
**Verification:** unconfirmed (batch mode)
**PDF:** pending

---

## Block A — Match con CV

**Strong overlaps (limited):**
- Python proficiency (cv.md L79) — direct match for "very proficient in Python"
- PhD CS (in progress) at GMU/DCXR Lab (cv.md L62-64) — meets "3+ as a PhD" if ABD is accepted
- ML/AI exposure: PyTorch, TensorFlow, Diffusion Models, LLMs (cv.md L80) — partial match for "strong in ML"
- Technical communication: published research, portfolio, technical artwork (cv.md L75) — fits "technical documentation strong suit"

**Significant gaps:**
- **No A/B experimentation platform experience** (CV has zero references to A/B testing, online experimentation, or product experimentation infrastructure) — this is a CORE requirement
- **No statistics-heavy production work** — CV emphasizes systems/DevOps/graphics, not statistical inference, hypothesis testing, or causal analysis
- **No SQL/dbt/modern data stack** in CV (no mention of dbt, dashboarding, ETL/ELT pipelines, or product KPIs)
- **No B2B SaaS product data science background** — CV is DevOps + graphics research + game dev
- **Research domain mismatch:** PhD focus is generative AI for 3D content / graphics pipelines / HCI-XR — NOT IR, NLP, ranking, retrieval, or LLM evaluation methodology
- **No ranking/IR experience** — Applied Scientist at Glean implies search/ranking/retrieval depth
- **Years of experience as PhD:** PhD started Aug 2025 per cv.md L14-15, so <1 year as PhD candidate. Applied Scientist requires 3+ years post-PhD start (or 5+ MS) — likely fails experience floor

**Match score:** 1.5/5 — wrong research subfield + missing core stack (experimentation, SQL, dbt, KPIs).

## Block B — North Star alignment

User archetypes from `_profile.md`: **DevOps / Platform / SRE / AI Infra / AI Researcher**.

This role is **product data science / applied stats** — the closest archetype is "AI Researcher", but:
- Glean's Applied Scientist sits in the **Data Org** (product DS + experimentation + BI), not ML research
- The work is A/B testing infrastructure, KPI design, eval frameworks for LLM features — adjacent but NOT the user's research direction (3D graphics, generative AI for content, HCI-XR)
- Zero overlap with DevOps/Infra archetypes
- Could be reframed as "AI evaluation engineering" but the JD heavily emphasizes statistical experimentation, not infra

**North Star alignment:** 2.0/5 — adjacent at best, no DevOps/Infra angle, research subfield is wrong.

## Block C — Comp

**JD range:** $175K–$230K base + variable + equity (Bay Area, hybrid 3-4 days).
**User target:** $160K–$210K (Fairfax VA baseline).

**Market context (Levels.fyi, Blind, H1B data):**
- Glean SWE Bay Area: $179K–$278K base, median TC $306K
- Senior/Staff Applied Scientist Bay Area at peer AI companies (Scale, Anthropic, OpenAI, Databricks): $200K–$280K base, $400K–$700K TC
- Glean H1B median 2025: $220K base; 75th: $240K

JD base ($175K–$230K) is **at market** for Senior level, **below market** for Staff level (Staff Applied Scientist Bay Area typically clears $250K base). With equity in a $7.2B private co. on aggressive growth, TC likely $350K–$500K+.

Above user's stated $160-210K target on base alone. **However**, Bay Area COL ~2x Fairfax — real purchasing power roughly equivalent to $110-145K in Fairfax. Hybrid SF Bay requires relocation.

**Comp score:** 4.0/5 (nominal); 3.0/5 (after Bay Area COL adjustment).

## Block D — Cultural signals

**Positives:**
- Series F at $7.2B (Jun 2025), $200M+ ARR, 1,500+ employees (Mar 2026), no layoffs found
- Recognized: Forbes AI 50, Fast Company Most Innovative Top 10 (2025), Bloomberg AI Startups (2026)
- Acquired Aryn (Mar 2026) — growth via M&A
- "AI-First Mindset" interview includes AI exercise — signals intellectual rigor expectation
- Strong product (Glean Search/Assistant/Agents) widely deployed in enterprise
- Open platform stance (no vendor lock-in)

**Negatives / Concerns:**
- 3-4 days/week hybrid in SF Bay — **non-negotiable on-site**. User is in Fairfax, VA. Requires cross-country relocation.
- Senior/Staff level — high seniority bar; Glean hires aggressively and selectively
- Data Org is new ("building a world-class Data Organization") — could be fluid, evolving scope
- High-velocity growth co. — long hours likely

**Cultural score:** 3.5/5 — strong company, but hybrid Bay Area is a major lifestyle constraint.

## Block E — Red flags

1. **Visa sponsorship:** User requires US sponsorship. JD does not state sponsorship policy. Glean has H1B history (2025 LCAs filed) — possible but uncertain. NEUTRAL signal; not auto-disclosed per profile.yml.
2. **Relocation:** Hybrid SF Bay = mandatory relocation from VA to CA. Major life decision.
3. **Experience floor:** "3+ years as PhD" — user is <1 year into PhD (started Aug 2025). Likely below bar.
4. **Domain mismatch:** PhD in 3D graphics / generative AI for content, not IR / NLP / ranking / experimentation. Glean would interview for stats-heavy product DS, where user has limited proof points.
5. **Stack gap:** No SQL/dbt/A/B platform experience — these are listed as required, not nice-to-have.

**Red-flag adjustment:** -1.0 (experience floor + domain mismatch + on-site relocation).

## Block F — Global Score

| Dimension | Weight | Score | Weighted |
|-----------|--------|-------|----------|
| Match con CV | 30% | 1.5 | 0.45 |
| North Star | 25% | 2.0 | 0.50 |
| Comp | 15% | 3.5 | 0.53 |
| Cultural | 15% | 3.5 | 0.53 |
| Red flags | 15% | 2.0 | 0.30 |
| **Global** | | | **2.31 → 2.4/5** |

**Recommendation:** **Do NOT apply.** Score below 3.5 threshold.

Three structural blockers: (1) wrong research subfield — graphics/HCI-XR PhD vs. IR/stats/experimentation Applied Scientist role; (2) experience floor (PhD <1 year, role wants 3+ years post-PhD or 5+ MS); (3) missing core stack (A/B platforms, SQL, dbt, B2B SaaS product DS, ranking). Even with strong Python and ML breadth, the role is statistics-and-experimentation-led, not infra/research-engineering. Mandatory hybrid relocation to SF Bay adds friction. Better-fit roles for this user: ML Platform / AI Infrastructure / DevOps at Glean (or peers) where production K8s/OpenShift + CI/CD experience plus AI research breadth matter more than statistical experimentation.

If user disagrees and wants to apply anyway: lead with Python + LLM eval angle, frame DCXR Lab work as "applied AI research with measurement rigor", and acknowledge the experimentation gap directly. But honestly — pass.

## Block G — Posting Legitimacy

**Tier:** High Confidence

| Signal | Observation |
|--------|-------------|
| Posting age | First published 2024-05-23, updated 2026-04-22 — long-standing evergreen req |
| Apply button | Active on Greenhouse (live API response 200) |
| Tech specificity | High — Python, SQL, dbt, A/B platforms, KPI design — concrete stack |
| Requirements realism | Realistic for Senior/Staff level at well-funded AI co. |
| Layoff news | None found for Glean in 2026; aggressive hiring posture (1,500+ employees, $200M ARR) |
| Reposting pattern | Long-running req (1.9 years live) — could be high-bar persistent search OR ghost. Glean's Data Org is new, growing fast — leaning legitimate. |
| Salary transparency | Yes, $175-230K disclosed (CA SB 1162 compliance) |
| Funding | Series F $150M at $7.2B valuation (Jun 2025) — strong runway |

**Legitimate evergreen senior req at a well-funded, high-growth AI company.** Long posting age is consistent with hard-to-fill Senior/Staff Applied Scientist niche, not ghost listing.

---

## Extracted Keywords

A/B experimentation, statistical inference, LLM evaluation, query intent classification, ranking, Python (source-controlled libraries), SQL, dbt, ETL/ELT, modern data stack, product KPIs, guardrail metrics, dashboarding, B2B SaaS, ML measurement, content summarization, multi-step reasoning, tool selection, evaluation set generation, PhD Statistics/Math/CS, Senior/Staff Applied Scientist, Palo Alto, San Francisco Bay Area, hybrid 3-4 days, Glean, enterprise AI search, Work AI platform, Series F, $7.2B valuation, Data Organization, product data science.
