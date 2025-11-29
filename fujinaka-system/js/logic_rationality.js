// rationality.php から pairStatus を取得して助言を表示する処理
// ont_claim.js の構成を参考に作成

// データ取得
function getRationalityStatus() {
	return $.getJSON('php/rationality.php').then(function(resp){
		if (!resp || resp.ok !== true) {
			return $.Deferred().reject({ message: 'rationality取得失敗', detail: resp }).promise();
		}
		return resp; // { pairStatus: { noneInLogic:[], oneInLogic:[], bothInLogic:[] }, ... }
	});
}

// 助言描画
function renderRationalityAdvice(containerSelector) {
	const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
	$(containerSelector).html('<div class="loading">読み込み中...</div>');
	getRationalityStatus()
		.done(function(res){
			try { console.log('rationality.php response', res); } catch(e) {}
			const ps = (res.pairStatus) || {};
			const noneArr = ps.noneInLogic || [];
			const oneArr  = ps.oneInLogic || [];
			const bothArr = ps.bothInLogic || [];

			// 共通: ペア概要文字列
			const formatPairNodes = (entry) => {
				const nodes = entry.node_ids || [];
				return nodes.map(n => `#${esc(n)}`).join(' / ');
			};

			// ノード詳細（content, logic_node_ids）
			const nodeLogicSummary = (entry) => {
				const list = entry.nodesLogic || [];
				return list.map(n => {
					const lnIds = (n.logic_node_ids || []).map(id => esc(id)).join(',');
					return `<span class="node-detail">node:${esc(n.node_id)} content:"${esc(n.content)}" logic_node_ids:[${lnIds}]</span>`;
				}).join('<br>');
			};

			// アンカー配下子ノード内容
			const anchorChildrenHtml = (entry) => {
				const arr = entry.anchorChildContents || [];
				if (!arr.length) return '';
				const items = arr.map(c => `<li>#${esc(c.node_id)}: ${esc(c.content)}</li>`).join('');
				return `<div class="anchor-children"><strong>関連子ノード:</strong><ul>${items}</ul></div>`;
			};

			// セクション生成
			const section = (title, entries, lineBuilder) => {
				if (!entries.length) return '';
				const items = entries.map(e => `<li>${lineBuilder(e)}${anchorChildrenHtml(e)}<div class="pair-nodes">${nodeLogicSummary(e)}</div></li>`).join('');
				return `<h4>${esc(title)}</h4><ul class="rationality-advice-list">${items}</ul>`;
			};

			// メッセージ生成ロジック
			const lineNone = (e) => {
				return `ペア(${formatPairNodes(e)})はまだ論理構成に取り込まれていません。これらを claim/fact/reason のいずれかへ対応付ける必要はありませんか？`;
			};
			const lineOne = (e) => {
				// logicDetail から片側の presentIndex を利用可能
				const presentIndex = e.logicDetail ? e.logicDetail.presentIndex : null;
				let hint = '';
				if (presentIndex === 0 || presentIndex === 1) {
					const side = presentIndex === 0 ? '一方(先頭ノード)' : '一方(二番目ノード)';
					hint = `${side}のみ論理構成に存在。もう片方も論理要素化すべきか検討してください。`;
				} else {
					hint = '片方のみ論理構成に存在。もう片方の論理要素化を検討。';
				}
				return `ペア(${formatPairNodes(e)}) ${hint}`;
			};
			const lineBoth = (e) => {
				return `ペア(${formatPairNodes(e)})は両方とも論理構成に取り込まれています。整合性や重複を確認し、不要な冗長がないか検討してください。`;
			};

			let body = [
				section('未取り込みペア (noneInLogic)', noneArr, lineNone),
				section('片側のみ取り込み (oneInLogic)', oneArr, lineOne),
				section('両側取り込み済み (bothInLogic)', bothArr, lineBoth)
			].join('');
			if (!body || body.trim() === '') {
				body = '<div class="empty">対象のペアが見つかりませんでした。</div>';
			}
			const html = '<div class="rationality-advice">' + body + '</div>';
			$(containerSelector).html(html);
		})
		.fail(function(err){
			console.error(err);
			$(containerSelector).html('<div class="error">rationality取得に失敗しました</div>');
		});
}

// 公開関数（ボタン等から呼び出し想定）
window.showRationalityAdvice = function(selector){
	// ont_claim.js と同じ助言領域 (#advice_output) を既定とする
	try { $('#advice_panel').show(); } catch(e) {}
	const target = selector || '#advice_output';
	renderRationalityAdvice(target);
};

