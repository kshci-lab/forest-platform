//ノードの操作履歴を記録する関数
function Record_activities(nodeID, parentID, nodeACT, nodeTEXT, nodeCONCEPT, nodeTYPE, primaryID){

  $.ajax({

      url: "php/record_activities.php",
      type: "POST",
      data: { id : nodeID,
              parent_id : parentID,
              activity : nodeACT,
              text : nodeTEXT,
              concept_id : nodeCONCEPT,
              type : nodeTYPE,
              primary : primaryID},

      success: function () {
        // console.log("\n");
        // console.log("登録成功");
        // console.log("ノードID：　" +nodeID );
        // console.log("操作：　" +nodeACT );
        // console.log("コンセプトID：　" +nodeCONCEPT );
        // console.log("ノードTYPE：　" +nodeTYPE );
        // console.log("ノードテキスト：　" +nodeTEXT );
        // console.log("親ノードID：　" +parentID );
        // console.log("\n");
      },

      error: function () {
      console.log("登録失敗");},

  });


}


//node_idと取得したい情報の文字列を渡すと，
//その情報を返す関数
function Get_NodeInfo(id, want_info){

  var get_info;
  var jmnode = document.getElementsByTagName("jmnode");

  for(var i=0; i<jmnode.length; i++){
    if(jmnode[i].getAttribute("nodeid") == id){

      if(want_info == "text"){
              get_info = jmnode[i].innerHTML;
      }else{

              get_info = jmnode[i].getAttribute(want_info);

                  // if(get_info == "toi"){ //取得したい情報がタイプの場合，"toi"や"prepared_question"の修正を行う
                  //     if(jmnode[i].getAttribute("concept_id") != ""){ //concept_idがあるならprepared_question
                  //           get_info = "prepared_question";
                  //     }else{
                  //           get_info = "question"; //ないなら自作の問いでquestion
                  //     }
                  // }
     }

      return get_info;
    }
  }
  //ここにくるということは，該当がなくてreturnが発生していないということである
  //主に削除時の動作，削除時の内容はjmnodeからはすでに削除されているから
        $.ajax({
            url: "php/get_information.php",
            type: "POST",
            async: false,
            data: { id   : id,
                    want : want_info,},
            success: function(arr){
                var parse = JSON.parse(arr);
                get_info = parse[0];
                // console.log(get_info);
            },
            error:function(){
              console.log("エラーです");
            }
        });

        return get_info;
}


function activity_reflection(){

  //期間設定の情報を取得
  var ref_periperi = ref_peri.ref_per.value;

  //目印取得
  var testxml = document.getElementById("reflection_form");
  //初期化
  testxml.textContent = null;

  //本日を指定した場合
  if(ref_periperi=="today"){
    var todayaaa =new Date();
    var werr = ("0"+(todayaaa.getMonth() + 1)).slice(-2);
    var start_date = todayaaa.getFullYear() + "-" + werr+"-"+("0"+todayaaa.getDate()).slice(-2);
    var finish_date = todayaaa.getFullYear() + "-" + werr+"-"+("0"+todayaaa.getDate()).slice(-2);

  //期間を指定した場合
  }else if(ref_periperi=="select"){
    var start_date = ref_peri.start_date.value;
    var finish_date = ref_peri.finish_date.value;
  }

  console.log(start_date);
  console.log(finish_date);

  $.ajax({
	    url: "php/get_activities.php",
	    type: "POST",
      data: { start_date : start_date,
              finish_date : finish_date},
	    success: function(arr){

        if(arr == "[]"){
          alert("現在のリフレクション項目はありません");
          console.log(arr);
        }else{
          console.log(arr);
          var parse = JSON.parse(arr);
          reflection_show(parse);
        }

	    },
      error:function(){
        console.log("エラーです");
      }
	});

}

