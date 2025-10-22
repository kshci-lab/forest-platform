// 議論内省マップに関する処理プログラム
let defaultForestMRN;
let defaultRecordForestMRN;
let defaultShowForestMRN;

class ForestMRN { // forestMRN: forest Meeting Reflection Network
    constructor(container, load) {
        // this.ownNetwork = this.generateMeetingReflectionNetworkCanvas(container, {}, {}); // デフォルトのマップを表示

        defaultRecordForestMRN = new RecordForestMRN();
        this.nodes = new vis.DataSet();
        this.edges = new vis.DataSet();
        this.options = {
	        physics: false,
	        edges: {
		        arrows: 'to', // エッジに矢印を付けて有向グラフにする
		        smooth: false // falseにするとエッジが直線になる
            },
            interaction: {
                multiselect: false,
                zoomView: false // グラフの拡大縮小を無効にする
            },
        };
        this.nodeConnectEnabled = false; // マインドマップとの対応づけを可能にする（マインドマップのノードクリックが，議論内省マップノードとの対応を付与するのかそうでないのかを判定するよう）
        this.latest_selected_node_info = {
            x: 0,
            y: 35
        }; // 最後にクリックされたノードの情報
        this.output_input = {}; //オントロジーの入力と出力の対応付け
        this.output_list = [];  //概念として出すもの
        this.dragStartNodeId = null;  //ドラッグスタートしたノードのID
        this.dragEndNodeId = null; //ドラッグエンドしたノードID
        this.edgeEditMode = false; // リンクを編集できるかどうかのモード（Falseは編集不可）
        this.EdgeStartId = []; //エッジの開始ID
        this.EdgeEndId = []; //エッジの終了ID
        this.OntologyNodeId = []; //オントロジーノードのノードID
        this.OntologyConnectNodeId = []; //オントロジーノードと対応づいているノードID
        this.ConnectNetworkNodeId = [];
        this.ConnectMindMapNodeId = [];
        this.RecruitNodeId = [];//採用or棄却されたノードID
        this.Recruit = [];//採用or棄却
        this.Feedback = [];//フィードバック書いたかどうか
        this.FeedbackNodeId = null; //フィードバック書かれるノードID
        this.selectId = null;//選択されたノードID
        this.interval = null; //インターバル抜けるための変数
        this.material_id = null;
        this.concept_id = null;
        this.scale = 1;
        this.BoxDisplay = {
            x: 0,
            y: 0
        }//右クリックされやメニューの表示場所
        this.ownNetwork = this.generateMeetingReflectionNetworkCanvas(container, this.nodes, this.edges); // デフォルトのマップを表示
        this.choose_input_xmlLoad();
        if(load == "load"){
            this.jmindex = [];
            this.addEventLister();
            // $(`#jsmind_container`).on('click',this.connect_mindmap.bind(this));
            // $(`#net_conmenu1`).on('click',this.show_select.bind(this));
            // $(`#net_conmenu2`).on('click',this.connect_network.bind(this));
            // $(`#net_conmenu3`).on('click',this.Recruit_Idea.bind(this));
            // $(`#net_conmenu4`).on('click',this.ContentmenuCancel.bind(this));
            // $(`#ontology_select`).on('click',this.addontology.bind(this));
            // $(`#recruit_select`).on('click',this.Selected_Recruit_Idea.bind(this));
            this.ownNetwork.on('click', this.networkClick.bind(this));
            this.ownNetwork.on('dragStart', this.dragstart.bind(this));
            this.ownNetwork.on('dragEnd', this.dragend.bind(this));
            this.ownNetwork.on('doubleClick', this.doubleclick.bind(this));
            this.ownNetwork.on("oncontext", this.onContext.bind(this));
            this.ownNetwork.on('select', this.selectdelete.bind(this));
        }else if(load == 'pastmap'){
            this.jmindex2 = [];
            this.jmindex3 = [];
            this.ownNetwork.on('click', this.shownetworkClick.bind(this));
        }
    }


    choose_input_xmlLoad(){
        $.ajax({
            url:'js/hozo.xml',
            type:'get',
            dataType:'xml',
            timeout:1000,
            success:this.choose_input_parse_xml.bind(this)
        });
    }

    choose_input_parse_xml(xml,status){
        if(status!='success')return;
        const XML = $(xml).find('W_CONCEPTS');
        const label = Array.from(XML[0].getElementsByTagName('LABEL'));
        const isa = Array.from(XML[0].getElementsByTagName('ISA'));
        console.log(label[0].childNodes[0].nodeValue);
        const rationaly_record = (return_slot) => {
            let rationaly_label;
            let input_count = 0;
            for(var i=0; i<return_slot.length; i++){
                if(return_slot[i].getAttribute("role") === "入力"){
                    label.map((content_label2) => {
                        if(return_slot[i].getAttribute('class_constraint') === content_label2.childNodes[0].nodeValue){
                            const slot_content = Array.from(content_label2.parentNode.getElementsByTagName("SLOT"));
                            slot_content.map((content_slot2) => {
                                if(content_slot2.getAttribute("role") === "出力"){
                                    if(!this.output_list.includes(content_slot2.getAttribute("class_constraint"))) {
                                        this.output_list.push(content_slot2.getAttribute("class_constraint"));
                                    }
                                    if(input_count == 0){
                                        rationaly_label = content_slot2.getAttribute("class_constraint");
                                    }else{
                                        this.output_input[rationaly_label] = content_slot2.getAttribute("class_constraint");
                                        this.output_input[content_slot2.getAttribute("class_constraint")] = rationaly_label;
                                    }
                                }
                            });
                        return;
                        }
                    });
                    input_count += 1;
                }
            }
        }
        //hozo.xmlファイルのタグを検索して変数に格納（たぶん，全てのタグが配列で格納されている），thisはhozo.xmlのことかな
        isa.map((content)=>{
            if(content.getAttribute('parent') === "合理性を考える"){
                label.map((content_label) => {
                    if(content.getAttribute('child') === content_label.childNodes[0].nodeValue){
                        rationaly_record(Array.from(content_label.parentNode.getElementsByTagName("SLOT")))
                        return;
                    }
                })
            }
        });
        const selectElement = document.getElementById("selectionlist");
        while (selectElement.options.length > 0) {
            selectElement.remove(0);
        }
        this.output_list.map((n) => {
            const optionElement = document.createElement('option');
            optionElement.value = n;
            optionElement.text = n;
            selectElement.appendChild(optionElement);
        })
    }

    // //オントロジーノードを選択不可に
    selectdelete(params) {
        if (this.nodes.get(params.nodes[0]).shape == "ellipse") {
            // 選択を解除
            this.ownNetwork.setSelection({ nodes: [] });
        }
    }

    addEventLister(){
        this.bindconnect_mindmap = this.connect_mindmap.bind(this);
        this.bindshow_select = this.show_select.bind(this);
        this.bindconnect_network = this.connect_network.bind(this);
        this.bindRecruit_Idea = this.Recruit_Idea.bind(this);
        this.bindContentmenuCancel = this.ContentmenuCancel.bind(this);
        this.bindaddontology = this.addontology.bind(this);
        this.bindSelected_Recruit_Idea = this.Selected_Recruit_Idea.bind(this);
        this.bindfeedback = this.feedback.bind(this);
        this.bindNodeblinking = this.Nodeblinking.bind(this);
        $(`#jsmind_container`).on('click',this.bindconnect_mindmap);
        $(`#net_conmenu1`).on('click',this.bindshow_select);
        $(`#net_conmenu2`).on('click',this.bindconnect_network);
        $(`#net_conmenu3`).on('click',this.bindRecruit_Idea);
        $(`#net_conmenu4`).on('click',this.bindContentmenuCancel);
        $(`#ontology_select`).on('click',this.bindaddontology);
        $(`#recruit_select`).on('click',this.bindSelected_Recruit_Idea);
        $(`#feedbackrecord`).on('click',this.bindfeedback);
        this.interval = setInterval(this.bindNodeblinking, 1000);
    }

