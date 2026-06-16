#!/usr/bin/env node
/**
 * Lighthouse Agentic Browsing Audit — cross-platform (Node.js)
 *
 * Usage:
 *   node scripts/run-agentic-audit.js <url> [output-path]
 *
 * Examples:
 *   node scripts/run-agentic-audit.js https://example.com
 *   node scripts/run-agentic-audit.js https://example.com ./reports/agentic.json
 *
 * Exit code: 0 if score >= 1.0, 1 otherwise (CI/CD friendly)
 */

const { execSync } = require('child_process');
const { existsSync, readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

// ---- Helpers ----

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const GRAY = '\x1b[90m';
const RESET = '\x1b[0m';

function colorize(text, color) {
  return color + text + RESET;
}

function coloredScore(score) {
  if (score >= 1) return colorize(`[${score}]`, GREEN);
  if (score >= 0.5) return colorize(`[${score}]`, YELLOW);
  return colorize(`[${score}]`, RED);
}

function coloredMode(mode, id) {
  if (mode === 'binary' || mode === 'numeric') return '     ';
  if (mode === 'notApplicable') return colorize('[N/A]', GRAY);
  if (mode === 'informative') return colorize('[info]', CYAN);
  return colorize(`[${mode}]`, GRAY);
}

// ---- Main ----

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node scripts/run-agentic-audit.js <url> [output-path]');
    process.exit(1);
  }

  const url = args[0];
  const outputPath = resolve(args[1] || 'agentic-report.json');

  console.log(colorize(`Running Lighthouse Agentic Browsing audit on ${url} ...\n`, CYAN));

  // Run lighthouse
  try {
    execSync(
      `lighthouse "${url}" --only-categories=agentic-browsing --output=json --output-path="${outputPath}" --chrome-flags="--headless=new --no-sandbox"`,
      { stdio: 'pipe', timeout: 120000 }
    );
  } catch (err) {
    // lighthouse exits with code 1 on EPERM cleanup errors even when report is generated
    if (!existsSync(outputPath)) {
      console.error(colorize('Lighthouse audit failed — no report generated.', RED));
      process.exit(1);
    }
  }

  // Read report
  const raw = readFileSync(outputPath, 'utf-8');
  const report = JSON.parse(raw);

  const category = report.categories['agentic-browsing'];
  if (!category) {
    console.error(colorize('Error: agentic-browsing category not found in report.', RED));
    process.exit(1);
  }

  const score = category.score;

  // Display results
  console.log(colorize('=== Agentic Browsing Audit Result ===', YELLOW));
  console.log(colorize(`Score: ${score} (0~1)\n`, score >= 1 ? GREEN : score >= 0.67 ? YELLOW : RED));

  for (const ref of category.auditRefs) {
    const audit = report.audits[ref.id];
    const mode = audit.scoreDisplayMode;

    let label = ref.id;
    const icon = audit.score !== null ? coloredScore(audit.score) : coloredMode(mode, ref.id);
    console.log(`${icon} ${label}`);

    // Details
    if (audit.details && audit.details.items && audit.details.items.length > 0) {
      for (const item of audit.details.items) {
        if (item.message) {
          console.log(`  ${colorize('->', YELLOW)} ${item.message.replace(/\s+/g, ' ')}`);
        }
      }
      if (!audit.details.items[0].message && audit.details.items.length > 0) {
        console.log(`  ${colorize(`(${audit.details.items.length} items)`, GRAY)}`);
      }
    }
    // Warnings
    if (audit.warnings && audit.warnings.length > 0) {
      for (const w of audit.warnings) {
        console.log(`  ${colorize(`WARN: ${w}`, MAGENTA)}`);
      }
    }
  }

  console.log(colorize(`\nFull report saved to: ${outputPath}\n`, CYAN));

  if (score >= 1) {
    console.log(colorize('All audits passed!', GREEN));
    process.exit(0);
  } else {
    console.log(colorize('Some audits failed. See above for details.', YELLOW));
    process.exit(1);
  }
}

main();
