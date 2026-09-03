import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { careerOpsRoot } from "@/lib/career-ops";
import { readCampaign, type CampaignApplication } from "@/lib/campaign";

export type CampaignArtifactGroup =
  | "context"
  | "resume"
  | "cover"
  | "answers"
  | "skills"
  | "review"
  | "checklist"
  | "outreach"
  | "files";

export type CampaignArtifactFormat = "markdown" | "text" | "json" | "tex" | "html" | "pdf";

export type CampaignArtifact = {
  id: string;
  group: CampaignArtifactGroup;
  label: string;
  fileName: string;
  format: CampaignArtifactFormat;
  byteSize: number;
  modifiedAt: string;
  content?: string;
  previewUrl?: string;
  downloadUrl?: string;
};

export type CampaignPacket = {
  application: CampaignApplication;
  artifacts: CampaignArtifact[];
  warnings: string[];
  refreshedAt: string;
};

type InternalArtifact = CampaignArtifact & {
  absolutePath?: string;
  allowedRoot?: string;
};

type ResolvedPacket = CampaignPacket & {
  internalArtifacts: InternalArtifact[];
};

type CampaignSources = {
  companionOwnership?: string;
};

const MAX_TEXT_BYTES = 900_000;
const MARKDOWN_EXTENSIONS = new Set([".md", ".markdown"]);
const TEXT_EXTENSIONS = new Set([".txt", ".tex", ".json", ".html", ".htm"]);
const ALLOWED_EXTENSIONS = new Set([".pdf", ...MARKDOWN_EXTENSIONS, ...TEXT_EXTENSIONS]);

function normalize(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function realContainedFile(file: string, root: string): boolean {
  try {
    const realRoot = fs.realpathSync(root);
    const realFile = fs.realpathSync(file);
    return fs.statSync(realFile).isFile() && realFile.startsWith(`${realRoot}${path.sep}`);
  } catch {
    return false;
  }
}

function formatFor(file: string): CampaignArtifactFormat | null {
  const extension = path.extname(file).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) return null;
  if (extension === ".pdf") return "pdf";
  if (MARKDOWN_EXTENSIONS.has(extension)) return "markdown";
  if (extension === ".json") return "json";
  if (extension === ".tex") return "tex";
  if (extension === ".html" || extension === ".htm") return "html";
  return "text";
}

function artifactId(applicationId: string, identity: string): string {
  return crypto.createHash("sha256").update(`${applicationId}|${identity}`).digest("hex").slice(0, 18);
}

function addFile(
  artifacts: InternalArtifact[],
  application: CampaignApplication,
  file: string,
  allowedRoot: string,
  group: CampaignArtifactGroup,
  label: string,
) {
  const format = formatFor(file);
  if (!format || !realContainedFile(file, allowedRoot)) return;
  const stat = fs.statSync(file);
  const id = artifactId(application.id, fs.realpathSync(file));
  if (artifacts.some((artifact) => artifact.id === id)) return;
  const endpoint = `/api/campaign/packet/${encodeURIComponent(application.id)}/artifact/${id}`;
  let content: string | undefined;
  if (format !== "pdf" && stat.size <= MAX_TEXT_BYTES) {
    content = fs.readFileSync(/* turbopackIgnore: true */ file, "utf8");
  }
  artifacts.push({
    id,
    group,
    label,
    fileName: path.basename(file),
    format,
    byteSize: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    content,
    previewUrl: format === "pdf" ? endpoint : undefined,
    downloadUrl: `${endpoint}?download=1`,
    absolutePath: file,
    allowedRoot,
  });
}

function addVirtual(
  artifacts: InternalArtifact[],
  application: CampaignApplication,
  group: CampaignArtifactGroup,
  label: string,
  content: string | null,
  modifiedAt: string,
) {
  if (!content?.trim()) return;
  const id = artifactId(application.id, `virtual:${group}:${label}`);
  artifacts.push({
    id,
    group,
    label,
    fileName: label,
    format: "markdown",
    byteSize: Buffer.byteLength(content),
    modifiedAt,
    content: content.trim(),
  });
}

