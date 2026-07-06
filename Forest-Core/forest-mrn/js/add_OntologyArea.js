let isDrawing = false;
let startX, startY;
let TempRectangles = [];
let DecideRectangles = [];

let TA ,TN;

const targetElement = document.getElementById('document_area');

const SlideSelectBox = document.getElementById("Slides");
const NodeSelectBox = document.getElementById("Sentences");


targetElement.addEventListener('contextmenu', function (event){
    event.preventDefault();
    // console.log('右クリックされました');
});

targetElement.addEventListener('mousedown',function(event){
    if(event.button == 2){
        // console.log('右クリックを押したまま');
        // console.log(event.target);
        var startTempID = event.target.id;
        var DecideStartAreaID = startTempID.replace("preview-", "");
        var StartThread = document.getElementById(DecideStartAreaID);
        // console.log(StartThread);
        // console.log(StartThread.clientX);
        // console.log(StartThread.clientY);
        isDrawing = true;
        startX = event.clientX;
        startY = event.clientY;
        // console.log(startX);
        // console.log(startY);
    }
});

targetElement.addEventListener('mouseup',function(event){
    if(event.button == 2){
        // console.log('右クリックを離した');
        // alert("エリアを決定しますか？");
        // console.log(event);
        // console.log(event.target);
        // console.log(event.target.id);
        var TempDecideAreaId = event.target.id;
        // console.log(TempDecideAreaId);
        var DecideAreaID = TempDecideAreaId.replace("preview-", "");
        // console.log(DecideAreaID);
        var ImageThread = document.getElementById(DecideAreaID);
        // console.log(ImageThread);
        if (!isDrawing) return;
        isDrawing = false;

        // console.log(ImageThread.style.clientX);
        // console.log(ImageThread.style.clientY);
        const endX = event.clientX;
        const endY = event.clientY;
        // console.log(endX);
        // console.log(endY);

        // 四角形を確定
        createRectangle(startX, startY, endX, endY, DecideAreaID,"decide");
        

        // 以前の一時的な四角形を削除する
        if (TempRectangles.length > 1) {
            for(var i = 0; i < TempRectangles.length; i++){
                TempRectangles[i].remove();
                console.log("削除完了");
            }
        }
    }
});


function createRectangle(x1, y1, x2, y2, targetAreaID, type) {
    const rectangle = document.createElement("div");
    rectangle.className = "highlightedTempRectangle";
    rectangle.style.left = Math.round(Math.min(x1, x2)) + "px";
    rectangle.style.top = Math.round(Math.min(y1, y2)) + "px";
    rectangle.style.width = Math.round(Math.abs(x1 - x2)) + "px";
    rectangle.style.height = Math.round(Math.abs(y1 - y2)) + "px";

    var targetArea =  document.getElementById(targetAreaID);
    var tRect = targetArea.getBoundingClientRect();
    
    var tRect_top = tRect.top;
    var tRect_height = tRect.height;
    var NewRect_top = Math.min(y1, y2);
    var NewRect_height = Math.abs(y1 - y2);
    var ratioTop = Math.abs(tRect_top - NewRect_top) / tRect_height * 100;
    var ratioHeight = NewRect_height / tRect_height * 100;
    // console.log(Math.abs(tRect_top - NewRect_top));
    // console.log(tRect_height);
    // console.log(ratioTop);

    var tRect_left = tRect.left;
    var NewRect_left = Math.min(x1,x2);
    var NewRect_width =  Math.abs(x1 - x2);
    var tRect_width = tRect.width;
    var ratioLeft = Math.abs(tRect_left - NewRect_left) / tRect_width * 100;
    var ratioWidth = NewRect_width / tRect_width * 100;
    // console.log(ratioLeft);
    // console.log(ratioWidth);
    // document.getElementById("document_area").appendChild(rectangle);
    if(targetArea !== null){
        // console.log(targetArea);
        targetArea.appendChild(rectangle);
    }

    if(type == "temp"){
        // console.log("temp");
        TempRectangles.push(rectangle);
    }else if(type == "decide"){
        // console.log("decide");
        var rect_id = getUniqueStr();
        rectangle.className = "highlightedDecideRectangle";
        var classN = "Rectangle-"+ targetAreaID ;
        rectangle.setAttribute("name", classN);
        rectangle.setAttribute("rectID", rect_id);
        rectangle.setAttribute("rel_top", ratioTop);
        rectangle.setAttribute("rel_left", ratioLeft);
        rectangle.setAttribute("rel_height", ratioHeight);
        rectangle.setAttribute("rel_width", ratioWidth);
        Record_addAOIArea(rect_id, targetAreaID, ratioLeft, ratioTop, ratioWidth, ratioHeight)
        rectangle.addEventListener("click",(event) =>{
            // クリックされた位置の座標を取得
            const x = event.clientX;
            const y = event.clientY;

            //メニューを表示する関数を呼び出す
            Click_AddOntologyInfo(x, y, rectangle);
        });
        DecideRectangles.push(rectangle);
    }
}

