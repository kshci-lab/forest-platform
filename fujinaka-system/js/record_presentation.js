//スライド作成を記録する関数
function Record_slide(slideID){

  $.ajax({

      url: "php/slide_create.php",
      type: "POST",
      data: {id : slideID,},
      success: function () {
        console.log("登録成功：　" +slideID );
      },
      error: function () {
      console.log("登録失敗");},

  });

}


//スライド削除を記録する関数
function Delete_slide(slideID){

  $.ajax({

      url: "php/slide_delete.php",
      type: "POST",
      data: {id : slideID,},
      success: function () {
        console.log("登録成功：　" +slideID );
      },
      error: function () {
      console.log("登録失敗");},

  });
}



//コンテンツ追加を記録する関数
function Record_content(contentID, nodeID, conceptID, content, slideID, type){

  $.ajax({

      url: "php/content_create.php",
      type: "POST",
      data: {id : contentID,
             node_id : nodeID,
             concept_id : conceptID,
             content : content,
             slide_id : slideID,
             type : type,
             },
      success: function () {
        console.log("登録成功：　" +slideID );
      },
      error: function () {
      console.log("登録失敗");},

  });
}


//コンテンツ削除を記録する関数
function Delete_content(contentID){

  $.ajax({

      url: "php/content_delete.php",
      type: "POST",
      data: {id : contentID},
      success: function () {
        console.log("登録成功：　" +contentID );
      },
      error: function () {
      console.log("登録失敗");},

  });
}


