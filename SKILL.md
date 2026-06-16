---
name: agentic-browsing
description: 'Lighthouse Agentic Browsing audit and optimization — runs the lighthouse agentic-browsing category (llms.txt, agent accessibility tree, WebMCP, CLS) and fixes issues. Use when user says "agentic browsing", "run agentic audit", "check llms.txt", "AI agent accessibility", "lighthouse agentic", "WebMCP", or after implementing llms.txt / WebMCP features to verify they pass.'
compatibility: Requires Node.js 22+, Lighthouse CLI (npm install -g lighthouse), and Chrome/Chromium 150+
license: MIT
metadata:
  author: chaihongjun
  version: "4.0"
---

# Lighthouse Agentic Browsing Audit & Optimization

> Lighthouse 13.x+ experimental Agentic Browsing category — validates website readiness for AI agents. Official docs: https://developer.chrome.google.cn/docs/lighthouse/agentic-browsing/scoring

## Audits (6 total)

This category uses a **fractional score** (pass ratio), not a weighted 0-100. WebMCP audits are informational (excluded from scoring).

| # | Audit ID | Description | Scored |
|---|----------|-------------|--------|
| 1 | `llms-txt` | llms.txt exists and is well-formed | Yes |
| 2 | `agent-accessibility-tree` | Accessibility tree is agent-friendly | Yes |
| 3 | `cumulative-layout-shift` | CLS < 0.1 | Yes |
| 4 | `webmcp-registered-tools` | WebMCP tools registered (informational) | No |
| 5 | `webmcp-form-coverage` | WebMCP form coverage (informational) | No |
| 6 | `webmcp-schema-validity` | WebMCP schema valid (informational) | No |

Score = (llms-txt pass + agent-accessibility-tree pass + CLS pass) / 3

## Prerequisites

- **Node.js 22+**
- **Lighthouse CLI**: `npm install -g lighthouse`
- **Chrome/Chromium 150+** (required for WebMCP audits; register [WebMCP Origin Trial](https://developer.chrome.google.cn/origintrials/#/register_trial/4163014905550602241))
- This category is **experimental** — results may fluctuate (see below)

## Why Results Fluctuate

- **Dynamic tool registration**: Imperative API (JS) tool registration timing may affect capture
- **A11y tree variability**: DOM size/complexity changes affect the accessibility tree
- **CLS changes**: Ads, images without dimensions, injected content shift element positions

## Audit Process

### Step 1: Run the Audit

**Option A — Direct CLI (any platform):**
```bash
lighthouse <url> --only-categories=agentic-browsing --output=json --output-path=agentic-report.json --chrome-flags="--headless=new --no-sandbox"
```

**Option B — Helper script (Node.js, cross-platform):**
```bash
node scripts/run-agentic-audit.js https://example.com
```

### Step 2: Parse Results

Key JSON paths in the report:

| Path | Description |
|------|-------------|
| `categories.agentic-browsing.score` | Overall score (0~1) |
| `audits.llms-txt.score` | llms.txt (0/1) |
| `audits.llms-txt.scoreDisplayMode` | `binary` / `notApplicable` (404 = N/A, not penalized) |
| `audits.agent-accessibility-tree.score` | Agent accessibility tree (0/1) |
| `audits.cumulative-layout-shift.score` | CLS (0~1) |
| `audits.llms-txt.details.items[].message` | Failure details |

Quick one-liner to extract score (Node.js):
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('agentic-report.json','utf8')).categories['agentic-browsing'].score)"
```

## Optimization Guide

### 1. llms.txt

**Check**: File exists at domain root, follows [llms.txt spec](https://llmstxt.org/) with H1 and markdown links.

**Fix**:
```
# Site Name

> Site description

