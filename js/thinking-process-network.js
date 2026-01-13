// 議論内省マップに関する処理プログラム
let defaultThinkingProcess;
let defaultRecordThinkingProcess;
let defaultShowThinkingProcess;

class ThinkingProcess { // forestMRN: forest Meeting Reflection Network
    constructor(container, load) {
        // this.ownNetwork = this.generateThinkingProcessNetworkCanvas(container, {}, {}); // デフォルトのマップを表示

        defaultRecordThinkingProcess = new RecordThinkingProcess();
        this.nodes = new vis.DataSet();
        this.edges = new vis.DataSet();
        this.options = {
	        physics: false,
            nodes: {
                margin: 10,
                widthConstraint: {
                    maximum: 150
                },
            },
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
        // this.ConnectNetworkNodeId = [];
        // this.ConnectMindMapNodeId = [];
        // this.RecruitNodeId = [];//採用or棄却されたノードID
        // this.Recruit = [];//採用or棄却
        // this.Feedback = [];//フィードバック書いたかどうか
        // this.FeedbackNodeId = null; //フィードバック書かれるノードID
        this.selectId = null;//選択されたノードID
        // this.interval = null; //インターバル抜けるための変数
        this.material_id = null;
        this.concept_id = null;
        this.scale = 1;
        this.BoxDisplay = {
            x: 0,
            y: 0
        }//右クリックされやメニューの表示場所
        this.ownNetwork = this.generateThinkingProcessNetworkCanvas(container, this.nodes, this.edges); // デフォルトのマップを表示
        this.choose_input_xmlLoad();
        if(load == "load"){
            this.jmindex = [];
            this.addEventLister();
            // $(`#jsmind_container`).on('click',this.connect_mindmap.bind(this));
            // $(`#process_conmenu1`).on('click',this.openLessonAreaOpen.bind(this));
            // $(`#process_conmenu2`).on('click',this.connect_network.bind(this));
            // $(`#process_conmenu3`).on('click',this.Recruit_Idea.bind(this));
            $(`#process_conmenu4`).on('click',this.ContentmenuCancel.bind(this));
            // $(`#p_ontology_select`).on('click',this.addontology.bind(this));
            // $(`#p_recruit_select`).on('click',this.Selected_Recruit_Idea.bind(this));
            this.ownNetwork.on('click', this.networkClick.bind(this));
            this.ownNetwork.on('dragStart', this.dragstart.bind(this));
            this.ownNetwork.on('dragEnd', this.dragend.bind(this));
            this.ownNetwork.on('doubleClick', this.doubleclick.bind(this));
            this.ownNetwork.on("oncontext", this.onContext.bind(this));
            this.ownNetwork.on('select', this.selectdelete.bind(this));
        }
        this.choose_input_xmlLoad();
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
        // const selectElement = document.getElementById("selectionlist");
        // while (selectElement.options.length > 0) {
        //     selectElement.remove(0);
        // }
        // this.output_list.map((n) => {
        //     const optionElement = document.createElement('option');
        //     optionElement.value = n;
        //     optionElement.text = n;
        //     selectElement.appendChild(optionElement);
        // })
    }

    // //オントロジーノードを選択不可に
    selectdelete(params) {
        if (this.nodes.get(params.nodes[0]).shape == "ellipse") {
            // 選択を解除
            this.ownNetwork.setSelection({ nodes: [] });
        }
    }

    addEventLister(){
        this.bindopenLessonAreaOpen = this.openLessonAreaOpen.bind(this);
        // this.bindshow_select = this.show_select.bind(this);
        // this.bindconnect_network = this.connect_network.bind(this);
        // this.bindRecruit_Idea = this.Recruit_Idea.bind(this);
        this.bindContentmenuCancel = this.ContentmenuCancel.bind(this);
        // this.bindaddontology = this.addontology.bind(this);
        // this.bindSelected_Recruit_Idea = this.Selected_Recruit_Idea.bind(this);
        // this.bindfeedback = this.feedback.bind(this);
        // this.bindNodeblinking = this.Nodeblinking.bind(this);
        // $(`#jsmind_container`).on('click',this.bindconnect_mindmap);
        $(`#process_conmenu1`).on('click',this.bindopenLessonAreaOpen);
        // $(`#process_conmenu2`).on('click',this.bindconnect_network);
        // $(`#process_conmenu3`).on('click',this.bindRecruit_Idea);
        $(`#process_conmenu4`).on('click',this.bindContentmenuCancel);
        // $(`#p_ontology_select`).on('click',this.bindaddontology);
        // $(`#p_recruit_select`).on('click',this.bindSelected_Recruit_Idea);
        // $(`#feedbackrecord`).on('click',this.bindfeedback);
        // this.interval = setInterval(this.bindNodeblinking, 1000);
    }

    removeEventLister(){
        // $(`#jsmind_container`).off('click',this.bindconnect_mindmap);
        $(`#process_conmenu1`).off('click',this.bindopenLessonAreaOpen);
        // $(`#process_conmenu2`).off('click',this.bindconnect_network);
        // $(`#process_conmenu3`).off('click',this.bindRecruit_Idea);
        $(`#process_conmenu4`).off('click',this.bindContentmenuCancel);
        // $(`#p_ontology_select`).off('click',this.bindaddontology);
        // $(`#p_recruit_select`).off('click',this.bindSelected_Recruit_Idea);
        // $(`#feedbackrecord`).off('click',this.bindfeedback);
        // clearInterval(this.interval);
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
        document.getElementById("process_startEditEdge").value="エッジ追加終了";
        this.nodes.update(this.nodes.map(n => {
            return { ...n, fixed: true };
        }));     
    }

    //エッジ編集できない場合の処理
    disableEditEdge() {
        document.getElementById("process_startEditEdge").value="エッジ追加";
        // エッジの編集モードを抜けたときは，ノードの動きを再度始める（ただし，タグノードはFixedにしておく）
        this.edgeEditMode = false;
        this.nodes.update(this.nodes.map(n => {
            return n.type !== "topic-tag" ? { ...n, fixed: false } : { ...n, fixed: true };
        }))
    }

    /*
     * 議論内省マップの表示・操作部分（Extend vis.js）
     */
    generateThinkingProcessNetworkCanvas (canvas_dom_id, nodes, edges) {
        // マップを表示

        this.setNodes(nodes);
        this.setEdges(edges);

        return new vis.Network(
            document.getElementById(canvas_dom_id),
            {
                nodes: nodes,
                edges: edges,
            },
            this.options
        );

        // this.setCanvasOptions(load);
        // return network;
    }

    /*
     * ノードの操作
     */
    //ノード追加(完了)
    addNode(node_id, node_label, node_type, node_x, node_y) {
        let node_color = '#f8e58c'; // ノードの背景色
        let node_shape = 'box';     // ノードの形状
        let text_color = 'black';   // ノード内文字列の色
        let position_fixed = false;   // ノードを動かせるかどうか（Falseなら動かせる）

        let result_label = '';
        for (let i = 0; i < node_label.length; i += 10) {
            result_label += node_label.substr(i, 10) + '\n';
        }
        result_label = result_label.trim(); // 末尾の不要な改行を除去
        const newNode = {
            id: node_id,
            label: result_label,
            group: node_type,
            color: node_color, shape: node_shape,
            font: { color: text_color },
            fixed: position_fixed,
            x: node_x, y: node_y, 
        };
        this.nodes.add(newNode);
        const boundingBox = this.ownNetwork.getBoundingBox(node_id);
        node_y += Math.floor(((boundingBox.bottom)-(boundingBox.top))/2);
        this.nodes.update({
            id : node_id,
            color: node_color,
            shape: node_shape,
            font: { color: text_color },
            y : node_y
        });
        const boundingBoxupdate = this.ownNetwork.getBoundingBox(node_id);
        this.latest_selected_node_info.x = node_x;
        this.latest_selected_node_info.y = boundingBoxupdate.bottom+10;
        defaultRecordThinkingProcess.record_Node(node_id, node_label, node_type, node_x, node_y);
        return this.nodes;
    }

    addReloadNode(node_id, node_label, node_type, node_x, node_y) {
        const existingNode = this.nodes.get(node_id);
        if (existingNode) {
            console.log(`Node with ID ${node_id} already exists. Skipping addition.`);
            return; // 重複がある場合は追加せずにリターン
        }
        let node_color = '#ffdb4f'; // ノードの背景色
        let node_shape = 'box';     // ノードの形状
        let text_color = 'black';   // ノード内文字列の色
        let position_fixed = false;   // ノードを動かせるかどうか（Falseなら動かせる）
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
        defaultThinkingProcess.nodes.add(newNode);
        const boundingBox = defaultThinkingProcess.ownNetwork.getBoundingBox(`${node_id}`);
        defaultThinkingProcess.latest_selected_node_info.x = node_x;
        defaultThinkingProcess.latest_selected_node_info.y = boundingBox.bottom+10;
        return defaultThinkingProcess.nodes;
    }

    addVersionNode(node_id, node_l, node_type, appeared_at, node_x, node_y){
        const existingNode = defaultThinkingProcess.nodes.get(node_id);
        if (existingNode) {
            console.log(`Node with ID ${node_id} already exists. Skipping addition.`);
            return; // 重複がある場合は追加せずにリターン
        }
        let node_color = '#ffbaa1'; // ノードの背景色
        let node_shape = 'box';     // ノードの形状
        let text_color = 'black';   // ノード内文字列の色
        var y_fixed = true;
        let node_label;
        
        if(node_l == '<select name="change_labels" id="select_labels"><optgroup label="ラベル付与"><option value="node_labels">ラベル選択</option>          <option value="primary_label">主軸</option></optgroup><optgroup label="----L主軸"><option value="pl_1">---L有用性</option><option value="pl_2">---L新規性</option> <option value="pl_3">---L信頼性</option><option value="pl_0">---Lその他</option>                   </optgroup>              <option value="issue_label">課題</option> <optgroup label="----L未検討"> <option value="il_non_1">---L語の妥当性</option><option value="il_non_2">---L証拠の十分性</option><option value="il_non_3">---L論理の整合性</option><option value="il_non_0">---Lその他</option></optgroup><optgroup label="----L再検討"> <option value="il_re_1">---L語の妥当性</option><option value="il_re_2">---L証拠の十分性</option><option value="il_re_3">---L論理の整合性</option><option value="il_re_0">---Lその他</option></optgroup><option value="cl_0">整合性</option></select>'){
            node_label = "【ラベル選択】";
        }else{
            node_label = node_l
        }

        if(node_type == "versionsBro"){
            node_color = '#ffd7c9'; // ノードの背景色
            y_fixed = false;
        }

        const newNode = {
            id: `${node_id}`,
            label: node_label,
            group: node_type,
            color: node_color,
            shape: node_shape,
            font: { color: text_color },
            fixed: {y: y_fixed },
            x: node_x, y: node_y, 
        };
        // console.log(newNode);
        
        defaultThinkingProcess.nodes.add(newNode);
        return defaultThinkingProcess.nodes;
    }

    addVersionEdge(from_node_id, to_node_id){
        // let node_color = 'orange'; // ノードの背景色
        // let node_shape = 'box';     // ノードの形状
        // let text_color = 'black';   // ノード内文字列の色
        const newEdge = {
            from: from_node_id,
            to: to_node_id,
            group: "versionEdges",
            fixed: true,
        };
        defaultThinkingProcess.edges.add(newEdge);
        return defaultThinkingProcess.edges;

    }

    addTriggerNode(flag, trigger_id, edge_id, from_node, to_node, activity_id, t_label, t_type, t_time, node_x, node_y){
        let color = '#82ae46'; // ノードの背景色
        let node_shape = 'circularImage';     // ノードの形状
        var DIR_img = "../image/triggers/"; //ノードのアイコンとなる画像のパス
        let image = "thinking.png"; 
        const t_title = document.createElement("div");  // titleのHTML

        if(!activity_id){
            color = '#60bfa3'; // ノードの背景色
        }

        t_title.innerHTML = "<div id='" + trigger_id + "' class='trigger_title' timestamp='" + t_time + "'><b>"+t_type+"</b></br>" + t_label + " </div>";
        if(!node_x){
            node_x = (defaultThinkingProcess.nodes.get(from_node).x + defaultThinkingProcess.nodes.get(to_node).x ) /2; //ノードがversionの間に来るように
        }
        if(!node_y){
            node_y = Math.floor(Math.random()*200)-100;
        }

        //triggerとなった活動ごとにアイコンを変更
        switch(t_type) {
            case "自己内対話": //自己内対話
                break;
            case "議論資料作成": //議論資料作成
                image = "writing.png";
                break;
            case "議論内省": //議論内省
                image = "meeting.png";
                break;
            case "論文読解": //論文読解
                image = "reading.png";
                break;
            case "論文執筆": //論文執筆
                image = "writing-scholar.png";
                break;
            default: // その他
                break;
        }

        // trigger_fromの設定
        if(defaultThinkingProcess.edges.get(edge_id).group == "trigger_from"){
            // エッジの先がtrigger_nodeならその先のversion_nodeに繋ぐ
            //　trigge自身を指す新しいエッジを追加
            const newEdge = {
                from: from_node,
                to: trigger_id,
                arrows: 'dynamic',
                color: color,
                group: "trigger_from",
                smooth: true,
                fixed: true,
            };
            defaultThinkingProcess.edges.add(newEdge);

        }else{
            // 既存のversionEdgeをtrigger自身を指すようにエッジを繋ぎかえ
            const update_edge = defaultThinkingProcess.edges.get(edge_id);
            update_edge.arrows = 'dynamic';
            update_edge.color = color;
            update_edge.to = trigger_id;
            update_edge.group = "trigger_from";
            update_edge.smooth = true;
            defaultThinkingProcess.edges.update(update_edge);
        }

        //　trigger_toの設定
        const newEdge = {
            from: trigger_id,
            to: to_node,
            arrows: 'dynamic',
            color: color,
            group: "trigger_to",
            smooth: true,
            fixed: true,
        };
        defaultThinkingProcess.edges.add(newEdge);

        //triggerとなるノードを追加（既に存在するIDは追加せず更新する）
        const newNode = {
            id: trigger_id,
            label: t_time,
            title: t_title,
            group: "trigger",
            type: t_type,
            color: color,
            shape: node_shape,
            image: DIR_img + image,
            imagePadding: 7,
            fixed: false,
            x: node_x, y: node_y,
        };

        const existingNode = defaultThinkingProcess.nodes.get(trigger_id);
        if (existingNode) {
            // merge new properties into existing node
            defaultThinkingProcess.nodes.update(Object.assign({id: trigger_id}, newNode));
        } else {
            defaultThinkingProcess.nodes.add(newNode);
        }

        if(flag == "New"){
            defaultRecordThinkingProcess.record_trigger(trigger_id, activity_id, from_node, to_node, t_time, t_type, t_label, node_x, node_y);
        }

        return defaultThinkingProcess.edges, defaultThinkingProcess.nodes;
    }

    addReloadEdge(edge_id, edge_start, edge_end, edge_label) {
        this.edges.add({id: edge_id, from: edge_start, to: edge_end ,label: edge_label});
    }

    //未完成　ノード追加
    addNewNode() {
        this.addNode(this.generateUniqueNumberText(), "newNode", "process", this.latest_selected_node_info.x, this.latest_selected_node_info.y);
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
            defaultRecordThinkingProcess.update_Node("label", node_id, node_content, "");
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
            console.log(defaultThinkingProcess.nodes.get(selectNodeId));
            const node_group = defaultThinkingProcess.nodes.get(selectNodeId).group;
            console.log(node_group);
            if(node_group == "trigger"){
                defaultRecordThinkingProcess.delete_trigger_Node(selectNodeId);
            }else{
                defaultRecordThinkingProcess.delete_db_Node(selectNodeId);
            }
            defaultRecordThinkingProcess.delete_db_Edge(null, selectNodeId, "");
            defaultRecordThinkingProcess.delete_db_Edge(null, "", selectNodeId);

            this.edges.remove(this.ownNetwork.getConnectedEdges(selectNodeId));
            this.nodes.remove({id: selectNodeId});
            // const ontology_index = this.OntologyConnectNodeId.indexOf(selectNodeId);
            // if(ontology_index !== -1){
            //     this.nodes.remove({ id: this.OntologyNodeId[ontology_index]});
            //     defaultRecordThinkingProcess.delete_db_Node(this.OntologyNodeId[ontology_index]);
            //     this.OntologyNodeId.splice(ontology_index, 1);
            //     this.OntologyConnectNodeId.splice(ontology_index, 1);
            // }
            // const connect_net_index = [];
            // this.ConnectNetworkNodeId.map((n_id, index) => {
            //     if(n_id === selectNodeId){
            //         connect_net_index.push(index);
            //     }
            // });
            // connect_net_index.sort((a, b) => b - a);
            // connect_net_index.forEach(index => {
            //     this.ConnectNetworkNodeId.splice(index, 1);
            //     this.ConnectMindMapNodeId.splice(index, 1);
            // });
            // defaultRecordThinkingProcess.delete_connection(selectNodeId);
        }
    }

