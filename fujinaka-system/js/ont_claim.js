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
	// 差分とXMLの取得
	const diffReq = $.getJSON('php/fetch_claim_nodes.php');
	const xmlReq = $.ajax({ url: 'js/hozo.xml', type: 'get', dataType: 'xml', timeout: 4000 });

	return $.when(diffReq, xmlReq).then(function (diffResp, xmlResp) {
		const diff = diffResp && diffResp[0] ? diffResp[0] : diffResp;
		const xml = xmlResp && xmlResp[0] ? xmlResp[0] : xmlResp;

		if (!diff || diff.ok !== true) {
			return $.Deferred().reject({ message: '差分の取得に失敗しました', detail: diff }).promise();
		}
		if (!xml) {
			return $.Deferred().reject({ message: 'XMLの取得に失敗しました' }).promise();
		}

		// id -> (直下SLOTS 内 role="出力" の) class_constraint
		const idToOutputCC = buildIdToOutputCC(xml);

		// 取得データの検証ログ（問題調査用）
		try {
			console.group('fetch_claim_nodes.php response debug');
			console.log('ok:', diff.ok);
			console.log('sheetId:', diff.sheetId);
			console.log('keys:', Object.keys(diff || {}));
			console.log('diffMapMinusLogicDetailed type/len:', Array.isArray(diff.diffMapMinusLogicDetailed), diff.diffMapMinusLogicDetailed ? diff.diffMapMinusLogicDetailed.length : 0);
			console.log('sample diffMapMinusLogicDetailed[0]:', diff.diffMapMinusLogicDetailed && diff.diffMapMinusLogicDetailed[0]);
			console.log('diffMapMinusClaimDetailed type/len:', Array.isArray(diff.diffMapMinusClaimDetailed), diff.diffMapMinusClaimDetailed ? diff.diffMapMinusClaimDetailed.length : 0);
			console.groupEnd();
		} catch(e) { console.warn('debug logging failed', e); }

		// 詳細差分を content 単位に展開し、class_constraint を付与
		const flattenDetailed = (arrDetailed) => {
			const out = [];
			(arrDetailed || []).forEach((item) => {
				const cid = item.concept_id ?? item.conceptId ?? item.cid;
				const cc = idToOutputCC[cid] || '';
				if (!cc || cc.trim() === '') return; // 空のclass_constraintは除外
				const contents = Array.isArray(item.contents) ? item.contents.filter(c => c !== null && c !== '') : [''];
				contents.forEach((c) => out.push({ concept_id: cid, class_constraint: cc, content: c }));
			});
			return out;
		};

		const mapMinusLogic = flattenDetailed(diff.diffMapMinusLogicDetailed || []);
		const mapMinusClaim = flattenDetailed(diff.diffMapMinusClaimDetailed || []);
		const intersection = (diff.intersection || [])
			.map((cid) => ({ concept_id: cid, class_constraint: idToOutputCC[cid] || '', content: '' }))
			.filter(p => p.class_constraint && p.class_constraint.trim() !== ''); // 空は除外

		return {
			ok: true,
			sheetId: diff.sheetId,
			mapMinusLogic,
			mapMinusClaim,
			intersection
		};
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

// 追加: 差分の出力先を「助言エリア」に変更（ボタン押下時の挙動）
window.logDiffConceptLabels = function() {
	try { $('#advice_panel').show(); } catch (e) {}
	renderDiffConceptLabels('#advice_output');
};

// ダッシュボード等からデータ取得関数を利用できるように公開
try { window.getDiffConceptLabels = getDiffConceptLabels; } catch(e) {}

// 簡易利用例（必要に応じてUIに反映してください）
// getDiffConceptLabels().done(function (res) {
// 	console.log('claim - map', res.claimMinusMap);
// 	console.log('map - claim', res.mapMinusClaim);
// 	console.log('intersection', res.intersection);
// }).fail(function (err) {
// 	console.error(err);
// });