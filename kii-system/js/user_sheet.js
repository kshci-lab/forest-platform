// nishida
// ----------------------- 他者のマインドマップを表示する --------------------------
let annotations_s=[]; //annotation_text_object
let annotations_m=[]; //annotation_text_object
     annotations_m=annotations; //annotation_text_object
let map_id_tmp = new Number(); 

let past_array = [];
let now_array = [];

// let past_array = {
//   "id" : {},
//   "topic" : {},
//   "type" : {},
//   "concept_id":{}
// };

// let now_array = {
//   "id" : {},
//   "topic" : {},
//   "type" : {},
//   "concept_id":{}
// };

// let obj_s={};
// 過去のマインドマップのノード情報を取得する
$('#user_list').change(function() { // セレクトボックスから選ばれた場合
  getData2(167304889);
})


// なぜかarea_idを引数にしとかないと狂う
function Rebuild_paper2(area_id,map){
  $.ajax({
      url: "php/paper_rebuild.php",
      type: "POST",
      success: function(paper){    
          var area = document.getElementById(area_id);
          $('#'+ area_id ).empty();
          var span = document.createElement('span'); // 改行はいやなのでspan
          span.setAttribute('id', 'rebuild');
          span.innerHTML = paper; //html要素に変換   
          area.append(span); //bodyに追加

          console.log(map);
          $.ajax({
                         
            url: "php/annotation_user_rebuild.php",
            type: "POST",
            data: { 
              val : "all",
              map : map,
            },
            success:function(annotation){
        
              const tmp_annot = JSON.parse(annotation);
              annotations_s = tmp_annot;
              console.log(annotations_s);
              addHightlightSentences2(tmp_annot,"user_s");
        
            },
            error:function(){
                  console.log("エラーです");
            }
        
          });
      },
      error:function(){
          console.log("エラーです");
      }
  });
}

function Rebuild_paper3(area_id,map, parent_id){
  $.ajax({
      url: "php/paper_rebuild.php",
      type: "POST",
      success: function(paper){    
          var area = document.getElementById(area_id);
          $('#'+ area_id ).empty();
          var span = document.createElement('span'); // 改行はいやなのでspan
          span.setAttribute('id', 'rebuild');
          span.innerHTML = paper; //html要素に変換   
          area.append(span); //bodyに追加

          console.log(map);
          $.ajax({
                         
            url: "php/annotation_user_rebuild.php",
            type: "POST",
            data: { 
              val : "one",
              map : map,
              parent_id : parent_id
            },
            success:function(annotation){
        
              const tmp_annot = JSON.parse(annotation);
              annotations_s = tmp_annot;
              console.log(annotations_s);

              addHightlightSentences2(tmp_annot,"user_s");
        
            },
            error:function(){
                  console.log("エラーです");
            }
        
          });
      },
      error:function(){
          console.log("エラーです");
      }
  });
}

let addHightlightChar2 = (char_object_id,type) => {
  // ある文字にハイライトを反映する関数
  //const object_elm = document.getElementById(char_object_id)
  const object_elm = $("span[char_id='"+char_object_id+"']");
  
  if(object_elm !== null){

      object_elm.attr('class', type);
      // object_elm.setAttribute('style', 'background-color:rgba(255,255,0,0.7)');
  }
};
  
// let addHightlightSentences = (text_object, hightlight_list) => {
let addHightlightSentences2 = (hightlight_list,type) => {
  // 文単位でハイライトする処理
  hightlight_list.forEach((obj, index) => {
      for(let count=0; count <= (obj.end_char_id - obj.start_char_id); count++){
          let char_id = obj.start_char_id + count;
          let char_id_txt = 'p_txt_'+char_id;

          addHightlightChar2(char_id_txt,type);
      }
  });
};


// 他者のマインドマップを表示する関数
function OpenPastSheet(array){

  // 他者のマインドマップ表示部分を呼び出されるたびに初期化
  if (_jm2 != null) {
    console.log(_jm2);
    $("#jsmind_container2").empty();
  }

  console.log("更新");

  var map_id = $('#user_list option:selected').val(); // selectboxから選択
  // $('#jsmind_container2').prepend("<div>"+map_id+"のマインドマップ</div>");

  // テーマ設定
  var options = {
    container:'jsmind_container2',
    // theme:'past_sheet',
    // editable:true
  }

  var mind2 = {
    "meta":{ // metaデータ（特に意味はないっぽい）
      "name":"jsMind remote",
      "author":"hizzgdev@163.com",
      "version":"0.2"
    },
    "format":"node_array",
    "data":array
  };

  _jm2 = new jsMind(options);
  console.log(mind2);
  _jm2.show(mind2); // jsmind_container2に表示


    // concept_idをつける nishida
  array.forEach((obj, index) => {
    let id = obj.id;
    let cid = obj.concept_id;
    let type = obj.type;
    let jmnode = document.getElementsByTagName("jmnode");

    for(i=0; i<jmnode.length; i++){

        if(id == jmnode[i].getAttribute("nodeid")){

            jmnode[i].setAttribute("concept_id",cid);
            jmnode[i].setAttribute("type",type);
        }
    }
  });



  past_array = array;
  // ChangeNodesColor(array);
}