function record_reflection_show(reflection_record_items){

  var REFLECTION_set = new Array();
	REFLECTION_set = [];

  if(reflection_record_items.length==0){
    alert("指定期間のリフレクション履歴が存在しません");
  }else{


    //帰って来た文章だけくりかえす
    var i=0;
    for(i=0; i < reflection_record_items.length;i++){

      var Relog = new Object();
					Relog.timestamp = reflection_record_items[i].timestamp;
          Relog.reflection_text = reflection_record_items[i].reflection_text;
          Relog.activity = reflection_record_items[i].activity;
          Relog.later_activity = reflection_record_items[i].later_activity;
          Relog.reflection_reason = reflection_record_items[i].reflection_reason;
					REFLECTION_set.push(Relog);

      //テーブルに追加していく
      var record_table = document.getElementById("record_table_sets");

      //行を追加
      var rows = record_table.insertRow(-1);

      //それぞれのセルを追加
      var record_table_time = rows.insertCell(-1);
      record_table_time.className="record_table_cells";
      record_table_time.innerHTML=reflection_record_items[i].timestamp;

      var record_table_reflectiontext = rows.insertCell(-1);
      record_table_reflectiontext.className="record_table_cells";
      record_table_reflectiontext.innerHTML=reflection_record_items[i].reflection_text;

      var record_table_activity = rows.insertCell(-1);
      record_table_activity.className="record_table_cells";
      record_table_activity.innerHTML=reflection_record_items[i].activity;

      var record_table_activity_later = rows.insertCell(-1);
      record_table_activity_later.className="record_table_cells";
      record_table_activity_later.innerHTML=reflection_record_items[i].later_activity;

      var record_table_reason = rows.insertCell(-1);
      record_table_reason.className="record_table_cells";
      record_table_reason.innerHTML=reflection_record_items[i].reflection_reason;




    }
  }



}