    // 右クリック時
    onContext(params) {
        this.nodeConnectEnabled = false;
        if (params.nodes.length == 1) {
            $('#jsmind_container').css('height','50%');
            const NetworkMenu = document.getElementById('t_Process_conmenu');
            this.selectId = params.nodes[0];
            const pointerX = params.pointer.DOM.x;
            const pointerY = params.pointer.DOM.y;
            const mynetPosition = document.getElementById("myProcessnetwork2").getBoundingClientRect();
            this.BoxDisplay.x = pointerX + mynetPosition.left + 20;
            this.BoxDisplay.y = pointerY + mynetPosition.top + 20;
            NetworkMenu.style.left = this.BoxDisplay.x;
            NetworkMenu.style.top = this.BoxDisplay.y;
            NetworkMenu.style.display = "block";//ここようわからん未完成かも
            if(this.OntologyConnectNodeId && this.OntologyConnectNodeId.indexOf(this.selectId) !== -1){
                document.getElementById("process_conmenu3").style.display = "block";
            }
        }
    }

    //ラベルの選択（完了）
    show_select (){
        document.getElementById('t_Process_conmenu').style.display = "none";
        if(this.OntologyConnectNodeId && this.OntologyConnectNodeId.indexOf(this.selectId) !== -1){
            alert('このノードにはすでに概念がつけられているため概念付けできません');
            return;
        }
        const labelselect = document.getElementById("labelselect");
        labelselect.style.display = "block";
        labelselect.style.left = this.BoxDisplay.x;
        labelselect.style.top = this.BoxDisplay.y;
    }

