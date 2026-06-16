# Lighthouse Agentic Browsing Audit Skill

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Lighthouse](https://img.shields.io/badge/lighthouse-13.x+-yellow)](https://developer.chrome.google.cn/docs/lighthouse/agentic-browsing/scoring)
[![Node.js](https://img.shields.io/badge/node-22+-green)](https://nodejs.org)

A cross-platform AI agent skill for auditing and optimizing websites against Lighthouse's **Agentic Browsing** category — validating readiness for AI agents (LLMs, browser agents, crawlers).

Supports all 6 audits: `llms-txt`, `agent-accessibility-tree`, `cumulative-layout-shift`, `webmcp-registered-tools`, `webmcp-form-coverage`, `webmcp-schema-validity`.

## Quick Start

```bash
# Prerequisites
npm install -g lighthouse

# Run audit
npx lighthouse https://example.com \
  --only-categories=agentic-browsing \
  --output=json \
  --output-path=agentic-report.json \
  --chrome-flags="--headless=new --no-sandbox"

# Check score
node -e "console.log(JSON.parse(require('fs').readFileSync('agentic-report.json','utf8')).categories['agentic-browsing'].score)"
```

Or use the bundled script:

```bash
node scripts/run-agentic-audit.js https://example.com
```

Exit code 0 if score >= 1.0, 1 otherwise — CI/CD ready.

## Audits

| ID | Description | Scored |
|----|-------------|--------|
| `llms-txt` | llms.txt exists and is well-formed | Yes |
| `agent-accessibility-tree` | Accessibility tree is agent-friendly | Yes |
| `cumulative-layout-shift` | CLS < 0.1 | Yes |
| `webmcp-registered-tools` | WebMCP tools registered (informational) | No |
| `webmcp-form-coverage` | WebMCP form coverage (informational) | No |
| `webmcp-schema-validity` | WebMCP schema valid (informational) | No |

Score = passes / 3. WebMCP audits are informational (excluded from denominator).

## Prerequisites

- **Node.js 22+**
- **Lighthouse CLI**: `npm install -g lighthouse`
- **Chrome/Chromium 150+** (required for WebMCP audits)
- Register [WebMCP Origin Trial](https://developer.chrome.google.cn/origintrials/#/register_trial/4163014905550602241) for WebMCP features

## Platform Support

| Platform | Status |
|----------|--------|
| Windows | ✓ (Node.js, PowerShell) |
| Linux | ✓ (Node.js, Bash) |
| macOS | ✓ (Node.js, Bash) |
| CI/CD (GitHub Actions) | ✓ |

## Files

```
agentic-browsing/
├── .gitignore                      # Ignore audit output and OS files
├── SKILL.md                        # Skill instructions
├── README.md                       # This file
└── scripts/
    └── run-agentic-audit.js        # Cross-platform audit runner (Node.js)
```

## Related Resources

- [Lighthouse Agentic Browsing Scoring](https://developer.chrome.google.cn/docs/lighthouse/agentic-browsing/scoring)
- [llms.txt Specification](https://llmstxt.org/)
- [WebMCP Documentation](https://developer.chrome.google.cn/docs/ai/webmcp)

## License

MIT