    removeEventLister(){
        $(`#jsmind_container`).off('click',this.bindconnect_mindmap);
        $(`#net_conmenu1`).off('click',this.bindshow_select);
        $(`#net_conmenu2`).off('click',this.bindconnect_network);
        $(`#net_conmenu3`).off('click',this.bindRecruit_Idea);
        $(`#net_conmenu4`).off('click',this.bindContentmenuCancel);
        $(`#ontology_select`).off('click',this.bindaddontology);
        $(`#recruit_select`).off('click',this.bindSelected_Recruit_Idea);
        $(`#feedbackrecord`).off('click',this.bindfeedback);
        clearInterval(this.interval);
    }
    /*
     * マップ編集ユーティリティ
     */
    generateUniqueNumberText() {
        return `${new Date().getTime()}${Math.floor(1000000 * Math.random())}`;
    }

    setNodes(newNodes) {
        this.nodes = newNodes;
    }
    setEdges(newEdges) {
        this.edges = newEdges;
    }
    setOptions(options) {
        this.options = options;
    }

    //エッジ編集できるか切り替え
    SelectEditEdge(){
        this.edgeEditMode = !this.edgeEditMode;
        if(this.edgeEditMode){
            this.enableEditEdge();
        }else{
            this.disableEditEdge();
        }
    }

    //エッジ編集できる場合の処理
    enableEditEdge() {
        // エッジを編集するときは，ノードの動きを止める
        document.getElementById("mrnb_startEditEdge").value="エッジ追加終了";
        this.nodes.update(this.nodes.map(n => {
            return { ...n, fixed: true };
        }));     
    }

    //エッジ編集できない場合の処理
    disableEditEdge() {
        document.getElementById("mrnb_startEditEdge").value="エッジ追加";
        // エッジの編集モードを抜けたときは，ノードの動きを再度始める（ただし，タグノードはFixedにしておく）
        this.edgeEditMode = false;
        this.nodes.update(this.nodes.map(n => {
            return n.type !== "topic-tag" ? { ...n, fixed: false } : { ...n, fixed: true };
        }))
    }

    /*
     * データベースリクエストユーティリティ
     */
    recordMeetingUtteranceNodes(utterances) {
        // データを送信（DBに保存）
        $.ajax({
            url: "php/discussion_map_manager.php",
            type: "POST",
            data: {
                purpose: "record_meeting_utterance",
                utters: JSON.stringify(utterances),
            }
        }).success((r) => {
            alert("議論データアップロードに成功しました")
            document.getElementById("meetingUtteranceXmlFileUploader").value = "";
        });
    }

    /*
     * 議論内省マップの表示・操作部分（Extend vis.js）
     */
    generateMeetingReflectionNetworkCanvas (canvas_dom_id, nodes, edges) {
        // マップを表示

        // this.setNodes(nodes);
        // this.setEdges(edges);

        return new vis.Network(
            document.getElementById(canvas_dom_id),
            {
                nodes: nodes,
                edges: edges,
            },
            this.options
        );
    }

    /*
     * ノードの操作
     */
    //ノード追加(完了)
    addNode(node_id, node_label, node_type, node_x, node_y) {
        let node_color = '#cbe0f4'; // ノードの背景色
        let node_shape = 'box';     // ノードの形状
        let text_color = 'black';   // ノード内文字列の色
        let position_fixed = false;   // ノードを動かせるかどうか（Falseなら動かせる）
        switch(node_type) {
            case "material-content": // 議論資料に書かれた内容に関するノードの場合
                break;
            case "self-summary": // 自分で考えた要約に関するノードの場合
                node_color = '#e3d7e6';
                // text_color = 'white';
                break;
            case "utterance": // 議論内での発言ノードの場合
                node_color = '#c5b4df';
                break;
            case "topic-tag": // 議論内省マップのノードがどんなトピックに対応しているかを表すタグノードの場合
                node_color = '#a0a7ee';
                node_shape = 'ellipse';
                // text_color = 'white';
                position_fixed = true;
                break;
            default: // その他
                break;
        }
        let result_label = '';
        for (let i = 0; i < node_label.length; i += 10) {
            result_label += node_label.substr(i, 10) + '\n';
        }
        result_label = result_label.trim(); // 末尾の不要な改行を除去
        const newNode = {
            id: `${node_type}_${node_id}`, label: result_label,
            group: node_type,
            color: node_color, shape: node_shape,
            font: { color: text_color },
            fixed: position_fixed,
            x: node_x, y: node_y, 
        };
        this.nodes.add(newNode);
        const boundingBox = this.ownNetwork.getBoundingBox(`${node_type}_${node_id}`);
        if(node_type !==  "topic-tag"){
            node_y += Math.floor(((boundingBox.bottom)-(boundingBox.top))/2);
        }
        this.nodes.update({
            id : `${node_type}_${node_id}`,
            color: node_color, shape: node_shape,
            font: { color: text_color },
            y : node_y
        });
        const boundingBoxupdate = this.ownNetwork.getBoundingBox(`${node_type}_${node_id}`);
        this.latest_selected_node_info.x = node_x;
        this.latest_selected_node_info.y = boundingBoxupdate.bottom+10;
        defaultRecordForestMRN.record_Node(`${node_type}_${node_id}`, node_label, node_type, node_x, node_y);
        return this.nodes;
    }

    addReloadNode(node_id, node_label, node_type, node_x, node_y) {
        let node_color = '#cbe0f4'; // ノードの背景色
        let node_shape = 'box';     // ノードの形状
        let text_color = 'black';   // ノード内文字列の色
        let position_fixed = false;   // ノードを動かせるかどうか（Falseなら動かせる）
        switch(node_type) {
            case "material-content": // 議論資料に書かれた内容に関するノードの場合
                break;
            case "self-summary": // 自分で考えた要約に関するノードの場合
                node_color = '#e3d7e6';
                // text_color = 'white';
                break;
            case "utterance": // 議論内での発言ノードの場合
                node_color = '#c5b4df';
                break;
            case "topic-tag": // 議論内省マップのノードがどんなトピックに対応しているかを表すタグノードの場合
                node_color = '#a0a7ee';
                node_shape = 'ellipse';
                // text_color = 'white';
                position_fixed = true;
                break;
            default: // その他
                break;
        }
        let result_label = '';
        for (let i = 0; i < node_label.length; i += 10) {
            result_label += node_label.substr(i, 10) + '\n';
        }
        result_label = result_label.trim(); // 末尾の不要な改行を除去
        const newNode = {
            id: `${node_id}`, label: result_label,
            group: node_type,
            color: node_color, shape: node_shape,
            font: { color: text_color },
            fixed: position_fixed,
            x: node_x, y: node_y, 
        };
        this.nodes.add(newNode);
        const boundingBox = this.ownNetwork.getBoundingBox(`${node_id}`);
        this.latest_selected_node_info.x = node_x;
        this.latest_selected_node_info.y = boundingBox.bottom+10;
        return this.nodes;
    }

    //操作できないノードを作る（過去のマインドマップのため）
    addShowNode(node_id, node_label, node_type, node_x, node_y) {
        let node_color = '#cbe0f4'; // ノードの背景色
        let node_shape = 'box';     // ノードの形状
        let text_color = 'black';   // ノード内文字列の色
        switch(node_type) {
            case "material-content": // 議論資料に書かれた内容に関するノードの場合
                break;
            case "self-summary": // 自分で考えた要約に関するノードの場合
                node_color = '#e3d7e6';
                // text_color = 'white';
                break;
            case "utterance": // 議論内での発言ノードの場合
                node_color = '#c5b4df';
                break;
            case "topic-tag": // 議論内省マップのノードがどんなトピックに対応しているかを表すタグノードの場合
                node_color = '#a0a7ee';
                node_shape = 'ellipse';
                // text_color = 'white';
                break;
            default: // その他
                break;
        }
        const newNode = {
            id: `${node_id}`, label: node_label,
            group: node_type,
            color: node_color, shape: node_shape,
            font: { color: text_color },
            fixed: true,
            x: node_x, y: node_y, 
        };
        this.nodes.add(newNode);
        return this.nodes;
    }

    // 資料エッジ作成
    addmaterialEdge(edge_start, edge_end, edge_label){
        this.edges.add({ from: edge_start, to: edge_end, label: edge_label});
        defaultRecordForestMRN.record_Material_Edge(edge_start, edge_end, edge_label);
    }

    addReloadEdge(edge_id, edge_start, edge_end, edge_label) {
        this.edges.add({ id: edge_id, from: edge_start, to: edge_end ,label: edge_label});
    }

    //未完成　要約ノード追加(一旦資料ノードにしてる)
    addNewNode() {
        this.addNode(this.generateUniqueNumberText(), "newNode", "self-summary", this.latest_selected_node_info.x, this.latest_selected_node_info.y);
    }