    openLessonAreaOpen(){
        // 1. trigger_displayを非表示
        const trigger = document.getElementById('trigger_display');
        if (trigger) trigger.style.display = 'none';
    
        // 2. lesson_displayを表示
        const lesson = document.getElementById('lesson_display');
        if (lesson) lesson.style.display = 'block';
    
        // 3. area_lesson_addにテキスト入力ボックスを3つ作成
        const area = document.getElementById('area_lesson_add');
        if (area) {
            area.innerHTML = '';

            // タイトル追加
            const title = document.createElement('h3');
            title.textContent = '経験知の要約';
            const textarea = document.createElement('textarea');
            textarea.className = 'lessonTextArea';
            textarea.name = 'knowledge_fragment_title';
            textarea.placeholder = 'どんなことを学んだかの要約を入力してください';
    
            // 1つ目
            const label1 = document.createElement('label');
            label1.textContent = 'Q.なぜこの経験が印象に残りましたか？';
            const input1 = document.createElement('textarea');
            input1.className = 'lessonTextArea';
            input1.name = 'stage1';
            input1.rows = 3;
            input1.placeholder = 'ここに入力してください';
    
            // 2つ目
            const label2 = document.createElement('label');
            label2.textContent = 'Q.この経験にはどんな前提や背景がありますか？';
            const input2 = document.createElement('textarea');
            input2.className = 'lessonTextArea';
            input2.name = 'stage2';
            input2.rows = 3;
            input2.placeholder = 'ここに入力してください';
    
            // 3つ目
            const label3 = document.createElement('label');
            label3.textContent = 'Q.この経験には，他の場面でも使える考え方の指針はありますか？';
            const input3 = document.createElement('textarea');
            input3.className = 'lessonTextArea';
            input3.name = 'stage3';
            input3.rows = 3;
            input3.placeholder = 'ここに入力してください';
    
            // 各ラベルとテキストエリアを追加
            area.insertBefore(title, area.firstChild);
            area.appendChild(textarea);

            area.appendChild(label1);
            area.appendChild(document.createElement('br'));
            area.appendChild(input1);
            area.appendChild(document.createElement('br'));
    
            area.appendChild(label2);
            area.appendChild(document.createElement('br'));
            area.appendChild(input2);
            area.appendChild(document.createElement('br'));
    
            area.appendChild(label3);
            area.appendChild(document.createElement('br'));
            area.appendChild(input3);
        }
    }

