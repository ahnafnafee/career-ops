#!/usr/bin/env node
/**
 * outreach-ledger.mjs — shared, person-level outbound-contact guard.
 *
 * Two job-search workspaces can safely point at the same append-only TSV. A
 * claim is taken under an exclusive file lock before a message is previewed or
 * sent. Identity resolution prefers a LinkedIn member id, then a canonical
 * LinkedIn profile URL, then an exact normalized name + company fallback.
 *
 * The ledger is operational state only. It is not a source for CV claims or
 * candidate-facing content, and it stores message hashes rather than bodies.
 *
 * Usage:
 *   node outreach-ledger.mjs check --linkedin <url> [--name N --company C]
 *   node outreach-ledger.mjs claim --owner <task> --linkedin <url> --name N --company C
 *   node outreach-ledger.mjs transition --owner <task> --linkedin <url> --state drafted
 *   node outreach-ledger.mjs transition --owner <task> --linkedin <url> --state previewed --message-sha256 <hash>
 *   node outreach-ledger.mjs transition --owner <task> --linkedin <url> --state sent --message-sha256 <hash> --approval-ref <ref>
 *   node outreach-ledger.mjs list [--summary]
 *
 * Set CAREER_OPS_OUTREACH_LEDGER to share a different absolute ledger path.
 */

import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { createHash, randomUUID } from 'crypto';
import { dirname, join, resolve } from 'path';
import { getCareerOpsRoot } from './path-resolver.mjs';

const DATA_ROOT = getCareerOpsRoot();
const DEFAULT_LEDGER = join(DATA_ROOT, 'data', 'outreach-ledger.tsv');
const HEADER = [
  '# Shared cross-task outreach ledger. Third-party PII; gitignored by data/*.',
  '# timestamp\tevent_id\tperson_key\tmember_id\tlinkedin_url\tname\tcompany\towner_task\tchannel\tcontact_type\tapplication_ref\tstate\tmessage_sha256\tapproval_ref\tnotes',
  '',
].join('\n');

const VALID_COMMANDS = new Set(['check', 'claim', 'transition', 'list', 'help']);
const VALID_STATES = new Set([
  'claimed',
  'drafted',
  'previewed',
  'sent',
  'replied',
  'released',
  'do-not-contact',
  'unknown-after-attempt',
]);
const VALID_CHANNELS = new Set([
  'linkedin-connection',
  'linkedin-dm',
  'linkedin-inmail',
  'email',
  'other',
]);
const VALID_CONTACT_TYPES = new Set([
  'recruiter',
  'hiring-manager',
  'peer',
  'interviewer',
  'other',
]);
const ALLOWED_TRANSITIONS = new Map([
  ['claimed', new Set(['drafted', 'previewed', 'released', 'do-not-contact', 'unknown-after-attempt'])],
  ['drafted', new Set(['previewed', 'released', 'do-not-contact', 'unknown-after-attempt'])],
  ['previewed', new Set(['drafted', 'sent', 'released', 'do-not-contact', 'unknown-after-attempt'])],
  ['unknown-after-attempt', new Set(['sent', 'released', 'do-not-contact'])],
  ['sent', new Set(['replied', 'do-not-contact'])],
  ['replied', new Set(['do-not-contact'])],
  ['released', new Set([])],
  ['do-not-contact', new Set([])],
]);