function readSmallText(file: string): string {
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile() || stat.size > MAX_TEXT_BYTES) return "";
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function contentScore(content: string, application: CampaignApplication): number {
  const normalized = normalize(content);
  const normalizedCompany = normalize(application.company);
  const normalizedRole = normalize(application.role);
  let score = 0;
  if (application.requisitionId && content.toLowerCase().includes(application.requisitionId.toLowerCase())) score += 140;
  if (application.url && content.toLowerCase().includes(application.url.toLowerCase())) score += 120;
  if (normalizedCompany && normalized.includes(normalizedCompany)) score += 15;
  if (normalizedRole && normalized.includes(normalizedRole)) score += 45;
  const roleTokens = new Set(normalizedRole.split(" ").filter((token) => token.length > 3));
  if (roleTokens.size) {
    const hits = [...roleTokens].filter((token) => normalized.includes(token)).length;
    score += Math.round((hits / roleTokens.size) * 25);
  }
  return score;
}

function bestMarkdownFile(directory: string, application: CampaignApplication): string | null {
  let best: { file: string; score: number } | null = null;
  let names: string[];
  try {
    names = fs.readdirSync(directory).filter((name) => MARKDOWN_EXTENSIONS.has(path.extname(name).toLowerCase()));
  } catch {
    return null;
  }
  for (const name of names) {
    const file = path.join(directory, name);
    const score = contentScore(readSmallText(file), application);
    if (!best || score > best.score) best = { file, score };
  }
  return best && best.score >= 40 ? best.file : null;
}

function markdownSection(markdown: string, headingPattern: RegExp): string | null {
  const lines = markdown.split(/\r?\n/);
  let start = -1;
  let level = 0;
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{2,4})\s+(.+)$/);
    if (!match || !headingPattern.test(match[2])) continue;
    start = index;
    level = match[1].length;
    break;
  }
  if (start < 0) return null;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#{1,4})\s+/);
    if (match && match[1].length <= level) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}

function resolveLinkedFile(markdown: string, reportFile: string, label: RegExp): string | null {
  for (const match of markdown.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    if (!label.test(`${match[1]} ${match[2]}`)) continue;
    return path.resolve(path.dirname(reportFile), match[2]);
  }
  return null;
}

