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
        if(this.ownNetwork){
            if(load == "load"){
                this.jmindex = [];
                this.addEventLister();
                this.ownNetwork.on('click', this.networkClick.bind(this));
                this.ownNetwork.on('dragStart', this.dragstart.bind(this));
                this.ownNetwork.on('dragEnd', this.dragend.bind(this));
                this.ownNetwork.on('doubleClick', this.doubleclick.bind(this));
                this.ownNetwork.on("oncontext", this.onContext.bind(this));
                this.ownNetwork.on('select', this.selectdelete.bind(this));
            } else if(load == 'pastmap') {
                this.jmindex2 = [];
                this.jmindex3 = [];
                this.ownNetwork.on('click', this.shownetworkClick.bind(this));
            }
        } else {
            try { console.warn('ForestMRN: network not initialized (container missing or shared mode).'); } catch(e){}
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
                session_start_time: (typeof window !== 'undefined' && window.MeetingSessionStartTime) ? window.MeetingSessionStartTime : '',
                session_end_time: (typeof window !== 'undefined' && window.MeetingSessionEndTime) ? window.MeetingSessionEndTime : ''
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
        // マップを表示（コンテナが存在しない場合や共有知モードでは生成しない）
        const el = document.getElementById(canvas_dom_id);
        // 共有知モードでは vis を生成しない
        const isShared = (typeof window !== 'undefined' && window.SharedModeActive === true);
        if (!el || isShared) {
            // コンテナが無い、または共有知モード中は初期化を抑止
            return null;
        }
        // el が存在しないケースで後続が実行されないよう安全対策
        if(!el){ return null; }
        return new vis.Network(
            el,
            { nodes: nodes, edges: edges },
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
                 style='border: solid 2px #000; font-size: 11px; line-height: 11px; background: ${backColor}; margin-bottom: 5px;'
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

// 選択状態の管理とハイライト適用
const ensureSelectionStore = () => {
    try { if (!window.selectedUtteranceIds) { window.selectedUtteranceIds = []; } } catch(e) { /* no-op */ }
};
const getSelectedIds = () => { ensureSelectionStore(); return window.selectedUtteranceIds; };
const isSelectedId = (id) => { id = String(id); ensureSelectionStore(); return window.selectedUtteranceIds.indexOf(id) !== -1; };
const addSelectedId = (id) => {
    id = String(id);
    ensureSelectionStore();
    if (window.selectedUtteranceIds.indexOf(id) === -1) { window.selectedUtteranceIds.push(id); }
};
const removeSelectedId = (id) => {
    id = String(id);
    ensureSelectionStore();
    window.selectedUtteranceIds = window.selectedUtteranceIds.filter(function(x){ return String(x) !== id; });
};
const clearSelectedIds = () => { ensureSelectionStore(); window.selectedUtteranceIds = []; };
const applySelectionHighlight = () => {
    try {
        const allUtters = document.querySelectorAll('.utter_node_in_list');
        allUtters.forEach((el) => {
            const id = String(el.getAttribute('id') || '');
            const neton = el.getAttribute('network_on');
            if (isSelectedId(id)) {
                el.classList.add('utter-selected');
                el.style.background = '#ffe6ea'; // 選択中は薄いピンクを優先
            } else {
                el.classList.remove('utter-selected');
                el.style.background = (neton === '1') ? 'gray' : 'white';
            }
        });
    } catch (e) { /* no-op */ }
};

// 背景色を元に戻す（選択ハイライト解除）
const restoreListBackgrounds = () => {
    try {
        const allUtters = document.querySelectorAll('.utter_node_in_list');
        allUtters.forEach((el) => {
            el.classList.remove('utter-selected');
            const neton = el.getAttribute('network_on');
            el.style.background = (neton === '1') ? 'gray' : 'white';
        });
    } catch (e) { /* no-op */ }
};

// 選択中IDから外部化テキストを再構築（選択された発言内容を含めて元に戻す）
const rebuildExternalizationTextFromSelection = () => {
    try {
        var $extMain = $('#externalization-main');
        if(!$extMain.length){ $extMain = $('.externalization-main').first(); }
        if(!$extMain.length) return;
        var ids = getSelectedIds();
        var lines = [];
        if (ids && ids.length) {
            ids.forEach(function(id){
                var el = document.getElementById(String(id));
                if (el) {
                    var txt = el.getAttribute('utterance') || '';
                    if (txt) { lines.push(txt); }
                }
            });
        }
        $extMain.val(lines.join('\n'));
    } catch(e) { /* no-op */ }
};

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
            const utter_dom = makeUtteranceNodeInList(u.utterance_id, u.content, u.sender, u.utter_time, u.network_on);
            target_area.append(utter_dom); // 挿入            
        });
        // もしラベルマップがあれば適用
        try {
            if (window.UtteranceTypeMap) { applyLabelsToUtteranceList(window.UtteranceTypeMap); }
        } catch(e) { /* no-op */ }
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
            // クリックされた要素（内側のテキストや<br>ではなく、.utter_node_in_list 本体）
            const clicked_node = e.currentTarget || e.target;
            const clicked_id = String(clicked_node.getAttribute('id'));
            // 直近で選択した発話IDを保持（DB登録用）
            try { window.lastRemarkedUtteranceId = clicked_id; } catch(err) {}

            // 複数選択・トグル: 修飾キー押下時は加算/解除のトグル、未押下時は置換/解除
            var appendMode = !!(e && (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey));
            var already = isSelectedId(clicked_id);
            var willDeselect = false;
            if (appendMode) {
                if (already) { removeSelectedId(clicked_id); willDeselect = true; }
                else { addSelectedId(clicked_id); }
            } else {
                if (already) { clearSelectedIds(); willDeselect = true; }
                else { clearSelectedIds(); addSelectedId(clicked_id); }
            }
            applySelectionHighlight();
            // 外部化フォームへの反映（.externalization-main or #externalization-main）
            var $extMain = $('#externalization-main');
            if(!$extMain.length){ $extMain = $('.externalization-main').first(); }
            // 選択解除の場合はテキストエリアは変更しない
            if($extMain && $extMain.length && !willDeselect){
                var addText = clicked_node.getAttribute('utterance') || '';
                if(addText){
                    var current = $extMain.val();
                    // 複数選択対応: 修飾キー（Ctrl/Shift/Alt/Cmd）押下なら追記、そうでなければ置換
                    var appendMode = !!(e && (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey));
                    if(appendMode && current){
                        $extMain.val(current + "\n" + addText);
                    } else {
                        $extMain.val(addText);
                    }
                }
            }
            if(clicked_node.getAttribute('network_on') === '0'){
                document.getElementById("rclick").innerHTML="<input type='button' id='utteranceNodebutton' value='この発言を選択'>";
                $(`#utteranceNodebutton`).on("click", () => {
                    defaultForestMRN.addutteranceNode(clicked_node.getAttribute('utterance'));
                    document.getElementById("rclick").innerHTML="";
                    clicked_node.setAttribute('network_on', "1");
                    // ネットワークに追加済みは灰色へ（選択リストからも除外）
                    removeSelectedId(clicked_id);
                    applySelectionHighlight();
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
        // 再描画後に選択中の発話群があればハイライトを復元
        applySelectionHighlight();
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
            const utter_dom = makeUtteranceNodeInList(u.utterance_id, u.content, u.sender, u.utter_time, u.network_on);
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
            // クリックされた要素（内側のテキストや<br>ではなく、.utter_node_in_list 本体）
            const clicked_node = e.currentTarget || e.target;
            const clicked_id = String(clicked_node.getAttribute('id'));
            // 直近で選択した発話IDを保持（DB登録用）
            try { window.lastRemarkedUtteranceId = clicked_id; } catch(err) {}

            // 複数選択・トグル: 修飾キー押下時は加算/解除のトグル、未押下時は置換/解除
            var appendMode = !!(e && (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey));
            var already = isSelectedId(clicked_id);
            var willDeselect = false;
            if (appendMode) {
                if (already) { removeSelectedId(clicked_id); willDeselect = true; }
                else { addSelectedId(clicked_id); }
            } else {
                if (already) { clearSelectedIds(); willDeselect = true; }
                else { clearSelectedIds(); addSelectedId(clicked_id); }
            }
            applySelectionHighlight();
            // 外部化フォームへの反映（.externalization-main or #externalization-main）
            var $extMain = $('#externalization-main');
            if(!$extMain.length){ $extMain = $('.externalization-main').first(); }
            // 選択解除の場合はテキストエリアは変更しない
            if($extMain && $extMain.length && !willDeselect){
                var addText = clicked_node.getAttribute('utterance') || '';
                if(addText){
                    var current = $extMain.val();
                    // 複数選択対応: 修飾キー（Ctrl/Shift/Alt/Cmd）押下なら追記、そうでなければ置換
                    var appendMode = !!(e && (e.ctrlKey || e.shiftKey || e.altKey || e.metaKey));
                    if(appendMode && current){
                        $extMain.val(current + "\n" + addText);
                    } else {
                        $extMain.val(addText);
                    }
                }
            }
            if(clicked_node.getAttribute('network_on') === '0'){
                document.getElementById("rclick").innerHTML="<input type='button' id='utteranceNodebutton' value='この発言を選択'>";
                $(`#utteranceNodebutton`).on("click", () => {
                    defaultForestMRN.addutteranceNode(clicked_node.getAttribute('utterance'));
                    document.getElementById("rclick").innerHTML="";
                    clicked_node.setAttribute('network_on', "1");
                    // ネットワークに追加済みは灰色へ（選択リストからも除外）
                    removeSelectedId(clicked_id);
                    applySelectionHighlight();
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
        // 再描画後に選択中の発話群があればハイライトを復元
        applySelectionHighlight();
    });
}

/*
* XMLファイルのアップロードとデータ取得処理
*/
const getXMLTagInfo = function() {
    try {
        // アップロードされたXMLの文字列を取得
        var raw = $("#meeting_utterance_xml").html();
        if (!raw) {
            console.warn('getXMLTagInfo: no #meeting_utterance_xml content');
            return [];
        }
        // jQueryのXMLパーサーを使用（jQuery 1.8.2 互換）
        var xmlDoc = $.parseXML(raw);
        var $xml = $(xmlDoc);

        var getTaggedInfo = function(utter, tag) {
            var $el = $(utter).find(tag).first();
            return $el.length ? ($el.text() || '').trim() : '';
        };

        // セッション開始・終了時刻（XML直下にあると想定）。見つからなければ空文字。
        var stEl = $xml.find('start_time').first();
        var etEl = $xml.find('end_time').first();
        var sessionStart = stEl.length ? (stEl.text() || '').trim() : '';
        var sessionEnd = etEl.length ? (etEl.text() || '').trim() : '';
        // グローバルに保持し、アップロードPOST時に一緒に送る
        try {
            window.MeetingSessionStartTime = sessionStart;
            window.MeetingSessionEndTime = sessionEnd;
        } catch(e) { /* no-op */ }

        var nodes = $xml.find('messagedata');
        var utter_list = [];
        nodes.each(function(_, u){
            // content が空なら旧仕様の type をフォールバック
            var content = getTaggedInfo(u, 'content') || getTaggedInfo(u, 'type') || '';
            utter_list.push({
                message_id: getTaggedInfo(u, 'id'),
                content: content,
                sender: getTaggedInfo(u, 'sender_id'),
                time: getTaggedInfo(u, 'time'),
                JPNtime: getTaggedInfo(u, 'jpntime')
            });
        });

        return utter_list;
    } catch (error) {
        console.error('Error in getXMLTagInfo: ', error);
        return [];
    }
};
  

// アップロードされたXMLを一旦別の場所においておく
const setUploadedXMLData = function(file_input_btn_id, xml_area_id) {
    // file_input_btn_id は input[type=file] の id
    var $input = $('#' + file_input_btn_id);
    if(!$input.length) return;

    // 既存の jQuery change を解除してからバインド
    try { $input.off('change'); } catch(e) {}
    $input.on('change', function(evt){
        var files = this.files || (evt && evt.target && evt.target.files);
        if(!files || !files.length) return;
        var reader = new FileReader();
        reader.onload = function(){
            var span = document.getElementById('meeting_utterance_xml');
            if(!span){
                span = document.createElement('span');
                span.id = 'meeting_utterance_xml';
            }
            span.innerHTML = reader.result;
            var area = document.getElementById(xml_area_id);
            if(area){
                area.innerHTML = '';
                area.appendChild(span);
            } else {
                $('#' + xml_area_id).html(span.outerHTML);
            }
        };
        reader.readAsText(files[0], 'UTF-8');
    });
}

// ラベルXMLを保持するアップロード関数（span id を分離）
const setUploadedLabelXMLData = function(file_input_btn_id, xml_area_id){
    // 重複ID対策: 属性セレクタで全てにバインド
    var $inputs = $("[id='" + file_input_btn_id + "']");
    if(!$inputs.length){ console.warn('setUploadedLabelXMLData: input not found for id=', file_input_btn_id); return; }
    try { $inputs.off('change'); } catch(e) {}
    $inputs.on('change', function(evt){
        var files = this.files || (evt && evt.target && evt.target.files);
        if(!files || !files.length){ console.warn('label file change: no files'); return; }
        var reader = new FileReader();
        reader.onload = function(){
            var span = document.getElementById('utterance_label_xml');
            if(!span){
                span = document.createElement('span');
                span.id = 'utterance_label_xml';
            }
            span.innerHTML = reader.result;
            var area = document.getElementById(xml_area_id);
            if(area){
                area.innerHTML = '';
                area.appendChild(span);
            } else {
                $('#' + xml_area_id).html(span.outerHTML);
            }
            try{ console.log('label XML loaded, bytes=', (reader.result||'').length); }catch(e){}
        };
        reader.readAsText(files[0], 'UTF-8');
    });
}

// ラベルXML（MessageData: id/sender_id/type）からマッピングを取得
const getLabelXMLMappings = function(){
    try{
        var raw = $('#utterance_label_xml').html();
        if(!raw){ console.warn('getLabelXMLMappings: no #utterance_label_xml content'); return {}; }
        var xmlDoc = $.parseXML(raw);
        var $xml = $(xmlDoc);
        // 大文字・小文字両対応
        var nodes = $xml.find('MessageData, messagedata');
        var map = {};
        if(!nodes || nodes.length === 0){
            console.warn('getLabelXMLMappings: no <MessageData> found. xml head:', (raw||'').substring(0,200));
        }
        nodes.each(function(_, n){
            var $n = $(n);
            var idTxt = ($n.find('id').first().text() || '').trim();
            var senderTxt = ($n.find('sender_id').first().text() || '').trim();
            var typeTxt = ($n.find('type').first().text() || '').trim();
            if(idTxt){
                var key = String(idTxt);
                map[key] = {
                    id: key,
                    sender_id: senderTxt || '',
                    type: typeTxt ? parseInt(typeTxt, 10) : null
                };
            }
        });
        try{ console.log('parsed label mappings count=', Object.keys(map).length); }catch(e){}
        return map;
    }catch(err){
        console.error('getLabelXMLMappings error', err);
        return {};
    }
}

// ラベルの可視化適用（発話リストにCSSバッジを付与）
const applyLabelsToUtteranceList = function(labelMap){
    try{
        if(!labelMap) return;
        // グローバルにも保持して、後からリスト再描画しても適用できるようにする
        try { window.UtteranceTypeMap = labelMap; } catch(e) {}

        // 数値→文字列タイプ
        var labelOf = function(tp){
            switch(tp){
                case 1: return 'SELF';
                case 2: return 'OTHER';
                case 3: return 'ORGANIZETION';
                case 4: return 'UNKNOWN';
                default: return 'UNKNOWN';
            }
        };
        // 色（CSSのtype-XXXXを基本にしつつ、フォールバックとして同色を返す）
        var colorForType = function(tp){
            switch(tp){
                case 1: return '#B3E5FC'; // soft blue
                case 2: return '#C8E6C9'; // soft green
                case 3: return '#FFE0B2'; // soft orange
                case 4: return '#E0E0E0'; // soft gray
                default: return '#E0E0E0';
            }
        };

        Object.keys(labelMap).forEach(function(id){
            var el = document.getElementById(String(id));
            if(!el) return; // まだリストにない場合は無視
            var info = labelMap[id] || {};
            var tp = info.type;
            var badgeId = 'label-badge-' + String(id);
            var badge = document.getElementById(badgeId);
            if(!badge){
                badge = document.createElement('span');
                badge.id = badgeId;
                // CSSクラスで装飾を当てる（色は type-XXX で切替）
                var typeName = labelOf(tp);
                badge.className = 'label-badge type-' + typeName;
                badge.textContent = typeName;
                // フォールバック: もしCSSが適用されない環境でも色が出るように背景色を付与
                try {
                    badge.style.backgroundColor = colorForType(tp);
                    badge.style.color = '#1f2937';
                } catch(_) {}
                // 先頭にバッジを挿入（タイトルの前）
                try{
                    el.insertBefore(badge, el.firstChild);
                }catch(_){ el.appendChild(badge); }
            } else {
                var typeName2 = labelOf(tp);
                // 既存クラスを置き換え
                badge.className = 'label-badge type-' + typeName2;
                badge.textContent = typeName2;
                // フォールバック（上書き）
                try {
                    badge.style.backgroundColor = colorForType(tp);
                    badge.style.color = '#1f2937';
                } catch(_) {}
            }
            // ボーダー色は変更しない（デザインはCSSのバッジに集約）
        });
        try{ console.log('labels applied to list'); }catch(e){}
        // 何件反映できたか詳細
        try{
            var appliedCount = Object.keys(labelMap).filter(function(id){ return document.getElementById(String(id)); }).length;
            console.log('[label] badges actually attached count=', appliedCount);
        }catch(_){ }
    }catch(err){ console.error('applyLabelsToUtteranceList error', err); }
}

// 外部化フォームの登録ボタン押下時の処理
// index.php の onclick="handleExternalizationRegister();" から呼ばれる
window.handleExternalizationRegister = function() {
    try {
        // 複数選択に対応：選択中IDをCSVで送る
        var idsArr = (typeof getSelectedIds === 'function') ? getSelectedIds() : [];
        var remarkedIdsCsv = (idsArr && idsArr.length) ? idsArr.join(',') : '';
        var $extMain = $('#externalization-main');
        if(!$extMain.length){ $extMain = $('.externalization-main').first(); }
        var selectedContents = $extMain.length ? ($extMain.val() || '') : '';
        var stage1 = $('.qa-answer1').first().val() || '';
        var stage2 = $('.qa-answer2').first().val() || '';
        var stage3 = $('.qa-answer3').first().val() || '';
    var knowledgeFragmentContent = $('.qa-answer4').first().val() || '';

        // 簡易バリデーション
        if(!selectedContents){
            if(window.alert){ alert('発言内容（テキストエリア）が空です。'); }
            return;
        }

        $.ajax({
            url: 'php/discussion_map_manager.php',
            type: 'POST',
            dataType: 'json',
            data: {
                purpose: 'save_externalized_content',
                // 後方互換のため単数IDも送るが、サーバ側は remarked_utterance_ids を優先
                remarked_utterance_id: (typeof window.lastRemarkedUtteranceId !== 'undefined' ? window.lastRemarkedUtteranceId : ''),
                remarked_utterance_ids: remarkedIdsCsv,
                selected_contents: selectedContents,
                stage1: stage1,
                stage2: stage2,
                stage3: stage3,
                knowledge_fragment_content: knowledgeFragmentContent
            }
        }).done(function(res){
            if(res && res.status === 'ok'){
                try { console.log('externalized_contents: 保存に成功しました'); } catch(err){}
                if(window.alert){ alert('登録しました。'); }

                // 登録成功時：選択していた発言の枠線を点線に変更
                try {
                    var ids = (typeof getSelectedIds === 'function') ? getSelectedIds() : [];
                    if (ids && ids.length) {
                        ids.forEach(function(id){
                            var el = document.getElementById(String(id));
                            if (el && el.classList && el.classList.contains('utter_node_in_list')) {
                                el.style.borderStyle = 'dashed';
                            }
                        });
                    }
                } catch(ex2) { /* no-op */ }

                // リフレッシュ処理：背景色を元に戻す & テキストエリアを空に戻す
                try { restoreListBackgrounds(); } catch(e1) { /* no-op */ }
                try {
                    var $extMain = $('#externalization-main');
                    if(!$extMain.length){ $extMain = $('.externalization-main').first(); }
                    if($extMain && $extMain.length){ $extMain.val(''); }
                } catch(e2) { /* no-op */ }

                // ステージ入力（stage1～3）＋ 追加入力（qa-answer4）を空にリセット
                try {
                    $('.qa-answer1').val('');
                    $('.qa-answer2').val('');
                    $('.qa-answer3').val('');
                    $('.qa-answer4').val('');
                } catch(e3) { /* no-op */ }
            } else {
                try { console.error('externalized_contents: 保存に失敗しました', res); } catch(err){}
                if(window.alert){ alert('登録に失敗しました。'); }
            }
        }).fail(function(xhr, status, err){
            try { console.error('externalized_contents 保存エラー', status, err, xhr && xhr.responseText); } catch(e){}
            if(window.alert){ alert('通信エラーにより登録に失敗しました。'); }
        });
    } catch(ex) {
        try { console.error('handleExternalizationRegister 実行エラー', ex); } catch(e){}
        if(window.alert){ alert('登録処理でエラーが発生しました。'); }
    }
};

// 知識登録フォーム（連結化タブ右下）のAJAX送信（表示方式: externalization_register と同じ alert のみ）
$(document).on('submit', '#knowledge_register_form', function(e){
    try {
        e.preventDefault();
        try { window.onbeforeunload = null; } catch(ex) {}
        var $form = $(this);
        // 簡易バリデーション（本文必須）
        try {
            var bodyVal = ($form.find('textarea[name="knowledge_content"]').val() || '').trim();
            if(!bodyVal){
                if(window.alert){ alert('内容が空です。本文を入力してください。'); }
                return;
            }
        } catch(_){ /* no-op */ }
    var fd = new FormData(this);
    // 追加用に値を保持（既存処理 + 追加保存処理で使う）
    var areaVal = ($form.find('select[name="knowledge_area"]').val() || '').trim();
    var contentVal = ($form.find('textarea[name="knowledge_content"]').val() || '').trim();
    var commentVal = ($form.find('#kra_comment_input').val() || '').trim();
        $.ajax({
            url: 'register_knowledge.php',
            type: 'POST',
            data: fd,
            dataType: 'json',
            processData: false,
            contentType: false
        }).done(function(res){
            if(res && res.status === 'ok'){
                if(window.alert){ alert('登録しました。'); }
                // 入力リセット（外部化と同等の挙動）
                try {
                    // フォーム初期状態に戻す（selectの既定値も含めて）
                    if ($form.length && $form[0] && typeof $form[0].reset === 'function') {
                        $form[0].reset();
                    } else {
                        $form.find('textarea[name="knowledge_content"]').val('');
                        $form.find('textarea[name="comment"]').val('');
                    }
                } catch(_){ }
                // ツリーへノード追加（knowledge_explorer）
                if(contentVal){
                    addKnowledgeNodeToTree(areaVal, contentVal);
                }

                // 追加要件: knowledge_explorer テーブルへも保存
                // 親IDはセレクト値に応じて固定マッピング
                try {
                    saveToKnowledgeExplorer(areaVal, contentVal, commentVal);
                } catch(ex2){ console && console.warn && console.warn('saveToKnowledgeExplorer error', ex2); }
            } else {
                var msg = (res && res.message) ? res.message : '登録に失敗しました。';
                if(window.alert){ alert(msg); }
            }
        }).fail(function(xhr, status, err){
            var body = (xhr && xhr.responseText) ? xhr.responseText : (err||status||'');
            if(window.alert){ alert('通信エラーにより登録に失敗しました。'); }
            try { console.error('knowledge_register fail', status, err, body); } catch(_){ }
        });
    } catch(ex) {
        if(window.alert){ alert('登録処理でエラーが発生しました。'); }
        try { console.error('knowledge_register exception', ex); } catch(_){ }
    }
});

// --- Knowledge Tree Logic ---
function fetchKnowledgeTree(){
    $.ajax({
        url: 'php/get_knowledge_tree.php',
        dataType: 'json'
    }).done(function(res){
        if(res && res.status==='ok' && Array.isArray(res.nodes)){
            buildKnowledgeTree(res.nodes);
        } else {
            console.error('Tree取得失敗', res);
        }
    }).fail(function(xhr, st, err){
        console.error('Tree通信失敗', st, err, xhr && xhr.responseText);
    });
}

function buildKnowledgeTree(nodes){
    var container = document.getElementById('overlay_knowledge_tree');
    if(!container){ return; }
    container.innerHTML = '';
    // parent_id -> children
    var byParent = {};
    nodes.forEach(function(n){
        var p = (n.parent_id===null ? 'root' : String(n.parent_id));
        if(!byParent[p]){ byParent[p] = []; }
        byParent[p].push(n);
    });
    // トップレベルは parent_id null
    var top = byParent['root'] || [];
    // 指定順序で並び替え
    var order = ['知識関連','研究方略関連','その他'];
    top.sort(function(a,b){ return order.indexOf(a.node_title) - order.indexOf(b.node_title); });
    // 初期表示は3つのトップレベルすべてを表示
    var rootFrag = document.createDocumentFragment();
    top.forEach(function(node){
        rootFrag.appendChild(renderTreeNode(node, byParent));
    });
    container.appendChild(rootFrag);
}

function renderTreeNode(node, byParent){
    var hasChildren = !!byParent[String(node.node_id)] && byParent[String(node.node_id)].length>0;
    var wrapper = document.createElement('div');
    wrapper.className = 'kt-node';
    wrapper.setAttribute('data-node-id', node.node_id);
    if(hasChildren){
        var toggle = document.createElement('span');
        toggle.className = 'kt-toggle';
        toggle.textContent = '+';
        wrapper.appendChild(toggle);
    } else {
        var placeholder = document.createElement('span');
        placeholder.className = 'kt-toggle';
        placeholder.textContent = '·';
        wrapper.appendChild(placeholder);
    }
    var titleSpan = document.createElement('span');
    titleSpan.className = 'kt-title';
    titleSpan.textContent = node.node_title;
    wrapper.appendChild(titleSpan);
    if(hasChildren){
        var childrenBox = document.createElement('div');
        childrenBox.className = 'kt-children';
        childrenBox.style.display = 'none';
        byParent[String(node.node_id)].forEach(function(ch){
            childrenBox.appendChild(renderTreeNode(ch, byParent));
        });
        wrapper.appendChild(childrenBox);
    }
    return wrapper;
}

// トグル展開/折りたたみ
$(document).on('click', '.kt-toggle', function(){
    var $toggle = $(this);
    var $node = $toggle.closest('.kt-node');
    var $children = $node.children('.kt-children');
    if(!$children.length){ return; }
    var isOpen = $children.is(':visible');
    if(isOpen){
        $children.hide();
        $toggle.text('+');
    } else {
        $children.show();
        $toggle.text('-');
    }
});

// ダブルクリックで編集
$(document).on('dblclick', '.kt-title', function(){
    var $span = $(this);
    if($span.hasClass('editing')){ return; }
    var oldText = $span.text();
    $span.addClass('editing');
    var $input = $('<input type="text" class="kt-edit" />').val(oldText);
    $span.empty().append($input);
    $input.focus().select();
    var commit = function(newVal){
        $span.removeClass('editing');
        $span.text(newVal);
    };
    $input.on('keydown', function(e){
        if(e.key==='Enter'){
            var val = ($input.val()||'').trim();
            if(val && val!==oldText){
                var nodeId = parseInt($span.closest('.kt-node').data('node-id'),10);
                saveNodeTitleHistory(nodeId, val);
            }
            commit(val || oldText);
        } else if(e.key==='Escape'){
            commit(oldText);
        }
    });
    $input.on('blur', function(){ commit(oldText); });
});

function saveNodeTitleHistory(nodeId, newTitle){
    $.ajax({
        url: 'php/update_node_title.php',
        type: 'POST',
        dataType: 'json',
        data: { node_id: nodeId, new_title: newTitle }
    }).done(function(res){
        if(res && res.status==='ok'){
            fetchKnowledgeTree(); // 最新状態再取得
        } else {
            console.error('タイトル履歴追加失敗', res);
        }
    }).fail(function(xhr,st,err){
        console.error('タイトル履歴通信失敗', st, err, xhr && xhr.responseText);
    });
}

function addKnowledgeNodeToTree(areaLabel, content){
    if(!content){ return; }
    // areaLabel はトップレベルノードタイトルと一致している前提
    $.ajax({
        url: 'php/insert_knowledge_node.php',
        type: 'POST',
        dataType: 'json',
        data: { parent_label: areaLabel, node_title: content }
    }).done(function(res){
        if(res && res.status==='ok'){
            fetchKnowledgeTree();
        } else {
            console.error('ノード追加失敗', res);
        }
    }).fail(function(xhr,st,err){
        console.error('ノード追加通信失敗', st, err, xhr && xhr.responseText);
    });
}

// knowledge_explorer へ追加保存（ボタン追加要件）
function saveToKnowledgeExplorer(areaLabel, nodeTitle, commentText){
    try {
        if(!nodeTitle){ return; }
        // エリア名 → parent_node_id をマッピング
        var parentIdMap = {
            '知識関連': 111,
            '研究方略関連': 222,
            'その他': 333
        };
        var parentId = parentIdMap[areaLabel] || 333;
        // node_type は今回は未指定 → NULL 相当として送らない or 空文字
        $.ajax({
            url: 'php/save_knowledge_explorer.php',
            type: 'POST',
            dataType: 'json',
            data: {
                parent_node_id: parentId,
                node_title: nodeTitle,
                content: commentText || '',
                node_type: ''
            }
        }).done(function(res){
            if(res && res.status === 'ok'){
                console.log('knowledge_explorer 保存OK', res);
            } else {
                console.error('knowledge_explorer 保存失敗', res);
                if(window.alert){ alert('knowledge_explorer への保存に失敗しました。'); }
            }
        }).fail(function(xhr, st, err){
            console.error('knowledge_explorer 保存通信エラー', st, err, xhr && xhr.responseText);
            if(window.alert){ alert('knowledge_explorer への保存通信エラー'); }
        });
    } catch(ex){
        console && console.error && console.error('saveToKnowledgeExplorer 例外', ex);
    }
}

// 初期ロード
$(function(){
    fetchKnowledgeTree();
});

// 発言をアップロードする関数
const uploadMeetingUtteranceXML = function() {
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
const recordMeetingUtteranceNodes = function(utterances) {
  $.ajax({
    url: "php/discussion_map_manager.php",
    type: "POST",
    data: {
      purpose: "record_meeting_utterance",
            utters: JSON.stringify(utterances),
            session_start_time: (typeof window !== 'undefined' && window.MeetingSessionStartTime) ? window.MeetingSessionStartTime : '',
            session_end_time: (typeof window !== 'undefined' && window.MeetingSessionEndTime) ? window.MeetingSessionEndTime : ''
    }
    }).done(function(r){
        console.log("Request succeeded:", utterances);
        console.log("Server response:", r);
        displayUtteranceNodeInList("utterance_area2", null);
    })
    .fail(function(jqXHR, textStatus, errorThrown){
        console.error("Request failed:", textStatus, errorThrown, jqXHR && jqXHR.responseText);
    });
}

// ロードした際の関数
window.addEventListener('load', function() {
    try{ console.log('[label] init start'); }catch(e){}
    const networkContainerEl = document.getElementById("network_container");
    if (networkContainerEl) networkContainerEl.style.display = "none";
    const el = document.getElementById("mynetwork");
    if (el) {
        defaultForestMRN = new ForestMRN("mynetwork", "load");
    }
    setUploadedXMLData("meetingUtteranceXmlFileUploader", "uploaded_meeting_utterance_xml_concent_display_area");
    // ラベルXMLアップローダ初期化
    setUploadedLabelXMLData('utteranceLabelXmlUploader', 'uploaded_utterance_label_xml_display_area');
    try{
        var $btns = $("[id='utterance_label_xml_upload_button']");
        console.log('[label] found apply buttons count=', $btns.length);
        var $inputs = $("[id='utteranceLabelXmlUploader']");
        console.log('[label] found file inputs count=', $inputs.length);
    }catch(e){}
    $("#discussion_log_xml_file_upload_button").on("click", function() {
        // 共有知モードでは vis の再初期化は行わず、アップロード処理のみ実行
        if (!(typeof window !== 'undefined' && window.SharedModeActive === true)) {
            const target = document.getElementById("mynetwork");
            if (target) {
                // 既存ネットワークのイベントを解除し、DOMをクリア
                if (defaultForestMRN && typeof defaultForestMRN.removeEventLister === 'function') {
                    defaultForestMRN.removeEventLister();
                }
                // 既存の vis インスタンスがあれば安全に破棄
                try {
                    if (defaultForestMRN && defaultForestMRN.ownNetwork && typeof defaultForestMRN.ownNetwork.destroy === 'function') {
                        defaultForestMRN.ownNetwork.destroy();
                    }
                } catch (e) { /* no-op */ }
                target.innerHTML = "";
                // 必要なら再初期化
                defaultForestMRN = new ForestMRN("mynetwork", "load");
            }
        }
        // XMLのアップロード・保存処理は常に実行
        uploadMeetingUtteranceXML();
        // 以降、ボタンのイベント再バインド
        $('#mrnb_addNode').off('click');
        $('#mrnb_removeNode').off('click');
        $('#mrnb_startEditEdge').off('click');
        $('#mrnb_removeEdge').off('click');
        $('#mrnb_ZoomIn').off('click');
        $('#mrnb_ZoomOut').off('click');
        $('#mrnb_addNode').on("click", function(e){
            defaultForestMRN.addNewNode();
        });
        $('#mrnb_removeNode').on("click", function(e){
            defaultForestMRN.deleteNode();
        });
        $('#mrnb_startEditEdge').on("click", function(e){
            defaultForestMRN.SelectEditEdge();
        });
        $('#mrnb_removeEdge').on("click", function(e){
            defaultForestMRN.deleteEdge();
        });
        $('#mrnb_ZoomIn').on("click", function(e){
            defaultForestMRN.zoomIn();
        });
        $('#mrnb_ZoomOut').on("click", function(e){
            defaultForestMRN.zoomOut();
        });
    });
    // ラベルXMLの適用ボタン
    // 重複ID対策: 属性セレクタで全てのボタンにバインド
    $("[id='utterance_label_xml_upload_button']").on('click', function(){
        console.log('label apply clicked');
        if (typeof window.applyLabelsFromCurrentXML === 'function') { return window.applyLabelsFromCurrentXML(); }
        console.warn('applyLabelsFromCurrentXML is not defined');
    });

    // 念のためイベント委譲でもバインド（重複ID/動的差し替え対策）
    try{
        $(document).off('click.labelapply').on('click.labelapply', '#utterance_label_xml_upload_button', function(){
            console.log('label apply clicked (delegated)');
            if (typeof window.applyLabelsFromCurrentXML === 'function') { return window.applyLabelsFromCurrentXML(); }
            $("[id='utterance_label_xml_upload_button']").first().trigger('click');
        });
        $(document).off('change.labelupload').on('change.labelupload', '#utteranceLabelXmlUploader', function(e){
            console.log('label file chosen (delegated)', (this && this.files && this.files.length) ? this.files[0].name : 'none');
        });
    }catch(e){ console && console.warn && console.warn('delegate bind failed', e); }
    displayDiscussionMapData("utterance_area2", null); // 最新の議論内省マップの発話リストを表示
    try{ console.log('[label] init end'); }catch(e){}
    // 内省マップ編集ボタンにイベント付与
    $('#mrnb_addNode').on("click", function(e){
        defaultForestMRN.addNewNode();
    });
    $('#mrnb_removeNode').on("click", function(e){
        defaultForestMRN.deleteNode();
    });
    $('#mrnb_startEditEdge').on("click", function(e){
        defaultForestMRN.SelectEditEdge();
    });
    $('#mrnb_removeEdge').on("click", function(e){
        defaultForestMRN.deleteEdge();
    });
    $('#mrnb_ZoomIn').on("click", function(e){
        defaultForestMRN.zoomIn();
    });
    $('#mrnb_ZoomOut').on("click", function(e){
        defaultForestMRN.zoomOut();
    });

    $("#past_time_select_button").on("click", function(){
        // ファイルアップロードボタンにアップロードイベントを付与
        select_time();
    });
    const accordionHeaders = document.querySelectorAll('#accordion_discussion .accordion-header');
    console.log(accordionHeaders)
    accordionHeaders.forEach(function(header){
      header.addEventListener('click', function () {
        var accordionItem = this.parentElement;
        accordionItem.classList.toggle('active');
      });
    });
});

// グローバル関数: 現在読み込まれているラベルXML(span#utterance_label_xml)から登録＆表示までを一括実行
window.applyLabelsFromCurrentXML = function(){
    try{
        // 1) 解析
        var map = getLabelXMLMappings();
        if(!map || Object.keys(map).length === 0){
            alert('ラベルXMLが読み込まれていないか、内容を解析できませんでした。');
            return false;
        }
        // 2) サーバ保存
        var entries = Object.keys(map).map(function(id){
            return {
                utterance_id: id,
                user_id: map[id] && map[id].sender_id ? map[id].sender_id : '',
                type: map[id] && map[id].type != null ? map[id].type : 4
            };
        });
        console.log('applyLabelsFromCurrentXML: entries count=', entries.length);
        $.ajax({
            url: 'php/save_remarked_utterances.php',
            type: 'POST',
            dataType: 'json',
            data: { entries: JSON.stringify(entries) }
        }).done(function(res){
            console.log('applyLabelsFromCurrentXML: save response:', res);
            if(res && (res.status === 'ok' || res.status === 'partial')){
                applyLabelsToUtteranceList(map);
                try{
                    var appliedCount = Object.keys(map).filter(function(id){ return document.getElementById(String(id)); }).length;
                    if(appliedCount === 0){
                        console.log('[label] no target elements found, reload utterance list then re-apply');
                        displayUtteranceNodeInList('utterance_area2', null);
                        setTimeout(function(){ applyLabelsToUtteranceList(map); }, 300);
                    }
                }catch(_){ }
                if(res.status === 'partial'){
                    console.warn('一部のレコードで保存に失敗しました', res.errors);
                    alert('一部のラベル保存でエラーが発生しました（詳細はコンソールをご確認ください）。');
                }
            } else {
                console.error('ラベル保存失敗', res);
                alert('ラベル保存に失敗しました。');
            }
        }).fail(function(xhr, st, err){
            console.error('ラベル保存通信エラー', st, err, xhr && xhr.responseText);
            alert('ラベル保存の通信でエラーが発生しました。');
        });
    }catch(ex){
        console.error('applyLabelsFromCurrentXML 例外', ex);
        alert('ラベル処理中にエラーが発生しました。');
        return false;
    }
    return true;
};

// 連結化オーバーレイの表示/非表示ヘルパ
function showSharedCombinationOverlay() {
    var $ov = $('#shared_combination_overlay');
    $ov.addClass('is-active').css('display', 'block');
    // 安全のため、このタイミングでもフラグメントをドラッグ可能にしておく
    try { $('#shared_combination_overlay .knowledge_fragment').attr('draggable','true'); } catch (e) {}
}
function hideSharedCombinationOverlay() {
  var $ov = $('#shared_combination_overlay');
  $ov.removeClass('is-active').css('display', 'none');
}

// タブ切替時のオーバーレイ制御（表出化＝#tab04 選択で必ず隠す）
$(document).on('click', '.tabnav a', function () {
  var href = $(this).attr('href') || '';
  // 連結化用のタブ/ボタンに合わせて必要なら条件追加
  if (href === '#tab04' /* 表出化 */ || href === '#tab01' || href === '#tab02' || href === '#tab03') {
    hideSharedCombinationOverlay();
  }
});

// 共有知タブ群の「表出化」「内面化」押下でも常に隠す（フォールバック強化）
$(document).on('click', '#tab-externalization, #tab-internalization', function(){
    hideSharedCombinationOverlay();
    // 念のため直接 display をオフ（他コードの介入対策）
    var $ov = $('#shared_combination_overlay');
    $ov.css('display', 'none').removeClass('is-active');
});

// 初期化時・ページ離脱時の保険
$(function(){ hideSharedCombinationOverlay(); });
window.addEventListener('beforeunload', hideSharedCombinationOverlay);

// 「詳細▼」ボタンのトグル（開：閉じる▲／閉：詳細▼）
// 仕様: アコーディオン（同時に開けるのは1枚）
$(document).on('click', '#shared_combination_overlay .detail-button', function(e){
    var $btn = $(this);
    var $card = $btn.closest('.knowledge_fragment');
    if (!$card.length) return;

    var $list = $card.closest('.knowledge-fragment-list');
    if ($list && $list.length) {
        // まず他のカードをすべて閉じる
        var $others = $list.find('.knowledge_fragment.is-open').not($card);
        $others.removeClass('is-open')
               .find('.card-detail').attr('aria-hidden', 'true');
        $others.find('.detail-button').text('詳細▼');
    }

    // 自カードをトグル
    $card.toggleClass('is-open');
    var opened = $card.hasClass('is-open');
    $btn.text(opened ? '閉じる▲' : '詳細▼');
    $card.find('.card-detail').attr('aria-hidden', opened ? 'false' : 'true');
});

// --- 知識思考エリア: フラグメントからノード生成（クリック or DnD） ---
(function(){
    // フラグメントカードをクリックでピンクカード（簡易ノード）を生成（thinking_area 内のカードは増殖防止のため除外）
    $(document).on('click', '#shared_combination_overlay .knowledge_fragment', function(e){
        // 操作系（詳細ボタン/詳細領域/フォーム類）でのクリックは無視してカード本体のみ反応
        if ($(e.target).closest('.detail-button, .card-actions, .card-detail, a, button, input, textarea, select, label').length) return;
        // 既に思考エリア内にある複製カード（wrapper配下）は再複製しない
        if ($(this).closest('#knowledge_thinking_area').length) return;
        var $card = $(this);
        createThinkingNodeFromCard($card, null, null);
    });

    // ドラッグ&ドロップ: フラグメントカードをドラッグ可能に
    function markFragmentsDraggable(){
        $('#shared_combination_overlay .knowledge_fragment').attr('draggable', 'true');
    }
    document.addEventListener('DOMContentLoaded', markFragmentsDraggable);
    // 念のためオーバーレイが表示されるたびに付与（タブ切替時など）
    window.addEventListener('focus', markFragmentsDraggable);

    // ドラッグ開始: 転送データにインデックスを埋める（なければ本文テキスト）
    $(document).on('dragstart', '#shared_combination_overlay .knowledge_fragment', function(ev){
        try{
            var dt = ev.originalEvent.dataTransfer;
            dt.setData('text/plain', $(this).find('.card-body').text().trim());
        }catch(err){}
    });

    // ドロップ受け側: 思考エリア
    var $area = $('#knowledge_thinking_area');
    $(document).on('dragover', '#knowledge_thinking_area', function(ev){ ev.preventDefault(); });
    $(document).on('drop', '#knowledge_thinking_area', function(ev){
        ev.preventDefault();
        var oe = ev.originalEvent;
        var txt = '';
        try{ txt = oe.dataTransfer.getData('text/plain') || ''; }catch(err){}
        var $src = $(oe.target).closest('.knowledge_fragment');
        if ($src.length === 0) {
            // dataTransfer から生成（最小情報）
            var $tmp = $('<div class="knowledge_fragment"></div>');
            $tmp.append($('<div class="card-title"></div>').text('フラグメント'));
            $tmp.append($('<div class="card-body"></div>').text(txt));
            $src = $tmp;
        }
        // エリア座標に変換
        var rect = this.getBoundingClientRect();
        var x = (oe.clientX - rect.left) + this.scrollLeft;
        var y = (oe.clientY - rect.top) + this.scrollTop;
        createThinkingNodeFromCard($src, x, y);
    });

    // ノード作成ヘルパ
    function createThinkingNodeFromCard($card, x, y){
        var $area = $('#knowledge_thinking_area');
        if ($area.length === 0 || $card.length === 0) return;
        // ユーザー名と本文だけをシンプルなピンクカードとして生成
        var title = ($card.find('.card-title').text() || '').trim();
        var body = ($card.find('.card-body').text() || '').trim();
        var $node = $('<div class="thinking-node"></div>');
        // フォールバックのための最小インラインスタイル（CSS未適用時でもピンクカードにする）
        try {
            $node.css({
                background: '#ffe6e6',
                border: '1px solid #ccc',
                borderRadius: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
                padding: '12px',
                minWidth: '200px',
                maxWidth: '260px',
                boxSizing: 'border-box'
            });
        } catch (e) {}
        $node.append($('<div class="node-title"></div>').text(title));
        $node.append($('<div class="node-body"></div>').text(body));
        var $wrapper = $('<div class="thinking-node-wrapper"></div>');
        $wrapper.append($node);
        $area.append($wrapper);
        // 位置: 初期はタイトル(overlay-title)直下、D&D時は渡された座標を優先
        var titleOffset = 0;
        var $title = $area.children('.overlay-title').first();
        if ($title.length) {
            try { titleOffset = $title.outerHeight(true) + 6; } catch(e) { titleOffset = 24; }
        } else {
            titleOffset = 24;
        }
        var ax = 12, ay = titleOffset;
        if (typeof x === 'number' && typeof y === 'number') { ax = x; ay = y; }
        $wrapper.css({ left: ax + 'px', top: ay + 'px' });
        enableNodeDrag($wrapper, $area);
    }

    // ノードドラッグ移動（思考エリア内に拘束）
    function enableNodeDrag($node, $container){
        var dragging = false, sx=0, sy=0, startL=0, startT=0;
        $node.on('mousedown', function(e){
            dragging = true;
            sx = e.clientX; sy = e.clientY;
            var off = $node.position();
            startL = off.left; startT = off.top;
            e.preventDefault();
        });
        $(document).on('mousemove.thinking', function(e){
            if(!dragging) return;
            var dx = e.clientX - sx, dy = e.clientY - sy;
            var nl = startL + dx, nt = startT + dy;
            // コンテナ境界内に収める
            var cw = $container.innerWidth(), ch = $container.innerHeight();
            var nw = $node.outerWidth(), nh = $node.outerHeight();
            nl = Math.max(0, Math.min(nl, cw - nw));
            nt = Math.max(0, Math.min(nt, ch - nh));
            $node.css({ left: nl + 'px', top: nt + 'px' });
        });
        $(document).on('mouseup.thinking', function(){ dragging = false; });
    }
})();
