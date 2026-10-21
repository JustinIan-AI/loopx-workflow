---
name: open-code-review
description: Backup and escalated deep scan skill using Alibaba open-code-review (ocr CLI). Used as an escalation path for high-risk concurrency/security/schema changes or independent fallback audit. High/Medium defects must block delivery.
---

# Open Code Review (OCR)

Use this skill as a **备份与可提升深度审查能力 (Backup & Escalated Deep Scan Capability)** at L1 before creating or merging a PR (default review uses native `code-review` skill).

## Quick Execution

Always prefer the bundled automated blocking audit script:
```bash
./scripts/run-ocr-audit.sh [BASE_REF] [OUTPUT_JSON]
# 示例:
./scripts/run-ocr-audit.sh origin/main /tmp/ocr-audit-report.json
```

Or execute manually with required environment PATH:
```bash
export PATH="$PATH:$HOME/.npm-global/bin"
ocr review --audience agent --repo . --from origin/main --to HEAD --format json --output /tmp/ocr-audit-report.json
```

## Parsing & Blocking Rule (Critical)

1. **High / Medium (Blocking)**:
   - Any comments with `severity: "high"` or `severity: "medium"` represent critical risks (e.g., null pointers, unhandled Promise rejections, memory leaks, concurrency races, security flaws).
   - **MUST BLOCK**: Do not proceed to PR creation or merge. Fix the code immediately and rerun audit until blocking count is 0.
2. **Low / Style (Advisory)**:
   - Record in delivery notes or fix directly if trivial.
3. **Caveat on Fields**:
   - In JSON output, the file path is located at `comments[].path` (NOT `.file`).
