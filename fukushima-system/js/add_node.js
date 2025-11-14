/*
* Forestのマインドマップデータを取得する
*/

async function loadNodesData() {
	// jsMind が未初期化なら何もしない（共有知モード等）
	if(!window._jm || typeof window._jm.add_node !== 'function'){
		try{
			var isShared = (typeof window !== 'undefined' && window.SharedModeActive === true);
			if(isShared){
				console.info('[add_node] shared mode — jsMind not initialized (expected).');
			}else{
				console.warn('[add_node] skip: jsMind instance not ready');
			}
		}catch(e){}
		return;
	}
	const callData = (dataType) => {
		return new Promise((resolve, reject) => {
			$.ajax({
				url: "php/open_data.php",
				type: "POST",
				data: { val: dataType },
				success: (result) => {
					return result;
				}
			}).then(result => {
				resolve(JSON.parse(result));
			}, () => {
				reject();
			});
		})
	}

	const id_array = await callData("id");
	const concept_id_array = await callData("concept_id");
	const content_array = await callData("content");
	const type_array = await callData("type");
	const parent_id_array = await callData("parent_id");
	const class_array = await callData("class");

	const getIndexedNodeData = (index) => {
		return { 
			id: id_array[index], 
			concept_id: concept_id_array[index], 
			content: content_array[index], 
			type: type_array[index], 
			parent_id: parent_id_array[index],
			class: class_array[index]
		}
	}
	const findNodeIndex = (node_id) => {
		// ノードのインデックス
		return id_array.map((n_id, index) => {
			return n_id === node_id ? index : null;
		}).filter(n => n !== null)[0];
	}
	const findChildrenIndex = (node_id) => {
		// 子ノードのインデックス一覧を取得
		return parent_id_array.map((n_id, index) => {
			return n_id === node_id ? index : null;
		}).filter(n => n !== null);
	}

	const visualizeNode = (node_id) => {
		// 親に当たるノードから再帰的に順番に表示していく
		const idx = findNodeIndex(node_id);
		if(idx === undefined || idx === null){ return; }
		const node_info = getIndexedNodeData(idx);
		if(!node_info || !node_info.id){ return; }
		try{ show_node(node_info.id, node_info.parent_id, node_info.content, node_info.concept_id, node_info.type, node_info.class); }catch(e){ console.error('[add_node] show_node failed', e); }

		const children = findChildrenIndex(node_id);
		if(children.length === 0) return;

		children.map(ch_node => {
			const ch_node_id = getIndexedNodeData(ch_node).id;
			visualizeNode(ch_node_id);
		})
	}

	// データ妥当性チェック
	if(!Array.isArray(id_array) || id_array.length === 0){
		console.warn('[add_node] empty node list from DB/API');
		return;
	}
	const rootIdxList = findChildrenIndex("root");
	if(!Array.isArray(rootIdxList) || rootIdxList.length === 0){
		console.warn('[add_node] no root children to render');
		return;
	}
	const rootChildren = rootIdxList.map(n => (getIndexedNodeData(n) || {}).id).filter(Boolean);
	rootChildren.forEach(n_id => { visualizeNode(n_id); });
}

window.addEventListener('load', () => {
	// HTML本体の描画が完了したら．JSMINDのノード情報をデータベースから取得して表示
	try{
		if(typeof window.ensureJsMindInitialized === 'function'){
			window.ensureJsMindInitialized();
		}
	}catch(e){ console.warn('[add_node] ensure init warn', e); }
	loadNodesData();
});