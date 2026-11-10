const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const code = fs.readFileSync(path.join(__dirname, '../js/ok-core-sharing.js'), 'utf8');
function setup(result, answer = '1', ok = true) {
    const calls = [], alerts = [];
    const context = { window: {}, document: { getElementById: () => null },
        prompt: text => { calls.push(text); return answer; }, alert: text => alerts.push(text),
        fetch: async (url, options) => { calls.push({ url, options }); return { ok, json: async () => result }; },
        setTimeout: () => 1, clearTimeout() {} };
    vm.runInNewContext(code, context);
    return { helper: context.window.ForestOkCoreSharing, calls, alerts };
}
(async () => {
    const valid = setup({ status: 'ok', groups: [{ group_id: '100', name: 'OK group' }] });
    assert.equal((await valid.helper.chooseGroup()).group_id, '100');
    assert.equal(valid.calls[0].options.credentials, 'same-origin');
    assert.equal(valid.calls[0].options.cache, 'no-store');
    assert.equal((await setup({ status: 'ok', groups: [{ group_id: 1, name: 'a' }] }, null).helper.chooseGroup()), null);
    for (const candidate of [setup({ status: 'ok', groups: [] }), setup({ status: 'error', message: 'denied' }, '1', false),
        setup({ status: 'ok', groups: [{ group_id: 1, name: 'a' }] }, 'bad')]) await assert.rejects(candidate.helper.chooseGroup());
    assert(valid.helper.describe({ status: 'ok', ok_core: { status: 'SENT' } }).includes('送信が完了'));
    assert(valid.helper.describe({ status: 'ok', ok_core: { status: 'QUEUED' } }).includes('送信待ち'));
    assert(valid.helper.describe({ status: 'ok', ok_core: { status: 'FAILED' } }).includes('入力し直さず'));
    assert(valid.helper.describe({ status: 'error', message: 'save failed' }).includes('save failed'));
    console.log('PASS: API-derived group selection, cancellation, errors and accurate delivery messages without old group_select DOM.');
})().catch(error => { console.error(error); process.exitCode = 1; });