// 呼び出した過去のマインドマップに存在しない，
// もしくは記述が変更されているノードの色を変える関数
function ChangeNodesColor(array_past){



  // 過去のノード一覧のIDを取得
  for(var i=0; i<array_past.length; i++){
    // past_array['id'][i] = array_past[i].id;
    // past_array['topic'][i] = array_past[i].topic;
    past_array['type'][i] = array_past[i].type;
    past_array['concept_id'][i] = array_past[i].concept_id;
  }



    // 過去のマップに存在していないノードがあったら
    // 現在の思考整理支援システム上のノードの背景色を変える
    // 変え方はノードタイプを'new_create_（タイプ）'へ変更する cssはjsmind.cssで記述
    // if(concept_flag == true){
    //   jmnode[i].removeAttribute('type'); //現在のタイプを削除
    //   str = 'new_create_';
    //   if(now_type != null){
    //     if(now_type.indexOf(str) === 0){ // すでにnew_createフラグがたっていれば
    //       // だいぶゴリ押し
    //       // 重複になる部分を削除して接続
    //       jmnode[i].setAttribute('type', now_array['type'][i].split('new_create_').join(''));
    //     }else{
    //       // new_createがなければ
    //       jmnode[i].setAttribute('type', 'new_create_'+ now_array['type'][i]);
    //     }
    //   }
    // }

    // 同じIDのノードではあるが，内容が変更されている場合
    // 現在の思考整理支援システム上のノードの背景色を変える
    // 変え方はノードタイプを'change_topic_（タイプ）'へ変更する cssはjsmind.cssで記述
    // else if(topic_flag == false){
    //   jmnode[i].removeAttribute('type');
    //   str = 'change_topic_';
    //   if(now_type != null){
    //     if(now_type.indexOf(str) === 0){
    //       jmnode[i].setAttribute('type', now_array['type'][i].split('change_topic_').join(''));
    //     }else{
    //       jmnode[i].setAttribute('type', 'change_topic_'+ now_array['type'][i]);
    //     }
    //   }
    // }
  // }

  // // ここからは過去のマインドマップにtype属性をつける作業
  // var null_flag = false; // nullかどうかのフラグ
  // var check = ""; // 切り替わり判定の位置をチェックする変数

  // for(var i=0; i<jmnode.length; i++){ // 現在のノードを全探索
  //   for(var j=0; j<jmnode.length; j++){ // 入れ子で過去のノード全探索
  //     // 現在と過去の入れ替わり判定
  //     if(null_flag == false && now_array['id'][i] == null){
  //       check = i; // ここで過去に切り替わる
  //       null_flag = true;
  //     }
  //   }
  // }

  // // 入れ替わりの位置が判明したので，type属性をつけていく
  // for(var i=check; i<jmnode.length; i++){ // jmnodeの過去のマインドマップ要素について
  //   for(var j=0; j<Object.keys(past_array['id']).length; j++){ // 過去のやつ全探索
  //     if(now_array['id'][i] == past_array['id'][j]){ // 同じIDを持っていたら
  //       jmnode[i].setAttribute('type', past_array['type'][j]); // そのノードにtype属性をつける
  //       jmnode[i].setAttribute('concept_id', past_array['concept_id'][j]); // そのノードにconcept_id属性をつける
  //     }
  //   }
  // }

  // checkboxに動的にチェックを入れる
  // $('input[name="Difference"]').prop('checked', true);
}