    selectShareOrganization (){// 右クリックメニューを非表示
        document.getElementById('t_Process_conmenu').style.display = "none";
        const selected_node_id = defaultThinkingProcess.ownNetwork.getSelection().nodes[0];
        const selected_node_group = defaultThinkingProcess.nodes.get(selected_node_id).group;

        // group_selectから動的に組織リストを取得
        const groupSelect = document.getElementById('group_select');
        const options = groupSelect.options;
        
        // 組織リストを動的に作成
        let organizationList = "共有する組織を選択してください:\n\n";
        let organizationMap = {}; // 番号と組織の対応付け
        
        let optionIndex = 1;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value !== "") { // 空のoption要素は除外
                organizationList += optionIndex + ". " + options[i].text + "\n";
                organizationMap[optionIndex.toString()] = {
                    value: options[i].value,
                    text: options[i].text
                };
                optionIndex++;
            }
        }
        
        organizationList += "\n組織番号を入力 (1-" + (optionIndex - 1) + "):";
        
        const selectedNumber = prompt(organizationList, "1");
        
        if (selectedNumber !== null && selectedNumber.trim() !== "") {
            if (organizationMap[selectedNumber]) {
                const selectedOrg = organizationMap[selectedNumber];
                console.log("選択された組織: " + selectedOrg.text + " (ID: " + selectedOrg.value + ")");

                this.shareKnowledgeFragmentToOrganization(selectedOrg.value, selected_node_id);

                alert("組織 " + selectedOrg.text + " へ共有しました。");
            } else {
                alert("無効な番号です。もう一度やり直してください。");
            }
        } else if (selectedNumber === null) {
            // キャンセルされた場合
            console.log("組織選択がキャンセルされました");
        } else {
            alert("組織を選択してください。");
        }
    }

    shareKnowledgeFragmentToOrganization(organizationId, nodeId) {
        // バリデーション
        if (!organizationId || !nodeId) {
            alert('共有する組織またはノードが選択されていません。');
            return;
        }

        console.log('Sharing process node ID:', nodeId, 'to organization ID:', organizationId);

        // $.ajax({
        //     url: "../php/organizational_edit_map_maneger.php",
        //     type: "POST",
        //     data: {
        //         purpose: "share",
        //         group_id: organizationId,
        //         process_node_id: nodeId
        //     },
        //     success: function(response) {
        //         console.log('共有処理が成功しました:', response);
        //     },
        //     error: function(xhr, status, err) {
        //         console.error('shareKnowledgeFragmentToOrganization error:', status, err, xhr.responseText);
        //     }
        // });

        // 学び(lesson)のテキストエリアを収集してサーバへ保存
        try {
            const lessonAreas = document.getElementsByClassName('lessonTextArea');
            const contents = [];
            for (let i = 0; i < lessonAreas.length; i++) {
                const name = lessonAreas[i].name || ('text' + i);
                const value = lessonAreas[i].value || '';
                contents.push({ type: name, content: value });
            }

            // タイトルは別に取り出す（最初のタイトル要素をnameで判別）
            const titleEl = document.querySelector('textarea.lessonTextArea[name="knowledge_fragment_title"]');
            const knowledge_fragment_title = titleEl ? titleEl.value : '';

            // contents からタイトル要素は除外して送信する
            const filteredContents = [];
            for (let i = 0; i < lessonAreas.length; i++) {
                const name = lessonAreas[i].name || ('text' + i);
                if (name === 'knowledge_fragment_title') continue;
                const value = lessonAreas[i].value || '';
                filteredContents.push({ type: name, content: value });
            }

            // ノード種類に関係なく共有：thought_experience_node_id に常に nodeId を送る。
            const node = defaultThinkingProcess.nodes.get(nodeId) || {};
            const nodeGroup = node.group || '';
            const postData = {
                purpose: "share_fragment",
                thought_experience_node_id: nodeId,
                contents: JSON.stringify(filteredContents),
                knowledge_fragment_title: knowledge_fragment_title
            };
            if(nodeGroup === 'process'){
                postData.process_node_id = nodeId; // 互換性のため process_node_id も送る
            }

            // 送信
            $.ajax({
                url: "../php/thinking_edit_processmap_maneger.php",
                type: "POST",
                data: postData,
                success: function(resp) {
                    console.log('externalised_contents 保存成功:', resp);
                },
                error: function(xhr, status, err) {
                    console.error('save fragment error:', status, err, xhr.responseText);
                }
            });
        } catch (e) {
            console.error('lesson 保存処理で例外が発生しました:', e);
        }
    }

    ContentmenuCancel(){
        document.getElementById('t_Process_conmenu').style.display = "none";
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
                    jmnode[n].style.backgroundColor = "#ffffff";
                }else{
                    jmnode[n].style.backgroundColor = "#87cefa";
                }
            })
            this.jmindex.length = 0;
        }
        // if(this.RecruitNodeId.indexOf(params.nodes[0]) !== -1){
        //     this.FeedbackNodeId = params.nodes[0];
        //     document.getElementById(this.FeedbackNodeId).style.display = "block";
        // }
        // if(params.nodes.length == 1){
        //     const net_index = this.ConnectNetworkNodeId.map((n_id, index) => {
        //         return n_id === params.nodes[0] ? index : null;
        //     }).filter(n => n !== null);
        //     if(net_index == ""){
        //         return;
        //     }
        //     const jmnode = document.getElementsByTagName("jmnode");
        //     net_index.map((m_id) => {
        //         for(var i = 0; i < jmnode.length; i++){
        //             if(jmnode[i].getAttribute("nodeid") == this.ConnectMindMapNodeId[m_id]){
        //                 //ここいろかえる必要あるかも
        //                 jmnode[i].style.backgroundColor = "white";
        //                 this.jmindex.push(i);
        //                 break;
        //             }
        //         }
        //     });
        // }
    }

    addNewEdge(E_start, E_end){
        let edge_id = this.generateUniqueNumberText();
        this.edges.add({ id: edge_id ,from: E_start, to: E_end });
        defaultRecordThinkingProcess.record_Edge(edge_id, E_start, E_end);
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
                let edge_id = this.generateUniqueNumberText();
                this.edges.add({id: edge_id, from: this.dragStartNodeId, to: this.dragEndNodeId });
                defaultRecordThinkingProcess.record_Edge(edge_id, this.dragStartNodeId, this.dragEndNodeId);
            }
            this.dragStartNodeId = null;
            this.dragEndNodeId = null;
        }else{
            const movedNodeId = params.nodes[0];
            if (movedNodeId !== undefined) {
                //なぜか更新したら色変わってしまうから一時的に
                let node_color = this.nodes.get(movedNodeId).color;
                // let border_color = '#ffdb4f'; 
                // switch(this.nodes.get(movedNodeId).group) {
                //     case "process": // 自分で考えた要約に関するノードの場合
                //         node_color = '#ffdb4f';
                //         break;
                //     case "versions": // 議論内での発言ノードの場合
                //         node_color = '#ffbaa1';
                //         break;
                //     case "topic-tag": // 議論内省マップのノードがどんなトピックに対応しているかを表すタグノードの場合
                //         node_color = '#ffdb4f';
                //         break;
                //     default: // その他
                //         break;
                // }
                this.nodes.update({ id: movedNodeId, color: node_color, x: params.pointer.x, y: params.pointer.y });
                const nodeBoundingBox = this.ownNetwork.getBoundingBox(movedNodeId);
                //次に追加したノードの座標指定
                this.latest_selected_node_info.x = (nodeBoundingBox.right + nodeBoundingBox.left)/2;
                this.latest_selected_node_info.y = nodeBoundingBox.bottom + 10;
                
                defaultRecordThinkingProcess.update_Node("point" ,movedNodeId, (nodeBoundingBox.right + nodeBoundingBox.left)/2, (nodeBoundingBox.bottom + nodeBoundingBox.top)/2)
                // const ontology_index = this.OntologyConnectNodeId.indexOf(movedNodeId);
                // if(ontology_index !== -1){
                //     const nodeBoundingBox = this.ownNetwork.getBoundingBox(movedNodeId);
                //     const ontology_x = nodeBoundingBox.left;
                //     const ontology_y = nodeBoundingBox.top;
                //     console.log(this.Recruit[this.RecruitNodeId.indexOf(this.OntologyConnectNodeId[this.OntologyNodeId.indexOf(this.OntologyNodeId[ontology_index])])]);
                //     if(this.Recruit[this.RecruitNodeId.indexOf(this.OntologyConnectNodeId[this.OntologyNodeId.indexOf(this.OntologyNodeId[ontology_index])])]==="採用"){
                //         border_color = 'green'; 
                //     }else if(this.Recruit[this.RecruitNodeId.indexOf(this.OntologyConnectNodeId[this.OntologyNodeId.indexOf(this.OntologyNodeId[ontology_index])])]==="棄却"){
                //         border_color = 'red'; 
                //     }
                //     this.nodes.update({ id: this.OntologyNodeId[ontology_index], color: { background: 'blue', border: border_color}, x: ontology_x, y: ontology_y });
                //     defaultRecordThinkingProcess.update_Node("point" ,this.OntologyNodeId[ontology_index], ontology_x, ontology_y);
                // }
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
            defaultRecordThinkingProcess.delete_db_Edge(selectEdgeId, startid, endid);
            // const Edge_index = this.OntologyConnectNodeId.indexOf(startid);
            // if(Edge_index !== -1){
            //     this.EdgeStartId.splice(Edge_index, 1);
            //     this.EdgeEndId.splice(Edge_index, 1);
            // }
        }
    }

    // Nodeblinking() {
    //     this.Feedback.map((n) => {
    //         const feedbacknode = this.nodes.get(n);
    //         let node_color = '#ffdb4f'; // ノードの背景色
    //         switch(feedbacknode.group) {
    //             case "material-content": // 議論資料に書かれた内容に関するノードの場合
    //                 break;
    //             case "process": // 自分で考えた要約に関するノードの場合
    //                 node_color = 'green';
    //                 break;
    //             case "utterance": // 議論内での発言ノードの場合
    //                 node_color = 'pink';
    //                 break;
    //             case "topic-tag": // 議論内省マップのノードがどんなトピックに対応しているかを表すタグノードの場合
    //                 node_color = 'blue';
    //                 break;
    //             default: // その他
    //                 break;
    //         }
    //         const borderWidth = feedbacknode.borderWidth === 0 ? 5 : 0;
    //         this.nodes.update({ id: n, color: { background: node_color, border: "red"}, borderWidth: borderWidth });
    //     })
    // }

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
                        slot_content.map((content_slot) => {
                            if(content_slot.getAttribute("role") === "出力"){
                                const nodeBoundingBox = defaultThinkingProcess.ownNetwork.getBoundingBox(material_id);
                                this.addNode(concept_id, content_slot.getAttribute("class_constraint"), "topic-tag", nodeBoundingBox.left, nodeBoundingBox.top);
                                this.OntologyConnectNodeId.push(material_id);
                                this.OntologyNodeId.push('topic-tag_'+concept_id);
                                defaultRecordThinkingProcess.record_ontology(material_id, 'topic-tag_'+concept_id);
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
class RecordThinkingProcess{
    //ノードの記録(完了)
    record_Node (id, label, node_type, x, y){
        let selected_node_id = document.getElementById('conceptdisplay').getAttribute('nodeId');
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {node_id : id,
                label : label,
                node_type: node_type,
                x : x,
                y : y,
                selected_node_id: selected_node_id,
                purpose : 'record',
                record_thing: 'node'},
        });
    }

    //エッジの記録(完了)
    record_Edge (edge_id, edge_start, edge_end){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {edge_id: edge_id,
                edge_start : edge_start,
                edge_end : edge_end,
                purpose : 'record',
                record_thing: 'edge'},
        });
    }

    //ノードの更新(完了)
    update_Node (select_update, id, node_update_thing1, node_update_thing2){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {select_update : select_update,
                node_id : id,
                purpose : 'update',
                update_thing : 'node',
                node_update_thing1 : node_update_thing1,
                node_update_thing2: node_update_thing2},
            success:function(e){
                if(e){
                    console.log(e);
                }
            }
        });
    }

    //ノードの削除(完了)
    delete_db_Node (id){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {node_id : id,
                purpose : 'delete',
                delete_thing : 'node'},
        });
    }

    //triggerの削除
    delete_trigger_Node (id){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {trigger_id : id,
                purpose : 'delete',
                delete_thing : 'trigger'},
            success: function(e){
                if(e){
                    console.log(e);
                }
            }
        });
    }
    
    //エッジの削除(完了)
    delete_db_Edge (edge_id, edge_start,edge_end){
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {edge_id: edge_id,
                edge_start : edge_start,
                edge_end : edge_end,
                purpose : 'delete',
                delete_thing : 'edge'},
                success: function(e){
                    if(e){
                        console.log(e);
                    }
                }
        });
    }

    // delete_connection (id){
    //     $.ajax({
    //         url: "../php/thinking_edit_processmap_maneger.php",
    //         type: "POST",
    //         data: {node_id : id,
    //             purpose : 'delete',
    //             delete_thing : 'connection'},
    //     });
    // }

    // //繋げたものをDBに記録
    // record_connection (NetworkNodeId,MindMapNodeId){
    //     $.ajax({
    //         url: "../php/thinking_edit_processmap_maneger.php",
    //         type: "POST",
    //         data: {networknodeid : NetworkNodeId,
    //             mindmapnodeid : MindMapNodeId,
    //             purpose : 'record',
    //             record_thing : 'connection'},
    //     });
    // }

    // // オントロジーの対応付けの記録
    // record_ontology (node_id, ontology_node_id){
    //     $.ajax({
    //         url: "../php/thinking_edit_processmap_maneger.php",
    //         type: "POST",
    //         data: {node_id : node_id,
    //             ontology_node_id : ontology_node_id,
    //             purpose : 'record',
    //             record_thing : 'ontology'},
    //     });
    // }

    // // オントロジーの対応付けの記録
    // record_recruit (node_id, ontology_node, result){
    //     $.ajax({
    //         url: "../php/thinking_edit_processmap_maneger.php",
    //         type: "POST",
    //         data: {node_id : node_id,
    //             ontology_node : ontology_node,
    //             result_recruit : result,
    //             purpose : 'record',
    //             record_thing : 'recruit'},
    //     });
    // }

    record_trigger(trigger_id, activity_id, from, to, time, activity_type, content, x, y){
        
        $.ajax({
            url: "../php/thinking_edit_processmap_maneger.php",
            type: "POST",
            data: {trigger_id : trigger_id,
                activity_id : activity_id,
                node_version_from : from,
                node_version_to : to,
                activity_time : time,
                activity_type : activity_type,
                content : content,
                x : x,
                y : y,
                purpose: 'record',
                record_thing : 'trigger'},
            success: function(e){
                if(e){
                    console.log(e);
                }else{
                    if(activity_id){
                        document.getElementById(activity_id).trigger_on = 1;
                        document.getElementById(activity_id).style.background = "#979997";
                        document.getElementById(activity_id).style.borderWidth = 3;
                    }
                }
            }
        });
    }
}


