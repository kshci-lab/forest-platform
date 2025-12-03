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
        const contents = Array.isArray(item.contents) ? item.contents.filter(c => c !== null && c !== '') : [''];
        contents.forEach((c) => out.push({
          concept_id: cid,
          node_id: nodeId,            // 追加: node_id を含める
          class_constraint: cc,
          content: c
        }));
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
					return `「${esc(p.class_constraint)}」「${esc(p.content)}」この内容を三要素（主張/事実/理由付け）の論理構成に取り込む必要はありませんか`;
				} else if (title === 'map - claim') {
					return `「${esc(p.class_constraint)}」「${esc(p.content)}」この内容を主張として明確化する必要はありませんか`;
				}
				return `「${esc(p.class_constraint)}」「${esc(p.content)}」これを検討する必要はありませんか`;
			};
			const section = (title, arr) => {
				// 念のため表示直前でも空のclass_constraintを除外
				const items = (arr || [])
					.filter(p => p.class_constraint && p.class_constraint.trim() !== '')
					.map(p => `<li>${makeLine(title, p)}</li>`).join('');
				return `<h4>${esc(title)}</h4><ul>${items}</ul>`;
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

// デバッグ: 差分再描画ボタンを追加（#testxml の直前に挿入）
$(function(){
  try {
    const btnId = 'btn_render_diff';
    if ($('#' + btnId).length === 0) {
      const $btn = $('<button type="button" class="button4" id="'+btnId+'">差分を再描画</button>');
      if ($('#testxml').length) {
        $('#testxml').before($btn);
      } else {
        $('body').append($btn);
      }
      console.log('[ont_claim] debug button added: #' + btnId);
    }

    // クリックで renderDiffConceptLabels('#testxml') を実行
    $(document).off('click.'+btnId).on('click.'+btnId, '#'+btnId, function(){
      try {
        console.log('[ont_claim] manual trigger: renderDiffConceptLabels');
        if (typeof renderDiffConceptLabels === 'function') {
          renderDiffConceptLabels('#testxml');
          console.log('[ont_claim] renderDiffConceptLabels invoked');
        } else {
          console.warn('[ont_claim] renderDiffConceptLabels not defined - skip');
        }
      } catch (e) {
        console.error('[ont_claim] renderDiffConceptLabels trigger failed', e);
      }
    });
  } catch(e) {
    console.error('[ont_claim] debug button setup failed', e);
  }
});
