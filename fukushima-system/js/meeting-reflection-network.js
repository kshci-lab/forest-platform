// 議論内省マップに関する処理プログラム
try{ console && console.log && console.log('meeting-reflection-network.js loaded'); }catch(_){ }
// global error catcher to ensure runtime errors surface in console
window.addEventListener && window.addEventListener('error', function(evt){
    try{ console && console.error && console.error('JS error caught:', evt && (evt.message || evt.error)); }catch(_){ }
});

// 追加のフラグメント選択モード切替ボタン
$(document).on('click', '#fragment-add-select-toggle', function(){
    try{
        window.kfrag_add_select_mode = !window.kfrag_add_select_mode;
        var $btn = $(this);
        try{ console && console.debug && console.debug('[kfrag] add-select toggle ->', window.kfrag_add_select_mode, { add_selected: window.kfrag_add_selected, display_list: window.kfrag_display_list }); }catch(_){ }
        if(window.kfrag_add_select_mode){
            // enable mode
            window.kfrag_add_selected = window.kfrag_add_selected || { ext: [], kfid: [] };
            $btn.addClass('is-adding');
        } else {
            // disable mode
            $btn.removeClass('is-adding');
        }
        try{ updateFragmentSelectedList(); }catch(_){ }
    }catch(e){ console && console.error && console.error('fragment-add-select-toggle error', e); }
});

// update the selected fragment list UI (primary + additional)
function updateFragmentSelectedList(){
    try{
        var $list = $('#fragment-selected-list');
        if(!$list || !$list.length) return;
        $list.empty();
        // prefer explicit display list if maintained, otherwise build from primary + additional
        var items = [];
        try{
            console && console.debug && console.debug('[kfrag] updateFragmentSelectedList: inputs', {
                display_list: window.kfrag_display_list,
                activeKnowledgeFragmentId: window.activeKnowledgeFragmentId,
                activeExternalizedId: window.activeExternalizedId,
                add_selected: window.kfrag_add_selected
            });
        }catch(_){ }
        if(window.kfrag_display_list && Array.isArray(window.kfrag_display_list) && window.kfrag_display_list.length){
            items = window.kfrag_display_list.slice();
        } else {
            if(typeof window.activeKnowledgeFragmentId !== 'undefined' && window.activeKnowledgeFragmentId !== null){ items.push(String(window.activeKnowledgeFragmentId)); }
            else if(typeof window.activeExternalizedId !== 'undefined' && window.activeExternalizedId !== null){ items.push(String(window.activeExternalizedId)); }
            if(window.kfrag_add_selected && Array.isArray(window.kfrag_add_selected.kfid)){
                window.kfrag_add_selected.kfid.forEach(function(k){ var ks = String(k); if(ks !== 'null' && ks !== 'undefined' && ks.length && items.indexOf(ks) === -1){ items.push(ks); } });
            }
        }
        try{ console && console.debug && console.debug('[kfrag] updateFragmentSelectedList: items', items); }catch(_){ }
        items.forEach(function(k,i){
            var $it = $('<span class="fragment-selected-item" data-kfid="'+k+'"></span>');
            $it.text('#' + k);
            if(i === 0) {
                $it.addClass('primary');
            } else {
                // add a small remove button for additional selections
                $it.append('<span class="remove-btn" title="選択解除">×</span>');
            }
            $list.append($it);
        });

        // Update highlight class on fragment node wrappers so selected fragments show thicker border
        try{
            // remove previous highlights
            $('.fragment-node-wrapper.kfrag-selected-highlight').removeClass('kfrag-selected-highlight');
            // add highlight to each selected id
            items.forEach(function(k){
                try{
                    var $w = $('.fragment-node-wrapper').filter(function(){
                        try{ return String($(this).data('knowledge-fragment-id')) === String(k) || String($(this).data('externalized-id')) === String(k); }catch(_){ return false; }
                    }).first();
                    try{ console && console.debug && console.debug('[kfrag] highlight for', k, '-> wrapper', ($w && $w.length) ? { kfid: $(this).data('knowledge-fragment-id'), ext: $(this).data('externalized-id') } : null ); }catch(_){ }
                    if($w && $w.length){ $w.addClass('kfrag-selected-highlight'); }
                }catch(_){ }
            });
        }catch(_){ }

    }catch(e){ console && console.error && console.error('updateFragmentSelectedList error', e); }
}


// Right-click on a selected badge to remove that additional selection
$(document).on('contextmenu', '#fragment-selected-list .fragment-selected-item', function(e){
    try{
        e.preventDefault();
        var $el = $(this);
        var k = String($el.data('kfid'));
        try{ console && console.debug && console.debug('[kfrag] contextmenu remove badge', k, { add_selected: window.kfrag_add_selected, display_list: window.kfrag_display_list }); }catch(_){ }
        // If it's the primary item (first), do not remove primary here
        var $list = $('#fragment-selected-list');
        if(!$list || !$list.length) return;
        var first = $list.find('.fragment-selected-item').first();
        if(first && first.length && String(first.data('kfid')) === k){
            // primary selected; do nothing on right-click
            return;
        }
        // remove from kfrag_add_selected arrays
        if(window.kfrag_add_selected && Array.isArray(window.kfrag_add_selected.kfid)){
            var idx = window.kfrag_add_selected.kfid.indexOf(k);
            if(idx !== -1){
                window.kfrag_add_selected.kfid.splice(idx,1);
                if(window.kfrag_add_selected.ext && window.kfrag_add_selected.ext.length > idx){ window.kfrag_add_selected.ext.splice(idx,1); }
            } else {
                // maybe stored in ext; try remove by matching ext
                if(window.kfrag_add_selected && Array.isArray(window.kfrag_add_selected.ext)){
                    var idx2 = window.kfrag_add_selected.ext.indexOf(k);
                    if(idx2 !== -1){ window.kfrag_add_selected.ext.splice(idx2,1); if(window.kfrag_add_selected.kfid.length > idx2) window.kfrag_add_selected.kfid.splice(idx2,1); }
                }
            }
        }
        // remove visual marker on node wrapper if present
        try{
            var $w = $('.fragment-node-wrapper').filter(function(){
                try{ return String($(this).data('knowledge-fragment-id')) === k || String($(this).data('externalized-id')) === k; }catch(_){ return false; }
            }).first();
            if($w && $w.length){ $w.removeClass('additional-selected'); }
        }catch(_){ }
        // update UI and history
        try{ 
            // update display list
            if(window.kfrag_display_list && Array.isArray(window.kfrag_display_list)){
                window.kfrag_display_list = window.kfrag_display_list.filter(function(x){ return String(x) !== k; });
            }
            try{ console && console.debug && console.debug('[kfrag] after contextmenu remove', { add_selected: window.kfrag_add_selected, display_list: window.kfrag_display_list }); }catch(_){ }
            updateFragmentSelectedList();
        }catch(_){ }
        try{
            var combined = [];
            if(window.activeExternalizedId) combined.push(window.activeExternalizedId);
            else if(window.activeKnowledgeFragmentId) combined.push(window.activeKnowledgeFragmentId);
            if(window.kfrag_add_selected && Array.isArray(window.kfrag_add_selected.ext)){
                window.kfrag_add_selected.ext.forEach(function(x){ if(String(x).length) combined.push(x); });
            }
            combined = combined.filter(function(v,i){ return combined.indexOf(v) === i; });
            try{ console && console.debug && console.debug('[kfrag] fetch after contextmenu remove, combined', combined); }catch(_){ }
            if(combined.length === 0){ $('#discussion_message_list').empty(); }
            else { fetchDiscussionHistory(combined); }
        }catch(_){ }
    }catch(e){ console && console.error && console.error('remove selected badge error', e); }
});

