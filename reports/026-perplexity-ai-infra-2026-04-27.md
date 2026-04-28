# 026 - Perplexity - Member of Technical Staff (AI Infrastructure Engineer)

**Date:** 2026-04-27
**Score:** 4.3/5
**URL:** https://jobs.ashbyhq.com/perplexity/598e1f7d-b802-4de2-99ac-90eb2bc33315
**PDF:** Not generated
**Legitimacy:** High Confidence
**Verification:** unconfirmed (batch mode — Ashby SPA returned minimal content via WebFetch; JD reconstructed from cached/cross-referenced sources)
**Archetype:** AI Infrastructure / ML Platform Engineer (primary) + AI Platform / LLMOps (secondary)

---

## Block A - Match con CV (4.5/5)

The role is a near-textbook match for the candidate's primary archetype. Perplexity wants someone fluent in Kubernetes administration, Slurm-based HPC scheduling, GPU cluster ops, Python/C++ infra automation, and PyTorch in distributed-training contexts. The candidate ships exactly that on paper:

- **Kubernetes / OpenShift at enterprise scale** (cv.md L23-24): "Architected and led a cross-team standardization of Kubernetes/OpenShift deployment dictionaries across 10+ service teams." Direct hit on "Expert-level Kubernetes administration and YAML configuration management."
- **CI/CD + automation discipline** (cv.md L26, L34): Gradle plugin for container image certification, GitHub Actions migration cutting manual release effort 85%. Maps to "container registries, image optimization, multi-stage builds for ML workloads."
- **Cloud + IaC** (cv.md L33): AWS migration with 80% cloud-spend reduction via right-sizing, autoscaling, serverless. Maps to "autoscaling strategies for dynamic workload demands" and the preferred Terraform/Ansible/GitOps stack.
- **Observability + RBAC** (cv.md L24-27): "Designed and rolled out Role-Based Access Control (RBAC) policies in OpenShift … partnered with SREs to improve deployment reliability and MTTR." Maps to "monitoring, alerting, and observability solutions tailored to ML workloads" and "respond swiftly to system outages."
- **AI/ML adjacency** (cv.md L73-74, L80): PyTorch, diffusion models, LLMs, generative-AI research at DCXR Lab. Not deep MLOps production, but the LLM-architecture vocabulary (Multi-Head/Grouped-Query Attention, distributed training strategies) is read-fluent thanks to PhD work.
- **Languages** (cv.md L79): Python and C++ both listed. Required for the role.

**Honest gaps:**
- **Slurm at scale** is the single biggest gap. Cv.md does not mention Slurm or HPC scheduling; the candidate's scheduler experience is K8s/OpenShift-native. Slurm is teachable for someone with K8s depth, but the JD asks for "Advanced Slurm administration including multi-cluster federation," which is a stretch.
- **GPU cluster ops + CUDA** are listed as preferred. The candidate uses PyTorch in research but has not run multi-node GPU training clusters in production.
- **3-5 years ML infra specifically.** The candidate has 4+ years total industry experience but it is DevOps/cloud-native rather than ML-systems-focused. The framing "former CTO + DevOps + AI/3D research" is the right pitch, but a hiring manager looking for someone who has shipped distributed-training ops will see this as a level-or-half-level reach.

## Block B - North Star Alignment (4.7/5)

This is **archetype #3 (AI Infrastructure / ML Platform Engineer)** from `_profile.md` — explicitly listed as a primary target in `config/profile.yml` (L19, L29-31). Perplexity is one of the most visible AI-native search companies in the market, the work is GPU-cluster + inference + training infra (exactly the "what they buy" line in the archetype table), and the role is at MTS — Perplexity's blanket title that maps to Senior/Staff equivalent at most companies. This is the kind of role the system is tuned to find. Hard to score higher unless it were also remote.

## Block C - Cultural Signals (4.4/5)

Strong positives, a few caveats:

- Perplexity is at $1.5B+ raised, ~$22B valuation, ~1,470 employees as of Mar 2026, ARR around $200M and growing 4-5x YoY. Not a coin flip — this is a category leader.
- Compensation rating 4.9/5 on Glassdoor. Median TC across the company $344K, SWE median $450K.
- $750M three-year Microsoft Azure GPU commitment (Jan 2026) means the infra team has real budget and a real multi-cloud surface to manage.
- Manhattan office expansion (Apr 2026) signals continued growth.