function reflection_show(reflection_item) {
  //reflection開始ボタンを消す
//  document.getElementById("reflection_btn").style.display="none";



  var RALOG_set = new Array();
	RALOG_set = [];



  if(reflection_item.length==0){
    alert("本日は一致する結果がありません");
  }else{
    //帰って来た文章だけくりかえす
    var i=0;
    console.log(reflection_item.length + "個分");

    for(i=0; i < reflection_item.length;i++){
      // console.log(i + "回目");

      if(typeof reflection_item[i] === "undefined"){
        continue;
      }


      var RAlog = new Object();
					RAlog.ref_text = reflection_item[i].ref_text;
          RAlog.template = reflection_item[i].template;
          RAlog.status = reflection_item[i].status;
          RAlog.target_node = reflection_item[i].target_node;
          RAlog.target_node_date = reflection_item[i].target_node_date;
          RAlog.rationality_node_date = reflection_item[i].rationality_node_date;
					RALOG_set.push(RAlog);

          //目印取得
          var testxml = document.getElementById("reflection_form");

          //背景的な部分とか
          var ref_item = document.createElement("div");
          ref_item.className = "ref_item";
          testxml.appendChild(ref_item);

          //隠しフォーム
          var hidden_item = document.createElement("input");
          hidden_item.name = "ref_item[" +i +"][targets]";
          hidden_item.type = "hidden";
          hidden_item.value = reflection_item[i].what;
          ref_item.appendChild(hidden_item);

          //隠しフォームID
          var hidden_id = document.createElement("input");
          hidden_id.name = "ref_item[" +i +"][ref_id]";
          hidden_id.type = "hidden";
          hidden_id.value = jsMind.util.uuid.newid(); //idの生成
          // console.log(hidden_id.value);
          ref_item.appendChild(hidden_id);

          //隠しフォームtemplate
          var hidden_temp = document.createElement("input");
          hidden_temp.name = "ref_item[" +i +"][template]";
          hidden_temp.type = "hidden";
          hidden_temp.value = reflection_item[i].template;
          // console.log(hidden_temp.value);
          ref_item.appendChild(hidden_temp);

          //隠しフォームtarget_node
          var hidden_tn = document.createElement("input");
          hidden_tn.name = "ref_item[" +i +"][target_node]";
          hidden_tn.type = "hidden";
          hidden_tn.value = reflection_item[i].target_node;
          // console.log(hidden_tn.value);
          ref_item.appendChild(hidden_tn);

          //隠しフォームtarget_node_date
          var hidden_tnd = document.createElement("input");
          hidden_tnd.name = "ref_item[" +i +"][target_node_date]";
          hidden_tnd.type = "hidden";
          hidden_tnd.value = reflection_item[i].target_node_date;
          // console.log(hidden_tnd.value);
          ref_item.appendChild(hidden_tnd);

          //隠しフォームrationality_node_date
          var hidden_sdvsd = document.createElement("input");
          hidden_sdvsd.name = "ref_item[" +i +"][rationality_node_date]";
          hidden_sdvsd.type = "hidden";
          hidden_sdvsd.value = reflection_item[i].rationality_node_date;
          // console.log(hidden_sdvsd.value);
          ref_item.appendChild(hidden_sdvsd);

          //reflection文
          var ref_text = document.createElement("textarea");
          ref_text.className = "ref_txt";
          ref_text.name = "ref_item[" +i +"][ref_text]";
          ref_text.rows = 4;
          ref_text.value = reflection_item[i].ref_text;
          // console.log(typeof ref_text.value);
          ref_item.appendChild(ref_text);

          //br
          var form_br = document.createElement("br");
          ref_item.appendChild(form_br);

          // console.log(reflection_item[i].status);






          if(reflection_item[i].status=="full"){
            ref_item.style.backgroundColor = "#f0f8ff";
            ref_item.style.height = "180px";

                      //記録する
                      var act_record = document.createElement("input");
                      // act_record.className = "ref_radio";
                      act_record.name = "ref_item[" +i +"][ref_activity]";
                      act_record.type = "radio";
                      act_record.value = "record";
                      act_record.required = true;
                      act_record.className = "record_radio";
                      ref_item.appendChild(act_record);

                      //span
                      var act_record_span = document.createElement("span");
                      act_record_span.className = "ref_txt";
                      act_record_span.innerHTML = "記録する　";
                      ref_item.appendChild(act_record_span);

                      //記録しない
                      var act_NOT_record = document.createElement("input");
                      // act_NOT_record.className = "ref_radio";
                      act_NOT_record.name = "ref_item[" +i +"][ref_activity]";
                      act_NOT_record.value = "not_record";
                      act_NOT_record.type = "radio";
                      act_NOT_record.className = "not_record_radio";
                      ref_item.appendChild(act_NOT_record);

                      //span
                      var act_not_record_span = document.createElement("span");
                      act_not_record_span.className = "ref_txt";
                      act_not_record_span.innerHTML = "記録しない";
                      ref_item.appendChild(act_not_record_span);

                      //隠しフォーム
                      var hidden_item = document.createElement("input");
                      hidden_item.name = "ref_item[" +i +"][late_activity]";
                      hidden_item.type = "hidden";
                      hidden_item.value = null;
                      ref_item.appendChild(hidden_item);

                      //隠しフォーム
                      var hidden_item = document.createElement("input");
                      hidden_item.name = "ref_item[" +i +"][ref_reason]";
                      hidden_item.type = "hidden";
                      hidden_item.value = "";
                      ref_item.appendChild(hidden_item);
          }

          if(reflection_item[i].status=="fail"){
            ref_item.style.backgroundColor = "#f0fff0";
            ref_item.style.height = "230px";
                      //考えた
                      var act_record = document.createElement("input");
                      // act_record.className = "ref_radio";
                      act_record.name = "ref_item[" +i +"][ref_activity]";
                      act_record.type = "radio";
                      act_record.value = "think";
                      act_record.required = true;
                      act_record.className = "think_radio";
                      ref_item.appendChild(act_record);

                      //span
                      var act_record_span = document.createElement("span");
                      act_record_span.className = "think";
                      act_record_span.innerHTML = "考えた　";
                      ref_item.appendChild(act_record_span);

                      //考えなかった
                      var act_NOT_record = document.createElement("input");
                      // act_NOT_record.className = "ref_radio";
                      act_NOT_record.name = "ref_item[" +i +"][ref_activity]";
                      act_NOT_record.value = "not_think";
                      act_NOT_record.type = "radio";
                      act_NOT_record.className = "not_think_radio";
                      // act_NOT_record.onclick = function(){show_them(act_NOT_record.name);};
                      ref_item.appendChild(act_NOT_record);

                      //span
                      var act_not_record_span = document.createElement("span");
                      act_not_record_span.className = "not_think";
                      act_not_record_span.innerHTML = "考えなかった";
                      // act_not_record_span.onclick = function(){later_THINK(act_not_record_span.checked);};
                      ref_item.appendChild(act_not_record_span);

                      //br
                      var form_br5 = document.createElement("br");
                      ref_item.appendChild(form_br5);

                      //考える-------------------------

                      //br
                      // var form_br6 = document.createElement("br");
                      // ref_item.appendChild(form_br6);

                      var will_think = document.createElement("input");
                      // act_record.className = "ref_radio";
                      will_think.name = "ref_item[" +i +"][late_activity]";
                      will_think.type = "radio";
                      will_think.value = 1;
                      will_think.className = "will_radio_think";
                      ref_item.appendChild(will_think);

                      //span
                      var act_record_span2 = document.createElement("span");
                      act_record_span2.className = "will_think";
                      act_record_span2.innerHTML = "今後考える";
                      // act_record_span2.style.display = "none";
                      ref_item.appendChild(act_record_span2);

                      //br
                      var form_br7 = document.createElement("br");
                      ref_item.appendChild(form_br7);

                      //考えない
                      var will_NOT_think = document.createElement("input");
                      // act_NOT_record.className = "ref_radio";
                      will_NOT_think.name = "ref_item[" +i +"][late_activity]";
                      will_NOT_think.value = 0;
                      will_NOT_think.className = "will_radio_not";
                      will_NOT_think.type = "radio";
                      // if(act_NOT_record.checked ==true){
                      //   will_NOT_think.disabled="";
                      // }else{
                      //   will_NOT_think.disabled="disabled";
                      // }
                      // will_NOT_think.style.display = "none";
                      ref_item.appendChild(will_NOT_think);

                      //span---------------------------------
                      var act_not_record_span2 = document.createElement("span");
                      act_not_record_span2.className = "will_think_not";
                      act_not_record_span2.innerHTML = "今後も考えない";
                      // act_not_record_span2.style.display = "none";
                      ref_item.appendChild(act_not_record_span2);

                      //隠しフォーム
                      var hidden_item = document.createElement("input");
                      hidden_item.name = "ref_item[" +i +"][ref_reason]";
                      hidden_item.type = "hidden";
                      hidden_item.value = "";
                      ref_item.appendChild(hidden_item);

          }

          //
          if(reflection_item[i].status=="reason"){
            ref_item.style.backgroundColor = "#ffe4e1";
            ref_item.style.height = "300px";

            //reflection文
            var ref_reason = document.createElement("textarea");
            ref_reason.className = "ref_txt";
            ref_reason.name = "ref_item[" +i +"][ref_reason]";
            ref_reason.rows = 3;
            ref_reason.value = "理由を記入してください";
            ref_item.appendChild(ref_reason);

            //br
            var form_br8 = document.createElement("br");
            ref_item.appendChild(form_br8);

            //記録する
            var act_record = document.createElement("input");
            // act_record.className = "ref_radio";
            act_record.name = "ref_item[" +i +"][ref_activity]";
            act_record.type = "radio";
            act_record.value = "record";
            act_record.className = "record_radio";
            act_record.required = true;
            ref_item.appendChild(act_record);

            //span
            var act_record_span = document.createElement("span");
            act_record_span.className = "ref_txt";
            act_record_span.innerHTML = "記録する　";
            ref_item.appendChild(act_record_span);

            //記録しない
            var act_NOT_record = document.createElement("input");
            // act_NOT_record.className = "ref_radio";
            act_NOT_record.name = "ref_item[" +i +"][ref_activity]";
            act_NOT_record.value = "not_record";
            act_NOT_record.type = "radio";
            act_NOT_record.className = "not_record_radio";
            ref_item.appendChild(act_NOT_record);

            //span
            var act_not_record_span = document.createElement("span");
            act_not_record_span.className = "ref_txt";
            act_not_record_span.innerHTML = "記録しない";
            ref_item.appendChild(act_not_record_span);

            //隠しフォーム
            var hidden_item = document.createElement("input");
            hidden_item.name = "ref_item[" +i +"][late_activity]";
            hidden_item.type = "hidden";
            hidden_item.value = null;
            ref_item.appendChild(hidden_item);
          }

    }
    // console.log(RALOG_set);
  }


  var submake = document.getElementById("reflection_form");

  //送信ボタン
  var sub_btn = document.createElement("input");
  sub_btn.type = "submit";
  sub_btn.value = "完了";
  sub_btn.className = "sub_btn";
  sub_btn.onclick = checkSubmit;
  submake.appendChild(sub_btn);



  // console.log(submake);

}


