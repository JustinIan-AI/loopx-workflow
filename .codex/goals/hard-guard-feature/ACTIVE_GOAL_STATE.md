---
status: active
owner_mode: goal
objective: "Implement fail-closed merge guard, stage signature gates, and git pre-commit hook"
updated_at: 2026-10-21T18:22:46+08:00
adapter_id: hard-guard-feature
handoff_mode: hard_lease
---

# Active Goal State

## Objective

> Implement fail-closed merge guard, stage signature gates, and git pre-commit hook

## Authority Sources

- No explicit goal document was provided during bootstrap.

## Operating Contract

- Treat this file as the durable goal state for future agent ticks.
- Treat the authority sources above as the first context to inspect before acting.
- Read current project evidence before choosing the next action.
- Run a bounded progress segment when useful; it does not have to be one tiny step.
- Keep private evidence, credentials, local paths, and raw logs out of public commits.
- End each tick with changed files, validation, residual risk, and the next action.

## Execution Profile

- `cadence=bounded_progress_segment minimum=multi_surface_or_implementation include=coherent_artifact,targeted_validation,state_writeback spend_rule=spend_only_after_artifact_validation_writeback small_streak_threshold=2`
- Repeated small-scale follow-through should expand the next delivery batch or report a blocker before spending quota.

## Non-Goals

- Do not perform irreversible production operations without explicit approval.
- Do not publish private project evidence.
- Do not optimize for activity if no useful artifact or decision can be produced.

## User Todo / Owner Review Reading Queue
<!-- loopx:todo-region-v0 role=user begin -->
<!-- loopx:todo-section-projection-v0 role=user provider_revision=sqlite:28e99b4cc468459f839407246308ed26:13 records_sha256=4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945 -->

<!-- loopx:todo-region-v0 role=user end -->
## Agent Todo
<!-- loopx:todo-region-v0 role=agent begin -->
<!-- loopx:todo-section-projection-v0 role=agent provider_revision=sqlite:28e99b4cc468459f839407246308ed26:13 records_sha256=7b493fde86669bbe406a7b2b753d290c676eb4fe28bd961223e7febb70cc60e8 -->

- [x] [P1] Git main branch pre-commit hook (scripts/git-hooks/pre-commit)
  <!-- loopx:todo todo_id=todo_24f44c30601f72a1e0d49dc4 status=done task_class=advancement_task last_actor_agent_id=codex completion_continuation=active_goal evidence=Implemented%20scripts%2Fgit-hooks%2Fpre-commit%20rejecting%20direct%20commits%20on%20main%20branch completed_at=2026-10-21T10:24:51Z updated_at=2026-10-21T10:24:51Z completion_turn_key=local_completion_5f57ebcc745e92efa94e63778b127da4 completion_receipt_id=tcw_7e3da63e47e9256e71cfe95fd8e2653b1a3f9e1b7f92fae91b33cef48b108a74 -->
- [x] [P1] Guard TDD test suite in tests/unit/guard.test.js
  <!-- loopx:todo todo_id=todo_462ae37f38acc3900816b2f5 status=done task_class=advancement_task last_actor_agent_id=codex completion_continuation=active_goal evidence=Implemented%20tests%2Funit%2Fguard.test.js%20with%204%2F4%20passing%20red-team%20attack%20scenarios completed_at=2026-10-21T10:24:52Z updated_at=2026-10-21T10:24:52Z completion_turn_key=local_completion_095dcff829212d47c3188f0b126d3537 completion_receipt_id=tcw_362ea10f552eb807aff0dc89fcc9ddaf9f6ee2b81ee6d4421921e4586b56c4fd -->
- [x] [P1] Fail-closed merge guard in bin/loopx-flow merge
  <!-- loopx:todo todo_id=todo_6836ffb74b67ea24ba26a818 status=done task_class=advancement_task last_actor_agent_id=codex completion_continuation=active_goal evidence=Refactored%20bin%2Floopx-flow%20merge%20to%20fail-closed%20with%20exit%20code%201%20when%20PR%20is%20not%20APPROVED completed_at=2026-10-21T10:24:52Z updated_at=2026-10-21T10:24:52Z completion_turn_key=local_completion_463b8cad8ff939ebbc50fc28a3c13bd2 completion_receipt_id=tcw_6ae8c4b455299e42bbdc7782509254fbb732b13b5f57296723216ec12d17e28c -->
- [x] [P1] Stage signature gate in bin/loopx-flow gate verify
  <!-- loopx:todo todo_id=todo_c17a07d0e467908583b81b14 status=done task_class=advancement_task last_actor_agent_id=codex completion_continuation=active_goal evidence=Implemented%20bin%2Floopx-flow%20gate%20verify%20for%20decisions%2C%20contract%2C%20and%20pr%20stages completed_at=2026-10-21T10:24:52Z updated_at=2026-10-21T10:24:52Z completion_turn_key=local_completion_3e4b80259f9816ffdbe51ac2066ba60a completion_receipt_id=tcw_2318a0dfb8e2caf9f3f653605ff506345fcf564e67e47c11f06612bc5024f9f6 -->
<!-- loopx:todo-region-v0 role=agent end -->
## Next Action

- Initial routing is owned by the connected domain adapter.

## Recent User Feedback

- Initialized by `loopx bootstrap`.

## Progress Ledger

- Created the initial goal state and registry connection.
