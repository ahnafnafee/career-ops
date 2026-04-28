#!/usr/bin/env node

/**
 * filter-pipeline.mjs — Filter pipeline.md to US-friendly, sponsorship-compatible roles
 *
 * Re-hits Greenhouse / Ashby / Lever APIs to enrich each pending URL with a
 * location, then filters data/pipeline.md by:
 *   - Location: US-based or Remote-with-US-coverage
 *   - Sponsorship: drops US Government / Clearance-required postings
 *   - Role type: drops pure sales roles (AE, BDR, Sales Trainer, etc.)
 *
 * Survivors are ranked by archetype fit (research / infra / SRE = tier 1;
 * FDE / Solutions / AI Engineer = tier 2; rest = tier 3).
 *
 * Outputs:
 *   - data/pipeline.md rewritten with the top N prioritized
 *   - data/pipeline-archive.md with everything filtered out (for review)
 *
 * Usage:
 *   node filter-pipeline.mjs            # default top 20
 *   node filter-pipeline.mjs --top 30   # pick a different cutoff
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import yaml from 'js-yaml';

const PORTALS_PATH = 'portals.yml';
const PIPELINE_PATH = 'data/pipeline.md';
const ARCHIVE_PATH = 'data/pipeline-archive.md';
const TOP_N = parseInt(process.argv.find(a => a.startsWith('--top='))?.split('=')[1]
  || (process.argv.indexOf('--top') >= 0 ? process.argv[process.argv.indexOf('--top') + 1] : '20'));

const FETCH_TIMEOUT_MS = 10_000;
const CONCURRENCY = 10;

// ── Filter regexes ───────────────────────────────────────────────────

const US_LOCATIONS = /\b(United States|USA|U\.S\.A?\.?|North America|NYC|New York|California|San Francisco|Bay Area|Seattle|Austin|Boston|Washington,? ?D\.?C\.?|Chicago|Atlanta|Denver|Los Angeles|Texas|Virginia|Massachusetts|Illinois|Florida|Colorado|Pennsylvania|Oregon|Maryland|Minnesota|Michigan|North Carolina|Georgia|Arizona|Utah|Ohio|New Jersey|Connecticut|Tennessee|Missouri|Wisconsin|Indiana|Nevada|Idaho|Alabama|Iowa|Arkansas|Kansas|Oklahoma|Kentucky|Louisiana|South Carolina|Mississippi|West Virginia|Vermont|Maine|Rhode Island|New Hampshire|Delaware|Montana|Wyoming|North Dakota|South Dakota|Nebraska|Hawaii|Alaska|Palo Alto|Mountain View|Cupertino|San Jose|San Diego|Oakland|Sacramento|Portland|Phoenix|Dallas|Houston|Miami|Tampa|Orlando|Charlotte|Raleigh|Durham|Pittsburgh|Philadelphia|Detroit|Cleveland|Columbus|Indianapolis|Memphis|Nashville|Las Vegas|Salt Lake City|Honolulu|Anchorage|Brooklyn|Manhattan|Bronx|Queens|Staten Island)\b/i;
const US_STATE_CODES = /(?:^|[\s,(])(NY|NJ|CA|MA|WA|TX|VA|IL|FL|CO|PA|OR|MD|MN|MI|NC|GA|AZ|UT|OH|CT|TN|MO|WI|IN|NV|ID|AL|IA|AR|KS|OK|KY|LA|SC|MS|WV|VT|ME|RI|NH|DE|MT|WY|ND|SD|NE|HI|AK|DC)(?:[\s,)]|$)/;

const NON_US_CITIES = /\b(Paris|London|Berlin|Dublin|Stockholm|Tokyo|Sydney|Singapore|Madrid|Barcelona|Amsterdam|Munich|Munchen|München|Zurich|Zürich|Lisbon|Bangalore|Mumbai|Delhi|Beijing|Shanghai|Toronto|Vancouver|Montreal|Ho Chi Minh|Manila|Hong Kong|Seoul|Tel Aviv|Cologne|Köln|Heidelberg|Freiburg|Lausanne|Athens|Oslo|Helsinki|Warsaw|Vilnius|Casablanca|Marseille|Düsseldorf|Dusseldorf|Hamburg|Frankfurt|Vienna|Wien|Rome|Roma|Milan|Milano|Brussels|Antwerp|Geneva|Genève|Edinburgh|Manchester|Bristol|Cambridge|Oxford|Glasgow|Belfast|Cork|Galway|Lyon|Toulouse|Nice|Strasbourg|Nantes|Bordeaux|Tallinn|Riga|Prague|Budapest|Bucharest|Sofia|Ljubljana|Krakow|Gdansk|Wroclaw|Poznan|Reykjavik|Copenhagen|Aarhus|Malmö|Goteborg|Bergen|Trondheim|Tampere|Espoo|Athens|Thessaloniki|Istanbul|Ankara|Cairo|Lagos|Nairobi|Cape Town|Johannesburg|Dubai|Abu Dhabi|Riyadh|Doha|Mexico City|São Paulo|Sao Paulo|Rio de Janeiro|Buenos Aires|Santiago|Lima|Bogotá|Bogota|Medellín|Caracas|Bangkok|Jakarta|Kuala Lumpur|Hanoi|Tashkent|Karachi|Lahore|Islamabad|Dhaka|Colombo|Kathmandu)\b/i;

const NON_US_COUNTRIES = /\b(United Kingdom|UK|U\.K\.|England|Scotland|Wales|Ireland|Germany|Deutschland|France|Spain|Italy|Italia|Portugal|Netherlands|Belgium|Switzerland|Schweiz|Suisse|Austria|Österreich|Sweden|Sverige|Norway|Norge|Denmark|Danmark|Finland|Iceland|Poland|Czech Republic|Czechia|Hungary|Romania|Bulgaria|Greece|Türkiye|Turkey|Russia|Ukraine|Belarus|Estonia|Latvia|Lithuania|Slovakia|Slovenia|Croatia|Serbia|Bosnia|Albania|Macedonia|Australia|New Zealand|Japan|China|India|Pakistan|Bangladesh|Sri Lanka|Vietnam|Thailand|Indonesia|Malaysia|Philippines|South Korea|North Korea|Taiwan|Hong Kong|Singapore|Israel|Palestine|Lebanon|Jordan|Saudi Arabia|UAE|Qatar|Kuwait|Bahrain|Oman|Yemen|Iraq|Iran|Egypt|Morocco|Tunisia|Algeria|Libya|Sudan|Ethiopia|Kenya|Tanzania|Uganda|Rwanda|Nigeria|Ghana|Senegal|South Africa|Mexico|Brazil|Argentina|Chile|Colombia|Peru|Venezuela|Uruguay|Paraguay|Ecuador|Bolivia|Cuba|Dominican Republic|Jamaica|Trinidad|Costa Rica|Panama|Guatemala|Honduras|El Salvador|Nicaragua|Canada|Iceland|Greenland)\b/i;

// Sponsorship blockers — patterns that strongly indicate the role requires
// US citizenship / permanent residency / active clearance (no H-1B sponsorship).
const SPONSOR_BLOCKERS = /\b(U\.?S\.? Government|US Gov\b|UK Government|Department of Defense|DoD\b|Federal\b|Public Sector(?!\s+Cloud)|Public Trust|Clearance|Cleared\b|Top Secret|TS\/SCI|TS\s?SCI|SCI Clearance|Secret Clearance|FedRAMP|U\.?S\.? Citizen|U\.?S\.? Citizenship|U\.?S\.? Person\b|U\.?S\.? Persons\b|Polygraph|Counter[- ]?Intelligence|Intelligence Community|National Security|ITAR|Defense\b|Warp Speed)\b/i;

const SALES_ONLY = /\b(Account Executive|Account Manager|Sales Development|Business Development(?! Manager Engineering)|BDR|SDR|Sales Trainer|Sales Engineer\b|Channel Partner|Pre-Sales|Pre Sales|Government Affairs|Music Editor|Editorial|Content Writer|Copywriter|Music Lead|AI Deployment Strategist|Designer\b|Recruit(?:er|ing)|People (Partner|Operations)|HR Business Partner|Office Manager|Executive Assistant|Communications Manager|Brand Manager|Marketing Manager|Growth Marketing|Demand Generation|PR Manager|Talent Acquisition|Total Rewards|Compensation Analyst|Finance Manager|Controller|Treasury|Tax Manager|Payroll|Procurement|Buyer|Supply Chain|Logistics|Warehouse|Driver|Customer Success Manager|Customer Support Lead|Onboarding Specialist|Implementation Manager|Documentation Manager|Technical Writer|Trainer\b|Curriculum Designer|Instructional Designer|Voice Producer|Podcast Producer|Music Producer|Editor\b|Copy Editor|UX Researcher\b)\b/i;

const TIER1 = /\b(AI Researcher|ML Researcher|Research Scientist|Research Engineer|Applied Research|Applied Scientist|AI Infrastructure|ML Infrastructure|ML Platform|AI Platform|Site Reliability|Reliability Engineer|SRE|DevOps|DevSecOps)\b/i;
const TIER2 = /\b(Senior Platform Engineer|Cloud Engineer|Cloud Infrastructure|Infrastructure Engineer|Forward Deployed|Deployed Engineer|Solutions Architect|Solutions Engineer|Customer Engineer|AI Engineer|ML Engineer|Machine Learning Engineer|LLM Engineer|Applied AI)\b/i;

// ── API detection ────────────────────────────────────────────────────

function detectApi(company) {
  if (company.api && company.api.includes('greenhouse')) {
    return { type: 'greenhouse', url: company.api };
  }
  const url = company.careers_url || '';
  const ashbyMatch = url.match(/jobs\.ashbyhq\.com\/([^/?#]+)/);
  if (ashbyMatch) {
    return {
      type: 'ashby',
      url: `https://api.ashbyhq.com/posting-api/job-board/${ashbyMatch[1]}?includeCompensation=true`,
    };
  }
  const leverMatch = url.match(/jobs\.lever\.co\/([^/?#]+)/);
  if (leverMatch) {
    return { type: 'lever', url: `https://api.lever.co/v0/postings/${leverMatch[1]}` };
  }
  const ghEuMatch = url.match(/job-boards(?:\.eu)?\.greenhouse\.io\/([^/?#]+)/);
  if (ghEuMatch && !company.api) {
    return {
      type: 'greenhouse',
      url: `https://boards-api.greenhouse.io/v1/boards/${ghEuMatch[1]}/jobs`,
    };
  }
  return null;
}

function parseGreenhouse(json) {
  return (json.jobs || []).map(j => ({
    url: j.absolute_url || '',
    location: j.location?.name || '',
  }));
}
function parseAshby(json) {
  return (json.jobs || []).map(j => ({
    url: j.jobUrl || '',
    location: j.location || (j.locationIds || []).map(() => '').join('') || '',
  }));
}
function parseLever(json) {
  if (!Array.isArray(json)) return [];
  return json.map(j => ({
    url: j.hostedUrl || j.applyUrl || '',
    location: j.categories?.location || '',
  }));
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'career-ops-filter/1.0' } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function buildLocationMap() {
  const portals = yaml.load(readFileSync(PORTALS_PATH, 'utf-8'));
  const companies = (portals.tracked_companies || []).filter(c => c.enabled);
  const map = new Map();

  // Concurrency-limited fetch
  const queue = companies.map(c => ({ company: c, api: detectApi(c) })).filter(x => x.api);
  let idx = 0;
  async function worker() {
    while (idx < queue.length) {
      const i = idx++;
      const { company, api } = queue[i];
      const json = await fetchWithTimeout(api.url);
      if (!json) continue;
      const jobs = api.type === 'greenhouse' ? parseGreenhouse(json)
        : api.type === 'ashby' ? parseAshby(json)
        : api.type === 'lever' ? parseLever(json)
        : [];
      for (const j of jobs) {
        if (j.url) map.set(j.url, j.location);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return map;
}

// ── Pipeline parsing ─────────────────────────────────────────────────

function parsePipeline() {
  const text = readFileSync(PIPELINE_PATH, 'utf-8');
  const entries = [];
  // Match `- [ ] URL | COMPANY | TITLE` and stop title at the next ` | ` (location)
  for (const match of text.matchAll(/^- \[ \] (https?:\/\/\S+) \| ([^|]+) \| ([^|]+?)(?:\s\|\s.*)?$/gm)) {
    entries.push({
      url: match[1].trim(),
      company: match[2].trim(),
      title: match[3].trim(),
    });
  }
  return entries;
}

// ── Classification ───────────────────────────────────────────────────

function classifyLocation(loc) {
  if (!loc) return 'unknown';
  const trimmed = loc.trim();
  if (NON_US_CITIES.test(trimmed)) return 'non-us';
  if (NON_US_COUNTRIES.test(trimmed)) return 'non-us';
  if (US_LOCATIONS.test(trimmed)) return 'us';
  if (US_STATE_CODES.test(trimmed)) return 'us';
  if (/^remote\b/i.test(trimmed) || /\bremote\b/i.test(trimmed)) return 'remote';
  return 'unknown';
}

function rank(title) {
  if (TIER1.test(title)) return 1;
  if (TIER2.test(title)) return 2;
  return 3;
}

// ── Main ─────────────────────────────────────────────────────────────

console.log('Re-fetching API data for location enrichment...');
const locMap = await buildLocationMap();
console.log(`  Got ${locMap.size} URL→location mappings`);

// Companies disabled in portals.yml — drop their entries entirely
const portalsForDisabled = yaml.load(readFileSync(PORTALS_PATH, 'utf-8'));
const disabledCompanies = new Set(
  (portalsForDisabled.tracked_companies || [])
    .filter(c => c.enabled === false)
    .map(c => c.name)
);

const entries = parsePipeline();
console.log(`Parsed ${entries.length} pipeline entries`);

const enriched = entries.map(e => {
  const location = locMap.get(e.url) || '';
  return {
    ...e,
    location,
    locClass: classifyLocation(location),
    companyDisabled: disabledCompanies.has(e.company),
    sponsorBlocked: SPONSOR_BLOCKERS.test(e.title) || SPONSOR_BLOCKERS.test(location),
    salesOnly: SALES_ONLY.test(e.title),
    tier: rank(e.title),
  };
});

const dropReasons = { 'non-us': 0, 'sponsor': 0, 'sales': 0, 'company-disabled': 0 };
const filtered = [];
const archived = [];

for (const e of enriched) {
  if (e.companyDisabled) { archived.push({ ...e, dropReason: 'company-disabled' }); dropReasons['company-disabled']++; continue; }
  if (e.sponsorBlocked) { archived.push({ ...e, dropReason: 'sponsor-blocked' }); dropReasons.sponsor++; continue; }
  if (e.salesOnly) { archived.push({ ...e, dropReason: 'sales-only' }); dropReasons.sales++; continue; }
  if (e.locClass === 'non-us') { archived.push({ ...e, dropReason: 'non-us location' }); dropReasons['non-us']++; continue; }
  filtered.push(e);
}

filtered.sort((a, b) => a.tier - b.tier || a.company.localeCompare(b.company));

// Diversify top N: cap at 2 per company to surface a mix of employers
const PER_COMPANY_CAP = 2;
const top = [];
const overflow = [];
const perCompanyCount = new Map();
for (const e of filtered) {
  const c = perCompanyCount.get(e.company) || 0;
  if (c < PER_COMPANY_CAP && top.length < TOP_N) {
    top.push(e);
    perCompanyCount.set(e.company, c + 1);
  } else {
    overflow.push(e);
  }
}
const rest = overflow;

// ── Write filtered pipeline.md ───────────────────────────────────────

const formatEntry = e =>
  `- [ ] ${e.url} | ${e.company} | ${e.title}${e.location ? ` | ${e.location}` : ''}`;

const newPipeline = `# Pipeline Inbox

URLs added here are processed by \`/career-ops pipeline\`.

Filtered ${entries.length} → ${filtered.length} (US-friendly, sponsorship-compatible, non-sales)
Top ${top.length} surfaced first; remaining ${rest.length} are lower-priority.

## Pending

### Top ${top.length} — Tier 1/2 (Research / Infra / SRE / FDE / Applied AI)

${top.map(formatEntry).join('\n')}

### Lower priority — also US-friendly, but lower fit

${rest.map(formatEntry).join('\n')}

## Processed
`;

writeFileSync(PIPELINE_PATH, newPipeline);

// ── Write archive ────────────────────────────────────────────────────

const archiveContent = `# Pipeline Archive

These ${archived.length} entries were filtered out by \`filter-pipeline.mjs\`.

| Reason | Count |
|--------|-------|
| Non-US location | ${dropReasons['non-us']} |
| Sponsorship-blocked (US Gov / Clearance / US-Person) | ${dropReasons.sponsor} |
| Sales-adjacent role | ${dropReasons.sales} |
| Company disabled in portals.yml | ${dropReasons['company-disabled']} |

If any of these turn out to be relevant, copy them back to \`data/pipeline.md\` manually.

---

${archived.map(e => `- ${e.url} | ${e.company} | ${e.title} | ${e.location || '(unknown)'} | drop: ${e.dropReason}`).join('\n')}
`;

writeFileSync(ARCHIVE_PATH, archiveContent);

// ── Console summary ──────────────────────────────────────────────────

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Filter Result`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Total entries:                ${entries.length}`);
console.log(`Dropped — company disabled:   ${dropReasons['company-disabled']}`);
console.log(`Dropped — non-US:             ${dropReasons['non-us']}`);
console.log(`Dropped — sponsor block:      ${dropReasons.sponsor}`);
console.log(`Dropped — sales-only:         ${dropReasons.sales}`);
console.log(`Kept:                         ${filtered.length}`);
console.log(`  Tier 1 (research/infra/SRE): ${filtered.filter(e => e.tier === 1).length}`);
console.log(`  Tier 2 (FDE/SE/AI Eng):      ${filtered.filter(e => e.tier === 2).length}`);
console.log(`  Tier 3 (other):              ${filtered.filter(e => e.tier === 3).length}`);
console.log(`\nTop ${top.length}:`);
for (const e of top) {
  console.log(`  [T${e.tier}] ${e.title} @ ${e.company} (${e.location || '?'})`);
}
console.log(`\n→ data/pipeline.md updated`);
console.log(`→ ${archived.length} entries moved to data/pipeline-archive.md`);
