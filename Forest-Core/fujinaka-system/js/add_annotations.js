// アノテーションする文章の文字データを格納するjson kii-fujinaka変更 nodeidがcommentidに変更されています，ただ，nodeidとcommentidは基本的に型が同じなので，変えなくてもほとんどの部分は困らないとは思います．また，新しいtype=tensakuが追加されてます
let annotations=[]; //annotation_text_anno_object
let anno_obj={}; //kii-fujinaka変更　名前かぶりのため変更
let user_id;

async function get_user_id(){

    await $.ajax({

		url: "php/get_user_id.php",
		type: "POST",
		success: function(id){
			var parse = JSON.parse(id);
            user_id = parse;
        },
		error: function(){
			console.log("ajaxエラー");
		}

	});
}

// function Rebuild_paper(area_id){
//     $.ajax({
//         url: "php/paper_rebuild.php",
//         type: "POST",
//         success: function(paper){
        
//             var area = document.getElementById(area_id);
//             $('#'+ area_id ).empty();
//             var span = document.createElement('span'); // 改行はいやなのでspan
//             span.setAttribute('id', 'rebuild');
//             span.innerHTML = paper; //html要素に変換   
//             area.append(span); //document_areaに追加

//             Rebuild_annotation(); //アノテーションも再現する
//         },
//         error:function(){
//             console.log("エラーです");
//         }
//     });

// }
  
//アノテーション再現の関数
const Rebuild_annotation = () => { //kii-fujinaka変更

    $.ajax({
		url: "php/version_rebuild.php",
		type: "POST",
		data: { 
			val : "annotation",
			version_id : version_id
		},
		success: function(arr){
			if(arr == "[]"){
				console.log(arr);
			}else{
				var parse = JSON.parse(arr);
				console.log(parse);

				addHightlightSentences(parse);
				annotations = parse;
			}
		},
		error: function(){
			console.log("エラーです");
		}
	});

}





// -------------------------------ハイライト追加関数定義------------------------------------------

let addHightlightChar = (char_anno_object_id, type) => {
    // ある文字にハイライトを反映する関数
    //const anno_object_elm = document.getElementById(char_anno_object_id)
    const anno_object_elm = $("span[char_id='"+char_anno_object_id+"']");

    console.log(anno_object_elm);

    if(anno_object_elm !== null){
        anno_object_elm.attr('type', type);
    }
};

let addHightlightHover = (char_anno_object_id, type) => {
    // ある文字にハイライトを反映する関数
    //const anno_object_elm = document.getElementById(char_anno_object_id)
    const anno_object_elm = $("span[char_id='"+char_anno_object_id+"']");

    if(anno_object_elm !== null){
        anno_object_elm.addClass(type);
        console.log(anno_object_elm);
    }
};

let removeHightlightHover = (char_anno_object_id, type) => {
    // ある文字にハイライトを反映する関数
    //const anno_object_elm = document.getElementById(char_anno_object_id)
    const anno_object_elm = $("span[char_id='"+char_anno_object_id+"']");

    if(anno_object_elm !== null){
        anno_object_elm.removeClass(type);
        console.log(anno_object_elm);
    }
};


    
// let addHightlightSentences = (text_anno_object, hightlight_list) => {
let addHightlightSentences = (hightlight_list) => {
    // 文単位でハイライトする処理
    hightlight_list.forEach((anno_obj, index) => {
        for(let count=0; count <= (anno_obj.end_char_id - anno_obj.start_char_id); count++){
            let char_id = anno_obj.start_char_id + count;
            let char_id_txt = 'p_txt_'+char_id;
            let type = anno_obj.type;
            // let type = "toi";
            // let dup = findCharDuplication(text_anno_object, hightlight_list, char_id);
            // let paren = 0.5 * dup;
            // let paren = 0.5;
            addHightlightChar(char_id_txt, type);
        }
        $("[id='"+anno_obj.comment_id+"']").attr("start_char_id", anno_obj.start_t_id);
        $("[id='"+anno_obj.comment_id+"']").attr("end_char_id", anno_obj.end_t_id);
    });
};