function handleMouseMove(event) {
    if (!isDrawing) return;

    const currentX = event.clientX;
    const currentY = event.clientY;

    console.log(event.target.className)
    if(event.target.className = "Image"){
        var targetID = event.target.id;
        var tempID = targetID.replace("preview-", "");
        createRectangle(startX, startY, currentX, currentY, tempID, "temp");   
    }
   
    // 以前の一時的な四角形を非表示に
    if (TempRectangles.length > 1) {
        const lastRectangle = TempRectangles[TempRectangles.length - 2];
        lastRectangle.style.display = "none";
    }
}

document.addEventListener("mousemove", handleMouseMove);

//始め用意していたが，今は使っていない，
function MoveImageArea(){
    console.log("画像が移動");
    // console.log(DecideRectangles.length);
    for(var r_number = 0; r_number < DecideRectangles.length; r_number++){
        // console.log(DecideRectangles[r_number]);
        var recName = DecideRectangles[r_number].getAttribute("name");
        // console.log(recName);
        var threadID = recName.replace("Rectangle-", "");
        // console.log(threadID);
        var rel_top = parseInt(DecideRectangles[r_number].getAttribute("rel_top"));
        // console.log(rel_top);
        var rel_left = parseInt(DecideRectangles[r_number].getAttribute("rel_left"));
        var rel_height = parseInt(DecideRectangles[r_number].getAttribute("rel_height"));

        const BaseThread = document.getElementById(threadID);
        const ThreadRect = BaseThread.getBoundingClientRect();
        // console.log("左上のX座標："+Math.round(ThreadRect.left));
        // console.log("左上のY座標："+Math.round(ThreadRect.top));
        var BaseTop = ThreadRect.top;
        var BaseLeft = ThreadRect.left;
        // console.log("横幅："+Math.round(ThreadRect.width));
        // console.log("縦幅："+Math.round(ThreadRect.height));
        var BaseHeight = ThreadRect.height;
        var BaseWidth = ThreadRect.width;
        // console.log(BaseHeight);
        var Rel_Top = BaseHeight /100 * rel_top;
        var Rel_Left = BaseWidth / 100 * rel_left;
        // console.log(Rel_Top);
        var top_Number = BaseTop + Rel_Top;
        var left_Number = BaseLeft + Rel_Left;
        var bottom_number = top_Number + rel_height;
        // console.log(top_Number);
        DecideRectangles[r_number].style.top = top_Number + "px";
        DecideRectangles[r_number].style.left = left_Number + "px";

        var DocumentArea_Rect = targetElement.getBoundingClientRect();
        var DocumentArea_Bottom = DocumentArea_Rect.bottom;
        var DocumentArea_Top = DocumentArea_Rect.top;
        

        console.log(bottom_number +":"+ DocumentArea_Bottom);
        if(bottom_number > DocumentArea_Bottom || top_Number < DocumentArea_Top){
            console.log("範囲外にいった");
            DecideRectangles[r_number].style.display = "none";
        }else if(bottom_number < DocumentArea_Bottom || top_Number > DocumentArea_Top){
            console.log("範囲内にある");
            DecideRectangles[r_number].style.display = "inline";
        }
    }
}