//コンテンツの編集を記録する関数
function Edit_save(obj,id){
  var content = obj.value;//変更されたテキストエリアの内容
  console.log(id);

  $.ajax({

      url: "php/content_edit.php",
      type: "POST",
      data: {id : id,
             content : content,},
      success: function () {
        console.log("登録成功");
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

  if(!!(version_id)){
    influence_feedback(version_id, node_id);
  }
}

//スライドタイトルの編集を記録する関数
function Edit_slide(obj, slideID){
  var slidetitle = obj.value;//変更されたテキストエリアの内容
  console.log(slideID);
  console.log(slidetitle);

  $.ajax({

      url: "php/slide_edit.php",
      type: "POST",
      data: {id : slideID,
             content : slidetitle,},
      success: function () {
        console.log("登録成功");
      },
      error: function () {
      console.log("登録失敗");},

  });

  // ---------以下，ラベルへの変更結果を反映---------------

  var dom_label = obj.previousElementSibling;
  if(slidetitle == ""){
    $(dom_label).html("論文タイトル");
  }else{
  $(dom_label).html(slidetitle);
  }
}


//プレゼンテーション自体のタイトルの編集を記録する関数
function Edit_title(obj){  //シナリオタイトルから論文タイトルに変更　fujinaka

  var scenario_title = obj.value;

  $.ajax({

      url: "php/title_update.php",
      type: "POST",
      data: {title : scenario_title,},
      success: function () {
        console.log("登録成功");
      },
      error: function () {
      console.log("登録失敗");},

  });
    // ---------以下，ラベルへの変更結果を反映---------------

    var dom_label = obj.previousElementSibling;
    if(scenario_title == ""){
      $(dom_label).html("論文タイトル");
    }else{
    $(dom_label).html(scenario_title);
    }
}


async function Update_slide_rank(){

  await $.ajax({

      url: "php/update_slide_rank.php",
      type: "POST",
      success: function () {
        console.log("登録成功");
        return "ok";
      },
      error: function () {
      console.log("登録失敗");
      return "err";},

  });
}

// 2025-02-10 kawa content_rank.phpで処理
async function Update_content_rank(){
  // await $.ajax({

  //     url: "php/update_content_rank.php",
  //     type: "POST",
  //     success: function () {
  //       console.log("登録成功");
  //       return "ok";
  //     },
  //     error: function () {
  //     console.log("登録失敗");
  //     return "err";},

  // });
}

function Record_slide_rank(slideID, rank, title){
  var id = getUniqueStr();

  $.ajax({

      url: "php/slide_rank.php",
      type: "POST",
      data: {id : id,
            slide_id : slideID,
            rank : rank,
            title : title,},
      success: function () {
        console.log("登録成功");
      },
      error: function () {
      console.log("登録失敗");},

  });
}



function Record_content_rank(contentID, rank, slideID, content, nodeID, type, indent, concept_id){
  var id = getUniqueStr();

  $.ajax({

      url: "php/content_rank.php",
      type: "POST",
      data: {id : id,
            content_id : contentID,
            rank : rank,
            slide_id : slideID,
            content : content,
            node_id : nodeID,
            type : type,
            indent : indent,
            concept_id : concept_id},
      success: function () {
        console.log("登録成功");
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
      success: function () {
        console.log("登録成功");
      },
      error: function () {
      console.log("登録失敗");},

  });
}

//fujinka作成
//章作成
function Insert_Chapter(chapterID, Rank){

  $.ajax({

    url: "php/chapter_insert.php",
    type: "POST",
    data: {
      id : chapterID,
      rank : Rank
    },
    success: function () {
      console.log("章作成成功：　" +chapterID );
    },
    error: function () {
    console.log("章作成失敗");},
  });

}

//章タイトル更新
function Update_Chapter_Title(obj, chapterID){
  
  var chapterTitle = obj.value;

  $.ajax({
    url: "php/chapter_update.php",
    type: "POST",
    data: {
      id : chapterID,
      title : chapterTitle
    },
    success: function () {
      console.log("章タイトル更新成功：　" +chapterID );
    },
    error: function () {
      console.log("章タイトル更新失敗");
    },
  });

    // ---------以下，ラベルへの変更結果を反映---------------

    var dom_label = obj.previousElementSibling;
    if(chapterTitle == ""){
      $(dom_label).html("章タイトル");
    }else{
    $(dom_label).html(chapterTitle);
    }
}

//章削除
function Delete_Chapter(chapterID){

  $.ajax({

    url: "php/chapter_delete.php",
    type: "POST",
    data: {id : chapterID,},
    success: function () {
      console.log("章削除成功：　" +chapterID );
    },
    error: function () {
    console.log("章削除失敗");},
  });

}

//章並び替え
function Update_Chapter_Rank(chapterID, Rank){

  $.ajax({

    url: "php/chapter_rank.php",
    type: "POST",
    data: {
      id : chapterID,
      rank : Rank
    },
    success: function () {
      console.log("章並び替え成功：　" +chapterID );
    },
    error: function () {
    console.log("章並び替え失敗");},
  });

}

//節作成
function Insert_section(sectionID, chapterID, Rank){

  $.ajax({

      url: "php/section_insert.php",
      type: "POST",
      data: {
        id : sectionID,
        chapter_id : chapterID,
        rank : Rank
      },
      success: function () {
        console.log("節作成成功：　" +sectionID );
      },
      error: function () {
      console.log("節作成失敗");},
    });

}

//節タイトル更新
function Update_section_Title(obj, sectionID){

  var sectionTitle = obj.value;

  $.ajax({

      url: "php/section_update.php",
      type: "POST",
      data: {
        update : "title",
        id : sectionID,
        title : sectionTitle
      },
      success: function () {
        console.log("節タイトル更新成功：　" +sectionID );
      },
      error: function () {
        console.log("節タイトル更新失敗");
      },
  });
  
  // ---------以下，ラベルへの変更結果を反映---------------

  var dom_label = obj.previousElementSibling;
  if(sectionTitle == ""){
    $(dom_label).html("節タイトル");
  }else{
  $(dom_label).html(sectionTitle);
  }
}

//節削除
function Delete_section(sectionID){

  $.ajax({

      url: "php/section_delete.php",
      type: "POST",
      data: {id : sectionID,},
      success: function () {
        console.log("節削除成功：　" +sectionID );
      },
      error: function () {
      console.log("節削除失敗");},
    });
}

//節並び替え
function Update_section_Rank(sectionID, chapterID, Rank){

  $.ajax({

      url: "php/section_rank.php",
      type: "POST",
      data: {
        id : sectionID,
        chapter_id : chapterID,
        rank : Rank
      },
      success: function () {
        console.log("節並び替え成功：　" +sectionID );
      },
      error: function () {
      console.log("節並び替え失敗");},
    });
}

//パラグラフ作成
function Insert_paragraph(paragraphID, sectionID, Rank){

  $.ajax({

      url: "php/paragraph_insert.php",
      type: "POST",
      data: {
        id : paragraphID,
        section_id : sectionID,
        rank : Rank
      },
      success: function () {
        console.log("パラグラフ作成成功：　" +paragraphID );
      },
      error: function () {
      console.log("パラグラフ作成失敗");},
    });

}

//パラグラフタイトル更新
function Update_paragraph_Title(obj, paragraphID){

  var paragraphTitle = obj.value;

  $.ajax({

      url: "php/paragraph_update.php",
      type: "POST",
      data: {
        update : "title",
        id : paragraphID,
        title : paragraphTitle
      },
      success: function () {
        console.log("パラグラフタイトル更新成功：　" +paragraphID );
      },
      error: function () {
        console.log("パラグラフタイトル更新失敗");
      },
  });
  
  // ---------以下，ラベルへの変更結果を反映---------------

  var dom_label = obj.previousElementSibling;
  if(paragraphTitle == ""){
    $(dom_label).html("パラグラフタイトル");
  }else{
  $(dom_label).html(paragraphTitle);
  }
}

//パラグラフ内容更新
function Update_paragraph_Content(paragraphID, quill_obj){

  console.log(quill_obj);

  var paragraphContent = quill_obj.root.innerHTML;

  console.log(paragraphContent);

  $.ajax({

      url: "php/paragraph_update.php",
      type: "POST",
      data: {
        update : "content",
        id : paragraphID,
        content : paragraphContent
      },
      success: function () {
        console.log("パラグラフ内容更新成功：　" +paragraphID );
      },
      error: function () {
        console.log("パラグラフ内容更新失敗");
      },
  });
}

//パラグラフ削除
function Delete_paragraph(paragraphID){

  $.ajax({

      url: "php/paragraph_delete.php",
      type: "POST",
      data: {id : paragraphID,},
      success: function () {
        console.log("パラグラフ削除成功：　" +paragraphID );
      },
      error: function () {
      console.log("パラグラフ削除失敗");},
    });
}

//パラグラフ並び替え
function Update_paragraph_Rank(paragraphID, sectionID, Rank){

  $.ajax({

      url: "php/paragraph_rank.php",
      type: "POST",
      data: {
        id : paragraphID,
        section_id : sectionID,
        rank : Rank
      },
      success: function () {
        console.log("パラグラフ並び替え成功：　" +paragraphID );
      },
      error: function () {
      console.log("パラグラフ並び替え失敗");},
    });

}