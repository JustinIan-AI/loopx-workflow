---
name: loopx-issue-fix
description: GitHub Issue fix workflow manager using LoopX issue-fix capabilities. Handles feasibility triage (Fast-Path vs Standard PR), failing repro test creation, surgical patch, regression, and closure.
---

# LoopX Issue Fix

Use this skill to resolve GitHub Issues with high precision, minimal diffs, and evidence closure.

## Workflow

### 1. Triage & Feasibility
Evaluate whether the issue qualifies for **Fast-Path** or requires **Standard PR-Path**:
```bash
loopx issue-fix feasibility \
  --repo <owner/repo> \
  --issue-ref <issue-id> \
  --reproduction-status confirmed \
  --scope-class bounded \
  --reproduction-label "Reproduction verified via isolated test case"
```

### 2. Route Execution

#### Path A: Fast-Path (Direct Fix, <=20 lines, zero API break)
Use when: Typo, docs, error log messages, isolated single-test fix, constants.
1. Apply surgical patch.
2. Run local gates: `npm run typecheck && npm run lint && npm run build && npm run test`.
3. Run code review: default `code-review` skill (optional OCR audit `./scripts/run-ocr-audit.sh` for high-risk escalation).
4. Push and settle with adaptive branch protection fallback:
   ```bash
   ./scripts/fast-fix-push.sh <ISSUE_ID> "fix(<scope>): <summary>"
   ```

#### Path B: Standard PR-Path (Complex Logic / State Bugs)
Use when: Business logic, state persistence, schema, concurrency, or >20 lines.
1. Plan workflow:
   ```bash
   loopx issue-fix workflow-plan --repo <owner/repo> --issue-ref <id> --base-branch main --issue-branch fix/issue-<id>
   git checkout -b fix/issue-<id>
   ```
2. **Failing Repro First (MUST FAIL)**: Add `tests/unit/issues/issue-<id>.test.ts`, confirm FAIL.
3. **Surgical Patch**: Make minimal code changes, confirm test PASS.
4. **All Gates & Code Review**: `npm run test` + `code-review` skill (escalate to `./scripts/run-ocr-audit.sh` for high-risk/complex changes).
5. **Create PR**: Include `Fixes #<id>` and test logs.
6. **PR Review & Reconcile**:
   ```bash
   loopx pr-review --target-exact-head <PR_NUMBER>@<HEAD_OID>
   loopx issue-fix pr-lifecycle --goal-id <goal-id> --issue-ref <id>
   ```