    addmaterialNode(node_id, node_label){
        this.addNode(node_id, node_label, "material-content", this.latest_selected_node_info.x, this.latest_selected_node_info.y);
        // console.log(this.latest_selected_node_info.x,this.latest_selected_node_info.y)
    }

    addutteranceNode(utterance){
        this.addNode(this.generateUniqueNumberText(), utterance, "utterance", this.latest_selected_node_info.x, this.latest_selected_node_info.y);
    }

    //ノードのラベル編集(完了)
    editNode(node_id, node_content) {
        //ノードのラベルの編集
        const node = this.nodes.get(node_id);
        if (node) { // IDに相当するノードがある場合の中身を編集
            let result_label = '';
            for (let i = 0; i < node_content.length; i += 10) {
                result_label += node_content.substr(i, 10) + '\n';
            }
            result_label = result_label.trim(); // 末尾の不要な改行を除去
            node.label = result_label;
            // 編集を反映
            this.nodes.update(node);
            defaultRecordForestMRN.update_Node("label", node_id, node_content, "");
            const ontology_index = this.OntologyConnectNodeId.indexOf(node_id);
            if(ontology_index !== -1){
                const nodeBoundingBox = this.ownNetwork.getBoundingBox(node_id);
                const ontology_x = nodeBoundingBox.left;
                const ontology_y = nodeBoundingBox.top;
                this.nodes.update({ id: this.OntologyNodeId[ontology_index], x: ontology_x, y: ontology_y });
                defaultRecordForestMRN.update_Node("point", this.OntologyNodeId[ontology_index], ontology_x, ontology_y);
            }
        }
    }

    //ダブルクリック時編集(完了)
    doubleclick (params) {
        const clickedNodeId = params.nodes[0];
        if (clickedNodeId !== undefined) {
            // ユーザーに新しいラベルを尋ね、それをノードの中身に設定
            const newLabel = prompt('新しいラベルを入力してください:', this.nodes.get(clickedNodeId).label.split('\n').join(''));
            // 編集したラベルを反映
            if (newLabel !== null) {
                this.editNode(clickedNodeId, newLabel);
            }
        }
    }

    // ノード削除(完了)
    deleteNode (){
        const selectNodeId = this.ownNetwork.getSelection().nodes[0];
        if(selectNodeId !== undefined){
            this.edges.remove(this.ownNetwork.getConnectedEdges(selectNodeId));
            this.nodes.remove({id: selectNodeId});
            console.log(selectNodeId)
            defaultRecordForestMRN.delete_db_Node(selectNodeId);
            defaultRecordForestMRN.delete_db_Edge(selectNodeId, "");
            defaultRecordForestMRN.delete_db_Edge("", selectNodeId);
            const ontology_index = this.OntologyConnectNodeId.indexOf(selectNodeId);
            if(ontology_index !== -1){
                this.nodes.remove({ id: this.OntologyNodeId[ontology_index]});
                defaultRecordForestMRN.delete_db_Node(this.OntologyNodeId[ontology_index]);
                this.OntologyNodeId.splice(ontology_index, 1);
                this.OntologyConnectNodeId.splice(ontology_index, 1);
            }
            const connect_net_index = [];
            this.ConnectNetworkNodeId.map((n_id, index) => {
                if(n_id === selectNodeId){
                    connect_net_index.push(index);
                }
            });
            connect_net_index.sort((a, b) => b - a);
            connect_net_index.forEach(index => {
                this.ConnectNetworkNodeId.splice(index, 1);
                this.ConnectMindMapNodeId.splice(index, 1);
            });
            defaultRecordForestMRN.delete_connection(selectNodeId);
        }
    }

    // 右クリック時
    onContext(params) {
        this.nodeConnectEnabled = false;
        if (params.nodes.length == 1) {
            const NetworkMenu = document.getElementById('network_conmenu');
            this.selectId = params.nodes[0];
            const pointerX = params.pointer.DOM.x;
            const pointerY = params.pointer.DOM.y;
            const mynetPosition = document.getElementById("mynetwork2").getBoundingClientRect();
            this.BoxDisplay.x = pointerX + mynetPosition.left + 20;
            this.BoxDisplay.y = pointerY + mynetPosition.top + 20;
            NetworkMenu.style.left = this.BoxDisplay.x;
            NetworkMenu.style.top = this.BoxDisplay.y;
            NetworkMenu.style.display = "block";//ここようわからん未完成かも
            if(this.OntologyConnectNodeId.indexOf(this.selectId) !== -1){
                document.getElementById("net_conmenu3").style.display = "block";
            }
        }
    }

    //ラベルの選択（完了）
    show_select (){
        console.log(this.OntologyConnectNodeId.indexOf(this.selectId))
        document.getElementById('network_conmenu').style.display = "none";
        if(this.OntologyConnectNodeId.indexOf(this.selectId) !== -1){
            alert('このノードにはすでに概念がつけられているため概念付けできません');
            return;
        }
        const labelselect = document.getElementById("labelselect");
        labelselect.style.display = "block";
        labelselect.style.left = this.BoxDisplay.x;
        labelselect.style.top = this.BoxDisplay.y;
    }

    //概念をマップに追加（完了）
    addontology (){
        document.getElementById("labelselect").style.display = "none";
        const nodeBoundingBox = this.ownNetwork.getBoundingBox(this.selectId);
        const TopicTagId = this.generateUniqueNumberText();
        const selectionlist = document.getElementById('selectionlist');
        this.addNode(TopicTagId, selectionlist.value, "topic-tag", nodeBoundingBox.left, nodeBoundingBox.top);
        this.OntologyConnectNodeId.push(this.selectId);
        this.OntologyNodeId.push('topic-tag_'+TopicTagId);
        defaultRecordForestMRN.record_ontology(this.selectId, 'topic-tag_'+TopicTagId);
        selectionlist.options[2].selected = true;
    }

    Recruit_Idea (){
        document.getElementById('network_conmenu').style.display = "none";
        if(this.RecruitNodeId.indexOf(this.selectId) !== -1){
            alert('このノードにはすでに採用不採用がつけられています');
            document.getElementById("net_conmenu3").style.display = "none";
            return;
        }
        const recruitselect = document.getElementById("recruitselect");
        recruitselect.style.display = "block";
        recruitselect.style.left = this.BoxDisplay.x;
        recruitselect.style.top = this.BoxDisplay.y;
    }

    Selected_Recruit_Idea (){
        const FeedBackReflectionText = [];
        const FeedBackReflection = [];
        document.getElementById("recruitselect").style.display = "none";
        const selectionlist = document.getElementById('recruitselectionlist');
        const Ontology_Node_Id = this.OntologyNodeId[this.OntologyConnectNodeId.indexOf(this.selectId)];
        this.RecruitNodeId.push(this.selectId);
        this.Feedback.push(this.selectId);
        this.Recruit.push(selectionlist.value);
        if (selectionlist.value === "採用") { // IDに相当するノードがある場合の中身を編集
            this.nodes.update({
                id : Ontology_Node_Id,
                borderWidth: 5,
                color: {
                    border: "#a0a7ee",
                },
            });
        }else if(selectionlist.value === "棄却"){
            this.nodes.update({
                id : Ontology_Node_Id,
                borderWidth: 5,
                color: {
                    border: "#da5077",
                },
            });
        }
        for(var i=0; i<this.RecruitNodeId.length-1; i++){
            FeedBackReflectionText.push("text"+this.RecruitNodeId[i]);
            FeedBackReflection.push(document.getElementById("text"+this.RecruitNodeId[i]).value);
        }
        const node_info = this.nodes.get(this.selectId);
        document.getElementById("accordion_discussion").innerHTML += "<div id='"+this.selectId+"' class='accordion-item'><div class='accordion-header' style='font-size:10px'>なぜ「"+node_info.label+"」は"+selectionlist.value+"されたのですか？</div><div class='accordion-content'><textarea id='text"+ this.selectId +"' class='accordion-input'></textarea></div></div>";
        const accordionHeaders = document.querySelectorAll('#accordion_discussion .accordion-header');
        accordionHeaders.forEach(header => {
          header.addEventListener('click', function () {
            const accordionItem = this.parentElement;
            accordionItem.classList.toggle('active');
          });
        });
        //追加したら消えてしまうからおいておく
        for(var i=0; i<this.RecruitNodeId.length-1; i++){
            document.getElementById("text"+this.RecruitNodeId[i]).innerHTML = FeedBackReflection[FeedBackReflectionText.indexOf("text"+this.RecruitNodeId[i])];
        }
        defaultRecordForestMRN.record_recruit(this.selectId, Ontology_Node_Id, selectionlist.value);
        document.getElementById("net_conmenu3").style.display = "none";
    }

