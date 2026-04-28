# Mode: latex — LaTeX/Overleaf CV Export

Export a tailored, ATS-optimized CV as a `.tex` file and compile it to PDF via `tectonic` or `pdflatex`.

## Pipeline

1. Read `cv.md` as source of truth
2. Read `config/profile.yml` for candidate identity and contact info
3. Ask the user for the JD if not already in context (text or URL)
4. Extract 15-20 keywords from the JD
5. Detect JD language → CV language (EN default)
6. Detect role archetype → adapt framing
7. Rewrite Professional Summary injecting JD keywords (same rules as `pdf` mode — NEVER invent skills)
8. Select top relevant projects/research items for the offer
9. Reorder experience bullets by JD relevance
10. Inject keywords naturally into existing achievements
11. Generate the `.tex` file using `templates/cv-template.tex`
12. Write to `output/cv-{candidate}-{company}-{YYYY-MM-DD}.tex`
13. Run: `node generate-latex.mjs output/cv-{candidate}-{company}-{YYYY-MM-DD}.tex output/cv-{candidate}-{company}-{YYYY-MM-DD}.pdf`
14. Report: .tex path, .pdf path, file sizes, section count, keyword coverage %

**Requires:** `tectonic` (preferred — `brew install tectonic`, auto-downloads packages) or `pdflatex` (MiKTeX / TeX Live) on PATH.

## Template Placeholders

The template at `templates/cv-template.tex` uses `{{PLACEHOLDER}}` syntax:

| Placeholder | Source / Format |
|-------------|-----------------|
| `{{NAME}}` | `profile.yml → candidate.full_name` |
| `{{HEADLINE}}` | One-line subtitle below the name (e.g., `Software Engineer | AI Researcher | DevOps & Cloud Infrastructure`). Pull from `profile.yml → narrative.headline` or build from CV header. Use `\textbar{}` between segments inside the LaTeX (the template already handles this if you pass plain pipes — escape them as `\textbar{}` in the value). |
| `{{EMAIL_URL}}` | Raw email for `mailto:` URL — must not be LaTeX-escaped (from profile.yml) |
| `{{EMAIL_DISPLAY}}` | Escaped email for display text — LaTeX-special chars like `_` must be escaped, e.g. `first\_name@example.com` |
| `{{PHONE}}` | Phone number as displayed (e.g., `540-252-8738`). If `profile.yml.phone` is empty, replace this token with `\textit{}` or remove the segment plus the leading `\textbar{}` from the header. |
| `{{LOCATION}}` | Location text (e.g., `United States` or `Fairfax, VA`) |
| `{{LINKEDIN_URL}}` | Full URL with scheme for `\href{}`: e.g. `https://linkedin.com/in/username`. If `profile.yml` stores a bare host+path (no scheme), prepend `https://` before substitution. |
| `{{LINKEDIN_DISPLAY}}` | Display text only (no scheme): `linkedin.com/in/username` |
| `{{GITHUB_URL}}` | Full URL with scheme for `\href{}`: e.g. `https://github.com/username`. If `profile.yml` stores a bare host+path, prepend `https://`. |
| `{{GITHUB_DISPLAY}}` | Display text only (no scheme): `github.com/username` |
| `{{PORTFOLIO_URL}}` | Full URL with scheme: e.g. `https://www.ahnafnafee.dev/` |
| `{{PORTFOLIO_DISPLAY}}` | Display text only (no scheme): `ahnafnafee.dev` |
| `{{SCHOLAR_LINK}}` | If the candidate has a Google Scholar profile, set this to the LaTeX snippet ` \textbar{} \href{<scholar_url>}{Google Scholar}` (with leading space + bar). Otherwise leave it as an empty string. |
| `{{KEYWORDS}}` | Comma-separated list of 15-20 ATS keywords for the PDF metadata (`pdfkeywords` field in `\hypersetup`). Mix top JD keywords with the candidate's core skills. |
| `{{SUMMARY_TEXT}}` | Professional summary paragraph customized with JD keywords + exit narrative bridge. 3-5 sentences, keyword-dense. |
| `{{SKILLS}}` | LaTeX `\textbf{Category}:` lines from `cv.md → Skills` section, separated by `\\` line breaks (see Skills format below) |
| `{{EXPERIENCE}}` | One `\role` block per role + `tightitemize` bullets — see Experience format below |
| `{{EDUCATION}}` | One `\education` block per entry + `tightitemize` bullets — see Education format below |
| `{{PROJECTS}}` | `\item \textbf{Name} --- description` lines (no `tightitemize` wrapper — the template provides one). One per Research/Project item. |

