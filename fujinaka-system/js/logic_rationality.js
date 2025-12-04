// rationality.php から pairStatus を取得して助言を表示する処理
// ont_claim.js の getDiffConceptLabels を参照して差分も併記
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
	$.when(
		getRationalityStatus(),
		(window.getDiffConceptLabels ? window.getDiffConceptLabels() : $.Deferred().resolve({ ok:true, mapMinusLogic:[], mapMinusClaim:[], intersection:[] }).promise())
	)
		.done(function(res, diff){
			if (Array.isArray(res)) res = res[0];
			if (Array.isArray(diff)) diff = diff[0];
			console.log('rationality.php response:', res);
			console.log('ont-claim diff response:', diff);

			const noneArr = res.noneinlogic || (res.displayEntries && res.displayEntries.noneinlogic) || [];
			const oneArr  = res.oneinlogic  || (res.displayEntries && res.displayEntries.oneinlogic)  || [];
			const bothArr = res.bothinlogic || (res.displayEntries && res.displayEntries.bothinlogic) || [];

			console.log('noneinlogic:', noneArr);
			console.log('oneinlogic:', oneArr);
			console.log('bothinlogic:', bothArr);

			const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

			// none/one/bothごとの助言文生成
			const nodeContentList = (nodes) =>
				(nodes||[]).map(n => `node_id:${esc(n.node_id)} content:"${esc(n.content)}"`).join(' / ');
			const anchorContentList = (children) =>
				(children||[]).map(c => `#${esc(c.node_id)} "${esc(c.content)}"`).join(', ');
			const logicContentList = (matches) =>
				(matches||[]).map(m => `logic_node_id:${esc(m.logic_node_id)} f_node_id:${esc(m.f_node_id)} content:"${esc(m.content)}"`).join('<br>');

			// 追加: テキスト（content）のみを抽出するヘルパー
			const nodeTextList = (nodes) =>
				(nodes||[]).map(n => `"${esc(n.content)}"`).join(' / ');
			const anchorTextList = (children) =>
				(children||[]).map(c => `"${esc(c.content)}"`).join(', ');

			const lineNone = (e) => {
				console.log('[none] entry:', e);
				// ノードIDなどは表示しない。contentのテキストのみを提示。
				const nodeTexts = (e.nodes || []).map(n => `"${esc(n.content)}"`).join(' / ');
				const anchorTexts = (e.anchor_children || []).map(c => `"${esc(c.content)}"`).join(', ');
				return `<div class="entry">
					<div class="advice">${nodeTexts}に対する合理性として${anchorTexts}を日々の思考整理で述べていますがこれらを三角ロジックとして考えなくてよいですか</div>
				</div>`;
			};
			const lineOne = (e) => {
				console.log('[one] entry:', e);
				// 片方だけロジックにある（oneinlogic）ケースで、どちらが反映済みかを明示しつつ、表示はcontentのみ
				const matchedSet = new Set((e.logic_matches || []).map(m => String(m.f_node_id)));
				const nodesInLogicArr = (e.nodes || []).filter(n => matchedSet.has(String(n.node_id)));
				const nodesNotInLogicArr = (e.nodes || []).filter(n => !matchedSet.has(String(n.node_id)));
				const nodesInLogicText = nodeTextList(nodesInLogicArr);
				const nodesNotInLogicText = nodeTextList(nodesNotInLogicArr);
				const anchorsText = anchorTextList(e.anchor_children);
				return `<div class="entry">
					<div class="advice">あなたは「${nodesInLogicText}」を主張とした三角ロジックを作成しています。また日々の思考で「${nodesInLogicText}」と「${nodesNotInLogicText}」の合理性について「${anchorsText}」と述べています。これらの内容は三角ロジックに反映されていますか</div>
				</div>`;
			};
			const lineBoth = (e) => {
				console.log('[both] entry:', e);
				// IDは表示せず、contentのみを表示
				const nodeTexts = (e.nodes || []).map(n => `"${esc(n.content)}"`).join(' / ');
				const anchorTexts = (e.anchor_children || []).map(c => `"${esc(c.content)}"`).join(', ');
				const logicTexts = (e.logic_matches || []).map(m => `"${esc(m.content)}"`).join('<br>');
				return `<div class="entry">
					<div class="advice">あなたは「${logicTexts}」を主張とする三角ロジックを作成しています。また日々の思考整理では、「${nodeTexts}」についての合理性「${anchorTexts}」を述べています。これらは三角ロジックに反映されていますか</div>
				</div>`;
			};

			const section = (title, entries, lineFn) => {
				console.log('section:', title, entries);
				if (!entries.length) return '';
				const items = entries.map(lineFn).join('');
				return `<h4>${esc(title)}</h4><div class="rationality-advice-list">${items}</div>`;
			};

			let body = [
				section('noneinlogic', noneArr, lineNone),
				section('oneinlogic', oneArr, lineOne),
				section('bothinlogic', bothArr, lineBoth)
			].join('');
			if (!body.trim()) body = '<div class="empty">対象のペアが見つかりませんでした。</div>';
			console.log('rendered html:', body);
			const $target = $(containerSelector);
			if ($target.length === 0) {
				console.warn('指定のcontainerSelectorに該当する要素がありません:', containerSelector);
			} else {
				$target.html('<div class="rationality-advice">'+body+'</div>');
				console.log('after html set:', $target.html());
			}
		})
		.fail(function(err){
			console.error('getRationalityStatus failed:', err);
			$(containerSelector).html('<div class="error">rationality取得に失敗しました</div>');
		});
}

