"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  ClipboardCheck,
  Download,
  FileCheck2,
  FileText,
  ListChecks,
  Loader2,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { CampaignApplication, CampaignData, CampaignScope } from "@/lib/campaign";
import type { CampaignArtifact, CampaignArtifactGroup, CampaignPacket } from "@/lib/campaign-packet";

type ScopeFilter = CampaignScope | "all";
type PacketTab = "context" | "resume" | "cover" | "application" | "review" | "checklist" | "outreach" | "files";

const SCOPE_TABS: { value: ScopeFilter; label: string }[] = [
  { value: "current", label: "Current" },
  { value: "reserve", label: "Reserve" },
  { value: "inactive", label: "Inactive" },
  { value: "all", label: "All" },
];

const SOURCE_LABELS: Record<CampaignApplication["source"], string> = {
  "career-ops": "This workspace",
  "ai-job-search": "Companion task",
};

const TAB_DEFINITIONS: Array<{ value: PacketTab; label: string; groups: CampaignArtifactGroup[] }> = [
  { value: "context", label: "Job context", groups: ["context"] },
  { value: "resume", label: "Résumé", groups: ["resume"] },
  { value: "cover", label: "Cover letter", groups: ["cover"] },
  { value: "application", label: "Application", groups: ["answers", "skills"] },
  { value: "review", label: "Fit & CPT", groups: ["review"] },
  { value: "checklist", label: "Checklist", groups: ["checklist"] },
  { value: "outreach", label: "Outreach", groups: ["outreach"] },
  { value: "files", label: "Source files", groups: ["files"] },
];

const REVIEW_STATE_KEY = "career-ops:campaign-review-state:v1";

type SavedReviewState = {
  selectedId?: string;
  scope?: ScopeFilter;
  source?: string;
  focus?: string;
  stage?: string;
};