//視点とサイズの変更
function MoveAndExpensionImageArea(){
    // console.log("画像が拡大");
    for(var r_number = 0; r_number < DecideRectangles.length; r_number++){
        var recName = DecideRectangles[r_number].getAttribute("name");
        var threadID = recName.replace("Rectangle-", "");
        var rel_top = parseInt(DecideRectangles[r_number].getAttribute("rel_top"));
        var rel_left = parseInt(DecideRectangles[r_number].getAttribute("rel_left"));
        var rel_height = parseInt(DecideRectangles[r_number].getAttribute("rel_height"));
        var rel_width = parseInt(DecideRectangles[r_number].getAttribute("rel_width"));

        // console.log(rel_left);

        const BaseThread = document.getElementById(threadID);
        const ThreadRect = BaseThread.getBoundingClientRect();

        // console.log("左上のX座標："+Math.round(ThreadRect.left));
        // console.log("左上のY座標："+Math.round(ThreadRect.top));
        var BaseTop = ThreadRect.top;
        var BaseLeft = ThreadRect.left;
        // console.log("横幅："+Math.round(ThreadRect.width));
        // console.log("縦幅："+Math.round(ThreadRect.height));
        var BaseHeight = ThreadRect.height;
        var BaseWidth = ThreadRect.width;
        // console.log(BaseHeight+":"+BaseWidth);
        var Rel_Top = BaseHeight / 100 * rel_top;
        var Rel_Left = BaseWidth / 100 * rel_left;
        // console.log(Rel_Top+":"+Rel_Left);
        var top_Number = BaseTop + Rel_Top;
        var left_Number = BaseLeft + Rel_Left;
        // console.log(top_Number);
        var height_number = BaseHeight /100 * rel_height;
        var width_number = BaseWidth /100 * rel_width;
        var bottom_number = top_Number + rel_height;

        DecideRectangles[r_number].style.top = top_Number + "px";
        DecideRectangles[r_number].style.left = left_Number + "px";
        DecideRectangles[r_number].style.height = height_number + "px";
        DecideRectangles[r_number].style.width = width_number + "px";

        var DocumentArea_Rect = targetElement.getBoundingClientRect();
        var DocumentArea_Bottom = DocumentArea_Rect.bottom;
        var DocumentArea_Top = DocumentArea_Rect.top;

        if(bottom_number > DocumentArea_Bottom || top_Number < DocumentArea_Top){
            console.log("範囲外にいった");
            DecideRectangles[r_number].style.display = "none";
        }else if(bottom_number < DocumentArea_Bottom || top_Number > DocumentArea_Top){
            console.log("範囲内にある");
            DecideRectangles[r_number].style.display = "inline";
        }
    }
}

function Click_AddOntologyInfo(x,y, T_rect){
    console.log("クリックした");
    console.log(T_rect); //クリックした領域を獲得
    TA = T_rect;

    var dm_menu2 = document.getElementById('document_area_conmenu2'); //関係性を確認するメニュー

    //メニューの位置を設定
    dm_menu2.style.left = x + 'px';
    dm_menu2.style.top = y + 'px';
    dm_menu2.classList.add('on');


    var SlidesALL = document.getElementsByClassName("thread");
    // console.log(SlidesALL)
    if(SlideSelectBox.options.length > 0){
        deleteSelectOptions(SlideSelectBox);
    }
    for(var i = 0; i < SlidesALL.length; i++){
        console.log(SlidesALL[i]);
        // console.log(SlidesALL[i].textContent);
        console.log(SlidesALL[i].id);
        var SlideText = SlidesALL[i].firstElementChild.innerHTML;
        if(SlideText != ""){
            // 新しいオプション要素を作成
            const option = document.createElement("option");
            option.text = SlideText; // オプションのテキストを設定
            option.value = SlidesALL[i].id; // オプションの値を設定

            // 新しいオプションをSelect要素に追加
            SlideSelectBox.appendChild(option);
        }
    }
}


// ウィンドウのリサイズイベントを監視し、関数を実行する
window.addEventListener("resize", function () {
    // ここに実行したい関数のコードを記述
    // console.log("ウィンドウがリサイズされました！");
    MoveAndExpensionImageArea();
});
  
targetElement.addEventListener("scroll", () =>{
    // console.log("スクロールを検知");
    // MoveImageArea();
    MoveAndExpensionImageArea();
})

window.addEventListener("scroll", () =>{
    // console.log("ブラウザのスクロール");
    // MoveImageArea();
    MoveAndExpensionImageArea();
})

//意味情報の決定
//2022-11-24 shimizu
function Record_addAOIArea(id, slide_id, left, top, width, height){
  
    $.ajax({
        url: "php/Record_AddAOIArea.php",
        type: "POST",
        data: { id : id,
                slide_id : slide_id,
                Left : left,
                Top : top,
                Width : width,
                Height : height},
        success: function () {
          console.log("登録成功");
        },
        error: function () {
        console.log("登録失敗");},
    });
}

async function AddAOI_on_ImageArea(){
    await $.ajax({
        url: "php/get_AddAOIArea.php",
        type: "POST",
        success: function(arr){
          if(arr == "[]"){
            console.log(arr);
          }else{
            console.log(arr);
            var parse = JSON.parse(arr);
            console.log(parse);//スライド上に追加してあるのノードの内容
            console.log(parse.length);//スライド上に追加してあるのノードの個数
            for(var i=0; i<parse.length; i++){
              console.log(parse[i]); 
              rebuildAreaOnImage(parse[i].id,  parse[i].slide_id, parse[i].node_id, parse[i].logic_ontology_id, parse[i].left, parse[i].top, parse[i].Width, parse[i].Height);           
            //   break;
            }
            console.log("画像上の領域を追加");
          }
        },
        error:function(){
          console.log("エラーです");
        }
      });
}


