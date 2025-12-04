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
				const nodes = nodeContentList(e.nodes);
				const anchors = anchorContentList(e.anchor_children);
				const logic = logicContentList(e.logic_matches);
				return `<div class="entry">
					<div class="head">[one] rationality_id:${esc(e.rationality_id)}</div>
					<div>ノード: ${nodes}</div>
					${anchors ? `<div>アンカー子: ${anchors}</div>` : ''}
					${logic ? `<div>三角ロジック対応: ${logic}</div>` : ''}
					<div class="advice">これらの内容を三角ロジックに反映しなくていいですか？</div>
				</div>`;
			};
			const lineBoth = (e) => {
				console.log('[both] entry:', e);
				// IDは表示せず、contentのみを表示
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

			const section = (title, entries, lineFn) => {
				console.log('section:', title, entries);
				if (!entries.length) return '';
				const items = entries.map(lineFn).join('');
				return `<h4>${esc(title)}</h4><div class="rationality-advice-list">${items}</div>`;
			};

			// ont-claim の差分（map - logic / map - claim）も併記
			const claimLine = (title, p) => {
				if (title === 'map - logic') {
					return `「${esc(p.class_constraint)}」「${esc(p.content)}」この内容を三要素（主張/事実/理由付け）の論理構成に取り込む必要はありませんか`;
				} else if (title === 'map - claim') {
					return `「${esc(p.class_constraint)}」「${esc(p.content)}」この内容を主張として明確化する必要はありませんか`;
				}
				return `「${esc(p.class_constraint)}」「${esc(p.content)}」これを検討する必要はありませんか`;
			};
			const sectionClaim = (title, arr) => {
				const items = (arr || [])
					.filter(p => p.class_constraint && p.class_constraint.trim() !== '')
					.map(p => `<li>${claimLine(title, p)}</li>`).join('');
				if (!items) return '';
				return `<h4>${esc(title)}</h4><ul>${items}</ul>`;
			};

			let body = [
				section('noneinlogic', noneArr, lineNone),
				section('oneinlogic', oneArr, lineOne),
				section('bothinlogic', bothArr, lineBoth),
				sectionClaim('map - logic', (diff && diff.mapMinusLogic) || []),
				sectionClaim('map - claim', (diff && diff.mapMinusClaim) || []),
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
				return `<div class="entry">
					<div class="head">[one] rationality_id:${esc(e.rationality_id)}</div>
					<div>ノード: ${nodes}</div>
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

