//スライド作成を記録する関数
function Record_slide(itemID, nodeId, title, brotherId){

  $.ajax({
      url: "php/slide_create.php",
      type: "POST",
      data: {id : itemID,
            node_id: nodeId,
            title: title,
            brother_id: brotherId},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},

  });

}

//スライド削除を記録する関数
function Delete_slide(itemID){

  $.ajax({

      url: "php/slide_delete.php",
      type: "POST",
      data: {id : itemID,},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},

  });
}
//2022-12-16 shimizu
function Delete_Document(itemID){

  $.ajax({

      url: "php/Document_delete.php",
      type: "POST",
      data: {id : itemID,},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},

  });
}

//2022-12-13 shimizu
//ノード削除から関係性を更新する関数
function Delete_document_relation_node(doc_node_id){

  $.ajax({

      url: "php/LogicRelation_node_delete.php",
      type: "POST",
      data: {id : doc_node_id,},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},
  });

}

//20230130 shimizu
//スライドのバッジ選択
function Delete_slide_relation(thread_id){
  $.ajax({

    url: "php/LogicRelationSlide_delete.php",
    type: "POST",
    data: {id : thread_id,},
    success: function (e) {
      if(e){
        console.log(e);
      }
    },
    error: function () {
    console.log("登録失敗");},
});
}

//2022-12-13 shimizu
//スライド削除からcontentの関係性を更新する関数
function Delete_document_relation_slide(slide_id){

  $.ajax({

      url: "php/LogicRelation_slide_delete.php",
      type: "POST",
      data: {id : slide_id,},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},
  });

  //スライドとスライドの関係性があれば削除する
  $.ajax({

    url: "php/SlideLogicRelation_delete.php",
    type: "POST",
    data: {id : slide_id,},
    success: function (e) {
      if(e){
        console.log(e);
      }
    },
    error: function () {
    console.log("登録失敗");},
});
}

//2022-12-21 shimizu
//一つの論理構成意図削除から関係性を更新する関数
function Delete_document_relation_concept(id){

  $.ajax({

      url: "php/LogicRelation_concept_delete.php",
      type: "POST",
      data: {id : id,},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},
  });

}

//2022-12-21 shimizu 
function Delete_concept(id){
  $.ajax({

    url: "php/get_LogicRelation.php",
    type: "POST",
    success: function (arr) {
      if(arr == "[]"){
        // console.log(arr);
      }else{
        // console.log(arr);
        var parse = JSON.parse(arr);
        var badge_ids = [];
        for(var i=0; i<parse.length;i++){
          if(id == parse[i].item_content1_id || id == parse[i].item_content2_id){
            var badge_id1 = parse[i].id+","+parse[i].item_content1_id;
            badge_ids.push(badge_id1);
            var badge_id2 = parse[i].id+","+parse[i].item_content2_id;
            badge_ids.push(badge_id2);
          }
        }
        console.log(badge_ids);
        for(var j=0;j<badge_ids.length;j++){
          var badge_element = document.getElementById(badge_ids[j]);
          badge_element.remove();
        }
        
      }
    },
    error: function () {
    console.log("登録失敗");},
});
}

function Delete_concepts(doc_id){

}

//コンテンツ追加を記録する関数
function Record_content(contentID, nodeID, conceptID, content, itemID, brother_id, indent, type){

  $.ajax({

      url: "php/content_create.php",
      type: "POST",
      data: {id : contentID,
             node_id : nodeID,
             concept_id : conceptID,
             content : content,
             slide_id : itemID,
             brother_id :brother_id,
             indent: indent,
             type : type,
             },
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},

  });
}

//2022-12-13 shimizu ノード間の論理的関係を記録する関数
async function Record_NodeLogicRelation(U_ID, node1_id,item_content1_id,item_content1_label,ont1_id,node2_id, item_content2_id,item_content2_label,ont2_id){

  console.log(U_ID+", "+node1_id +", "+item_content1_id +", "+item_content1_label +", "+ont1_id +", "+node2_id +", "+item_content2_id +", "+item_content2_label +", "+ont2_id);

  $.ajax({
    url: "php/LogicRelationNode_create.php",
    type: "POST",
    data: {id : U_ID,
            node1_id : node1_id,
            item_content1_id : item_content1_id,
            item_content1_label : item_content1_label,
            ont1_id : ont1_id,
            node2_id : node2_id,
            item_content2_id : item_content2_id,
            item_content2_label : item_content2_label,
            ont2_id : ont2_id,
            },
    success: function (e) {
      if(e){
        console.log(e);
      }
    },
    error: function () {
    console.log("登録失敗");},

  });
}

