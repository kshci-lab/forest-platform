//tabをクリックした際の動作

jQuery(function($){
  $('.tabcontent > div').hide();

  //１番最初かどうかの確認処理
  if($(this).html()==undefined){
    var first_tab= "true";
  }

  $('.tabnav a').click(function () {

    if(first_tab=="false" && $(".tabnav .active").text()=="思考整理支援システムリフレクションリフレクション履歴" && (($(this).html()=="履歴")||($(this).html()=="思考整理支援システム")) && !confirm('現在のリフレクション情報は保存されません．\n思考整理支援活動に戻りますか？')){
        /* キャンセルの時の処理 */
        first_tab= "false";
        return false;
    }else{
        /*　OKの時の処理 */
        //目印取得
        var testxml = document.getElementById("reflection_form");
        //初期化
        testxml.textContent = null;
        first_tab="false";
    }

      $('.tabcontent > div').hide().filter(this.hash).fadeIn();

      $('.tabnav a').removeClass('active');
      $(this).addClass('active');

      return false;
  }).filter(':eq(0)').click();
});

// 3) タブ切替時にoverlayを確実にトグル
function activateSharedTab(id){
  // 既存のタブ切替処理はそのまま
  try{
    var ov = document.getElementById('shared_combination_overlay');
    if(ov){
      if(id === 'tab-combination'){ ov.style.display = 'block'; }
      else { ov.style.display = 'none'; }
    }
  }catch(e){ console && console.warn && console.warn('activateSharedTab overlay toggle failed', e); }
}
