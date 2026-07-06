var elab_count = 0;

function Rebuild_templete(){

	var temp = ["主語と述語が対応していない", "論理の飛躍がある", "読者によって解釈が異なる表現をしている", "内容が妥当でない", "内容が具体的でない", "分かりにくい表現をしている", "主観的な表現をしている", "必要な説明が省かれている"];

	for(i=0;i<temp.length;i++){

		var uuid = getUniqueStr(); // 添削テンプレートのidをランダム生成
		var quot_uuid = "\"" + uuid + "\""; // quotationをつけたuuid　関数の引数
		var quot_temp = "\"" + temp[i] + "\""; // quotationをつけたtemp[i]　関数の引数
	

		let label = "<ul>"+
					"<img src='image/list7.png' style='width: 15px; height: 15px;'>"+
					"<a href='#' id='"+uuid+"' onclick='Add_templete("+quot_uuid+","+quot_temp+")'>"+temp[i]+"</a>"+
					"</ul>";
	
		let area = $("#tensaku_templete");
		area.append(label);
		
	}

}

async function Rebuild_comment(){

    await $.ajax({
	    url: "php/comment_rebuild.php",
	    type: "POST",
	    success: function(arr){
            if(arr == "[]"){
            console.log(arr);
            }else{
            console.log(arr);
            var parse = JSON.parse(arr);

            elab_count++;
            $('#comment').show('fast');
            
            for(var i=0; i<parse.length; i++){
                
                var comment_id = parse[i].id; //添削コメントのid
                var quot_comment_id = "\"" + comment_id + "\""; // quotationをつけたcommentid　関数の引数
                var vid = parse[i].version_id; //添削バージョンのid
                var quot_vid = "\"" + vid + "\""; // quotationをつけたcommentid　関数の引数
                var user_name =  parse[i].user_name;
                var content =  parse[i].content; //コメントの自由記述
                
                let label = "<div class='tensaku_comment' id='"+comment_id+"' onclick='toggleselect("+quot_comment_id+", 0, "+quot_vid+");'>"+
                "<div>"+user_name+"追加</div>"+
                // "<input class='simple_btn' type='button' value='×' onclick='Remove_tensaku("+quot_comment_id+");' style='width:25px; height:25px; font-size:10px; float:right;'>"+
                // "<div class='tensaku_temp' id='"+comment_id+"tmp'></div>"+
                "<br>"+
                "<div class='tensaku_ito' id='"+comment_id+"ito'> " + content + " </div>"+
                "<br>"+                                                       
                "</div>";
            
                let area = $("#tensaku_area");
                area.append(label);

            }

            console.log("コメントOK");
	        }

        },error:function(){
            console.log("コメントエラーです");
        }
    });
}

async function Rebuild_add_to_comment(){

    await $.ajax({
	    url: "php/add_to_comment_rebuild.php",
	    type: "POST",
        data: { 
			version_id : version_id
		},
	    success: function(arr){
            if(arr == "[]"){
            console.log(arr);
            }else{
            console.log(arr);
            var parse = JSON.parse(arr);
            
            for(var i=0; i<parse.length; i++){
                
                var id = parse[i].id; //添削対象のid
                var type = parse[i].type; //添削対象のtype
                var comment_id = parse[i].comment_id; // 添削コメントのid

                if(modetype === 1 && type !== 'map'){
                    id = 'elab_' + id;
                }
                if(type === 'content'){
                    $("[node_id='" + id + "'].cspan").addClass("comment");
                    $("[node_id='" + id + "'].cspan").addClass(comment_id);

                } else if (type === 'map'){
                    $("[nodeid='" + id + "']").addClass("comment");
                    $("[nodeid='" + id + "']").addClass(comment_id);

                } else {
                    $("#" + id).addClass("comment");
                    $("#" + id).addClass(comment_id);
                }



                console.log(id);

            }

            console.log("コメントOK");
	        }

        },error:function(){
            console.log("コメントエラーです");
        }
    });

}

