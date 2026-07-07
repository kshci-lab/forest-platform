function input_comment(){
    node = _jm2.get_selected_node()

    comment_area = document.getElementById("comment_area");
    comment = comment_area.value;
    var commented_node_id =node["id"];
    
    var random8Digits = generateRandomNumber();
    var comment_id = random8Digits;//idの生成
    a = _jm2.get_selected_node()["topic"];
    console.log(a);

    $.ajax({
        url: "php/insert_comment.php",
        type: "POST",
        data: { insert : "comment",
                id : comment_id,
                comment : comment,
                nodeid : commented_node_id,
                map_id : parent_map_id,
            },
        success: function(result){
            console.log(result);
            
            
            $("[nodeid="+node["id"]+"]").toggleClass("commented");
            
        },
        error:function(){
            console.log("エラーです");
        }
    });
    

    

}

// 8桁のランダムな整数を生成する関数
function generateRandomNumber() {
    // Math.random()は0以上1未満の乱数を返すため、それを利用して8桁の数に変換
    var randomNumber = Math.floor(Math.random() * 100000000);

    // 生成した数が8桁未満の場合は、先頭に0を付加して8桁にする
    var result = randomNumber.toString().padStart(8, '0');

    return result;
}