## LaTeX Content Generation Rules

### Education

Each entry becomes:

```latex
\education{Degree}{Institution --- Lab or Department}{}{City, State}
\begin{tightitemize}
    \item Research focus / honors / coursework
\end{tightitemize}
```

Notes:
- The third argument is intentionally empty `{}` — dates are not rendered (per user preference). Keep the `{}` or pass an empty string.
- For PhD: use the research-focus bullet from `cv.md`.
- For BS: use Honors and Relevant coursework bullets.

### Experience

Each role becomes:

```latex
\role{Role Title}{Company --- optional Department or Lab}{Date Range}{Location}
\begin{tightitemize}
  \item Bullet text with JD keywords injected
  \item Bullet two
  \item ...
\end{tightitemize}
```

Notes:
- Date range is rendered (e.g., `Feb 2023 -- Aug 2025` or `Aug 2025 -- Present`). Use `--` (LaTeX en-dash) between months/years.
- For multi-role tenure at the same company (e.g., CTO then SE at Dynasty 11), output one `\role` block per role.

### Projects / Research

Each project/research item becomes:

```latex
\item \textbf{Project Name} --- one-line description
```

Wrap nothing (the template provides the surrounding `\begin{tightitemize} ... \end{tightitemize}`). Just output the `\item` lines.

### Skills

Skills section format — pipe-separated values with line breaks:

```latex
\textbf{Languages:} Python, Go, Java, C++, TypeScript, JavaScript, SQL, GLSL, Bash\\
\textbf{AI / ML:} PyTorch, TensorFlow, Generative AI, Deep Learning, LLMs, MLOps\\
\textbf{Cloud \& DevOps:} AWS, Kubernetes, OpenShift, Docker, Terraform, CI/CD, GitHub Actions, Helm
```

Notes:
- Use `\\` line break at end of every line except the last.
- Escape `&` as `\&` in category headers like `Cloud \& DevOps`, `AI \& Graphics`.

## LaTeX Escaping (CRITICAL)

All text content MUST be escaped for LaTeX before insertion:

| Character | Escape |
|-----------|--------|
| `&` | `\&` |
| `%` | `\%` |
| `$` | `\$` |
| `#` | `\#` |
| `_` | `\_` |
| `{` | `\{` |
| `}` | `\}` |
| `~` | `\textasciitilde{}` |
| `^` | `\textasciicircum{}` |
| `\` | `\textbackslash{}` |
| `±` | `$\pm$` |
| `→` | `$\rightarrow$` |
| `|` (in headline) | `\textbar{}` |
| `–` (en dash) | `--` |
| `—` (em dash) | `---` |

**Exception:** Do NOT escape LaTeX commands themselves (`\role`, `\education`, `\textbf`, etc.) — only user-supplied text content.

**Exception for URLs:** Do NOT escape text inside `\href{URL}{...}` first arguments. The URL must remain raw (or RFC 3986 percent-encoded). Only escape the *display text* (second argument). For example:
```latex
\href{https://example.com/path_with_underscores}{Example\_Display}
```

## ATS Rules (same as pdf mode)

- Single-column layout (enforced by template)
- Standard section headers (canonical for ATS recognition): **Summary**, **Technical Skills**, **Work Experience**, **Education**, **Selected Projects**
- Section titles render in mixed case (no `\MakeUppercase`) for older-ATS compatibility
- UTF-8, machine-readable via `\pdfgentounicode=1`
- Keywords distributed: PDF metadata `pdfkeywords`, Summary, first bullet of each role, Skills section
- No images, no graphics; only the accent color is used for headings/links (color is stripped during ATS extraction)

## Keyword Injection Strategy

Same ethical rules as `modes/pdf.md`:
- NEVER add skills the candidate doesn't have
- Only reformulate existing experience using JD vocabulary
- Examples:
  - JD says "RAG pipelines" → reword "LLM workflows with retrieval" to "RAG pipeline design"
  - JD says "MLOps" → reword "observability, evals" to "MLOps and observability"

## Overleaf Compatibility

The generated `.tex` file uses only standard CTAN packages (no custom or bundled dependencies):

- `geometry`, `fontenc`, `inputenc`, `lmodern`, `microtype`
- `enumitem`, `titlesec`, `hyperref`, `xcolor`, `parskip`
- `glyphtounicode` (for ATS unicode mapping)

Upload the `.tex` file directly to Overleaf — compiles with no extra configuration.