export function CampaignView({ data }: { data: CampaignData | null }) {
  const router = useRouter();
  const detailRef = useRef<HTMLElement>(null);
  const [scope, setScope] = useState<ScopeFilter>("current");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [focus, setFocus] = useState("all");
  const [stage, setStage] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [packet, setPacket] = useState<CampaignPacket | null>(null);
  const [packetError, setPacketError] = useState("");
  const [packetLoading, setPacketLoading] = useState(false);
  const [packetNonce, setPacketNonce] = useState(0);
  const [activeTab, setActiveTab] = useState<PacketTab>("context");
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const rows = data?.applications ?? [];
  const scopeCounts = useMemo(() => ({
    current: rows.filter((row) => row.scope === "current").length,
    reserve: rows.filter((row) => row.scope === "reserve").length,
    inactive: rows.filter((row) => row.scope === "inactive").length,
    all: rows.length,
  }), [rows]);

  const choices = useMemo(() => {
    const scopedRows = rows.filter((row) => scope === "all" || row.scope === scope);
    return {
      focuses: [...new Set(scopedRows.map((row) => row.focus))].sort(),
      stages: [...new Set(scopedRows.map((row) => row.stageLabel))].sort(),
    };
  }, [rows, scope]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (scope !== "all" && row.scope !== scope) return false;
      if (source !== "all" && row.source !== source) return false;
      if (focus !== "all" && row.focus !== focus) return false;
      if (stage !== "all" && row.stageLabel !== stage) return false;
      if (!needle) return true;
      return [row.company, row.role, row.location, row.requisitionId, row.focus, row.stageLabel]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [focus, query, rows, scope, source, stage]);

  const selectedApplication = useMemo(
    () => rows.find((row) => row.id === selectedId) ?? null,
    [rows, selectedId],
  );

  useEffect(() => {
    let saved: SavedReviewState = {};
    try {
      saved = JSON.parse(localStorage.getItem(REVIEW_STATE_KEY) ?? "{}") as SavedReviewState;
    } catch {
      saved = {};
    }
    if (saved.scope && SCOPE_TABS.some((tab) => tab.value === saved.scope)) setScope(saved.scope);
    if (saved.source) setSource(saved.source);
    if (saved.focus) setFocus(saved.focus);
    if (saved.stage) setStage(saved.stage);
    const remembered = rows.some((row) => row.id === saved.selectedId) ? saved.selectedId : null;
    setSelectedId(remembered ?? rows.find((row) => row.scope === "current")?.id ?? rows[0]?.id ?? null);
  }, []); // Restore once; later server refreshes retain the current selection.

  useEffect(() => {
    if (!selectedId) return;
    localStorage.setItem(REVIEW_STATE_KEY, JSON.stringify({ selectedId, scope, source, focus, stage }));
  }, [focus, scope, selectedId, source, stage]);

  useEffect(() => {
    if (!selectedId || rows.some((row) => row.id === selectedId)) return;
    setSelectedId(rows.find((row) => row.scope === "current")?.id ?? rows[0]?.id ?? null);
  }, [rows, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      setPacket(null);
      return;
    }
    const controller = new AbortController();
    setPacketLoading(true);
    setPacketError("");
    fetch(`/api/campaign/packet/${encodeURIComponent(selectedId)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 404 ? "Packet files were not found." : "Packet could not be loaded.");
        return response.json() as Promise<CampaignPacket>;
      })
      .then((nextPacket) => {
        setPacket(nextPacket);
        const firstAvailable = TAB_DEFINITIONS.find((tab) => nextPacket.artifacts.some((artifact) => tab.groups.includes(artifact.group)));
        setActiveTab(firstAvailable?.value ?? "files");
        setActiveArtifactId(null);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPacket(null);
        setPacketError(error instanceof Error ? error.message : "Packet could not be loaded.");
      })
      .finally(() => setPacketLoading(false));
    return () => controller.abort();
  }, [packetNonce, selectedId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
      setPacketNonce((value) => value + 1);
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [router]);

  function refreshNow() {
    setRefreshing(true);
    router.refresh();
    setPacketNonce((value) => value + 1);
    window.setTimeout(() => setRefreshing(false), 650);
  }

  function chooseApplication(id: string) {
    setSelectedId(id);
    setPacket(null);
    setPacketError("");
    window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-12">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand-text">Application review desk</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] text-foreground">Campaign snapshot unavailable</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
          Generate it once with <code className="bg-surface px-1.5 py-1 font-mono text-xs">node campaign-dashboard.mjs</code>. After that, this page keeps it current automatically.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-14">
      <header className="border-b border-border bg-surface">
        <div className="grid h-1.5 grid-cols-[1.2fr_.65fr_2.4fr]" aria-hidden="true">
          <span className="bg-cyan-400" />
          <span className="bg-fuchsia-500" />
          <span className="bg-violet-600" />
        </div>
        <div className="mx-auto flex max-w-[1720px] flex-col gap-6 px-5 py-7 sm:px-7 lg:flex-row lg:items-end lg:justify-between lg:px-9">
          <div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-violet-700 dark:text-violet-300">
              Packet review // {data.campaign}
              <span className="inline-flex items-center gap-1.5 border-l border-border pl-3 font-sans font-semibold normal-case tracking-normal text-muted">
                <LockKeyhole className="size-3" /> Local and read-only
              </span>
            </div>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.045em] text-foreground sm:text-5xl">Application review desk</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
              Select any role to read the exact job context, tailored documents, answers, fit review, CPT notes, checklist, and outreach draft. The reader follows both workspaces without merging ownership.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={refreshNow} className="inline-flex h-10 items-center gap-2 border border-border bg-background px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-violet-500">
              <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
            <a href="/api/campaign/markdown" className="inline-flex h-10 items-center gap-2 bg-foreground px-4 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-violet-500">
              <Download className="size-4" /> Shareable list
            </a>
          </div>
        </div>
        <div className="mx-auto grid max-w-[1720px] grid-cols-2 border-t border-border sm:grid-cols-4 lg:grid-cols-7 lg:px-9">
          <Metric value={data.summary.current} label="current" />
          <Metric value={data.summary.packetReady} label="packet ready" tone="cyan" />
          <Metric value={data.summary.stagedReview} label="staged review" tone="magenta" />
          <Metric value={data.summary.reserve} label="reserve" />
          <Metric value={data.summary.outreachDrafts} label="outreach drafts" />
          <Metric value={data.summary.conflicts} label="owner conflicts" tone={data.summary.conflicts ? "magenta" : "safe"} />
          <Metric value={data.summary.submitted} label="submitted" tone="safe" />
        </div>
      </header>

      <div className="mx-auto grid max-w-[1720px] border-b border-border lg:grid-cols-[23rem_minmax(0,1fr)] lg:px-9">
        <aside className="border-b border-border bg-surface lg:border-b-0 lg:border-r">
          <div className="border-b border-border px-4 pt-3">
            <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Application scope">
              {SCOPE_TABS.map((tab) => (
                <button key={tab.value} type="button" role="tab" aria-selected={scope === tab.value} onClick={() => { setScope(tab.value); setFocus("all"); setStage("all"); }} className={`relative whitespace-nowrap px-2.5 py-3 text-xs font-semibold transition-colors ${scope === tab.value ? "text-foreground" : "text-faint hover:text-muted"}`}>
                  {tab.label} <span className="ml-1 font-mono text-[10px]">{scopeCounts[tab.value]}</span>
                  {scope === tab.value ? <span className="absolute inset-x-2 bottom-0 h-0.5 bg-violet-600 dark:bg-violet-400" /> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 border-b border-border bg-background/45 p-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <span className="sr-only">Search applications</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search packets…" className="h-10 w-full border border-border bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-faint focus:border-violet-500" />
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Filter label="Source" value={source} onChange={setSource} options={[["career-ops", "Here"], ["ai-job-search", "Companion"]]} />
              <Filter label="Focus" value={focus} onChange={setFocus} options={choices.focuses.map((value) => [value, value])} />
              <Filter label="Stage" value={stage} onChange={setStage} options={choices.stages.map((value) => [value, value])} />
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-[11px] text-faint">
            <span><strong className="text-foreground">{filtered.length}</strong> roles</span>
            <span>Auto-refreshes every minute</span>
          </div>

          <div className="max-h-[48vh] overflow-y-auto lg:max-h-[calc(100vh-18rem)]" aria-label="Application packets">
            {filtered.map((row) => <ApplicationIndexRow key={row.id} row={row} selected={row.id === selectedId} onSelect={() => chooseApplication(row.id)} />)}
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-foreground">No roles match.</p>
                <button type="button" onClick={() => { setQuery(""); setSource("all"); setFocus("all"); setStage("all"); }} className="mt-2 text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300">Clear filters</button>
              </div>
            ) : null}
          </div>
        </aside>

        <section ref={detailRef} className="min-w-0 bg-background scroll-mt-4" aria-label="Selected application packet">
          {selectedApplication ? (
            <PacketReader application={selectedApplication} packet={packet} loading={packetLoading} error={packetError} activeTab={activeTab} activeArtifactId={activeArtifactId} onTabChange={(value) => { setActiveTab(value); setActiveArtifactId(null); }} onArtifactChange={setActiveArtifactId} />
          ) : (
            <div className="flex min-h-[34rem] items-center justify-center px-6 text-center">
              <div><FileText className="mx-auto size-8 text-faint" /><h2 className="mt-3 text-lg font-bold text-foreground">Choose a packet</h2><p className="mt-1 text-sm text-muted">Its documents and application context will appear here.</p></div>
            </div>
          )}
        </section>
      </div>

      <p className="mx-auto mt-4 max-w-[1720px] px-5 text-xs leading-5 text-faint sm:px-7 lg:px-9">“Ready” means ready for your review, never permission to submit. {data.authorizationNote}</p>
    </main>
  );
}

function PacketReader({ application, packet, loading, error, activeTab, activeArtifactId, onTabChange, onArtifactChange }: {
  application: CampaignApplication;
  packet: CampaignPacket | null;
  loading: boolean;
  error: string;
  activeTab: PacketTab;
  activeArtifactId: string | null;
  onTabChange: (tab: PacketTab) => void;
  onArtifactChange: (id: string) => void;
}) {
  const definition = TAB_DEFINITIONS.find((tab) => tab.value === activeTab) ?? TAB_DEFINITIONS[0];
  const visibleArtifacts = packet?.artifacts.filter((artifact) => definition.groups.includes(artifact.group)) ?? [];
  const activeArtifact = visibleArtifacts.find((artifact) => artifact.id === activeArtifactId) ?? visibleArtifacts[0] ?? null;

  return (
    <div>
      <header className="border-b border-border bg-surface px-5 py-6 sm:px-7">
        <div className="grid h-1 grid-cols-[1.2fr_.65fr_2.4fr] opacity-90" aria-hidden="true">
          <span className={packet?.artifacts.some((artifact) => artifact.group === "context") ? "bg-cyan-400" : "bg-border"} />
          <span className={packet?.artifacts.some((artifact) => artifact.group === "resume" || artifact.group === "cover") ? "bg-fuchsia-500" : "bg-border"} />
          <span className={packet?.artifacts.some((artifact) => ["answers", "skills", "review", "checklist"].includes(artifact.group)) ? "bg-violet-600" : "bg-border"} />
        </div>
        <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-faint">{application.company}</span><SourceBadge source={application.source} /></div>
            <h2 className="mt-2 max-w-4xl text-2xl font-black leading-tight tracking-[-0.025em] text-foreground sm:text-3xl">{application.role}</h2>
            <p className="mt-2 text-sm text-muted">{application.location || "Location not listed"}{application.requisitionId ? ` · ${application.requisitionId}` : ""}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <StageBadge row={application} />
            {application.url ? <a href={application.url} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-violet-500">Live posting <ArrowUpRight className="size-3.5" /></a> : null}
          </div>
        </div>
      </header>

      <nav className="flex overflow-x-auto border-b border-border bg-surface px-3 sm:px-5" aria-label="Packet sections">
        {TAB_DEFINITIONS.map((tab) => {
          const count = packet?.artifacts.filter((artifact) => tab.groups.includes(artifact.group)).length ?? 0;
          const selected = activeTab === tab.value;
          return (
            <button key={tab.value} type="button" disabled={!loading && count === 0} aria-current={selected ? "page" : undefined} onClick={() => onTabChange(tab.value)} className={`relative whitespace-nowrap px-3 py-3 text-xs font-semibold transition-colors ${selected ? "text-foreground" : count ? "text-muted hover:text-foreground" : "cursor-not-allowed text-faint/50"}`}>
              {tab.label}{count ? <span className="ml-1.5 font-mono text-[9px] text-faint">{count}</span> : null}
              {selected ? <span className="absolute inset-x-3 bottom-0 h-0.5 bg-violet-600 dark:bg-violet-400" /> : null}
            </button>
          );
        })}
      </nav>

      <div className="grid min-h-[40rem] xl:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0 border-border xl:border-r">
          {loading ? <LoadingPacket /> : error ? <PacketError message={error} /> : packet ? (
            <div>
              {packet.warnings.length ? (
                <div className="border-b border-amber-400/30 bg-amber-400/10 px-5 py-3 text-xs leading-5 text-amber-900 dark:text-amber-200 sm:px-7">
                  <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><div><strong>Review signal:</strong> {packet.warnings.join(" ")}</div></div>
                </div>
              ) : null}

              {visibleArtifacts.length > 1 ? (
                <div className="flex gap-1 overflow-x-auto border-b border-border bg-surface/45 px-5 py-2 sm:px-7">
                  {visibleArtifacts.map((artifact) => <button key={artifact.id} type="button" onClick={() => onArtifactChange(artifact.id)} className={`whitespace-nowrap border px-2.5 py-1.5 text-[11px] font-semibold ${artifact.id === activeArtifact?.id ? "border-violet-500 bg-violet-500/10 text-violet-800 dark:text-violet-200" : "border-border bg-surface text-muted hover:text-foreground"}`}>{artifact.label}</button>)}
                </div>
              ) : null}

              {activeArtifact ? <ArtifactViewer artifact={activeArtifact} /> : <EmptyArtifact tab={activeTab} />}
            </div>
          ) : <LoadingPacket />}
        </div>

        <ContextRail application={application} packet={packet} />
      </div>
    </div>
  );
}

function ArtifactViewer({ artifact }: { artifact: CampaignArtifact }) {
  if (artifact.format === "pdf" && artifact.previewUrl) {
    return (
      <div className="bg-[#505159] p-2 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-3 bg-[#26272d] px-3 py-2 text-xs text-white"><span className="truncate font-medium">{artifact.label}</span><a href={artifact.downloadUrl} className="inline-flex shrink-0 items-center gap-1.5 text-white/75 hover:text-white"><ArrowDownToLine className="size-3.5" /> Download</a></div>
        <iframe title={artifact.label} src={`${artifact.previewUrl}#view=FitH`} className="h-[72vh] min-h-[36rem] w-full bg-white" />
      </div>
    );
  }

  if (!artifact.content) {
    return (
      <div className="px-6 py-16 text-center"><FileText className="mx-auto size-7 text-faint" /><p className="mt-3 text-sm font-semibold text-foreground">Preview unavailable</p><p className="mt-1 text-xs text-muted">This file is too large to render inline.</p>{artifact.downloadUrl ? <a href={artifact.downloadUrl} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300"><ArrowDownToLine className="size-3.5" /> Download file</a> : null}</div>
    );
  }

  if (artifact.format === "markdown") {
    return (
      <article className="report-prose mx-auto max-w-5xl px-5 py-7 sm:px-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a> }}>{artifact.content}</ReactMarkdown>
      </article>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3"><span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-faint">{artifact.format} source</span>{artifact.downloadUrl ? <a href={artifact.downloadUrl} className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300"><ArrowDownToLine className="size-3.5" /> Download</a> : null}</div>
      <pre className="max-h-[72vh] overflow-auto whitespace-pre-wrap border border-border bg-surface p-4 font-mono text-xs leading-5 text-foreground">{artifact.content}</pre>
    </div>
  );
}

function ContextRail({ application, packet }: { application: CampaignApplication; packet: CampaignPacket | null }) {
  const coverage = [
    ["Job context", packet?.artifacts.some((artifact) => artifact.group === "context")],
    ["Résumé PDF", packet?.artifacts.some((artifact) => artifact.group === "resume" && artifact.format === "pdf")],
    ["Cover letter", packet?.artifacts.some((artifact) => artifact.group === "cover")],
    ["Answer plan", packet?.artifacts.some((artifact) => artifact.group === "answers")],
    ["Fit / CPT", packet?.artifacts.some((artifact) => artifact.group === "review")],
  ] as const;
  return (
    <aside className="bg-surface px-5 py-6" aria-label="Application context">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-faint">Application context</p>
      <dl className="mt-4 space-y-4 text-xs">
        <ContextValue label="Focus" value={application.focus} />
        <ContextValue label="Stage" value={application.statusDetail} />
        <ContextValue label="Packet" value={application.packetStatus} />
        <ContextValue label="Outreach" value={application.outreachStatus} />
        {application.score != null ? <ContextValue label="Fit score" value={`${application.score}/100`} /> : null}
        <ContextValue label="Owner" value={SOURCE_LABELS[application.source]} />
        <ContextValue label="Location" value={application.location || "Not listed"} />
      </dl>

      <div className="mt-7 border-t border-border pt-5">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-faint">Packet coverage</p>
        <ul className="mt-3 space-y-2">
          {coverage.map(([label, present]) => <li key={label} className={`flex items-center gap-2 text-xs ${present ? "text-foreground" : "text-faint"}`}>{present ? <Check className="size-3.5 text-emerald-600" /> : <span className="ml-0.5 size-2.5 border border-faint/50" />}{label}</li>)}
        </ul>
      </div>

      <div className="mt-7 border-t border-border pt-5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"><ShieldCheck className="size-3.5" /> Submission locked</p>
        <p className="mt-2 text-[11px] leading-5 text-faint">This page reads files only. It cannot submit an application or send outreach.</p>
      </div>

      {packet ? <p className="mt-6 font-mono text-[9px] leading-4 text-faint">Files refreshed {new Date(packet.refreshedAt).toLocaleString()}</p> : null}
    </aside>
  );
}

function ApplicationIndexRow({ row, selected, onSelect }: { row: CampaignApplication; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} className={`group relative w-full border-b border-border px-4 py-3.5 text-left transition-colors focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-violet-500 ${selected ? "bg-violet-500/[0.08]" : "bg-surface hover:bg-surface-hover"}`}>
      <span className={`absolute inset-y-0 left-0 w-1 ${selected ? "bg-violet-600" : row.source === "career-ops" ? "bg-cyan-400/55" : "bg-fuchsia-500/45"}`} />
      <div className="flex items-start justify-between gap-3"><span className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-faint">{row.company}</span><span className="font-mono text-[9px] text-faint">{row.score != null ? row.score : row.stageLabel}</span></div>
      <p className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-foreground">{row.role}</p>
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-faint"><span className="truncate">{row.focus}</span><span className={row.stageKey === "packet-ready" ? "font-semibold text-emerald-700 dark:text-emerald-300" : ""}>{row.stageLabel}</span></div>
    </button>
  );
}

function Metric({ value, label, tone = "neutral" }: { value: number; label: string; tone?: "neutral" | "cyan" | "magenta" | "safe" }) {
  const color = { neutral: "text-foreground", cyan: "text-cyan-700 dark:text-cyan-300", magenta: "text-fuchsia-700 dark:text-fuchsia-300", safe: "text-emerald-700 dark:text-emerald-300" }[tone];
  return <div className="border-b border-r border-border px-5 py-3 last:border-r-0 sm:border-b-0"><p className={`font-mono text-xl font-bold tabular-nums ${color}`}>{value}</p><p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.13em] text-faint">{label}</p></div>;
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="min-w-0"><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full min-w-0 border border-border bg-surface px-2 text-[11px] text-muted outline-none focus:border-violet-500"><option value="all">{label}</option>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function SourceBadge({ source }: { source: CampaignApplication["source"] }) {
  return <span className={`border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${source === "career-ops" ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200" : "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-800 dark:text-fuchsia-200"}`}>{SOURCE_LABELS[source]}</span>;
}

function StageBadge({ row }: { row: CampaignApplication }) {
  const ready = row.stageKey === "packet-ready" || row.stageKey === "staged-review";
  return <span className={`inline-flex h-9 items-center gap-1.5 border px-3 text-[10px] font-bold uppercase tracking-[0.08em] ${ready ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200" : "border-border bg-background text-muted"}`}>{ready ? <Check className="size-3" /> : null}{row.stageLabel}</span>;
}

function ContextValue({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-faint">{label}</dt><dd className="mt-1 leading-5 text-foreground">{value}</dd></div>;
}

function LoadingPacket() {
  return <div className="flex min-h-[32rem] items-center justify-center" aria-live="polite"><div className="text-center"><Loader2 className="mx-auto size-6 animate-spin text-violet-600" /><p className="mt-3 text-sm font-semibold text-foreground">Reading packet files</p><p className="mt-1 text-xs text-muted">Resolving both workspaces without copying them.</p></div></div>;
}

function PacketError({ message }: { message: string }) {
  return <div className="flex min-h-[32rem] items-center justify-center px-6 text-center"><div><AlertTriangle className="mx-auto size-7 text-amber-600" /><p className="mt-3 text-sm font-semibold text-foreground">{message}</p><p className="mt-1 text-xs text-muted">Refresh after the owning task finishes writing its files.</p></div></div>;
}

function EmptyArtifact({ tab }: { tab: PacketTab }) {
  const Icon = tab === "application" ? ClipboardCheck : tab === "checklist" ? ListChecks : tab === "outreach" ? MessageSquareText : tab === "review" ? FileCheck2 : Sparkles;
  return <div className="flex min-h-[32rem] items-center justify-center px-6 text-center"><div><Icon className="mx-auto size-7 text-faint" /><p className="mt-3 text-sm font-semibold text-foreground">Nothing saved in this section</p><p className="mt-1 text-xs text-muted">The context rail shows whether this is expected or a packet gap.</p></div></div>;
}
