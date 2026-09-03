import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { careerOpsRoot, rootScript } from "@/lib/career-ops";

export type CampaignScope = "current" | "reserve" | "inactive";

export type CampaignApplication = {
  id: string;
  source: "career-ops" | "ai-job-search";
  company: string;
  role: string;
  location: string;
  requisitionId: string;
  url: string;
  rawStatus: string;
  statusDetail: string;
  scope: CampaignScope;
  stageKey: string;
  stageLabel: string;
  focus: string;
  packetStatus: string;
  outreachStatus: string;
  score?: number | null;
  submitted: boolean;
};

export type CampaignSummary = {
  total: number;
  current: number;
  reserve: number;
  inactive: number;
  careerOpsCurrent: number;
  companionCurrent: number;
  careerOpsPacketReady: number;
  companionPacketReady: number;
  packetReady: number;
  packetBuild: number;
  stagedReview: number;
  outreachDrafts: number;
  noLead: number;
  submitted: number;
  conflicts: number;
};

export type CampaignData = {
  schemaVersion: number;
  campaign: string;
  authorizationNote: string;
  generatedAt: string;
  generatedDate: string;
  readOnly: boolean;
  summary: CampaignSummary;
  applications: CampaignApplication[];
};

type CampaignSources = {
  dashboardOutput?: string;
  shareableOutput?: string;
  localOwnership?: string;
  localReserve?: string;
  localOutreachDirectory?: string;
  companionOwnership?: string;
  companionTracker?: string;
};

function readCampaignSources(): CampaignSources {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(path.resolve(careerOpsRoot()), "data", "campaign-sources.json"), "utf8"),
    ) as CampaignSources;
  } catch {
    return {};
  }
}

function configuredOutput(key: keyof CampaignSources, fallback: string) {
  const root = path.resolve(careerOpsRoot());
  let configured = fallback;
  const config = readCampaignSources();
  if (typeof config[key] === "string" && config[key]) configured = config[key];

  const resolved = path.resolve(root, configured);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error("Campaign outputs must remain inside the career-ops data root.");
  }
  return resolved;
}

export function campaignSnapshotPath() {
  return configuredOutput("dashboardOutput", "data/campaign-dashboard.json");
}

export function campaignMarkdownPath() {
  return configuredOutput("shareableOutput", "output/shareable/current-applications.md");
}

function configuredInput(value: string | undefined): string | null {
  if (!value) return null;
  return path.isAbsolute(value)
    ? path.normalize(value)
    : path.resolve(careerOpsRoot(), value);
}

function newestMtime(file: string, depth = 0): number {
  try {
    const stat = fs.statSync(file);
    if (!stat.isDirectory()) return stat.mtimeMs;
    if (depth >= 2) return stat.mtimeMs;
    let newest = stat.mtimeMs;
    for (const child of fs.readdirSync(file)) {
      newest = Math.max(newest, newestMtime(path.join(file, child), depth + 1));
    }
    return newest;
  } catch {
    return 0;
  }
}

/**
 * The campaign list is a generated, cross-workspace snapshot. Keep it current
 * on ordinary page loads instead of relying on a person or a future agent to
 * remember a refresh command. Packet contents themselves are resolved live by
 * the packet API, so only ownership/reserve/tracker/outreach inputs participate
 * in this freshness check.
 */
function refreshCampaignSnapshotIfStale() {
  const snapshot = campaignSnapshotPath();
  const snapshotMtime = newestMtime(snapshot);
  const root = path.resolve(careerOpsRoot());
  const configPath = path.join(root, "data", "campaign-sources.json");
  const config = readCampaignSources();
  const inputs = [
    configPath,
    rootScript("campaign-dashboard"),
    configuredInput(config.localOwnership),
    configuredInput(config.localReserve),
    configuredInput(config.localOutreachDirectory),
    configuredInput(config.companionOwnership),
    configuredInput(config.companionTracker),
  ].filter((value): value is string => Boolean(value));

  if (snapshotMtime > 0 && inputs.every((input) => newestMtime(input) <= snapshotMtime)) return;

  // A source may be momentarily unavailable while the companion task performs
  // an atomic write. Keep serving the last valid snapshot if regeneration fails.
  spawnSync(process.execPath, [rootScript("campaign-dashboard"), "--summary"], {
    cwd: root,
    encoding: "utf8",
    timeout: 30_000,
    windowsHide: true,
  });
}

export function readCampaign(): CampaignData | null {
  try {
    refreshCampaignSnapshotIfStale();
    const parsed = JSON.parse(
      fs.readFileSync(/* turbopackIgnore: true */ campaignSnapshotPath(), "utf8"),
    ) as Partial<CampaignData>;
    if (
      parsed.schemaVersion !== 1 ||
      typeof parsed.campaign !== "string" ||
      typeof parsed.generatedAt !== "string" ||
      typeof parsed.summary !== "object" ||
      !Array.isArray(parsed.applications)
    ) {
      return null;
    }
    return { authorizationNote: "", ...parsed } as CampaignData;
  } catch {
    return null;
  }
}