const remove_annotation = () => {

      //右クリック時にクリックしたdocument_area上のp_txt_idを取得
      let selected_anno_p_id = window.getSelection().anchorNode.parentElement.getAttribute("char_id").substr(6);
      console.log(selected_anno_p_id);
      
      // annotation配列からselected_anno_p_idが当てはまるオブジェクトのリストを取得
      const filterdAnnotations = annotations.filter((annotation) => {
          return (annotation.start_char_id <= selected_anno_p_id && 
                  selected_anno_p_id <= annotation.end_char_id);
          // nishida　見つけれん勝った時用になにか必要あるかも　https://cpoint-lab.co.jp/article/202010/17597/
      });

      // 見つけたノードidから nishida 修正必要　一番最新のアノテーションを取得する
      if(filterdAnnotations.length>1){
        for (let i = filterdAnnotations.length - 1; i < filterdAnnotations.length; i--) {
            if (filterdAnnotations[i].user_id != user_id){
                var target_anno_anno_obj = filterdAnnotations[i];
                break;
            }
        }
      }else{
          var target_anno_anno_obj = filterdAnnotations[0];
      }
        console.log(target_anno_anno_obj);
      var anno_id = target_anno_anno_obj.id;
    // removeAnnotationSentences(target_anno_anno_obj);



    //   削除実行
        for(let count=0; count <= (target_anno_anno_obj.end_char_id - target_anno_anno_obj.start_char_id); count++){
            let char_id = target_anno_anno_obj.start_char_id + count;
            const anno_object_elm = $("span[char_id='p_txt_"+char_id+"']");
            console.log(anno_object_elm);
            if(anno_object_elm !== null ){
                anno_object_elm.removeAttr('type');
            }
        }
        
        $.ajax({

            url: "php/update_anno.php",
            type: "POST",
            data: { 
                // update : "delete",
                    id : anno_id },
    
        });
};

const remove_annotation_by_remove_comment = (comment_id) => { //kii-fujinaka追加 コメント削除に伴うアノテーション削除
    
    // annotation配列からcomment_idが当てはまるオブジェクトのリストを取得
    const filterdAnnotations = annotations.filter(annotation => comment_id == annotation.comment_id);

    console.log(filterdAnnotations);
    
    //  削除実行
    for (let i = 0; i < filterdAnnotations.length; i++) {

        var target_anno_anno_obj = filterdAnnotations[i];
        var anno_id = target_anno_anno_obj.id;

        for(let count=0; count <= (target_anno_anno_obj.end_char_id - target_anno_anno_obj.start_char_id); count++){
            let char_id = target_anno_anno_obj.start_char_id + count;
            const anno_object_elm = $("span[char_id='p_txt_"+char_id+"']");
            console.log(anno_object_elm);
            if(anno_object_elm !== null){
                anno_object_elm.removeAttr('type');
            }
        }

        $.ajax({

            url: "php/update_anno.php",
            type: "POST",
            data: { 
                // update : "delete",
                    id : anno_id },

        });
        
        
    }

};


//ハイライトボタンでannotationを追加する
function add_annotation(comment_id){//kii-fujinaka変更　追加先をノードからコメントへ

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

    let selected_anno_obj = window.getSelection().toString().length;

    
    console.log(selected_anno_obj);
    
    // 論文の文字を先に選択してるか判定
    if(selected_anno_obj != 0){
        console.log("anchorNode:", selected_anno_obj.parentElement);
        let start_t_id_str = window.getSelection().anchorNode.parentElement.getAttribute("char_id").substr(6);
        let end_t_id_str = window.getSelection().focusNode.parentElement.getAttribute("char_id").substr(6);
       
        let start_t_id = parseInt(start_t_id_str, 10);
        let end_t_id = parseInt(end_t_id_str, 10);
        var paper_content = window.getSelection().toString();

        let s = Number.isNaN(start_t_id);
        let e = Number.isNaN(end_t_id);

        

        // 論文の文字を先に選択してるか判定
        if(s != true && e != true && paper_content.length > 0) {
            
            // let annotation_id =parseInt(Date.now().toString());//idの生成　何回やってもintにしたらOut of range value for columnで怒られちゃった
            let annotation_id =Date.now().toString();
            
            // 利用者が文字を後ろから選択したとき
            if(end_t_id < start_t_id){
                start_t_id=parseInt(window.getSelection().anchorNode.parentElement.getAttribute("char_id").substr(6), 10);
                end_t_id = parseInt(window.getSelection().focusNode.parentElement.getAttribute("char_id").substr(6), 10);
            }
            
    
    
            anno_obj.id = annotation_id;
            anno_obj.start_char_id= start_t_id;
            anno_obj.end_char_id = end_t_id;
            anno_obj.type="comment";
            anno_obj.comment_id=comment_id;
            anno_obj.user_id=user_id;
            anno_obj.content=paper_content;
            annotations.push(anno_obj);

            $("[id='"+comment_id+"']").attr("start_char_id", start_t_id);
            $("[id='"+comment_id+"']").attr("end_char_id", end_t_id);
                  
            console.log(annotations);
    
        //文単位でハイライト
        for(let count=0; count <= (anno_obj.end_char_id - anno_obj.start_char_id); count++){
            let char_id = anno_obj.start_char_id + count;
            let char_id_txt = 'p_txt_'+char_id;

            console.log(char_id_txt);


            addHightlightChar(char_id_txt, "comment"); 
    
    
        }
    
    
        $.ajax({
    
            url: "php/insert_annotation.php",
            type: "POST",
            data: { 
                // insert : "annotation",
                    id :  annotation_id,
                    start_char_id : start_t_id,
                    end_char_id : end_t_id,
                    type : "comment",
                    content : paper_content,
                    comment_id : comment_id,
                    version_id : version_id
                 },
                    success: function (sql) {
                        console.log(sql);
                      },
                      error: function () {
                      console.log("登録失敗");},
    
        });
    
        }else{
            alert('論文のテキストを先に選択してください または 選択した論文のテキストを正しくよみとれませんでした')
        }

    }else{
        alert('論文のテキストを先に選択してください')
    }

  
    };