- [Page Name](https://example.com/page)
- [Sitemap](https://example.com/sitemap.xml)
```
- Links must use `[text](url)` format, NOT `text: url` or bare URL
- 404 = N/A (not penalized), but providing the file is recommended

### 2. Agent Accessibility Tree

**Check**: Accessibility tree has sufficient information for agents to navigate and interact. Agents use the a11y tree as their primary data model.

**Fix**:
- All interactive elements have accessible names (`aria-label`, `alt`, `<label>` association)
- Use semantic HTML5 (`<nav>`, `<main>`, `<article>`, `<section>`)
- Form elements have associated `<label>` or `aria-labelledby`
- Buttons/links have descriptive text
- Images have `alt` attributes
- No empty interactive elements (buttons without text or aria-label)
- Valid role and parent-child relationships
- Interactive content not hidden from accessibility tree

### 3. Cumulative Layout Shift (CLS)

**Check**: CLS < 0.1. Agents rely on screenshots and coordinate-based interaction — layout shifts cause misclicks.

**Fix**:
- Set explicit `width`/`height` on all images
- Reserve space for ads and embedded content
- Avoid injecting content above already-rendered content
- Use `aspect-ratio` CSS property
- Use `font-display: swap` for web fonts

### 4. WebMCP

**Note**: Requires Chrome 150+ and Origin Trial. All 3 WebMCP audits are informational.

#### 4a. Registered WebMCP Tools

**Check**: Whether the page registers WebMCP tools (informational — empty list is OK).

**Fix**:
- **Declarative API**: Add `toolname`/`tooldescription` attributes to `<form>`:
  ```html
  <form toolname="book_appointment" tooldescription="Book a health consultation">
    <input name="name" type="text">
    <button type="submit">Submit</button>
  </form>
  ```
- **Imperative API**: Register via JavaScript:
  ```js
  navigator.modelContext.registerTool({
    name: "book_appointment",
    description: "Book a health consultation",
  });
  ```

#### 4b. Forms Missing Declarative WebMCP

**Check**: `<form>` elements missing `toolname` or `tooldescription` (informational, no warning).

**Fix**:
```html
<form toolname="newsletter_signup" tooldescription="Subscribes user to weekly newsletter">
  <input name="email" type="email" toolparamdescription="User's email address">
  <button type="submit">Sign Up</button>
</form>
```

#### 4c. WebMCP Schema Validity

**Check fails if**:
- Form has `tooldescription` but no `toolname`
- Form has `toolname` but no `tooldescription`
- Required form field is missing `name` attribute

**Warning (non-failing)**:
- Optional field has `name` but no `toolparamdescription` or `<label>`

**Fix**:
- Every tool has both `toolname` + `tooldescription`
- Every input has a unique `name`
- Add `toolparamdescription` to help agents understand expected values

## Score Reference

| Score | Meaning |
|-------|---------|
| 1.00 | All passed |
| 0.67 | 1 failed |
| 0.33 | 2 failed |
| 0.00 | All failed or not applicable |

## Common Failures

### "File does not appear to contain any links"

llms.txt has no markdown links. Fix: change `- Home: https://...` to `- [Home](https://...)`

### Accessibility tree issues

Caused by empty interactive elements or missing label associations. Fix: add accessible names to all `<button>`, `<a>`, `<input>`.

### WebMCP schema validity failure

Missing `toolname`/`tooldescription` symmetry, or inputs missing `name`. Fix: ensure `<form>` has both attributes, all `<input>` have `name`.

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Agentic Browsing Audit
  run: |
    npx lighthouse https://example.com \
      --only-categories=agentic-browsing \
      --output=json \
      --output-path=agentic-report.json \
      --chrome-flags="--headless=new --no-sandbox"
    node scripts/run-agentic-audit.js https://example.com agentic-report.json
```

## Files

| File | Purpose |
|------|---------|
| `.gitignore` | Ignore audit output and OS files |
| `scripts/run-agentic-audit.js` | Cross-platform helper script (Node.js) |

## References

- [Scoring](https://developer.chrome.google.cn/docs/lighthouse/agentic-browsing/scoring)
- [llms.txt](https://developer.chrome.google.cn/docs/lighthouse/agentic-browsing/llms-txt)
- [Accessibility for Agents](https://developer.chrome.google.cn/docs/lighthouse/agentic-browsing/accessibility-for-agents)
- [Layout Stability](https://developer.chrome.google.cn/docs/lighthouse/agentic-browsing/layout-stability)
- [Registered WebMCP Tools](https://developer.chrome.google.cn/docs/lighthouse/agentic-browsing/registered-webmcp-tools)
- [Forms Missing Declarative WebMCP](https://developer.chrome.google.cn/docs/lighthouse/agentic-browsing/forms-missing-declarative-webmcp)
- [WebMCP Schema Validity](https://developer.chrome.google.cn/docs/lighthouse/agentic-browsing/webmcp-schema-validity)
- [llms.txt spec](https://llmstxt.org/)