/*
 * データベースからの読み込み
 */
let process_mode; // 思考過程表出化マップの表示モードを保持する変数
let trigger_list;   // データベースから取得した思考過程表出化マップの情報を保持する変数
let selected_concept_id;  // 選択されている概念IDを保持する変数
let selected_other_process_id; // 他者の思考過程表出化マップを表示する際に使用する変数
// ガード用タイムスタンプ（同一操作による二重実行を抑止）
let _lastShowThinkingProcessCall = 0;

const getProcessMapDataFromDB = (callback) => {
    //選択されているノードIDとconcept_id
    let selected_node_id;
    if(process_mode == "all"){
        selected_node_id = _jm.get_selected_node().id;
        selected_concept_id = Get_NodeInfo(selected_node_id, "concept_id");
    }else if(process_mode == "who"){
        selected_node_id = selected_other_process_id;    //選択した他者のprocessノードIDを格納
    }else{
        const conceptDiplay = document.getElementById("conceptdisplay");
        selected_node_id = conceptDiplay.getAttribute('nodeid');
        selected_concept_id = conceptDiplay.getAttribute('conceptid');;
    }
    choose_trigger_xmlLoad().then(conceptIds => {
        return new Promise((resolve, reject) => {
            try{
                return $.ajax({
                    url: "../php/thinking_map_manager.php",
                    type: "POST",
                    data: data =  {
                        process_mode: process_mode,
                        selected_node_id: selected_node_id,
                        selected_concept_id: selected_concept_id,
                        concept_ids: conceptIds
                    },
                }).success((r) => {
                    trigger_list = JSON.parse(r);
                    console.log(trigger_list);
                    callback(trigger_list);
                });
            } catch (error){
                reject(error);
            }
        });
    }).catch(error => {
        console.error(error); // エラー処理
    });
}