function checkSubmit(){

  var answer = confirm("本当に完了しますか？");
  // console.log(answer);
  if(answer==true){
    // console.log("asdada");
  }else{
    return;
  }
  // console.log("ククク");

}


function riflection_period(){

  var ref_period = document.getElementById("reflection_period");
  var ref_period2 = document.getElementById("reflection_period2");
  var ref_c = document.getElementById("ref_c");

  if(ref_c.checked = "true"){
    ref_period.disabled = "";
    ref_period2.disabled = "";
  }else if(ref_c.checked = "false"){
    ref_period.disabled = "true";
    ref_period2.disabled = "true";
  }
}

function riflection_period2(){

  var ref_period = document.getElementById("reflection_period");
  var ref_period2 = document.getElementById("reflection_period2");
  var ref_c2 = document.getElementById("ref_c2");

  if(ref_c2.checked = "true"){
    ref_period.disabled = "true";
    ref_period2.disabled = "true";
  }else if(ref_c2.checked = "false"){
    ref_period.disabled = "";
    ref_period2.disabled = "";
  }
}

function record_period(){

  var reco_period1 = document.getElementById("reco_period");
  var reco_period21 = document.getElementById("reco_period2");
  var reco_c1 = document.getElementById("reco_c");

  if(reco_c1.checked = "true"){
    reco_period1.disabled = "";
    reco_period21.disabled = "";
  }else if(reco_c1.checked = "false"){
    reco_period1.disabled = "true";
    reco_period21.disabled = "true";
  }
}

