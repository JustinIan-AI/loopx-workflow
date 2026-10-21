---
status: active
owner_mode: goal
objective: "Deliver complete open-source ready LoopX AI-Native workflow with verified gates, reviewer guide, and cli-flow orchestrator"
updated_at: 2026-10-21T17:53:23+08:00
adapter_id: loopx-workflow-oss
handoff_mode: hard_lease
---

# Active Goal State

## Objective

> Deliver complete open-source ready LoopX AI-Native workflow with verified gates, reviewer guide, and cli-flow orchestrator

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
<!-- loopx:todo-section-projection-v0 role=user provider_revision=sqlite:682e77c5abc04491b74502b0398bbf6d:16 records_sha256=4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945 -->

<!-- loopx:todo-region-v0 role=user end -->
## Agent Todo
<!-- loopx:todo-region-v0 role=agent begin -->
<!-- loopx:todo-section-projection-v0 role=agent provider_revision=sqlite:682e77c5abc04491b74502b0398bbf6d:16 records_sha256=60a831dda0b3d2e8cad3527d9c3f051d60c79904bd6d2e1f08a8178b545db23a -->

- [x] [P1] GitHub PR & Issue templates (.github/PULL_REQUEST_TEMPLATE.md, .github/ISSUE_TEMPLATE/)
  <!-- loopx:todo todo_id=todo_1d849aef6b1abbd3ef25d400 status=done task_class=advancement_task last_actor_agent_id=codex completion_continuation=active_goal evidence=Created%20.github%2FPULL_REQUEST_TEMPLATE.md%20and%20.github%2FISSUE_TEMPLATE%2F completed_at=2026-10-21T09:56:23Z updated_at=2026-10-21T09:56:23Z completion_turn_key=local_completion_c1984c1857188f028466390f6154f4a2 completion_receipt_id=tcw_6df245a36a29f79f9b4c2b6667d4ce049c39eeda1854e757fd94116598e5196f -->
- [x] [P1] Lightweight LoopX CLI orchestrator (bin/loopx-flow)
  <!-- loopx:todo todo_id=todo_30aeabc56baf3b435e5ed580 status=done task_class=advancement_task last_actor_agent_id=codex completion_continuation=active_goal evidence=Implemented%20and%20verified%20bin%2Floopx-flow%20CLI%20orchestrator%20with%20full%20subcommands completed_at=2026-10-21T09:57:30Z updated_at=2026-10-21T09:57:30Z completion_turn_key=local_completion_cf8b8ba3e03cfec52cc47f6808569fae completion_receipt_id=tcw_17aeb4a0d5cf5dbd117032df22b8016f7d671cf985e002d47d84b4eff038b05e -->
- [x] [P1] Real gates refactoring (package.json, node:test suite in tests/unit/workflow.test.js)
  <!-- loopx:todo todo_id=todo_5b4f977e5499095b81aafc2e status=done task_class=advancement_task last_actor_agent_id=codex completion_continuation=active_goal evidence=Refactored%20package.json%20with%20real%20gates%20and%20added%20tests%2Funit%2Fworkflow.test.js%20passing%204%2F4%20tests completed_at=2026-10-21T09:55:54Z updated_at=2026-10-21T09:55:54Z completion_turn_key=local_completion_6ddd9c69235a8b494098f302c99be03b completion_receipt_id=tcw_f925e277fd4bff7ce0c6da51f41bc3c8c3e9f298565156c349d208725bdda2bc -->
- [x] [P1] Reviewer Inspection Guide & Onboarding (docs/guides/reviewer-inspection-guide.md, README.md, QUICKSTART.md)
  <!-- loopx:todo todo_id=todo_731b3d9418d7108987e41b3e status=done task_class=advancement_task last_actor_agent_id=codex completion_continuation=active_goal evidence=Created%20reviewer-inspection-guide.md%2C%20README.md%2C%20and%20QUICKSTART.md completed_at=2026-10-21T09:58:42Z updated_at=2026-10-21T09:58:42Z completion_turn_key=local_completion_0412ac9973404f35af60aec15b77f5c9 completion_receipt_id=tcw_bdaed3d18acc49c21ff60e5f63f8fea392c2c8f4478e7c5f1b879fcb7e8feea5 -->
- [x] [P1] OSS compliance and gitignore (.gitignore, LICENSE)
  <!-- loopx:todo todo_id=todo_cacc3440a7c1ef201e87be80 status=done task_class=advancement_task last_actor_agent_id=codex completion_continuation=active_goal evidence=Created%20MIT%20LICENSE%20and%20comprehensive%20.gitignore completed_at=2026-10-21T09:55:21Z updated_at=2026-10-21T09:55:21Z completion_turn_key=local_completion_c65d36766f0d9dd809c859daa611bd5b completion_receipt_id=tcw_41bf141c13e089d13ae7b2f8519721a82469436feffcd6b24e6aefe6e2bb4c7d -->
<!-- loopx:todo-region-v0 role=agent end -->
## Next Action

- Initial routing is owned by the connected domain adapter.

## Recent User Feedback

- Initialized by `loopx bootstrap`.

## Progress Ledger

- Created the initial goal state and registry connection.