    ContentmenuCancel(){
        document.getElementById('network_conmenu').style.display = "none";
    }

    //マインドマップとネットワークつなげる(今後動作確認はいる多分行けた)，(複雑なので何してるか聞きたいなら大槻まで)
    connect_network (){
        document.getElementById('network_conmenu').style.display = "none";
        this.nodeConnectEnabled = true;
    }

    // マインドマップのノードがクリックされたときの処理
    connect_mindmap (e) {
        const Jsmind = new jsMind({container:'jsmind_container',
                                editable: false});
        if (!this.nodeConnectEnabled) {
            return;
        }else{
            const mm_nodeid = Jsmind.view.get_binded_nodeid(e.target);
            if(mm_nodeid == null){
                alert('ノードのクリックがうまくできませんでした．もう一度試してみてください');
                return;
            }else{
                if(this.ConnectNetworkNodeId.indexOf(this.selectId) !== -1 && this.ConnectMindMapNodeId.indexOf(mm_nodeid) !== -1){
                    alert('このノードはすでに選択されています');
                    return;
                }
                defaultRecordForestMRN.record_connection(this.selectId,mm_nodeid);
                this.ConnectNetworkNodeId.push(this.selectId);
                this.ConnectMindMapNodeId.push(mm_nodeid);
                this.nodeConnectEnabled = false;
            }
        }
    }

    //ノードがクリックされたときの処理
    networkClick (params){
        //他のところクリックしたら色直す
        document.getElementById("ontology_feedback").innerHTML = "";
        const feedbackarea = document.getElementsByClassName("accordion-item");
        for(var i=0; i<feedbackarea.length; i++){
            feedbackarea[i].style.display = "none";
        }
        if(this.jmindex != []){
            const jmnode = document.getElementsByTagName("jmnode");
            this.jmindex.map((n) => {
                if(jmnode[n].getAttribute("type") == "answer"){
                    jmnode[n].style.backgroundColor = "#ffa500";
                }else{
                    jmnode[n].style.backgroundColor = "#87cefa";
                }
            })
            this.jmindex.length = 0;
        }
        //ここ未完成
        if(this.nodes.get(params.nodes[0]).group === "utterance"){
            if(this.OntologyConnectNodeId.indexOf(params.nodes[0]) !== -1){
                const node_infomation = this.nodes.get(this.OntologyNodeId[this.OntologyConnectNodeId.indexOf(params.nodes[0])]);
                document.getElementById("ontology_feedback").innerHTML = "<div class='feedback_message'>この発言は「"+node_infomation.label + "」と「" + this.output_input[node_infomation.label] + "」<br>との合理性を意識して発言されたのかもしれません</div>";
            } 
        }
        // if(this.OntologyConnectNodeId.indexOf(params.nodes[0]) !== -1){
        //     const node_infomation = this.nodes.get(this.OntologyNodeId[this.OntologyConnectNodeId.indexOf(params.nodes[0])]);
        //     document.getElementById("ontology_feedback").innerHTML = "「"+node_infomation.label + "」と「" + this.output_input[node_infomation.label] + "」との合理性を考えましょう";
        // } 
        if(this.RecruitNodeId.indexOf(params.nodes[0]) !== -1){
            this.FeedbackNodeId = params.nodes[0];
            document.getElementById(this.FeedbackNodeId).style.display = "block";
        }
        if(params.nodes.length == 1){
            const net_index = this.ConnectNetworkNodeId.map((n_id, index) => {
                return n_id === params.nodes[0] ? index : null;
            }).filter(n => n !== null);
            if(net_index == ""){
                return;
            }
            const jmnode = document.getElementsByTagName("jmnode");
            net_index.map((m_id) => {
                for(var i = 0; i < jmnode.length; i++){
                    if(jmnode[i].getAttribute("nodeid") == this.ConnectMindMapNodeId[m_id]){
                        //ここいろかえる必要あるかも
                        jmnode[i].style.backgroundColor = "white";
                        this.jmindex.push(i);
                        break;
                    }
                }
            });
        }
    }

    shownetworkClick (params){
        if(this.jmindex2 != []){
            const area2 = document.getElementById("jsmind_container2");
            const jmnode2 = area2.getElementsByTagName("jmnode");
            this.jmindex2.map((n) => {
              if(jmnode2[n].getAttribute("type") == "answer"){
                jmnode2[n].style.backgroundColor = "#ffa500";
              }else{
                jmnode2[n].style.backgroundColor = "#87cefa";
              }
            })
            this.jmindex2.length = 0;
          }
          if(this.jmindex3 != []){
            const area3 = document.getElementById("jsmind_container3");
            const jmnode3 = area3.getElementsByTagName("jmnode");
            this.jmindex3.map((n) => {
              if(jmnode3[n].getAttribute("type") == "answer"){
                jmnode3[n].style.backgroundColor = "#ffa500";
              }else{
                jmnode3[n].style.backgroundColor = "#87cefa";
              }
            })
            this.jmindex3.length = 0;
          }
          if(params.nodes.length = 1){
            const net_index_show = this.ConnectNetworkNodeId.map((n_id, index) => {
              return n_id === params.nodes[0] ? index : null;
            }).filter(n => n !== null);
            if(net_index_show == ""){
              return;
            }
            const area2 = document.getElementById("jsmind_container2");
            const area3 = document.getElementById("jsmind_container3");
            const jmnode2 = area2.getElementsByTagName("jmnode");
            const jmnode3 = area3.getElementsByTagName("jmnode");
            net_index_show.map((m_id) => {
              for(var i = 0; i < jmnode2.length; i++){
                if(jmnode2[i].getAttribute("nodeid") == this.ConnectMindMapNodeId[m_id]){
                  //ここいろかえる必要あるかも
                  jmnode2[i].style.backgroundColor = "white";
                  this.jmindex2.push(i);
                }
              }
              for(var i = 0; i < jmnode3.length; i++){
                if(jmnode3[i].getAttribute("nodeid") == this.ConnectMindMapNodeId[m_id]){
                  //ここいろかえる必要あるかも
                  jmnode3[i].style.backgroundColor = "white";
                  this.jmindex3.push(i);
                  return;
                }
              }
            });
          }
  
    }

    addNewEdge(E_id, E_start, E_end){
        this.edges.add({ id: E_id, from: E_start, to: E_end });
        defaultRecordForestMRN.record_Edge(E_id, E_start, E_end);
    }

    //ドラッグ開始(完成)
    dragstart (params) {
        if(!this.edgeEditMode){
            params.event.preventDefault();
        }else{
            this.dragStartNodeId = this.ownNetwork.getNodeAt(params.pointer.DOM);
        }
    }