//kii-fujinaka 以下使ってません

// ノードを選択して新しくアノテーションを付与する
    // function annotation_toNode(){
        
    //     var node_id = get_selected_nodeid();

    //         let this_node_type = GetType(node_id);            
    //         // なんかでnode_type取得            
            
    //         var jmnode = document.getElementsByTagName("jmnode");
    //         for(i=0; i<jmnode.length; i++){
    //             if(jmnode[i].getAttribute("nodeid") == node_id){//回ってきたidが選択中ノードの時
                    
    //                 let content = jmnode[i].innerHTML;

    //                 if(content =="＊筆者の主張"){
    //                     var topic = window.getSelection().toString();

    //                     var node = _jm.update_node(node_id,topic);

    //                     $.ajax({

    //                         url: "php/update_node.php",
    //                         type: "POST",
    //                         data: { update : "content",
    //                                 id : node_id,
    //                                 content : topic }

    //                     });
    //                     add_Cnode_parentid(node_id, "criticism");

    //                 }else if(content == "＊あなたの予測"){
    //                     var topic = window.getSelection().toString();

    //                     var node = _jm.update_node(node_id,topic);

    //                     $.ajax({

    //                         url: "php/update_node.php",
    //                         type: "POST",
    //                         data: { update : "content",
    //                                 id : node_id,
    //                                 content : topic }

    //                     });

    //                     add_Anode_parentid(node_id);

    //                 }
    //                 // console.log(jmnode[i]);

    //             }
    //             }
            
    //         add_annotation(this_node_type, node_id);



    //     };


        
    //      //type取得関数
    //     function GetType(id){
    //         var jmnode = document.getElementsByTagName("jmnode");
    //         for(i=0; i<jmnode.length; i++){
    //             if(jmnode[i].getAttribute("nodeid") == id){//回ってきたidが選択中ノードの時
                    
    //                 console.log(jmnode[i]);
    //                 var type = jmnode[i].getAttribute("type");//typeを代入

    //             }
    //                 if(type != undefined){
    //                 break;
    //                 }
    //             }
    //         console.log(type);
    //         return type;
    //     }
       

// ---------------------------------------ノード追加---------------------------------------


// //問いノード追加ボタンで問いノードを追加する
// function add_Qnode2(){

//   var parent_node = _jm.get_selected_node();

//   for(key in parent_node){

//       if(key == "id"){

//           var parent_id = parent_node[key];

//       }

//   }

//   var nodeid = jsMind.util.uuid.newid();//idの生成
//   if (window.getSelection().toString().length != 0){
//     var topic = window.getSelection().toString();
//   }else{
//     var topic = "New Node";
//   }
  
//   var parent = document.getElementById("document_area");

//   var node = _jm.add_node(parent_node, nodeid, topic);

// //   var nodeid1 = new Date().getTime().toString();//idの生成
// //   var x = document.querySelectorAll("topic span"); // p要素の中にいるspan要素を取得
//   let myDiv = document.createElement('div'); // element creation
//   var jmnode = document.getElementsByTagName("jmnode");

//   for(var i=0; i<jmnode.length; i++){

//       if(nodeid == jmnode[i].getAttribute("nodeid")){

//           jmnode[i].setAttribute("concept_id","");
//           jmnode[i].setAttribute("type","toi");
//           jmnode[i].setAttribute("parent_id",parent_id);
//           jmnode[i].className = "";


//           $.ajax({

