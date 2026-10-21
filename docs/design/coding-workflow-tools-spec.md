# LoopX AI-Native 研发与交付流工具集架构设计方案 (v2.2-Production)
## —— 聚焦 GitHub 生态、多 Agent 并行、本地门禁自闭环与自适应分支保护的落地规范

**版本**：v2.2-Production (业务边界固化与实战落地版)  
**基准系统**：LoopX 2.0 控制面、Code Review Skills（默认 L1 契约审查）、阿里开源 Open Code Review (`ocr`，备用与可提升深度审查门禁)、GitHub CLI (`gh`)、本地 Skills 资产库  
**核心场景**：GitHub Issues 闭环、多 Agent 并行开发、GitHub PR 页面交付审查、自适应 Fast-Path 降级  

---

## 目录
1. [已澄清的业务边界与架构基线](#一已澄清的业务边界与架构基线)
2. [总体架构与分层运转机制](#二总体架构与分层运转机制)
3. [多 Agent 并行开发与防冲突体系 (Multi-Agent Concurrency)](#三多-agent-并行开发与防冲突体系)
4. [全生命周期端到端研发节点详细规范 (阶段 1 ~ 8)](#四全生命周期端到端研发节点详细规范)
5. [Issue 双分支流转与自适应分支保护降级引擎](#五issue-双分支流转与自适应分支保护降级引擎)
6. [GitHub PR 页面审查与 8 项事实核验体系](#六github-pr-页面审查与-8-项事实核验体系)
7. [配套 Skills 实施改造方案与代码草案](#七配套-skills-实施改造方案与代码草案)
8. [落地实施路线图与可执行指南](#八落地实施路线图与可执行指南)

---

## 一、已澄清的业务边界与架构基线

根据最新的架构研讨结论，本方案对 5 大关键业务边界予以正式固化：

| 业务边界 | 确认的技术决策 | 架构影响与工程实现 |
|---|---|---|
| **1. Issue 跟踪源** | **以 GitHub Issues 为主** | 深度集成 GitHub 原生工具链（`gh issue` / `Fixes #id`），暂不接入飞书等第三方工单平台，简化外部依赖。 |
| **2. 分支保护与 Fast-Path** | **默认不开启分支保护；若检测开启则自适应降级** | Fast-Path 优先尝试直接提交 `main`；若命中 GitHub 403 / Protected Branch 限制，**自动降级转为“自动化专用分支 ➔ 自动发 PR ➔ 自动合入”**，对调用者透明。 |
| **3. 多 Agent 并行规模** | **支持多个 Agent 同时推进** | 启用 LoopX `task-lease` 任务排他锁避免任务踩踏；启用 `loopx integration-branch` 在本地临时 worktree 预集成多特性分支，提前消除合并冲突。 |
| **4. 门禁验证主权边界** | **以本地证据包为准** | 交付准入以 Agent 本地执行的四项门禁（Typecheck, Lint, Build, Test）为唯一判定标准，生成抗篡改证据链回写 LoopX，暂不阻塞等待远端 Actions。 |
| **5. 审查与审批阵地** | **在 GitHub PR 页面进行 Review** | LoopX 产出的 5-Block 交付审查报告直接发布到 GitHub PR 描述或顶置评论；人类决策者直接在 GitHub PR 页面执行 Approve / Request Changes。 |
| **6. L1 审查分层策略** | **默认使用 Code Review Skills，阿里 OCR 作为备份与可提升能力** | 默认采用基于参与者边界语义契约的 `code-review` 技能完成 L1 缺陷审查，实现零噪音与高推理精度；将阿里 `ocr` 作为备用兜底能力与高风险/高复杂度场景的可提升深度扫描器 (Escalated Deep Scan)。 |
| **7. 前置环境与断点控制** | **执行强制 Pre-flight 体检，数据流通过显式元数据与标准路径流转** | 研发前强制运行 `./scripts/preflight-check.sh` 确保环境就绪；跨节点交付物（Decisions, PRD, Stories, Specs, L1 Evidence, PR Metadata）全部规范化落盘，杜绝内存态悬空。 |

---

## 二、总体架构与分层运转机制

```
======================================================================================================
                         LoopX × GitHub 多 Agent 全生命周期 Coding Workflow 架构
======================================================================================================

 [阶段 0: 前置环境准入与工程脚手架]
   │
   └─► scripts/preflight-check.sh (--fix) ➔ 验证 Git, CLI (gh/loopx/ocr), package.json 四大门禁, 目录骨架
   │
 [需求研讨与方案冻结]
   │
   ├─► 阶段 1: 需求研讨与方案压力测试 ──► 工具: design-grill ➔ 产出: docs/decisions/<feature>-decisions.md
   ├─► 阶段 2: 精益 PRD 生成与红队对抗 ──► 工具: create-prd + strategy-red-team ➔ 产出: docs/prd/<feature>-prd.md
   ├─► 阶段 3: Feature 模块拆分与排期 ──► 工具: user-stories + prioritize-features ➔ 产出: docs/stories/<feature>-stories.md
   └─► 阶段 4: Feature Specs 与契约冻结 ──► 工具: tasks.md 契约顶部声明 + loopx 任务实体同步与锁定
   │
 [多 Agent 并行调度与执行层]
   │
   ├─► LoopX 控制面排他锁: loopx task-lease acquire --goal-id <gid> --todo-id <feature>-t<idx>
   │
   ├─► 【管线 A: Feature 8 阶段标准化研发】
   │     │
   │     ▼
   │   阶段 5: TDD 循环实现 ──► 本地四大门禁 (typecheck/lint/build/test) ➔ loopx todo complete 回写凭据
   │     │
   │     ▼
   │   阶段 6: 代码级缺陷审查 (L1) ──► 默认: code-review / 提升&备用: 阿里 ocr ➔ 结构化落盘 /tmp/l1-review-evidence.md
   │     │
   │     ▼
   │   阶段 7: 集成网关与交付审查 (L2) ──► 本地集成校验 (loopx integration-branch) + 发起 PR + loopx-pr-review 顶置 5-Block 报告
   │     │
   │     ▼
   │   阶段 8: GitHub 页面审批与安全合并 (L3/L4) ──► 人类 Approve ➔ loopx-pr-merge 解析 metadata 原子合入与归档
   │
   └─► 【管线 B: GitHub Issue 双分支闭环】
         │
         ▼
       loopx issue-fix feasibility (评估改动规模、接口影响、复现状态)
         │
         ├───► [超界缺陷 / 新增需求] ──► 打回并转入 Feature 管线
         │
         ├───► [路径 A: Fast-Path 极简微闭环 (改动<=20行, 0对外接口变动)]
         │       │
         │       ▼
         │       单测定位 ➔ 最小修复 ➔ 本地门禁全绿 ➔ 本地 code-review 0缺陷 (可选 OCR 提升) ➔ 尝试 Push main
         │       │
         │       ├─► (成功直接合入) ──► Issue 自动核销 ➔ loopx issue-fix outcome 审计归档
         │       │
         │       └─► (若遇分支保护拒绝) ──► 自动降级: 建分支 ➔ 自动发 PR ➔ 自动合入
         │
         └───► [路径 B: Standard PR-Path 完整流程 (复杂业务/状态缺陷)]
                 │
                 ▼
                 Failing Repro (用例先红) ➔ 最小修复 (转绿) ➔ 全量门禁与 code-review 审查 (高危提升 OCR)
                 ➔ 创建 GitHub PR ➔ loopx-pr-review 提交报告 ➔ 人工核准与合入核销
======================================================================================================
```

---

## 三、多 Agent 并行开发与防冲突体系

为了在单仓中支持多个 Agent 同时高效推进不同任务，必须从**任务排他**与**代码集成**两个维度建立防御体系：

### 3.1 任务级排他租约锁 (`loopx task-lease`)
- **机制**：当多个 Agent（例如 `agent-feature-1` 与 `agent-feature-2`）连接到同一个 LoopX Goal 时，必须显式申领任务排他租约：
  ```bash
  # Agent 认领任务并锁定租约
  loopx task-lease acquire --goal-id <goal-id> --todo-id <todo-id> --holder <agent-id> --duration 3600
  ```
- **效果**：在租约有效期内，其他 Agent 无法认领同一 Todo，杜绝重复实现与状态覆盖。任务完成后显式释放租约。

### 3.2 本地临时集成分支机制 (`loopx integration-branch`)
- **痛点**：Agent A 在 `feature/auth` 分支开发，Agent B 在 `feature/billing` 分支开发，各自单测全绿，但合入主干时发生接口断裂或冲突。
- **实施规范**：
  1. 在本地配置集成目标分支：
     ```bash
     loopx integration-branch configure \
       --repo-path . \
       --base-ref origin/main \
       --integration-branch local-integration \
       --source-branch feature/auth \
       --source-branch feature/billing \
       --execute
     ```
  2. 调度执行对账：
     - LoopX 会在独立的临时 detached worktree 中自动将各个正在活跃的 feature 分支与 main 尝试集成。
     - 若发生冲突，提前在本地抛出报警并指派对应 Agent 协调解决，避免带病提交到 GitHub PR。

---

## 四、全生命周期端到端研发节点详细规范

### 阶段 0：前置环境准入与脚手架初始化 (Pre-flight Gate)
- **工具**：`./scripts/preflight-check.sh`、`./scripts/workflow-init.sh`。
- **准入契约**：任何 Agent 在领用需求或修复缺陷前，必须强制执行 `./scripts/preflight-check.sh`，确保：
  1. Git 仓库已初始化且配置有效 Remote。
  2. 依赖 CLI（`git`, `gh`, `node`, `npm`, `loopx`, `ocr`）就绪且 `gh auth` 有效登录。
  3. `package.json` 中的本地四大门禁（`typecheck`, `lint`, `build`, `test`）脚本已存在。
  4. 工作流骨架目录（`docs/decisions`, `docs/prd`, `docs/stories`, `.trae/specs`, `tests/unit`）齐全。

### 阶段 1：需求研讨与方案压力测试
- **工具**：`design-grill` (代码感知增强版)。
- **规范**：
  - **代码感知探针**：Agent 发问前必须 Grep 本地代码库确认客观事实，禁止询问代码库已知事实。
  - 拆解 3～6 个顶级决策分支，附带推荐选项与权衡分析，消除所有“it depends”。
  - **标准交付物**：`docs/decisions/<feature>-decisions.md`。

### 阶段 2：精益 PRD 生成与红队对抗
- **工具**：`create-prd` + `strategy-red-team`。
- **输入契约**：必须显式读取 `docs/decisions/<feature>-decisions.md` 作为背景上下文，禁止重复发问。
- **规范**：
  - 产出 8 板块精益 PRD（600～1200 字），存放于 `docs/prd/<feature>-prd.md`。
  - 挂载 `strategy-red-team` 攻击承重假设，产出反驳证据与最低成本测试方法。
  - **标准交付物**：`docs/prd/<feature>-prd.md`。

### 阶段 3：Feature 模块拆分与排期
- **工具**：`user-stories` + `prioritize-features`。
- **输入契约**：读取 `docs/prd/<feature>-prd.md`。
- **规范**：
  - 遵循 Job Story 标准语法：`When [场景], I want to [行为], so I can [价值]`。
  - 划分 Feature 边界，明确单 PR 代码 Diff 控制在 500 行以内，定义清晰的 Write Scope。
  - **标准交付物（落盘固化）**：`docs/stories/<feature>-stories.md`。

### 阶段 4：Feature Specs 详细设计、契约冻结与实体对账
- **工具**：`.trae/specs/<feature>/tasks.md` + `loopx register-authority-source` + `loopx goal/todo`。
- **输入契约**：以 `docs/stories/<feature>-stories.md` 为输入提炼接口。
- **规范**：
  - **契约顶部冻结**：在 `tasks.md` 顶部显式冻结 TypeScript 签名、数据结构与不变性后置断言。
  - **防篡改注册**：运行 `loopx register-authority-source --project . --source-path ".trae/specs/<feature>/spec.md"`。
  - **LoopX 实体初始化对账**：
    ```bash
    # 注册 Goal
    loopx goal create --title "feat(<feature>): core implementation" --project .
    # 按照 tasks.md 任务项批量注册 Todo，统一命名空间: <feature>-t<idx>
    loopx todo create --goal-id <gid> --todo-id "<feature>-t1" --title "<任务描述>"
    ```
  - **标准交付物**：`.trae/specs/<feature>/tasks.md` 与同步完成的 LoopX Goal/Todo 注册表。

### 阶段 5：LoopX 注册、任务认领与 TDD 编码实现
- **工具**：`loopx start-goal / todo` + `loopx task-lease` + `test-driven-development`。
- **规范**：
  - Agent 认领任务并锁定租约：`loopx task-lease acquire`。
  - 严格遵守 Red-Green-Refactor：测试用例先写并确保 FAIL ➔ 最小代码实现转 PASS ➔ 重构。
  - **本地四大门禁执行（唯一准入依据）**：
    ```bash
    npm run typecheck && npm run lint && npm run build && npm run test
    ```
  - **状态回写**：调用 `loopx todo complete`，回写命令、用例统计与产物路径，并在 `tasks.md` 中勾选 `[x]`。

### 阶段 6：代码级缺陷审查 (L1: Code Review Skills + OCR 提升备用)
- **工具**：默认 `code-review` 技能；备用与提升能力 `open-code-review` (`ocr review`)。
- **分层执行机制**：
  1. **默认审查门禁 (Default Path - Code Review Skills)**：
     - 调用 `code-review` 技能（以跨边界语义契约 Correctness 为核心，按需联动 Performance/Security）。
     - **审查核心**：针对调用方与被调用方、写入与读取、状态机转换等跨边界契约进行违约推演与严苛反驳。
     - **准入标准**：零未反驳有效缺陷（0 Actionable Defects）。
  2. **可提升深度审计 (Escalated Deep Scan - OCR)**：
     - **提升触发条件**：涉及高危并发死锁、底层持久化 Schema 变动、鉴权安全边界、单 Diff > 200 行，或显式要求跨模型独立审计。
     - **执行规范**：运行 `./scripts/run-ocr-audit.sh origin/main /tmp/ocr-review.json`，High/Medium 缺陷一票否决。
  3. **标准证据链落盘（关键对接契约）**：
     - 阶段 6 执行完毕必须生成标准证据文件 `/tmp/l1-review-evidence.md`：
       ```markdown
       ### L1 代码审查凭据
       - **审查引擎**：code-review (默认) [ / OCR 深度增强 (提升)]
       - **未反驳有效缺陷数**：0 Actionable Defects
       - **OCR 扫描结果**：0 High, 0 Medium (若未触发提升则注明未触发)
       - **审查通过提交 SHA**：<CURRENT_HEAD_SHA>
       ```

### 阶段 7：预集成网关与交付级准入审查 (L2: Integration Gate & PR Review)
- **工具**：`loopx integration-branch` + `gh pr create` + `loopx-pr-review`。
- **分步执行规范**：
  1. **Pre-PR 本地集成网关校验**：
     - 在发起 PR 前，先调用 `loopx integration-branch` 在本地临时 worktree 中对活跃 feature 分支与 main 执行集成探测，若有冲突就地排查，杜绝带病发 PR。
  2. **创建 GitHub PR 并注入机器元数据**：
     - 自动组装 PR 描述正文 `/tmp/pr-desc.md`（包含阶段 5 四大门禁结果与阶段 6 `/tmp/l1-review-evidence.md`）。
     - 注入机器标签：`<!-- loopx-meta: {"goal_id": "<goal-id>", "feature": "<feature>", "reviewed_head_oid": "<HEAD_SHA>"} -->`。
     - 创建 PR：`gh pr create --title "feat(<scope>): <描述>" --body-file /tmp/pr-desc.md`。
  3. **L2 审查并推送至 PR 顶置评论**：
     - 针对精确 HEAD 运行审查：`loopx --format json pr-review --target-exact-head <PR_NUMBER>@<HEAD_OID> > /tmp/pr-review.json`。
     - 生成 5-Block 中英双语审查报告，通过 `gh pr comment <PR_NUMBER> --body-file /tmp/review-summary.md` 顶置在 GitHub PR 页面。

### 阶段 8：GitHub 页面审批与安全合并 (L3 & L4)
- **工具**：GitHub PR 页面 + `loopx-pr-merge` + `loopx goal-lifecycle`。
- **规范**：
  1. 人类审批人在 GitHub PR 页面核验 8 项事实后点击 **Approve**。
  2. 运行 `loopx-pr-merge`：
     - 自动核查 PR 最新 HEAD SHA 是否与审查时的 HEAD SHA 严格一致。
     - 自动核查 GitHub Review 状态是否已为 `APPROVED`。
     - 执行原子合入：`gh pr merge <PR_NUMBER> --squash --delete-branch`。
  3. **自动闭环归档**：
     - `loopx-pr-merge` 自动从 PR Body 提取 `loopx-meta` 中的 `goal_id`，调用 `loopx goal-lifecycle --goal-id <goal-id> --operation stop --execute` 完成全自动闭环。

---

## 五、Issue 双分支流转与自适应分支保护降级引擎

### 5.1 分流判定决策矩阵 (Decision Matrix)

| 判定维度 | 路径 A：Fast-Path（极简微闭环） | 路径 B：Standard PR-Path（标准 PR 全流程） | 超界/Reject（转 Feature） |
|---|---|---|---|
| **改动行数 (Diff)** | ≤ 20 行代码改动，极小范围 | > 20 行且 < 300 行的局部改动 | 超过 300 行或大规模重构 |
| **变更性质** | 纯 Typo 修复、错误日志文案、文档更新、单测补充、隔离配置修正 | 核心业务逻辑分支修正、算法调整、并发处理、异常状态捕获与恢复 | 涉及数据模型变更、新增服务接口、业务流程重塑 |
| **对外契约** | 严格为 0（零对外公共接口、导出类型或签名变动） | 保持向后兼容，但可能扩展局部参数或内部优化 | 破坏现有 API 契约或要求 Major 版本变更 |
| **状态持久化** | 完全不涉及（无数据库、缓存 Schema、消息协议变动） | 仅涉及内存级局部状态处理 | 包含数据库 Migration、DDL/DML 调整或持久化格式变更 |
| **复现测试** | 逻辑直观或单测即可 100% 覆盖 | 必须构造独立的 Failing Repro 测试用例，且需完整回归 | 无法单机复现或涉及复杂分布式依赖 |

---

### 5.2 路径 A：Fast-Path 自适应分支保护降级流程

适用于满足 Fast-Path 准入矩阵的微小、低风险任务。**默认直接推送到主干；若遇分支保护拦截，自动静默降级为自动化 PR 流程**：

```
                    [Fast-Path 微修复执行]
                              │
                              ▼
        [Step 1: 定位与单测] ➔ [Step 2: Surgical Patch]
                              │
                              ▼
        [Step 3: 四大门禁全绿] ➔ [Step 4: 本地 code-review 0缺陷 (可选 OCR 提升)]
                              │
                              ▼
                     git commit -m "fix: ... (Fixes #<id>)"
                              │
                              ▼
                    【尝试 push origin main】
                              │
             ┌────────────────┴────────────────┐
             │                                 │
      (Success 直接合入)               (403 / Hook 拒绝: 分支保护开启)
             │                                 │
             ▼                                 ▼
   [Issue 自动关闭]                 【自适应降级模式】
             │                        ① 自动切分支: git checkout -b fast-fix/issue-<id>
             ▼                        ② 自动推送分支并创建 PR: gh pr create
   [loopx issue-fix outcome           ③ 自动注入本地门禁全绿凭据至 PR 正文
    完成审计与归档]                    ④ 自动合并 PR: gh pr merge --squash --auto
                                      ⑤ Issue 关联自动关闭并完成归档
```

---

### 5.3 路径 B：Standard PR-Path（标准 PR 全流程）

适用于涉及业务逻辑、状态变更或复杂并发的问题：
1. **工作流规划**：调用 `loopx issue-fix workflow-plan` 规划分支，拉取 `fix/issue-<id>`。
2. **复现用例先行（Failing Repro）**：编写 `tests/unit/issues/issue-<id>.test.ts`，**验证测试必须先 FAIL**。
3. **最小外科手术修复**：修改业务代码，使复现测试转为 PASS。
4. **全量门禁与代码级审查**：四大门禁本地全绿；默认通过 `code-review` 确认无违背契约缺陷；针对高危或复杂逻辑提升执行 `ocr review` 确认 0 阻断项。
5. **发布 GitHub PR**：创建 PR，正文包含 `Fixes #<id>` 与复现测试证据，触发 `loopx-pr-review` 上传 5-Block 报告。
6. **人工核准与合入**：审批人在 GitHub PR 页面核验放行，调用 `loopx-pr-merge` 合入主干，核销 Issue。

---

## 六、GitHub PR 页面审查与 8 项事实核验体系

由于团队将审查阵地统一固化在 **GitHub PR 页面**，人类审批人无需在本地搭建审查环境，直接检视 PR 顶置评论中的 5-Block 报告与 GitHub Diff，聚焦核查以下 8 大事实：

| 核对维度 | 必须看清的事实凭据 | 不满足/存疑时的标准处置规则 |
|---|---|---|
| **1. 变更身份 (Exact Identity)** | PR 描述中记录的审查提交 SHA 是否与当前 PR 最新 Commit SHA 严格一致？ | 若不一致（说明审查后又有偷跑提交），**直接打回重审** |
| **2. 需求契约 (Spec Conformity)** | 是否逐条实现了已冻结的 Spec 与 AC？是否存在未经验证的越界代码？ | 发现越界逻辑要求坚决剥离；缺失 AC 则打回补齐 |
| **3. 核心改动拓扑 (Key Changes)** | 涉及哪些模块、新增哪些依赖库、修改了哪些对外导出的公共接口？ | 评估模块依赖拓扑合理性；严禁引入未经批准的无用依赖 |
| **4. 代码审查与增强审计闭环 (Review & Escalation)** | 报告中是否附带默认 `code-review` 零缺陷结论？若触发了 OCR 提升，是否附带阿里 `ocr` 0 High/Medium 证据？ | 存在任何未反驳的契约缺陷或未解决的 High/Medium 缺陷，**一票否决拒绝合并** |
| **5. 真实门禁凭据 (Gate Evidence)** | 是否列出四大门禁的具体命令输出、测试用例总数及通过率 100%？ | 仅有口头声称而缺乏本地控制面输出证据的，**视为未经验证** |
| **6. 爆炸半径 (Blast Radius)** | 改动是否影响未修改模块？是否存在非兼容变更？ | 若存在潜在破坏性变动，要求补充兼容垫片或调整方案 |
| **7. 残余问题 (Technical Debt)** | 是否残留临时 Workaround 或未验证假设？ | 严禁隐蔽上行，必须在 GitHub Issue 中挂号追踪 |
| **8. 应急回滚 (Rollback Plan)** | 生产一旦发生异常，能否干净快速回滚（如 revert commit 或开关保护）？ | 不可逆变更必须具备数据备份与前置预案 |

---

## 七、配套 Skills 实施改造方案与代码草案

为了实现上述工作流的无缝自动化，需在本机落地并适配以下 3 个核心技能：

### 7.1 挂载与适配 L1 代码审查能力 (Code Review Skills & OCR 提升脚本)
- **默认技能路径**：`~/.codex/skills/code-review/`
  - 核心职责：执行跨边界语义契约分析、反驳式缺陷验证、正确性/性能/安全审查，生成结构化审查结论，作为团队默认 L1 门禁。
- **提升与备用技能路径**：`~/.codex/skills/open-code-review/`
  - 核心职责：封装阿里开源 `ocr` CLI 深度自动化扫描，面向高危并发、安全边界与跨模型第二意见审查，提供备用与深度增强支撑。
- **提升/备用审计脚本 (`scripts/run-ocr-audit.sh`)**：
  ```bash
  #!/usr/bin/env bash
  set -euo pipefail
  export PATH="$PATH:$HOME/.npm-global/bin"

  BASE_REF="${1:-origin/main}"
  OUTPUT_JSON="/tmp/ocr-review-result.json"

  # 执行阿里 OCR 扫描
  ocr review --audience agent --repo . --from "$BASE_REF" --to HEAD --format json --output "$OUTPUT_JSON"

  # 自动化解析 High 与 Medium 缺陷 (针对 comments[].path 与 severity)
  python3 - <<EOF
  import json, sys

  with open("$OUTPUT_JSON") as f:
      data = json.load(f)

  comments = data.get("comments", [])
  blocking_issues = [c for c in comments if c.get("severity") in ("high", "medium")]

  if blocking_issues:
      print(f"[BLOCKED] 发现 {len(blocking_issues)} 个阻断级缺陷 (High/Medium):", file=sys.stderr)
      for issue in blocking_issues:
          print(f"  - [{issue.get("severity").upper()}] {issue.get("path")}:{issue.get("line")}: {issue.get("comment")}", file=sys.stderr)
      sys.exit(1)

  print("[PASSED] OCR 审查通过: 无 High/Medium 阻断缺陷。")
  EOF
  ```

### 7.2 新建 `loopx-issue-fix` 技能
- **目标路径**：`~/.codex/skills/loopx-issue-fix/SKILL.md`
- **核心逻辑**：
  - 封装 `loopx issue-fix feasibility` 分流命令。
  - 实现 Fast-Path 的自适应分支保护探测与降级。
  - 标准化 Failing Repro 与 Issue 关联核销流程。

### 7.3 新建 `loopx-pr-merge` 技能
- **目标路径**：`~/.codex/skills/loopx-pr-merge/SKILL.md`
- **核心逻辑**：
  - 调用 `gh pr view <PR> --json reviewDecision,headRefOid` 读取 GitHub 官方状态。
  - 校验 `headRefOid == REVIEWED_OID`。
  - 校验 `reviewDecision == "APPROVED"`。
  - 执行 `gh pr merge --squash --delete-branch`，并调用 `loopx goal-lifecycle` 归档。

---

## 八、落地实施路线图与可执行指南

- **第一阶段（规范固化）**：
  - 将本文档作为团队官方研发规范合入仓库 `docs/workflow/loopx-workflow.md`。
  - 更新仓库根目录 `AGENTS.md`，注入多 Agent 并行锁、TDD 四大门禁以及“默认 code-review 技能 + OCR 备份与提升深度审计”指令。
- **第二阶段（技能部署与环境加固）**：
  - 在 `~/.codex/skills/` 部署并软链接 `code-review`、`open-code-review`、`loopx-issue-fix` 与 `loopx-pr-merge`。
  - 验证 `code-review` 技能加载以及 `ocr` 和 `gh` CLI 连通性。
- **第三阶段（真实场景双轨演练）**：
  - 演练多 Agent 并行：两个 Agent 分别领用任务，验证 `loopx task-lease` 与 `integration-branch`。
  - 演练 Issue 分流：演练一个 Typo 修复的 Fast-Path 自动合入，演练一个复杂 Bug 的 Failing Repro ➔ PR ➔ 页面 Review ➔ 合并核销。