    //ドラッグ終了(完成)
    dragend (params) {
        let edge_id = this.generateUniqueNumberText();
        if(this.edgeEditMode){
            this.dragEndNodeId = this.ownNetwork.getNodeAt(params.pointer.DOM);
            if(this.dragStartNodeId !== null && this.dragEndNodeId !== null && this.dragEndNodeId !== this.dragStartNodeId && this.dragEndNodeId !== undefined && this.nodes.get(this.dragStartNodeId).shape != "ellipse" && this.nodes.get(this.dragEndNodeId).shape != "ellipse"){
                let notable = true;
                const ConnectSelectNode = [];
                const connectedEdges = this.ownNetwork.getConnectedEdges(this.dragStartNodeId);
                connectedEdges.map((n)=>{
                    ConnectSelectNode.push(this.ownNetwork.getConnectedNodes(n).filter(n => n !== this.dragStartNodeId)[0]);
                });
                ConnectSelectNode.map((n)=>{
                    if(n === this.dragEndNodeId){
                        notable = false;
                    }
                });
                if(notable == false){
                    return;
                }
                this.edges.add({ id: edge_id, from: this.dragStartNodeId, to: this.dragEndNodeId });
                defaultRecordForestMRN.record_Edge(edge_id, this.dragStartNodeId, this.dragEndNodeId);
            }
            this.dragStartNodeId = null;
            this.dragEndNodeId = null;
        }else{
            const movedNodeId = params.nodes[0];
            if (movedNodeId !== undefined) {
                //なぜか更新したら色変わってしまうから一時的に
                let node_color = '#cbe0f4';
                let border_color = '#cbe0f4'; 
                switch(this.nodes.get(movedNodeId).group) {
                    case "self-summary": // 自分で考えた要約に関するノードの場合
                        node_color = '#e3d7e6';
                        break;
                    case "utterance": // 議論内での発言ノードの場合
                        node_color = '#c5b4df';
                        break;
                    case "topic-tag": // 議論内省マップのノードがどんなトピックに対応しているかを表すタグノードの場合
                        node_color = '#a0a7ee';
                        break;
                    default: // その他
                        break;
                }
                this.nodes.update({ id: movedNodeId, color: node_color, x: params.pointer.x, y: params.pointer.y });
                const nodeBoundingBox = this.ownNetwork.getBoundingBox(movedNodeId);
                //次に追加したノードの座標指定
                this.latest_selected_node_info.x = (nodeBoundingBox.right + nodeBoundingBox.left)/2;
                this.latest_selected_node_info.y = nodeBoundingBox.bottom + 10;
                
                defaultRecordForestMRN.update_Node("point" ,movedNodeId, (nodeBoundingBox.right + nodeBoundingBox.left)/2, (nodeBoundingBox.bottom + nodeBoundingBox.top)/2)
                const ontology_index = this.OntologyConnectNodeId.indexOf(movedNodeId);
                if(ontology_index !== -1){
                    const nodeBoundingBox = this.ownNetwork.getBoundingBox(movedNodeId);
                    const ontology_x = nodeBoundingBox.left;
                    const ontology_y = nodeBoundingBox.top;
                    console.log(this.Recruit[this.RecruitNodeId.indexOf(this.OntologyConnectNodeId[this.OntologyNodeId.indexOf(this.OntologyNodeId[ontology_index])])]);
                    if(this.Recruit[this.RecruitNodeId.indexOf(this.OntologyConnectNodeId[this.OntologyNodeId.indexOf(this.OntologyNodeId[ontology_index])])]==="採用"){
                        border_color = '#e3d7e6'; 
                    }else if(this.Recruit[this.RecruitNodeId.indexOf(this.OntologyConnectNodeId[this.OntologyNodeId.indexOf(this.OntologyNodeId[ontology_index])])]==="棄却"){
                        border_color = '#da5077'; 
                    }
                    this.nodes.update({ id: this.OntologyNodeId[ontology_index], color: { background: '#a0a7ee', border: border_color}, x: ontology_x, y: ontology_y });
                    defaultRecordForestMRN.update_Node("point" ,this.OntologyNodeId[ontology_index], ontology_x, ontology_y);
                }
            }
        }
    }
    
    // エッジの削除（完了）
    deleteEdge() {
        const selectEdgeId = this.ownNetwork.getSelection().edges[0];
        const startid = this.edges.get(selectEdgeId).from;
        const endid = this.edges.get(selectEdgeId).to;
        if(selectEdgeId !== undefined){
            this.edges.remove({id: selectEdgeId});
            defaultRecordForestMRN.delete_db_Edge(selectEdgeId, startid, endid);
            const Edge_index = this.OntologyConnectNodeId.indexOf(startid);
            if(Edge_index !== -1){
                this.EdgeStartId.splice(Edge_index, 1);
                this.EdgeEndId.splice(Edge_index, 1);
            }
        }
    }

    feedback(){
        defaultRecordForestMRN.record_Feedback(this.FeedbackNodeId,document.getElementById("text"+this.FeedbackNodeId).value);
        const feedbacknode_index = this.Feedback.indexOf(this.FeedbackNodeId);
        this.Feedback.splice(feedbacknode_index, 1);
        const feedbacknode = this.nodes.get(this.FeedbackNodeId);
        let node_color = '#cbe0f4'; // ノードの背景色
        switch(feedbacknode.group) {
            case "material-content": // 議論資料に書かれた内容に関するノードの場合
                break;
            case "self-summary": // 自分で考えた要約に関するノードの場合
                node_color = '#e3d7e6';
                break;
            case "utterance": // 議論内での発言ノードの場合
                node_color = '#c5b4df';
                break;
            case "topic-tag": // 議論内省マップのノードがどんなトピックに対応しているかを表すタグノードの場合
                node_color = '#a0a7ee';
                break;
            default: // その他
                break;
        }
        this.nodes.update({ id: this.FeedbackNodeId, color: node_color, borderWidth: 0 });
    }

    Nodeblinking() {
        this.Feedback.map((n) => {
            const feedbacknode = this.nodes.get(n);
            let node_color = '#cbe0f4'; // ノードの背景色
            switch(feedbacknode.group) {
                case "material-content": // 議論資料に書かれた内容に関するノードの場合
                    break;
                case "self-summary": // 自分で考えた要約に関するノードの場合
                    node_color = '#e3d7e6';
                    break;
                case "utterance": // 議論内での発言ノードの場合
                    node_color = '#c5b4df';
                    break;
                case "topic-tag": // 議論内省マップのノードがどんなトピックに対応しているかを表すタグノードの場合
                    node_color = '#a0a7ee';
                    break;
                default: // その他
                    break;
            }
            const borderWidth = feedbacknode.borderWidth === 0 ? 5 : 0;
            this.nodes.update({ id: n, color: { background: node_color, border: "#"}, borderWidth: borderWidth });
        })
    }

    addMaterialOntology(material_id, concept_id){
        $.ajax({
            url:'js/hozo.xml',
            type:'get',
            dataType:'xml',
            timeout:1000,
            success: (xml,status) => {
                if(status!='success')return;
                const XML = $(xml).find('W_CONCEPTS');
                const concept = Array.from(XML[0].getElementsByTagName('CONCEPT'));
                //hozo.xmlファイルのタグを検索して変数に格納（たぶん，全てのタグが配列で格納されている），thisはhozo.xmlのことかな
                concept.map((content)=>{
                    if(content.getAttribute('id') === concept_id){
                        const slot_content = Array.from(content.getElementsByTagName("SLOT"));
                        // console.log(content);
                        slot_content.map((content_slot) => {
                            if(content_slot.getAttribute("role") === "出力"){
                                const nodeBoundingBox = defaultForestMRN.ownNetwork.getBoundingBox(material_id);
                                this.addNode(concept_id, content_slot.getAttribute("class_constraint"), "topic-tag", nodeBoundingBox.left, nodeBoundingBox.top);
                                this.OntologyConnectNodeId.push(material_id);
                                this.OntologyNodeId.push('topic-tag_'+concept_id);
                                defaultRecordForestMRN.record_ontology(material_id, 'topic-tag_'+concept_id);
                            }
                        });
                    }
                });
            }
        });
    }

    zoomIn() {
        const scale = this.ownNetwork.getScale() * 1.1; // Increase scale by 10%
        this.scale = scale;
        this.ownNetwork.moveTo({ scale: scale });
    }
      
    zoomOut() {
        const scale = this.ownNetwork.getScale() * 0.9; // Decrease scale by 10%
        this.scale = scale;
        this.ownNetwork.moveTo({ scale: scale });
    }

}

// ネットワーク関係の記録
class RecordForestMRN{
    //ノードの記録(完了)
    record_Node (id, label, node_type, x, y){
        $.ajax({
            url: "php/discussion_edit_structmap_maneger.php",
            type: "POST",
            data: {node_id : id,
                label : label,
                x : x,
                y : y,
                node_type : node_type,
                purpose : 'record',
                record_thing: 'node'},
            success: function(e){
                if(e){
                    console.log(e);
                }
            }
        });
    }

    //エッジの記録(完了)
    record_Edge (edge_id, edge_start, edge_end){
        // console.log(edge_id+", "+edge_start+", "+edge_end);
        $.ajax({
            url: "php/discussion_edit_structmap_maneger.php",
            type: "POST",
            data: {edge_id: edge_id,
                edge_start : edge_start,
                edge_end : edge_end,
                purpose : 'record',
                record_thing: 'edge'},
        });
    }

    //フィードバックの記録
    record_Feedback (node_id, text){
        $.ajax({
            url: "php/discussion_edit_structmap_maneger.php",
            type: "POST",
            data: {purpose: "record",
                record_thing: "reflectioncontent",
                node_id : node_id,
                text : text},
        });
    }