const makeTriggerInList = (id, activity_type, concept_label, content, timestamp, trigger_on) => {
    // 左側の発話ノードのリストのところのノードのDOMを構成する
    let backColor = "white";
    let borderColor = "#67796b";
    let borderWidth = 1;
    if(trigger_on == 1){
        backColor = "#979997";
        borderWidth = 2;
    }
    return $(`(<div id="${id}"
                 style='border: solid "${borderWidth}"px "${borderColor}"; background: ${backColor};'
                 class='trigger_in_list'
                 trigger_content='${content}'
                 timestamp='${timestamp}'
                 trigger_on='${trigger_on}'
                 activity_type='${activity_type}'
            >【${timestamp}：${activity_type}】<br>${concept_label}：<br>${content}</div>`);
}

// 思考過程表出化マップを表示
const displayTriggerData = (mode, process_display_option) => {
    process_mode = mode;
    let node_x = 0;
    let node_y = 0;
    let from_id = "";
    if(mode=="all" || mode == "allRE"){
        const conceptdisplay_area = $(`#conceptdisplay`); // 何の認知活動かを表示するエリア
        const target_area = $(`#${process_display_option}`); // DOMエリア
        $('#trigger_candidate_list').html("");

        getProcessMapDataFromDB ((trigger_list_info) => {
            //concept_labelを表示
            const concept_label = trigger_list_info['selected_concept'];
            conceptdisplay_area.html(concept_label);
            let j = 0;

            // versionノードの表示
            trigger_list_info.node_versions.forEach((v) => {
                defaultThinkingProcess.addVersionNode(v.node_version_id, v.content, "versions", v.appeared_at, node_x, node_y);
                if(from_id != ""){
                    defaultThinkingProcess.addVersionEdge(from_id, v.node_version_id);
                }
                from_id = v.node_version_id;
                node_x += 300;
            });
            // triggerの候補一覧
            trigger_list_info.trigger_candidate.forEach((u) => {
                if(u){
                    const trigger_dom = makeTriggerInList(u.activity_id, u.activity_type, u.concept_label, u.content, u.appeared_at, u.trigger_on);
                    target_area.append(trigger_dom); // 挿入
                }
            });
            // triggerノードの表示
            trigger_list_info.trigger.forEach((u) => {
                j++;
                if(u){
                    let from_node = u.node_version_from;
                    let to_node = u.node_version_to;
                    let edge_ids = defaultThinkingProcess.ownNetwork.getConnectedEdges(from_node);
                    let num = 0;
                    for(i = 0; i<edge_ids.length; i++){
                        if(defaultThinkingProcess.edges.get(edge_ids[i]).group == "versionEdges" || defaultThinkingProcess.edges.get(edge_ids[i]).group == "trigger_from"){
                            //(versionEdgesのときなど)自身が指されている(左側のものと繋がっている)edgeを除外
                            if(defaultThinkingProcess.ownNetwork.getConnectedNodes(edge_ids[i])[1] != from_node){
                                num = i;
                            }
                        }
                    }
                    let edge_id = edge_ids[num];
                    defaultThinkingProcess.addTriggerNode("Reload", u.trigger_id, edge_id, from_node, to_node, u.activity_id, u.content, u.activity_type, u.activity_time, u.x, u.y);
                }
            });
            trigger_list_info.pnode.map((n) => {
                defaultThinkingProcess.addReloadNode(n.process_node_id, n.content, n.process_node_type, n.node_x, n.node_y);
            });
            trigger_list_info.pedge.map((n) => {
                defaultThinkingProcess.addReloadEdge(n.process_edge_id, n.edge_start, n.edge_end, n.label);
            });

            const nodes = this.nodes;
            const edges = this.edges;

            addeventdisplayTriggerData();
            
        });
    }else if(mode=="AddBrother"){
        getProcessMapDataFromDB ((trigger_list_info) => {
            // versionノードの表示
            let bronum = trigger_list_info.brother_num;
            trigger_list_info.node_versions.forEach((v) => {
                console.log(bronum[v.node_id]);
                if(v.broversion){
                    node_x = defaultThinkingProcess.nodes.get(v.broversion).x;
                    node_y = v.y;
                }else{
                    node_x -= 150
                }
                if(!v.y || v.y == '233px'){
                    node_y = 100;
                }
                console.log(node_y);
                // versionノードで時間軸が同じになるようにx座標を合わせる
                defaultThinkingProcess.addVersionNode(v.node_version_id, v.content, "versionsBro", v.appeared_at, node_x, node_y);
                if(from_id != ""){
                    defaultThinkingProcess.addVersionEdge(from_id, v.node_version_id);
                }
                from_id = v.node_version_id;
                node_x += 150;
            });
            // triggerノードの表示
            trigger_list_info.trigger.forEach((u) => {
                j++;
                if(u){
                    let from_node = u.node_version_from;
                    let to_node = u.node_version_to;
                    let edge_ids = defaultThinkingProcess.ownNetwork.getConnectedEdges(from_node);
                    let num = 0;
                    for(i = 0; i<edge_ids.length; i++){
                        if(defaultThinkingProcess.edges.get(edge_ids[i]).group == "versionEdges" || defaultThinkingProcess.edges.get(edge_ids[i]).group == "trigger_from"){
                            //(versionEdgesのときなど)自身が指されている(左側のものと繋がっている)edgeを除外
                            if(defaultThinkingProcess.ownNetwork.getConnectedNodes(edge_ids[i])[1] != from_node){
                                num = i;
                            }
                        }
                    }
                    let edge_id = edge_ids[num];
                    node_x = (defaultThinkingProcess.nodes.get(from_node).x + defaultThinkingProcess.nodes.get(to_node).x)/2;
                    node_y = defaultThinkingProcess.nodes.get(from_node).y;
                    defaultThinkingProcess.addTriggerNode("Reload", u.trigger_id, edge_id, from_node, to_node, u.activity_id, u.content, u.activity_type, u.activity_time, node_x, node_y);
                }
            });
            trigger_list_info.pnode.map((n) => {
                defaultThinkingProcess.addReloadNode(n.process_node_id, n.content, n.process_node_type, n.node_x, n.node_y);
            });
            trigger_list_info.pedge.map((n) => {
                defaultThinkingProcess.addReloadEdge(n.process_edge_id, n.edge_start, n.edge_end, n.label);
            });

            const nodes = this.nodes;
            const edges = this.edges;
        })

    }else if(mode=="who"){
        const conceptdisplay_area = $(`#others_conceptdisplay`); // 何の認知活動かを表示するエリア
        const others_node = process_display_option; // 選択されているノード
        selected_other_process_id = others_node.id;
        selected_concept_id = others_node.concept_id;
        organizational_selected_user_id = others_node.user_id;

        getProcessMapDataFromDB ((trigger_list_info) => {
            //concept_labelを表示
            const concept_label = trigger_list_info['selected_concept'];
            console.log(concept_label);
            conceptdisplay_area.html("\""+concept_label+"\"の思考過程");
            let j = 0;

            // versionノードの表示
            trigger_list_info.node_versions.forEach((v) => {
                defaultThinkingProcess.addVersionNode(v.node_version_id, v.content, "versions", v.appeared_at, node_x, node_y);
                if(from_id != ""){
                    defaultThinkingProcess.addVersionEdge(from_id, v.node_version_id);
                }
                from_id = v.node_version_id;
                node_x += 300;
            });
            // triggerノードの表示
            trigger_list_info.trigger.forEach((u) => {
                j++;
                if(u){
                    let from_node = u.node_version_from;
                    let to_node = u.node_version_to;
                    let edge_ids = defaultThinkingProcess.ownNetwork.getConnectedEdges(from_node);
                    let num = 0;
                    for(i = 0; i<edge_ids.length; i++){
                        if(defaultThinkingProcess.edges.get(edge_ids[i]).group == "versionEdges" || defaultThinkingProcess.edges.get(edge_ids[i]).group == "trigger_from"){
                            //(versionEdgesのときなど)自身が指されている(左側のものと繋がっている)edgeを除外
                            if(defaultThinkingProcess.ownNetwork.getConnectedNodes(edge_ids[i])[1] != from_node){
                                num = i;
                            }
                        }
                    }
                    let edge_id = edge_ids[num];
                    defaultThinkingProcess.addTriggerNode("Reload", u.trigger_id, edge_id, from_node, to_node, u.activity_id, u.content, u.activity_type, u.activity_time, u.x, u.y);
                }
            });
            trigger_list_info.pnode.map((n) => {
                defaultThinkingProcess.addReloadNode(n.process_node_id, n.content, n.process_node_type, n.node_x, n.node_y);
            });
            trigger_list_info.pedge.map((n) => {
                defaultThinkingProcess.addReloadEdge(n.process_edge_id, n.edge_start, n.edge_end, n.label);
            });

            const nodes = this.nodes;
            const edges = this.edges;

            addeventdisplayTriggerData();
            
        });
    }
    
}

