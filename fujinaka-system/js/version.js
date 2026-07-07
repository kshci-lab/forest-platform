var elab_quills = [];
var version_id;

var version_content = [];
var node_feedback = [];

var select_map_id; //推敲時に使用　添削者が選択しているmapnodeのid
var select_chap_id; //推敲時に使用　添削者が選択しているchapterのid
var select_sec_id; //推敲時に使用　添削者が選択しているsectionのid
var select_para_id; //推敲時に使用　添削者が選択しているparagraphのid
var select_con_id; //推敲時に使用　添削者が選択しているcontentのid

async function save_version(){

	const version_id = getUniqueStr(); // Versionのidをランダム生成
	var scenario_title = document.getElementById("scenario_title").value;

	await $.ajax({
		url: "php/version_insert.php",
		type: "POST",
		data:
		{
			version_id :  version_id,
			paper_title : scenario_title
		},
		success: function (arr) {
			console.log(arr);
		},
		error: function () {
			console.log("失敗");
		},
	});

}

//マップver更新ボタンをクリック
var mapSnapshotButton = document.getElementById("map-snapshot-button");
function MapSnapShot(){

    //map_versionsを更新
    $.ajax({
        url: "php/version_update.php",
        type: "POST",
        data: { data : "map"},
        success: function(e){
          if(e == 'null'){
            alert("マップverが更新されました");
            // show_edit_reason();();
          }else{
            console.log(e);
            var nodes = JSON.parse(e);
            for(var i=0; i<Object.keys(nodes).length; i++){
              NodeVersionUpdate(nodes[i]);
            }
            alert("マップverと変更があったノードのverが更新されました");
            // show_edit_reason();();
          }
        }
    });

    $('#comment_balloon').hide();
    $('#comment_balloon').fadeIn(1000);
}

// ノード更新ボタンが押された時の処理
function NodeVersionUpdate(nodeIdOverride){

    var nodeVERSION = jsMind.util.uuid.newid();
    var node = nodeIdOverride ? _jm.get_node(nodeIdOverride) : _jm.get_selected_node();
    if(!node){
      return;
    }
    var nodeID = node.id;
    var class_name = Get_NodeInfo(nodeID, 'class').split(' ')[0]; // 'XXX selected'になっているのでselectedを取り除く
    var type_name = Get_NodeInfo(nodeID, 'type');
    var parentID = node.parent.id;
    var nodeTEXT = node.topic;
    var conceptID = Get_NodeInfo(nodeID, 'concept_id');
    var x = node._data.view.abs_x;
    var y = node._data.view.abs_y;

    //　node_type_idを取得
    $.ajax({
      url: "php/get_Typeid.php",
      type: "POST",
      data: { class: class_name, type: type_name },
      success: function(response) {
        const typeID = JSON.parse(response)['node_type_id'];
        
        //　node_type_idを取得できたらversion更新
        $.ajax({
          url: "php/version_insert.php",
          type: "POST",
          data: { 
                  data : "node",
                  node_version_id : nodeVERSION,
                  node_id : nodeID,
                  node_type_id: typeID,
                  parent_id : parentID,
                  content : nodeTEXT,
                  concept_id: conceptID,
                  x: x,
                  y: y,
                },
    
          success: function (res) {
             if(res){
              console.log(res);
             }
             var jmnode = document.querySelectorAll("jmnode[nodeid='" + nodeID + "']");
             for(var i=0; i<jmnode.length; i++){
               jmnode[i].removeAttribute("edited-node");
             }
          },
          error: function () {
            console.log("node_versionsに保存失敗");
          },
      });
      },
      error: function(error) {
        console.log("エラー:", error);
      }
    });
}

function rebuild_version_area(){

	$.ajax({

		url: "php/version_rebuild.php",
		type: "POST",
		data: { 
			val : "area",
			version_id :  ""
		},
		success: function(arr){
			if(arr == "[]"){
				console.log(arr);
			}else{
				console.log(arr);
				var parse = JSON.parse(arr);
	
				console.log(parse);
				
				for(var i=0; i<parse.length; i++){
					const id = parse[i].id;
					const user = parse[i].user;
					const title = parse[i].title;
					const content = parse[i].content;
					const time = parse[i].time;

					const quot_id = "\"" + id + "\"";
	
					let label = "<div class='version' id='"+id+"' onclick = 'rebuild_version(" + quot_id + ")' value='バージョン' style='background-color:white; padding:10px;'>"+
									"<span>"+user+"</span>"+
									"<br>"+
									"<span id = 'title_"+id+"'>"+title+"</span>"+
									"<br>"+
									"<span>"+time+"</span>"+
									"<br>"+
								"</div>";
					
					let area = $("#version_area");
					area.append(label);

					version_content[id] = content;
				
				}
			}

		},
		error: function(){
			console.log("ajaxエラー");
		}

	});

}

