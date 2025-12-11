//問いエリアの初期化とhozo.xmlの読み込み
function recommend_xmlLoad(){

	$("#testxml").html("");
	$("#intention").html("");
	$("#rationality").html("");

	$.ajax({

		url:'js/hozo.xml',
		type:'get',
		dataType:'xml',
		timeout:1000,
		success:recommend_parse_xml

	});

	// 追加: 差分結果を #testxml に描画
	renderDiffConceptLabels('#testxml');
}

// hozo.xml の role="出力" の class_constraint を差分に付与して返す
function getDiffConceptLabels() {
  // リクエスト開始ログ
  console.log('[ont_claim] getDiffConceptLabels: start requests');

  // 差分とXMLの取得（PHPの構造に準拠）
  const diffReq = $.getJSON('php/fetch_claim_nodes.php')
    .done(function(resp){ console.log('[ont_claim] diffReq success', resp); })
    .fail(function(jqXHR, textStatus, errorThrown){ console.error('[ont_claim] diffReq failed', { textStatus, errorThrown, jqXHR }); });
  const xmlReq = $.ajax({ url: 'js/hozo.xml', type: 'get', dataType: 'xml', timeout: 4000 })
    .done(function(xml){ console.log('[ont_claim] xmlReq success', xml); })
    .fail(function(jqXHR, textStatus, errorThrown){ console.error('[ont_claim] xmlReq failed', { textStatus, errorThrown, jqXHR }); });

  return $.when(diffReq, xmlReq).then(function (diffResp, xmlResp) {
    console.log('[ont_claim] getDiffConceptLabels: $.when then called');
    const diff = diffResp && diffResp[0] ? diffResp[0] : diffResp;
    const xml  = xmlResp && xmlResp[0] ? xmlResp[0] : xmlResp;
    console.log('[ont_claim] combined responses', { diff, xml });

    if (!diff || diff.ok !== true) {
      console.error('[ont_claim] diff invalid', diff);
      return $.Deferred().reject({ message: '差分の取得に失敗しました', detail: diff }).promise();
    }
    if (!xml) {
      console.error('[ont_claim] xml missing');
      return $.Deferred().reject({ message: 'XMLの取得に失敗しました' }).promise();
    }

    // id -> (直下SLOTS 内 role="出力" の) class_constraint
    const idToOutputCC = buildIdToOutputCC(xml);

    // 詳細差分を content 単位に展開し、class_constraint を付与（空ccは除外）
    const flattenDetailed = (arrDetailed) => {
      const out = [];
      (arrDetailed || []).forEach((item) => {
        const cid = item.concept_id ?? item.conceptId ?? item.cid;
        const nodeId = item.node_id ?? item.nodeId ?? null; // 追加: node_id を取り出す
        const cc  = idToOutputCC[cid] || '';
        if (!cc || cc.trim() === '') return;
        // node_idベースDetailedでは item.content に単一値が入る。従来のconceptベースDetailedでは item.contents が配列。
        const single = (item.content ?? '').trim();
        if (single !== '') {
          out.push({
            concept_id: cid,
            node_id: nodeId,
            class_constraint: cc,
            content: single
          });
        } else {
          const contents = Array.isArray(item.contents) ? item.contents.filter(c => c !== null && String(c).trim() !== '') : [];
          contents.forEach((c) => out.push({
            concept_id: cid,
            node_id: nodeId,
            class_constraint: cc,
            content: c
          }));
        }
      });
      return out;
    };

    // PHPが返すDetailedを使用
    const mapMinusLogic = flattenDetailed(diff.diffMapMinusLogicDetailed || []);
    const mapMinusClaim = flattenDetailed(diff.diffMapMinusClaimDetailed || []);

    const result = {
      ok: true,
      sheetId: diff.sheetId,
      mapMinusLogic,
      mapMinusClaim
    };
    console.log('[ont_claim] getDiffConceptLabels: result', result);
    return result;
  }).fail(function(err){
    console.error('[ont_claim] getDiffConceptLabels: $.when failed', err);
    return $.Deferred().reject(err).promise();
  });
}

