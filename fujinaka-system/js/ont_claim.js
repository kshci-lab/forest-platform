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