function Add_templete(uuid, temp, comment_id){

    let selected_area;

    if(!(comment_id)){
	    selected_area = $(".com_selected");
    } else {
        selected_area = document.getElementById(comment_id);
    }

	console.log("select",selected_area);
	console.log(uuid);
	console.log(temp);

	if(selected_area.length === 0){
		alert("添削コメントを選択してください")
		return;
	} else {
		let label = "<div class='add_tensaku_temp' id='"+uuid+"'>"+temp+"</div><br>";
		let area = selected_area.find('.tensaku_temp');

		console.log("before", area);
		area.append(label);
		console.log("after", area);
	}

}



function Add_tensaku(){

	var uuid = getUniqueStr(); // 添削コメントのidをランダム生成
    var quot_uuid = "\"" + uuid + "\""; // quotationをつけたuuid　関数の引数
    var qupt_version_id = "\"" + version_id + "\""; // quotationをつけたversionid　関数の引数

	let label = "<div class='tensaku_comment' id='"+uuid+"' onclick='toggleselect("+quot_uuid+", 1, null);'>"+
	"<input class='simple_btn' type='button' value='×' onclick='Remove_tensaku("+quot_uuid+");' style='width:25px; height:25px; font-size:10px; float:right;'>"+
	//"<div class='tensaku_temp' id='"+uuid+"tmp'></div>"+
	"<br>"+
	"<textarea class='tensaku_ito' id='"+uuid+"ito' onblur='Edit_comment(this,"+quot_uuid+");'></textarea>"+
	"<br>"+                                                       
    "</div>";

	let area = $("#tensaku_area");
	area.append(label);

    $.ajax({

        url: "php/comment_insert.php",
        type: "POST",
        data: {
          comment_id : uuid,
          version_id : version_id
        },
        success: function () {
          console.log("コメント作成成功：　" + uuid );
        },
        error: function () {
        console.log("コメント作成失敗");},
    });

    return uuid;

}

function add_to_comment(comment_id, type){

    if(!(comment_id)){
        var selected_comment = document.querySelector(".com_selected");
        console.log(selected_comment);
        if(!(selected_comment) && select_type != 0){
            alert("いずれかの自身のコメントを選択してください");
            return;
        }
        comment_id = selected_comment.id;

    }

    console.log(comment_id);

    console.log(type);

    var add_to_cpmment_id;

    if (type === 'map'){
        add_to_cpmment_id = select_map_id;
        console.log(add_to_cpmment_id);

    } else if (type === 'chapter'){
        add_to_cpmment_id = select_chap_id.replace('elab_', '');
        console.log(add_to_cpmment_id);

    } else if (type === 'section'){
        add_to_cpmment_id = select_sec_id.replace('elab_', '');
        console.log(add_to_cpmment_id);

    } else if (type === 'paragraph'){
        add_to_cpmment_id = select_para_id.replace('elab_', '');
        console.log(add_to_cpmment_id);

    } else if (type === 'content'){
        add_to_cpmment_id = select_con_id.replace('elab_', '');
        console.log(add_to_cpmment_id);

    }

    $.ajax({
		url: "php/add_to_comment_insert.php",
		type: "POST",
		data:
		{
            id : add_to_cpmment_id,
            type :  type,
			comment_id :  comment_id,
            version_id : version_id
		},
		success: function (arr) {
			console.log(arr);
		},
		error: function () {
			console.log("失敗");
		},
	});
    
}