// id -> (直下SLOTS 内 role="出力" の) class_constraint を作成
function buildIdToOutputCC(xml) {
	const map = {};
	$(xml).find('CONCEPT').each(function () {
		const id = $(this).attr('id');
		if (!id) return;
		let cc = '';
		const $slots = $(this).children('SLOTS').children('SLOT');
		$slots.each(function () {
			const role = ($(this).attr('role') || '').trim();
			if (role === '出力') {
				const v = ($(this).attr('class_constraint') || '').trim();
				if (v) { cc = v; return false; } // 最初の出力SLOTを採用
			}
		});
		map[id] = cc;
	});
	return map;
}
// 追加: 差分結果を指定要素に描画（指定形式で表示）
function renderDiffConceptLabels(containerSelector) {
	const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
	getDiffConceptLabels()
		.done(function(res){
			// 種類別メッセージ生成
      const makeLine = (title, p) => {
				if (title === 'map - logic') {
					return `教育システム学研究において「${esc(p.class_constraint)}」は重要です。あなたは「${esc(p.class_constraint)}」として「${esc(p.content)}」を述べています。これを主張として三角ロジックを構成する必要はありませんか`;
				} else if (title === 'map - claim') {
					return `教育システム学研究において「${esc(p.class_constraint)}」は重要です。あなたは「${esc(p.class_constraint)}」として「${esc(p.content)}」を述べています。これを主張として三角ロジックを構成する必要はありませんか`;
				}
				return `「${esc(p.class_constraint)}」「${esc(p.content)}」これを検討する必要はありませんか`;
			};
      const section = (title, arr) => {
				// 念のため表示直前でも空のclass_constraintを除外
        const attr = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
        const items = (arr || [])
          .filter(p => p.class_constraint && p.class_constraint.trim() !== '')
          .map(p => {
            // localStorage 用キー（属性用に encodeURIComponent 済み）
            const rawKey = `diffAdvice|${title}|${p.concept_id ?? ''}|${p.node_id ?? ''}|${p.class_constraint ?? ''}|${p.content ?? ''}`;
            const key = encodeURIComponent(rawKey);
            let saved = '';
            try { saved = localStorage.getItem(key) || ''; } catch(e) { saved = ''; }
            const statusLabel = saved === 'consider' ? '選択: 考える' : (saved === 'skip' ? '選択: 考えない' : '');

            // 追加: 助言ログ（logging.js の logEvent）
            try {
              const adviceText = makeLine(title, p);
              if (typeof window.logEvent === 'function') {
                window.logEvent('advice', 'add', adviceText);
              }
            } catch(_) {}

            return [
              `<li class="ai-advice-item" data-key="${key}"` +
              ` data-title="${attr(title)}"` +
              ` data-concept-id="${attr(p.concept_id ?? '')}"` +
              ` data-node-id="${attr(p.node_id ?? '')}"` +
              ` data-class-constraint="${attr(p.class_constraint ?? '')}"` +
              ` data-content="${attr(p.content ?? '')}">`,
              `  <span class="ai-advice-text">${makeLine(title, p)}</span>`,
              `  <button type="button" class="ai-advice-btn ai-consider-btn">考える</button>`,
              `  <button type="button" class="ai-advice-btn ai-skip-btn">考えない</button>`,
              `  <span class="ai-advice-status">${esc(statusLabel)}</span>`,
              `</li>`
            ].join('');
          }).join('');
        return `<h4>${esc(title)}</h4><ul class="ai-advice-list">${items}</ul>`;
			};
			const html = [
				'<div class="diff-concepts">',
				section('map - logic', res.mapMinusLogic),
				section('map - claim', res.mapMinusClaim),
				'</div>'
			].join('');
			$(containerSelector).html(html);
		})
		.fail(function(err){
			$(containerSelector).html('<div class="error">差分の取得に失敗しました</div>');
			console.error(err);
		});
}