const USAGE = `Usage:
  node outreach-ledger.mjs check (--linkedin URL | --member-id ID | --name N --company C)
  node outreach-ledger.mjs claim --owner TASK [identity flags] [metadata flags]
  node outreach-ledger.mjs transition --owner TASK [identity flags] --state STATE [metadata flags]
  node outreach-ledger.mjs list [--owner TASK] [--summary]

Identity flags:
  --linkedin URL       LinkedIn /in/ profile URL (preferred)
  --member-id ID       Stable LinkedIn/GTM member id (strongest)
  --name NAME          Contact name; required with --company for fallback matching
  --company COMPANY    Current company; required with --name for fallback matching

Metadata flags:
  --channel CHANNEL    linkedin-connection|linkedin-dm|linkedin-inmail|email|other
  --contact-type TYPE  recruiter|hiring-manager|peer|interviewer|other
  --application REF    Job/report reference
  --message-sha256 H   SHA-256 of the exact previewed/sent text
  --approval-ref REF   Fresh recipient-specific approval reference (required for sent/unknown)
  --notes TEXT         Short operational note
  --ledger PATH        Override the shared ledger path for this invocation
  --summary            Human-readable list output`;

function fail(message, exitCode = 1) {
  const error = new Error(message);
  error.exitCode = exitCode;
  throw error;
}

function clean(value) {
  return String(value ?? '').replace(/[\t\r\n]+/g, ' ').trim().replace(/\s+/g, ' ');
}

function normalizedWords(value) {
  return clean(value).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

function shortHash(value) {
  return createHash('sha256').update(String(value), 'utf8').digest('hex').slice(0, 24);
}

export function normalizeLinkedinUrl(raw) {
  if (!clean(raw)) return '';
  const withScheme = /^https?:\/\//i.test(clean(raw)) ? clean(raw) : `https://${clean(raw)}`;
  let parsed;
  try {
    parsed = new URL(withScheme);
  } catch {
    fail(`Invalid LinkedIn URL: ${raw}`);
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) {
    fail(`Expected a linkedin.com profile URL, got: ${raw}`);
  }
  const match = parsed.pathname.match(/^\/in\/([^/]+)\/?$/i);
  if (!match) fail(`Expected a LinkedIn /in/<profile> URL, got: ${raw}`);
  const slug = decodeURIComponent(match[1]).trim().toLowerCase();
  if (!slug) fail(`LinkedIn profile slug is empty: ${raw}`);
  return `https://www.linkedin.com/in/${encodeURIComponent(slug)}`;
}

function parseArgs(argv) {
  const command = argv[0] || 'list';
  if (!VALID_COMMANDS.has(command) || command === 'help') return { command, flags: {} };
  const flags = {};
  for (let i = 1; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith('--')) fail(`Unexpected argument: ${token}\n\n${USAGE}`);
    const key = token.slice(2);
    if (key === 'summary') {
      flags[key] = true;
      continue;
    }
    const value = argv[++i];
    if (value === undefined || value.startsWith('--')) fail(`Missing value for --${key}`);
    flags[key] = clean(value);
  }
  return { command, flags };
}

function ledgerPath(flags) {
  return resolve(flags.ledger || process.env.CAREER_OPS_OUTREACH_LEDGER || DEFAULT_LEDGER);
}

function parseEvents(content) {
  const events = [];
  let lineNo = 0;
  for (const raw of String(content || '').split('\n')) {
    lineNo++;
    const line = raw.replace(/\r$/, '');
    if (!line.trim() || line.trimStart().startsWith('#')) continue;
    const cells = line.split('\t');
    if (cells.length !== 15) fail(`Malformed outreach ledger row ${lineNo}: expected 15 columns, found ${cells.length}`);
    const [
      timestamp,
      eventId,
      personKey,
      memberId,
      linkedinUrl,
      name,
      company,
      ownerTask,
      channel,
      contactType,
      applicationRef,
      state,
      messageSha256,
      approvalRef,
      notes,
    ] = cells.map(clean);
    if (!timestamp || !eventId || !personKey || !ownerTask || !VALID_STATES.has(state)) {
      fail(`Malformed outreach ledger row ${lineNo}: required field or state is invalid`);
    }
    events.push({
      timestamp,
      eventId,
      personKey,
      memberId,
      linkedinUrl,
      name,
      company,
      ownerTask,
      channel,
      contactType,
      applicationRef,
      state,
      messageSha256,
      approvalRef,
      notes,
    });
  }
  return events;
}