async function rebuild_version(vid){

	version_id = vid;

	 _jm = null; // jsmind_container
	 mind = null;
	 document.getElementById("elab_jsmind_container").innerHTML = "";
	 document.getElementById("elab_document_area").innerHTML = "<div id='elab_document_title'><div class='elab_document_purpose'><div id='elab_scenario_title' class='elab_document_title_area' class='statement' onfocus='TextboxClick()'placeholder='論文タイトル' style='width:91%;'></div></div></div><div id='elab_chapter_area'></div>";
	 document.getElementById("elab_preview_area").innerHTML = "";
	 document.getElementById("tensaku_area").innerHTML = "";
	 

	var tensaku_options = {
		container:'elab_jsmind_container',
		// theme:'nephrite',
		editable:false
	}

	_jm = new jsMind(tensaku_options);
	_jm.show();

	id_array = [];
	concept_id_array = [];
	content_array = [];
	type_array = [];
	parent_id_array = [];

	//map復元
	await $.ajax({

		url: "php/version_rebuild.php",
		type: "POST",
		data: { 
			val : "map",
			version_id : version_id
		},
		success: function(arr){

			var parse = JSON.parse(arr);
			console.log(parse);

			for(var i=0; i<parse.length; i++){

				id_array.push(parse[i].id);
				concept_id_array.push(parse[i].concept_id);
				content_array.push(parse[i].content);
				type_array.push(parse[i].type);
				parent_id_array.push(parse[i].parent_id);

			}

		},
		error: function(){
		console.log("ajaxエラー");

		}

	});

	for(var i=0; i<id_array.length; i++){

		if(parent_id_array[i] == "root"){

			// rootを親に持つノードを表示
			// mindmap.jsへ受け渡す
			show_node(id_array[i],parent_id_array[i],content_array[i],concept_id_array[i],type_array[i],"");

		}

	}

	var jmnode = document.getElementsByTagName("jmnode");

	for(i=0; i<jmnode.length; i++){

		for(var j=0; j<id_array.length; j++){

			//入れ子構造で全検索
			if(jmnode[i].getAttribute("nodeid") == parent_id_array[j]){

				// rootを親に持たないノードを表示
				if(parent_id_array[j] != "root"){
					//mindmap.jsへ受け渡す
					show_node(id_array[j],parent_id_array[j],content_array[j],concept_id_array[j],type_array[j],"");
					jmnode = document.getElementsByTagName("jmnode");

				}

			}

		}

	}

	//title復元
	document.getElementById("elab_scenario_title").innerHTML = document.getElementById("title_"+version_id).innerHTML;

	//chapter復元
	await $.ajax({
		url: "php/version_rebuild.php",
		type: "POST",
		data: { 
			val : "chapter",
			version_id : version_id
		},
		success: function(arr){
			if(arr == "[]"){
				console.log(arr);
			}else{
				var parse = JSON.parse(arr);

				parse.sort(function(a, b) {//並び替え
					return a.rank - b.rank;
				});

				console.log(parse); //並び替えた結果を表示
				
				for(var i=0; i<parse.length; i++){
					const id = parse[i].id;
					const title = parse[i].title;

					let label = "<div class='chapter elab' id='elab_"+id+"' value='章' style='background-color:white; padding:10px;'>"+
									"<span class = 'tspan' tabindex='0' ondblclick='return false;'>"+title+"</span>"+
									"<br>"+
									"<div class='section_area'>"+
									"</div>"+
									"<br>"+
								"</div>";
					
					let area = $("#elab_chapter_area");
					area.append(label);
				
				}
			}
		},
		error: function(){
			console.log("章エラーです");
		}
	});

	//section復元
	await $.ajax({
		url: "php/version_rebuild.php",
		type: "POST",
		data: { 
			val : "section",
			version_id : version_id
		},
		success: function(arr){
			if(arr == "[]"){
				console.log(arr);
			}else{
				var parse = JSON.parse(arr);

				parse.sort(function (a, b) {//並び替え
					
					let compareChapter = a.chapter_id.localeCompare(b.chapter_id);
					
					if (compareChapter === 0) {
						return a.rank - b.rank;
					}

					return compareChapter;
			});


				console.log(parse); //並び替えた結果を表示
				
				for(var i=0; i<parse.length; i++){
					const id = parse[i].id;
					const chapter_id =  parse[i].chapter_id;
					const title = parse[i].title;

					let label = "<div class='section elab' id='elab_"+id+"' value='節' style='background-color:white; padding:10px;'>"+
					"<span class = 'tspan' tabindex='0' ondblclick='return false;'>"+title+"</span>"+
					"<br>"+
					"<div class='paragraph'>"+
					"</div>"+
					"<br>"+
					"</div>";

					let area = $( ".section_area", "#elab_" + chapter_id + "");
					area.append(label);
				}
			}
		},
		error:function(){
			console.log("エラーです");
		}
	});

	
	paragraph_id_array = [];
	paragraph_content_array = [];

	//paragraph復元
	await $.ajax({
		url: "php/version_rebuild.php",
		type: "POST",
		data: { 
			val : "paragraph",
			version_id : version_id
		},
		success: function(arr){
			if(arr == "[]"){
				console.log(arr);
			}else{
				var parse = JSON.parse(arr);

				parse.sort(function (a, b) {//並び替え
					
					let comparesection = a.section_id.localeCompare(b.section_id);
					
					if (comparesection === 0) {
						return a.rank - b.rank;
					}

					return comparesection;
				});
				
				console.log(parse); //並び替えた結果を表示
				
				for(var i=0; i<parse.length; i++){
					const paragraph_id = parse[i].id;
					const section_id = parse[i].section_id;
					const paragraph_title = parse[i].title;
					const paragraph_content = parse[i].content;

					const quot_paragraph_id = "\"" + paragraph_id + "\"";

					paragraph_id_array.push(paragraph_id);
					paragraph_content_array.push(paragraph_content);

					let label = "<div class='thread elab' id='elab_"+paragraph_id+"' value='パラグラフ' data-node_id='' style='background-color:white; padding:10px; margin-top:10px; margin-bottom:10px; margin-right:10px; margin-left:5px;'>"+
					"<span class = 'tspan' tabindex='0 ondblclick='return false;'>"+paragraph_title+"</span>"+
					"<br>"+
					"<div class='purpose'>"+
					"</div>"+
					"<br>"+
					"<input id='elab_btn_"+paragraph_id+"' type='button' value='テキストを表示' onclick='elab_Toggletext("+quot_paragraph_id+");' style='width:100px; height:25px; font-size:10px; float:right;'>"+
					"<br>"+
					"<div id='elab_container_"+paragraph_id+"' style='display: none;'>"+
					  "<div id ='elab_editor_"+paragraph_id+"'></div>"+
					"</div>"+
					"</div>";

					let area = $( ".paragraph", "#elab_" + section_id + "");
					area.append(label);


					console.log(area);

				}

			}
		},
		error:function(){
			console.log("エラーです");
		}
	});

	elab_quills = [];

	for (let i = 0; i < paragraph_id_array.length; i++) {
		var elab_quill = new Quill('#elab_editor_'+paragraph_id_array[i]+'', { //Quillインスタンス
			theme: 'snow',
			readOnly: true, // 読み取り専用モードに設定
			modules: {
				toolbar: false // ツールバーを無効にする
			}
		  });
	  
		  // 対応するCSSを動的に追加する
		  var style = document.createElement('style');
		  style.textContent = '#elab_editor_' + paragraph_id_array[i] + ' { min-height: 200px; }';
		  document.head.appendChild(style);
		  
		  elab_quills[paragraph_id_array[i]] = elab_quill; // オブジェクトにQuillインスタンスを格納
			
		  elab_quill.root.innerHTML = paragraph_content_array[i];

	}

	console.log(elab_quills);
		


	//content復元
	await $.ajax({
		url: "php/version_rebuild.php",
		type: "POST",
		data: { 
			val : "content",
			version_id : version_id
		},
		success: function(arr){

			if(arr == "[]"){
				console.log(arr);
			}else{
				var parse = JSON.parse(arr);
				console.log(parse);

				for(var i=0; i<parse.length; i++){
					for(var j=0; j<parse.length; j++){
						if(String(i) == parse[j].rank){
							const content_id = parse[j].content_id;
							const node_id = parse[j].node_id;
							const quot_node_id = "\"" + node_id + "\""; // quotationをつけたid　関数の引数
							const content = parse[j].content;
							const paragraph_id = parse[j].paragraph_id;
							const type = parse[j].type;
							const indent = parse[j].indent;
					
							let label = "<div id='elab_"+content_id+"' class='scenario_content'>"+
											"<span node_id='elab_"+node_id+"' class = 'cspan elab' name = '"+indent+"' style = 'width:calc(100% - 25px)' type='"+type+"' tabindex='0' onclick='Check_feedback("+quot_node_id+");'>"+content+"</span>"+
										"</div>";

							$('#elab_'+paragraph_id).children('.purpose').append(label);
							$('#elab_'+paragraph_id).data('node_id', node_id);
							
							var dom_target = document.querySelector('.elab[node_id="elab_' + node_id + '"]');

							console.log(dom_target);

							if(type=="toi"){
								dom_target.style.backgroundColor = "#cce5ff";
								dom_target.setAttribute("type","toi");
							} else{
								dom_target.style.backgroundColor = "#fff3cd";
								dom_target.setAttribute("type","answer");
							}
							
							if(parse[j].concept_id != ""){
								const concept_id = parse[j].concept_id;
								dom_target.setAttribute("concept_id",concept_id);
							}

						}
					}
				}
			}
		},
		error:function(){
			console.log("エラーです");
		}
	});


	const span_dom = document.querySelectorAll('.cspan.elab');

	console.log(span_dom);


	for(var i=0; i<span_dom.length; i++){
		const indent = span_dom[i].getAttribute("name");
		const target_dom = span_dom[i];
		switch(indent){
			case "1":
				target_dom.style.width = "calc(100% - 45px)";
				target_dom.style.marginLeft = "20px";
				break;
			case "2":
				target_dom.style.width = "calc(100% - 65px)";
				target_dom.style.marginLeft = "40px";
				break;
			case "3":
				target_dom.style.width = "calc(100% - 85px)";
				target_dom.style.marginLeft = "60px";
				break;
		}
	}

	if(!(version_content[version_id])){

		elab_Create_preview();

	} else {

		elab_display_preview(version_content[version_id]);

	}



	//feedback復元
	await $.ajax({
		url: "php/version_rebuild.php",
		type: "POST",
		data: { 
			val : "feedback",
			version_id : version_id
		},
		success: function(arr){

			if(arr == "[]"){
				console.log(arr);
			}else{
				var parse = JSON.parse(arr);
				console.log(parse);
				
				node_feedback = parse;
				
			}
		},
		error:function(){
			console.log("エラーです");
		}
	});


	//comment復元
	await $.ajax({
		url: "php/version_rebuild.php",
		type: "POST",
		data: { 
			val : "my_comment",
			version_id : version_id
		},
		success: function(arr){
			if(arr == "[]"){
				console.log(arr);
			}else{
				var parse = JSON.parse(arr);
				console.log(parse); 
				
				for(var i=0; i<parse.length; i++){
					const id = parse[i].id;
					const quot_id = "\"" + id + "\""; // quotationをつけたid　関数の引数

					const content = parse[i].content;

					let label = "<div class='tensaku_comment' id='"+id+"' onclick='toggleselect("+quot_id+", 1, null);'>"+
					"<input class='simple_btn' type='button' value='×' onclick='Remove_tensaku("+quot_id+");' style='width:25px; height:25px; font-size:10px; float:right;'>"+
					//"<div class='tensaku_temp' id='"+id+"tmp'></div>"+
					"<br>"+
					"<textarea class='tensaku_ito' id='"+id+"ito' onblur='Edit_comment(this,"+quot_id+");'>"+content+"</textarea>"+
					"<br>"+                                                       
					"</div>";
				
					let area = $("#tensaku_area");
					area.append(label);
				
				}
			}
		},
		error: function(){
			console.log("エラーです");
		}
	});

	await $.ajax({
		url: "php/version_rebuild.php",
		type: "POST",
		data: { 
			val : "others_comment",
			version_id : version_id
		},
		success: function(arr){
			if(arr == "[]"){
				console.log(arr);
			}else{
				var parse = JSON.parse(arr);
				console.log(parse);
				
				for(var i=0; i<parse.length; i++){
					const id = parse[i].id;
					const quot_id = "\"" + id + "\""; // quotationをつけたid　関数の引数

					const user_name = parse[i].user_name;

					const content = parse[i].content;

					let label = "<div class='tensaku_comment' id='"+id+"' onclick='toggleselect("+quot_id+", 2, null);'>"+
					"<div>"+user_name+"追加</div>"+
					//"<div class='tensaku_temp' id='"+id+"tmp'></div>"+
					"<br>"+
					"<div class='tensaku_ito' id='"+id+"ito'>"+content+"</div>"+
					"<br>"+                                                       
					"</div>";
				
					let area = $("#tensaku_area");
					area.append(label);
				
				}
			}
		},
		error: function(){
			console.log("エラーです");
		}
	});

	get_user_id();

	Rebuild_annotation();

	Rebuild_add_to_comment();

	// コンテキストメニューの更新処理
    updateContextMenu(); 

}