function record_period2(){

  var reco_period1 = document.getElementById("reco_period");
  var reco_period21 = document.getElementById("reco_period2");
  var reco_c21 = document.getElementById("reco_c2");

  if(reco_c21.checked = "true"){
    reco_period1.disabled = "true";
    reco_period21.disabled = "true";
  }else if(reco_c21.checked = "false"){
    reco_period1.disabled = "";
    reco_period21.disabled = "";
  }
}












function get_recordAAAA(){

  //期間設定の情報を取得
  var reco_periperi = reco_peri.reco_per.value;

  //本日を指定した場合
  if(reco_periperi=="today"){
    var todayaaa2 =new Date();
    var we2 = todayaaa2.getMonth()+1;
    var start_date2 = todayaaa2.getFullYear() + "-" + we2+"-"+todayaaa2.getDate();
    var finish_date2 = todayaaa2.getFullYear() + "-" + we2+"-"+todayaaa2.getDate();

  //期間を指定した場合
  }else if(reco_periperi=="select"){
    var start_date2 = reco_peri.start_date.value;
    var finish_date2 = reco_peri.finish_date.value;
  }

  console.log(start_date2);
  console.log(finish_date2);

  //とりあえずテーブルの基盤作成
  var table_div = document.getElementById("record_table");
  //初期化
  table_div.textContent = null;
  //テーブル
  var record_table = document.createElement("table");
  record_table.id = "record_table_sets";
  table_div.appendChild(record_table);

  //タイトル行を追加
  var rows = record_table.insertRow(-1);

  // var record_table_title = document.createElement("tr");
  // record_table.appendChild(record_table_title);

  //それぞれのセルを追加
  var record_table_title_time = rows.insertCell(-1);
  record_table_title_time.id="record_timestamp_title";
  record_table_title_time.innerHTML="リフレクション日時";

  var record_table_title_reflectiontext = rows.insertCell(-1);
  record_table_title_reflectiontext.id="record_ref_textp_title";
  record_table_title_reflectiontext.innerHTML="リフレクション文";

  var record_table_title_activity = rows.insertCell(-1);
  record_table_title_activity.id="record_activity_title";
  record_table_title_activity.innerHTML="操作";

  var record_table_title_activity_later = rows.insertCell(-1);
  record_table_title_activity_later.id="record_late_act_title";
  record_table_title_activity_later.innerHTML="今後の活動";

  var record_table_title_reason = rows.insertCell(-1);
  record_table_title_reason.id="record_reason_title";
  record_table_title_reason.innerHTML="理由";





  $.ajax({
	    url: "php/get_reflection_activities.php",
	    type: "POST",
      data: { start_date : start_date2,
              finish_date : finish_date2},
	    success: function(arr){

        if(arr == "[]"){
          alert("指定期間に記録したリフレクション項目はありません");
          console.log(arr);
        }else{
          var parse = JSON.parse(arr);
          console.log(parse);
          record_reflection_show(parse);
        }

	    },
      error:function(){
        console.log("エラーです");
      }
	});








}
