'use strict';
/**
 * Feature 5: authentic-review-pipeline — TDD acceptance tests
 *
 * 验证第三方评审报告严格由 LoopX 原生 `pr-review` 能力驱动（不再手写 5-Block 模板）：
 *   - S1 codex 调用（默认模型，无 -m/--model）
 *   - S2 降级五段式报告：含原生五段（动机/改动思路/具体改动/对主干的风险/我的整体评价），
 *     不含任何 "5-Block" / "Block N" 手写标签
 *   - S2b 原生 review_template 驱动提示词：原生包内的 agent_instruction / output_hint 被透传进提示词
 *   - S3 PR body 组装器（--rebuild-body）
 *   - INV1 fail-closed：未核验/缺声明 -> 拒绝发布
 *   - INV2 head 漂移：模型自报 head 与当前 PR head 不一致 -> 拒绝发布
 *   - S4 carryover 裁决封顶
 *   - INV3 原生 check-result 硬门禁（仅原生模式）与协议对齐
 *   - S5 交叉核验
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const SCRIPT = path.join(PROJECT_ROOT, 'skills/code-review/scripts/authentic-review.js');

function makeSandbox(opts = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-review-'));
  const bin = path.join(dir, 'bin');
  fs.mkdirSync(bin, { recursive: true });
  const logs = path.join(dir, 'logs');
  fs.mkdirSync(logs, { recursive: true });

  const legits = { gh: 1, codex: 1, loopx: 1, npm: 1, claude: 1 };
  const {
    mockHeadOid = '1111111111111111111111111111111111111111',
    codexExit = 0, codexStdoutFile = '', verdict = 'request_changes',
    reviewHeadOid = '1111111111111111111111111111111111111111',
    claudeStdoutFile = '', loopxCheckResult = 'ok', gatesExit = 0,
    reviewTemplate = 0, codexMode = 'legacy',
  } = opts;
  for (const name of Object.keys(legits)) {
    fs.writeFileSync(path.join(bin, name), `#!/usr/bin/env bash
echo "$0 $*" >> ${JSON.stringify(logs)}/calls.log
args="$*"
case "$0" in
  *gh)
    if [[ "$args" == *"view"* ]]; then
      echo '{"headRefOid": "${mockHeadOid}", "headRefName": "feature/x", "changedFiles": 2}'
      exit 0
    fi
    if [[ "$args" == *"diff"* ]]; then
      echo 'diff --git a/src/app.js b/src/app.js'
      echo '--- a/src/app.js'
      echo '+++ b/src/app.js'
      echo '+const token = "placeholder";'
      exit 0
    fi
    if [[ "$args" == *"comment"* ]]; then exit 0; fi
    if [[ "$args" == *"edit"* ]]; then exit 0; fi
    exit 0 ;;
  *codex)
    if [[ "${codexExit}" != "0" ]]; then exit ${codexExit}; fi
    if [[ "${codexMode}" == "native" ]]; then
      cat "${codexStdoutFile}"
      exit 0
    fi
    if [[ -n "${codexStdoutFile}" ]]; then cat "${codexStdoutFile}"; else
      cat <<'JSON'
\`\`\`json
{"schemaVersion":"authentic_review_result_v1","verdict":"${verdict}","findings":[{"file":"src/app.js","line":1,"severity":"blocker","summary":"hardcoded credential pattern","repro":"grep token src/app.js"}],"declaration":{"reviewer":"codex","model":"codex-default","declaration":"runtime_reported"},"headOid":"${reviewHeadOid}"}
\`\`\`
JSON
    fi
    exit 0 ;;
  *claude)
    if [[ -n "${claudeStdoutFile}" ]]; then cat "${claudeStdoutFile}"; else
      echo '{"schemaVersion":"authentic_review_result_v1","verdict":"approve","findings":[],"declaration":{"reviewer":"claude","model":"claude-default","declaration":"runtime_reported"}}'
    fi
    exit 0 ;;
  *loopx)
    if [[ "$args" == *"pr-review"* && "$args" == *"--format json"* ]]; then
      if [[ "${reviewTemplate}" == "1" ]]; then
        cat <<JSON
{"schema_version":"pull_request_review_packet_v0","repository":"o/r","request":{"source":"github_cli"},"pull_requests":[{"number":7,"headRefOid":"${mockHeadOid}","headRefName":"feature/x","title":"t","review_action_kind":"review","review_template":{"schema":"pr_review_five_block_template_v0","sections":[{"label":"动机","minimum_prose_characters":40,"agent_instruction":"NATIVE_AGENT_INSTRUCTION_XYZ 动机约束"},{"label":"改动思路","minimum_prose_characters":80,"agent_instruction":"改动思路约束"},{"label":"具体改动","minimum_prose_characters":180,"agent_instruction":"具体改动约束"},{"label":"对主干的风险","minimum_prose_characters":120,"agent_instruction":"风险约束"},{"label":"我的整体评价","minimum_prose_characters":60,"agent_instruction":"评价约束"}],"output_hint":"NATIVE_OUTPUT_HINT_XYZ"},"review_plan":{"required_evidence_ids":["e1"],"applicability":{"behavior_bearing_change":true}},"evidence_commands":["echo evidence-ok"],"motivation":"LoopX extracted motivation text."}]}
JSON
      else
        cat <<JSON
{"schema_version":"pull_request_review_packet_v0","repository":"o/r","request":{"source":"github_cli"},"pull_requests":[{"number":7,"headRefOid":"${mockHeadOid}","headRefName":"feature/x","title":"t","review_action_kind":"review"}]}
JSON
      fi
      exit 0
    fi
    if [[ "$args" == *"--check-result"* ]]; then
      result_file=""; packet_file=""; prev=""
      for a in $args; do
        if [[ "$prev" == "--check-result" ]]; then result_file="$a"; fi
        if [[ "$prev" == "--packet" ]]; then packet_file="$a"; fi
        prev="$a"
      done
      if [[ -n "$result_file" && ! -f "$result_file" ]]; then
        echo "RESULT_FILE_MISSING_AT_CALL_TIME $result_file" >> ${JSON.stringify(logs)}/calls.log
      else
        echo "RESULT_FILE_PRESENT_AT_CALL_TIME" >> ${JSON.stringify(logs)}/calls.log
      fi
      if [[ -n "$packet_file" && -f "$packet_file" ]] && grep -q '"pull_requests"' "$packet_file"; then
        echo "PACKET_HAS_PULL_REQUESTS" >> ${JSON.stringify(logs)}/calls.log
      fi
      if [[ -n "$result_file" && -f "$result_file" ]] && grep -q '"pull_request_review_result_v1"' "$result_file"; then
        echo "RESULT_SCHEMA_V1" >> ${JSON.stringify(logs)}/calls.log
      fi
      if [[ -n "$result_file" && -f "$result_file" ]] && grep -q "7@${mockHeadOid}" "$result_file"; then
        echo "TARGET_EXACT_HEAD_MATCHES" >> ${JSON.stringify(logs)}/calls.log
      fi
      if [[ "${loopxCheckResult}" == "fail" ]]; then
        echo '{"ok":false,"review_body_check":{"valid":false,"invalid_reasons":["五段式版式未通过"]},"errors":["review_body:missing_section"]}'
        exit 1
      fi
      echo '{"ok":true,"review_body_check":{"valid":true},"errors":[],"approval_consistent":true}'
      exit 0
    fi
    echo "[mock loopx] $args"; exit 0 ;;
  *npm)
    echo "stub gate OK"; exit ${gatesExit} ;;
esac
exit 0
`);
  }
  fs.chmodSync(path.join(bin, 'gh'), 0o755);
  fs.chmodSync(path.join(bin, 'codex'), 0o755);
  fs.chmodSync(path.join(bin, 'loopx'), 0o755);
  fs.chmodSync(path.join(bin, 'npm'), 0o755);
  fs.chmodSync(path.join(bin, 'claude'), 0o755);
  return { dir, bin, logs: path.join(logs, 'calls.log') };
}

function run(sbx, args, envExtra) {
  const env = {
    ...process.env,
    PATH: `${sbx.bin}:${process.env.PATH}`,
    AUTHENTIC_REVIEW_HEAD_OID: '1111111111111111111111111111111111111111',
  };
  if (envExtra) Object.assign(env, envExtra);
  try {
    const out = execFileSync('node', [SCRIPT, ...args], { env, encoding: 'utf8', cwd: PROJECT_ROOT, timeout: 120000 });
    return { code: 0, out };
  } catch (err) {
    return { code: err.status ?? 1, out: `${err.stdout || ''}${err.stderr || ''}` };
  }
}

function writeNativeCodexOut(extraBody) {
  const f = path.join(os.tmpdir(), `codex-native-${Date.now()}-${Math.floor(Math.random() * 1e6)}.json`);
  const body = `Reviewer: model_agent
## 动机
native motivation content ${extraBody || ''}
## 改动思路
native approach
## 具体改动
native changes
## 对主干的风险
native risks
## 我的整体评价
native verdict
English verdict: APPROVE`;
  fs.writeFileSync(f, '```json\n' + JSON.stringify({
    review_body: body,
    verdict: 'APPROVE',
    findings: [],
    reviewer: { actor_kind: 'model_agent', declaration_source: 'self_reported', declared_model: 'codex', declared_provider: 'openai' },
  }) + '\n```');
  return f;
}

const HEAD = '1111111111111111111111111111111111111111';
const FEATURE = 'native-dispatch-deep-integration';

describe('S1 invocation: codex exec with default model', () => {
  test('prompt carries head oid, remote diff and JSON protocol; no model flag', () => {
    const sbx = makeSandbox();
    const r = run(sbx, ['--pr', '7', '--repo', 'o/r', '--feature', FEATURE]);
    assert.strictEqual(r.code, 0, r.out);
    const calls = fs.readFileSync(sbx.logs, 'utf8');
    assert.match(calls, /codex exec/);
    assert.doesNotMatch(calls, /codex exec .*-m |codex exec .*--model /);
  });
});

describe('S2 degraded 5-section report (no native template available)', () => {
  test('report has the 5 native sections + finding + verdict + declaration; no 5-Block labels', () => {
    const sbx = makeSandbox();
    const r = run(sbx, ['--pr', '7', '--repo', 'o/r', '--feature', FEATURE]);
    assert.strictEqual(r.code, 0, r.out);
    // 原生五段式一级标题必须齐备
    assert.match(r.out, /## 动机/);
    assert.match(r.out, /## 改动思路/);
    assert.match(r.out, /## 具体改动/);
    assert.match(r.out, /## 对主干的风险/);
    assert.match(r.out, /## 我的整体评价/);
    // 具体改动段含真实 finding
    assert.match(r.out, /hardcoded credential pattern/);
    assert.match(r.out, /request_changes/i);
    assert.match(r.out, /runtime_reported/);
    // 严禁手写 5-Block / Block N 标签
    assert.doesNotMatch(r.out, /5-Block|fiveBlock|five_block/i);
    assert.doesNotMatch(r.out, /Block\s*[1-5]\b/);
    const calls = fs.readFileSync(sbx.logs, 'utf8');
    assert.match(calls, /gh .*comment/);
  });
});

describe('S2b native review_template drives the prompt (LoopX packet)', () => {
  test('native agent_instruction / output_hint are passed through into the prompt', () => {
    const sbx = makeSandbox({ reviewTemplate: 1 });
    const r = run(sbx, ['--pr', '7', '--repo', 'o/r', '--feature', FEATURE]);
    assert.strictEqual(r.code, 0, r.out);
    const calls = fs.readFileSync(sbx.logs, 'utf8');
    // 原生能力约束被透传（不是手写模板）
    assert.match(calls, /NATIVE_AGENT_INSTRUCTION_XYZ/);
    assert.match(calls, /NATIVE_OUTPUT_HINT_XYZ/);
    // 报告仍是原生五段式
    assert.match(r.out, /## 动机/);
    assert.match(r.out, /## 我的整体评价/);
    assert.match(r.out, /English verdict/i);
  });

  test('native mode + model native schema -> fixup injects single Reviewer/English verdict lines', () => {
    const nativeFile = writeNativeCodexOut();
    const sbx = makeSandbox({ reviewTemplate: 1, codexMode: 'native', codexStdoutFile: nativeFile });
    const r = run(sbx, ['--pr', '7', '--repo', 'o/r', '--feature', FEATURE]);
    assert.strictEqual(r.code, 0, r.out);
    assert.match(r.out, /Reviewer: model_agent/);
    // 恰好一行 Reviewer（被脚本统一注入）
    const reviewerLines = (r.out.match(/^Reviewer:/gm) || []).length;
    assert.strictEqual(reviewerLines, 1, `expected exactly 1 Reviewer line, got ${reviewerLines}`);
    // 恰好一行 English verdict
    const verdictLines = (r.out.match(/^English verdict:/gm) || []).length;
    assert.strictEqual(verdictLines, 1, `expected exactly 1 English verdict line, got ${verdictLines}`);
  });
});

describe('S3 PR body assembler', () => {
  test('five sections present; missing capsule asset marked NOT_PROVIDED', () => {
    const sbx = makeSandbox();
    const r = run(sbx, ['--pr', '7', '--repo', 'o/r', '--feature', '__nonexistent_capsule__', '--rebuild-body']);
    assert.strictEqual(r.code, 0, r.out);
    assert.match(r.out, /## 动机|## Motivation/i);
    assert.match(r.out, /NOT_PROVIDED/);
    const calls = fs.readFileSync(sbx.logs, 'utf8');
    assert.match(calls, /gh .*edit/);
  });
});

describe('INV1 fail-closed', () => {
  test('unparseable codex output -> exit 1, NOT_VERIFIED, no comment', () => {
    const f = path.join(os.tmpdir(), `codex-garbage-${Date.now()}.txt`);
    fs.writeFileSync(f, 'I could not review this PR, sorry.');
    const sbx = makeSandbox({ codexStdoutFile: f });
    const r = run(sbx, ['--pr', '7', '--repo', 'o/r', '--feature', FEATURE]);
    assert.notStrictEqual(r.code, 0);
    assert.match(r.out, /NOT_VERIFIED/);
    const calls = fs.readFileSync(sbx.logs, 'utf8');
    assert.doesNotMatch(calls, /\/gh pr comment/);
  });
  test('missing model declaration -> rejected', () => {
    const f = path.join(os.tmpdir(), `codex-nodecl-${Date.now()}.json`);
    fs.writeFileSync(f, '```json\n{"schemaVersion":"authentic_review_result_v1","verdict":"approve","findings":[],"headOid":"' + HEAD + '"}\n```');
    const sbx = makeSandbox({ codexStdoutFile: f });
    const r = run(sbx, ['--pr', '7', '--repo', 'o/r', '--feature', FEATURE]);
    assert.notStrictEqual(r.code, 0);
    assert.match(r.out, /declaration|DECLARATION/i);
  });
});

describe('INV2 head drift', () => {
  test('model-reported head differs from current PR head -> exit 1', () => {
    const f = path.join(os.tmpdir(), `codex-drift-${Date.now()}.json`);
    fs.writeFileSync(f, '```json\n{"schemaVersion":"authentic_review_result_v1","verdict":"approve","findings":[],"declaration":{"reviewer":"codex","model":"d","declaration":"runtime_reported"},"headOid":"' + HEAD + '"}\n```');
    // PR head（gh view）被改为 222...，但模型自报 111... -> 漂移
    const sbx = makeSandbox({ codexStdoutFile: f, mockHeadOid: '2222222222222222222222222222222222222222' });
    const r = run(sbx, ['--pr', '7', '--repo', 'o/r', '--feature', FEATURE]);
    assert.notStrictEqual(r.code, 0);
    assert.match(r.out, /drift|DRIFT|head/i);
  });
});

describe('S4 carryover verdict capping', () => {
  test('unresolved reproducible finding caps verdict at request_changes', () => {
    const f = path.join(os.tmpdir(), `codex-ok-${Date.now()}.json`);
    fs.writeFileSync(f, '```json\n{"schemaVersion":"authentic_review_result_v1","verdict":"approve","findings":[],"declaration":{"reviewer":"codex","model":"d","declaration":"runtime_reported"},"headOid":"' + HEAD + '"}\n```');
    const sbx = makeSandbox({ codexStdoutFile: f, verdict: 'approve' });
    const carry = path.join(sbx.dir, 'carryover.json');
    fs.writeFileSync(carry, JSON.stringify({ findings: [{ file: 'src/app.js', line: 9, severity: 'blocker', summary: 'injected injection' }] }));
    const r = run(sbx, ['--pr', '7', '--repo', 'o/r', '--feature', FEATURE, '--carryover-file', carry]);
    assert.strictEqual(r.code, 0, r.out);
    assert.match(r.out, /request_changes/i);
    assert.match(r.out, /injected injection/);
    assert.match(r.out, /Carryover|待闭环/i);
  });
});

describe('INV3 native check-result gate', () => {
  test('native mode: check-result rejects 5-section body -> NOT_VERIFIED, no publish', () => {
    const sbx = makeSandbox({ reviewTemplate: 1, loopxCheckResult: 'fail' });
    const r = run(sbx, ['--pr', '7', '--repo', 'o/r', '--feature', FEATURE]);
    assert.notStrictEqual(r.code, 0);
    assert.match(r.out, /NOT_VERIFIED|版式校验未通过|五段式/i);
    const calls = fs.readFileSync(sbx.logs, 'utf8');
    assert.doesNotMatch(calls, /\/gh pr comment/);
    assert.match(calls, /RESULT_FILE_PRESENT_AT_CALL_TIME/);
  });
});

describe('INV3 native check-result protocol alignment', () => {
  test('result file written BEFORE --check-result call (no timing inversion)', () => {
    const sbx = makeSandbox({ reviewTemplate: 1 });
    const r = run(sbx, ['--pr', '7', '--repo', 'o/r', '--feature', FEATURE]);
    assert.strictEqual(r.code, 0, r.out);
    const calls = fs.readFileSync(sbx.logs, 'utf8');
    assert.match(calls, /RESULT_FILE_PRESENT_AT_CALL_TIME/);
    assert.doesNotMatch(calls, /RESULT_FILE_MISSING_AT_CALL_TIME/);
  });
  test('packet is pull_request_review_packet_v0 with pull_requests; result binds pr@head', () => {
    const sbx = makeSandbox({ reviewTemplate: 1 });
    const r = run(sbx, ['--pr', '7', '--repo', 'o/r', '--feature', FEATURE]);
    assert.strictEqual(r.code, 0, r.out);
    const calls = fs.readFileSync(sbx.logs, 'utf8');
    assert.match(calls, /PACKET_HAS_PULL_REQUESTS/);
    assert.match(calls, /RESULT_SCHEMA_V1/);
    assert.match(calls, /TARGET_EXACT_HEAD_MATCHES/);
  });
});

describe('S5 cross validation', () => {
  test('disputed findings annotated when claude disagrees', () => {
    const cf = path.join(os.tmpdir(), `claude-disagree-${Date.now()}.json`);
    fs.writeFileSync(cf, '```json\n{"schemaVersion":"authentic_review_result_v1","verdict":"approve","findings":[],"declaration":{"reviewer":"claude","model":"c","declaration":"runtime_reported"}}\n```');
    const sbx = makeSandbox({ claudeStdoutFile: cf });
    const r = run(sbx, ['--pr', '7', '--repo', 'o/r', '--feature', FEATURE, '--cross-validate']);
    assert.strictEqual(r.code, 0, r.out);
    assert.match(r.out, /DISPUTED|cross|CROSS/i);
  });
});
