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

// 差分とXMLラベルをマージして取得するPromise
function getDiffConceptLabels() {
	// 1) PHPから差分を取得
	const diffReq = $.getJSON('php/fetch_claim_nodes.php');
	// 2) XMLを取得
	const xmlReq = $.ajax({ url: 'js/hozo.xml', type: 'get', dataType: 'xml', timeout: 2000 });

	return $.when(diffReq, xmlReq).then(function (diffResp, xmlResp) {
		// jQueryの$.whenは [data, status, jqXHR] で渡す
		const diff = diffResp && diffResp[0] ? diffResp[0] : diffResp;
		const xml = xmlResp && xmlResp[0] ? xmlResp[0] : xmlResp;

		// 安全チェック
		if (!diff || diff.ok !== true) {
			return $.Deferred().reject({ message: '差分の取得に失敗しました', detail: diff }).promise();
		}
		if (!xml) {
			return $.Deferred().reject({ message: 'XMLの取得に失敗しました' }).promise();
		}

		// 3) XMLから id -> LABEL のマップを作成
		const idToLabel = {};
		$(xml).find('CONCEPT').each(function () {
			const id = $(this).attr('id');
			const label = $(this).children('LABEL').first().text();
			if (id) idToLabel[id] = label || '';
		});

		// 4) 詳細差分（contents付き）を content単位に展開（1コンテンツ=1レコード）
		const flattenDetailed = (arrDetailed) => {
			const out = [];
			(arrDetailed || []).forEach((item) => {
				const cid = item.concept_id ?? item.conceptId ?? item.cid;
				const label = idToLabel[cid] || '';
				if (!label) return;
				const contents = Array.isArray(item.contents) ? item.contents.filter(c => c !== null && c !== '') : [];
				if (contents.length === 0) {
					// contentが無い場合は空文字で1件にするか、必要なければスキップ
					out.push({ concept_id: cid, label, content: '' });
				} else {
					contents.forEach((c) => out.push({ concept_id: cid, label, content: c }));
				}
			});
			return out;
		};

		const claimMinusMap = flattenDetailed(diff.diffClaimMinusMapDetailed || []);
		const mapMinusClaim = flattenDetailed(diff.diffMapMinusClaimDetailed || []);
		// intersectionはcontentsが無い可能性あり → 空contentで展開
		const intersection = (diff.intersection || [])
			.map((cid) => ({ concept_id: cid, label: idToLabel[cid] || '', content: '' }))
			.filter((p) => p.label !== '');

		const result = {
			ok: true,
			sheetId: diff.sheetId,
			claimMinusMap,
			mapMinusClaim,
			intersection
		};

		return result;
	});
}

// 追加: 差分結果を指定要素に描画（指定形式で表示）
function renderDiffConceptLabels(containerSelector) {
	const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
	getDiffConceptLabels()
		.done(function(res){
			// 助言1行フォーマット: 「ラベルコンテンツこれを主張する必要はないですか」
			const line = (p) => `「${esc(p.label)}」「${esc(p.content)}」これを主張する必要はないですか`;
			const section = (title, arr) => {
				const items = (arr || []).map(p => `<li>${line(p)}</li>`).join('');
				return `<h4>${esc(title)}</h4><ul>${items}</ul>`;
			};
			const html = [
				'<div class="diff-concepts">',
				section('claim - map', res.claimMinusMap),
				section('map - claim', res.mapMinusClaim),
				section('intersection', res.intersection),
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

// 簡易利用例（必要に応じてUIに反映してください）
// getDiffConceptLabels().done(function (res) {
// 	console.log('claim - map', res.claimMinusMap);
// 	console.log('map - claim', res.mapMinusClaim);
// 	console.log('intersection', res.intersection);
// }).fail(function (err) {
// 	console.error(err);
// });