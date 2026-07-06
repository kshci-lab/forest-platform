
let erase = () => {
  var mydiv = document.getElementById("rebuild");
  mydiv.innerHTML = mydiv.innerHTML.replace( /<!--[\s\S]*?-->/g , '' );
  
};
//全テキストにspanタグを付与
let add_span = () => $("#rebuild").children().addBack().contents().each(function(){
       
    if (this.nodeType == 3) {
     var $this = $(this);
     
        $this.replaceWith($this.text().replace(/(\S)/g, "<span class='paper_txt_obj' >$&</span>"));
     
  }
  
  });

  

//spanで区切られた文字にidを付与する
let add_id = () => {
 let ptolength=$(".paper_txt_obj").length;
  
  for(let i=0;i<ptolength;i++){
  
  $(".paper_txt_obj").eq(i).attr({
    id: 'p_txt_'+i
  });
  
  }
}

// function Create_Sheet(){
//   $.ajax({

//     url: "php/sheet.php",
//     type:"POST",
//     data:{
//         paper_id : paper_id,

//     },
//     success: function () {
//         console.log("登録成功");
//         console.log("ペーパーID：" +paper_id );

//       },
//       error: function () {
//       console.log("登録失敗");},
//   });
// }


// textareaの内容をテキストファイルを出力する
function InputFile(){
var obj1 = document.getElementById("input_file");
console.log(obj1);

obj1.addEventListener("change", function(evt){
 var file = evt.target.files;
 alert(file[0].name + "を取得しました。");
 console.log(file);

// ... スクレイピング処理 ...//
    //FileReaderの作成
 var reader = new FileReader();
 //テキスト形式で読み込む
 reader.readAsText(file[0]);

 //読込終了後の処理
 reader.onload =function(ev){
   //テキストエリアに表示する
   var area = document.getElementById("paper_area");
   
   var str = reader.result;

   // php側で出力させていたときの記述
   // いらない文字を取り除く
   // str = str.slice(1); // １文字目「'」を削除
   // str = str.slice(0, -1); // 最後の文字「'」を削除

   $('#paper_area').empty();

   var span = document.createElement('span'); // 改行はいやなのでspan
   // span.setAttribute('draggable',true);
   span.setAttribute('id', 'rebuild');
   span.innerHTML = str; //html要素に変換


   
   area.append(span); //bodyに追加

  //  erase();
  //  add_span();
  //  add_id();
  //  let paper_id =Date.now().toString();//idの生成
   let paper_content = $('#paper_area').html();


  $.ajax({

   url: "php/insert_paper.php",
   type: "POST",
   data: { 

           paper_content : paper_content,
        },
           success: function () {
               console.log("登録成功");
             },
             error: function () {
             console.log("登録失敗");},

  });

 }
},false);



// $("#rebuild").children().addBack().contents().each(function(){
    
//     if (this.nodeType == 3) {
//      var $this = $(this);
     
//         $this.replaceWith($this.text().replace(/(\S)/g, "<span class='paper_txt_obj' >$&</span>"));
     
//   }
  
//   });
// add_id();


}



// textareaの内容をテキストファイルを出力する
// 拡張子はtxt，中身はHTML形式で，クライアント側に保存
function OutputFile(){

var result = window.confirm('現在の資料情報を出力しますか？');
if(result == true){ // OKが押されたら
var html = $('#paper_area').html();

$.ajax({
 url: "php/create_document.php", // ファイル名をつける
 success:function(data){
   // ダウンロードリンクを作成
   var link = document.createElement( 'a' );
     link.href = window.URL.createObjectURL( new Blob( [html] ) );
     link.download = data; // ファイル名
     link.click();
 }
});
}
}

// 登録済み論文表示モードを切り替えたときの動作
function CheckClick_paper(){
  // checkboxの状態を取得
  check = document.getElementById("checkbox");
  // checlboxがチェックされている時の処理
  if(check.checked == true){
    $('.select_paper').show();
    $('.select_sheet').hide();
  }
  else{
    $('.select_paper').hide();
    $('.select_sheet').show();
  }
}


// ----------------------------登録済み論文の表示ボタン------------------------------------


  