function localPacket(application: CampaignApplication, root: string, artifacts: InternalArtifact[]) {
  const reportsDirectory = path.join(root, "reports");
  const reportFile = bestMarkdownFile(reportsDirectory, application);
  let reportNumber = "";
  let reportContent = "";
  let reportModifiedAt = new Date(0).toISOString();

  if (reportFile) {
    reportNumber = path.basename(reportFile).match(/^(\d+)/)?.[1] ?? "";
    reportContent = readSmallText(reportFile);
    reportModifiedAt = fs.statSync(/* turbopackIgnore: true */ reportFile).mtime.toISOString();
    addFile(artifacts, application, reportFile, root, "review", "Full evaluation report");

    const answers = markdownSection(reportContent, /draft application.*answer|form[- ]answer plan|application answer/i);
    const skills = markdownSection(reportContent, /role-specific skills plan/i);
    const cpt = markdownSection(reportContent, /cpt readiness/i);
    const fit = markdownSection(reportContent, /packet fit review/i);
    addVirtual(artifacts, application, "answers", "Application answers", answers, reportModifiedAt);
    addVirtual(artifacts, application, "skills", "Role-specific skills", skills, reportModifiedAt);
    addVirtual(
      artifacts,
      application,
      "review",
      "Packet fit & CPT readiness",
      [fit, cpt].filter(Boolean).join("\n\n---\n\n"),
      reportModifiedAt,
    );

    const linkedJd = resolveLinkedFile(reportContent, reportFile, /posting|jd archive/i);
    if (linkedJd) addFile(artifacts, application, linkedJd, root, "context", "Archived job posting");

    const resumeLine = reportContent.match(/^\*\*(?:Resume|PDF):\*\*\s+(.+)$/mi)?.[1]?.trim() ?? "";
    const linkedResumeMatch = resumeLine.match(/\[[^\]]*\]\(([^)]+\.pdf)\)/i);
    const linkedResume = linkedResumeMatch?.[1] ?? (resumeLine.endsWith(".pdf") ? resumeLine : "");
    if (linkedResume) {
      const base = linkedResumeMatch ? path.dirname(reportFile) : root;
      addFile(artifacts, application, path.resolve(base, linkedResume), root, "resume", "Tailored résumé");
    }
    for (const match of resumeLine.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
      if (/\.html?$/i.test(match[2]) || /\.json$/i.test(match[2])) {
        addFile(artifacts, application, path.resolve(path.dirname(reportFile), match[2]), root, "files", `Résumé ${match[1]} source`);
      }
    }

    for (const match of reportContent.matchAll(/\[([^\]]*cover[^\]]*)\]\(([^)]+\.pdf)\)/gi)) {
      addFile(artifacts, application, path.resolve(path.dirname(reportFile), match[2]), root, "cover", "Cover letter");
    }
  }

  if (reportNumber) {
    const outputDirectory = path.join(root, "output");
    let packetDirectories: string[] = [];
    try {
      packetDirectories = fs.readdirSync(outputDirectory)
        .filter((name) => name.startsWith(`${reportNumber}-`))
        .map((name) => path.join(outputDirectory, name))
        .filter((file) => fs.statSync(file).isDirectory());
    } catch {
      packetDirectories = [];
    }
    for (const directory of packetDirectories) {
      addFile(artifacts, application, path.join(directory, "cv.pdf"), root, "resume", "Tailored résumé");
      addFile(artifacts, application, path.join(directory, "cv.html"), root, "files", "Résumé HTML source");
      addFile(artifacts, application, path.join(directory, "cv.json"), root, "files", "Résumé data");
    }

    const pdfDirectory = path.join(root, "output", "pdf");
    try {
      for (const name of fs.readdirSync(pdfDirectory)) {
        if (!name.toLowerCase().endsWith(".pdf")) continue;
        if (!name.includes(reportNumber) || !/cover/i.test(name)) continue;
        addFile(artifacts, application, path.join(pdfDirectory, name), root, "cover", "Cover letter");
      }
    } catch {
      // Cover letters are optional and older packets may not have this folder.
    }

    if (!artifacts.some((artifact) => artifact.group === "context")) {
      const jdsDirectory = path.join(root, "jds");
      try {
        const name = fs.readdirSync(jdsDirectory).find((candidate) => candidate.startsWith(`${reportNumber}-`) && candidate.endsWith(".md"));
        if (name) addFile(artifacts, application, path.join(jdsDirectory, name), root, "context", "Archived job posting");
      } catch {
        // A packet can predate JD archiving; surface the absence as a warning.
      }
    }
  }

  const outreachDirectory = path.join(root, "output", "outreach");
  try {
    let bestOutreach: { file: string; score: number } | null = null;
    for (const name of fs.readdirSync(outreachDirectory)) {
      if (!name.endsWith(".md") || name.toLowerCase() === "readme.md") continue;
      const file = path.join(outreachDirectory, name);
      const score = contentScore(readSmallText(file), application);
      if (!bestOutreach || score > bestOutreach.score) bestOutreach = { file, score };
    }
    if (bestOutreach && bestOutreach.score >= 80) {
      addFile(artifacts, application, bestOutreach.file, root, "outreach", "Outreach draft");
    }
  } catch {
    // Outreach is independent from packet readiness.
  }
}

function readSources(root: string): CampaignSources {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, "data", "campaign-sources.json"), "utf8")) as CampaignSources;
  } catch {
    return {};
  }
}

function companionRoot(root: string): string | null {
  const configured = readSources(root).companionOwnership;
  if (!configured) return null;
  const ownership = path.isAbsolute(configured) ? path.normalize(configured) : path.resolve(root, configured);
  return path.resolve(path.dirname(ownership), "..");
}