async function Record_SlideLogicRelation(U_ID, node1_id,thread1_id,thread1_label, ont1_id, node2_id, thread2_id,thread2_label,ont2_id){

  console.log(U_ID +", "+node1_id +", "+thread1_id +", "+thread1_label +", "+ont1_id +", "+node2_id +", "+thread2_id +", "+thread2_label +", "+ont2_id);

  $.ajax({
    url: "php/LogicRelationSlide_create.php",
    type: "POST",
    data: { id : U_ID,
            node1_id : node1_id,
            thread1_id : thread1_id,
            thread1_label : thread1_label,
            ont1_id : ont1_id,
            node2_id : node2_id,
            thread2_id : thread2_id,
            thread2_label : thread2_label,
            ont2_id : ont2_id,
            },
    success: function (e) {
      if(e){
        console.log(e);
      }
    },
    error: function () {
    console.log("登録失敗");},

  });
}

//2022-12-15 shimizu 使用してないが，関係性を設定する時にスライドのIDを保存するやり方を検討していた．
async function getContentID(item_content_id){
  var content_id
  $.ajax({
    url: "php/get_content_slideID.php",
    type: "POST",
    data: {content_id: item_content_id},
    success: function(arr){
      if(arr == "[]"){
        // console.log(arr);
      }else{
        // console.log(arr);
        var parse = JSON.parse(arr);
        for(var i=0; i<parse.length; i++){
          content_id = parse[i].slide_id;
        }
      }
      return content_id;
    },
    error: function () {
    console.log("登録失敗");},
  })

}

//コンテンツ削除を記録する関数
function Delete_content(contentID){
  // console.log(contentID);

  $.ajax({

      url: "php/content_delete.php",
      type: "POST",
      data: {id : contentID},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},

  });
}
//2022-12-16 shimizu コンテンツ削除を記録する関数
function Delete_Document_content(contentID){

  $.ajax({

      url: "php/Document_content_delete.php",
      type: "POST",
      data: {id : contentID},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},

  });
}


//コンテンツの編集を記録する関数
function Edit_save(obj,id){
  var content = obj.value;//変更されたテキストエリアの内容
  var nodeid = obj.getAttribute('data-node_id');

  $.ajax({
      url: "php/content_edit.php",
      type: "POST",
      data: {id : id,
             content : content,
             node_id: nodeid},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},
  });

  // ---------以下，ラベルへの変更結果を反映---------------

  var dom_label = obj.previousElementSibling;
  if(content == "" && dom_label.getAttribute("type") == "toi"){
    $(dom_label).html("新規問いノード");
  }else if(content == "" && dom_label.getAttribute("type") == "answer"){
    $(dom_label).html("新規答えノード");
  }else{
  $(dom_label).html(content);
  }
}



//スライドタイトルの編集を記録する関数
function Edit_slide(obj, itemID){
  var slidetitle = obj.value;//変更されたテキストエリアの内容

  $.ajax({
      url: "php/slide_edit.php",
      type: "POST",
      data: {id : itemID,
             content : slidetitle,},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},
  });

  // ---------以下，ラベルへの変更結果を反映---------------

  var dom_label = obj.previousElementSibling;
  if(slidetitle == ""){
    $(dom_label).html("ページタイトル");
  }else{
  $(dom_label).html(slidetitle);
  }
}

//プレゼンテーション自体のタイトルの編集を記録する関数
function Edit_title(obj){
  var title = obj.value;

  $.ajax({

      url: "php/title_edit.php",
      type: "POST",
      data: {title : title,},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},

  });

//   $.ajax({

//     url: "php/update_scenario_title.php",
//     type: "POST",
//     data: {title : title,},
//     success: function (e) {
//       if(e){
//         console.log(e);
//       }
//     },
//     error: function () {
//     console.log("登録失敗");},

// });
}

//2022-11-24 shimizu
function Edit_title_shimizu(obj){
  var title = obj.value;

  $.ajax({

      url: "php/title_edit_shimizu.php",
      type: "POST",
      data: {title : title,},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},

  });
}

// async function Update_slide_rank(){

//   await $.ajax({

//       url: "php/update_slide_rank.php",
//       type: "POST",
//       success: function (e) {
//         console.log("登録成功");
//         if(e){
//           console.log(e);
//         }
//         return "ok";
//       },
//       error: function () {
//       console.log("登録失敗");
//       return "err";},

//   });
// }

//2022-11-24 shimizu
//2025-01-13 kawa 使わなくなった
async function Update_Document_rank(){

  await $.ajax({

      url: "php/update_document_rank.php",
      type: "POST",
      success: function (e) {
        if(e){
          console.log(e);
        }
        return "ok";
      },
      error: function () {
      console.log("登録失敗");
      return "err";},

  });
}