const addeventdisplayTriggerData = () => {
    let mousedownId = null;
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
    $(`#lesson_area`).on('mousedown', (e) => {
    // リスト内の発話ノードにマウスイベント（マウスが要素上からでた）を追加
    mousedownId = null;
    const overed_node = e.target;
    if(overed_node.getAttribute('trigger_on')==='0'){
        mousedownId = overed_node.getAttribute('id');
    }
    });
    $(`#lesson_area`).on('mouseleave', (e) => {
    // リスト内の発話ノードにマウスイベント（マウスが要素上からでた）を追加
        // $(`#trigger_click`).empty();
    });
    $(`.trigger_in_list`).on('contextmenu', (e) => {
        // リスト内の発話ノードにマウスイベント(右クリック)を追加
        const clicked_trigger = e.target;
        document.getElementById("trigger_click").innerHTML="<input type='button' class='triggerbutton' id='triggerMapShow' value='マインドマップを表示'>";
        $(`#triggerMapShow`).on("click", () => {
            console.log(clicked_node.getAttribute('id'));
            document.getElementById("trigger_click").innerHTML="";
        });
    });
}

// 学習者がオリジナルのTriggerを入力できる箇所を作成
function inputTriggerAreaOpen(){
    $('#trigger_display').css('height','auto');
    $('#area_trigger_add').css('height','auto');
    $('#trigger_add').css('height','auto');
    document.getElementById('inputTriggerbutton').value = " × 閉じる";
    document.getElementById('inputTriggerbutton').onclick = inputTriggerAreaClose;

    // 日時入力欄
    let input_time = document.createElement('input');
    input_time.type = 'datetime-local';
    input_time.id = 'trigger_time';
    document.getElementById("trigger_add").appendChild(input_time);

    // 活動入力欄
    let input_activity = document.createElement('select');
    input_activity.id = 'trigger_activity';
    document.getElementById("trigger_add").appendChild(input_activity);

    // 活動一覧
    let s0 = document.createElement('option');
    s0.value = '';
    s0.textContent = '-何の活動を行いましたか？-';
    let s1 = document.createElement('option');
    s1.value = '自己内対話'
    s1.textContent = '自己内対話'
    let s2 = document.createElement('option');
    s2.value = '議論資料作成'
    s2.textContent = '議論資料作成'
    let s3 = document.createElement('option');
    s3.value = '議論内省'
    s3.textContent = '議論内省'
    let s4 = document.createElement('option');
    s4.value = '論文執筆'
    s4.textContent = '論文執筆'
    let s5 = document.createElement('option');
    s5.value = '論文読解'
    s5.textContent = '論文読解'
    document.getElementById("trigger_activity").appendChild(s0);
    document.getElementById("trigger_activity").appendChild(s1);
    document.getElementById("trigger_activity").appendChild(s2);
    document.getElementById("trigger_activity").appendChild(s3);
    document.getElementById("trigger_activity").appendChild(s4);
    document.getElementById("trigger_activity").appendChild(s5);

    // 自由記述欄
    let input_content = document.createElement('textarea');
    input_content.id = 'trigger_content';
    input_content.placeholder = '何をきっかけに思考が変化しましたか？';
    input_content.rows = 3
    document.getElementById("trigger_add").appendChild(input_content);
    
    // 入力ボタン 
    let input_button = document.createElement('input');
    input_button.type = 'button';
    input_button.className = 'triggerbutton';
    input_button.id = 'triggerNew'
    input_button.value = 'ノードとして追加';
    input_button.onclick = inputTrigger;
    document.getElementById("trigger_add").appendChild(input_button);
    
  }

//   Trigger入力箇所を閉じる処理
function inputTriggerAreaClose(){
    $('#trigger_display').css('height','100px');
    $('#area_trigger_add').css('height','20px');
    $('#trigger_add').css('height','0px');
    document.getElementById("trigger_time").remove();
    document.getElementById("trigger_activity").remove();
    document.getElementById("trigger_content").remove();
    document.getElementById("triggerNew").remove();
    document.getElementById('inputTriggerbutton').value = "＋ 活動を入力";
    document.getElementById('inputTriggerbutton').onclick = inputTriggerAreaOpen;
}

// 入力されたTriggerをマップに表示
function inputTrigger(){
    let trigger_id = defaultThinkingProcess.generateUniqueNumberText();
    const t_type = document.getElementById("trigger_activity").value;
    const t_time = document.getElementById("trigger_time").value.replace('T', ' ');
    let content = document.getElementById("trigger_content").value;
    const t_label = "【"+t_time+"："+t_type+"】<br>"+content+"";
    
    if(!t_type){
        alert('どの活動を行ったのか入力してください');
        return;
    }else if(!content){
        alert('どのような活動を行ったのか入力してください');
        return;
    }

    const selected_node_id = defaultThinkingProcess.ownNetwork.getSelection().nodes[0];
    const selected_edge_id = defaultThinkingProcess.ownNetwork.getSelection().edges;
    let edge_id =selected_edge_id;
    let num = 0 ;
    let selected_node_group = defaultThinkingProcess.nodes.get(selected_node_id).group;

    if(selected_node_id && selected_node_group == "versions" || selected_node_group == "versionsBro"){ 
        //versionのノードが選択されている時，それにつながるedge_idを取得し，右側のedge_idにつながるnode_idを取得する
        for(i = 0; i<selected_edge_id.length; i++){
            let selected_edge_group = defaultThinkingProcess.edges.get(selected_edge_id[i]).group
            if(selected_edge_group == "versionEdges" || selected_edge_group == "trigger_from"){
                //(versionEdgesのときなど)自身が指されている(左側のものと繋がっている)edgeを除外
                if(defaultThinkingProcess.ownNetwork.getConnectedNodes(selected_edge_id[i])[1] != selected_node_id){
                    num = i;
                }
            }
        }
        edge_id = selected_edge_id[num];
        const connect_node_ids = defaultThinkingProcess.ownNetwork.getConnectedNodes(selected_edge_id[num]);
        let from_node = connect_node_ids[0];
        let to_node = connect_node_ids[1];
        if(defaultThinkingProcess.edges.get(selected_edge_id[num]).group == "trigger_to"){
            // triggerを指しているedgeだった場合，その先のversionノードを取得する
            let e = defaultThinkingProcess.ownNetwork.getConnectedEdges(connect_node_ids[1]);
            let n = defaultThinkingProcess.ownNetwork.getConnectedNodes(e[1])
            to_node = n[1];
        }
         defaultThinkingProcess.addTriggerNode("New", trigger_id, edge_id, from_node, to_node, null, t_label, t_type, t_time, null, null)
        // document.getElementById("trigger_time").reset();
        // document.getElementById("trigger_activity").reset();
        // document.getElementById("trigger_content").reset();   
    }else if(selected_edge_id.length == 1 && (defaultThinkingProcess.edges.get(selected_edge_id[0]).group == "versionEdges" || defaultThinkingProcess.edges.get(selected_edge_id[0]).group == "trigger_from")){
        //versionもしくはtriggerのエッジが選択されている時，それにつながるnode_id(2つ)を取得する
        const connect_node_ids = defaultThinkingProcess.ownNetwork.getConnectedNodes(selected_edge_id);
        let from_node = connect_node_ids[0];
        let to_node = connect_node_ids[1];
        if(defaultThinkingProcess.edges.get(selected_edge_id[0]).group == "trigger_from"){
            // triggerを指しているedgeだった場合，その先のversionノードを取得する
            let e = defaultThinkingProcess.ownNetwork.getConnectedEdges(connect_node_ids[1]);
            let n = defaultThinkingProcess.ownNetwork.getConnectedNodes(e[1])
            to_node = n[1];
        }
         defaultThinkingProcess.addTriggerNode("New", trigger_id, selected_edge_id[0], from_node, to_node, null, t_label, t_type, t_time, null, null)
        // document.getElementById("trigger_time").reset();
        // document.getElementById("trigger_activity").reset();
        // document.getElementById("trigger_content").reset();   
        return;
    }else{
        alert('追加したい箇所のノードまたはエッジを選択してください');
        return;
    }
}