function remove_add_to_comment(type){

    console.log(type);

    var add_to_cpmment_id;

    if (type === 'map'){
        add_to_cpmment_id = select_map_id;
        console.log(add_to_cpmment_id);

    } else if (type === 'chapter'){
        add_to_cpmment_id = select_chap_id.replace('elab_', '');
        console.log(add_to_cpmment_id);

    } else if (type === 'section'){
        add_to_cpmment_id = select_sec_id.replace('elab_', '');
        console.log(add_to_cpmment_id);

    } else if (type === 'paragraph'){
        add_to_cpmment_id = select_para_id.replace('elab_', '');
        console.log(add_to_cpmment_id);

    } else if (type === 'content'){
        add_to_cpmment_id = select_con_id.replace('elab_', '');
        console.log(add_to_cpmment_id);

    }

    $.ajax({

        url: "php/add_to_comment_delete.php",
        type: "POST",
        data: {
            type : "id",
            id : add_to_cpmment_id
        },
        success: function (arr) {
          console.log(arr);
        },
        error: function () {
        console.log("失敗");},
      });
    
}

function remove_add_to_comment_by_remove_comment(comment_id){
    
    $.ajax({

        url: "php/add_to_comment_delete.php",
        type: "POST",
        data: {
            type : "comment",
            comment_id : comment_id
        },
        success: function (arr) {
          console.log(arr);
        },
        error: function () {
        console.log("失敗");},
      });

}

function Edit_comment(obj, id){
    var content = obj.value;//変更されたテキストエリアの内容
    console.log(id);
  
    $.ajax({
  
        url: "php/comment_update.php",
        type: "POST",
        data: {
            update : "content",
            comment_id : id,
            content : content
        },
        success: function () {
          console.log("登録成功");
        },
        error: function () {
        console.log("登録失敗");},
  
    });
}

function Remove_tensaku(data){
  if(window.confirm('本当にこの添削コメントを削除しますか？')){

    console.log(document.getElementById(data));

		$('#'+data).fadeOut('fast').queue(function() {
			$('#'+data).remove();
		});
  }

  $.ajax({

    url: "php/comment_delete.php",
    type: "POST",
    data: {
      comment_id : data
    },
    success: function () {
      console.log("コメント削除成功：　" + data );
    },
    error: function () {
    console.log("コメント削除失敗");},
  });

  remove_annotation_by_remove_comment(data);

  remove_add_to_comment_by_remove_comment(data);

}

let select_type;

function toggleselect(selected_id, type, vid){

    if (type == 0 && version_id !=vid){
        version_id = vid;
        Create_diff_preview();
        Rebuild_add_to_comment();
        
    }
	
	var clickedDiv = document.getElementById(selected_id);
		
	// すべてのcommentから選択状態のスタイルを削除
	var allComments = document.querySelectorAll('.tensaku_comment');
	allComments.forEach(function(com) {
			com.classList.remove('com_selected');
	});

    // すべてのhighlightを削除
    var allHighlights = document.querySelectorAll('span[type="selected"]');
	allHighlights.forEach(function(high) {
        console.log(high);
        removeHightlightHover(high.id, "selected");
    });

    $(".highlight").removeClass("highlight");
		
	// クリックされたcommentに選択状態のスタイルを適用
	clickedDiv.classList.add('com_selected');
    select_type = type;

    //クリックされたcommentに対応するhighlightを付与
    var s = parseInt(clickedDiv.getAttribute('start_char_id'));
    var e = parseInt(clickedDiv.getAttribute('end_char_id'));
    for(let count=0; count <= (e - s); count++){
        let char_id = s + count; 
        let char_id_txt = 'p_txt_'+char_id;  
        addHightlightHover(char_id_txt, "selected");
    }
    console.log(selected_id);
    console.log($("."+selected_id));
    $("."+selected_id).addClass("highlight");
    $("[node_id='" + selected_id + "'].cspan").addClass("highlight");
    $("[nodeid='" + selected_id + "']").addClass("highlight");
}

    // HTMLエスケープ処理の関数
    function escapeHTML(str) {
        return str.replace(/[&<>"']/g, function (match) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[match];
        });
    }