//               url: "php/insert_node.php",
//               type: "POST",
//               data: { insert : "node",
//                       id : nodeid,
//                       parent_id : parent_id,
//                       type : "toi",
//                       concept_id : "",
//                       x : jmnode[i].style.left,
//                       y : jmnode[i].style.top,
//                       content : jmnode[i].innerHTML,
//                       class : "question" },

//           });

//           //yoshioka登録　追加ボタンより自作の問いを追加したこと
//           //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
//           Record_activities(nodeid,
//                             parent_id,
//                             "add",
//                             jmnode[i].innerHTML,
//                             jmnode[i].getAttribute("concept_id"),
//                             "question",
//                             jsMind.util.uuid.newid()
//                            );



//       }

//   }

//   $.ajax({

//       url: "php/update_node.php",
//       type: "POST",
//       data: { update : "map" }

//   });
//     if(window.getSelection().toString().length != 0){
//     add_annotation("toi", nodeid);
//     mouseoverNode();
//     }
//     var parent_id = nodeid; //追加した問いノード
//     var nodeid = jsMind.util.uuid.newid();//idの生成
//     var topic = '＊あなたの解釈';
//     var node = _jm.add_node(parent_id, nodeid, topic);

//     var jmnode = document.getElementsByTagName("jmnode");
// 	var p_concept = parent_concept_id;


//     for(var j=0; j<jmnode.length; j++){

//         if(nodeid == jmnode[j].getAttribute("nodeid")){

//             jmnode[j].setAttribute("concept_id",p_concept);
//             jmnode[j].setAttribute("type","predict");
//             jmnode[j].setAttribute("parent_id",parent_id);

//             $.ajax({

//                 url: "php/insert_node.php",
//                 type: "POST",
//                 data: { insert : "node",
//                         id : nodeid,
//                         parent_id : parent_id,
//                         type : "predict",
//                         concept_id : p_concept,
//                         x : jmnode[j].style.left,
//                         y : jmnode[j].style.top,
//                         content : jmnode[j].innerHTML,
//                         class : "" },

//             });

//             //yoshioka登録　追加ボタンより答えを追加したこと
//             //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
//             Record_activities(nodeid,
//                               parent_id,
//                               "add",
//                               jmnode[j].innerHTML,
//                               p_concept,
//                               "predict",
//                               jsMind.util.uuid.newid()
//                              );



//         }

//     }


//     //マップ編集時間更新
//     $.ajax({

//         url: "php/update_node.php",
//         type: "POST",
//         data: { update : "map" }

//     });



// };




// //答えノード追加ボタンで答えノードを追加する
// function add_Anode2(node_type){

//   var selected_node = _jm.get_selected_node();

//   for(key in selected_node){

//       if(key == "id"){

//           var parent_id = selected_node[key];

//       }

//   }

//   var nodeid = jsMind.util.uuid.newid();//idの生成

//   var topic = window.getSelection().toString();;
//   if (topic == ""){
//     add_Anode(node_type, node_type);
//     return;
//   }

//   var node = _jm.add_node(selected_node, nodeid, topic);

//   var jmnode = document.getElementsByTagName("jmnode");

//   for(var i=0; i<jmnode.length; i++){

//       if(parent_id == jmnode[i].getAttribute("nodeid")){

//           var p_concept = jmnode[i].getAttribute("concept_id");

//       }

//   }

//   for(var j=0; j<jmnode.length; j++){

//       if(nodeid == jmnode[j].getAttribute("nodeid")){

//           jmnode[j].setAttribute("concept_id",p_concept);
//           jmnode[j].setAttribute("type",node_type);
//           jmnode[j].setAttribute("parent_id",parent_id);

//           $.ajax({

//               url: "php/insert_node.php",
//               type: "POST",
//               data: { insert : "node",
//                       id : nodeid,
//                       parent_id : parent_id,
//                       type : node_type,
//                       concept_id : p_concept,
//                       x : jmnode[j].style.left,
//                       y : jmnode[j].style.top,
//                       content : jmnode[j].innerHTML,
//                       class : "" },

//           });

//           //yoshioka登録追加ボタンより答えを追加したこと
//           //渡す情報（ノードID，親ノードID，操作，テキスト，法造コンセプトID，タイプ，primary）
//           Record_activities(nodeid,
//                             parent_id,
//                             "add",
//                             jmnode[j].innerHTML,
//                             p_concept,
//                             node_type,
//                             jsMind.util.uuid.newid()
//                            );



//       }

//   }

//   $.ajax({

//       url: "php/update_node.php",
//       type: "POST",
//       data: { update : "map" }

//   });

  
//   add_annotation(node_type, nodeid);
//   mouseoverNode();

    
// }