// コンテキストメニューを更新する関数
function updateContextMenu() {

	var elab_mm_menu = document.getElementById('elab_map_conmenu');  //コンテキストメニュー
	var elab_mm_area = document.getElementById('elab_jsmind_container');     //対象エリア

	var elab_chap_menu = document.getElementById('elab_chapter_conmenu');   //コンテキストメニュー
	var elab_chap_area = document.querySelectorAll('.chapter.elab');   //対象エリア

	var elab_sec_menu = document.getElementById('elab_section_conmenu');   //コンテキストメニュー
	var elab_sec_area = document.querySelectorAll('.section.elab');    //対象エリア

	var elab_para_menu = document.getElementById('elab_paragraph_conmenu'); //コンテキストメニュー
	var elab_para_area = document.querySelectorAll('.thread.elab'); //対象エリア

	var elab_con_menu = document.getElementById('elab_content_conmenu'); //コンテキストメニュー
	var elab_con_area = document.querySelectorAll('.cspan.elab'); //対象エリア
	console.log(elab_con_area);
  
	var body = document.body;                       //bodyエリア
  
	// 推敲時にマップ上で右クリック時に独自コンテキストメニューを表示する
	elab_mm_area.addEventListener('contextmenu',function(e){
	  elab_mm_menu.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
	  elab_mm_menu.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
	  elab_mm_menu.classList.add('on');

	// 右クリックされたエリアのIDなどの情報を取得する
	select_map_id = get_selected_nodeid();
	console.log(select_map_id);
	});
  
	// 推敲時に章の上で右クリック時に独自コンテキストメニューを表示する
	// NodeListを配列に変換
	var elab_chap_area_array = Array.from(elab_chap_area);
	elab_chap_area_array.forEach(function(area) {
	  area.addEventListener('contextmenu', function(e) {
		e.preventDefault(); // デフォルトの右クリックメニューを無効化
  
		// メニューの位置を設定
		elab_chap_menu.style.left = (e.pageX + 10) + 'px';
		elab_chap_menu.style.top = (e.pageY + 10) + 'px';
  
		// メニューを表示する
		elab_chap_menu.classList.add('on');
  
		// 右クリックされたエリアのIDなどの情報を取得する
		select_chap_id = area.id
		console.log(select_chap_id);
	  });
	});
  
	// 推敲時に節の上で右クリック時に独自コンテキストメニューを表示する
	var elab_sec_area_array = Array.from(elab_sec_area);
	elab_sec_area_array.forEach(function(area) {
	  area.addEventListener('contextmenu', function(e) {
		e.preventDefault(); // デフォルトの右クリックメニューを無効化
  
		// メニューの位置を設定
		elab_sec_menu.style.left = (e.pageX + 10) + 'px';
		elab_sec_menu.style.top = (e.pageY + 10) + 'px';
  
		// メニューを表示する
		elab_sec_menu.classList.add('on');
  
		// 右クリックされたエリアのIDなどの情報を取得する
		select_sec_id = area.id;
		console.log(select_sec_id);
	  });
	});
  
	// 推敲時にパラグラフの上で右クリック時に独自コンテキストメニューを表示する
	var elab_para_area_array = Array.from(elab_para_area);
	elab_para_area_array.forEach(function(area) {
	  area.addEventListener('contextmenu', function(e) {
		e.preventDefault(); // デフォルトの右クリックメニューを無効化
  
		// メニューの位置を設定
		elab_para_menu.style.left = (e.pageX + 10) + 'px';
		elab_para_menu.style.top = (e.pageY + 10) + 'px';
  
		// メニューを表示する
		elab_para_menu.classList.add('on');
  
		// 右クリックされたエリアのIDなどの情報を取得する
		select_para_id = area.id;
		console.log(select_para_id);
	  });
	});
  
	// 推敲時にパラグラフのノード上で右クリック時に独自コンテキストメニューを表示する
	var elab_con_area_array = Array.from(elab_con_area);
	elab_con_area_array.forEach(function(area) {
	  area.addEventListener('contextmenu', function(e) {
		e.preventDefault(); // デフォルトの右クリックメニューを無効化
  
		// メニューの位置を設定
		elab_con_menu.style.left = (e.pageX + 10) + 'px';
		elab_con_menu.style.top = (e.pageY + 10) + 'px';
  
		// メニューを表示する
		elab_con_menu.classList.add('on');
  
		// 右クリックされたエリアのIDなどの情報を取得する
		select_con_id = area.getAttribute("node_id");;
		console.log(select_con_id);
	  });
	});
	
  
	// 左クリック時に独自コンテキストメニューを非表示にする
	body.addEventListener('click',function(){

	  if(elab_mm_menu.classList.contains('on')){
		elab_mm_menu.classList.remove('on');
	  }
	  if(elab_chap_menu.classList.contains('on')){
		elab_chap_menu.classList.remove('on');
	  }    
	  if(elab_sec_menu.classList.contains('on')){
		elab_sec_menu.classList.remove('on');
	  }
	  if(elab_para_menu.classList.contains('on')){
		elab_para_menu.classList.remove('on');
	  }
	  if(elab_con_menu.classList.contains('on')){
		elab_con_menu.classList.remove('on');
	  }
	});
}