function directoryMatchScore(directory: string, application: CampaignApplication): number {
  const name = normalize(path.basename(directory));
  const expected = normalize(`${application.company} ${application.role}`);
  if (name === expected) return 100;
  const tokens = new Set(expected.split(" ").filter((token) => token.length > 2));
  const hits = [...tokens].filter((token) => name.includes(token)).length;
  return tokens.size ? Math.round((hits / tokens.size) * 50) : 0;
}

function bestNamedFile(
  directory: string,
  application: CampaignApplication,
  packetSlug: string,
  prefix: string,
  extension: string,
): string | null {
  const expectedTokens = new Set(
    normalize(`${packetSlug} ${application.company} ${application.role}`)
      .split(" ")
      .filter((token) => token.length > 2),
  );
  let best: { file: string; score: number } | null = null;
  try {
    for (const name of fs.readdirSync(directory)) {
      if (!name.startsWith(prefix) || path.extname(name).toLowerCase() !== extension) continue;
      const candidateTokens = new Set(
        normalize(path.basename(name, extension).slice(prefix.length))
          .split(" ")
          .filter((token) => token.length > 2),
      );
      const hits = [...candidateTokens].filter((token) => expectedTokens.has(token)).length;
      const precision = candidateTokens.size ? hits / candidateTokens.size : 0;
      const coverage = expectedTokens.size ? hits / expectedTokens.size : 0;
      const score = Math.round(precision * 70 + coverage * 30);
      if (!best || score > best.score) best = { file: path.join(directory, name), score };
    }
  } catch {
    return null;
  }
  return best && best.score >= 40 ? best.file : null;
}

function findCompanionPacketDirectory(root: string, application: CampaignApplication): string | null {
  const parent = path.join(root, "documents", "applications");
  let directories: string[];
  try {
    directories = fs.readdirSync(parent)
      .map((name) => path.join(parent, name))
      .filter((file) => fs.statSync(file).isDirectory());
  } catch {
    return null;
  }

  let best: { directory: string; score: number } | null = null;
  for (const directory of directories) {
    let score = directoryMatchScore(directory, application);
    for (const candidate of ["job_posting.md", "fit_assessment.md", "review_checklist.md", "application_answers.txt"]) {
      score = Math.max(
        score,
        contentScore(readSmallText(path.join(/* turbopackIgnore: true */ directory, candidate)), application),
      );
    }
    if (!best || score > best.score) best = { directory, score };
  }
  return best && best.score >= 40 ? best.directory : null;
}

const COMPANY_SUFFIXES = new Set([
  "company",
  "corp",
  "corporation",
  "group",
  "holdings",
  "inc",
  "incorporated",
  "technology",
  "technologies",
]);

const ROLE_NOISE = new Set([
  "2027",
  "engineer",
  "engineering",
  "intern",
  "internship",
  "internships",
  "opportunities",
  "opportunity",
  "phd",
  "program",
  "research",
  "researcher",
  "software",
  "summer",
]);

function companyAliases(company: string): Set<string> {
  const aliases = new Set<string>();
  const parts = company.split("/").map(normalize).filter(Boolean);
  const full = normalize(company);
  if (full) aliases.add(full);
  for (const part of parts) aliases.add(part);

  for (const value of [...aliases]) {
    const tokens = value.split(" ");
    const withoutSuffix = tokens.filter((token) => !COMPANY_SUFFIXES.has(token)).join(" ");
    if (withoutSuffix) aliases.add(withoutSuffix);
    if (tokens.length >= 3) aliases.add(tokens.map((token) => token[0]).join(""));
  }
  return aliases;
}

function companyHeadingScore(company: string, headingCompany: string): number {
  const heading = normalize(headingCompany);
  if (!heading) return 0;
  const aliases = companyAliases(company);
  if (aliases.has(heading)) return 1_000;
  for (const alias of aliases) {
    if (` ${heading} `.includes(` ${alias} `) || ` ${alias} `.includes(` ${heading} `)) return 800;
  }
  return 0;
}