// 2025-02-10 kawa content_rank.phpで処理
async function Update_content_rank(){
  console.log("Update_content_rank()は動いていません");
  // await $.ajax({

  //     url: "php/update_content_rank.php",
  //     type: "POST",
  //     success: function (e) {
  //       if(e){
  //         console.log(e);
  //       }
  //       return "ok";
  //     },
  //     error: function () {
  //     console.log("登録失敗");
  //     return "err";},
  // });
}

//　2022-11-24 shimizu
//  2025-02-17 kawa document_content_rank.phpで処理
async function Update_Document_content_rank(){
  await $.ajax({
      url: "php/update_document_content_rank.php",
      type: "POST",
      success: function (e) {
        if(e){
          console.log(e);
        }
        return "ok";
      },
      error: function () {
      console.log("登録失敗");
      return "err";},
  });
}

function Record_slide_rank(itemID, brotherId){
  var id = getUniqueStr();

  $.ajax({
      url: "php/slide_rank.php",
      type: "POST",
      data: {id : id,
            slide_id : itemID,
            brother_id : brotherId,
      },
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},
  });
}

//2022-11-24 shimizu
function Record_document_rank(itemID, brother_id){
  var id = getUniqueStr();
  if(brother_id == "document_title"){
    brother_id = "root";
  }

  $.ajax({
      url: "php/document_rank.php",
      type: "POST",
      data: {item_id : itemID,
            brother_id: brother_id},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},
  });
}

function Record_content_rank(contentID, brother_id, itemID, content, nodeID, type, indent, concept_id){
  var id = getUniqueStr();

  $.ajax({

      url: "php/content_rank.php",
      type: "POST",
      data: {id : id,
            content_id : contentID,
            brother_id : brother_id,
            slide_id : itemID,
            content : content,
            node_id : nodeID,
            type : type,
            indent : indent,
            concept_id : concept_id},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},

  });
}

//2022-11-24 shimizu
function Record_document_content_rank(contentID, brother_id){
  var id = getUniqueStr();

  $.ajax({

      url: "php/document_content_rank.php",
      type: "POST",
      data: {id : id,
            item_content_id : contentID,
            brother_id : brother_id,},
      success: function (e) {
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},

  });
}

function Update_scenario_title(title){

  $.ajax({

      url: "php/update_scenario_title.php",
      type: "POST",
      data: {title : title,},
      success: function (e) {
        console.log("登録成功");
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},

  });
}

function Update_document_scenario_title(title){

  $.ajax({

      url: "php/update_document_scenario_title.php",
      type: "POST",
      data: {title : title,},
      success: function (e) {
        console.log("登録成功");
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},

  });
}

function Record_Timing(timing){
  console.log(timing);
  $.ajax({

      url: "php/record_timing.php",
      type: "POST",
      data: {timing : timing,},
      success: function (e) {
        console.log("登録成功");
        if(e){
          console.log(e);
        }
      },
      error: function () {
      console.log("登録失敗");},

  });
}


// バージョンを更新
function ItemVersionUpdate(){
  var thread_all = document.getElementsByClassName("thread");
  var cspan_all = document.getElementsByClassName("cspan");
  var t_dom_id;
  var c_dom_id;
  var data;
  var id;

  for(var j = 0; j< thread_all.length; j++){
    //選択中のスレッドを取得
    if(thread_all[j].style.border == "5px outset black"){
      t_dom_id = thread_all[j].getAttribute("id");
      break;
    }
  }
  for(var i=0; i<cspan_all.length; i++){
    // console.log(c_scenario[i].style.border);
    if(cspan_all[i].style.border == "2px solid gray"){
      c_dom_id = cspan_all[i].getAttribute("id");
    }
  }

  //選択されている要素を見つけたら，それがitemなのかitem_contentなのかを判断
  if(c_dom_id){
    data = "item_content_versions";
    id = c_dom_id;
  }else if(t_dom_id){
    data = "item_versions";
    id = t_dom_id;
  }

  $.ajax({

    url: "php/version_update.php",
    type: "POST",
    data: {data: data,
          id : id,},
    success: function (e) {
      if(e){
        console.log(e);
      }
    },
    error: function () {
    console.log("登録失敗");},

  });

}

function AllItemVersionUpdate(){

  var data = "all_items";

  $.ajax({

    url: "php/version_update.php",
    type: "POST",
    data: {data: data,},
    success: function (e) {
      if(e){
        console.log(e);
      }
    },
    error: function () {
    console.log("登録失敗");},

  });

}