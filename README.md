# System Dossier — Ishaan Kumar

Portfolio site for **Ishaan Kumar**, AI Systems Engineer. Built as a static site with no
framework, no build step and no runtime dependencies.

**Live:** [https://ik123a.github.io/](https://ik123a.github.io/)

---

## Design

The site is built as a *technical dossier*: warm bone typography on near-black, cut through
with a machine-annotation layer of monospace labels, section indices, edge tick rulers and
data-dense spec tables.

| Token | Value | Role |
| --- | --- | --- |
| `--ink` | `#0A0A0C` | Page substrate |
| `--paper` | `#F2EEE6` | Primary type — warm bone, not pure white |
| `--signal` | `#FF4A1C` | Single accent, used sparingly |
| `--amber` / `--mint` | `#F5B841` / `#5EE6C4` | Data-only secondary states |
| Display | Archivo (variable) | Uses the `wdth` axis for the large hero setting |
| Annotation | JetBrains Mono | All labels, indices, metadata |
| Editorial | Instrument Serif | One pull-quote only |

Signature elements: a graph-paper substrate, fixed edge rails with a live scroll readout, a
canvas **signal bus** (a sparse orthogonal schematic with travelling pulses — a dependency
graph, not a particle field), a scrubbed marquee, and a film-grain overlay.

## Structure

Single page, seven numbered sections:

```
00 / INDEX      hero, live stat readout, signal bus
01 / MANIFESTO  positioning + identity plate
02 / WORK       three featured projects
03 / INDEX      all 25 repositories, filterable by domain
04 / STACK      spec tables grouped by discipline
05 / SIGNAL     contribution graph + stats
06 / CONTACT    email, GitHub, LinkedIn
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Whole page. All 25 repositories are inline, so the site renders fully without JavaScript |
| `styles.css` | Design system, layout, motion |
| `app.js` | Preloader, reveals, signal bus, filters, counters, scroll chrome |
| `avatar.png` | `IK` monogram used as the identity plate |

Asset paths are relative, so the site works from any subpath.

## Accessibility and resilience

- Semantic landmarks, skip link, visible focus rings, `aria-pressed` filter state
- `prefers-reduced-motion` fully honoured — no marquee, no `requestAnimationFrame`, all
  reveal content forced visible
- Content is visible with JavaScript disabled; reveal animations are gated behind a `js`
  class set in `<head>`
- Every DOM lookup in `app.js` is null-guarded, so a markup change cannot throw
- The contribution-graph image is third-party and degrades to a CSS dot-matrix on error

## Refreshing the repository data

Repository metadata is **curated into the markup** rather than fetched at runtime. The
unauthenticated GitHub API allows only 60 requests per hour per IP, so a static site would
start returning `403` for most visitors and the headline numbers would flip between live and
fallback values.

To refresh, update in `index.html`:

- headline counts — the `data-count` attributes on `#stat-repos`, `#stat-stars`, `#stat-langs`
- per-repository stars — the `.repo__stars` label text
- per-repository language — the `.repo__lang` text and the `--p` values on `.langbar`

## Local preview

```bash
python -m http.server 8123
# open http://localhost:8123/
```
