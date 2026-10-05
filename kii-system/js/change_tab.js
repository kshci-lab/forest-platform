//tabをクリックした際の動作

jQuery(function($){
  $('.tabcontent > div').hide();

  //１番最初かどうかの確認処理
  if($(this).html()==undefined){
    var first_tab= "true";
  }

  $('.tabnav a').click(function () {

    // if(first_tab=="false" && $(".tabnav .active").text()=="思考整理支援システムリフレクションリフレクション履歴" && (($(this).html()=="履歴")||($(this).html()=="論文読解支援システム")) && !confirm('現在のリフレクション情報は保存されません．\n思考整理支援活動に戻りますか？')){
    //     /* キャンセルの時の処理 */
    //     first_tab= "false";
    //     return false;
    // }else{
    //     /*　OKの時の処理 */
    //     //目印取得
    //     var testxml = document.getElementById("reflection_form");
    //     //初期化
    //     testxml.textContent = null;
    //     first_tab="false";
    // }

    if(first_tab == "true"){
      $("#paper_area").empty();
      Rebuild_paper("document_area");
      first_tab = "false";
    }else{
      $("#document_area").empty();
      first_tab = "true";     
    }

      $('.tabcontent > div').hide().filter(this.hash).fadeIn();
      $('.tabnav a').removeClass('active');
      $(this).addClass('active');

      // Rebuild_paper2("paper_area");
        
      return false;
  }).filter(':eq(0)').click();




  
  var pap_menu = document.getElementById('paper_conmenu');  //独自コンテキストメニュー
  var pap_area = document.getElementById('paper_area');     //対象エリア

  var mm_menu_s = document.getElementById('mindmap_conmenu_someone');  //他者のマインドマップメニュー
  var mm_menu_m = document.getElementById('mindmap_conmenu_my');  //独自コンテキストメニュー
  var mm_area_s = document.getElementById('jsmind_container2');     //対象エリア
  var mm_area_m = document.getElementById('jsmind_container3');     //対象エリア
  var body = document.body;    
  
   // 論文エリアで右クリック時に独自コンテキストメニューを表示する
   pap_area.addEventListener('contextmenu',function(e){
    pap_menu.style.left = (e.pageX - document.body.scrollLeft - 10) + 'px';
    pap_menu.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
    pap_menu.classList.add('on');
  });

  // 他者のマインドマップ上で右クリック時に独自コンテキストメニューを表示する
  // mm_area_s.addEventListener('contextmenu',function(e){
  //   mm_menu_s.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
  //   mm_menu_s.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
  //   mm_menu_s.classList.add('on');

  // });
  // 自分のマインドマップ上で右クリック時に独自コンテキストメニューを表示する
  mm_area_m.addEventListener('contextmenu',function(e){
    mm_menu_m.style.left = (e.pageX - document.body.scrollLeft + 10) + 'px';
    mm_menu_m.style.top = (e.pageY - document.body.scrollTop + 10) + 'px';
    mm_menu_m.classList.add('on');

  });

    // 左クリック時に独自コンテキストメニューを非表示にする
    body.addEventListener('click',function(){
      if(pap_menu.classList.contains('on')){
        pap_menu.classList.remove('on');
      }

      if(mm_menu_s.classList.contains('on')){
        mm_menu_s.classList.remove('on');
      }
  
    });



});
