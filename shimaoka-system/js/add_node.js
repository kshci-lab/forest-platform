/*
* Forestのマインドマップデータを取得する
*/

async function loadNodesData() {
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
		const node_info = getIndexedNodeData(findNodeIndex(node_id));
		show_node(node_info.id, node_info.parent_id, node_info.content, node_info.concept_id, node_info.type, node_info.class);

		const children = findChildrenIndex(node_id);
		if(children.length === 0) return;

		children.map(ch_node => {
			const ch_node_id = getIndexedNodeData(ch_node).id;
			visualizeNode(ch_node_id);
		})
	}

	const rootChildren = findChildrenIndex("root").map(n => getIndexedNodeData(n).id);
	rootChildren.map(n_id => {
		visualizeNode(n_id);
	});
}

window.addEventListener('load', () => {
	// HTML本体の描画が完了したら．JSMINDのノード情報をデータベースから取得して表示
	loadNodesData();
});