Caveats:
- The CEO's March 2026 comment framing AI-related layoffs as a "glorious future" is a culture flag worth noting — fast-moving, high-pressure, Silicon-Valley-AI-tempo. Not a deal-breaker, but expect long hours and high accountability.
- Subscription-first pivot (Feb 2026) is a strategic shift that adds business-model risk relative to a pure-search-with-ads narrative.

## Block D - Comp (4.5/5)

JD-stated cash range: **$190K-$250K** plus equity + comprehensive benefits + 401(k). Equity at a $22B private company with 4-5x revenue growth is the real lever — Levels.fyi shows SWE median $450K TC and a top reported package of $790K, with the bulk in stock.

Candidate target (`profile.yml` L62): $160K-$210K base, $160K minimum. The cash range comfortably exceeds the minimum and overlaps the target band; equity should push TC well past target. This is comp top-quartile vs. the SF AI-infra market reference points (NVIDIA Sr AI Infra L4: $168K-$270K base; Together AI Sr AI Infra: $160K-$230K base).

## Block E - Red Flags (-0.4)

- **Visa: NOT mentioned in JD.** Per `config/profile.yml` L74, sponsorship is required. Perplexity does sponsor at scale per public hiring patterns, but candidate must verify before applying. Treat as caution, not blocker.
- **Location: San Francisco / Palo Alto** with London also listed. Candidate is Fairfax, VA. Per `_profile.md` L94, hybrid outside the user's country scores 3.0; SF is in-country but still cross-coast — relocation is required. Per `profile.yml` L64, "Remote preferred, occasional on-site OK." This is the opposite of that preference.
- **Title-vs-experience reach.** MTS at Perplexity is Senior/Staff equivalent. Candidate has 4+ years industry but only 2.5y at Paychex in DevOps proper; the rest is CTO at a small studio + game dev + research. The CV is strong, but bar at Perplexity is high — expect a tough loop.
- **Slurm gap** (carried from Block A) — closable in interview prep, but answer "no, not Slurm specifically, but K8s + OpenShift scheduler equivalent" honestly.

## Block F - Global Score: 4.3/5

Strong recommend if the candidate is open to SF relocation and confirms visa sponsorship. The archetype fit is excellent, the company is a category leader with real budget, the comp clears target, and the gaps (Slurm, GPU cluster ops at scale) are interview-preppable rather than disqualifying. This is the kind of role to spend real prep time on rather than a fast batch apply.

## Block G - Posting Legitimacy: High Confidence

| Signal | Reading |
|--------|---------|
| Posting age | Active on Ashby + Greenhouse + LinkedIn + Built In + Welcome to the Jungle simultaneously. Recent. |
| Apply button | Direct Ashby application flow active. |
| Tech specificity | Very high — names exact stack (K8s, Slurm, Python, C++, PyTorch, AWS, multi-cluster federation). Not a generic ghost JD. |
| Requirements realism | Realistic. 3-5y experience band, named frameworks, named architectures (MHA/GQA). |
| Layoff news | None recent for Perplexity infra. CEO commentary on layoffs is industry-wide framing, not Perplexity-specific cuts. |
| Salary transparency | Yes, $190K-$250K disclosed. |
| Funding/runway | Series E + extensions = $1.5B+ raised, $22B valuation, $750M Azure commitment, 1,470 employees. Real company. |

No ghost-posting indicators. Recommend treating as an active, real opening.

---

## Recommendation

**Apply** — but invest in prep. Lead the pitch with: (1) production K8s/OpenShift at Paychex, (2) AWS migration with 80% cost reduction, (3) PyTorch + LLM literacy from DCXR Lab research. Acknowledge Slurm and GPU-cluster-at-scale as adjacent rather than direct experience and frame the K8s scheduler depth + research-side ML literacy as the bridge. Verify visa sponsorship policy before submitting. Confirm SF relocation is acceptable.

---

## Extracted Keywords

Kubernetes, Slurm, Python, C++, PyTorch, AWS, GPU clusters, distributed training, inference, LLM, Multi-Head Attention, Grouped-Query Attention, autoscaling, observability, monitoring, alerting, container orchestration, YAML, RBAC, networking, storage, compute resource management, APIs, CUDA, Terraform, Ansible, GitOps, container registries, image optimization, multi-stage builds, HPC, parallel computing, high-performance networking, SRE, DevOps, Platform Engineering, ML infrastructure, cluster federation, job scheduling, resource allocation, cluster optimization, batch workloads, real-time workloads, Kubernetes operators, custom controllers, MTS, Member of Technical Staff, AI Infrastructure Engineer, Perplexity, San Francisco, Palo Alto.