// 現在のマインドマップを別のところにコピーしておく関数
// window.setTimeout(CopyCurrentMap, 10 );で1000ms後に読み込むことでノード情報を取得
function CopyCurrentMap(){

  // 現在時間の取得
  var now = new Date();

  var Year = now.getFullYear();
  var Month = ("0"+(now.getMonth() + 1)).slice(-2);
  var nowDate = ("0"+now.getDate()).slice(-2);
  var Hour = now.getHours();
  var Min = now.getMinutes();
  var Sec = ("0"+now.getSeconds()).slice(-2);

  var user = Year+"-"+Month+"-"+nowDate+" "+Hour+":"+Min+":"+Sec;

  $.ajax({
    url: "php/past_sheet.php",
    type: "POST",
    data: { val : "time",
            time : user
          },
    success: function(data){
      var obj = JSON.parse(data);
      console.log(obj);

      if(obj['time'] == ""){
        // alert("日時の取得に失敗しました．");
      }else{
        // 配列に変換
        var node_array = new Array();
        node_array = obj['array'];

        // 呼び出されるたびに初期化
        if(_jm3 != null){
          $("#jsmind_container3").empty();
        }

        // テーマ設定
        var options3 = {
          container:'jsmind_container3',
          // theme:'now_sheet',
          // editable:true
        }

        var mind3 = {
          "meta":{ // metaデータ
            "name":"jsMind remote",
            "author":"hizzgdev@163.com",
            "version":"0.3"
          },
          "format":"node_array",
          "data":node_array
        };

        _jm3 = new jsMind(options3);
        _jm3.show(mind3); // jsmind_container3に表示

            // 扱いやすいように格納
    // for(var i=0; i<node_array.length; i++){
    //   // now_array['id'][i] = array_now[i].id;
    //   // now_array['topic'][i] = array_now[i].topic;
    //   // now_array['type'][i] = jmnode[i].getAttribute('type');
    //   now_array['type'][i] = node_array[i].type;
    //   now_array['concept_id'][i] = node_array[i].concept_id;
    // }
    now_array = node_array;  


            // concept_idをつける nishida
  node_array.forEach((obj, index) => {
    let id = obj.id;
    let cid = obj.concept_id;
    let type = obj.type;
    let jmnode = document.getElementsByTagName("jmnode");

    for(i=0; i<jmnode.length; i++){

        if(id == jmnode[i].getAttribute("nodeid")){

            jmnode[i].setAttribute("concept_id",cid);
            jmnode[i].setAttribute("type",type);
        }

    }



  });

        // $('#jsmind_container3').prepend(user);
        $('#jsmind_container3').prepend("自分のマインドマップ");

        change_toi();

      }
    }
  });
}

// window.setTimeout(CopyCurrentMap, 1000);


function change_toi(){

  let past_array_toi = past_array.filter((p_array) => {
    return (p_array.type == "toi" || p_array.type == "toi_deep");
  });

  let now_array_toi = now_array.filter((n_array) => {
    return (n_array.type == "toi" || n_array.type == "toi_deep");
  });



  // var cnt = "";// ノード数チェック変数cnt
  // // 過去のマップの方がノードの数が多い場合もあるかもしれないのでチェック
  // if(past_array_toi.length > now_array_toi.length){
  //   cnt = past_array_toi.length;
  // }else{
  //   cnt = now_array_toi.length;
  // }

  // 全探索開始
  // ブラウザ上の全てのノード情報の格納

  for(var i=0; i<past_array_toi.length; i++){
    // iの数が変わるたびに初期化
    var concept_flag = false; // 既存かつ以前から内容が変更されたノードかのフラグ
    // idの数だけforを回す
    for(var j=0; j<now_array_toi.length; j++){
      // 今マップにあるノードのうち，過去のタイミングのノード一覧にあった場合
      if(past_array_toi[i].concept_id ==  now_array_toi[j].concept_id){
        concept_flag = true; // 既にあるフラグをたてる
        console.log("変えた");
      }
    }
    
    if(concept_flag == false){
      console.log("つけた");
      var jmnode = document.getElementsByTagName("jmnode");
      let node_id = past_array_toi[i].id;
      for(x=0; x<jmnode.length; x++){
        if(jmnode[x].getAttribute("nodeid") == node_id){
          jmnode[x].setAttribute("type","toi_s");
        }
      }
      // const object_elm = $("jmnode[char_id='"+node_id+"']");
      // // console.log(jmnode[i].innerHTML);
      // if(object_elm !== null){
      //          console.log(object_elm);
      //           object_elm.attr('type', 'toi_s');
      //       }

    }

    // var now_type = new String; // ノードタイプを格納しておく変数
    // now_type = jmnode[i].getAttribute('type'); // ブラウザ上の全てのノードのタイプを格納しておく
    // var str = new String;
  }

}


function show_annotation(){
    // checkboxの状態を取得
  check = document.getElementById("Difference");
//   // checlboxがチェックされた時の処理
  if(check.checked == true){
    addHightlightSentences2(annotations,"user_m");
  }else{
    Rebuild_paper2("paper_area",map_id_tmp);
    // removeAnnotationSentences(annotations);
  }
}