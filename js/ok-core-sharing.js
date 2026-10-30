(function () {
    'use strict';
    let pollTimer = null, pollSerial = 0;

    async function chooseGroup() {
        const response = await fetch('../php/ok_core_groups.php', {
            credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }
        });
        let result;
        try { result = await response.json(); }
        catch (_) { throw new Error('共有先を取得できません（HTTP ' + response.status + '）。サーバーの設定を確認してください。'); }
        if (!response.ok || result.status !== 'ok') {
            throw new Error((result.message || 'OK-Coreの共有先を取得できません。')
                + (result.error_code ? ' [' + result.error_code + ']' : ''));
        }
        const groups = (Array.isArray(result.groups) ? result.groups : [])
            .filter(group => /^[1-9]\d*$/.test(String(group.group_id)));
        if (!groups.length) throw new Error('共有できる組織がありません。OK-Coreでログインと所属を確認してください。');
        const answer = prompt('共有するOK-Coreの組織を選択してください:\n\n'
            + groups.map((group, i) => (i + 1) + '. ' + group.name).join('\n')
            + '\n\n組織番号 (1-' + groups.length + '):', '1');
        if (answer === null) return null;
        const number = answer.trim();
        const group = /^[1-9]\d*$/.test(number) ? groups[Number(number) - 1] : null;
        if (!group) throw new Error('無効な組織番号です。選択し直してください。');
        return group;
    }

    function describe(result) {
        if (!result || result.status !== 'ok') return result && result.message || 'KFの保存結果を確認できません。';
        const delivery = result.ok_core || {};
        const saved = (result.operation || delivery.operation) === 'DELETE' ? 'Forestに削除を保存しました。' : 'Forestに保存しました。';
        if (delivery.status === 'SENT') return saved + 'OK-Coreへの送信が完了しました。';
        if (delivery.status === 'SUPERSEDED') return 'Forestに保存しました。新しい版が送信対象になっています。';
        if (delivery.status === 'QUEUED' || delivery.status === 'PENDING' || delivery.status === 'BUSY') {
            return saved + 'OK-Coreへの送信待ちです。'
                + (delivery.next_retry_at ? '\n次回再送予定: ' + delivery.next_retry_at : '');
        }
        return saved + 'OK-Coreへの送信は未完了です。'
            + (delivery.error_code ? '\nエラー: ' + delivery.error_code : '')
            + '\n入力し直さず、送信設定・Outboxを確認してください。';
    }

    function statusElement() {
        let element = document.getElementById('kf_delivery_status');
        const button = document.getElementById('lesson_action_button');
        if (!element && button) {
            element = document.createElement('p');
            element.id = 'kf_delivery_status';
            element.setAttribute('role', 'status');
            element.setAttribute('aria-live', 'polite');
            element.style.whiteSpace = 'pre-wrap';
            button.insertAdjacentElement('afterend', element);
        }
        return element;
    }

    function notify(result, popup = true) {
        const turn = ++pollSerial;
        const text = describe(result);
        const element = statusElement();
        if (element) element.textContent = text;
        if (popup) alert(text);
        if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; }
        const delivery = result && result.ok_core || {};
        const outboxId = result && (result.outbox_id || delivery.outbox_id);
        if (!outboxId || !['QUEUED', 'PENDING', 'BUSY'].includes(delivery.status)) return;
        // Only one bounded polling chain per page; all reads stay on the Forest backend.
        let remaining = 120;
        const poll = async () => {
            if (turn !== pollSerial || --remaining < 0) return;
            try {
                const response = await fetch('../php/get_kf_sync_status.php?outbox_id=' + encodeURIComponent(outboxId),
                    { credentials: 'same-origin', cache: 'no-store' });
                const next = await response.json();
                if (turn !== pollSerial) return;
                if (!response.ok || next.status !== 'ok') return;
                const target = statusElement();
                if (target) target.textContent = describe(next);
                if (!['QUEUED', 'PENDING', 'BUSY'].includes(next.ok_core.status)) return;
            } catch (_) { /* Keep the last confirmed local-save state. */ }
            if (turn === pollSerial) pollTimer = setTimeout(poll, 15000);
        };
        pollTimer = setTimeout(poll, 15000);
    }

    window.ForestOkCoreSharing = { chooseGroup, describe, notify };
}());