function elab_Toggletext(textid){
  
	var toggleContainer = $('#elab_container_'+textid+'');
	toggleContainer.toggle();
  
	var buttonText = $('elab_#btn_'+textid+'').val();
	$('#elab_btn_'+textid+'').val(buttonText == 'テキストを表示' ? 'テキストを非表示' : 'テキストを表示');
  
}

function Check_feedback(node_id){

	console.log(node_id);

	document.getElementById("feedback_area").innerHTML = "";

	console.log(node_feedback);

	const f_array = Array.prototype.slice.call(node_feedback);

	const f_text = f_array.filter(fe => fe.node_id == node_id);

	if (f_text.length > 0) {
		const feedbackList = document.createElement('div');
        f_text.forEach(item => {
            const feedbackItem = document.createElement('div');
			feedbackItem.className = 'feedback';		
            if (item.feedback_status === '0') {
                feedbackItem.textContent = item.content + " を考えると意思決定しました";
				feedbackItem.style.backgroundColor = "#e6ffe6"; // 背景色を緑に変更
            } else {
                feedbackItem.textContent = item.content + " を考えないと意思決定しました";
				feedbackItem.style.backgroundColor = "#ffe6e6"; // 背景色をピンクに変更
            }
            feedbackList.appendChild(feedbackItem);
			console.log(feedbackList);
        });
        document.getElementById("feedback_area").appendChild(feedbackList);
    }

}