// 連動削除: finalizeScenarioAndShowAI の上書き・フックは行わない（AI助言のみを表示するため）
// 差分助言は独立ボタン（"差分助言"）から `showDiffAdvice()` を用いて表示します。

// 考える/考えない ボタンのハンドラ（委譲）
$(document)
  .off('click.ont_claim_consider', '.ai-advice-item .ai-consider-btn')
  .on('click.ont_claim_consider', '.ai-advice-item .ai-consider-btn', function(){
    try {
      const $li = $(this).closest('.ai-advice-item');
      const key = $li.data('key');
      const content = $li.attr('data-content') || '';
      const forestNodeId = $li.attr('data-node-id') || null;
      // 追加: ログ（考える）
      try {
        const adviceText = $li.find('.ai-advice-text').text() || content || '';
        if (typeof window.logEvent === 'function') {
          window.logEvent('advice', 'consider', adviceText);
        }
      } catch (_) {}
      // すでに"考える"済みなら二重作成を避ける
      let already = '';
      try { already = localStorage.getItem(String(key)) || ''; } catch(e) { already = ''; }
      if (already !== 'consider') {
        // defaultLogicNetwork が利用可能なら主張=content で三角ロジックを作成
        if (window.defaultLogicNetwork && typeof window.defaultLogicNetwork.maketriangle === 'function') {
          try {
            // 主張: content, Forest紐づけ: forestNodeId（あれば）
            window.defaultLogicNetwork.maketriangle(String(content), forestNodeId || null, null, 1);
            // 追加: 作成直後に新規三角をハイライト＆フォーカス + Forest側もフォーカス
            setTimeout(() => {
              try {
                const dln = window.defaultLogicNetwork;
                const tris = dln && Array.isArray(dln.triangles) ? dln.triangles : null;
                const last = tris && tris.length ? tris[tris.length - 1] : null;
                if (last && typeof dln.highlightTriangles === 'function') {
                  dln.highlightTriangles([last]);
                  // キャンバスへスクロール
                  const netEl = document.getElementById('mynetwork');
                  if (netEl && typeof netEl.scrollIntoView === 'function') {
                    netEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                  // 主張ノードへフォーカス
                  const claimId = String(last.claim_id ?? last.claimId ?? '');
                  if (claimId && dln.ownNetwork && typeof dln.ownNetwork.focus === 'function') {
                    dln.ownNetwork.focus(claimId, { scale: 1.3, animation: { duration: 450, easingFunction: 'easeInOutQuad' } });
                  }
                  // 追加: Forest側対応ノードへフォーカス（logic_rationality.js の実装に準拠）
                  const fId = String(forestNodeId || '');
                  if (fId) {
                    try {
                      if (typeof window.highlightForestNodeById === 'function') {
                        window.highlightForestNodeById(fId);
                      } else if (window._jm && typeof window._jm.select_node === 'function') {
                        window._jm.select_node(fId);
                        let el = document.getElementById(fId);
                        if (!el) {
                          const jmnodes = document.getElementsByTagName('jmnode');
                          for (let i = 0; i < jmnodes.length; i++) {
                            if (String(jmnodes[i].getAttribute('nodeid')) === String(fId)) { el = jmnodes[i]; break; }
                          }
                        }
                        if (el && typeof el.scrollIntoView === 'function') {
                          el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                          try {
                            el.style.transition = 'box-shadow 0.2s ease-out';
                            el.style.boxShadow = '0 0 0 3px orange inset';
                            setTimeout(() => { try { el.style.boxShadow = ''; } catch(_){} }, 1200);
                          } catch(_) {}
                        }
                      }
                    } catch (_) { /* noop */ }
                  }
                }
              } catch (_) { /* noop */ }
            }, 10);
          } catch (e) {
            console.error('[ont_claim] maketriangle failed', e);
          }
        } else {
          console.warn('[ont_claim] defaultLogicNetwork not ready; skip triangle creation');
        }
      }
      try { localStorage.setItem(String(key), 'consider'); } catch(e) {}
      $li.find('.ai-advice-status').text('選択: 考える');
    } catch(e) { console.error('[ont_claim] consider click failed', e); }
  });

$(document)
  .off('click.ont_claim_skip', '.ai-advice-item .ai-skip-btn')
  .on('click.ont_claim_skip', '.ai-advice-item .ai-skip-btn', function(){
    try {
      const $li = $(this).closest('.ai-advice-item');
      const key = $li.data('key');
      // 追加: ログ（考えない）
      try {
        const adviceText = $li.find('.ai-advice-text').text() || ($li.attr('data-content') || '');
        if (typeof window.logEvent === 'function') {
          window.logEvent('advice', 'skip', adviceText);
        }
      } catch (_) {}
      try { localStorage.setItem(String(key), 'skip'); } catch(e) {}
      $li.find('.ai-advice-status').text('選択: 考えない');
    } catch(e) { console.error('[ont_claim] skip click failed', e); }
  });

// 追加: 独立ボタン用の差分助言表示関数（#ai_output へ描画）
window.showDiffAdvice = function() {
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
    // 差分助言と合理性ペアnoneを両方取得して結合表示
    Promise.all([
      typeof getDiffConceptLabels === 'function' ? getDiffConceptLabels() : Promise.resolve(null),
      typeof window.getRationalityStatus === 'function' ? window.getRationalityStatus() : Promise.resolve(null)
    ]).then(function([diffRes, ratRes]) {
      let htmlParts = [];
      // 差分助言
      if (diffRes && diffRes.ok) {
        const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const makeLine = (title, p) => {
          if (title === 'map - logic') {
            return `教育システム学研究において「${esc(p.class_constraint)}」は重要です。あなたは「${esc(p.class_constraint)}」として「${esc(p.content)}」を述べています。これを主張として三角ロジックを構成する必要はありませんか`;
          } else if (title === 'map - claim') {
            return `教育システム学研究において「${esc(p.class_constraint)}」は重要です。あなたは「${esc(p.class_constraint)}」として「${esc(p.content)}」を述べています。これを主張として三角ロジックを構成する必要はありませんか`;
          }
          return `「${esc(p.class_constraint)}」「${esc(p.content)}」これを検討する必要はありませんか`;
        };
        const section = (title, arr) => {
          const attr = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
          const items = (arr || [])
            .filter(p => p.class_constraint && p.class_constraint.trim() !== '')
            .map(p => {
              const rawKey = `diffAdvice|${title}|${p.concept_id ?? ''}|${p.node_id ?? ''}|${p.class_constraint ?? ''}|${p.content ?? ''}`;
              const key = encodeURIComponent(rawKey);
              let saved = '';
              try { saved = localStorage.getItem(key) || ''; } catch(e) { saved = ''; }
              const statusLabel = saved === 'consider' ? '選択: 考える' : (saved === 'skip' ? '選択: 考えない' : '');
              try {
                const adviceText = makeLine(title, p);
                if (typeof window.logEvent === 'function') {
                  window.logEvent('advice', 'add', adviceText);
                }
              } catch(_) {}
              return [
                `<li class="ai-advice-item" data-key="${key}"` +
                ` data-title="${attr(title)}"` +
                ` data-concept-id="${attr(p.concept_id ?? '')}"` +
                ` data-node-id="${attr(p.node_id ?? '')}"` +
                ` data-class-constraint="${attr(p.class_constraint ?? '')}"` +
                ` data-content="${attr(p.content ?? '')}">`,
                `  <span class="ai-advice-text">${makeLine(title, p)}</span>`,
                `  <button type="button" class="ai-advice-btn ai-consider-btn">考える</button>`,
                `  <button type="button" class="ai-advice-btn ai-skip-btn">考えない</button>`,
                `  <span class="ai-advice-status">${esc(statusLabel)}</span>`,
                `</li>`
              ].join('');
            }).join('');
          return `<h4>${esc(title)}</h4><ul class="ai-advice-list">${items}</ul>`;
        };
        htmlParts.push('<div class="diff-concepts">');
        htmlParts.push(section('map - logic', diffRes.mapMinusLogic));
        htmlParts.push(section('map - claim', diffRes.mapMinusClaim));
        htmlParts.push('</div>');
      }
      // 合理性ペアnoneinlogic
      if (ratRes && (ratRes.noneinlogic || (ratRes.displayEntries && ratRes.displayEntries.noneinlogic))) {
        const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const noneArr = ratRes.noneinlogic || (ratRes.displayEntries && ratRes.displayEntries.noneinlogic) || [];
        const lineNone = (e) => {
          const nodeTexts = (e.nodes || []).map(n => `"${esc(n.content)}"`).join(' / ');
          const anchorTexts = (e.anchor_children || []).map(c => `"${esc(c.content)}"`).join(', ');
          // localStorage 用キー（差分助言と同じ生成規則でOK）
          const rawKey = `diffAdvice|noneinlogic|${(e.nodes && e.nodes.map(n=>n.node_id).join('|'))||''}|${(e.nodes && e.nodes.map(n=>n.content).join('|'))||''}|${anchorTexts}`;
          const key = encodeURIComponent(rawKey);
          let saved = '';
          try { saved = localStorage.getItem(key) || ''; } catch(e) { saved = ''; }
          const statusLabel = saved === 'consider' ? '選択: 考える' : (saved === 'skip' ? '選択: 考えない' : '');
          // 追加: noneinlogic表示時のログ
          try {
            const adviceText = `${nodeTexts}に対する合理性として${anchorTexts}を日々の思考整理で述べていますがこれらを三角ロジックとして考えなくてよいですか`;
            if (typeof window.logEvent === 'function') {
              window.logEvent('advice', 'add', adviceText);
            }
          } catch(_) {}
          return [
            `<li class="ai-advice-item" data-key="${key}" data-title="noneinlogic" data-node-ids="${esc((e.nodes && e.nodes.map(n=>n.node_id).join(','))||'')}" data-anchor-texts="${esc(anchorTexts)}" data-content="${esc((e.nodes && e.nodes.map(n=>n.content).join(' / '))||'')}">`,
            `  <span class="ai-advice-text">${nodeTexts}に対する合理性として${anchorTexts}を日々の思考整理で述べていますがこれらを三角ロジックとして考えなくてよいですか</span>`,
            `  <button type="button" class="ai-advice-btn ai-consider-btn">考える</button>`,
            `  <button type="button" class="ai-advice-btn ai-skip-btn">考えない</button>`,
            `  <span class="ai-advice-status">${esc(statusLabel)}</span>`,
            `</li>`
          ].join('');
        };
        const items = noneArr.map(lineNone).join('');
        const html = items ? `<h4>noneinlogic</h4><ul class="ai-advice-list">${items}</ul>` : '<div class="empty">none の対象がありません。</div>';
        htmlParts.push('<div class="rationality-advice">'+html+'</div>');
      }
      // 結合して表示
      document.getElementById('ai_output').innerHTML = htmlParts.join('');
    }).catch(function(err){
      document.getElementById('ai_output').innerHTML = '<div class="error">差分・合理性情報の取得に失敗しました</div>';
      console.error('[ont_claim] showDiffAdvice failed', err);
    });
  } catch(e) {
    console.error('[ont_claim] showDiffAdvice failed', e);
  }
};
