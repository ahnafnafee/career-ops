#!/usr/bin/env node

/**
 * Build the read-only campaign snapshot used by the local web UI
 * and its shareable Markdown export.
 *
 * Usage:
 *   node campaign-dashboard.mjs
 *   node campaign-dashboard.mjs --check
 *   node campaign-dashboard.mjs --summary
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(ROOT, "data", "campaign-sources.json");
const args = new Set(process.argv.slice(2));

function fail(message) {
  console.error(`campaign-dashboard: ${message}`);
  process.exit(1);
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    fail(`cannot read ${file}: ${error.message}`);
  }
}

function resolveConfigured(value) {
  if (!value || typeof value !== "string") fail("campaign source path is missing");
  return path.isAbsolute(value) ? path.normalize(value) : path.resolve(ROOT, value);
}

function parseDelimited(text, delimiter) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  row.push(field.replace(/\r$/, ""));
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  if (quoted) fail("unterminated quoted field in a configured source");
  if (rows.length === 0) return [];

  const headers = rows[0].map((cell) => cell.trim());
  return rows.slice(1).map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""])));
}

function readDelimited(file, delimiter) {
  try {
    return parseDelimited(fs.readFileSync(file, "utf8"), delimiter);
  } catch (error) {
    fail(`cannot parse ${file}: ${error.message}`);
  }
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(?:incorporated|inc|llc|ltd|limited|corp|corporation|company|co)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeReq(value) {
  const normalized = normalizeText(value).replace(/\s+/g, "");
  return ["", "na", "none", "notlisted"].includes(normalized) ? "" : normalized;
}

function normalizeUrl(value) {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(?:utm_|source$|src$|ref$|trk$)/i.test(key)) parsed.searchParams.delete(key);
    }
    parsed.hostname = parsed.hostname.toLowerCase();
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return String(value).trim().replace(/\/$/, "").toLowerCase();
  }
}

function rowKeys(row) {
  const company = normalizeText(row.company);
  const requisition = normalizeReq(row.requisitionId);
  const url = normalizeUrl(row.url);
  const role = normalizeText(row.role);
  const location = normalizeText(row.location);
  return [
    requisition && company ? `req:${company}:${requisition}` : "",
    url ? `url:${url}` : "",
    company && role ? `role:${company}:${role}:${location}` : "",
    company && role ? `role-loose:${company}:${role}` : "",
  ].filter(Boolean);
}

function makeIndex(rows) {
  const index = new Map();
  for (const row of rows) {
    for (const key of rowKeys(row)) if (!index.has(key)) index.set(key, row);
  }
  return index;
}

function findMatch(row, index) {
  for (const key of rowKeys(row)) {
    const match = index.get(key);
    if (match) return match;
  }
  return null;
}

function humanStatus(value) {
  return String(value ?? "")
    .replace(/[_-]+/g, " ")
    .replace(/\bai\b/gi, "AI")
    .replace(/\bml\b/gi, "ML")
    .replace(/\bphd\b/gi, "PhD")
    .replace(/\bcpt\b/gi, "CPT")
    .replace(/\bus\b/gi, "US")
    .replace(/^./, (char) => char.toUpperCase());
}

function focusFromLane(lane, role) {
  const known = {
    "ml-systems": "ML systems",
    "research-applied": "Research / applied AI",
    "software-platform": "Software / platform",
    "graphics-hci-xr": "Graphics / HCI / XR",
    "game-interactive": "Game / interactive",
    "quant-data": "Quant / data",
  };
  if (known[lane]) return known[lane];

  const title = normalizeText(role);
  if (/\b(?:graphics|rendering|visualization|simulation|ux|hci|game|engine|3d|vision)\b/.test(title)) return "Graphics / interactive";
  if (/\b(?:machine learning|ml|artificial intelligence|ai|applied science|research|genai)\b/.test(title)) return "ML / AI research";
  if (/\b(?:quantitative|quant|trading|finance)\b/.test(title)) return "Quant / data";
  return "Software / systems";
}

function localScope(status, currentStates) {
  if (status === "packet-ready" || status.startsWith("packet-ready-")) return "current";
  if (status.startsWith("packet-draft")) return "current";
  if (status.startsWith("packet-build")) return "current";
  if (currentStates.has(status)) return "current";
  if (status.startsWith("verified-live") || status.startsWith("reserved") || status.startsWith("hold")) return "reserve";
  return "inactive";
}

function localStage(status, scope) {
  if (status === "packet-ready" || status.startsWith("packet-ready-")) {
    return { key: "packet-ready", label: "Packet ready" };
  }
  if (status.startsWith("packet-draft")) {
    return { key: "staged-review", label: "Cover approval" };
  }
  if (status.startsWith("packet-build")) {
    return { key: "packet-build", label: "Packet build" };
  }
  if (status.startsWith("staged-review")) return { key: "staged-review", label: "Staged review" };
  if (scope === "current") return { key: "queue-ready", label: "Queue ready" };
  if (status.startsWith("hold")) return { key: "hold", label: "Hold" };
  if (scope === "reserve") return { key: "reserve", label: "Needs review" };
  return { key: "inactive", label: "Inactive" };
}

function companionStage(status) {
  if (status.startsWith("packet_ready")) {
    return { key: "packet-ready", label: "Packet ready", scope: "current" };
  }
  if (status.startsWith("hold_")) {
    return { key: "hold", label: "Hold", scope: "reserve" };
  }
  if (status.startsWith("rejected_")) {
    return { key: "inactive", label: "Closed / rejected", scope: "inactive" };
  }
  if (status.startsWith("covered_by_")) {
    return { key: "consolidated", label: "Consolidated", scope: "inactive" };
  }
  if (status.startsWith("prepare_next")) {
    return { key: "prepare-next", label: "Prepare next", scope: "current" };
  }
  if (status.includes("interest_pool")) {
    return { key: "interest-pool", label: "Interest pool", scope: "current" };
  }
  return { key: "verified-live", label: "Verified live", scope: "current" };
}

function readOutreach(directory) {
  if (!fs.existsSync(directory)) return [];
  const rows = [];
  for (const name of fs.readdirSync(directory)) {
    if (!name.endsWith("-contacto.md")) continue;
    const content = fs.readFileSync(path.join(directory, name), "utf8");
    const role = content.match(/^- \*\*Role:\*\* (.+)$/m)?.[1]?.trim() ?? "";
    const requisitionId = content.match(/^- \*\*Requisition:\*\* (.+)$/m)?.[1]?.trim() ?? "";
    const url = content.match(/^- \*\*Posting:\*\* (https?:\/\/\S+)/m)?.[1]?.trim() ?? "";
    const heading = content.match(/^# (.+): contacto staging$/m)?.[1]?.trim() ?? "";
    const company = requisitionId && heading.toLowerCase().endsWith(requisitionId.toLowerCase())
      ? heading.slice(0, -requisitionId.length).trim()
      : heading;
    const status = content.includes("## Staged connection note")
      ? "Draft ready"
      : content.includes("No verified lead")
        ? "No verified lead"
        : "Not drafted";
    rows.push({ company, role, requisitionId, url, outreachStatus: status });
  }
  return rows;
}

function stableId(source, row) {
  const seed = `${source}|${row.company}|${row.requisitionId}|${row.url}|${row.role}`;
  return crypto.createHash("sha256").update(seed).digest("hex").slice(0, 16);
}

function atomicWrite(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.${crypto.randomUUID()}.tmp`);
  fs.writeFileSync(temp, content, "utf8");
  try {
    fs.renameSync(temp, file);
  } catch (error) {
    try {
      fs.rmSync(file, { force: true });
      fs.renameSync(temp, file);
    } catch {
      fs.rmSync(temp, { force: true });
      throw error;
    }
  }
}

function markdownCell(value) {
  return String(value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\|/g, "\\|")
    .trim();
}

function markdownLink(label, url) {
  return url ? `[${markdownCell(label)}](${url})` : markdownCell(label);
}

function stageRank(key) {
  return {
    "staged-review": 0,
    "packet-ready": 1,
    "packet-build": 2,
    "queue-ready": 3,
    "prepare-next": 4,
    "verified-live": 5,
    "interest-pool": 6,
    reserve: 7,
    hold: 8,
    inactive: 9,
  }[key] ?? 9;
}

function buildMarkdown(data) {
  const current = data.applications.filter((row) => row.scope === "current");
  const rows = current
    .toSorted((a, b) => stageRank(a.stageKey) - stageRank(b.stageKey) || a.company.localeCompare(b.company) || a.role.localeCompare(b.role))
    .map((row) => {
      const source = row.source === "career-ops" ? "career-ops" : "companion queue";
      return `| ${markdownCell(row.company)} | ${markdownLink(row.role, row.url)} | ${markdownCell(row.focus)} | ${markdownCell(row.location || "Not listed")} | ${markdownCell(row.stageLabel)} | ${markdownCell(row.packetStatus)} | ${markdownCell(row.outreachStatus)} | ${source} |`;
    });

  return `# ${data.campaign} current applications

**Updated:** ${data.generatedDate}  
**Status:** Planning and review only. No application listed here has been submitted.  
**Coverage:** ${data.summary.current} current roles across two coordinated workspaces, with ownership kept separate.

This file is safe to share as a campaign-status list. It contains public job information and preparation state only. It omits contact names, private paths, form answers, and protected research details.

## Snapshot

| Current roles | Packet ready | Packet build | Staged review | Outreach drafts | No verified outreach lead | Submitted |
|---:|---:|---:|---:|---:|---:|---:|
| ${data.summary.current} | ${data.summary.packetReady} | ${data.summary.packetBuild} | ${data.summary.stagedReview} | ${data.summary.outreachDrafts} | ${data.summary.noLead} | ${data.summary.submitted} |

- career-ops owns ${data.summary.careerOpsCurrent} current roles.
- career-ops currently has ${data.summary.careerOpsPacketReady} reviewable packet${data.summary.careerOpsPacketReady === 1 ? "" : "s"}.
- The companion queue owns ${data.summary.companionCurrent} current roles, including ${data.summary.companionPacketReady} reviewable application packets.
${data.authorizationNote ? `- ${data.authorizationNote}` : ""}

## Current application corpus

| Company | Role | Focus | Location | Stage | Application packet | Outreach | Source |
|---|---|---|---|---|---|---|---|
${rows.join("\n")}

## Reading the stages

- **Packet ready:** A tailored application packet exists for review. It has not been submitted.
- **Packet build:** The role passed screening and its report, résumé, and supporting materials are being prepared.
- **Staged review:** The form or packet reached a review step but still has a named correction or gate.
- **Queue ready:** The role passed the current career-ops eligibility screen and awaits packet preparation or final review.
- **Verified live, prepare next, or interest pool:** The companion task owns the role, but it is not one of its ${data.summary.companionPacketReady} completed packets.

The dashboard also retains ${data.summary.reserve} reserve records and ${data.summary.inactive} inactive records for private campaign management. They are excluded from this shareable current-applications list.
`;
}

const config = readJson(CONFIG_PATH);
const localOwnershipPath = resolveConfigured(config.localOwnership);
const localReservePath = resolveConfigured(config.localReserve);
const localOutreachPath = resolveConfigured(config.localOutreachDirectory);
const companionOwnershipPath = resolveConfigured(config.companionOwnership);
const companionTrackerPath = resolveConfigured(config.companionTracker);
const dashboardOutput = resolveConfigured(config.dashboardOutput);
const shareableOutput = resolveConfigured(config.shareableOutput);

const localOwnership = readDelimited(localOwnershipPath, "\t");
const localReserve = readDelimited(localReservePath, "\t").map((row) => ({
  ...row,
  requisitionId: row.requisition_id,
  url: row.canonical_url,
}));
const reserveIndex = makeIndex(localReserve);
const outreach = readOutreach(localOutreachPath);
const outreachIndex = makeIndex(outreach);
const companionOwnership = readJson(companionOwnershipPath);
const companionTracker = readDelimited(companionTrackerPath, ",").map((row) => ({
  ...row,
  requisitionId: "",
  url: row.source,
}));
const companionTrackerIndex = makeIndex(companionTracker);
const localCurrentStates = new Set(config.localCurrentStates);

const applications = [];
for (const sourceRow of localOwnership.filter((row) => row.owner_task === config.localOwnerTask)) {
  const lookupRow = {
    company: sourceRow.company,
    role: sourceRow.role,
    requisitionId: sourceRow.requisition_id,
    url: sourceRow.canonical_url,
    location: "",
  };
  const reserve = findMatch(lookupRow, reserveIndex);
  const scope = localScope(sourceRow.state, localCurrentStates);
  const stage = localStage(sourceRow.state, scope);
  const outreachRow = findMatch(lookupRow, outreachIndex);
  applications.push({
    id: stableId("career-ops", lookupRow),
    source: "career-ops",
    company: sourceRow.company,
    role: sourceRow.role,
    location: reserve?.location ?? "",
    requisitionId: sourceRow.requisition_id || "",
    url: sourceRow.canonical_url || "",
    rawStatus: sourceRow.state,
    statusDetail: humanStatus(sourceRow.state),
    scope,
    stageKey: stage.key,
    stageLabel: stage.label,
    focus: focusFromLane(reserve?.lane, sourceRow.role),
    packetStatus: stage.key === "packet-ready"
      ? "Ready for review"
      : sourceRow.state.startsWith("packet-draft")
        ? "Resume/report ready; cover approval pending"
        : sourceRow.state.startsWith("packet-build")
          ? "In progress"
        : stage.key === "staged-review"
            ? "Staged review"
            : "Not prepared",
    outreachStatus: scope === "current" ? outreachRow?.outreachStatus ?? "Not drafted" : "Not tracked",
    submitted: false,
  });
}

for (const sourceRow of companionOwnership.owned_roles ?? []) {
  const lookupRow = {
    company: sourceRow.company,
    role: sourceRow.role,
    requisitionId: sourceRow.requisition_id || sourceRow.ats_posting_id || "",
    url: sourceRow.canonical_job_url,
    location: sourceRow.location,
  };
  const tracker = findMatch(lookupRow, companionTrackerIndex);
  const stage = companionStage(sourceRow.status);
  const packetReady = stage.key === "packet-ready";
  applications.push({
    id: stableId("ai-job-search", lookupRow),
    source: "ai-job-search",
    company: sourceRow.company,
    role: sourceRow.role,
    location: sourceRow.location || "",
    requisitionId: sourceRow.requisition_id || sourceRow.ats_posting_id || "",
    url: tracker?.source || sourceRow.canonical_job_url || "",
    rawStatus: sourceRow.status,
    statusDetail: humanStatus(sourceRow.status),
    scope: stage.scope,
    stageKey: stage.key,
    stageLabel: stage.label,
    focus: focusFromLane("", sourceRow.role),
    packetStatus: packetReady ? "Ready for review" : "Not prepared",
    outreachStatus: packetReady ? "Provisional draft" : "Not drafted",
    score: tracker?.fit_rating ? Number(tracker.fit_rating) : null,
    submitted: false,
  });
}

const expectedCompanionPackets = Number(companionOwnership.capacity?.packet_ready);
const actualCompanionPackets = applications.filter(
  (row) => row.source === "ai-job-search" && row.stageKey === "packet-ready",
).length;
if (Number.isFinite(expectedCompanionPackets) && expectedCompanionPackets !== actualCompanionPackets) {
  fail(`companion packet count drifted: expected ${expectedCompanionPackets}, found ${actualCompanionPackets}`);
}

const currentRows = applications.filter((row) => row.scope === "current");
const conflicts = [];
const seenCurrentKeys = new Map();
for (const row of currentRows) {
  for (const key of rowKeys(row).filter((candidate) => !candidate.startsWith("role-loose:"))) {
    const prior = seenCurrentKeys.get(key);
    if (prior && prior.source !== row.source) conflicts.push({ key, first: prior.id, second: row.id });
    else seenCurrentKeys.set(key, row);
  }
}
if (conflicts.length > 0) fail(`cross-task duplicate detected (${conflicts.length}); resolve ownership before publishing`);

const summary = {
  total: applications.length,
  current: currentRows.length,
  reserve: applications.filter((row) => row.scope === "reserve").length,
  inactive: applications.filter((row) => row.scope === "inactive").length,
  careerOpsCurrent: currentRows.filter((row) => row.source === "career-ops").length,
  companionCurrent: currentRows.filter((row) => row.source === "ai-job-search").length,
  careerOpsPacketReady: currentRows.filter((row) => row.source === "career-ops" && row.stageKey === "packet-ready").length,
  companionPacketReady: currentRows.filter((row) => row.source === "ai-job-search" && row.stageKey === "packet-ready").length,
  packetReady: currentRows.filter((row) => row.stageKey === "packet-ready").length,
  packetBuild: currentRows.filter((row) => row.stageKey === "packet-build").length,
  stagedReview: currentRows.filter((row) => row.stageKey === "staged-review").length,
  outreachDrafts: currentRows.filter((row) => ["Draft ready", "Provisional draft"].includes(row.outreachStatus)).length,
  noLead: currentRows.filter((row) => row.outreachStatus === "No verified lead").length,
  submitted: currentRows.filter((row) => row.submitted).length,
  conflicts: conflicts.length,
};

const generatedAt = new Date().toISOString();
const data = {
  schemaVersion: 1,
  campaign: config.campaign,
  authorizationNote: config.authorizationNote || "",
  generatedAt,
  generatedDate: generatedAt.slice(0, 10),
  readOnly: true,
  summary,
  applications: applications.toSorted((a, b) => a.scope.localeCompare(b.scope) || stageRank(a.stageKey) - stageRank(b.stageKey) || a.company.localeCompare(b.company) || a.role.localeCompare(b.role)),
};

const jsonContent = `${JSON.stringify(data, null, 2)}\n`;
const markdownContent = buildMarkdown(data);

if (args.has("--check")) {
  const currentJson = fs.existsSync(dashboardOutput) ? fs.readFileSync(dashboardOutput, "utf8") : "";
  const currentMarkdown = fs.existsSync(shareableOutput) ? fs.readFileSync(shareableOutput, "utf8") : "";
  const normalizedJson = currentJson.replace(/"generatedAt": ".+?"/, `"generatedAt": "${generatedAt}"`);
  const ok = normalizedJson === jsonContent && currentMarkdown === markdownContent;
  console.log(JSON.stringify({ ok, dashboardOutput, shareableOutput, summary }, null, 2));
  process.exit(ok ? 0 : 2);
}

atomicWrite(dashboardOutput, jsonContent);
atomicWrite(shareableOutput, markdownContent);

if (args.has("--summary")) {
  console.log(`${data.campaign}: ${summary.current} current (${summary.careerOpsCurrent} career-ops + ${summary.companionCurrent} companion), ${summary.packetReady} packet-ready, ${summary.stagedReview} staged-review, ${summary.submitted} submitted.`);
} else {
  console.log(JSON.stringify({ dashboardOutput, shareableOutput, summary }, null, 2));
}