function rebuildAreaOnImage(rect_id, slide_id, node_id, logic_ontology_id, rel_left, rel_top, rel_width, rel_height){
    console.log(node_id);
    console.log(logic_ontology_id);

    const target_slide = document.getElementById(slide_id);
    const ThreadRect = target_slide.getBoundingClientRect();
    console.log(target_slide);
    console.log(ThreadRect);
    
    var BaseTop = ThreadRect.top;
    var BaseLeft = ThreadRect.left;
    var BaseHeight = ThreadRect.height;
    var BaseWidth = ThreadRect.width;
    console.log(BaseTop+","+BaseLeft+","+BaseHeight+","+BaseWidth);

    var Rel_Top = BaseHeight / 100 * rel_top;
    var Rel_Left = BaseWidth / 100 * rel_left;
    var top_Number = BaseTop + Rel_Top;
    var left_Number = BaseLeft + Rel_Left;
    var height_number = BaseHeight /100 * rel_height;
    var width_number = BaseWidth /100 * rel_width;
    
    const rectangle = document.createElement("div");
    rectangle.style.left = Math.round(left_Number) + "px";
    rectangle.style.top = Math.round(top_Number) + "px";
    rectangle.style.width = Math.round(width_number) + "px";
    rectangle.style.height = Math.round(height_number) + "px";

    rectangle.className = "highlightedDecideRectangle";
    var classN = "Rectangle-"+ slide_id;
    rectangle.setAttribute("name", classN);
    rectangle.setAttribute("rectID", rect_id);
    rectangle.setAttribute("rel_top", rel_top);
    rectangle.setAttribute("rel_left", rel_left);
    rectangle.setAttribute("rel_height", rel_height);
    rectangle.setAttribute("rel_width", rel_width);
    
    rectangle.addEventListener("click",(event) =>{
        // クリックされた位置の座標を取得
        const x = event.clientX;
        const y = event.clientY;

        //メニューを表示する関数を呼び出す
        Click_AddOntologyInfo(x, y, rectangle);
    });
    
    target_slide.append(rectangle);
    DecideRectangles.push(rectangle);
    debugRectangles();
}

function debugRectangles(){
    for(var i = 0; i<DecideRectangles.length; i++){
        console.log(DecideRectangles[i]);
    }
}

function AddOntologyInfo(){
    console.log(TA);
    var choiceNodeValue = NodeSelectBox.value;
    console.log(choiceNodeValue);

    var targetNode = document.getElementById(choiceNodeValue);
    var targetSpanTag = targetNode.firstElementChild;
    var targetNodeID = targetSpanTag.getAttribute("node_id")
    var targetConceptID = targetSpanTag.getAttribute("concept_id");
    var SelectBoxID = "SelectBox-"+choiceNodeValue;
    var targetSelectBox = document.getElementById(SelectBoxID);
    var targetSelectBoxValue = targetSelectBox.value;

    console.log(targetNode);
    console.log(targetNodeID);
    console.log(targetConceptID);
    console.log(SelectBoxID);
    console.log(targetSelectBox);
    console.log(targetSelectBoxValue);

    TA.setAttribute("content_id", choiceNodeValue);
    TA.setAttribute("node_id", targetNodeID);
    TA.setAttribute("concept_id", targetConceptID);

    CancelButton_Click("document_area_conmenu2");
}


// 選択肢が変更されたときに実行される関数
SlideSelectBox.addEventListener("change", function() {
    // 選択された<option>の値を取得
    var selectedValue = SlideSelectBox.value;
    console.log(selectedValue);
    // 選択された<option>の値に応じて処理を実行
    const parentDiv = document.getElementById(selectedValue); // 親のdiv要素を取得
    // var content_dom = $(selectedValue).find('.scenario_content');
    var content_dom = parentDiv.getElementsByClassName("scenario_content"); // 特定のクラス名をもつ子要素を取得
    console.log(content_dom);

    if(NodeSelectBox.options.length > 0){
        deleteSelectOptions(NodeSelectBox);
    }
    
    for(const element of content_dom){
        var NodeValueText = element.firstElementChild.innerHTML;
        console.log(element);
        console.log(element.id);
        console.log(element.node_id);
        // 新しいオプション要素を作成
        const option = document.createElement("option");
        option.text = NodeValueText; // オプションのテキストを設定
        option.value = element.id; // オプションの値を設定

        NodeSelectBox.appendChild(option);
    }

});