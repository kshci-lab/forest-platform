
let select_c = document.querySelector('[name="add_criticism"]');

if(select_c){
  select_c.onchange = event => { 
    value = select_c.value;
    console.log(value);

    switch (value){
      case 'criticism':
              add_Cnode(value, "批評：");
              break;
      case 'evaluation_good':
              add_Cnode(value, "価値判断：");
              break;
              case 'objection':
                  add_Cnode(value, "意見：");        
                  break;
      case 'modification':
          add_Cnode(value, "問題点：");
          break;

      case 'e_1':
          add_Cnode(value, "有用性："); 
        break;
      case 'e_2':
      add_Cnode(value, "新規性："); 
        break;
      case 'e_3':
          add_Cnode(value, "信頼性："); 
        break;
      case 'o_1':
          add_Cnode(value, "反論："); 
        break;
      case '0_2':
        add_Cnode(value, "改善策："); 
        break;
      case '0_3':
              add_Cnode(value, "代替案："); 
        break;
      case 'm_1':
              add_Cnode(value, "語の妥当性："); 
        break;
      case 'm_2':
              add_Cnode(value, "証拠の十分性："); 
        break;
      case 'm_3':
              add_Cnode(value, "論理の整合性："); 
        break;
      case '':
          add_NodeLabel(value, "【主軸】："); 
        break;
      default:
          // それ以外はevaluation_good
          add_Cnode("criticism", "New node");
      //   console.log('住所はその他です');
    }
  }
}




// 








function change_tag(type,topic){

    var selected_node = _jm.get_selected_node();

    for(key in selected_node){

        if(key == "id"){
  
            var selected_id = selected_node[key];
  
        }
  
    }

    // topic = topic ;
    var node = _jm.update_node(selected_id,topic);
    var jmnode = document.getElementsByTagName("jmnode");

    for(var i=0; i<jmnode.length; i++){
  
        if(selected_id == jmnode[i].getAttribute("nodeid")){
  
            

                        $.ajax({

                            url: "php/update_node.php",
                            type: "POST",
                            data: { update : "content",
                                    id : selected_id,
                                    content : jmnode[i].innerHTML }

                        });


                        $.ajax({

                            url: "php/update_node.php",
                            type: "POST",
                            data: { update : "type",
                                    id : selected_id,
                                    type : type }

                        });
  
        }
  
    }
    let mm_menu2 = document.getElementById('mindmap_conmenu2');  //独自コンテキストメニュー
    mm_menu2.classList.remove('on');
};


function remove_critical_area(){
    // console.log("成功");
    let mm_menu2 = document.getElementById('mindmap_conmenu2');  //独自コンテキストメニュー
    mm_menu2.classList.remove('on');

};

function change_select_Cnode(val,nodeid=null){

  if (val == "onload"){
    var selectElements = document.querySelectorAll('[name="change_criticism2"]');
    selectElements.forEach(function(select_cc) {
      switch_tag(select_cc)
    });
  }
  else if(val == "add"){
    var selectElements = document.querySelectorAll('[name="change_criticism2"]');
    selectElements.forEach(function(select_cc) {
      switch_tag(select_cc)
    });
  }

    // 各要素に対して処理を適用
  
}

function change_select_Nlabel(val,nodeid=null){

  if (val == "onload"){
    var selectElements = document.querySelectorAll('[name="change_labels"]');
    selectElements.forEach(function(select_cc) {
      switch_label(select_cc)
    });
  }
  else if(val == "add"){
    var selectElements = document.querySelectorAll('[name="change_labels"]');
    selectElements.forEach(function(select_cc) {
      switch_label(select_cc)
    });
  }

    // 各要素に対して処理を適用
  
}

function switch_tag(select_cc){
    select_cc.onchange = function(event) {
      var value = select_cc.value;
      console.log(value);

      switch (value) {
          case 'criticism':
              change_tag(value, "批評：");
              break;
          case 'evaluation_good':
              change_tag(value, "価値判断：");
              break;
          case 'objection':
              change_tag(value, "意見：");
              break;
          case 'modification':
              change_tag(value, "問題点：");
              break;
          case 'e_1':
              change_tag(value, "有用性：");
              break;
          case 'e_2':
              change_tag(value, "新規性：");
              break;
          case 'o_1':
            change_tag(value, "反論："); 
            break;
          case '0_2':
            change_tag(value, "改善策："); 
            break;
          case '0_3':
            change_tag(value, "代替案："); 
            break;
          case 'm_1':
            change_tag(value, "語の妥当性："); 
            break;
          case 'm_2':
            change_tag(value, "証拠の十分性："); 
            break;
          case 'm_3':
            change_tag(value, "論理の整合性："); 
            break;
          // 他のケースも同様に追加
          default:
              // デフォルトの処理
              change_tag("criticism", "New node");
      }
  };
}

function switch_label(select_cc){
  select_cc.onchange = function(event) {
    var value = select_cc.value;
    console.log(value);

    switch (value) {
        case 'primary_label':
            value = "pl_0"
            change_tag(value, "【主軸】：");
            break;
        case 'pl_1':
            change_tag(value, "【主軸】有用性：");
            break;
        case 'pl_2':
            change_tag(value, "【主軸】新規性：");
            break;
        case 'pl_3':
            change_tag(value, "【主軸】信頼性：");
            break;
        case 'issue_label':
            value = "il_non_0"
            change_tag(value, "【課題】(未検討)：");
            break;
        case 'il_non_1':
            change_tag(value, "【課題】語の妥当性(未検討)：");
            break;
        case 'il_non_2':
            change_tag(value, "【課題】証拠の十分性(未検討)：");
            break;
        case 'il_non_3':
            change_tag(value, "【課題】論理の整合性(未検討)：");
            break;
        case 'il_re_0':
            change_tag(value, "【課題】(再検討)：");
            break;
        case 'il_re_1':
            change_tag(value, "【課題】語の妥当性(再検討)：");
            break;
        case 'il_re_2':
            change_tag(value, "【課題】証拠の十分性(再検討)：");
            break;
        case 'il_re_3':
            change_tag(value, "【課題】論理の整合性(再検討)：");
            break;
        case 'consistency_label':
            value = "cl_0"
            change_tag(value, "整合性：");
            break;
        // 他のケースも同様に追加
        default:
            // デフォルトの処理
            change_tag("primary_label", "【主軸】：");
    }
  };
}