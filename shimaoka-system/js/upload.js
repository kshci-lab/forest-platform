var fileInput = document.getElementById("ImageForm");
var FilenameDisplay = document.getElementById("FilenameDisplay");

document.getElementById('ImageSaveButton').addEventListener('click', async function() {
    // sevent.preventDefault(); // デフォルトのフォーム送信をキャンセル
    console.log("画像送信");
    const imageInput = document.getElementById('myFile');
    const selectedFile = imageInput.files[0];
    const formData = new FormData();
    formData.append('ImageFile', selectedFile);

    // Fetch APIを使って画像データを非同期で送信
    try{
        const response = await fetch('upload.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.text();
        console.log("送信成功");
        await CreateSlide_Image();
    }catch(error) {
        console.error('エラー:', error);
    }

});

function handleFileSelect() {
    // 「画像追加」でファイルが選択されたときの処理．非表示にしてある画像保存ボタンをクリックする
    document.getElementById("ImageSaveButton").click();
}
//ファイル名を表示する
// document.querySelectorAll('.deco-file input[type=file]').forEach(function(){
// 	this.addEventListener('change',function(e){
// 		let parent = e.target.closest('.deco-file')
// 		parent.querySelector('.file-names').innerHTML=''
// 		for (file of e.target.files) {
// 			parent.querySelector('.file-names').insertAdjacentHTML('beforeend',file.name+"<br>");
// 		}
// 	})
// })

async function CreateSlide_Image(){
    console.log("画像追加後にコンテンツを作成する");
    console.log("項目追加");

    //// 1．imagesテーブルに保存した画像情報を取得する
    await $.ajax({
	    url: "php/get_ImageInfo.php",
	    type: "GET",
        data:{
            imageID: '1'
        },
	    success: function(response){
            if(response != ''){
                var data = JSON.parse(response);
                console.log(data);   
                var ImageID = data[0].image_id;
                var ImageName = data[0].image_name;
                console.log(ImageID);
                console.log(ImageName);
                 //// 2．取得した画像情報を使って1枚のスライドを作成する
                var uuid = getUniqueStr(); // Threadのidをランダム生成
                var setid = getUniqueStr();
                // var c_id= getUniqueStr();
                var quot_uuid = "\"" + uuid + "\""; // quotationをつけたuuid　labelを書く時に欲しかった

                let area = $("#document_area");
                console.log(uuid);
                console.log(quot_uuid);
                // var phpURL="http://localhost/psdss_masakado/get_imageData.php";
                var phpURL="get_imageData.php?imageID="+ImageID;


                let label = "<div class='thread' id='"+uuid+"' value='スレッド'  data-node_id='"+ImageID+"' style='background-color:white; padding:5px; margin-top:5px; margin-bottom:5px; margin-right:5px; margin-left:5px;height:auto'>"+
                                "<img id='preview-"+uuid+"' class=Image src='" +phpURL+"' alt='選択した画像' width='95%'>"+
                                "<input id=DeleteButton-"+uuid+" class='simple_btn' type='button' value='×' onclick='RemoveThread("+quot_uuid+");' style='width:20px; height:20px; font-size:10px; float:right;'>"+
                                "<br>"+
                            "<div class='purpose'>"+
                            "</div>"+
                        "</div>";

                area.append(label);
                // $("body").append(imgElement);
                Record_slide(uuid);
  
                $('#document_area').sortable({
                update: function(){
                    var log = $(this).sortable("toArray");
                    console.log(log);
                    // MoveImageArea();
                    MoveAndExpensionImageArea();
                    // Record_rank();
                }
                });
                
                $('.purpose').sortable({
                update: function(){
                    var log = $(this).sortable("toArray");
                    console.log(log);
                    // MoveImageArea();
                    MoveAndExpensionImageArea();
                    // Record_rank();
                }
                });
                
                // $('#'+uuid).data('node_id', node_id);
                // MoveImageArea();
                MoveAndExpensionImageArea();
                // Record_rank();
                return uuid; // 作成したID（スレッドのID)を返す
            }else{
                console.log("出力が空");
            }
        },
        error: function(xhr, status, error){
            console.error("エラー:", status, error);
        }
    });
    
}
