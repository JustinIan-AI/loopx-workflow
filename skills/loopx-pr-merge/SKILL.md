---
name: loopx-pr-merge
description: Secure atomic PR merge skill for LoopX. Verifies exact HEAD SHA, verifies GitHub review approval on PR page, merges via squash, and archives Goal with automatic metadata extraction.
---

# LoopX PR Merge

Use this skill to execute the final L4 merge and goal settlement after human approval on the GitHub PR page.

## Execution Steps

1. **Verify Exact Head SHA**:
   Verify that current PR head commit has not changed since the L2 Review was conducted:
   ```bash
   CURRENT_HEAD=$(gh pr view <PR_NUMBER> --json headRefOid --jq .headRefOid)
   # Must match REVIEWED_HEAD_OID exactly!
   ```

2. **Verify GitHub Review Approval**:
   Check if the PR has received human approval on GitHub:
   ```bash
   DECISION=$(gh pr view <PR_NUMBER> --json reviewDecision --jq .reviewDecision)
   # DECISION must be "APPROVED"
   ```

3. **Execute Atomic Merge**:
   ```bash
   gh pr merge <PR_NUMBER> --squash --delete-branch
   ```

4. **Extract Metadata & Settle LoopX Goal**:
   Automatically extract `goal_id` from the PR body machine metadata (`<!-- loopx-meta: ... -->`):
   ```bash
   GOAL_ID=$(gh pr view <PR_NUMBER> --json body --jq .body | grep -o '<!-- loopx-meta:.*-->' | sed 's/<!-- loopx-meta: *//;s/ *-->//' | jq -r .goal_id 2>/dev/null || echo "")

   if [[ -n "$GOAL_ID" && "$GOAL_ID" != "null" ]]; then
       echo "==> [LoopX] 自动检测到关联 Goal: $GOAL_ID，执行归档..."
       loopx goal-lifecycle --goal-id "$GOAL_ID" --operation stop --execute || true
       loopx sync-global || true
   else
       echo "[!] 未在 PR Body 中检测到 loopx-meta，需手动归档目标。"
   fi
   ```