// Click on remove button inside badge to remove selection (more reliable than right-click)
$(document).on('click', '#fragment-selected-list .remove-btn', function(e){
    try{
        e.stopPropagation();
        var $btn = $(this);
        var $el = $btn.closest('.fragment-selected-item');
        var k = String($el.data('kfid'));
        try{ console && console.debug && console.debug('[kfrag] click remove badge', k, { add_selected: window.kfrag_add_selected, display_list: window.kfrag_display_list }); }catch(_){ }
        // prevent removing primary
        var $list = $('#fragment-selected-list');
        var first = $list.find('.fragment-selected-item').first();
        if(first && first.length && String(first.data('kfid')) === k){ return; }
        // remove from selection arrays
        if(window.kfrag_add_selected && Array.isArray(window.kfrag_add_selected.kfid)){
            var idx = window.kfrag_add_selected.kfid.indexOf(k);
            if(idx !== -1){
                window.kfrag_add_selected.kfid.splice(idx,1);
                if(window.kfrag_add_selected.ext && window.kfrag_add_selected.ext.length > idx){ window.kfrag_add_selected.ext.splice(idx,1); }
            } else {
                var idx2 = (window.kfrag_add_selected && Array.isArray(window.kfrag_add_selected.ext)) ? window.kfrag_add_selected.ext.indexOf(k) : -1;
                if(idx2 !== -1){ window.kfrag_add_selected.ext.splice(idx2,1); if(window.kfrag_add_selected.kfid.length > idx2) window.kfrag_add_selected.kfid.splice(idx2,1); }
            }
        }
        // remove from display list
        if(window.kfrag_display_list && Array.isArray(window.kfrag_display_list)){
            window.kfrag_display_list = window.kfrag_display_list.filter(function(x){ return String(x) !== k; });
        }
        // remove visual marker on node wrapper
        try{ var $w = $('.fragment-node-wrapper').filter(function(){ try{ return String($(this).data('knowledge-fragment-id')) === k || String($(this).data('externalized-id')) === k; }catch(_){ return false; } }).first(); if($w && $w.length){ $w.removeClass('additional-selected'); } }catch(_){ }
        // update UI and history
        try{ console && console.debug && console.debug('[kfrag] after click remove badge', { add_selected: window.kfrag_add_selected, display_list: window.kfrag_display_list }); }catch(_){ }
        try{ updateFragmentSelectedList(); }catch(_){ }
        try{
            var combined = [];
            if(window.activeExternalizedId) combined.push(window.activeExternalizedId);
            else if(window.activeKnowledgeFragmentId) combined.push(window.activeKnowledgeFragmentId);
            if(window.kfrag_add_selected && Array.isArray(window.kfrag_add_selected.ext)){
                window.kfrag_add_selected.ext.forEach(function(x){ if(String(x).length) combined.push(x); });
            }
            combined = combined.filter(function(v,i){ return combined.indexOf(v) === i; });
            try{ console && console.debug && console.debug('[kfrag] fetch after click remove, combined', combined); }catch(_){ }
            if(combined.length === 0){ $('#discussion_message_list').empty(); }
            else { fetchDiscussionHistory(combined); }
        }catch(_){ }
    }catch(e){ console && console.error && console.error('remove-btn click error', e); }
});

