# Deep Research: Perplexity — AI Infrastructure MTS

**Date:** 2026-04-28
**Source report:** reports/026-perplexity-ai-infra-2026-04-27.md
**Researcher:** career-ops deep mode (run by Claude)
**Confidence:** Mixed — High for product, infra architecture, funding, public engineering posts; Mixed for specific MTS comp bands (Levels.fyi shows aggregated SWE data, not level-specific MTS); Mixed for engineering culture (44 Glassdoor reviews + Blind anecdotes, generally consistent themes).

---

## 1. AI Strategy & Stack

### Product Surface
Perplexity now ships a multi-product stack, not just an answer engine:
- **Pro Search / Deep Research** — citation-backed answer engine; Deep Research returns reports in 2-4 minutes ([Felloai 2026 comparison](https://felloai.com/ai-search-deep-research-comparison/))
- **Comet Browser** — AI-native Chromium browser. Released Win/macOS Jul 9 2025, Android Nov 20 2025, iOS Mar 18 2026. Free download since Oct 2025 ([Wikipedia: Comet (browser)](https://en.wikipedia.org/wiki/Comet_(browser)))
- **Comet Enterprise** — silent MDM deploy, hundreds of policies, Crowdstrike security partnership; data not used for training ([gHacks Mar 2026](https://www.ghacks.net/2026/03/20/perplexitys-ai-browser-comet-launches-on-iphone-with-built-in-assistant/))
- **Computer / agentic tools** — Feb 2026 launch of agentic AI agent product, drove ARR jump ([buildfastwithai.com](https://www.buildfastwithai.com/blogs/what-is-perplexity-computer))
- **Sonar API** — developer-facing search API on `sonar` and `sonar-pro` endpoints, fine-tuned Llama derivatives ([RankStudio LLM tech stack](https://rankstudio.net/articles/en/perplexity-llm-tech-stack))
- **Spaces, Pages, Discover, Finance** — supporting product surfaces

### Models
Multi-model routing system, not single-vendor:
- **Sonar (in-house)** — built on Llama 3.3 70B, fine-tuned for RAG / citation style; default for free + Pro ([glbgpt.com 2026 model breakdown](https://www.glbgpt.com/hub/what-llm-does-perplexity-use/))
- **Anthropic** — Claude Sonnet 4.6 / Opus 4.6 (Opus 4.6 is now the *default* Comet browser-agent model) ([Perplexity changelog/help center](https://www.perplexity.ai/help-center/en/articles/10354919-what-advanced-ai-models-are-included-in-my-subscription))
- **OpenAI** — GPT-5 / GPT-5.2 for reasoning + coding
- **Google** — Gemini 2.5 Pro / 3 Pro for multimodal
- **xAI** — Grok 4.1; **Meta** — Llama variants; **Moonshot** — Kimi K2
- Routing is intent-aware: search vs reasoning vs coding vs creative

### Inference Infrastructure (the meat of the role)
This is what an AI Infra MTS would actually own:

- **ROSE** — custom Perplexity inference engine. Python + PyTorch core; performance-critical paths (serving logic, batch scheduling) being **migrated to Rust** ([ByteByteGo: How Perplexity Built an AI Google](https://blog.bytebytego.com/p/how-perplexity-built-an-ai-google))
- **Disaggregated prefill / decode** — Perplexity's own engineering blog (Aug 2025) describes splitting prefill and decode onto separate GPU pools with a custom **KV messenger** built on libfabric over RDMA (EFA + ConnectX NICs). They explicitly handle Sonar's structured-output speculative decoding by skipping the last-token sample on prefill nodes ([Perplexity blog: Disaggregated Prefill and Decode](https://www.perplexity.ai/hub/blog/disaggregated-prefill-and-decode); [research.perplexity.ai mirror](https://research.perplexity.ai/articles/disaggregated-prefill-and-decode))
- **NVIDIA Triton + TensorRT-LLM** — collaborating directly with NVIDIA Triton team on disaggregated serving ([NVIDIA spotlight: 400M queries/month](https://developer.nvidia.com/blog/spotlight-perplexity-ai-serves-400-million-search-queries-a-month-using-nvidia-inference-stack/))
- **Custom Kubernetes scheduler** — front-end scheduler in Perplexity's Kubernetes cluster routes traffic by load + sequence-length variance; tuned for tail-latency percentiles ([NVIDIA spotlight](https://developer.nvidia.com/blog/spotlight-perplexity-ai-serves-400-million-search-queries-a-month-using-nvidia-inference-stack/))
- **Tensor parallelism** for Llama 8B / 70B / 405B; smaller models (<1B embeddings) packed concurrently per H100 for utilization
- **Latency wins** — pplx-api up to 3.1x lower overall latency, 4.3x lower TTFT vs other deployment platforms; cost down ~4x ($0.62M/year saved on a single feature) vs external APIs ([Perplexity hub: pplx-api](https://www.perplexity.ai/hub/blog/introducing-pplx-api))
- **Training** — Amazon SageMaker HyperPod, distributed libraries at >1,600 Gbps interconnect, auto-checkpointing ([AWS Perplexity case study](https://aws.amazon.com/solutions/case-studies/perplexity-case-study/))

### Cloud / Multi-cloud
- **AWS** — primary historical home; pplx-api on EC2 P4d (A100) → P5 (H100); SageMaker HyperPod for training ([AWS case study](https://aws.amazon.com/solutions/case-studies/perplexity-case-study/))
- **Microsoft Azure** — $750M three-year commitment (Jan 2026) for Deep Research + Model Council GPU capacity ([Wikipedia: Perplexity AI](https://en.wikipedia.org/wiki/Perplexity_AI))
- **CoreWeave** — multi-year strategic agreement (Mar 2026) for next-gen inference on **GB200 NVL72 clusters via CoreWeave Kubernetes Service**, plus W&B Models for train→prod ([CoreWeave investor news](https://investors.coreweave.com/news/news-details/2026/CoreWeave-Announces-Agreement-to-Power-Perplexitys-AI-Inference-Workloads/default.aspx); [Axios Mar 4 2026](https://www.axios.com/2026/03/04/perplexity-coreweave-data-center-nvidia))
- **Crawl/index scale** — 200B+ unique URLs, tens of thousands of CPUs, 400+ PB hot storage ([ByteByteGo](https://blog.bytebytego.com/p/how-perplexity-built-an-ai-google))

### Open Source
GitHub orgs `perplexityai` + `ppl-ai`. Active repos:
- **pplx-garden** — "Perplexity open source garden for inference technology"; requires `SYS_PTRACE/SYS_ADMIN` Linux caps for `pidfd_getfd`, RDMA + GPUDirect ([github.com/perplexityai/pplx-garden](https://github.com/perplexityai/pplx-garden))
- **pplx-rs** — Rust API client (Mar 2026)
- **pgcat** — Rust, MIT, updated Apr 2026
- **search_evals** — Python eval framework for search APIs, 210 stars (Feb 2026)
- **uvloop fork**, **news-pulse**, **python-sdk** ([github.com/perplexityai](https://github.com/perplexityai); [github.com/ppl-ai](https://github.com/ppl-ai))

---

## 2. Recent Moves (Last 6 Months)

### Funding & Valuation
- **~$22.6B valuation** as of Jan 09 2026 (Tracxn); **$1.72B raised** across 11 rounds, 56 investors ([Tracxn 2026 profile](https://tracxn.com/d/companies/perplexity/__V2BE-5ihMWJ1hNb2_u1W7Gry25JzPFCBg-iNWi94XI8/funding-and-investors))
- Sep 2025: $200M at $20B valuation ([TechCrunch Sep 2025](https://techcrunch.com/2025/09/10/perplexity-reportedly-raised-200m-at-20b-valuation/))
- Investors include Accel, IVP, SoftBank Vision Fund 2, Nvidia, Jeff Bezos
- ARR trajectory: $80M (late 2024) → $200M (Feb 2026) → $450M (Mar 2026) → **$500M (Apr 2026, +335% YoY)** ([Sacra](https://sacra.com/c/perplexity/))

### Headcount
- **~1,472 employees Mar 31 2026 (~1,600 mentioned)** vs 38 in 2023, 60 in 2024, 700 mid-2025 — ~25x growth in ~30 months ([trueup.io profile](https://www.trueup.io/co/perplexity-ai))
- 78 open job reqs; explicit AI Inference Engineer roles in London + Engineering Manager AI Products in SF ([Perplexity Careers](https://www.perplexity.ai/hub/careers))
- Hires drawn from OpenAI, Meta, DeepMind, academia ([secondtalent.com](https://www.secondtalent.com/resources/perplexity-ai-features/))
- *No specific named "VP Eng / AI Infra" hire surfaced in public press in the last 6 months* [unverified]

### GPU / Cloud Commitments
- **Microsoft Azure $750M / 3-year** (Jan 2026)
- **CoreWeave multi-year deal** (Mar 2026) — GB200 NVL72, CoreWeave Kubernetes Service
- Indicates explicit **multi-cloud strategy** (AWS + Azure + CoreWeave + on-prem-style dedicated clusters)

### Product / Strategy Shifts
- **Feb 2026 — subscription-first pivot**, killing AI-integrated ads to "preserve user trust" ([Wikipedia](https://en.wikipedia.org/wiki/Perplexity_AI))
- **Feb 2026 — "Computer" agentic agent launch** drove the ARR jump
- **Mar 2026 — Comet iOS launch** (delayed from Mar 11 to Mar 20)
- **Apr 2026 — Manhattan office expansion** noted in source report
- Office geos: SF (HQ), Palo Alto, NYC, Austin, DC, London, Berlin, Belgrade ([Perplexity Careers](https://www.perplexity.ai/hub/careers))

### Controversies / Press
- **BBC legal threat (Jun 2025)** — copyright + reproduction of articles verbatim; Perplexity responded calling claims "manipulative and opportunistic" ([eWeek](https://www.eweek.com/news/bbc-legal-notice-perplexity-ai-copyright-infringement/); [Technology Magazine](https://technologymagazine.com/news/bbc-vs-perplexity-legal-showdown-looms-over-ai-content-use))
- **News Corp lawsuit (Oct 2024)** — WSJ + NY Post, "massive freeriding"
- **Nikkei + Asahi Shimbun (Aug 2025)** — Japan, ¥2.2B each, ignoring robots.txt allegations ([Fortune](https://fortune.com/2025/08/26/perplexity-lawsuits-publishers-ai-search-nikkei-news-corp/))
- **CometJacking** — LayerX Security disclosed personal-data exfiltration vector (Aug 2025) ([Wikipedia: Comet](https://en.wikipedia.org/wiki/Comet_(browser)))
- **Mitigation:** $42.5M publisher revenue-share via Comet Plus; existing deals with Time, Fortune, Der Spiegel ([Fortune](https://fortune.com/2025/08/26/perplexity-lawsuits-publishers-ai-search-nikkei-news-corp/))
- **CEO comment (Mar 2026)** framing AI layoffs as "glorious future" — culture-tone signal flagged in source report

---

## 3. Engineering Culture

Based on Glassdoor (44 reviews, 4.6/5), Blind, and aggregated company reviews:

### What employees consistently praise
- **Talent density** — "Every full-stack engineer is super talented technically with great work experience and schools. Honestly a bit intimidating" ([Glassdoor: Growing pains but great people](https://www.glassdoor.com/Reviews/Employee-Review-Perplexity-AI-E8515634-RVW98165246.htm))
- **Per-engineer impact** — "When you push code at Perplexity, millions of people use it that same week" ([jobsbyculture](https://jobsbyculture.com/blog/working-at-perplexity-2026))
- **Flat, meritocratic, low politics** — best-idea-wins
- **CEO approval ~95%** for Aravind Srinivas, described as "deeply technical and highly accessible"
- **Sub-scores:** Culture 4.8, Comp 4.5-4.9, Senior Mgmt 4.5, Career 4.2, **Work-Life Balance 3.3** ([Glassdoor overview](https://www.glassdoor.com/Overview/Working-at-Perplexity-AI-EI_IE8515634.11,24.htm))

### What employees flag as risks
- **Long hours, weekend pings** — "It's definitely not your 9 to 5. You will be pinged after going home and over weekends sometimes." ([Glassdoor long-hour reviews](https://www.glassdoor.com/Reviews/Perplexity-AI-long-hour-Reviews-EI_IE8515634.0,13_KH14,23.htm))
- **Hire fast, fire fast** — "aggressively filters for top performers… low tolerance for mistakes"
- **Mentorship gap** — "extremely senior engineers have fewer mentorship options unless they want to move into management"
- **Scope creep / pivots** — described as both AI-industry-wide and Perplexity-specific
- **Critical reviews** — at least one Glassdoor review explicitly says "Don't work here" citing leadership empathy gaps and sudden firings

### Stack & shipping signals (from blogs + job posts)
- **Languages:** Python primary; **Rust** rising for performance-critical inference paths; C++ for kernel-adjacent; Go shows up in some infra roles
- **Ship cadence:** "features go from idea to production in days, not quarters"
- **Interview language preference: Python** ([linkjob.ai 2026 interview](https://www.linkjob.ai/interview-questions/perplexity-ai-interview/))

### RTO Policy
- **4 days/week in-office** for in-person team members per official Perplexity Careers page ([Perplexity Careers](https://www.perplexity.ai/hub/careers))
- "Apply to the role that matches your timezone" — they decide office assignment in onboarding
- Effectively NOT remote-friendly for SF infra roles (older third-party sources still call it "remote-first" — that data is stale)

### MTS Seniority Bar
- MTS at Perplexity is the blanket IC title. Per Glassdoor reviews, hiring profiles cluster as: (1) former founders, (2) Facebook L6+ equivalent senior ICs, (3) "hard-working young people" ([jobsbyculture.com](https://jobsbyculture.com/blog/working-at-perplexity-2026))
- Interview difficulty 3.31/5; positive experience rating 38.5%; avg loop ~23 days ([Glassdoor interview Q's](https://www.glassdoor.com/Interview/Perplexity-AI-Interview-Questions-E8515634.htm))
- Loop: recruiter screen (45 min) → take-home or OA (~2-4h) → 4-6 deep-dive rounds (system design, model design, retrieval, coding, behavioral) → final with manager / CTO

---

## 4. Likely Challenges (Probable Interview Topics)

These are real problems Perplexity is actively navigating right now — perfect interview fodder:

1. **Tail-latency optimization at 1B+ queries/month** — Perplexity's own custom K8s scheduler exists *because* default scheduling can't hold tail-latency SLAs across variable sequence lengths. Expect a system-design Q on "given a fleet of GPU pods serving requests with 100x variance in input length, how do you route?" ([NVIDIA spotlight](https://developer.nvidia.com/blog/spotlight-perplexity-ai-serves-400-million-search-queries-a-month-using-nvidia-inference-stack/))

2. **Disaggregated prefill/decode tradeoffs** — KV cache transfer over RDMA, prefill-decode pool sizing, speculative decoding interaction. Their own blog post is the cheat sheet. ([Perplexity disaggregated post](https://www.perplexity.ai/hub/blog/disaggregated-prefill-and-decode))

3. **Multi-cloud GPU operations** — AWS + Azure + CoreWeave + multiple GPU SKUs (A100, H100, GB200). Expect questions on workload placement, capacity planning, failover

4. **Cost-per-token economics** — A/B testing, batching strategy, GPU utilization vs SLA tradeoffs, when to disaggregate vs co-locate

5. **Slurm vs K8s for hybrid train/inference** — their pattern is HyperPod for training + K8s for inference; the new MTS JD explicitly mentions Slurm multi-cluster federation, suggesting they may be **migrating training off SageMaker** or building a **Slurm tier for research training** that pairs with K8s inference ([SkyPilot blog: Slurm vs K8s](https://blog.skypilot.co/slurm-vs-k8s/))

6. **Speculative decoding at production scale** — Sonar's structured outputs complicate speculative decoding; their work-around is documented but it's a real engineering problem

7. **Reliability under partner risk** — multi-cloud means dependencies on AWS, Azure, CoreWeave, NVIDIA, Triton releases. Expect "tell me about a time you handled an upstream partner outage" behavioral

8. **Eng-side pain from reviews** — pivots / scope creep; building reliable infra under shifting product targets is implied table-stakes here

---

## 5. Competitors & Differentiation

### Competitive landscape (Q1 2026)
| Player | AI search market share Jan 2026 | Position |
|---|---|---|
| ChatGPT (OpenAI) | **60.7%** | Dominant; "build to create" |
| Google Gemini / AI Overviews | 15.0% | Bundled into search; AI Overviews in 18% of all searches, 57% of long-tail |
| Microsoft Copilot | 13.2% | Enterprise-distributed |
| **Perplexity** | **5.8%** | Citation-first; technical-buyer favorite |
| Claude (Anthropic) | 4.1% | Chat-focused |
| Others (You.com, Brave, Kagi) | <1% each | Niche |

Source: [GrowthOS comparison](https://www.usegrowthos.com/blog/google-ai-overviews-vs-chatgpt-vs-perplexity), [Sedestral 2026 market share](https://sedestral.com/en/blog/ai-search-market-share-2026)

### Perplexity's moat / differentiation
- **Citation-first product DNA** — every claim links to a source. Reddit is 46.7% of citations vs ChatGPT 47.9% Wikipedia ([averi.ai citation benchmark](https://www.averi.ai/how-to/chatgpt-vs.-perplexity-vs.-google-ai-mode-the-b2b-saas-citation-benchmarks-report-(2026)))
- **Speed of Deep Research** — 2-4 min reports vs ChatGPT's 30-min Deep Research; bias toward faster answers ([Felloai](https://felloai.com/ai-search-deep-research-comparison/))
- **Multi-model routing** — they're not locked to one vendor's model, they pick best-of-breed per intent
- **Comet** — agentic browser is a genuine product wedge; Chrome+Gemini hasn't caught up, Edge Copilot is desktop-only ([eWeek Comet iOS](https://www.eweek.com/news/perplexity-comet-ai-browser-iphone-launch/))
- **Brand / technical-buyer trust** — 92% factual accuracy; technical buyers prefer it for B2B research ([tech-insider 2026 test](https://tech-insider.org/perplexity-vs-chatgpt-2026/))

### Threats
- Google AI Overviews killing publisher CTRs (-47% on click-through) shifts the legal/economic ground under Perplexity
- Subscription-first pivot is a market-position bet against ad-funded incumbents — adds revenue model risk
- ChatGPT Search owns the conversational UX advantage at 10x the share

---

## 6. Candidate Angle (Ahnaf-specific)

Every recommendation below ties back to a specific line in cv.md.

### Unique value
The candidate is one of a small set of profiles that *credibly* hits **all three** axes Perplexity needs in an MTS-AI-Infra IC: (1) production K8s + RBAC + reliability discipline at enterprise scale, (2) cloud cost / migration leadership at CTO level, (3) PhD-level fluency in PyTorch / LLMs / generative AI vocabulary. Most candidates have at most two of these; the candidate's research role at DCXR Lab (cv.md L62-64, L73-74) plus DevOps Paychex tenure (cv.md L20-27) bridges the "platform engineer who can talk to ML researchers without translation overhead" gap.

### Proof points to surface (every one cited from cv.md)
- **K8s/OpenShift standardization across 10+ teams** (cv.md L23) — direct mirror of Perplexity's "front-end scheduler in our K8s cluster routes traffic across pods." Frame as: "I've built shared deployment substrate that dozens of service teams depend on; I understand how a custom-scheduler-on-top-of-K8s pattern scales because I've shipped one."
- **RBAC rollout in OpenShift with security partnership** (cv.md L24) — maps directly to Comet Enterprise's MDM + Crowdstrike-partnered access control story. "I know what production RBAC looks like across security and platform org boundaries."
- **TLS automation eliminating 100% of cert-related downtime** (cv.md L25) — quantifiable reliability win; useful as "tell me about a reliability problem you owned" answer
- **Gradle plugin for container image certification + 10% opex cut** (cv.md L26) — analog to Perplexity's image-optimization / multi-stage-build needs for ML workloads
- **AWS migration cutting load + cloud spend 80%** (cv.md L33) — the highest-leverage CV bullet for this role. Maps 1:1 to Perplexity's multi-cloud cost optimization (their own pplx-api saved $0.62M/year on a single feature switch). Also signals the candidate has done the "right-size, autoscale, serverless" playbook end to end.
- **GitHub Actions CI/CD reducing manual release effort 85%** (cv.md L34) — modern CI/CD infrastructure
- **Languages: Python, Go, Java, C++** (cv.md L79) — Perplexity's primary stack maps cleanly. **Mention Rust isn't on the CV** — see Gaps.
- **PyTorch + Diffusion + LLMs + MLOps** (cv.md L80) — vocabulary fluency for talking to the model team. Pair with research into MHA / GQA / distributed training so they hear "I read your blog posts."
- **Distributed Systems, Microservices, gRPC, High Availability** (cv.md L83) — the systems-architecture vocabulary an MTS interviewer wants to hear

### Story to tell (the 90-second pitch)
> "I'm a CS PhD candidate in generative AI and 3D graphics, but I came to research from production. At Paychex I led K8s/OpenShift standardization across ten-plus service teams and rolled out platform-wide RBAC and TLS automation that eliminated cert-related downtime entirely. Before that I was CTO at a startup where I migrated a Java monolith to AWS microservices and cut infrastructure load and cost by eighty percent through right-sizing, autoscaling, and serverless. Now I do my research on diffusion models, neural fields, and ML-driven graphics pipelines — so I read PyTorch and LLM-architecture papers natively and talk to ML teams without a translation layer. The reason I want this MTS role at Perplexity specifically is that AI Infra is exactly the seam I sit on — production K8s discipline plus genuine ML-systems literacy — and your work on disaggregated prefill-decode and the custom KV-messenger over RDMA is the most interesting infra problem in the industry right now."

### Gaps to address (proactively, before they ask)
1. **Slurm + multi-cluster federation** — biggest gap. Strategy: acknowledge it directly, then bridge from K8s-scheduler experience. Pre-interview: read [Slurm vs K8s for AI infra (SkyPilot blog)](https://blog.skypilot.co/slurm-vs-k8s/), skim Slurm docs on `sbatch`, partitions, gang scheduling, multi-cluster federation. Mention pplx-garden's GPUDirect RDMA requirements as a sign you've read their open-source.
2. **Multi-node distributed-training ops in production** — research-side PyTorch (cv.md L80) is fine, but candidate hasn't run multi-node training as a *production service*. Bridge: "I've operated K8s at scale and understand checkpointing, failure recovery, gang scheduling at the K8s layer — applying that to GPU training is a natural extension. I've read the SageMaker HyperPod case study and the disaggregated-prefill blog."
3. **Rust** — Perplexity is migrating perf-critical paths to Rust. CV lists Python/Go/C++ but **not Rust** (cv.md L79). Strategy: be honest "I'm Rust-curious not Rust-fluent; my systems instincts are from C++ and Go." Spend 1-2 evenings before the loop reading the Tokio book and Rust async basics.
4. **CUDA / kernel-level optimization** — JD lists CUDA as preferred. Candidate uses PyTorch but probably hasn't written CUDA kernels. Strategy: don't oversell; pivot to PyTorch + TensorRT-LLM literacy.

### 3 questions to ask them (each demonstrates targeted research)
1. **"Your Aug 2025 disaggregated-prefill-decode post showed the KV messenger built on libfabric over RDMA, with EFA and ConnectX support. With the CoreWeave GB200 NVL72 deployment landing this year, how is that messenger evolving for NVLink-domain transfers, and is there a path where prefill and decode start sharing memory inside an NVL72 pod rather than going over RDMA between pods?"** — Shows: read their blog, read CoreWeave news, understand the GB200 NVL72 architecture.

2. **"You're running Kubernetes for inference and SageMaker HyperPod for training, and the JD mentions Slurm multi-cluster federation. Are you converging on a single scheduler tier — say Slurm-on-top-of-K8s, or K8s with a custom HPC operator — or keeping the Train-on-Slurm, Serve-on-K8s split? What's the operational pain on the seam between them?"** — Shows: read SkyPilot's analysis, understand the industry-standard hybrid pattern, asking about real ops pain.

3. **"With the $750M Azure commitment, the CoreWeave deal, and continued AWS HyperPod usage, capacity planning for inference now spans three cloud providers and at least three GPU SKUs. How is the inference team modeling cost-per-token across that fleet — is there a single placement service that picks where a Sonar request lands, and how do you handle the partner-failure blast radius?"** — Shows: read funding/partnership news, understand the multi-cloud reality, asking about the strategic problem an MTS infra IC would actually own.

---

## Sources

- [Perplexity blog: Disaggregated Prefill and Decode](https://www.perplexity.ai/hub/blog/disaggregated-prefill-and-decode) — primary engineering source for inference architecture, KV messenger, RDMA
- [research.perplexity.ai mirror of disaggregated post](https://research.perplexity.ai/articles/disaggregated-prefill-and-decode) — confirmatory mirror
- [Perplexity blog: Introducing pplx-api](https://www.perplexity.ai/hub/blog/introducing-pplx-api) — A100→H100 migration, Triton/TensorRT-LLM, latency wins
- [NVIDIA spotlight: Perplexity 400M queries/month](https://developer.nvidia.com/blog/spotlight-perplexity-ai-serves-400-million-search-queries-a-month-using-nvidia-inference-stack/) — custom K8s scheduler, tensor parallelism, NVIDIA Triton collaboration
- [AWS Perplexity SageMaker HyperPod case study](https://aws.amazon.com/solutions/case-studies/perplexity-case-study/) — training infrastructure, 1,600 Gbps interconnect, auto-checkpointing
- [ByteByteGo: How Perplexity Built an AI Google](https://blog.bytebytego.com/p/how-perplexity-built-an-ai-google) — ROSE inference engine, Python+PyTorch→Rust migration, 200B URLs, 400 PB hot storage
- [ZenML LLMOps DB: Scaling Perplexity to 400M+ queries](https://www.zenml.io/llmops-database/scaling-llm-inference-to-serve-400m-monthly-search-queries) — 20+ models, load balancing, ~$1M/yr savings
- [CoreWeave investor announcement Mar 2026](https://investors.coreweave.com/news/news-details/2026/CoreWeave-Announces-Agreement-to-Power-Perplexitys-AI-Inference-Workloads/default.aspx) — GB200 NVL72, CoreWeave Kubernetes Service, W&B Models
- [Axios Mar 4 2026: Perplexity-CoreWeave deal](https://www.axios.com/2026/03/04/perplexity-coreweave-data-center-nvidia) — deal context
- [Wikipedia: Perplexity AI](https://en.wikipedia.org/wiki/Perplexity_AI) — funding history, $750M Azure, subscription pivot, founders
- [Wikipedia: Comet (browser)](https://en.wikipedia.org/wiki/Comet_(browser)) — release timeline, CometJacking vulnerability
- [TechCrunch Sep 2025: $200M at $20B](https://techcrunch.com/2025/09/10/perplexity-reportedly-raised-200m-at-20b-valuation/) — funding round
- [Tracxn 2026 Perplexity profile](https://tracxn.com/d/companies/perplexity/__V2BE-5ihMWJ1hNb2_u1W7Gry25JzPFCBg-iNWi94XI8/funding-and-investors) — $1.72B total, 56 investors, $22.6B valuation Jan 2026
- [Sacra: Perplexity revenue](https://sacra.com/c/perplexity/) — $500M ARR Apr 2026, +335% YoY
- [TrueUp Perplexity profile](https://www.trueup.io/co/perplexity-ai) — headcount trajectory
- [Perplexity Careers](https://www.perplexity.ai/hub/careers) — 4 days/week in office, global office list, open reqs
- [Perplexity model help center](https://www.perplexity.ai/help-center/en/articles/10354919-what-advanced-ai-models-are-included-in-my-subscription) — Sonar, Claude Sonnet 4.6, GPT-5.2, Gemini 3 Pro, Opus 4.6 default Comet model
- [glbgpt 2026 model breakdown](https://www.glbgpt.com/hub/what-llm-does-perplexity-use/) — Sonar = Llama 3.3 70B fine-tuned; multi-model routing
- [RankStudio: Perplexity LLM tech stack](https://rankstudio.net/articles/en/perplexity-llm-tech-stack) — Sonar vs PPLX deep dive
- [github.com/perplexityai](https://github.com/perplexityai) — official org
- [github.com/ppl-ai](https://github.com/ppl-ai) — secondary org
- [github.com/perplexityai/pplx-garden](https://github.com/perplexityai/pplx-garden) — open-source inference garden, GPUDirect RDMA, SYS_PTRACE/SYS_ADMIN
- [Glassdoor: Perplexity AI overview](https://www.glassdoor.com/Overview/Working-at-Perplexity-AI-EI_IE8515634.11,24.htm) — 4.6 overall, 3.3 WLB, 4.9 comp
- [Glassdoor: Long hours reviews](https://www.glassdoor.com/Reviews/Perplexity-AI-long-hour-Reviews-EI_IE8515634.0,13_KH14,23.htm) — long-hours theme
- [Glassdoor: Growing pains review](https://www.glassdoor.com/Reviews/Employee-Review-Perplexity-AI-E8515634-RVW98165246.htm) — talent density quote
- [Glassdoor: Interview Q's](https://www.glassdoor.com/Interview/Perplexity-AI-Interview-Questions-E8515634.htm) — 38.5% positive, 3.31 difficulty, 23-day loop
- [JobsByCulture: Working at Perplexity 2026](https://jobsbyculture.com/blog/working-at-perplexity-2026) — flat / meritocratic culture, hire-fast/fire-fast
- [linkjob.ai 2026 interview process](https://www.linkjob.ai/interview-questions/perplexity-ai-interview/) — Python preference, OA timing, loop structure
- [Levels.fyi: Perplexity AI salaries](https://www.levels.fyi/companies/perplexity-ai/salaries) — $344K median TC, $450K SWE median, top reported $791K
- [Levels.fyi: SWE SF Bay](https://www.levels.fyi/en-gb/companies/perplexity-ai/salaries/software-engineer/locations/san-francisco-bay-area) — $250K-$450K+ SWE in SF
- [GrowthOS: Google AI Overviews vs ChatGPT vs Perplexity](https://www.usegrowthos.com/blog/google-ai-overviews-vs-chatgpt-vs-perplexity) — market share, B2B citation breakdown
- [Sedestral: AI search market share 2026](https://sedestral.com/en/blog/ai-search-market-share-2026) — share table
- [averi.ai citation benchmarks](https://www.averi.ai/how-to/chatgpt-vs.-perplexity-vs.-google-ai-mode-the-b2b-saas-citation-benchmarks-report-(2026)) — citation overlap, source preferences
- [Felloai 2026 deep research comparison](https://felloai.com/ai-search-deep-research-comparison/) — Deep Research speed, 500M queries/month
- [tech-insider 2026 test](https://tech-insider.org/perplexity-vs-chatgpt-2026/) — 92% accuracy
- [eWeek: Comet iOS launch](https://www.eweek.com/news/perplexity-comet-ai-browser-iphone-launch/) — competitive position
- [gHacks: Comet iPhone](https://www.ghacks.net/2026/03/20/perplexitys-ai-browser-comet-launches-on-iphone-with-built-in-assistant/) — features, dates
- [buildfastwithai: Perplexity Computer](https://www.buildfastwithai.com/blogs/what-is-perplexity-computer) — Feb 2026 agent launch
- [Fortune: Perplexity publisher lawsuits](https://fortune.com/2025/08/26/perplexity-lawsuits-publishers-ai-search-nikkei-news-corp/) — Nikkei/Asahi, News Corp, $42.5M revshare
- [eWeek: BBC legal notice](https://www.eweek.com/news/bbc-legal-notice-perplexity-ai-copyright-infringement/) — BBC threat, Perplexity response
- [Technology Magazine: BBC vs Perplexity](https://technologymagazine.com/news/bbc-vs-perplexity-legal-showdown-looms-over-ai-content-use) — BBC concerns + 17% accuracy stat
- [SkyPilot blog: Slurm vs K8s](https://blog.skypilot.co/slurm-vs-k8s/) — hybrid Train-on-Slurm/Serve-on-K8s industry pattern
- [secondtalent.com: Perplexity features 2026](https://www.secondtalent.com/resources/perplexity-ai-features/) — talent sources (OpenAI, Meta, DeepMind)