// 公開関数（ボタン等から呼び出し想定）
window.showRationalityAdvice = function(selector){
	// 出力先をAIアウトプットに統一し、パネルを開く
	try {
		var panel = document.getElementById('ai_output_panel');
		var body = document.getElementById('ai_output_body');
		var header = document.getElementById('ai_output_header');
		var icon = document.getElementById('ai_toggle_icon');
		if (panel) panel.style.display = 'block';
		if (body && header && icon) {
			body.style.display = 'block';
			icon.textContent = '▼';
			header.setAttribute('aria-expanded', 'true');
		}
	} catch(e) {}
	const target = '#ai_output';
	renderRationalityAdvice(target);
};

// 追加: noneのみを表示する関数（第一助言）
window.firstadvice = function(){
	try {
		var panel = document.getElementById('ai_output_panel');
		var body = document.getElementById('ai_output_body');
		var header = document.getElementById('ai_output_header');
		var icon = document.getElementById('ai_toggle_icon');
		if (panel) panel.style.display = 'block';
		if (body && header && icon) {
			body.style.display = 'block';
			icon.textContent = '▼';
			header.setAttribute('aria-expanded', 'true');
		}
	} catch(e) {}
	// noneのみ描画
	getRationalityStatus()
		.done(function(res){
			const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
			const noneArr = res.noneinlogic || (res.displayEntries && res.displayEntries.noneinlogic) || [];
			const lineNone = (e) => {
				const nodeTexts = (e.nodes || []).map(n => `"${esc(n.content)}"`).join(' / ');
				const anchorTexts = (e.anchor_children || []).map(c => `"${esc(c.content)}"`).join(', ');
				return `<div class="entry">
					<div class="advice">${nodeTexts}に対する合理性として${anchorTexts}を日々の思考整理で述べていますがこれらを三角ロジックとして考えなくてよいですか</div>
				</div>`;
			};
			const items = noneArr.map(lineNone).join('');
			const html = items ? `<h4>noneinlogic</h4><div class="rationality-advice-list">${items}</div>` : '<div class="empty">none の対象がありません。</div>';
			$('#ai_output').html('<div class="rationality-advice">'+html+'</div>');
		})
		.fail(function(err){
			console.error('[logic_rationality] firstadvice failed', err);
			$('#ai_output').html('<div class="error">合理性情報の取得に失敗しました</div>');
		});
};