// Save fragment positions to server when KRA is submitted (separate from discussed->DONE)
$(document).on('click', '#kra-submit', function(){
    try{
        savePositionsToServer(function(res){
            if(res && res.status === 'ok'){
                console && console.log && console.log('fragment positions saved', res);
            } else {
                console && console.warn && console.warn('fragment positions save failed', res);
            }
        });
    }catch(e){ console && console.error && console.error('save positions on kra-submit error', e); }
});
// currently selected fragment id for discussion posts (null = general board)
window.activeKnowledgeFragmentId = null;
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
        // 共有知モードやマインドマップ非表示時は安全に中断
        if (!document.getElementById('jsmind_container')) {
            alert('現在、マインドマップは有効化されていません');
            this.nodeConnectEnabled = false;
            return;
        }
        const Jsmind = new jsMind({container:'jsmind_container', editable: false});
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
                 style='border: solid 2px #000; font-size: 15px; line-height: 22px; background: ${backColor}; margin-bottom: 5px;'
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
        // 'SELF' や 'OTHER' など文字列/クォート付きも受け付ける正規化
        var normalizeTypeCode = function(txt){
            if (txt == null) return 4; // UNKNOWN
            var s = String(txt).trim();
            // クォート除去（先頭と末尾がシングル/ダブルクォートなら取り除く）
            try{
                if ((s.charAt(0) === "'" && s.charAt(s.length-1) === "'") || (s.charAt(0) === '"' && s.charAt(s.length-1) === '"')){
                    s = s.slice(1, -1);
                }
            }catch(_){ }
            // 数値ならそのまま
            if (/^\d+$/.test(s)) {
                var n = parseInt(s, 10);
                if (n>=1 && n<=4) return n;
            }
            // 文字列マッピング（誤綴りも吸収）
            var u = s.toUpperCase();
            if (u === 'SELF') return 1;
            if (u === 'OTHER') return 2;
            if (u === 'ORGANIZATION' || u === 'ORGANIZETION' || u === 'ORGNIZATION') return 3;
            if (u === 'UNKNOWN') return 4;
            return 4;
        };
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
                    type: normalizeTypeCode(typeTxt)
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

        // 数値→文字列タイプ（内部クラス名用）
        var labelOf = function(tp){
            switch(tp){
                case 1: return 'SELF';
                case 2: return 'OTHER';
                case 3: return 'ORGANIZATION';
                case 4: return 'UNKNOWN';
                default: return 'UNKNOWN';
            }
        };
        // 表示ラベル（日本語）: 内部クラス名は上の labelOf を利用しつつ、見た目は日本語で表示する
        var displayNameMap = {
            'SELF': '自身',
            'OTHER': '他者',
            'ORGANIZATION': '組織',
            'UNKNOWN': 'その他'
        };
        // 色指定はCSSの .label-badge.type-XXXX に統一（JSでは色を持たない）

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
                badge.textContent = (displayNameMap[typeName] || typeName);
                // 色はCSSクラスで適用（JSからのインライン指定は行わない）
                // 先頭にバッジを挿入（タイトルの前）
                try{
                    el.insertBefore(badge, el.firstChild);
                }catch(_){ el.appendChild(badge); }
            } else {
                var typeName2 = labelOf(tp);
                // 既存クラスを置き換え
                badge.className = 'label-badge type-' + typeName2;
                badge.textContent = (displayNameMap[typeName2] || typeName2);
                // 色はCSSクラスで適用（JSからのインライン指定は行わない）
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
                // knowledge_explorer へ保存（コメント有無含め一回だけ実行し、成功時にツリーを再取得）
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
    var container = document.getElementById('overlay_knowledge_tree');
    if(!container){ return; }
    container.innerHTML = '';
    $.ajax({
        url: 'php/get_knowledge_tree.php',
        dataType: 'json'
    }).done(function(res){
        if(!(res && res.status === 'ok' && Array.isArray(res.nodes))){
            console.warn('get_knowledge_tree レスポンス不正', res);
            return;
        }
        var nodes = res.nodes;
        var byParent = {};
        nodes.forEach(function(n){
            var pid = (n.parent_id === null || typeof n.parent_id === 'undefined') ? 'root' : String(n.parent_id);
            if(!byParent[pid]){ byParent[pid] = []; }
            byParent[pid].push(n);
        });
        // 子配列をタイトル順にソート
        Object.keys(byParent).forEach(function(k){
            byParent[k].sort(function(a,b){
                if(a.node_title < b.node_title) return -1;
                if(a.node_title > b.node_title) return 1;
                return 0;
            });
        });
        // トップレベルは parent_id null
        var top = byParent['root'] || [];
        // 指定順序で並び替え（優先的に表示したいもの）
        var order = ['知識関連','研究方略関連','その他'];
        top.sort(function(a,b){ return order.indexOf(a.node_title) - order.indexOf(b.node_title); });
        var rootFrag = document.createDocumentFragment();
        top.forEach(function(node){ rootFrag.appendChild(renderTreeNode(node, byParent)); });
        container.appendChild(rootFrag);
    }).fail(function(xhr,st,err){
        console.error('fetchKnowledgeTree ajax fail', st, err, xhr && xhr.responseText);
    });
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
    // 親が null ならトップレベル：タイトルは kt-node-title、子は kt-content-title
    var isRoot = (node.parent_id === null || typeof node.parent_id === 'undefined');
    titleSpan.className = isRoot ? 'kt-node-title' : 'kt-content-title';
    titleSpan.textContent = node.node_title;
    wrapper.appendChild(titleSpan);

    // 追加情報: comment, updated_at, updated_by_name をタイトルの下に表示
    if(node && node.comment){
        var commentDiv = document.createElement('div');
        commentDiv.className = 'kt-comment';
        commentDiv.textContent = node.comment;
        wrapper.appendChild(commentDiv);
    }
    if(node && node.updated_at){
        var updatedDiv = document.createElement('div');
        updatedDiv.className = 'kt-updated';
        var baseText = '更新日時: ' + formatJPDateTime(node.updated_at);
        if(node.updated_by_name){
            baseText += ' 更新ユーザー: ' + node.updated_by_name;
        }
        updatedDiv.textContent = baseText;
        wrapper.appendChild(updatedDiv);
    }
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

function formatJPDateTime(v){
    try{
        // 期待形式: YYYY-MM-DD HH:MM:SS または ISO など
        // 正規化して "YYYY年MM月DD日 HH:MM" に整形
        var s = String(v);
        var m = s.match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
        if(m){
            var yy = m[1], mm = ('0'+m[2]).slice(-2), dd = ('0'+m[3]).slice(-2);
            var HH = ('0'+m[4]).slice(-2), MM = m[5];
            return yy + '年' + mm + '月' + dd + '日 ' + HH + ':' + MM;
        }
        // 数値タイムスタンプなどに対処
        var d = new Date(v);
        if(!isNaN(d.getTime())){
            var yy2 = d.getFullYear();
            var mm2 = ('0'+(d.getMonth()+1)).slice(-2);
            var dd2 = ('0'+d.getDate()).slice(-2);
            var HH2 = ('0'+d.getHours()).slice(-2);
            var MM2 = ('0'+d.getMinutes()).slice(-2);
            return yy2 + '年' + mm2 + '月' + dd2 + '日 ' + HH2 + ':' + MM2;
        }
        return s;
    }catch(_){ return String(v); }
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

// 右クリックメニュー（コンテキストメニュー）: ノード削除機能
(function(){
    // 重複初期化を防ぐフラグ
    if(window.ktNodeConmenu){ return; }
    // 軽量なコンテキストメニュー要素を用意
    var $menu = $('<div id="kt-node-conmenu" style="position:absolute;z-index:9999;padding:6px;border:1px solid #ccc;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.12);display:none;font-size:13px;border-radius:4px;"></div>');
    $menu.append('<div id="kt-conmenu-delete" style="padding:6px 10px;cursor:pointer;color:#b30000;">削除する</div>');
    $menu.append('<div id="kt-conmenu-cancel" style="padding:6px 10px;cursor:pointer;color:#333;">キャンセル</div>');
    $(document.body).append($menu);
    // mark that menu was successfully appended
    window.ktNodeConmenu = true;
    console && console.debug && console.debug('kt-node-conmenu appended by main JS');

    // キャプチャ段階で contextmenu を傍受して、親要素の oncontextmenu による阻害を回避
    document.addEventListener('contextmenu', function(e){
        try{
            console && console.debug && console.debug('contextmenu event captured (capture phase)');
            var el = e.target || e.srcElement;
            while(el && el !== document){
                if(el.classList && el.classList.contains && el.classList.contains('kt-node')){
                    // 対象ノードを見つけたらカスタムメニューを表示
                    console && console.debug && console.debug('contextmenu target is kt-node', el.tagName, el.className, el.getAttribute('data-node-id'));
                    e.preventDefault();
                    e.stopPropagation();
                    var nodeId = el.getAttribute('data-node-id') || (el.dataset && el.dataset.nodeId);
                    if(!nodeId) return;
                    var x = e.pageX || (e.clientX + (document.documentElement.scrollLeft||document.body.scrollLeft));
                    var y = e.pageY || (e.clientY + (document.documentElement.scrollTop||document.body.scrollTop));
                    $menu.css({ left: x + 'px', top: y + 'px' });
                    $menu.data('target-node', nodeId);
                    $menu.show();
                    return;
                }
                el = el.parentNode;
            }
        }catch(err){ console && console.error && console.error('contextmenu capture handler error', err); }
    }, true);

    // メニューを閉じるユーティリティ
    function hideMenu(){ $menu.hide(); $menu.data('target-node', null); }

    // ドキュメントクリックでメニューを閉じる
    $(document).on('mousedown', function(e){
        if($menu.is(':visible')){
            var t = e.target;
            if(!$menu.is(t) && $menu.has(t).length===0){ hideMenu(); }
        }
    });

    // kt-node の右クリックイベント
    $(document).on('contextmenu', '.kt-node', function(e){
        try{
            e.preventDefault();
            // event.target may be a child; find closest .kt-node to get attribute reliably
            var $targetNode = $(e.target).closest('.kt-node');
            if(!$targetNode.length) { return; }
            var nodeIdAttr = $targetNode.attr('data-node-id');
            var nodeId = (typeof nodeIdAttr !== 'undefined' && nodeIdAttr !== null && nodeIdAttr !== '') ? parseInt(nodeIdAttr, 10) : null;
            if(!nodeId || isNaN(nodeId) || nodeId <= 0){
                // 無効な node_id の場合はメニューを出さない
                console && console.warn && console.warn('contextmenu on kt-node but node_id invalid', nodeIdAttr);
                return;
            }
            // メニュー位置調整（画面端考慮）
            var x = e.pageX || e.clientX + (document.documentElement.scrollLeft||document.body.scrollLeft);
            var y = e.pageY || e.clientY + (document.documentElement.scrollTop||document.body.scrollTop);
            $menu.css({ left: x + 'px', top: y + 'px' });
            $menu.data('target-node', nodeId);
            $menu.show();
        }catch(err){ console && console.error && console.error('kt-node contextmenu handler error', err); }
    });

    // 削除ボタン（メインJSが生成したメニューの要素からのクリックのみ処理する）
    $(document).on('click', '#kt-conmenu-delete', function(e){
        try{
            // このハンドラは document デリゲーションなので、同じ id を持つ別の要素（フォールバック）からのクリックも捕まえてしまう。
            // そこで、実際にクリックされた要素が main の $menu 内にあるか確認する。
            if(!$menu || !$menu.length){ return; }
            var el = this;
            if($menu[0] !== el && $.contains($menu[0], el) === false){
                // main のメニュー要素以外からのクリックは無視
                return;
            }
            var nodeId = $menu.data('target-node');
            if(!nodeId){ hideMenu(); return; }
            if(!confirm('本当にこのノードを削除しますか？（表示上は非表示になります）')){ return; }
            // サーバーへ削除フラグを立てる
            console && console.log && console.log('mark_delete send node_id=', nodeId);
            // 重複送信防止ロック
            window._ktNodeDeleteInProgress = window._ktNodeDeleteInProgress || {};
            if(window._ktNodeDeleteInProgress[nodeId]){
                console && console.warn && console.warn('mark_delete already in progress for', nodeId);
                hideMenu();
                return;
            }
            window._ktNodeDeleteInProgress[nodeId] = true;
            $.ajax({
                url: 'php/mark_delete_knowledge_node.php',
                method: 'POST',
                dataType: 'json',
                data: { node_id: nodeId }
            }).done(function(res){
                if(res && res.status === 'ok'){
                    // DOMから該当ノードを取り除く（または再取得）
                    try{
                        // 最終的に再取得で整合性を保つ
                        fetchKnowledgeTree();
                    }catch(_){
                        $('.kt-node[data-node-id="'+nodeId+'"]').remove();
                    }
                } else {
                    // エラー内容をログ表示
                    console && console.error && console.error('mark_delete failed', res);
                    if(res && res.message){ alert('ノード削除に失敗しました: ' + res.message); }
                    else { alert('ノード削除に失敗しました。'); }
                }
            }).fail(function(xhr,st,err){
                alert('通信エラーで削除できませんでした。');
                console && console.error && console.error('mark_delete ajax fail', st, err, xhr && xhr.responseText);
            }).always(function(){
                window._ktNodeDeleteInProgress[nodeId] = false;
                hideMenu();
            });
        }catch(err){ console && console.error && console.error('kt-conmenu-delete handler error', err); }
    });

    // キャンセル（main メニューの要素からのクリックのみ処理）
    $(document).on('click', '#kt-conmenu-cancel', function(e){
        try{
            if(!$menu || !$menu.length) return;
            var el = this;
            if($menu[0] !== el && $.contains($menu[0], el) === false){ return; }
            hideMenu();
        }catch(err){ }
    });
})();

// ダブルクリックで編集
// 新クラス名で編集可能。旧クラス名も後方互換で許容（トップ=kt-node-title, 子=kt-content-title）
$(document).on('dblclick', '.kt-node-title, .kt-content-title, .kt-title', function(){
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
            try{
                // ノード位置を維持するため、全体再描画は避ける。
                // DOM上の該当ノードだけタイトルを確実に更新し、ハイライトする。
                var $node = $('.kt-node[data-node-id="'+nodeId+'"]');
                if($node.length){
                    $node.find('.kt-node-title, .kt-content-title, .kt-title').first().text(newTitle);
                    $node.addClass('kt-renamed');
                    setTimeout(function(){ $node.removeClass('kt-renamed'); }, 1200);
                }
                console.log('タイトル更新完了', nodeId, newTitle);
            }catch(e){
                console.log('タイトル更新: DOM更新中に例外', e);
            }
        } else {
            console.error('タイトル履歴追加失敗', res);
            // 失敗した場合はユーザへ通知し、必要なら全体再取得で整合性を取る
            try{ alert('タイトルの保存に失敗しました。ページを再読み込みしてください。'); }catch(_){ }
        }
    }).fail(function(xhr,st,err){
        try{ alert('タイトル更新通信でエラーが発生しました。'); }catch(_){ }
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
        // Build combined list of selected fragment ids (primary + additional)
        var combined = [];
        try{
            if (typeof window.activeExternalizedId !== 'undefined' && window.activeExternalizedId !== null) {
                combined.push(String(window.activeExternalizedId));
            } else if (window.activeKnowledgeFragmentId) {
                combined.push(String(window.activeKnowledgeFragmentId));
            }
            if (window.kfrag_add_selected) {
                if (Array.isArray(window.kfrag_add_selected.ext)){
                    window.kfrag_add_selected.ext.forEach(function(x){ if(String(x).length && combined.indexOf(String(x)) === -1) combined.push(String(x)); });
                }
                if (Array.isArray(window.kfrag_add_selected.kfid)){
                    window.kfrag_add_selected.kfid.forEach(function(x){ if(String(x).length && combined.indexOf(String(x)) === -1) combined.push(String(x)); });
                }
            }
        }catch(_){ }

        $.ajax({
            url: 'php/save_knowledge_explorer.php',
            type: 'POST',
            dataType: 'json',
            data: (function(){
                var d = {
                    parent_node_id: parentId,
                    node_title: nodeTitle,
                    comment: commentText || '',
                    node_type: ''
                };
                // knowledge_fragment_id: UIバッジの表示リストからDOMを辿って外部化IDを取得しCSV化
                var extOnly = [];
                try{
                    var ids = [];
                    if (Array.isArray(window.kfrag_display_list) && window.kfrag_display_list.length){
                        ids = window.kfrag_display_list.slice();
                    } else {
                        // フォールバック: 主選択 + 追加選択（kfidベース）
                        if (typeof window.activeKnowledgeFragmentId !== 'undefined' && window.activeKnowledgeFragmentId !== null) {
                            ids.push(String(window.activeKnowledgeFragmentId));
                        } else if (typeof window.activeExternalizedId !== 'undefined' && window.activeExternalizedId !== null) {
                            ids.push(String(window.activeExternalizedId));
                        }
                        if (window.kfrag_add_selected && Array.isArray(window.kfrag_add_selected.kfid)){
                            window.kfrag_add_selected.kfid.forEach(function(k){ var ks = String(k); if(ks && ids.indexOf(ks) === -1) ids.push(ks); });
                        }
                    }
                    // kfid/display id から wrapper を見つけ、外部化IDへ正規化
                    ids.forEach(function(k){
                        try{
                            var $w = $('.fragment-node-wrapper').filter(function(){
                                var $t = $(this);
                                return String($t.data('knowledge-fragment-id')) === String(k) || String($t.data('externalized-id')) === String(k);
                            }).first();
                            var ext = ($w && $w.length) ? $w.data('externalized-id') : null;
                            if (ext !== null && typeof ext !== 'undefined'){
                                var sx = String(ext);
                                if (sx && extOnly.indexOf(sx) === -1){ extOnly.push(sx); }
                            }
                        }catch(__){ }
                    });
                }catch(__){ }
                if (extOnly.length){ d.knowledge_fragment_id = extOnly.join(','); }
                try{ console && console.debug && console.debug('[kfrag] KE submit payload', { areaLabel: areaLabel, parentId: parentId, extOnly: extOnly, data: d }); }catch(_){ }
                return d;
            })()
        }).done(function(res){
            if(res && res.status === 'ok'){
                console.log('knowledge_explorer 保存OK', res);
                try{ fetchKnowledgeTree(); }catch(_){ }
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
    initializeDiscussionBoard();
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

// Show other users' labels on utterance list: fetch remarked_utterances excluding current user
$(document).on('click', '#show-other-labels', function(){
    try{
        var btn = this;
        // toggle: if icons already present, remove them
        var existing = document.querySelectorAll('.utter_node_in_list .other-label-icon');
        if(existing && existing.length){
            existing.forEach(function(n){ n.parentNode && n.parentNode.removeChild(n); });
            try{ btn.textContent = '他者のラベルを表示'; }catch(_){ }
            return;
        }

        // collect utter ids displayed
        var els = document.querySelectorAll('.utter_node_in_list');
        var ids = Array.prototype.slice.call(els).map(function(el){ return el.getAttribute('id'); }).filter(Boolean);
        if(!ids.length) { alert('発話が見つかりません'); return; }

        // send to server
        $.ajax({
            url: 'php/get_other_remarks.php',
            type: 'POST',
            dataType: 'json',
            data: { utter_ids: JSON.stringify(ids) }
        }).done(function(res){
            if(!res || res.status !== 'ok' || !Array.isArray(res.items)){
                console && console.warn && console.warn('get_other_remarks failed', res);
                alert('他者ラベルの取得に失敗しました');
                return;
            }
            // place a grey icon at top-right of each matched utter_node_in_list
            var placed = 0;
            res.items.forEach(function(row){
                try{
                    var uid = row['utterance_id'];
                    var el = document.getElementById(String(uid));
                    if(!el) return;
                    // avoid duplicate icons
                    if(el.querySelector('.other-label-icon')) return;
                    var ic = document.createElement('span');
                    // normalize type string
                    var t = (row['type'] || 'UNKNOWN') + '';
                    t = t.toUpperCase().trim();
                    // map numeric types (1..4) to enum names if necessary
                    if (/^\d+$/.test(t)){
                        switch(parseInt(t,10)){
                            case 1: t = 'SELF'; break;
                            case 2: t = 'OTHER'; break;
                            case 3: t = 'ORGANIZATION'; break;
                            case 4: t = 'UNKNOWN'; break;
                            default: t = 'UNKNOWN'; break;
                        }
                    }
                    ic.className = 'other-label-icon type-' + t.replace(/[^A-Z0-9_-]/g,'');
                    ic.setAttribute('aria-hidden','true');
                    // display a short glyph in Japanese to indicate type
                    var glyph = '?';
                    try{
                        if(t === 'SELF') glyph = '自身';
                        else if(t === 'OTHER') glyph = '他者';
                        else if(t === 'ORGANIZATION') glyph = '組織';
                        else glyph = 'その他';
                    }catch(_){ glyph = 'その他'; }
                    ic.textContent = glyph;
                    // tooltip to explain
                    try{ ic.title = (t === 'SELF' ? '自身のラベル' : (t === 'OTHER' ? '他者のラベル' : (t === 'ORGANIZATION' ? '組織のラベル' : 'その他のラベル'))); }catch(_){ }
                    // append to element (positioned absolutely by CSS)
                    el.appendChild(ic);
                    placed++;
                }catch(e){ /* ignore per-item errors */ }
            });
            try{ if(placed > 0) btn.textContent = '他者ラベル非表示'; }catch(_){ }
        }).fail(function(xhr,st,err){
            console && console.error && console.error('get_other_remarks ajax fail', st, err, xhr && xhr.responseText);
            alert('通信エラーで取得できませんでした');
        });
    }catch(e){ console && console.error && console.error('show-other-labels handler error', e); }
});

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
    try { initializeFragmentsWorkspace(); } catch (e) { console.warn('initializeFragmentsWorkspace failed', e); }
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
        // 新仕様: ワークスペースがある場合は複製せず（カード自体がノード）
        if ($('#knowledge_fragments_workspace').length) return;
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

// === 統合ワークスペース: フラグメント自体をノード化して配置 ===
function initializeFragmentsWorkspace(){
    try { console && console.debug && console.debug('initializeFragmentsWorkspace called'); } catch(_){}
    var $ws = $('#knowledge_fragments_workspace');
    if ($ws.length === 0) return;
    var $list = $ws.find('.knowledge-fragment-list');
    if ($list.length === 0) return;
    var gap = 10;
    // タイトルの下から配置開始
    var baseTop = 0;
    var $title = $ws.children('.overlay-title').first();
    if ($title.length) {
        try { baseTop = $title.outerHeight(true) + 8; } catch(e){ baseTop = 28; }
    } else { baseTop = 28; }
    var x = 12, y = baseTop;
    // 既にノード化済みなら二重化を避ける
    $ws.find('.fragment-node-wrapper').remove();
    // フラグメント要素を配列化（PHP側は新しい順で返すため、表示はそのまま新しい順）
    var cardEls = $list.find('.knowledge_fragment').toArray();
    var totalCards = cardEls.length;

    // circled numbers mapping for 1..20; fallback to plain number string
    var circled = [null,'①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩','⑪','⑫','⑬','⑭','⑮','⑯','⑰','⑱','⑲','⑳'];

    cardEls.forEach(function(cardEl, idx){
        var $card = $(cardEl);
        // If server provided numeric fragment id (data-kfrag-num), prefer it so client/server numbering match
        var serverNum = null;
        try{ serverNum = parseInt($card.attr('data-kfrag-num'), 10); if(isNaN(serverNum)) serverNum = null; }catch(_){ serverNum = null; }
        // PHP が新しい順で返す前提のため、表示順はそのままにしつつ
        // 番号は古いノードから 1,2,3... と割り当てる。
        // したがって、現在のインデックス idx (0=最新) に対する番号は totalCards - idx
        var num = (serverNum !== null) ? serverNum : (totalCards - idx);
        var displayNum = (num > 0 && num < circled.length) ? circled[num] : String(num);
        var discussedStatus = ($card.attr('data-discussed') || '').trim();
        var extId = parseInt($card.attr('data-ext-id'),10); if(isNaN(extId)) extId = null;

        var $wrap = $('<div class="fragment-node-wrapper"></div>');
        $wrap.css({ left: x + 'px', top: y + 'px' });
        // 番号バッジを左上に追加
        var $badge = $('<div class="fragment-number-badge" aria-hidden="true"></div>').text(displayNum);
        $wrap.append($badge);

        // persist fragment id & display string & discussed status & externalized id
        try{ $wrap.data('knowledge-fragment-id', num); $wrap.data('knowledge-fragment-display', displayNum); $wrap.data('discussed-status', discussedStatus); if(extId!==null){ $wrap.data('externalized-id', extId); } }catch(e){}
        if(discussedStatus === 'UNDERWAY'){
            var $ind = $('<div class="fragment-discussed-indicator" aria-hidden="true">議論中</div>');
            $wrap.append($ind);
        }

        // 横並び初期配置のため現在の幅を参照
        try { $card.css('width','180px'); } catch(e){}
        $wrap.append($card.detach());
        $ws.append($wrap);
        enableFragmentDrag($wrap, $ws);
        var w = 180;
        try { w = Math.max(180, $card.outerWidth(true)); } catch(e){}
        x += w + gap;
    });
    // 元のリストコンテナは不要なので削除
    // After nodes created, attempt to load saved positions from server (by externalized id)
    try{
        var ids = [];
        $ws.find('.fragment-node-wrapper').each(function(){
            var ext = $(this).data('externalized-id');
            if(typeof ext !== 'undefined' && ext !== null && String(ext).length){ ids.push(parseInt(ext,10)); }
        });
        // capture the ORIGINAL initial snapshot (before applying saved server positions)
        try{ window.kfrag_positions_history.originalInitial = kfrag_capture_snapshot(); }catch(_){ }
        if(ids.length){
            loadPositionsFromServerForIds(ids, function(res){
                if(res && res.status === 'ok' && Array.isArray(res.items)){
                    // apply positions
                    res.items.forEach(function(it){
                        try{
                            var $w = $ws.find('.fragment-node-wrapper').filter(function(){ return $(this).data('externalized-id') === it.externalized_contents_id; }).first();
                            if($w && $w.length){
                                $w.css({ left: (parseInt(it.x,10)||0) + 'px', top: (parseInt(it.y,10)||0) + 'px' });
                            }
                        }catch(_){ }
                    });
                }
                // capture current initial snapshot after applying server positions
                try{ window.kfrag_positions_history.initial = kfrag_capture_snapshot(); updateKFragHistoryButtons(); }catch(_){ }
            });
        } else {
            try{ window.kfrag_positions_history.initial = kfrag_capture_snapshot(); window.kfrag_positions_history.originalInitial = window.kfrag_positions_history.initial; updateKFragHistoryButtons(); }catch(_){ }
        }
    }catch(_){ try{ window.kfrag_positions_history.initial = kfrag_capture_snapshot(); window.kfrag_positions_history.originalInitial = window.kfrag_positions_history.initial; updateKFragHistoryButtons(); }catch(__){} }
    $list.remove();

    // Click handler: selecting a fragment should target discussion to that fragment
    $(document).off('click.kfragselect', '.fragment-node-wrapper .knowledge_fragment, .fragment-node-wrapper');
    $(document).on('click.kfragselect', '.fragment-node-wrapper .knowledge_fragment, .fragment-node-wrapper', function(e){
        if ($(e.target).closest('.detail-button, .card-actions, .card-detail, a, button, input, textarea, select, label').length) return;
        var $wrap = $(this).closest('.fragment-node-wrapper');
        if (!$wrap.length) return;

        // If add-select mode active, toggle additional selection and refresh combined history
        try{
            if(window.kfrag_add_select_mode){
                window.kfrag_add_selected = window.kfrag_add_selected || { ext: [], kfid: [] };
                var addExt = null;
                try{ addExt = $wrap.data('externalized-id') || null; }catch(_){ addExt = null; }
                var addKfid = $wrap.data('knowledge-fragment-id') || null;
                var uid = (addExt !== null && addExt !== undefined && String(addExt).length) ? String(addExt) : String(addKfid);
                try{ console && console.debug && console.debug('[kfrag] click.kfragselect add-mode toggle', { addExt: addExt, addKfid: addKfid, uid: uid }); }catch(_){ }
                var idx = window.kfrag_add_selected.ext.indexOf(uid);
                if(idx === -1){
                    window.kfrag_add_selected.ext.push(uid);
                    window.kfrag_add_selected.kfid.push(String(addKfid));
                    $wrap.addClass('additional-selected');
                } else {
                    window.kfrag_add_selected.ext.splice(idx,1);
                    window.kfrag_add_selected.kfid.splice(idx,1);
                    $wrap.removeClass('additional-selected');
                }
                try{ 
                    // ensure display list keeps previous selections and primary
                    window.kfrag_display_list = window.kfrag_display_list || [];
                    // primary at index 0
                    var primaryId = (typeof window.activeKnowledgeFragmentId !== 'undefined' && window.activeKnowledgeFragmentId !== null) ? String(window.activeKnowledgeFragmentId) : ((typeof window.activeExternalizedId !== 'undefined' && window.activeExternalizedId !== null) ? String(window.activeExternalizedId) : null);
                    var display = [];
                    if(primaryId) display.push(primaryId);
                    if(window.kfrag_add_selected && Array.isArray(window.kfrag_add_selected.kfid)){
                        window.kfrag_add_selected.kfid.forEach(function(k){ var ks = String(k); if(ks && display.indexOf(ks) === -1) display.push(ks); });
                    }
                    window.kfrag_display_list = display;
                    try{ console && console.debug && console.debug('[kfrag] display_list updated', window.kfrag_display_list, { add_selected: window.kfrag_add_selected, primaryId: primaryId }); }catch(_){ }
                    updateFragmentSelectedList();
                }catch(_){ }
                try{
                    var combined = [];
                    if(window.activeExternalizedId) combined.push(window.activeExternalizedId);
                    else if(window.activeKnowledgeFragmentId) combined.push(window.activeKnowledgeFragmentId);
                    if(window.kfrag_add_selected && Array.isArray(window.kfrag_add_selected.ext)){
                        window.kfrag_add_selected.ext.forEach(function(x){ if(String(x).length) combined.push(x); });
                    }
                    combined = combined.filter(function(v,i){ return combined.indexOf(v) === i; });
                    try{ console && console.debug && console.debug('[kfrag] fetchDiscussionHistory with combined', combined); }catch(_){ }
                    if(combined.length === 0){ $('#discussion_message_list').empty(); }
                    else { fetchDiscussionHistory(combined); }
                }catch(__){ }

                // Auto-disable add-select mode after toggling selection and update button UI
                try{
                    window.kfrag_add_select_mode = false;
                    var $btnAdd = $('#fragment-add-select-toggle');
                    if($btnAdd && $btnAdd.length){ $btnAdd.removeClass('is-adding'); }
                }catch(_){ }

                return;
            }
        }catch(_){ }

        // Normal primary selection behavior
        var kfid = $wrap.data('knowledge-fragment-id') || null;
        var disp = $wrap.data('knowledge-fragment-display') || kfid;
        window.activeKnowledgeFragmentId = kfid;
        try{ window.activeExternalizedId = $wrap.data('externalized-id') || null; }catch(_){ window.activeExternalizedId = null; }
        try{ console && console.debug && console.debug('[kfrag] primary select', { kfid: kfid, ext: window.activeExternalizedId }); }catch(_){ }
        try{
            var $dtitle = $('#discussion_history_area').find('.overlay-title').first();
            if($dtitle && $dtitle.length){
                if($dtitle.find('.title-text').length){
                    $dtitle.find('.title-text').text('ディスカッション履歴');
                } else { $dtitle.text('ディスカッション履歴'); }
            }
        }catch(_){ }
        try{
            var fetchId = null;
            try{ fetchId = $wrap.data('externalized-id') || null; }catch(_){ fetchId = null; }
            if(fetchId === null) fetchId = kfid;
            // Clear additional selections when primary changes
            try{ if(window.kfrag_add_selected){ window.kfrag_add_selected = { ext: [], kfid: [] }; $('.fragment-node-wrapper.additional-selected').removeClass('additional-selected'); } }catch(_){ }
            try{ updateFragmentSelectedList(); }catch(_){ }
            try{ console && console.debug && console.debug('[kfrag] fetchDiscussionHistory(primary)', fetchId); }catch(_){ }
            fetchDiscussionHistory(fetchId);
        }catch(_){ }
        // When a fragment is selected, show the post form and remove any placeholder.
        try{
            var $formShow = $('#discussion_post_form');
            if($formShow && $formShow.length){ $formShow.show(); }
            var $ml = $('#discussion_message_list');
            if($ml && $ml.length){ $ml.find('.discussion-placeholder').remove(); }
            var $areaHide = $('#discussion_history_area');
            if($areaHide && $areaHide.length){ $areaHide.find('.discussion-placeholder').hide(); }
        }catch(_){ }
        try{
            var st = ($wrap.data('discussed-status')||'').trim();
            var $btn = $('#fragment-discussed-toggle');
            if($btn.length){
                if(st === 'UNDERWAY'){
                    $btn.text('議論中');
                    $btn.addClass('is-discussing');
                } else {
                    $btn.text('議論開始');
                    $btn.removeClass('is-discussing');
                }
            }
        }catch(__){ }
    });

    // Add Reset / Undo / Redo buttons to workspace title area
    try{
        var $title = $ws.children('.overlay-title').first();
        if($title && $title.length){
            if(!$title.find('#kfrag-reset').length){
                var $btnReset = $('<button type="button" id="kfrag-reset" class="kfrag-action-btn">Reset</button>');
                var $btnUndo = $('<button type="button" id="kfrag-undo" class="kfrag-action-btn" disabled>Undo</button>');
                var $btnRedo = $('<button type="button" id="kfrag-redo" class="kfrag-action-btn" disabled>Redo</button>');
                var $wrapBtns = $('<div class="kfrag-action-group" style="display:inline-block;margin-left:10px;"></div>');
                $wrapBtns.append($btnReset).append($btnUndo).append($btnRedo);
                $title.append($wrapBtns);
            }
        }
    }catch(_){ }

    // Button handlers
    $(document).off('click.kfrag_reset', '#kfrag-reset').on('click.kfrag_reset', '#kfrag-reset', function(){
        try{
            // Reset to the original initial layout (before any server-saved positions were applied)
            var target = null;
            if(window.kfrag_positions_history && window.kfrag_positions_history.originalInitial){
                target = window.kfrag_positions_history.originalInitial;
            } else if(window.kfrag_positions_history && window.kfrag_positions_history.initial){
                // fallback
                target = window.kfrag_positions_history.initial;
            }
            if(target){
                // push current into undo
                var cur = kfrag_capture_snapshot();
                window.kfrag_positions_history.undo.push(cur);
                kfrag_apply_snapshot(target);
                window.kfrag_positions_history.redo = [];
                updateKFragHistoryButtons();
            }
        }catch(e){ console && console.error && console.error('kfrag reset err', e); }
    });
    $(document).off('click.kfrag_undo', '#kfrag-undo').on('click.kfrag_undo', '#kfrag-undo', function(){ kfrag_undo(); });
    $(document).off('click.kfrag_redo', '#kfrag-redo').on('click.kfrag_redo', '#kfrag-redo', function(){ kfrag_redo(); });
}

function enableFragmentDrag($node, $container){
    var dragging = false, isDraggingThis = false, sx=0, sy=0, startL=0, startT=0;
    // クリック開始が操作系ならドラッグしない
    $node.on('mousedown', function(e){
        if ($(e.target).closest('.detail-button, .card-actions, .card-detail, a, button, input, textarea, select, label').length) return;
        dragging = true; isDraggingThis = true;
        sx = e.clientX; sy = e.clientY;
        var off = $node.position();
        startL = off.left; startT = off.top;
        e.preventDefault();
    });
    $(document).on('mousemove.kfrag', function(e){
        if(!dragging) return;
        var dx = e.clientX - sx, dy = e.clientY - sy;
        var nl = startL + dx, nt = startT + dy;
        // 左上は 0 以上に拘束。右/下方向はスクロール領域拡張のため拘束しない
        nl = Math.max(0, nl);
        nt = Math.max(0, nt);
        $node.css({ left: nl + 'px', top: nt + 'px' });
    });
    $(document).on('mouseup.kfrag', function(){
        // if this node was being dragged, capture a snapshot for undo
        if(isDraggingThis){
            try{ kfrag_capture_and_push_snapshot(); }catch(_){ }
        }
        dragging = false; isDraggingThis = false;
    });
}

// --- Fragment positions history utilities ---
window.kfrag_positions_history = window.kfrag_positions_history || { undo: [], redo: [], max: 40, initial: null };

function kfrag_capture_snapshot(){
    var snaps = [];
    $('.fragment-node-wrapper').each(function(){
        var $w = $(this);
        var ext = $w.data('externalized-id');
        if(typeof ext === 'undefined' || ext === null){
            // try attribute on inner node (fallback)
            try{ var s = $w.find('.knowledge_fragment').attr('data-ext-id'); if(typeof s !== 'undefined') ext = parseInt(s,10); }catch(_){ ext = null; }
        }
        if(ext === null || typeof ext === 'undefined' || isNaN(parseInt(ext,10))) return;
        var pos = $w.position();
        snaps.push({ externalized_contents_id: parseInt(ext,10), x: Math.round(pos.left), y: Math.round(pos.top) });
    });
    return snaps;
}

function kfrag_apply_snapshot(snaps){
    if(!Array.isArray(snaps)) return;
    snaps.forEach(function(it){
        try{
            var targetId = parseInt(it.externalized_contents_id,10);
            var $w = $('.fragment-node-wrapper').filter(function(){ return parseInt($(this).data('externalized-id'),10) === targetId; }).first();
            if($w && $w.length){
                $w.css({ left: (parseInt(it.x,10)||0) + 'px', top: (parseInt(it.y,10)||0) + 'px' });
            }
        }catch(_){ }
    });
}

function kfrag_capture_and_push_snapshot(){
    try{
        var snap = kfrag_capture_snapshot();
        if(!snap || snap.length === 0) return;
        // push into undo stack
        window.kfrag_positions_history.undo.push(snap);
        if(window.kfrag_positions_history.undo.length > window.kfrag_positions_history.max){
            window.kfrag_positions_history.undo.shift();
        }
        // clear redo on new action
        window.kfrag_positions_history.redo = [];
        // (optional) update undo/redo button enabled state
        updateKFragHistoryButtons();
    }catch(_){ }
}

function updateKFragHistoryButtons(){
    try{
        $('#kfrag-undo').prop('disabled', window.kfrag_positions_history.undo.length === 0);
        $('#kfrag-redo').prop('disabled', window.kfrag_positions_history.redo.length === 0);
    }catch(_){ }
}

function kfrag_undo(){
    if(window.kfrag_positions_history.undo.length === 0) return;
    var snap = window.kfrag_positions_history.undo.pop();
    // push current to redo
    var cur = kfrag_capture_snapshot();
    window.kfrag_positions_history.redo.push(cur);
    kfrag_apply_snapshot(snap);
    updateKFragHistoryButtons();
}

function kfrag_redo(){
    if(window.kfrag_positions_history.redo.length === 0) return;
    var snap = window.kfrag_positions_history.redo.pop();
    var cur = kfrag_capture_snapshot();
    window.kfrag_positions_history.undo.push(cur);
    kfrag_apply_snapshot(snap);
    updateKFragHistoryButtons();
}

function savePositionsToServer(cb){
    try{
        var snaps = kfrag_capture_snapshot();
        if(!snaps || snaps.length === 0){ if(cb) cb({status:'ok',items:[]}); return; }
        try{ console && console.debug && console.debug('savePositionsToServer: sending', snaps.length, 'items', snaps); }catch(_){ }
        $.ajax({
            url: 'php/save_positions.php',
            type: 'POST',
            dataType: 'json',
            data: { positions: JSON.stringify(snaps) }
        }).done(function(res){ if(cb) cb(res); }).fail(function(xhr,st,err){ if(cb) cb({status:'error',error:st}); });
    }catch(e){ if(cb) cb({status:'error',error:e.message}); }
}

function loadPositionsFromServerForIds(ids, cb){
    if(!ids || !ids.length){ if(cb) cb({status:'ok',items:[]}); return; }
    $.ajax({ url: 'php/get_positions.php', type: 'GET', dataType: 'json', data: { ids: ids.join(',') } }).done(function(res){ if(cb) cb(res); }).fail(function(xhr,st,err){ if(cb) cb({status:'error',error:st}); });
}

// Fetch discussion history for optional fragmentId (null => global board)
function fetchDiscussionHistory(fragmentId){
    try{ console && console.debug && console.debug('fetchDiscussionHistory', fragmentId); }catch(_){ }
    var $list = $('#discussion_message_list');
    if(!$list || !$list.length) return;
    // support passing an array of fragment ids to fetch combined history
    if(Array.isArray(fragmentId)){
        $list.empty();
        var ids = fragmentId.slice();
        var pending = ids.length;
        if(pending === 0) return;
        ids.forEach(function(id){
            var data = { limit: 200 };
            if(typeof id !== 'undefined' && id !== null){ data.fragment_id = id; }
            $.ajax({ url: 'php/get_discussion_history.php', type: 'GET', dataType: 'json', data: data }).done(function(res){
                if(res && res.status === 'ok' && Array.isArray(res.items)){
                    var $board = $('#discussion_board');
                    var boardUser = $board.data('user-name') || 'ユーザー';
                    res.items.forEach(function(item){
                        try{ if(item.discussion_history_id && $list.find('[data-discussion-id="'+item.discussion_history_id+'"]').length){ return; } }catch(_){ }
                        var uname = (item.user_name && item.user_name.length) ? item.user_name : boardUser;
                        var $card = $('<div class="message-card"></div>').attr('data-discussion-id', item.discussion_history_id || '');
                        var $author = $('<div class="message-author"></div>').text(uname + ' さん');
                        var $body = $('<div class="message-body"></div>').text(item.content || '');
                        $card.append($author).append($body);
                        if(item.posted_time){ var $time = $('<div class="message-time" style="margin-top:4px;font-size:11px;color:#888;"></div>').text(item.posted_time); $card.append($time); }
                        $list.append($card);
                    });
                } else {
                    console.warn('fetchDiscussionHistory failed for id', id, res);
                }
            }).fail(function(xhr,st,err){ console.error('fetchDiscussionHistory通信失敗', st, err, xhr && xhr.responseText); })
            .always(function(){ pending--; if(pending <= 0){ try{ $list.scrollTop($list.prop('scrollHeight')); }catch(_){ } } });
        });
        return;
    }

    $list.empty();
    var data = { limit: 200 };
    if(typeof fragmentId !== 'undefined' && fragmentId !== null){ data.fragment_id = fragmentId; }
    $.ajax({
        url: 'php/get_discussion_history.php',
        type: 'GET',
        dataType: 'json',
        data: data
    }).done(function(res){
        if(res && res.status === 'ok' && Array.isArray(res.items)){
            var $board = $('#discussion_board');
            var boardUser = $board.data('user-name') || 'ユーザー';
            res.items.forEach(function(item){
                // prevent duplicate rendering if the same discussion_history row already exists in the list
                try{
                    if(item.discussion_history_id && $list.find('[data-discussion-id="'+item.discussion_history_id+'"]').length){
                        return; // already rendered
                    }
                }catch(_){ }
                var uname = (item.user_name && item.user_name.length) ? item.user_name : boardUser;
                var $card = $('<div class="message-card"></div>').attr('data-discussion-id', item.discussion_history_id || '');
                var $author = $('<div class="message-author"></div>').text(uname + ' さん');
                var $body = $('<div class="message-body"></div>').text(item.content || '');
                $card.append($author).append($body);
                if(item.posted_time){ var $time = $('<div class="message-time" style="margin-top:4px;font-size:11px;color:#888;"></div>').text(item.posted_time); $card.append($time); }
                $list.append($card);
            });
            try{ $list.scrollTop($list.prop('scrollHeight')); }catch(_){ }
        } else {
            console.warn('fetchDiscussionHistory failed', res);
        }
    }).fail(function(xhr,st,err){
        console.error('fetchDiscussionHistory通信失敗', st, err, xhr && xhr.responseText);
    });
}

// === 掲示板: discussion_history_area ===
function initializeDiscussionBoard(){
    try{
        var $board = $('#discussion_board');
        if(!$board.length) return;
        var $form = $('#discussion_post_form');
        var $input = $('#discussion_input');
        var $list = $('#discussion_message_list');
        var $area = $('#discussion_history_area');
        // If no fragment is selected at initialization, hide the post form
        // and show a simple placeholder message asking the user to select a fragment.
        try{
            var noActive = (typeof window.activeKnowledgeFragmentId === 'undefined' || !window.activeKnowledgeFragmentId) && (typeof window.activeExternalizedId === 'undefined' || !window.activeExternalizedId);
            if(noActive){
                if($form && $form.length){ $form.hide(); }
                if($list && $list.length){
                    // show placeholder inside the message list area
                    var ph = '<div class="discussion-placeholder" style="padding:12px 10px;color:#666;">議論対象とするフラグメントを選択してください</div>';
                    $list.empty().append(ph);
                } else if($area && $area.length){
                    var $body = $area.find('.overlay-body').first();
                    if($body && $body.length){
                        if($body.find('.discussion-placeholder').length === 0){
                            $body.prepend('<div class="discussion-placeholder" style="padding:12px 10px;color:#666;">議論対象とするフラグメントを選択してください</div>');
                        } else {
                            $body.find('.discussion-placeholder').show();
                        }
                    }
                }
            } else {
                if($form && $form.length){ $form.show(); }
                if($area && $area.length){ $area.find('.discussion-placeholder').hide(); }
            }
        }catch(_){ }
        if(!$form.length || !$input.length || !$list.length) return;

        // 二重バインド防止: ただし既にバウンド済でもボタンが未作成ならボタンだけ追加する
        var alreadyBound = !!$form.data('bound');
        var $dtitle = $('#discussion_history_area').find('.overlay-title').first();
        var hasBtn = $dtitle.length && $dtitle.find('#fragment-discussed-toggle').length;
        if(alreadyBound && hasBtn) return;

        // 議論開始ボタン追加（初回のみ／バウンド済でボタン未作成の場合も追加）
        try{
            if($dtitle.length && !$dtitle.find('#fragment-discussed-toggle').length){
                // 既存テキストを壊さないよう、タイトルテキストを .title-text スパンでラップする
                if(!$dtitle.find('.title-text').length){
                    // wrap only text nodes into span.title-text
                    var nodes = $dtitle.contents().filter(function(){ return this.nodeType === 3 && this.nodeValue.trim().length > 0; });
                    if(nodes.length){
                        nodes.each(function(){
                            var $s = $('<span class="title-text"></span>');
                            $s.text($(this).text());
                            $(this).replaceWith($s);
                        });
                    } else {
                        // fallback: create empty span
                        $dtitle.prepend('<span class="title-text"></span>');
                    }
                }
                // set fixed title text
                try{ $dtitle.find('.title-text').text('ディスカッション履歴'); }catch(_){ }
                var $btn = $('<button type="button" id="fragment-discussed-toggle" class="fragment-discussed-btn">議論開始</button>');
                $dtitle.append($btn);
                // 追加フラグメント選択ボタン（+アイコン、ツールチップ付き）
                if(!$dtitle.find('#fragment-add-select-toggle').length){
                    var $btnAdd = $(
                        '<button type="button" id="fragment-add-select-toggle" class="fragment-add-select-btn" aria-label="追加のフラグメントを選択">'
                        + '<span class="plus-icon" aria-hidden="true">+</span>'
                        + '<span class="tooltip">追加のフラグメントを選択</span>'
                        + '</button>'
                    );
                    $dtitle.append($btnAdd);
                }
                // placeholder container for selected node list: insert after title (between title and message list)
                try{
                    var $selArea = $dtitle.next('#fragment-selected-area');
                    if(!$selArea || !$selArea.length){
                        $dtitle.after('<div id="fragment-selected-area" class="fragment-selected-area"><span class="selected-label">現在選択しているノード： </span><div id="fragment-selected-list" class="fragment-selected-list" aria-live="polite"></div></div>');
                    }
                }catch(_){ }
            }
        }catch(__){ }

        // 既存履歴ロード
        $.ajax({
            url: 'php/get_discussion_history.php',
            type: 'GET',
            dataType: 'json',
            data: { limit: 100 }
        }).done(function(res){
            if(res && res.status === 'ok' && Array.isArray(res.items)){
                    res.items.forEach(function(item){
                        // skip if this item already rendered (prevent duplicate display)
                        try{
                            if(item.discussion_history_id && $list.find('[data-discussion-id="'+item.discussion_history_id+'"]').length){
                                return; // already present
                            }
                        }catch(_){ }
                        var userName = $board.data('user-name') || 'ユーザー'; // 簡易: user_id を name解決しない（必要なら拡張）
                        var $card = $('<div class="message-card"></div>').attr('data-discussion-id', item.discussion_history_id || '');
                        var $author = $('<div class="message-author"></div>').text(userName + ' さん');
                        var $body = $('<div class="message-body"></div>').text(item.content || '');
                        $card.append($author).append($body);
                        if(item.posted_time){
                            var $time = $('<div class="message-time" style="margin-top:4px;font-size:11px;color:#888;"></div>').text(item.posted_time);
                            $card.append($time);
                        }
                        $list.append($card);
                });
                try { $list.scrollTop($list.prop('scrollHeight')); } catch(_){}
            } else {
                console.warn('discussion_history 初期ロード失敗', res);
            }
        }).fail(function(xhr,st,err){
            console.error('discussion_history 初期ロード通信失敗', st, err, xhr && xhr.responseText);
        });
        if(!alreadyBound){
            $form.on('submit', function(e){
                e.preventDefault();
                var text = ($input.val()||'').trim();
                if(!text){ return; }
                var user = $board.data('user-name') || 'ユーザー';
                // まずサーバーへ保存要求 (DB挿入) → 成功時UI反映
                var postData = { content: text };
                try{
                    // Build combined from the badge display list to ensure it matches UI selections
                    var combined = [];
                    var ids = [];
                    if (Array.isArray(window.kfrag_display_list) && window.kfrag_display_list.length){
                        ids = window.kfrag_display_list.slice();
                    } else {
                        // fallback to active + add_selected
                        if (typeof window.activeKnowledgeFragmentId !== 'undefined' && window.activeKnowledgeFragmentId !== null) {
                            ids.push(String(window.activeKnowledgeFragmentId));
                        } else if (typeof window.activeExternalizedId !== 'undefined' && window.activeExternalizedId !== null) {
                            ids.push(String(window.activeExternalizedId));
                        }
                        if (window.kfrag_add_selected && Array.isArray(window.kfrag_add_selected.kfid)){
                            window.kfrag_add_selected.kfid.forEach(function(k){ var ks = String(k); if(ks && ids.indexOf(ks) === -1) ids.push(ks); });
                        }
                    }
                    // Map knowledge/display IDs to externalized IDs by finding wrappers
                    ids.forEach(function(k){
                        try{
                            var $w = $('.fragment-node-wrapper').filter(function(){
                                var $t = $(this);
                                return String($t.data('knowledge-fragment-id')) === String(k) || String($t.data('externalized-id')) === String(k);
                            }).first();
                            var ext = ($w && $w.length) ? $w.data('externalized-id') : null;
                            if (ext !== null && typeof ext !== 'undefined'){
                                var sx = String(ext);
                                if (sx && combined.indexOf(sx) === -1){ combined.push(sx); }
                            }
                        }catch(__){ }
                    });
                    if (combined.length) {
                        postData.knowledge_fragment_id = combined.join(',');
                    }
                    try{ console && console.debug && console.debug('[kfrag] discussion submit payload', { idsFromBadges: ids, combinedExt: combined, postData: postData }); }catch(_){ }
                }catch(_){ }
                $.ajax({
                    url: 'php/save_discussion_history.php',
                    type: 'POST',
                    dataType: 'json',
                    data: postData
                }).done(function(res){
                    if(res && res.status === 'ok'){
                        var displayUser = (res.user_name && res.user_name.length) ? res.user_name : ($board.data('user-name') || 'ユーザー');
                        var bodyText = text; // DB反映された（切り詰め済みの場合は res.content を使用）
                        if(res.content){ bodyText = res.content; }
                        try{
                            if(res.discussion_history_id && $list.find('[data-discussion-id="'+res.discussion_history_id+'"]').length){
                                // already present (race), skip appending
                                $input.val('').focus();
                                return;
                            }
                        }catch(_){ }
                        var $card = $('<div class="message-card"></div>').attr('data-discussion-id', res.discussion_history_id || '');
                        var $author = $('<div class="message-author"></div>').text(displayUser + ' さん');
                        var $body = $('<div class="message-body"></div>').text(bodyText);
                        $card.append($author).append($body);
                        if(res.posted_time){
                            var $time = $('<div class="message-time" style="margin-top:4px;font-size:11px;color:#888;"></div>').text(res.posted_time);
                            $card.append($time);
                        }
                        $list.append($card);
                        try { $list.scrollTop($list.prop('scrollHeight')); } catch(_){ }
                        $input.val('').focus();
                        console.log('discussion_history 保存OK', res);
                    } else {
                        console.warn('discussion_history 保存失敗', res);
                        // 失敗時も暫定的に表示するか選択可。ここでは失敗なら表示しない。
                        if(window.alert){ alert('投稿の保存に失敗しました。'); }
                    }
                }).fail(function(xhr,st,err){
                    console.error('discussion_history 保存通信失敗', st, err, xhr && xhr.responseText);
                    if(window.alert){ alert('通信エラーにより投稿できませんでした。'); }
                });
            });
            // mark as bound to avoid duplicate binding later
            $form.data('bound', true);
        }
        // if a fragment is already active, load its history
        try{ if(window.activeKnowledgeFragmentId){ fetchDiscussionHistory(window.activeKnowledgeFragmentId); } }catch(_){ }
        try{ updateFragmentSelectedList(); }catch(_){ }
    }catch(ex){ try{ console.warn('initializeDiscussionBoard error', ex); }catch(_){}}
}

// 議論開始ボタンクリック: discussed をトグル (UNDERWAY <-> YET)
$(document).on('click', '#fragment-discussed-toggle', function(){
    var $btn = $(this);
    if(!window.activeKnowledgeFragmentId){ alert('フラグメントを選択してください'); return; }
    var $wrap = $('.fragment-node-wrapper').filter(function(){ return $(this).data('knowledge-fragment-id') === window.activeKnowledgeFragmentId; }).first();
    if(!$wrap.length){ alert('対象フラグメントが見つかりません'); return; }
    var extId = $wrap.data('externalized-id');
    if(!extId){ alert('外部化IDが取得できません'); return; }

    var current = ($wrap.data('discussed-status') || '').trim();
    var targetStatus = (current === 'UNDERWAY') ? 'YET' : 'UNDERWAY';

    $.ajax({
        url: 'php/update_discussed_status.php',
        type: 'POST',
        dataType: 'json',
        data: { externalized_contents_id: extId, status: targetStatus }
    }).done(function(res){
        if(res && res.status === 'ok'){
            $wrap.data('discussed-status', targetStatus);
            var $ind = $wrap.find('.fragment-discussed-indicator');
            if(targetStatus === 'UNDERWAY'){
                if(!$ind.length){
                    $ind = $('<div class="fragment-discussed-indicator" aria-hidden="true">議論中</div>');
                    $wrap.append($ind);
                } else {
                    $ind.text('議論中').show();
                }
                $btn.text('議論中');
                $btn.addClass('is-discussing');
            } else {
                if($ind.length){ $ind.remove(); }
                $btn.text('議論開始');
                $btn.removeClass('is-discussing');
            }
        } else {
            alert('更新に失敗しました');
            console.warn('update_discussed_status response error', res);
        }
    }).fail(function(xhr,st,err){
        alert('通信エラー: ' + st);
        console.error('update_discussed_status fail', st, err, xhr && xhr.responseText);
    });
});

// KRA 登録ボタン押下時: 議論を終了して表示を '議論終了' に変更し、外部化テーブルを DONE に更新
$(document).on('click', '#kra-submit', function(){
    try{
        // find the currently active fragment wrapper using global activeKnowledgeFragmentId
        if(!window.activeKnowledgeFragmentId){ return; }
        var $wrap = $('.fragment-node-wrapper').filter(function(){ return $(this).data('knowledge-fragment-id') === window.activeKnowledgeFragmentId; }).first();
        if(!$wrap.length) return;
        var extId = $wrap.data('externalized-id');
        if(!extId) return;

        // Only proceed if current status is UNDERWAY (議論中)
        var current = ($wrap.data('discussed-status') || '').trim();
        if(current !== 'UNDERWAY'){
            // still update UI to '議論終了' if desired even when not UNDERWAY? skip by default
            return;
        }

        $.ajax({
            url: 'php/update_discussed_status.php',
            type: 'POST',
            dataType: 'json',
            data: { externalized_contents_id: extId, status: 'DONE' }
        }).done(function(res){
            if(res && res.status === 'ok'){
                // update wrapper data and badge text
                $wrap.data('discussed-status', 'DONE');
                var $ind = $wrap.find('.fragment-discussed-indicator');
                if($ind.length){
                    $ind.text('議論終了');
                } else {
                    $ind = $('<div class="fragment-discussed-indicator" aria-hidden="true">議論終了</div>');
                    $wrap.append($ind);
                }
                // update toggle button appearance if present
                try{
                    var $btn = $('#fragment-discussed-toggle');
                    if($btn.length){
                        $btn.text('議論開始');
                        $btn.removeClass('is-discussing');
                    }
                }catch(_){ }

                // 併せて knowledge_explorer にも登録（追加カラム: knowledge_fragment_id, updated_by 対応）
                try{
                    var areaLabel = ($('select[name="knowledge_area"]').val() || '').trim();
                    var nodeTitle = ($('textarea[name="knowledge_content"]').val() || '').trim();
                    var commentText = ($('#kra_comment_input').val() || '').trim();
                    if(nodeTitle){
                        try{ console && console.debug && console.debug('[kfrag] kra-submit -> saveToKnowledgeExplorer', { areaLabel: areaLabel, nodeTitle: nodeTitle, commentText: commentText }); }catch(_){ }
                        saveToKnowledgeExplorer(areaLabel, nodeTitle, commentText);
                    } else {
                        try{ console && console.warn && console.warn('[kfrag] kra-submit: nodeTitle が空のため knowledge_explorer 登録はスキップ'); }catch(_){ }
                    }
                }catch(__){ }
            } else {
                console && console.warn && console.warn('update discussed to DONE failed', res);
            }
        }).fail(function(xhr,st,err){
            console && console.error && console.error('update discussed to DONE ajax fail', st, err, xhr && xhr.responseText);
        });
    }catch(e){ console && console.error && console.error('kra-submit discussed->DONE handler error', e); }
});