function roleHeadingScore(role: string, headingRole: string): number {
  const expected = normalize(role);
  const heading = normalize(headingRole);
  if (!expected || !heading) return 0;
  if (expected === heading) return 300;
  if (expected.includes(heading) || heading.includes(expected)) return 240;

  const expectedTokens = new Set(expected.split(" ").filter((token) => token.length > 2 && !ROLE_NOISE.has(token)));
  const headingTokens = new Set(heading.split(" ").filter((token) => token.length > 2 && !ROLE_NOISE.has(token)));
  const hits = [...expectedTokens].filter((token) => headingTokens.has(token)).length;
  const precision = headingTokens.size ? hits / headingTokens.size : 0;
  const coverage = expectedTokens.size ? hits / expectedTokens.size : 0;
  return Math.round(precision * 140 + coverage * 100);
}

function parseCompanionHeading(line: string): { company: string; role: string } | null {
  const heading = line.replace(/^##\s+/, "").replace(/^\d+(?:\s+and\s+\d+)?\.\s*/i, "").trim();
  const separator = heading.indexOf(":");
  if (separator < 1) return null;
  return { company: heading.slice(0, separator).trim(), role: heading.slice(separator + 1).trim() };
}

function companionOutreachSection(root: string, application: CampaignApplication): { content: string; modifiedAt: string } | null {
  const file = path.join(root, "documents", "outreach", "summer-2027-application-message-packets.md");
  const markdown = readSmallText(file);
  if (!markdown) return null;
  const lines = markdown.split(/\r?\n/);
  let best: { start: number; end: number; score: number } | null = null;
  for (let index = 0; index < lines.length; index += 1) {
    if (!/^##\s+/.test(lines[index])) continue;
    const heading = parseCompanionHeading(lines[index]);
    if (!heading) continue;
    const companyScore = companyHeadingScore(application.company, heading.company);
    if (!companyScore) continue;
    let end = index + 1;
    while (end < lines.length && !/^##\s+/.test(lines[end])) end += 1;
    const score = companyScore + roleHeadingScore(application.role, heading.role);
    if (!best || score > best.score) best = { start: index, end, score };
  }
  // A company match is mandatory. Role similarity then disambiguates employers
  // with several packets, while deliberate aliases such as MERL and Cubist are
  // derived from the canonical company name instead of weakening the boundary.
  if (!best || best.score < 1_000) return null;
  return { content: lines.slice(best.start, best.end).join("\n"), modifiedAt: fs.statSync(file).mtime.toISOString() };
}

function companionPacket(application: CampaignApplication, root: string, artifacts: InternalArtifact[]) {
  const directory = findCompanionPacketDirectory(root, application);
  if (directory) {
    const definitions: Array<[string, CampaignArtifactGroup, string]> = [
      ["job_posting.md", "context", "Archived job posting"],
      ["fit_assessment.md", "review", "Fit assessment & CPT alignment"],
      ["application_answers.txt", "answers", "Application answers"],
      ["review_checklist.md", "checklist", "Review checklist"],
    ];
    for (const [name, group, label] of definitions) {
      addFile(
        artifacts,
        application,
        path.join(/* turbopackIgnore: true */ directory, name),
        root,
        group,
        label,
      );
    }
    const packetSlug = path.basename(directory);
    addFile(artifacts, application, path.join(root, "cv", `main_${packetSlug}.pdf`), root, "resume", "Tailored résumé");
    addFile(artifacts, application, path.join(root, "cv", `main_${packetSlug}.tex`), root, "files", "Résumé LaTeX source");
    addFile(artifacts, application, path.join(root, "cover_letters", `cover_${packetSlug}.pdf`), root, "cover", "Cover letter");
    addFile(artifacts, application, path.join(root, "cover_letters", `cover_${packetSlug}.tex`), root, "files", "Cover-letter LaTeX source");

    if (!artifacts.some((artifact) => artifact.group === "resume" && artifact.format === "pdf")) {
      const fallbackResume = bestNamedFile(path.join(root, "cv"), application, packetSlug, "main_", ".pdf");
      if (fallbackResume) {
        addFile(artifacts, application, fallbackResume, root, "resume", "Tailored résumé");
        addFile(artifacts, application, fallbackResume.replace(/\.pdf$/i, ".tex"), root, "files", "Résumé LaTeX source");
      }
    }
    if (!artifacts.some((artifact) => artifact.group === "cover" && artifact.format === "pdf")) {
      const fallbackCover = bestNamedFile(path.join(root, "cover_letters"), application, packetSlug, "cover_", ".pdf");
      if (fallbackCover) {
        addFile(artifacts, application, fallbackCover, root, "cover", "Cover letter");
        addFile(artifacts, application, fallbackCover.replace(/\.pdf$/i, ".tex"), root, "files", "Cover-letter LaTeX source");
      }
    }
  }

  const outreach = companionOutreachSection(root, application);
  addVirtual(artifacts, application, "outreach", "Application-linked outreach", outreach?.content ?? null, outreach?.modifiedAt ?? new Date(0).toISOString());
}

function buildWarnings(application: CampaignApplication, artifacts: InternalArtifact[]): string[] {
  const warnings: string[] = [];
  const has = (group: CampaignArtifactGroup, format?: CampaignArtifactFormat) =>
    artifacts.some((artifact) => artifact.group === group && (!format || artifact.format === format));
  if (!has("context")) warnings.push("The archived job posting was not found; verify the live posting before staging.");
  if (!has("resume", "pdf")) warnings.push("No tailored résumé PDF was resolved for this packet.");
  if (!has("review")) warnings.push("No fit or CPT-readiness review was resolved for this packet.");
  if (application.stageKey === "packet-ready" && !has("answers")) warnings.push("The packet is marked ready, but no application-answer plan was resolved.");
  if (application.stageKey === "packet-ready" && !has("cover")) warnings.push("No separate cover-letter artifact was found; confirm whether the application accepts one.");
  return warnings;
}

function resolvePacket(applicationId: string): ResolvedPacket | null {
  const campaign = readCampaign();
  const application = campaign?.applications.find((row) => row.id === applicationId);
  if (!application) return null;
  const root = path.resolve(careerOpsRoot());
  const artifacts: InternalArtifact[] = [];
  if (application.source === "career-ops") {
    localPacket(application, root, artifacts);
  } else {
    const externalRoot = companionRoot(root);
    if (externalRoot) companionPacket(application, externalRoot, artifacts);
  }

  const groupRank: Record<CampaignArtifactGroup, number> = {
    context: 0,
    resume: 1,
    cover: 2,
    answers: 3,
    skills: 4,
    review: 5,
    checklist: 6,
    outreach: 7,
    files: 8,
  };
  artifacts.sort((a, b) => groupRank[a.group] - groupRank[b.group] || a.label.localeCompare(b.label));
  const publicArtifacts = artifacts.map(({ absolutePath: _absolutePath, allowedRoot: _allowedRoot, ...artifact }) => artifact);
  const latest = artifacts.reduce((value, artifact) => Math.max(value, Date.parse(artifact.modifiedAt) || 0), 0);
  return {
    application,
    artifacts: publicArtifacts,
    internalArtifacts: artifacts,
    warnings: buildWarnings(application, artifacts),
    refreshedAt: new Date(latest || Date.now()).toISOString(),
  };
}

export function readCampaignPacket(applicationId: string): CampaignPacket | null {
  const packet = resolvePacket(applicationId);
  if (!packet) return null;
  const { internalArtifacts: _internalArtifacts, ...publicPacket } = packet;
  return publicPacket;
}

export function findCampaignArtifact(applicationId: string, id: string): { file: string; root: string; name: string; format: CampaignArtifactFormat } | null {
  const packet = resolvePacket(applicationId);
  const artifact = packet?.internalArtifacts.find((candidate) => candidate.id === id);
  if (!artifact?.absolutePath || !artifact.allowedRoot || !realContainedFile(artifact.absolutePath, artifact.allowedRoot)) return null;
  return { file: artifact.absolutePath, root: artifact.allowedRoot, name: artifact.fileName, format: artifact.format };
}
