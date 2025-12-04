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
			const attr = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');

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
				const nodeContentsArr = (e.nodes || []).map(n => String(n.content || ''));
				const nodeIdsArr = (e.nodes || []).map(n => String(n.node_id || ''));
				const nodeA = (nodeContentsArr[0] || '').trim();
				const nodeB = (nodeContentsArr[1] || '').trim();
				const nodeTexts = nodeContentsArr.map(s => `"${esc(s)}"`).join(' / ');
				const anchorTexts = (e.anchor_children || []).map(c => `"${esc(c.content)}"`).join(', ');
				const rawKey = `ratAdvice|none|${nodeTexts}|${anchorTexts}`;
				const key = encodeURIComponent(rawKey);
				let saved = '';
				try { saved = localStorage.getItem(String(key)) || ''; } catch(_) {}
				const statusLabel = saved === 'consider' ? '選択: 考える' : (saved === 'skip' ? '選択: 考えない' : '');
				return [`<div class="entry rat-advice-item" data-key="${key}" data-title="none" data-node-texts="${attr(nodeTexts)}" data-anchor-texts="${attr(anchorTexts)}" data-node-a="${attr(nodeA)}" data-node-b="${attr(nodeB)}" data-node-a-id="${attr(nodeIdsArr[0]||'')}" data-node-b-id="${attr(nodeIdsArr[1]||'')}">`,
					`  <div class="advice">${nodeTexts}に対する合理性として${anchorTexts}を日々の思考整理で述べていますがこれらを三角ロジックとして考えなくてよいですか</div>`,
					`  <button type="button" class="rat-advice-btn rat-consider-btn">考える</button>`,
					`  <button type="button" class="rat-advice-btn rat-skip-btn">考えない</button>`,
					`  <span class="rat-advice-status">${esc(statusLabel)}</span>`,
					`</div>`
				].join('');
			};
			const lineOne = (e) => {
				console.log('[one] entry:', e);
				// 片方だけロジックにある（oneinlogic）ケースで、どちらが反映済みかを明示しつつ、表示はcontentのみ＋ボタン追加
				const matchedSet = new Set((e.logic_matches || []).map(m => String(m.f_node_id)));
				const nodesInLogicArr = (e.nodes || []).filter(n => matchedSet.has(String(n.node_id)));
				const nodesNotInLogicArr = (e.nodes || []).filter(n => !matchedSet.has(String(n.node_id)));
				const nodesInLogicText = nodeTextList(nodesInLogicArr);
				const nodesNotInLogicText = nodeTextList(nodesNotInLogicArr);
				const anchorsText = anchorTextList(e.anchor_children);
					const anchorIdsAttr = (e.anchor_children || []).map(c => String(c.node_id || '')).filter(Boolean).join(',');
					const logicIdsAttr = (e.logic_matches || []).map(m => String(m.logic_node_id || '')).filter(Boolean).join(',');
				const rawKey = `ratAdvice|one|${esc(e.rationality_id)}|${nodesInLogicText}|${nodesNotInLogicText}|${anchorsText}`;
				const key = encodeURIComponent(rawKey);
				let saved = '';
				try { saved = localStorage.getItem(String(key)) || ''; } catch(_) {}
				const statusLabel = saved === 'consider' ? '選択: 確認する' : (saved === 'skip' ? '選択: 確認しない' : '');
				const nodeIdsAttr = (e.nodes || []).map(n => String(n.node_id || '')).filter(Boolean).join(',');
					return [`<div class="entry rat-advice-item" data-key="${key}" data-title="one" data-rationality-id="${attr(e.rationality_id)}" data-in-logic="${attr(nodesInLogicText)}" data-not-in-logic="${attr(nodesNotInLogicText)}" data-anchors="${attr(anchorsText)}" data-node-ids="${attr(nodeIdsAttr)}" data-anchor-ids="${attr(anchorIdsAttr)}" data-logic-ids="${attr(logicIdsAttr)}">`,
					`  <div class="advice">あなたは「${nodesInLogicText}」を主張とした三角ロジックを作成しています。また日々の思考で「${nodesInLogicText}」と「${nodesNotInLogicText}」の合理性について「${anchorsText}」と述べています。これらの内容は三角ロジックに反映されていますか</div>`,
					`  <button type="button" class="rat-advice-btn rat-consider-btn">確認する</button>`,
					`  <button type="button" class="rat-advice-btn rat-skip-btn">確認しない</button>`,
					`  <span class="rat-advice-status">${esc(statusLabel)}</span>`,
					`</div>`
				].join('');
			};
			const lineBoth = (e) => {
				console.log('[both] entry:', e);
				// IDは表示せず、contentのみを表示＋ボタン追加
				const nodeTexts = (e.nodes || []).map(n => `"${esc(n.content)}"`).join(' / ');
				const anchorTexts = (e.anchor_children || []).map(c => `"${esc(c.content)}"`).join(', ');
				const logicTexts = (e.logic_matches || []).map(m => `"${esc(m.content)}"`).join('<br>');
					const anchorIdsAttr = (e.anchor_children || []).map(c => String(c.node_id || '')).filter(Boolean).join(',');
					const logicIdsAttr = (e.logic_matches || []).map(m => String(m.logic_node_id || '')).filter(Boolean).join(',');
				const rawKey = `ratAdvice|both|${nodeTexts}|${anchorTexts}|${logicTexts}`;
				const key = encodeURIComponent(rawKey);
				let saved = '';
				try { saved = localStorage.getItem(String(key)) || ''; } catch(_) {}
				const statusLabel = saved === 'consider' ? '選択: 確認する' : (saved === 'skip' ? '選択: 確認しない' : '');
				const nodeIdsAttr = (e.nodes || []).map(n => String(n.node_id || '')).filter(Boolean).join(',');
					return [`<div class="entry rat-advice-item" data-key="${key}" data-title="both" data-node-texts="${attr(nodeTexts)}" data-anchor-texts="${attr(anchorTexts)}" data-logic-texts="${attr(logicTexts)}" data-node-ids="${attr(nodeIdsAttr)}" data-anchor-ids="${attr(anchorIdsAttr)}" data-logic-ids="${attr(logicIdsAttr)}">`,
					`  <div class="advice">あなたは「${logicTexts}」を主張とする三角ロジックを作成しています。また日々の思考整理では、「${nodeTexts}」についての合理性「${anchorTexts}」を述べています。これらは三角ロジックに反映されていますか</div>`,
					`  <button type="button" class="rat-advice-btn rat-consider-btn">確認する</button>`,
					`  <button type="button" class="rat-advice-btn rat-skip-btn">確認しない</button>`,
					`  <span class="rat-advice-status">${esc(statusLabel)}</span>`,
					`</div>`
				].join('');
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

// 考える/考えない ボタンのハンドラ（委譲）
$(document)
	.off('click.rationality_consider', '.rat-advice-item .rat-consider-btn')
	.on('click.rationality_consider', '.rat-advice-item .rat-consider-btn', function(){
		try {
			const $li = $(this).closest('.rat-advice-item');
			const key = $li.data('key');
			const title = String($li.data('title') || '');
			let already = '';
			try { already = localStorage.getItem(String(key)) || ''; } catch(e) { already = ''; }
			if (title === 'none') {
				const aText = String($li.attr('data-node-a') || '').trim();
				const bText = String($li.attr('data-node-b') || '').trim();
				const aId = String($li.attr('data-node-a-id') || '').trim();
				const bId = String($li.attr('data-node-b-id') || '').trim();
				// 既存ダイアログがあれば削除
				$('.rat-dialog, .rat-dialog-overlay').remove();
				// オーバーレイ + ダイアログ生成
				const safeA = $('<div>').text(aText).html();
				const safeB = $('<div>').text(bText).html();
				const overlay = '<div class="rat-dialog-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:9998;"></div>';
				const dialogParts = [
					'<div class="rat-dialog" role="dialog" aria-modal="true" style="position:fixed;left:50%;top:25%;transform:translateX(-50%);width:560px;max-width:92vw;background:#fff;border-radius:8px;box-shadow:0 10px 24px rgba(0,0,0,0.25);z-index:9999;">',
					'  <div class="rat-dialog-header" style="padding:12px 16px;border-bottom:1px solid #eee;display:flex;align-items:center;justify-content:space-between;">',
					'    <span style="font-weight:600;">主張の選択</span>',
					'    <button type="button" class="rat-dialog-close" aria-label="閉じる" style="border:none;background:none;font-size:18px;cursor:pointer;">×</button>',
					'  </div>',
					'  <div class="rat-dialog-body" style="padding:16px;line-height:1.6;">',
					( aText ? `    <div style="margin-bottom:10px;"><button type="button" class="rat-dialog-choose rat-choose-a" style="padding:8px 12px;">${safeA}を主張とする三角ロジックを作成する</button></div>` : '' ),
					( bText ? `    <div style="margin-bottom:10px;"><button type="button" class="rat-dialog-choose rat-choose-b" style="padding:8px 12px;">${safeB}を主張とする三角ロジックを作成する</button></div>` : '' ),
					'  </div>',
					'  <div class="rat-dialog-footer" style="padding:12px 16px;border-top:1px solid #eee;text-align:right;">',
					'    <button type="button" class="rat-dialog-cancel" style="padding:8px 12px;">キャンセル</button>',
					'  </div>',
					'</div>'
				];
				$('body').append(overlay).append(dialogParts.join(''));
				const cleanup = () => { try { $('.rat-dialog, .rat-dialog-overlay').remove(); } catch(_) {} };
				$(document).one('click', '.rat-dialog-close, .rat-dialog-cancel, .rat-dialog-overlay', function(){ cleanup(); });
				const makeTriangle = (content, nodeId) => {
					try {
						console.log('[rat] makeTriangle start', { content: String(content), nodeId: String(nodeId || '') });
						if (window.defaultLogicNetwork && typeof window.defaultLogicNetwork.maketriangle === 'function') {
							window.defaultLogicNetwork.maketriangle(String(content), String(nodeId || ''), null, 1);
							// 作成直後のハイライト＆フォーカス（ont_claim.jsの実装に準拠）
							setTimeout(function(){
								try {
									var dln = window.defaultLogicNetwork;
									var tris = dln && Array.isArray(dln.triangles) ? dln.triangles : null;
									var last = tris && tris.length ? tris[tris.length - 1] : null;
									if (last && typeof dln.highlightTriangles === 'function') {
										dln.highlightTriangles([last]);
										// キャンバスへスクロール
										var netEl = document.getElementById('mynetwork');
										if (netEl && typeof netEl.scrollIntoView === 'function') {
											netEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
										}
										// 主張ノードへフォーカス
										var claimId = String(last.claim_id ?? last.claimId ?? '');
										if (claimId && dln.ownNetwork && typeof dln.ownNetwork.focus === 'function') {
											dln.ownNetwork.focus(claimId, { scale: 1.3, animation: { duration: 450, easingFunction: 'easeInOutQuad' } });
										}
										// Forestマップ側のノードもフォーカス（nodeId は対応する f_node_id）
										try {
											var fId = String(nodeId || '');
											console.log('[rat] focusing Forest node', { fId: fId });
											if (fId) {
												if (typeof window.highlightForestNodeById === 'function') {
													console.log('[rat] using highlightForestNodeById');
													window.highlightForestNodeById(fId);
												} else if (window._jm && typeof window._jm.select_node === 'function') {
													console.log('[rat] using jsMind.select_node');
													// jsMind の選択とスクロール
													window._jm.select_node(fId);
													var el = document.getElementById(fId);
													if (!el) {
														// jsMindは <jmnode nodeid="..."> でレンダリングされることがある
														const jmnodes = document.getElementsByTagName('jmnode');
														for (let i = 0; i < jmnodes.length; i++) {
															if (String(jmnodes[i].getAttribute('nodeid')) === String(fId)) { el = jmnodes[i]; break; }
														}
													}
													if (!el) { console.warn('[rat] Forest DOM node not found by id/nodeid', fId); }
													if (el && typeof el.scrollIntoView === 'function') {
														el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
													}
													// 軽い強調枠（短時間）
													try {
														el.style.transition = 'box-shadow 0.2s ease-out';
														el.style.boxShadow = '0 0 0 3px orange inset';
														setTimeout(function(){ try { el.style.boxShadow = ''; } catch(_){} }, 1200);
													} catch(_) {}
												}
											}
										} catch(err2) { console.error('[rat] Forest focus failed', err2); }
									}
								} catch(_) { /* noop */ }
							}, 10);
							// カスタムイベント通知
							try {
								var ev = new CustomEvent('logicTriangleCreated', { detail: { content: String(content), node_id: String(nodeId || '') } });
								window.dispatchEvent(ev);
							} catch(_) {}
						}
					} catch(err) { console.error('[logic_rationality] maketriangle failed', err); }
				};
				if (aText) $(document).one('click', '.rat-dialog .rat-choose-a', function(){
					console.log('[logic_rationality] consider chosen A:', { node_id: aId, content: aText });
					makeTriangle(aText, aId);
					cleanup();
					try { localStorage.setItem(String(key), JSON.stringify({ status: 'consider', chosen: 'A', node_id: aId, content: aText })) } catch(e) {}
					$li.find('.rat-advice-status').text('選択: 考える');
				});
				if (bText) $(document).one('click', '.rat-dialog .rat-choose-b', function(){
					console.log('[logic_rationality] consider chosen B:', { node_id: bId, content: bText });
					makeTriangle(bText, bId);
					cleanup();
					try { localStorage.setItem(String(key), JSON.stringify({ status: 'consider', chosen: 'B', node_id: bId, content: bText })) } catch(e) {}
					$li.find('.rat-advice-status').text('選択: 考える');
				});
			} else {
				// one/both: 確認操作時のフォーカス導線
				const titleCase = String($li.data('title') || '');
				const nodeIdsAttr = String($li.attr('data-node-ids') || '');
				const nodeIdsList = nodeIdsAttr ? nodeIdsAttr.split(',').filter(Boolean) : [];
				try { localStorage.setItem(String(key), JSON.stringify({ status: 'consider', node_ids: nodeIdsList })) } catch(e) {}
				$li.find('.rat-advice-status').text('選択: 確認する');
				// one の場合: Forestのアンカーへジャンプ＋三角ロジック側ノードへフォーカス
				if (titleCase === 'one') {
					try {
						var anchorIdsAttr = String($li.attr('data-anchor-ids') || '');
						var logicIdsAttr = String($li.attr('data-logic-ids') || '');
						var anchorId = anchorIdsAttr.split(',').filter(Boolean)[0] || '';
						var logicId = logicIdsAttr.split(',').filter(Boolean)[0] || '';
						// Forestアンカーへ
						if (anchorId) {
							if (typeof window.highlightForestNodeById === 'function') {
								window.highlightForestNodeById(String(anchorId));
							} else if (window._jm && typeof window._jm.select_node === 'function') {
								window._jm.select_node(String(anchorId));
								var el = document.getElementById(String(anchorId));
								if (!el) {
									const jmnodes = document.getElementsByTagName('jmnode');
									for (let i = 0; i < jmnodes.length; i++) {
										if (String(jmnodes[i].getAttribute('nodeid')) === String(anchorId)) { el = jmnodes[i]; break; }
									}
								}
								if (el && typeof el.scrollIntoView === 'function') {
									el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
									try {
										el.style.transition = 'box-shadow 0.2s ease-out';
										el.style.boxShadow = '0 0 0 3px orange inset';
										setTimeout(function(){ try { el.style.boxShadow = ''; } catch(_){} }, 1200);
									} catch(_) {}
								}
							}
						}
						// 三角ロジック側ノードへ
						if (logicId && window.defaultLogicNetwork && window.defaultLogicNetwork.ownNetwork && typeof window.defaultLogicNetwork.ownNetwork.focus === 'function') {
							window.defaultLogicNetwork.ownNetwork.focus(String(logicId), { scale: 1.2, animation: { duration: 450, easingFunction: 'easeInOutQuad' } });
						}
					} catch(err3) { console.warn('[rat] one confirm focus failed', err3); }
				}
				// both の場合: Forestのアンカーへジャンプ＋ロジック側のどちらかへフォーカス、もう片方はハイライトのみ
				if (titleCase === 'both') {
					try {
						var anchorIdsAttr2 = String($li.attr('data-anchor-ids') || '');
						var logicIdsAttr2 = String($li.attr('data-logic-ids') || '');
						var anchorId2 = anchorIdsAttr2.split(',').filter(Boolean)[0] || '';
						var logicIdsList2 = logicIdsAttr2.split(',').filter(Boolean);
						var focusLogicId = logicIdsList2[0] || '';
						var highlightLogicId = logicIdsList2[1] || '';
						// Forestアンカーへジャンプ
						if (anchorId2) {
							if (typeof window.highlightForestNodeById === 'function') {
								window.highlightForestNodeById(String(anchorId2));
							} else if (window._jm && typeof window._jm.select_node === 'function') {
								window._jm.select_node(String(anchorId2));
								var el2 = document.getElementById(String(anchorId2));
								if (!el2) {
									const jmnodes2 = document.getElementsByTagName('jmnode');
									for (let i = 0; i < jmnodes2.length; i++) {
										if (String(jmnodes2[i].getAttribute('nodeid')) === String(anchorId2)) { el2 = jmnodes2[i]; break; }
									}
								}
								if (el2 && typeof el2.scrollIntoView === 'function') {
									el2.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
									try {
										el2.style.transition = 'box-shadow 0.2s ease-out';
										el2.style.boxShadow = '0 0 0 3px orange inset';
										setTimeout(function(){ try { el2.style.boxShadow = ''; } catch(_){} }, 1200);
									} catch(_) {}
								}
							}
						}
						// 三角ロジック側: どちらかへフォーカス
						if (focusLogicId && window.defaultLogicNetwork && window.defaultLogicNetwork.ownNetwork && typeof window.defaultLogicNetwork.ownNetwork.focus === 'function') {
							window.defaultLogicNetwork.ownNetwork.focus(String(focusLogicId), { scale: 1.2, animation: { duration: 450, easingFunction: 'easeInOutQuad' } });
						}
						// もう片方はハイライトのみ
						if (highlightLogicId && window.defaultLogicNetwork && typeof window.defaultLogicNetwork.highlightNodes === 'function') {
							try { window.defaultLogicNetwork.highlightNodes([String(highlightLogicId)]); } catch(_) {}
						} else if (highlightLogicId && window.defaultLogicNetwork && window.defaultLogicNetwork.ownNetwork) {
							// fallback: ノードを一時的に装飾
							try {
								var canvasEl = document.getElementById('mynetwork');
								if (canvasEl) {
									// vis.js は直接DOMのノードがないため、focus対象に加え、ネットワーク全体を一時ハイライトで疑似表示は難しい
									// ここではownNetworkでselectNodesを使う簡易ハイライトを試みる
									if (typeof window.defaultLogicNetwork.ownNetwork.selectNodes === 'function') {
										window.defaultLogicNetwork.ownNetwork.selectNodes([String(highlightLogicId)], false);
										setTimeout(function(){ try { window.defaultLogicNetwork.ownNetwork.unselectAll(); } catch(_){} }, 1200);
									}
								}
							} catch(_) {}
						}
					} catch(err4) { console.warn('[rat] both confirm focus failed', err4); }
				}
			}
		} catch(e) { console.error('[logic_rationality] consider click failed', e); }
	});

$(document)
	.off('click.rationality_skip', '.rat-advice-item .rat-skip-btn')
	.on('click.rationality_skip', '.rat-advice-item .rat-skip-btn', function(){
		try {
			const $li = $(this).closest('.rat-advice-item');
			const key = $li.data('key');
			try { localStorage.setItem(String(key), 'skip'); } catch(e) {}
			const title = String($li.data('title') || '');
			$li.find('.rat-advice-status').text(title === 'none' ? '選択: 考えない' : '選択: 確認しない');
		} catch(e) { console.error('[logic_rationality] skip click failed', e); }
	});