function ShowRelatedProcess(mode){
    // checkboxの状態を取得
    check = document.getElementById("checkbox_process");

    // 兄弟ノードを含めた表示
    if(mode=='brother'){
        // checlboxがチェックされている時の処理
        if(check.checked == true){
            console.log(check);
            displayTriggerData("AddBrother", "trigger_candidate_list");
        }
        else{
            console.log(check);
            defaultThinkingProcess = new ThinkingProcess("myProcessnetwork", "load");
            displayTriggerData("allRE", "trigger_candidate_list");
        }
    }// 整合性ラベルのついたノードを含めた表示
    if(mode=='consistency'){
        console.log(mode);
        // checlboxがチェックされている時の処理
        if(check.checked == true){
            
        }
        else{
          
        }
    }
    
}

function showThinkingProcessMap(others_node){
    // 重複呼び出しを短時間内に受けた場合は無視する（UIからの二重トリガ防止）
    try{
        const now = Date.now();
        if(now - _lastShowThinkingProcessCall < 300){
            console.log('showThinkingProcessMap: duplicate call ignored');
            console.trace();
            return;
        }
        _lastShowThinkingProcessCall = now;
        console.trace('showThinkingProcessMap called');
    }catch(e){/* no-op */}

    // 共有された思考過程ノードの閲覧かどうか(自分自身の場合は others_node==null )
    if(others_node){
        console.log("他者の思考過程表出化マップを表示");
        document.getElementById('feedback_area').style.display = "block";
        document.getElementById('xml_upload_area').style.display = "block";
        $('#process_others_network_container').css('display','block');
        // organizational_container をフレックスレイアウトに変更して垂直分割対応
        $('#organizational_container').css({
            'display':'flex',
            'flex-direction':'column',
            'width':'calc(100vw - 350px)',
            'height':'150%'
        });
        // myOrganizationalnetwork_area と process_others_network_container の高さを設定
        $('#myOrganizationalnetwork_area').css({
            'height':'50%',
            'flex':'0 0 50%'
        });
        $('#process_others_network_container').css({
            'width':'100%',
            'height':'50%',
            'flex':'0 0 50%',
            'display':'flex',
            'flex-direction':'column'
        });
    
        defaultThinkingProcess = new ThinkingProcess("othersProcessnetwork", "load");
        displayTriggerData("who", others_node);
    }else{
        console.log("自分自身の思考過程表出化マップを表示");
        document.getElementById('feedback_area').style.display = "block";
        document.getElementById('xml_upload_area').style.display = "block";
        $('#process_network_container').css('display','flex');
        // $('#jsmind_container').css('width','calc(100vw - 350px)');
        $('#jsmind_container').css('width','100%');
        $('#jsmind_container').css('height','50%');
        $('#mind').css('height','90%');
        $('#document').hide();
        const frame_dom = document.getElementsByClassName("inquiry_area");
        frame_dom[0].style.border = "solid 5px #ccc";
        $("#myProcessnetwork").css({
        width: '100%', 
        height: '400px' // 必要に応じて調整
        });
    
        defaultThinkingProcess = new ThinkingProcess("myProcessnetwork", "load");
        displayTriggerData("all", "trigger_candidate_list");
    }
    
  
}

function closeThinkingProcessMap(){
  
    document.getElementById('feedback_area').style.display = "block";
    document.getElementById('xml_upload_area').style.display = "block";
    $('#process_network_container').css('display','none');
    // $('#jsmind_container').css('width','calc(100vw - 350px)');
    $('#jsmind_container').css('height','100%');
    $('#mind').css('height','90%');
}

// nodeIDをidにもつノードのtypeがラベルの時，思考過程表出化マップを開く
function proposeThinkingProcess(nodeID){

    const nodeClass = Get_NodeInfo(nodeID, "class").replace(" selected", "");
    console.log(nodeClass);
    if(nodeClass =='primary_label' || nodeClass =='issue_label' || nodeClass =='consistency_label' ){
        var label_name = "注目すべきである";
        switch (nodeClass){
            case 'primary_label':
                label_name = "主軸である";
                break;
            case 'issue_label':
                label_name = "課題である";
                break;
            case 'consistency_label':
                label_name = "整合性を保つべきである";
                break;
        }
        alert("「"+ label_name +"」と考えていた思考が変わりましたね．なぜそのように考えたのかを振り返ってみましょう！");
        showThinkingProcessMap();
    }
}

// ロードした際の関数
window.addEventListener('load', () => {

    // 初期表示時点でいくつかのオブジェクトを非表示にする
    document.getElementById("process_network_container").style.display="none";
    defaultThinkingProcess = new ThinkingProcess("myProcessnetwork", "load");
    // マップ編集ボタンにイベント付与
    $(`#process_addNode`).on("click", e => {
        defaultThinkingProcess.addNewNode();
    });
    $(`#process_removeNode`).on("click", e => {
        defaultThinkingProcess.deleteNode();
    });
    $(`#process_startEditEdge`).on("click", e => {
        defaultThinkingProcess.SelectEditEdge();
    });
    $(`#process_removeEdge`).on("click", e => {
        defaultThinkingProcess.deleteEdge();
    });
    $(`#process_ZoomIn`).on("click", e => {
        defaultThinkingProcess.zoomIn();
    });
    $(`#process_ZoomOut`).on("click", e => {
        defaultThinkingProcess.zoomOut();
    });

    // グローバルなインライン呼び出しに対応するラッパーを登録
    // index.php の onclick="selectShareOrganization()" が存在するため、グローバル関数を用意する
    window.selectShareOrganization = function() {
        if (typeof defaultThinkingProcess !== 'undefined' && defaultThinkingProcess.selectShareOrganization) {
            defaultThinkingProcess.selectShareOrganization();
        } else {
            console.error('selectShareOrganization: defaultThinkingProcess が利用できません');
            alert('共有機能が利用できません。ページをリロードしてください。');
        }
    };

    const accordionHeaders = document.querySelectorAll('#accordion_discussion .accordion-header');
    accordionHeaders.forEach(header => {
      header.addEventListener('click', function () {
        const accordionItem = this.parentElement;
        accordionItem.classList.toggle('active');
      });
    });
});