function identityFrom(flags) {
  const memberId = normalizedWords(flags['member-id']);
  const linkedinUrl = normalizeLinkedinUrl(flags.linkedin || '');
  const name = clean(flags.name);
  const company = clean(flags.company);
  if (!memberId && !linkedinUrl && !(name && company)) {
    fail('Provide --member-id, --linkedin, or both --name and --company');
  }
  if ((name && !company) || (!name && company)) fail('--name and --company must be supplied together');
  return { memberId, linkedinUrl, name, company };
}

function identityKey(identity) {
  if (identity.memberId) return `liid:${shortHash(identity.memberId)}`;
  if (identity.linkedinUrl) return `li:${shortHash(identity.linkedinUrl)}`;
  return `nc:${shortHash(`${normalizedWords(identity.name)}\0${normalizedWords(identity.company)}`)}`;
}

function resolveIdentity(events, identity) {
  const directKeys = new Set();
  if (identity.memberId) {
    for (const event of events) if (event.memberId && normalizedWords(event.memberId) === identity.memberId) directKeys.add(event.personKey);
  }
  if (identity.linkedinUrl) {
    for (const event of events) if (event.linkedinUrl === identity.linkedinUrl) directKeys.add(event.personKey);
  }
  if (directKeys.size > 1) return { ambiguous: true, keys: [...directKeys], reason: 'member-id and URL resolve to different people' };
  if (directKeys.size === 1) return { ambiguous: false, personKey: [...directKeys][0] };

  if (identity.name && identity.company) {
    const name = normalizedWords(identity.name);
    const company = normalizedWords(identity.company);
    const fallbackKeys = new Set();
    for (const event of events) {
      if (normalizedWords(event.name) === name && normalizedWords(event.company) === company) fallbackKeys.add(event.personKey);
    }
    if (fallbackKeys.size > 1) return { ambiguous: true, keys: [...fallbackKeys], reason: 'name + company matches multiple profile records' };
    if (fallbackKeys.size === 1) return { ambiguous: false, personKey: [...fallbackKeys][0] };
  }
  return { ambiguous: false, personKey: identityKey(identity) };
}

function latestFor(events, personKey) {
  for (let i = events.length - 1; i >= 0; i--) if (events[i].personKey === personKey) return events[i];
  return null;
}

function publicEvent(event) {
  if (!event) return null;
  return {
    personKey: event.personKey,
    linkedinUrl: event.linkedinUrl || null,
    name: event.name || null,
    company: event.company || null,
    ownerTask: event.ownerTask,
    channel: event.channel || null,
    contactType: event.contactType || null,
    applicationRef: event.applicationRef || null,
    state: event.state,
    timestamp: event.timestamp,
    messageSha256: event.messageSha256 || null,
    approvalRef: event.approvalRef || null,
    notes: event.notes || null,
  };
}

function eventLine(event) {
  return [
    event.timestamp,
    event.eventId,
    event.personKey,
    event.memberId,
    event.linkedinUrl,
    event.name,
    event.company,
    event.ownerTask,
    event.channel,
    event.contactType,
    event.applicationRef,
    event.state,
    event.messageSha256,
    event.approvalRef,
    event.notes,
  ].map(clean).join('\t');
}

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function acquireLock(file) {
  const lock = `${file}.lock`;
  const deadline = Date.now() + 10_000;
  mkdirSync(dirname(file), { recursive: true });
  while (true) {
    try {
      const fd = openSync(lock, 'wx');
      writeFileSync(fd, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }), 'utf8');
      closeSync(fd);
      return lock;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      try {
        if (Date.now() - statSync(lock).mtimeMs > 5 * 60_000) {
          unlinkSync(lock);
          continue;
        }
      } catch (statError) {
        if (statError.code === 'ENOENT') continue;
        throw statError;
      }
      if (Date.now() >= deadline) fail(`Timed out waiting for outreach ledger lock: ${lock}`, 5);
      sleep(40);
    }
  }
}

