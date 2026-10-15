const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../js/thinking-process-network.js'), 'utf8');
const start = source.indexOf('    async selectShareOrganization()');
const end = source.indexOf('    shareKnowledgeFragmentToOrganization(', start);
assert(start >= 0 && end > start);

async function run({ groups = [], status = 'ok', ok = true, message, answer = '1', failure = false, selected = true } = {}) {
    const alerts = [], shares = [], prompts = [];
    const context = {
        document: { getElementById: () => null }, // No old group_select or organizational map.
        fetch: async (url, options) => {
            assert.equal(url, '../php/ok_core_groups.php');
            assert.equal(options.credentials, 'same-origin');
            assert.equal(options.cache, 'no-store');
            if (failure) throw new Error('network failure');
            return { ok, status: ok ? 200 : 502, json: async () => ({ status, groups, message }) };
        },
        prompt: text => { prompts.push(text); return answer; },
        alert: text => alerts.push(text),
        console: { error() {} }
    };
    const object = vm.runInNewContext('({' + source.slice(start, end) + '})', context);
    object.ownNetwork = { getSelection: () => ({ nodes: selected ? ['node1'] : [] }) };
    object.nodes = { get: id => id === 'node1' ? { label: 'text\nline' } : null };
    object.shareKnowledgeFragmentToOrganization = (...args) => shares.push(args);
    await object.selectShareOrganization();
    assert(!object.shareOrganizationLoading);
    return { alerts, shares, prompts };
}

(async () => {
    const groups = [{ group_id: 100, name: 'OK group' }, { group_id: 200, name: 'Second' }];
    const valid = await run({ groups, answer: ' 2 ' });
    assert.deepEqual(valid.shares, [[200, 'node1', 'text line']]);
    assert.equal(valid.alerts.length, 0); // Completion belongs to the save callback.
    assert(valid.prompts[0].includes('OK group'));
    for (const input of [
        {}, { groups: [{ group_id: 0 }] }, { groups, answer: '0' },
        { groups, answer: '2x' }, { groups, answer: null },
        { ok: false, status: 'error', message: 'INVALID_TOKEN' },
        { failure: true }, { selected: false }
    ]) {
        const result = await run(input);
        assert.equal(result.shares.length, 0);
    }
    const apiError = await run({ ok: false, status: 'error', message: 'INVALID_TOKEN' });
    assert(apiError.alerts[0].includes('INVALID_TOKEN'));
    assert.equal((await run()).prompts.length, 0);
    console.log('PASS: OK-Core group selection without legacy DOM; empty, invalid, cancelled and failed requests');
})().catch(error => { console.error(error); process.exitCode = 1; });
