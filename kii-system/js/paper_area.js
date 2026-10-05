var zoom = 1;
    
function getcssVal(area, style){
  // 要素を取得
var Container = document.getElementById(area);

// 要素のスタイルを取得
var computedStyle = getComputedStyle(Container);

// padding-top スタイル値を取得
var Value = computedStyle.getPropertyValue(style);

return Value;

}


// nishida　あとで書き足す
// page-containerは独自

function zoomIn_paper(){
  zoom *= 1.1;
  valtop = getcssVal('page-container', 'padding-top');
  valleft = getcssVal('page-container', 'padding-left');
  $('#page-container').css('transform', 'scale(' + zoom + ')');
  $('#page-container').css('padding-top', valtop * zoom);
  $('#page-container').css('padding-left',  valtop * zoom);}

function zoomOut_paper(){
  zoom *= 0.9

  valtop = getcssVal('page-container', 'padding-top');
  valleft = getcssVal('page-container', 'padding-left');
  $('#page-container').css('transform', 'scale(' + zoom + ')');
  
  $('#page-container').css('padding-top', valtop * zoom);
  $('#page-container').css('padding-left',  valtop * zoom);
}

function zoomInit_paper(){
  zoom = 1;
  valtop = getcssVal('page-container', 'padding-top');
  valleft = getcssVal('page-container', 'padding-left');
  $('#page-container').css('transform', 'scale(' + zoom + ')');
  $('#page-container').css('padding-top', valtop * zoom);
  $('#page-container').css('padding-left',  valtop * zoom);
}



$(window).keydown(function(e){

  if(event.shiftKey){

    if(e.keyCode === 107){

      zoomIn_paper();

      return false;
    }

  }

});



$(window).keydown(function(e){

  if(event.shiftKey){

    if(e.keyCode === 109){

      zoomOut_paper();

      return false;
    }

  }

});



$(window).keydown(function(e){

  if(event.shiftKey){

    if(e.keyCode === 82){

      zoomInit_paper();

      return false;
    }

  }

});







// $('#page-container').on('click', function() {
//   var day_id = $(this).attr('id');
//   console.log(day_id);
// });

// let elm = document.getElementsByClassName("paper_txt_obj");
// elm.addEventListner('click', (e) => {
//   console.log(e.target.id);
// })


// let addHightlightChar2 = (char_object_id, type, user) => {
//   // ある文字にハイライトを反映する関数
//   let object_elm = document.getElementById(char_object_id);
//   if(object_elm !== null){
//       object_elm.setAttribute('data-user', user);
//       object_elm.setAttribute('type', type);
//   }
// };




// // let addHightlightSentences = (text_object, hightlight_list) => {
//   let addHightlightSentences2 = (hightlight_list,user) => {
//     // 文単位でハイライトする処理
//     hightlight_list.forEach((obj, index) => {
//         for(let count=0; count <= (obj.end_char_id - obj.start_char_id); count++){
//             let char_id = obj.start_char_id + count;
//             let char_id_txt = 'p_txt_'+char_id;
//             let type = obj.type;
//             // let type = "toi";
//             // let dup = findCharDuplication(text_object, hightlight_list, char_id);
//             // let paren = 0.5 * dup;
//             // let paren = 0.5;
//             addHightlightChar2(char_id_txt, type, user);
//         }
//     });
// };