    record_Material_Edge(edge_start, edge_end, edge_label){
        $.ajax({
            url: "php/discussion_edit_structmap_maneger.php",
            type: "POST",
            data: {edge_start : edge_start,
                edge_end : edge_end,
                edge_label: edge_label,
                purpose : 'record',
                record_thing: 'material_edge'},
        });
    }

    //ノードの更新(完了)
    update_Node (select_update, id, node_update_thing1, node_update_thing2){
        $.ajax({
            url: "php/discussion_edit_structmap_maneger.php",
            type: "POST",
            data: {select_update : select_update,
                node_id : id,
                purpose : 'update',
                update_thing : 'node',
                node_update_thing1 : node_update_thing1,
                node_update_thing2: node_update_thing2},
        });
    }

    //ノードの削除(完了)
    delete_db_Node (id){
        $.ajax({
            url: "php/discussion_edit_structmap_maneger.php",
            type: "POST",
            data: {node_id : id,
                purpose : 'delete',
                delete_thing : 'node'},
        });
    }
    
    //エッジの削除(完了)
    delete_db_Edge (edge_id, edge_start,edge_end){
        $.ajax({
            url: "php/discussion_edit_structmap_maneger.php",
            type: "POST",
            data: {edge_id: edge_id,
                edge_start : edge_start,
                edge_end : edge_end,
                purpose : 'delete',
                delete_thing : 'edge'},
        });
    }

    delete_connection (id){
        $.ajax({
            url: "php/discussion_edit_structmap_maneger.php",
            type: "POST",
            data: {node_id : id,
                purpose : 'delete',
                delete_thing : 'connection'},
        });
    }

    //繋げたものをDBに記録
    record_connection (NetworkNodeId,MindMapNodeId){
        $.ajax({
            url: "php/discussion_edit_structmap_maneger.php",
            type: "POST",
            data: {networknodeid : NetworkNodeId,
                mindmapnodeid : MindMapNodeId,
                purpose : 'record',
                record_thing : 'connection'},
        });
    }

    // オントロジーの対応付けの記録
    record_ontology (node_id, ontology_node_id){
        $.ajax({
            url: "php/discussion_edit_structmap_maneger.php",
            type: "POST",
            data: {node_id : node_id,
                ontology_node_id : ontology_node_id,
                purpose : 'record',
                record_thing : 'ontology'},
        });
    }

    // オントロジーの対応付けの記録
    record_recruit (node_id, ontology_node, result){
        $.ajax({
            url: "php/discussion_edit_structmap_maneger.php",
            type: "POST",
            data: {node_id : node_id,
                ontology_node : ontology_node,
                result_recruit : result,
                purpose : 'record',
                record_thing : 'recruit'},
        });
    }
}


/*
 * データベースからの読み込み
 */
let utterance_list;
const getDiscussionMapDataFromDB = (target_time, end_time, callback) => {
    let data;
    // データベースから発話ノードリストにあるノードデータ一覧を取得
    if(target_time === null){
        data =  {
                purpose: "select_meeting_utterance",
                first_load_flag: true,
                };
    }else if(end_time === null){
        data =  {
                purpose: "select_version_discussionmap",
                first_load_flag: target_time,
                };
    }else{
        data =  {
                purpose: "select_past_discussionmap",
                discussion_start_time : target_time,
                discussion_end_time : end_time
                };      
    }
    return $.ajax({
        url: "php/discussion_map_manager.php",
        type: "POST",
        data: data,
    }).success((r) => {
        // console.log(r);
        utterance_list = JSON.parse(r);
        callback(utterance_list);
    });
}

// 発言を発言エリアにdivとして表示
const makeUtteranceNodeInList = (utter_id, utter_content, speaker, JPNtime, network_on) => {
    // 左側の発話ノードのリストのところのノードのDOMを構成する
    let backColor = "white";
    if(network_on === "1"){
        backColor = "gray";
    }
    return $(`(<div id="${utter_id}"
                 style='border: solid 2px #000; font-size: 10px; line-height: 10px; background: ${backColor}; margin-bottom: 5px;'
                 class='utter_node_in_list'
                 speaker='${speaker}'
                 utterance='${utter_content}'
                 timestamp='${JPNtime}'
                 network_on='${network_on}'
            >
               <!-- もし，Mouseoverとかの処理がノードの色をつけ変えるだけの話なら，JSじゃなくてCSSのover擬似クラスで処理するようにする -->
               【${speaker}さん】：<br>${utter_content}
            </div>`);
}

// 発言をネットワークに反映
const update_text_on = (areaid) => {
    $.ajax({
        url: "php/update_network_text.php",
        type: "POST",
        data: {area_id: areaid,
              purpose : "network_on"},
    });
}

// くっつけた発言をDBに反映
const update_unit_text = (remain_id, delete_id, content) => {
  $.ajax({
    url: "php/update_network_text.php",
    type: "POST",
    data: {areaid : remain_id,
      delete_id : delete_id,
      content : content,
      purpose : 'union'},
  });
}

// 発言をくっつけるための関数
const union_utterance = (area1, area2) => {
  //ここに発言者同じじゃないと進めないっていう制約いる
    if(area1 > area2){
      document.getElementById(area2).innerHTML = "【"+document.getElementById(area2).getAttribute('speaker')+"さん】：</br>"+document.getElementById(area2).getAttribute('utterance')+document.getElementById(area1).getAttribute('utterance');
      document.getElementById(area2).setAttribute('utterance', document.getElementById(area2).getAttribute('utterance')+document.getElementById(area1).getAttribute('utterance'));
      console.log(document.getElementById(area2).getAttribute('utterance'))
      update_unit_text(area2, area1, document.getElementById(area2).getAttribute('utterance'));
      document.getElementById(area1).remove();
    }else{
      document.getElementById(area2).innerHTML = "【"+document.getElementById(area2).getAttribute('speaker')+"さん】：</br>"+document.getElementById(area1).getAttribute('utterance')+document.getElementById(area2).getAttribute('utterance');
      document.getElementById(area2).setAttribute('utterance', document.getElementById(area1).getAttribute('utterance')+document.getElementById(area2).getAttribute('utterance'));
      console.log(document.getElementById(area2).getAttribute('utterance'));
      update_unit_text(area2, area1, document.getElementById(area2).getAttribute('utterance'));
      document.getElementById(area1).remove();
    }
}

// アップロードする時
const displayUtteranceNodeInList = (display_target_area_id, target_reflection_time) => {
    // 指定した時間（指定なしなら最新）のマップに対応する発話ノードリストを取得して画面上に配置
    let mousedownId = null;
    document.getElementById(display_target_area_id).innerHTML="";
    const target_area = $(`#${display_target_area_id}`); // 発話ノードリストのDOMエリア
    const timedisplay_area = $(`#timedisplay`); // 発話ノードの議論内での時間を表示するエリア
    getDiscussionMapDataFromDB(target_reflection_time, null, (utterance_list_info) => {
        // データの取得と挿入
        utterance_list_info.utterance.map(u => {
            const utter_dom = makeUtteranceNodeInList(u.network_text_id, u.content, u.sender, u.JPNtime, u.network_on);
            target_area.append(utter_dom); // 挿入            
        });
        for(var i=0; i<utterance_list_info.document.length; i++){
            defaultForestMRN.addmaterialNode(utterance_list_info.document[i].item_content_id, utterance_list_info.document[i].item_content_id);
            document.getElementById("labelselect").style.display = "none";
            defaultForestMRN.addMaterialOntology('material-content_'+utterance_list_info.document[i].item_content_id, utterance_list_info.document[i].concept_id);
        }
        utterance_list_info.item_content_relation.map(u => {
            defaultForestMRN.addmaterialEdge("material-content_"+u.item_content1_id, "material-content_"+u.item_content2_id, u.item_content1_label+"→"+u.item_content2_label)        
        });
    }).then(() => {
        $(`#utterance_area`).on('mousedown', (e) => {
            // リスト内の発話ノードにマウスイベント（マウスが要素上からでた）を追加
            mousedownId = null;
            const overed_node = e.target;
            if(overed_node.getAttribute('network_on')==='0'){
                mousedownId = overed_node.getAttribute('id');
            }
        });
        $(`#utterance_area`).on('mouseleave', (e) => {
            // リスト内の発話ノードにマウスイベント（マウスが要素上からでた）を追加
            $(`#rclick`).empty();
        });
        $(`.utter_node_in_list`).on('mouseup', (e) => {
            // リスト内の発話ノードにマウスイベント（マウスが要素上からでた）を追加
            const overed_node = e.target;
            if(overed_node.getAttribute('network_on') === '0' && mousedownId !== null && mousedownId !== overed_node.getAttribute('id') && overed_node.getAttribute('speaker') === document.getElementById(mousedownId).getAttribute('speaker')){
                union_utterance(mousedownId, overed_node.getAttribute('id'))
            }
        });
        $(`.utter_node_in_list`).on('mouseenter', (e) => {
            // リスト内の発話ノードにマウスイベント（マウスが要素上に入った）を追加
            const overed_node = e.target;
            timedisplay_area.html(overed_node.getAttribute('timestamp'));
        });
        $(`.utter_node_in_list`).on('mouseleave', (e) => {
            // リスト内の発話ノードにマウスイベント（マウスが要素上からでた）を追加
            const overed_node = e.target;
            timedisplay_area.empty();
        });
        $(`.utter_node_in_list`).on('click', (e) => {
            // リスト内の発話ノードにマウスイベント(右クリック)を追加
            document.getElementById("rclick").innerHTML="";
            const clicked_node = e.target;
            if(clicked_node.getAttribute('network_on') === '0'){
                document.getElementById("rclick").innerHTML="<input type='button' id='utteranceNodebutton' value='ノードに追加'>";
                $(`#utteranceNodebutton`).on("click", () => {
                    defaultForestMRN.addutteranceNode(clicked_node.getAttribute('utterance'));
                    document.getElementById("rclick").innerHTML="";
                    clicked_node.setAttribute('network_on', "1");
                    document.getElementById(clicked_node.getAttribute('id')).style.background="gray";
                    update_text_on(clicked_node.getAttribute('id'));
                });
            }
        });      
        $(`.utter_node_in_list`).on('contextmenu', (e) => {
            // リスト内の発話ノードにマウスイベント(右クリック)を追加
            const clicked_node = e.target;
            timedisplay_area.empty();
            // rightclick()
        });
        document.getElementById("accordion_discussion").innerHTML = "";      
    });
}