function releaseLock(lock) {
  try {
    unlinkSync(lock);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

function readLedger(file) {
  return existsSync(file) ? readFileSync(file, 'utf8') : HEADER;
}

function atomicWrite(file, content) {
  mkdirSync(dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(temp, content, 'utf8');
  try {
    renameSync(temp, file);
  } catch (error) {
    try { unlinkSync(temp); } catch { /* best effort */ }
    throw error;
  }
}

function buildEvent({ flags, identity, personKey, state, prior = null }) {
  const channel = flags.channel || prior?.channel || 'linkedin-connection';
  const contactType = flags['contact-type'] || prior?.contactType || 'other';
  if (!VALID_CHANNELS.has(channel)) fail(`Invalid --channel: ${channel}`);
  if (!VALID_CONTACT_TYPES.has(contactType)) fail(`Invalid --contact-type: ${contactType}`);
  return {
    timestamp: new Date().toISOString(),
    eventId: randomUUID(),
    personKey,
    memberId: identity.memberId || prior?.memberId || '',
    linkedinUrl: identity.linkedinUrl || prior?.linkedinUrl || '',
    name: identity.name || prior?.name || '',
    company: identity.company || prior?.company || '',
    ownerTask: flags.owner,
    channel,
    contactType,
    applicationRef: flags.application || prior?.applicationRef || '',
    state,
    messageSha256: (flags['message-sha256'] || prior?.messageSha256 || '').toLowerCase(),
    approvalRef: flags['approval-ref'] || '',
    notes: flags.notes || '',
  };
}

function appendEvent(file, content, event) {
  const base = content.endsWith('\n') ? content : `${content}\n`;
  atomicWrite(file, `${base}${eventLine(event)}\n`);
}

function checkCommand(file, flags) {
  const identity = identityFrom(flags);
  const events = parseEvents(readLedger(file));
  const resolution = resolveIdentity(events, identity);
  if (resolution.ambiguous) {
    console.log(JSON.stringify({ status: 'ambiguous', available: false, ...resolution }, null, 2));
    process.exitCode = 4;
    return;
  }
  const current = latestFor(events, resolution.personKey);
  const available = !current || current.state === 'released';
  console.log(JSON.stringify({ status: available ? 'available' : 'blocked', available, current: publicEvent(current) }, null, 2));
  if (!available) process.exitCode = 3;
}

function claimCommand(file, flags) {
  if (!flags.owner) fail('--owner is required for claim');
  const identity = identityFrom(flags);
  const lock = acquireLock(file);
  try {
    const content = readLedger(file);
    const events = parseEvents(content);
    const resolution = resolveIdentity(events, identity);
    if (resolution.ambiguous) fail(`Ambiguous identity: ${resolution.reason}`, 4);
    const current = latestFor(events, resolution.personKey);
    if (current && current.state !== 'released') {
      const sameOwner = current.ownerTask === flags.owner;
      console.log(JSON.stringify({
        status: sameOwner ? 'already-owned' : 'blocked-by-other-task',
        claimed: false,
        current: publicEvent(current),
      }, null, 2));
      process.exitCode = sameOwner ? 0 : 3;
      return;
    }
    const event = buildEvent({ flags, identity, personKey: resolution.personKey, state: 'claimed', prior: current });
    appendEvent(file, content, event);
    console.log(JSON.stringify({ status: 'claimed', claimed: true, current: publicEvent(event) }, null, 2));
  } finally {
    releaseLock(lock);
  }
}

function transitionCommand(file, flags) {
  if (!flags.owner) fail('--owner is required for transition');
  if (!VALID_STATES.has(flags.state) || flags.state === 'claimed') {
    fail('--state must be drafted, previewed, sent, replied, released, do-not-contact, or unknown-after-attempt');
  }
  const identity = identityFrom(flags);
  const hash = (flags['message-sha256'] || '').toLowerCase();
  if (['previewed', 'sent', 'unknown-after-attempt'].includes(flags.state) && !/^[a-f0-9]{64}$/.test(hash)) {
    fail(`--message-sha256 must be a 64-character SHA-256 for state ${flags.state}`);
  }
  if (['sent', 'unknown-after-attempt'].includes(flags.state) && !flags['approval-ref']) {
    fail(`--approval-ref is required for state ${flags.state}`);
  }

  const lock = acquireLock(file);
  try {
    const content = readLedger(file);
    const events = parseEvents(content);
    const resolution = resolveIdentity(events, identity);
    if (resolution.ambiguous) fail(`Ambiguous identity: ${resolution.reason}`, 4);
    const current = latestFor(events, resolution.personKey);
    if (!current) fail('No claim exists for this person; run claim before drafting, previewing, or sending', 3);
    if (current.ownerTask !== flags.owner) fail(`Person is owned by ${current.ownerTask}; record an explicit handoff before continuing`, 3);
    if (current.state === flags.state) {
      const refreshed = buildEvent({ flags, identity, personKey: resolution.personKey, state: flags.state, prior: current });
      const mutableFields = [
        'memberId',
        'linkedinUrl',
        'name',
        'company',
        'channel',
        'contactType',
        'applicationRef',
        'messageSha256',
        'approvalRef',
        'notes',
      ];
      const metadataChanged = mutableFields.some((field) => refreshed[field] !== current[field]);
      if (metadataChanged) {
        appendEvent(file, content, refreshed);
        console.log(JSON.stringify({ status: 'refreshed', changed: true, current: publicEvent(refreshed) }, null, 2));
        return;
      }
      console.log(JSON.stringify({ status: 'already-in-state', changed: false, current: publicEvent(current) }, null, 2));
      return;
    }
    if (!ALLOWED_TRANSITIONS.get(current.state)?.has(flags.state)) {
      fail(`Invalid transition: ${current.state} -> ${flags.state}`, 3);
    }
    const event = buildEvent({ flags, identity, personKey: resolution.personKey, state: flags.state, prior: current });
    appendEvent(file, content, event);
    console.log(JSON.stringify({ status: 'transitioned', changed: true, previousState: current.state, current: publicEvent(event) }, null, 2));
  } finally {
    releaseLock(lock);
  }
}

function listCommand(file, flags) {
  const events = parseEvents(readLedger(file));
  const current = new Map();
  for (const event of events) current.set(event.personKey, event);
  let rows = [...current.values()];
  if (flags.owner) rows = rows.filter(row => row.ownerTask === flags.owner);
  rows.sort((a, b) => `${a.company}\0${a.name}`.localeCompare(`${b.company}\0${b.name}`));
  if (!flags.summary) {
    console.log(JSON.stringify({ ledger: file, total: rows.length, contacts: rows.map(publicEvent) }, null, 2));
    return;
  }
  if (!rows.length) {
    console.log('No outreach claims recorded.');
    return;
  }
  console.log('State\tOwner\tCompany\tName\tLinkedIn');
  for (const row of rows) console.log([row.state, row.ownerTask, row.company || '-', row.name || '-', row.linkedinUrl || '-'].join('\t'));
}

function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (command === 'help' || !VALID_COMMANDS.has(command)) {
    console.log(USAGE);
    return;
  }
  const file = ledgerPath(flags);
  if (command === 'check') return checkCommand(file, flags);
  if (command === 'claim') return claimCommand(file, flags);
  if (command === 'transition') return transitionCommand(file, flags);
  return listCommand(file, flags);
}

try {
  main();
} catch (error) {
  console.error(JSON.stringify({ status: 'error', error: error.message }, null, 2));
  process.exitCode = error.exitCode || 1;
}
