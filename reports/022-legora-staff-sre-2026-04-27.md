# Legora — Staff Site Reliability Engineer

**Score:** 2.6/5
**URL:** https://jobs.ashbyhq.com/legora/c7a8d50e-c7f9-4a65-984d-dfa9239335e7
**PDF:** ❌ (below threshold — do not generate)
**Legitimacy:** High Confidence
**Verification:** unconfirmed (batch mode — Ashby renders client-side, JD pulled via WebSearch of cached Accel/Ashby boards)
**Date:** 2026-04-27
**Archetype:** SRE (primary)
**Cross-ref:** No prior Legora report exists in this codebase (no #021-legora-* file). NYC SRE-family postings at Legora include Site Reliability Engineer (NYC, founding team) and Senior Site Reliability Engineer (Stockholm). Staff is the leveled-up bar of the same NYC founding cohort.

---

## Block A — Match con CV (2.5/5)

**JD signal vs CV evidence:**

| JD requirement | Candidate fit |
|----------------|---------------|
| Staff seniority — typically 8+ yrs SRE/production ops, lead-without-managing, sets reliability bar across org | Candidate has ~2.5 yrs DevOps at Paychex + ~1 yr CTO + ~1 yr SE = ~4–5 yrs blended industry. **Material seniority gap** for Staff. |
| "Significant experience operating and improving production systems, debugging under pressure, preventing repeat incidents" | Partial. CV cites K8s/OpenShift platform standardization across 10+ teams and partnering with SREs on MTTR — but no direct on-call ownership or incident-command experience. |
| Build/maintain observability stack (metrics, logs, traces) — high signal, low noise | Weak. CV mentions observability "best practices" generically; no Prometheus/Grafana/OpenTelemetry/Datadog tool depth, no SLI/SLO instrumentation evidence. |
| SLI/SLO definition, alerting, reliability reporting | Gap. Not in CV. |
| On-call rotations, post-incident follow-ups, preventive fixes | Gap. Not demonstrated. |
| Cloud infrastructure + Kubernetes | Strong. AWS migration (80% cost cut), production K8s/OpenShift at Paychex, Terraform in skills, Helm. |
| Automation to reduce toil + developer-facing tooling | Strong. Gradle plugin for image certification (-10% opex), TLS cert lifecycle (100% downtime elim), CI/CD with GitHub Actions (-85% manual effort). |
| Software/automation skills (Go/Python likely) | Decent. Python + Go listed; Java/TypeScript real production. Go depth unclear. |
| Systems thinking — failure modes, graceful degradation, tradeoffs | Reasonable for senior level; not yet demonstrated at Staff scope. |

**Bottom line:** Candidate's CI/CD + platform automation story maps cleanly to a Senior SRE / Platform role. The Staff-level expectations (own critical services end-to-end, set the reliability bar across the engineering org, mentor a founding SRE team, deep on-call/incident leadership) are a stretch at ~4–5 yrs blended infra time. Even with PhD + CTO blend, the SRE-specific track record is too thin for Staff.

---

## Block B — North Star Alignment (3.5/5)

- SRE is a **primary archetype** per `_profile.md` and `profile.yml` (`Site Reliability Engineer` listed at Mid-Senior/Senior).
- The function (observability, automation, K8s, cloud) is core fit; the **level (Staff)** is the misalignment.
- Legora is **legal-tech AI workspace**, which is adjacent to user's AI/ML interests but not the primary AI Infra/ML Platform target.
- Founding SRE team in NYC is a high-impact greenfield opportunity, which is attractive — but typically demands proven Staff-track signal.

---

## Block C — Comp (3.5/5)

- No salary disclosed in posting (Ashby-hosted, no NYC pay-transparency text in cached snapshots).
- NYC Staff SRE market band (Built In + Glassdoor + Levels): **$220K–$310K+ TC**, with base typically $190K–$260K + equity at growth-stage startups.
- Legora ($5.55B valuation, Series D, March 2026) is in the band where Staff equity grants are meaningful but lower-multiple than pre-Series-B.
- Candidate's target ($160K–$210K) sits **below** the likely Staff band, so if hired the offer would clear target — but the leveling concern means the role may be down-leveled to Senior in the loop.

---

## Block D — Cultural Signals (3.0/5)

**Positives:**
- Series D, $5.55B valuation, fast-growing legal-AI category leader vs. Harvey.
- Trusted by Cleary Gottlieb, Goodwin, Linklaters, Bird & Bird — enterprise legal credibility.
- Founding NYC SRE team = greenfield, high autonomy, direct platform impact.
- Engineering team grew from 100 (May 2025) to ~370–400 (March 2026); active hiring across U.S. hubs.

**Negatives / Watch-outs:**
- **5-day in-office, NYC.** No remote, no hybrid. Candidate is in Fairfax, VA → relocation required.
- Hyper-growth pace post-Series-D will mean heavy on-call load and long hours during scale-out.
- Founding-team status = expectation of Staff bar from day one (no ramp).
- AI-legal-tech vs. Harvey arms race may pressure delivery cadence.

---

## Block E — Red Flags (-0.4)

| Flag | Severity | Note |
|------|----------|------|
| Staff seniority bar vs. ~4–5 yrs blended | High | Likely down-level or pass at recruiter screen. PhD does not substitute for Staff-SRE on-call/incident leadership. |
| 5-day in-office NYC, no remote/hybrid | High | Relocation Fairfax → NYC required; cost-of-living + uprooting tradeoff. |
| **Visa sponsorship policy unstated** | Medium | Candidate requires US sponsorship. Ashby JD did not surface a sponsorship line. Internally-flagged risk; do not auto-disclose in any candidate-facing content per profile.yml. |
| No salary band disclosed | Low | NYC pay transparency law applies — band typically appears on the live page; not visible in our cached fetch. |
| On-call expectation at founding-team Staff scope | Medium | First-responder + setting incident-management practices. CV does not show prior on-call ownership. |

---

## Block F — Global (2.6/5)

Weighted: A (2.5) heavy + B (3.5) + C (3.5) + D (3.0) − E (0.4) → **2.6/5**.

**Recommendation: DO NOT APPLY** to the Staff posting. Score < 3.5 per system rules.

**Better path:** Apply instead to Legora's **Site Reliability Engineer (NYC)** — the founding-team peer role at the appropriate level, where the JD explicitly says "alongside senior engineers" (i.e., not yet Staff-leveled). Same team, same impact surface, realistic level fit. If the user has strong reason to engage Legora, that is the door.

---

## Block G — Posting Legitimacy (High Confidence)

| Signal | Observation |
|--------|-------------|
| Posting age | Recent — Legora is actively expanding NYC engineering hub post-Series-D (March 2026). |
| Apply button active | Ashby URL is reachable; standard ATS path. |
| Tech specificity | Moderate — focuses on observability, SLI/SLO, on-call, cloud + K8s. Light on tool names but consistent across NYC/Stockholm SRE postings (suggests genuine team need, not boilerplate). |
| Requirements realism | Realistic for Staff at a Series-D scale-up. No contradictions. |
| Recent layoff news | None. Company is in expansion mode. |
| Reposting pattern | Not in scan-history.tsv as repeat. |
| Salary transparency | Missing from cached fetch — likely present on live page (NYC law). |
| Role-company fit | Strong — Series-D legal-AI building NYC engineering hub legitimately needs founding SRE Staff lead. |

**Tier:** High Confidence. This is a real, active opening.

---

## Extracted Keywords

`Site Reliability Engineer` `Staff` `production systems` `observability` `metrics` `logs` `traces` `SLI` `SLO` `incident response` `on-call` `post-incident` `automation` `developer tooling` `cloud infrastructure` `Kubernetes` `reliability` `failure modes` `graceful degradation` `Foundations` `founding team` `NYC` `5-day in-office` `legal AI` `AI-native workspace`

---

## Honest Gaps Summary

1. **Seniority gap:** Staff = 8+ yrs typical; candidate has ~4–5 yrs blended. PhD + CTO blend bridges *partway* (technical leadership, system design) but not the SRE-specific incident/on-call/SLO ownership that defines Staff.
2. **Observability tooling depth:** No demonstrated Prometheus/Grafana/Datadog/OpenTelemetry instrumentation; SLO definition not in CV.
3. **On-call experience:** No first-responder track record in CV.
4. **Geography:** Fairfax VA → NYC 5-day relocation, no remote.
5. **Visa:** Candidate requires sponsorship; posting silent (do not auto-disclose).

## If user insists on engaging Legora

- Pivot to the **Site Reliability Engineer (NYC, non-Staff)** posting on Accel/Ashby. That level matches the CV and preserves access to the founding NYC SRE team.
- Lead with: 80% AWS cost reduction (CTO), 100% TLS-cert downtime elimination + 10% opex reduction (Paychex), K8s/OpenShift platform standardization across 10+ teams.
- Address gap honestly in cover note: framing as "Senior SRE coming in to grow into Staff scope" is more credible than applying directly at Staff.
