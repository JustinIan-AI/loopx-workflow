const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync, execSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const LOOPX_FLOW = path.join(PROJECT_ROOT, 'bin/loopx-flow');
const AUTHENTIC_REVIEW_SCRIPT = path.join(PROJECT_ROOT, 'skills/code-review/scripts/authentic-review.js');

test('1. PR #7545 Alignment: buildBody generates bilingual 4-Part structure and verification matrix', () => {
  // Read authentic-review.js to verify buildBody structure
  const scriptContent = fs.readFileSync(AUTHENTIC_REVIEW_SCRIPT, 'utf8');
  assert.strictEqual(scriptContent.includes('## 动机 / Motivation'), true, 'Must include Motivation header');
  assert.strictEqual(scriptContent.includes('## 改动思路 / Approach'), true, 'Must include Approach header');
  assert.strictEqual(scriptContent.includes('## 具体改动 / Changes'), true, 'Must include Changes header');
  assert.strictEqual(scriptContent.includes('## 对主干的风险 / Risks'), true, 'Must include Risks header');
  assert.strictEqual(scriptContent.includes('### 验证矩阵'), true, 'Must include Verification Matrix header');
});

test('2. 3D Model Review: Block 4 renders delivery, long_horizon, user_experience and Verdict', () => {
  const scriptContent = fs.readFileSync(AUTHENTIC_REVIEW_SCRIPT, 'utf8');
  assert.strictEqual(scriptContent.includes('delivery'), true, 'Review prompt/body must evaluate delivery');
  assert.strictEqual(scriptContent.includes('long_horizon'), true, 'Review prompt/body must evaluate long_horizon');
  assert.strictEqual(scriptContent.includes('user_experience'), true, 'Review prompt/body must evaluate user_experience');
  assert.strictEqual(scriptContent.includes('我的整体评价 / Verdict') || scriptContent.includes('Verdict'), true, 'Must include Verdict section');
});

test('3. Registry Boundary: .loopx/registry.json is untracked by Git and ignored in .gitignore', () => {
  const gitignore = fs.readFileSync(path.join(PROJECT_ROOT, '.gitignore'), 'utf8');
  assert.match(gitignore, /\.loopx\/registry\.json|\.loopx\//, '.gitignore must ignore .loopx registry');

  const lsFiles = execSync('git ls-files .loopx/registry.json', { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim();
  assert.strictEqual(lsFiles, '', '.loopx/registry.json must not be tracked in git index');
});

test('4. Goal State Capsule Binding: cmd_feature binds state-file into specs/features/<feat>/ACTIVE_STATE.md', () => {
  const flowCode = fs.readFileSync(LOOPX_FLOW, 'utf8');
  assert.match(
    flowCode,
    /--state-file\s+.*specs\/features\/\$feature\/ACTIVE_STATE\.md/,
    'cmd_feature must pass capsule-bound --state-file to loopx bootstrap'
  );
});

test('5. Lifecycle Sync & Retirement: cmd_merge triggers retire-global-goal and sync-global', () => {
  const flowCode = fs.readFileSync(LOOPX_FLOW, 'utf8');
  assert.match(
    flowCode,
    /loopx.*retire-global-goal/,
    'cmd_merge must invoke loopx retire-global-goal upon feature completion'
  );
  assert.match(
    flowCode,
    /loopx.*sync-global/,
    'cmd_merge must invoke loopx sync-global'
  );
});

test('6. loopx-flow respond subcommand exists and displays help', () => {
  const res = spawnSync(LOOPX_FLOW, ['respond', '--help'], { encoding: 'utf8' });
  // Should handle respond or display usage
  assert.match(res.stderr + res.stdout, /respond <pr_id>|针对 Review 意见的更新与验证汇报/, 'Must provide respond subcommand');
});
test("7. Key Code Explanations: buildBody explains changes per file rather than flat paths", () => {
  const scriptContent = fs.readFileSync(AUTHENTIC_REVIEW_SCRIPT, "utf8");
  assert.strictEqual(scriptContent.includes("describeFile"), true, "Must have describeFile helper");
  assert.strictEqual(scriptContent.includes("具体改动 / Changes (关键代码讲解)"), true, "Header must follow PR #7545 format");
  assert.strictEqual(scriptContent.includes("extractMotivation"), true, "Must extract motivation robustly");
  assert.strictEqual(scriptContent.includes("extractApproach"), true, "Must extract approach robustly");
});

test("8. Response Safety & Tap Isolation: cmd_respond produces isolated matrix without leaking raw test logs", () => {
  const flowCode = fs.readFileSync(LOOPX_FLOW, "utf8");
  // Must not have unquoted heredoc command substitution
  assert.doesNotMatch(flowCode, /cat\s*<<\s*RESPEOF[\s\S]*?npm\s*test/, "cmd_respond must not embed npm test inside unquoted heredoc");
  assert.match(flowCode, /pr-response-.*\.md/, "cmd_respond must generate markdown file safely");
});
