# Legora — Senior Site Reliability Engineer

**Company:** Legora AB
**Role:** Senior Site Reliability Engineer
**Location:** New York City, NY (on-site / hybrid expected)
**Date:** 2026-04-27
**Score:** 3.7/5
**URL:** https://jobs.ashbyhq.com/legora/04f2f382-7760-4f42-a7da-f85ae8de8a62
**PDF:** ❌
**Legitimacy:** High Confidence
**Verification:** unconfirmed (Ashby JD content minimal via WebFetch; no Playwright)
**Archetype:** SRE (primary) / AI Platform-LLMOps (secondary)

---

## Block A — Match con CV

**Score: 4.0/5**

Strong archetype alignment with the candidate's primary SRE / DevOps target.

CV evidence (cv.md):
- "Architected and led a cross-team standardization of Kubernetes/OpenShift deployment dictionaries across 10+ service teams" (cv.md:23) — direct match for SRE platform-standardization scope.
- "Designed and rolled out Role-Based Access Control (RBAC) policies in OpenShift" (cv.md:24) — security/reliability hardening.
- "Automated end-to-end TLS certificate lifecycle management… reducing certificate-expiration-related downtime by 100%" (cv.md:25) — quintessential SRE proof point (toil elimination + reliability metric).
- "Built a Gradle plugin for container image certification… lowered operational expenses by 10% annually" (cv.md:26) — CI/CD platform work.
- "Championed infrastructure-as-code and observability best practices; partnered with SREs to improve deployment reliability and mean time to recovery (MTTR)" (cv.md:27) — explicit SRE collaboration with MTTR vocabulary.
- Skills line (cv.md:82): "AWS, Kubernetes, OpenShift, Docker, Terraform, CI/CD, GitHub Actions, Jenkins, Gradle, Maven, Helm, Observability" — covers the standard SRE toolchain.
- 2.5 years at Paychex (Feb 2023 – Aug 2025) is enterprise-grade DevOps but the title is "DevOps Engineer," not "SRE." Functionally adjacent (RBAC, IaC, MTTR, cert automation), but the resume bullet says "partnered with SREs," which a careful reviewer will read as adjacency, not ownership of an SLO/error-budget program.

Gaps vs typical Senior SRE bar:
- No explicit SLO/SLI/error-budget ownership in CV.
- No on-call rotation / incident-commander language.
- No production observability stack named (Prometheus, Grafana, Datadog, OpenTelemetry).
- "Senior" SRE at a Series B → D legal-AI scale-up usually expects 5+ years pure SRE; candidate has ~4 years total industry, ~2.5 in DevOps + CTO time. Title-level slightly stretched but plausible given depth.

PhD + former-CTO breadth is a positive differentiator but does not directly substitute for SLO/on-call experience.

---

## Block B — North Star Alignment

**Score: 4.5/5**

SRE is listed as a `primary` archetype in `config/profile.yml` and called out in `modes/_profile.md` ("Uptime track record, incident response, observability stack, SLO frameworks"). Legora is an AI-native legal workspace, so the role also touches the AI Platform / LLMOps archetype (eval-style telemetry, model-serving reliability). Two primary archetypes overlapping in one role is exactly the target zone.

The "Infrastructure builder with automation mindset" framing from `_profile.md` maps cleanly to Legora's growth-phase reliability needs (60M → 600+ clients, 100 → 400 employees in <12 months — they need someone who can build the SRE function, not just operate it).

---

## Block C — Compensation

**Score: 3.5/5**

JD does not disclose comp (Ashby/NY pay-transparency law typically requires it for NYC postings — mild concern, but the site stub may have been incomplete via WebFetch). Market data:

- NYC Senior SRE base: ~$165K–$220K (Robert Half, Glassdoor 2026).
- NYC Senior SRE total comp: ~$190K–$260K; top of market $270K+ (Built In, ZipRecruiter 2026).
- Legal-tech sector tracks SaaS more than fintech/FAANG. Well-funded scale-ups (Series D, $5.5B valuation) typically pay near or at the high end of the SaaS band with meaningful equity.

Candidate target is `$160K–$210K` (profile.yml). NYC Senior SRE comp at a $5.5B scale-up should land in or above the candidate's range — probably $190K–$240K base + equity. Score 3.5 (not 4.0) because the JD itself is opaque on numbers; once the recruiter shares the band, this likely moves to 4.0+.

---

## Block D — Cultural Signals

**Score: 4.0/5**

Strong positive signals:
- Series B ($80M, May 2025) → Series C ($150M, Oct 2025) → Series D ($550M, Mar 2026) at $5.5B valuation. Three rounds in <12 months = exceptional traction, well-capitalized.
- 100 → 371+ employees in ~12 months. Hiring velocity matches funding.
- Backers: ICONIQ, General Catalyst, Bessemer, Benchmark, Redpoint, Y Combinator. Top-tier signal.
- Customers: Cleary Gottlieb, Goodwin, Linklaters, Bird & Bird across 40+ countries. Real revenue, real reliability stakes (legal data → SOC 2 / ISO 27001 territory, certificate lifecycle automation directly relevant).
- NY office opened April 2025 — still <18 months old, so a "Senior SRE" hire likely shapes the function rather than slotting into a mature playbook. Good for someone with CTO breadth.