function elab_Create_preview(){ //プレビューを作成して表示する関数　形式は西田システム準拠

	//プレビュー
	var mixtext = "";
  
	mixtext += "<div id='elab_scenario_title'>"+document.getElementById("elab_scenario_title").innerHTML+"</div>";
  
	console.log(mixtext);
  
	var chapter_dom = document.querySelectorAll(".chapter.elab");
	for (i=0;i<chapter_dom.length;i++){

		if(!(chapter_dom[i].children[0].value)){
			chapter_dom[i].children[0].value = "";
		}
	  	mixtext += "<div id='elab_"+chapter_dom[i].id+"_preview' class = 'elab_chapter_preview'><p class = 'chapter_title'>"+chapter_dom[i].children[0].innerHTML+"</p>";
  
	  	var section_dom = chapter_dom[i].querySelectorAll(".section.elab");
	  	for (j=0;j<section_dom.length;j++){

			console.log(section_dom[j].children[0]);

			if(!(section_dom[j].children[0].value)){
				section_dom[j].children[0].value = "";
			}

			mixtext += "<div id='elab_"+section_dom[j].id+"_preview' class = 'elab_section_preview'><p class = 'section_title'>"+section_dom[j].children[0].innerHTML+"</p>";
		
			var paragraph_dom = section_dom[j].querySelectorAll(".thread.elab");
			for (k=0;k<paragraph_dom.length;k++){

				console.log(paragraph_dom[k].children[0]);

				if(!(paragraph_dom[k].children[0].value)){
					paragraph_dom[k].children[0].value = "";
				}

				mixtext += "<div id='elab_"+paragraph_dom[k].id+"_preview' class = 'elab_paragraph_preview'><p class = 'paragraph_title'>"+paragraph_dom[k].children[0].innerHTML+"</p>";

				if(!(elab_quills[paragraph_id_array[k]].root.innerHTML)){
					elab_quills[paragraph_id_array[k]].root.innerHTML = "";
				}
  
				mixtext += elab_quills[paragraph_id_array[k]].root.innerHTML+"</div>";
			}
			mixtext+= "</div><br>"
	 	}
	  	mixtext+= "</div><br><br>"
	}
	
	mixtext = mixtext.replace(/'/g, "''");
	console.log(mixtext);

	$.ajax({
		url: "php/version_insert.php",
		type: "POST",
		data: { 
			val : "paper_content",
			version_id : version_id,
			content : mixtext
		},
		success: function(arr){
			console.log(arr);
		},
		error: function(){
			console.log("エラーです");
		}
	});

	elab_display_preview(mixtext);
}

function elab_display_preview(mixtext) {
	// 論文のHTMLファイルを入力（選択）して，それをSPANを挟むよう変換して，対象のテキストエリアに挿入するボタンクリックイベントを追加する
	const new_span = document.createElement('span'); // 改行はいやなのでspan
	new_span.setAttribute('id', 'rebuild');
	new_span.innerHTML = mixtext; //html要素に変換
  
	//テキストエリアに表示する
	const area = $("#elab_preview_area");
	area.empty();
	area.append(new_span); //bodyに追加
  
	//* こっからSPANを突っ込む処理 *//
	const add_span = () => {
		const recursive_leaf_apply = (target_dom) => {
			if(target_dom.contents().length === 0) {
				// もしこれ以上子要素がない＝SPANを追加したい対象の論文文字列である可能性がある場合
				if(target_dom.context.nodeName === '#text') {
					// 空のオブジェクトではなく，実際に文字列である場合，SPANでくくって，ID付与
					const tmp = [...target_dom.context.nodeValue].map(char => {
						// 元のオブジェクトが１つのSPANに複数の文字が入ってる場合があるので，各文字に対してSPAN付与
						return "<span class='paper_txt_obj' >" + char + "</span>";
					}).join('');
					target_dom.replaceWith(tmp); // DOMオブジェクトの置き換え
					return; // この条件にマッチしてるときは条件分岐移行の処理を殺す
				}
			}
			target_dom.contents().each((ind, elm) => {
				// もし，子要素にさらにDOMがある場合（＝さらに掘り下げたところに文字があるかも知れない場合），再帰して，子要素に対してSPAN付与の必要性チェック
				return recursive_leaf_apply($(elm));
			});
		}
  
		const add_id = () => {
			//spanで区切られた文字にidを付与する
			const ptolength=$(".paper_txt_obj").length;
			$(".paper_txt_obj").each((index, elm) => {
				$(elm).attr({
					'char_id': 'p_txt_'+index
				});
			});
		}
  
		const before_spanned_text = $('#elab_preview_area');
		recursive_leaf_apply(before_spanned_text); // PDF2HTMLEXで変換・スクリプトで一部だけ取得したHTMLファイルの中身を取得して，SPANを付与
		add_id();
	  }
	  add_span();
}
