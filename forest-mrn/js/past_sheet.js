//
// matsuoka
//
// ----------------------- 過去のマインドマップを表示する --------------------------

// 過去のマインドマップのノード情報を取得する
$('#mttime_list').change(function() { // セレクトボックスから選ばれた場合

  var mttime = $('#mttime_list option:selected').val(); // selectboxから選択した値
  if(mttime == "null"){
    return;
  }
  else{
    $.ajax({
      url: "php/past_sheet.php",
      type: "POST",
      data: { val : "time",
              time : mttime
            },
      success: function(data){
        var obj = JSON.parse(data); // JSON型をパース

        if(obj['time'] == ""){
          // alert("日時の取得に失敗しました．");
        }else{
          alert("日時を取得しました．");
          // console.log("取得日時", obj['time']);

          // 配列に変換
          var node_array = new Array();
          node_array = obj['array'];

          // 表示する関数に受け渡す
          OpenPastSheet(node_array);
        }
      }
    })
  }
})

// 過去のマインドマップを表示する関数
function OpenPastSheet(array){

  // 過去のマインドマップ表示部分を呼び出されるたびに初期化
  if(_jm2 != null){
    $("#jsmind_container2").empty();
  }

  var mttime = $('#mttime_list option:selected').val(); // selectboxから選択
  $('#jsmind_container2').prepend("<div>"+mttime+"のマインドマップ</div>");

  // テーマ設定
  var options = {
    container:'jsmind_container2',
    theme:'past_sheet',
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
  _jm2.show(mind2); // jsmind_container2に表示

  ChangeNodesColor(array);
}


// 呼び出した過去のマインドマップに存在しない，
// もしくは記述が変更されているノードの色を変える関数
function ChangeNodesColor(array){

  let past_array = {
    "id" : {},
    "topic" : {},
    "type" : {}
  };

  let now_array = {
    "id" : {},
    "topic" : {},
    "type" : {}
  };

  // 過去のノード一覧のIDを取得
  for(var i=0; i<array.length; i++){
    past_array['id'][i] = array[i].id;
    past_array['topic'][i] = array[i].topic;
    past_array['type'][i] = array[i].type;
  }

  // ブラウザ上の全てのノード情報の格納
  var jmnode = document.getElementsByTagName("jmnode");

  // 扱いやすいように格納
  for(var i=0; i<jmnode.length; i++){
    now_array['id'][i] = jmnode[i].getAttribute('nodeid');
    now_array['topic'][i] = jmnode[i].innerHTML;
    now_array['type'][i] = jmnode[i].getAttribute('type');
  }

  // console.log(now_array); // nullを挟んで，ルートからはじまる２つのまとまりが出来る
                             // 前半が現在のマインドマップ，後半が過去のマインドマップ

  var cnt = "";// ノード数チェック変数cnt
  // 過去のマップの方がノードの数が多い場合もあるかもしれないのでチェック
  if(past_array.length > jmnode.length){
    cnt = past_array.length;
  }else{
    cnt = jmnode.length;
  }

  // 全探索開始
  for(var i=0; i<cnt; i++){
    // iの数が変わるたびに初期化
    var id_flag = false; //新しく追加されたノードかのフラグ
    var topic_flag = false; // 既存かつ以前から内容が変更されたノードかのフラグ

    // idの数だけforを回す
    for(var j=0; j<Object.keys(past_array['id']).length; j++){
      // 今マップにあるノードのうち，過去のタイミングのノード一覧にあった場合
      if(now_array['id'][i] ==  past_array['id'][j]){
        id_flag = true; // 既にあるフラグをたてる
        // ノードがすでにあるかつ，そのノードIDに対して内容も同じ場合
        if(now_array['topic'][i] ==  past_array['topic'][j]){
          topic_flag = true; // 同一内容のフラグをたてる
        }
      }
    }

    var now_type = new String; // ノードタイプを格納しておく変数
    now_type = jmnode[i].getAttribute('type'); // ブラウザ上の全てのノードのタイプを格納しておく
    var str = new String;

    // 過去のマップに存在していないノードがあったら
    // 現在の思考整理支援システム上のノードの背景色を変える
    // 変え方はノードタイプを'new_create_（タイプ）'へ変更する cssはjsmind.cssで記述
    if(id_flag == false){
      jmnode[i].removeAttribute('type'); //現在のタイプを削除
      str = 'new_create_';
      if(now_type != null){
        if(now_type.indexOf(str) === 0){ // すでにnew_createフラグがたっていれば
          // だいぶゴリ押し
          // 重複になる部分を削除して接続
          jmnode[i].setAttribute('type', now_array['type'][i].split('new_create_').join(''));
        }else{
          // new_createがなければ
          jmnode[i].setAttribute('type', 'new_create_'+ now_array['type'][i]);
        }
      }
    }

    // 同じIDのノードではあるが，内容が変更されている場合
    // 現在の思考整理支援システム上のノードの背景色を変える
    // 変え方はノードタイプを'change_topic_（タイプ）'へ変更する cssはjsmind.cssで記述
    else if(topic_flag == false){
      jmnode[i].removeAttribute('type');
      str = 'change_topic_';
      if(now_type != null){
        if(now_type.indexOf(str) === 0){
          jmnode[i].setAttribute('type', now_array['type'][i].split('change_topic_').join(''));
        }else{
          jmnode[i].setAttribute('type', 'change_topic_'+ now_array['type'][i]);
        }
      }
    }
  }

  // ここからは過去のマインドマップにtype属性をつける作業
  var null_flag = false; // nullかどうかのフラグ
  var check = ""; // 切り替わり判定の位置をチェックする変数

  for(var i=0; i<jmnode.length; i++){ // 現在のノードを全探索
    for(var j=0; j<jmnode.length; j++){ // 入れ子で過去のノード全探索
      // 現在と過去の入れ替わり判定
      if(null_flag == false && now_array['id'][i] == null){
        check = i; // ここで過去に切り替わる
        null_flag = true;
      }
    }
  }

  // 入れ替わりの位置が判明したので，type属性をつけていく
  for(var i=check; i<jmnode.length; i++){ // jmnodeの過去のマインドマップ要素について
    for(var j=0; j<Object.keys(past_array['id']).length; j++){ // 過去のやつ全探索
      if(now_array['id'][i] == past_array['id'][j]){ // 同じIDを持っていたら
        jmnode[i].setAttribute('type', past_array['type'][j]); // そのノードにtype属性をつける
      }
    }
  }

  // checkboxに動的にチェックを入れる
  $('input[name="Difference"]').prop('checked', true);
}


// 前回のマインドマップのノード情報を取得して色チェンジ
function Difference(){

  // 全てのノード情報の格納
  var jmnode = document.getElementsByTagName("jmnode");
  var type = [];

  for(var i=0; i<jmnode.length; i++){
    type[i] = jmnode[i].getAttribute('type');
  }
  // checkboxの状態を取得
  check = document.getElementById("Difference");
  // checlboxがチェックされた時の処理
  if(check.checked == true){

    $.ajax({
      url: "php/past_sheet.php",
      type: "POST",
      data: { time : null},
      success: function(data){
        var obj = JSON.parse(data);
        if(obj['time'] == ""){
          // alert("日時の取得に失敗しました．");
        }else{
          // 存在しているかつ内容が変わっていないノードの情報を配列に変換
          var node_array = new Array();
          node_array = obj['array'];

          ChangeNodesColor(node_array);
        }
      }
    })

  }else{  // checlboxがチェックが外れた時の処理

    for(var i=0; i<jmnode.length; i++){
      var now_type = "";
      now_type = jmnode[i].getAttribute('type'); // now_typeに現在のタイプを格納
      jmnode[i].removeAttribute('type'); // type情報を一旦削除

      if(now_type != null){
        // new_createがあるとき削除
        if(now_type.indexOf('new_create_') === 0){
          jmnode[i].setAttribute('type', now_type.split('new_create_').join(''));
        }
        // change_topicがあるとき削除
        else if(now_type.indexOf('change_topic_') === 0){
          jmnode[i].setAttribute('type', now_type.split('change_topic_').join(''));
        }
        // その他はそのまま
        else{
          jmnode[i].setAttribute('type', now_type);
        }
      }
    }
  }
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

  var mttime = Year+"-"+Month+"-"+nowDate+" "+Hour+":"+Min+":"+Sec;

  $.ajax({
    url: "php/past_sheet.php",
    type: "POST",
    data: { val : "time",
            time : mttime
          },
    success: function(data){
      var obj = JSON.parse(data);
      console.log("past")
      if(obj['time'] == ""){
        alert("日時の取得に失敗しました．");
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

        $('#jsmind_container3').prepend(mttime);
        console.log("確認");
      }
    }
  });
}

// window.setTimeout(CopyCurrentMap, 1000);