// 追加: one+both を表示する関数（第二助言）
window.secondadvice = function(){
	try {
		var panel = document.getElementById('ai_output_panel');
		var body = document.getElementById('ai_output_body');
		var header = document.getElementById('ai_output_header');
		var icon = document.getElementById('ai_toggle_icon');
		if (panel) panel.style.display = 'block';
		if (body && header && icon) {
			body.style.display = 'block';
			icon.textContent = '▼';
			header.setAttribute('aria-expanded', 'true');
		}
	} catch(e) {}
	// one + both を描画
	getRationalityStatus()
		.done(function(res){
			const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
			const nodeContentList = (nodes) => (nodes||[]).map(n => `node_id:${esc(n.node_id)} content:"${esc(n.content)}"`).join(' / ');
			const anchorContentList = (children) => (children||[]).map(c => `#${esc(c.node_id)} "${esc(c.content)}"`).join(', ');
			const logicContentList = (matches) => (matches||[]).map(m => `logic_node_id:${esc(m.logic_node_id)} f_node_id:${esc(m.f_node_id)} content:"${esc(m.content)}"`).join('<br>');

			const oneArr  = res.oneinlogic  || (res.displayEntries && res.displayEntries.oneinlogic)  || [];
			const bothArr = res.bothinlogic || (res.displayEntries && res.displayEntries.bothinlogic) || [];

			const lineOne = (e) => {
				const nodes = nodeContentList(e.nodes);
				const anchors = anchorContentList(e.anchor_children);
				const logic = logicContentList(e.logic_matches);
				const matchedSet = new Set((e.logic_matches || []).map(m => String(m.f_node_id)));
				const nodesInLogicArr = (e.nodes || []).filter(n => matchedSet.has(String(n.node_id)));
				const nodesNotInLogicArr = (e.nodes || []).filter(n => !matchedSet.has(String(n.node_id)));
				const nodesInLogicText = nodeContentList(nodesInLogicArr);
				const nodesNotInLogicText = nodeContentList(nodesNotInLogicArr);
				return `<div class="entry">
					<div class="head">[one] rationality_id:${esc(e.rationality_id)}</div>
					<div>ノード: ${nodes}</div>
					${nodesInLogicText ? `<div>ロジックに反映済み: ${nodesInLogicText}</div>` : ''}
					${nodesNotInLogicText ? `<div>未反映ノード: ${nodesNotInLogicText}</div>` : ''}
					${anchors ? `<div>アンカー子: ${anchors}</div>` : ''}
					${logic ? `<div>三角ロジック対応: ${logic}</div>` : ''}
					<div class="advice">これらの内容を三角ロジックに反映しなくていいですか？</div>
				</div>`;
			};
			const lineBoth = (e) => {
				const nodeTexts = (e.nodes || []).map(n => `"${esc(n.content)}"`).join(' / ');
				const anchorTexts = (e.anchor_children || []).map(c => `"${esc(c.content)}"`).join(', ');
				const logicTexts = (e.logic_matches || []).map(m => `"${esc(m.content)}"`).join('<br>');
				return `<div class="entry">
					<div class="head">[both]</div>
					${nodeTexts ? `<div>「コンテント」${nodeTexts}</div>` : ''}
					${anchorTexts ? `<div>「アンカーのコンテント」${anchorTexts}</div>` : ''}
					${logicTexts ? `<div>三角ロジック対応のコンテント:<br>${logicTexts}</div>` : ''}
					<div class="advice">三角ロジックにある${logicTexts}は、上記の「${nodeTexts}」についての合理性「${anchorTexts}」の内容を適切に反映していますか？</div>
				</div>`;
			};

			const oneItems = oneArr.map(lineOne).join('');
			const bothItems = bothArr.map(lineBoth).join('');
			const htmlParts = [];
			htmlParts.push(oneItems ? `<h4>oneinlogic</h4><div class="rationality-advice-list">${oneItems}</div>` : '<div class="empty">one の対象がありません。</div>');
			htmlParts.push(bothItems ? `<h4>bothinlogic</h4><div class="rationality-advice-list">${bothItems}</div>` : '<div class="empty">both の対象がありません。</div>');

			$('#ai_output').html('<div class="rationality-advice">'+htmlParts.join('')+'</div>');
		})
		.fail(function(err){
			console.error('[logic_rationality] secondadvice failed', err);
			$('#ai_output').html('<div class="error">合理性情報の取得に失敗しました</div>');
		});
};