//ロードする時
const displayDiscussionMapData = (display_target_area_id, target_reflection_time) => {
    // 指定した時間（指定なしなら最新）のマップに対応する発話ノードリストを取得して画面上に配置
    const target_area = $(`#${display_target_area_id}`); // 発話ノードリストのDOMエリア
    const timedisplay_area = $(`#timedisplay`); // 発話ノードの議論内での時間を表示するエリア
    let mousedownId = null;
    getDiscussionMapDataFromDB(target_reflection_time, null, (utterance_list_info) => {
        // console.log(utterance_list_info);
        // データの取得と挿入
        utterance_list_info.utterance.map(u => {
            const utter_dom = makeUtteranceNodeInList(u.network_text_id, u.content, u.sender, u.JPNtime, u.network_on);
            target_area.append(utter_dom); // 挿入            
        });
        utterance_list_info.dnode.map((n) => {
            // console.log(n);
            defaultForestMRN.addReloadNode(n.network_node_id, n.label, n.node_type, n.node_x, n.node_y);
        });
        utterance_list_info.dedge.map((n) => {
            defaultForestMRN.addReloadEdge(n.edge_id, n.edge_start, n.edge_end, n.edge_label);
        });
        utterance_list_info.fnode_dnode_rel.map((n) => {
            defaultForestMRN.ConnectNetworkNodeId.push(n.network_node_id);
            defaultForestMRN.ConnectMindMapNodeId.push(n.mindmap_node_id);
        });
        utterance_list_info.dnode_ontology_rel.map((n) => {
            defaultForestMRN.OntologyNodeId.push(n.ontology_id);
            defaultForestMRN.OntologyConnectNodeId.push(n.network_node_id);
        });
        utterance_list_info.map_create_start_and_end.map((n) => {
            const selectElement = document.getElementById("selectiontime");
            const optionElement = document.createElement('option');
            optionElement.value = JSON.stringify([n.start_time,n.end_time]);
            optionElement.text = n.start_time;
            selectElement.appendChild(optionElement);
        });
        utterance_list_info.recruit.map((n) => {
            defaultForestMRN.RecruitNodeId.push(n.network_node_id);
            defaultForestMRN.Recruit.push(n.result_recruit);
            let back_color = "#a0a7ee";
            if(n.result_recruit==="棄却"){
                back_color = "#da5077"
            }
            defaultForestMRN.nodes.update({
                id : n.ontology_id,
                borderWidth: 5,
                color: {
                    border: back_color,
                }
            });
            if(n.reason === null){
                defaultForestMRN.Feedback.push(n.network_node_id);
            }
            document.getElementById("accordion_discussion").innerHTML += "<div id='"+n.network_node_id+"' class='accordion-item'><div class='accordion-header' style='font-size:10px'>なぜ「"+defaultForestMRN.nodes.get(n.network_node_id).label+"」は"+n.result_recruit+"されたのですか？</div><div class='accordion-content'><textarea id='text"+ n.network_node_id +"' class='accordion-input'>"+n.reason+"</textarea></div></div>";
        });
        console.log(defaultForestMRN.Feedback);
    }).then(() => {
        const accordionHeaders = document.querySelectorAll('#accordion_discussion .accordion-header');
        accordionHeaders.forEach(header => {
            header.addEventListener('click', function () {
                const accordionItem = this.parentElement;
                accordionItem.classList.toggle('active');
            });
        });
        const feedbackarea = document.getElementsByClassName("accordion-item");
        for(var i=0; i<feedbackarea.length; i++){
            feedbackarea[i].style.display = "none";
        }
         $(`#utterance_area`).on('mousedown', (e) => {
            // リスト内の発話ノードにマウスイベント（マウスが要素上からでた）を追加
            mousedownId = null;
            const overed_node = e.target;
            if(overed_node.getAttribute('network_on')==='0'){
                mousedownId = overed_node.getAttribute('id');
            }
         });
         $(`#utterance_area`).on('mouseleave', (e) => {
            // リスト内の発話ノードにマウスイベント（マウスが要素上からでた）を追加
            $(`#rclick`).empty();
        });
        $(`.utter_node_in_list`).on('mouseup', (e) => {
            // リスト内の発話ノードにマウスイベント（マウスが要素上からでた）を追加
            const overed_node = e.target;
            if(overed_node.getAttribute('network_on') === '0' && mousedownId !== null && mousedownId !== overed_node.getAttribute('id') && overed_node.getAttribute('speaker') === document.getElementById(mousedownId).getAttribute('speaker')){
                union_utterance(mousedownId, overed_node.getAttribute('id'))
            }
        });
        $(`.utter_node_in_list`).on('mouseenter', (e) => {
            // リスト内の発話ノードにマウスイベント（マウスが要素上に入った）を追加
            const overed_node = e.target;
            timedisplay_area.html(overed_node.getAttribute('timestamp'));
        });
        $(`.utter_node_in_list`).on('mouseleave', (e) => {
            // リスト内の発話ノードにマウスイベント（マウスが要素上からでた）を追加
            const overed_node = e.target;
            timedisplay_area.empty();
        });
        $(`.utter_node_in_list`).on('click', (e) => {
            // リスト内の発話ノードにマウスイベント(右クリック)を追加
            document.getElementById("rclick").innerHTML="";
            const clicked_node = e.target;
            if(clicked_node.getAttribute('network_on') === '0'){
                document.getElementById("rclick").innerHTML="<input type='button' id='utteranceNodebutton' value='ノードに追加'>";
                $(`#utteranceNodebutton`).on("click", () => {
                    defaultForestMRN.addutteranceNode(clicked_node.getAttribute('utterance'));
                    document.getElementById("rclick").innerHTML="";
                    clicked_node.setAttribute('network_on', "1");
                    document.getElementById(clicked_node.getAttribute('id')).style.background="gray";
                    update_text_on(clicked_node.getAttribute('id'));
                });
            }
        });
        $(`.utter_node_in_list`).on('contextmenu', (e) => {
            // リスト内の発話ノードにマウスイベント(右クリック)を追加
            const clicked_node = e.target;
            timedisplay_area.empty();
            // rightclick()
        });        
    });
}