function Create_diff_preview(){ //差分表示プレビューを作成して表示する関数　形式は西田システム準拠

    //プレビュー
    var mixtext = "";
  
    mixtext += "<div id='scenario_title'>"+document.getElementById("scenario_title").value+"</div>";
  
    console.log(mixtext);
  
    var chapter_dom = document.getElementsByClassName("chapter");
    for (i=0;i<chapter_dom.length;i++){
      mixtext += "<div id='"+chapter_dom[i].id+"' class = 'chapter'><p class = 'chapter_title'>"+chapter_dom[i].children[1].value+"</p>";
  
      var section_dom = chapter_dom[i].getElementsByClassName("section");
      console.log(section_dom)
      for (j=0;j<section_dom.length;j++){
        mixtext += "<div id='"+section_dom[j].id+"' class = 'section'><p class = 'section_title'>"+section_dom[j].children[1].value+"</p>";
    
        var paragraph_dom = section_dom[j].getElementsByClassName("thread");
        for (k=0;k<paragraph_dom.length;k++){
          mixtext += "<div id='"+paragraph_dom[k].id+"' class = 'paragraph'><p class = 'paragraph_title'>"+paragraph_dom[k].children[1].value+"</p>";
  
          mixtext += quills[paragraph_dom[k].id].root.innerHTML+"</div>";
        }
        mixtext+= "</div><br>"
      }
      mixtext+= "</div><br><br>"
    }

    var dmp = new diff_match_patch();

    var diff = dmp.diff_main(version_content[version_id], mixtext);
    dmp.diff_cleanupSemantic(diff); // セマンティッククリーニングを行うことをお勧めします
    
    var diffHTML = '';
    for (var i = 0; i < diff.length; i++) {
        var change = diff[i];
        if (change[0] === 0) {
            diffHTML += change[1]; 
        } else if (change[0] === -1) {
            diffHTML += '<del>' + change[1] + '</del>'; 
        } else if (change[0] === 1) {
            diffHTML += '<ins>' + change[1] + '</ins>'; 
        }
    }
    
    //document.getElementById("chapter_area").innerHTML = diffHTML;
    
    console.log(diffHTML);
      
    // 論文のHTMLファイルを入力（選択）して，それをSPANを挟むよう変換して，対象のテキストエリアに挿入するボタンクリックイベントを追加する
    const new_span = document.createElement('span'); // 改行はいやなのでspan
    new_span.setAttribute('id', 'rebuild');
    new_span.innerHTML = diffHTML; //html要素に変換
  
    // テキストエリアに表示する
    const area = $("#preview_area");
    area.empty();
    area.append(new_span); // bodyに追加

    //* こっからSPANを突っ込む処理 *//
    const add_span = () => {
        // 再帰関数を定義して、各文字に対して<span>タグを付与する
        const recursive_leaf_apply = (target_dom) => {
            if (target_dom.contents().length === 0) {
                // もしこれ以上子要素がない＝SPANを追加したい対象の論文文字列である可能性がある場合
                if (target_dom.context.nodeName === '#text') {
                    // <ins>で囲まれている文字には<span>を付与しない
                    if (target_dom.parent().get(0).nodeName === 'ins') {
                        return;
                    }
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

        // 各<span>タグにIDを付与する関数を定義
        const add_id = () => {
            // spanで区切られた文字にidを付与する
            const ptolength = $(".paper_txt_obj").length;
            $(".paper_txt_obj").each((index, elm) => {
                $(elm).attr({
                    'char_id': 'p_txt_' + index
                });
            });
        }

        // 対象となるDOMの要素を選択する
        const before_spanned_text = $('#rebuild');

        // <ins> タグで囲まれた文字には <span> を付与しないようにする
        recursive_leaf_apply(before_spanned_text.contents().not('ins')); // <ins> タグ以外に適用

        // 文字にIDを付与する
        add_id();
        }

        // add_span 関数を呼び出して、SPANタグを追加
        add_span();
}