Caution flags:
- Hyper-growth scale-ups often run hot — on-call load, scope creep, ambiguity. Ask in interview.
- Stockholm HQ + NY satellite means async overlap; some role coordination from EU.

---

## Block E — Red Flags

**Score: 3.5/5** (deduction-style: lower = more flags)

| Flag | Severity | Notes |
|------|----------|-------|
| Visa sponsorship | High | profile.yml: "Requires US sponsorship." Series D legal-tech scale-ups often sponsor for senior eng roles, but NOT confirmed for this listing. **Must ask before applying.** |
| Relocation NYC ← Fairfax VA | Medium | Candidate is in Fairfax, VA. Legora NY is on-site/hybrid; relocation cost + life disruption is real. Negotiate relocation package. |
| JD content not retrievable | Medium | Ashby SPA returned only title via WebFetch. Cannot verify exact tech stack, team size, or comp. Recommend Playwright re-fetch or recruiter call before applying. |
| Title-level stretch | Low-Medium | "Senior SRE" with 2.5y DevOps + CTO + PhD; candidate has the depth, but pure-SRE years are short. Frame around platform-engineering scope, not "Senior SRE since 20XX." |
| No on-call signal in CV | Low | Need to be ready to discuss on-call willingness and incident-response examples in interview. |

No layoff news, no ghost-posting indicators, no contradictory requirements surfaced.

---

## Block F — Global Score

**Weighted: 3.7/5**

Reasoning:
- Match (4.0) and North Star (4.5) are strong: SRE is a primary archetype and Legora's stack/scale is exactly the target environment.
- Comp (3.5) is provisional pending recruiter band; likely upgrades.
- Culture (4.0) is excellent — Series D at $5.5B with top-tier investors.
- Red flags (3.5) drag the global down: visa is the load-bearing concern, and NYC relocation from VA is non-trivial.

**Recommendation:** Borderline apply. Score crosses the 3.5 threshold but does not clear the 4.0 "good match" bar. Apply ONLY if: (a) candidate is open to NYC relocation, (b) Legora confirms visa sponsorship for this role, and (c) recruiter shares a comp band ≥ $190K base. If any of those three fail, SKIP.

---

## Block G — Posting Legitimacy

**Tier: High Confidence**

| Signal | Observation |
|--------|-------------|
| Posting age | Unknown (Ashby JD body not retrievable via WebFetch); URL is a current Ashby slug, not archived. |
| Apply button | Ashby standard apply flow expected (not directly verified — no Playwright per task rules). |
| Tech specificity | Could not assess (JD body empty in fetch). |
| Requirements realism | N/A (body empty). |
| Recent layoffs | None found. Opposite — three funding rounds and aggressive hiring through April 2026. |
| Reposting pattern | Not in scan-history.tsv. |
| Company status | Series D, $5.5B valuation March 2026. Multiple acquisitions (Qura April 2026, Walter for North America). NY office opened April 2025; SRE hire there is structurally consistent. |
| Role-company fit | Strong. Legal-AI workspace serving 600+ firms in 40+ countries genuinely needs SRE depth (uptime SLAs, data residency, cert lifecycle, RBAC). |

Despite the empty WebFetch body, the company-level signals are overwhelmingly legitimate. The empty body is most likely an Ashby SPA-rendering quirk, not a ghost posting.

---

## Extracted Keywords

**From role / company context (JD body unavailable, inferred from archetype + company stack signals):**

- Site Reliability Engineering, SRE, on-call, incident response, MTTR, SLO, SLI, error budget
- Kubernetes, container orchestration, Helm, Docker
- AWS (likely; some legal-tech also runs Azure due to MS 365 / Word integration)
- Terraform, infrastructure as code, GitOps
- CI/CD, GitHub Actions
- Observability, Prometheus, Grafana, Datadog, OpenTelemetry, logging, tracing
- RBAC, security hardening, SOC 2, ISO 27001, certificate lifecycle, TLS automation
- Postgres, distributed systems, high availability
- AI workspace, LLM serving, model inference reliability, eval pipelines
- Legal-tech, document management integration (iManage, SharePoint), Microsoft Word add-in
- NYC, on-site / hybrid, scale-up, Series D
- Stockholm HQ, EU/US async collaboration

**Candidate match keywords (from cv.md):**
OpenShift, Kubernetes, AWS, RBAC, Terraform, Helm, CI/CD, GitHub Actions, Jenkins, Gradle, Observability, MTTR, IaC, certificate lifecycle automation, microservices, distributed systems, high availability, Python, Go, Bash.

**Likely gaps to address in cover letter / interview:**
SLO/error-budget ownership, named observability stack, on-call rotation experience, legal-tech / regulated-data domain familiarity.