/*
* XMLファイルのアップロードとデータ取得処理
*/
const getXMLTagInfo = () => {
    try {
        // アップロードされたXMLファイルの中身をJSONデータとして取得
        const parser = new DOMParser();
        const meeting_utterances = parser.parseFromString($("#meeting_utterance_xml").html(), "text/xml");
        
        // XMLが正常に解析されなかった場合のエラーチェック
        const parseError = meeting_utterances.querySelector('parsererror');
        if (parseError) {
        console.error("XML Parsing Error: ", parseError);
        return []; // エラーの場合は空の配列を返す
        }

        const getTaggedInfo = (utter, tag) => {
        return $(utter).find(tag).html();
        }

        const utter_list = Array.prototype.slice.call(meeting_utterances.getElementsByTagName("messagedata")).map(u => {
        return {
            message_id: getTaggedInfo(u, "id"),
            content: getTaggedInfo(u, "type"),
            sender: getTaggedInfo(u, "sender_id"),
            time: getTaggedInfo(u, "time"),
            JPNtime: getTaggedInfo(u, "jpntime")
        };
        });

        return utter_list;
    } catch (error) {
        console.error("Error in getXMLTagInfo: ", error);
        return []; // エラーが発生した場合、空の配列を返す
    }
};
  

// アップロードされたXMLを一旦別の場所においておく
const setUploadedXMLData = (file_input_btn_id, xml_area_id) => {
  // 読み込んだXMLファイルの中身を一度，HTML上にDisplayする（要素とかを取得する処理をしやすくするため）
  const btn = document.getElementById(file_input_btn_id);
  btn.addEventListener("click", () => {
      btn.addEventListener("change", (evt) => {
          const file = evt.target.files;
          const reader = new FileReader();
          reader.readAsText(file[0]);

          reader.onload = () => {
              const new_span = document.createElement('span');
              new_span.setAttribute('id', 'meeting_utterance_xml');
              new_span.innerHTML = reader.result;

              const area = $('#'+xml_area_id);
              area.append(new_span);
                           
              new Promise(() => {
                  $("#uploaded_meeting_utterance_xml_concent_display_area").html(area.html());
              });
          }
      }, false);
  });
  $(file_input_btn_id).off();
}

// 発言をアップロードする関数
const uploadMeetingUtteranceXML = () => {
  // フォームデータを作成
  console.log(getXMLTagInfo());
  recordMeetingUtteranceNodes(getXMLTagInfo())
}
  
//過去のネットワークとマインドマップを開く関数
//OpenNetWork(start,null)にすれば，バーションになる
function OpenNetwork(start_time, end_time) {
    defaultShowForestMRN = new ForestMRN('mynetwork_show', 'pastmap');
    getDiscussionMapDataFromDB(start_time, end_time,  (utterance_list_info) => {
        // データの取得と挿入
        utterance_list_info.dnode.map((n) => {
            defaultShowForestMRN.addShowNode(n.node_id, n.label, n.node_type, n.node_x, n.node_y);
        });
        utterance_list_info.dedge.map((n) => {
            defaultShowForestMRN.addReloadEdge(n.edge_id, n.edge_start, n.edge_end, n.edge_label);
        });
        utterance_list_info.fnode_dnode_rel.map((n) => {
            defaultShowForestMRN.ConnectNetworkNodeId.push(n.network_node_id);
            defaultShowForestMRN.ConnectMindMapNodeId.push(n.mindmap_node_id);
        });
        utterance_list_info.dnode_ontology_rel.map((n) => {
            defaultShowForestMRN.OntologyNodeId.push(n.ontology_id);
            defaultShowForestMRN.OntologyConnectNodeId.push(n.node_id);
        });
        utterance_list_info.recruit.map((n) => {
            defaultShowForestMRN.RecruitNodeId.push(n.node_id);
            defaultShowForestMRN.Recruit.push(n.result_recruit);
        });
        utterance_list_info.recruit.map((n) => {
            defaultShowForestMRN.RecruitNodeId.push(n.node_id);
            defaultShowForestMRN.Recruit.push(n.result_recruit);
            let back_color = "#a0a7ee";
            if(n.result_recruit==="棄却"){
                back_color = "#da5077"
            }
            defaultShowForestMRN.nodes.update({
                id : n.ontology_id,
                borderWidth: 5,
                color: {
                    border: back_color,
                }
            });
        });
        if(end_time === null){
            //バージョンが呼ばれた場合
            GetPastMap2(utterance_list_info.result_discussionmap_create_start_time);
            GetPastMap3(start_time);
        }else{
            //過去のマインドマップを表示する場合
            GetPastMap2(start_time);
            GetPastMap3(end_time);
        }
    });
}

// 過去のマインドマップを選んだ際の関数
const select_time = () => {
    const selectiontime = document.getElementById('selectiontime');
    const selecttime = JSON.parse(selectiontime.value);
    selectiontime.options[0].selected = true;
    OpenNetwork(selecttime[0],selecttime[1]);
}

// 議論時の発言を記録する関数
const recordMeetingUtteranceNodes = (utterances) => {
  $.ajax({
    url: "php/discussion_map_manager.php",
    type: "POST",
    data: {
      purpose: "record_meeting_utterance",
      utters: JSON.stringify(utterances),
    }
  }).done((r) => {
    console.log("Request succeeded:", utterances);
    console.log("Server response:", r);
    displayUtteranceNodeInList("utterance_area2", null);
  })
  .fail((jqXHR, textStatus, errorThrown) => {
    console.error("Request failed:", textStatus, errorThrown);
    // 失敗時の処理を追加（例えば、エラーメッセージの表示など）
  });
}

// ロードした際の関数
window.addEventListener('load', () => {

    // 初期表示時点でいくつかのオブジェクトを非表示にする
    document.getElementById("network_container").style.display="none";
    defaultForestMRN = new ForestMRN("mynetwork", "load");
    setUploadedXMLData("meetingUtteranceXmlFileUploader", "uploaded_meeting_utterance_xml_concent_display_area");
    $("#discussion_log_xml_file_upload_button").on("click", () => {
        // ファイルアップロードボタンにアップロードイベントを付与
        document.getElementById("mynetwork").innerHTML="";
        defaultForestMRN.removeEventLister();
        
        defaultForestMRN = new ForestMRN("mynetwork", "load");
        uploadMeetingUtteranceXML();
        $('#mrnb_addNode').off('click');
        $('#mrnb_removeNode').off('click');
        $('#mrnb_startEditEdge').off('click');
        $('#mrnb_removeEdge').off('click');
        $('#mrnb_ZoomIn').off('click');
        $('#mrnb_ZoomOut').off('click');
        $(`#mrnb_addNode`).on("click", e => {
            defaultForestMRN.addNewNode();
        });
        $(`#mrnb_removeNode`).on("click", e => {
            defaultForestMRN.deleteNode();
        });
        $(`#mrnb_startEditEdge`).on("click", e => {
            defaultForestMRN.SelectEditEdge();
        });
        $(`#mrnb_removeEdge`).on("click", e => {
            defaultForestMRN.deleteEdge();
        });
        $(`#mrnb_ZoomIn`).on("click", e => {
            defaultForestMRN.zoomIn();
        });
        $(`#mrnb_ZoomOut`).on("click", e => {
            defaultForestMRN.zoomOut();
        });
    });
    displayDiscussionMapData("utterance_area2", null); // 最新の議論内省マップの発話リストを表示
    // 内省マップ編集ボタンにイベント付与
    $(`#mrnb_addNode`).on("click", e => {
        defaultForestMRN.addNewNode();
    });
    $(`#mrnb_removeNode`).on("click", e => {
        defaultForestMRN.deleteNode();
    });
    $(`#mrnb_startEditEdge`).on("click", e => {
        defaultForestMRN.SelectEditEdge();
    });
    $(`#mrnb_removeEdge`).on("click", e => {
        defaultForestMRN.deleteEdge();
    });
    $(`#mrnb_ZoomIn`).on("click", e => {
        defaultForestMRN.zoomIn();
    });
    $(`#mrnb_ZoomOut`).on("click", e => {
        defaultForestMRN.zoomOut();
    });

    $("#past_time_select_button").on("click", () => {
        // ファイルアップロードボタンにアップロードイベントを付与
        select_time();
    });
    const accordionHeaders = document.querySelectorAll('#accordion_discussion .accordion-header');
    console.log(accordionHeaders)
    accordionHeaders.forEach(header => {
      header.addEventListener('click', function () {
        const accordionItem = this.parentElement;
        accordionItem.classList.toggle('active');
      });
    });
});
