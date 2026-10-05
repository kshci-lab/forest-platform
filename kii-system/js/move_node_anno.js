

// nishida

         //ノード位置取得関数
         function GetPosition(id){
            var jmnode = document.getElementsByTagName("jmnode");
            for(i=0; i<jmnode.length; i++){
                if(jmnode[i].getAttribute("nodeid") == id){//回ってきたidが選択中ノードの時
                    
                    var position = jmnode[i].getBoundingClientRect(); 
                    // var position = jmnode[i].get_view_offset(); 

                    // console.log(position);
                    var positionObj = {"top": position.y, "left":position.x}; 
                    jmnode[i].style.backgroundColor = "#FFABE1";
                    jmnode[i].style.border = "5px solid #C689C6";
                    let topic = jmnode[i].innerHTML;
                    alert(topic);
                    // わからない
                }
                    if(position != undefined){
                    break;
                    }
                }
            return  positionObj; 
        }
       


// 後で直す
// ノードから論文アノテーションに移動


// ノードから論文アノテーションに移動
const move2anno_from_node = (annotations_list) => {

    // ノードid取得
    var selected_node_id = get_selected_nodeid();;

    // annotationリストから同じノードidを持つannotationの先頭のpaper_t_idを取得
    const filterdAnnotations = annotations_list.filter((annotation) => {
        return annotation.node_id == selected_node_id;
        // nishida　見つけれん勝った時用になにか必要あるかも　https://cpoint-lab.co.jp/article/202010/17597/

    });
    console.log(filterdAnnotations);

   if(filterdAnnotations.length == 0){
    alert("紐づいたアノテーションはありません");
   } if(filterdAnnotations.length == 1){
       let target_anno_id = filterdAnnotations[0].start_char_id;
       // そこのtopへジャンプ
       console.log(target_anno_id);
        // 論文エリアまでの距離 https://code-log.net/jquery/position/
        let offset_y_paper = $("#page-container").offset().top;
       let offset_y = $("[char_id = 'p_txt_"+target_anno_id+"']").offset().top;
    //    console.log(offset_y);
    // zoom = 1;
    // $('#page-container').css('transform', 'scale(' + zoom + ')');
       $('#rebuild,#page-container').animate({scrollTop: offset_y - offset_y_paper}, 100);

    //    var target = document.getElementById("btn-a");
    //    target.href = $("[char_id = 'p_txt_"+target_anno_id+"']");

   }else {
        // ２つ以上あった場合

        let target_anno_id = filterdAnnotations.slice(-1)[0].start_char_id;
        console.log(target_anno_id);
        // 論文エリアまでの距離 https://code-log.net/jquery/position/
        let offset_y_paper = $("#page-container").offset().top;
       let offset_y = $("[char_id = 'p_txt_"+target_anno_id+"']").offset().top;
    //    console.log(offset_y);
    // zoom = 1;
    // $('#page-container').css('transform', 'scale(' + zoom + ')');
       $('#rebuild,#page-container').animate({scrollTop: offset_y - offset_y_paper}, 100);

    
   }


    
};




// 論文アノテーションから該当ノードに移動
const move2node_from_anno = (annotations_list) => {
    
    //右クリック時にクリックしたdocument_area上のp_txt_idを取得

    let selected_anno_p_id = window.getSelection().anchorNode.parentElement.getAttribute("char_id").substr(6);
    console.log(selected_anno_p_id);
    
    // annotation配列からselected_anno_p_idが当てはまるオブジェクトのリストを取得
    const filterdAnnotations = annotations_list.filter((annotation) => {

            
        return (annotation.start_char_id <= selected_anno_p_id && 
                selected_anno_p_id <= annotation.end_char_id);

        // nishida　見つけれん勝った時用になにか必要あるかも　https://cpoint-lab.co.jp/article/202010/17597/

    });
    console.log(filterdAnnotations);

    // 文章オブジェクトのリストの重なりのパターンから選択するオブジェクトを選ぶ　小さいやつが正義
   // 完全に重なっている場合は参照やったらプルダウンメニューとか作ることを考えるけどノード付与はどーしよう
    // 見つけたノードidから nishida 修正必要一番最新のアノテーションを取得する

    const move_nodeMotion = (node_id) => {

        let position = GetPosition(node_id);
        // let position_x = position.top * 1.5;    // 一番上からの位置sを取得
        let position_x = position.top;    // 一番上からの位置を取得
    
        let position_y = position.left;    // 一番左からの位置を取得
        console.log(position_y);
        // console.log(position_y2);
        var zoom = 1.5;
        // $('.jsmind-inner').css('transform', 'scale(' + zoom + ')');
        $('.jsmind-inner,jmnode').animate({scrollTop: position_x, scrollLeft: position_y}, 1000);
    
    };

    // 見つけたノードidから nishida 修正必要　一番最新のアノテーションを取得する
    if(filterdAnnotations.length > 1){
        let target_node_id = filterdAnnotations.slice(-1)[0].node_id;
        move_nodeMotion(target_node_id);
    }else{
        let target_node_id = filterdAnnotations[0].node_id;
        console.log(target_node_id);
        move_nodeMotion(target_node_id);

    }
      //   console.log(target_node_id);


    // move_nodeMotion(target_node_id);
    // filterdAnnotations.forEach((obj, index) => {

    //     let target_node_id = obj.node_id;
    //     console.log(target_node_id);
    //     move_nodeMotion(target_node_id);
        
        
    // });
    
};





// 論文アノテーションから該当ノードに移動
const move2node_from_anno2 = (annotations_list) => {
    
    //右クリック時にクリックしたdocument_area上のp_txt_idを取得

    let selected_anno_p_id = window.getSelection().anchorNode.parentElement.getAttribute("char_id").substr(6);
    console.log(selected_anno_p_id);
    
    // annotation配列からselected_anno_p_idが当てはまるオブジェクトのリストを取得
    const filterdAnnotations = annotations_list.filter((annotation) => {

            
        return (annotation.start_char_id <= selected_anno_p_id && 
                selected_anno_p_id <= annotation.end_char_id);

        // nishida　見つけれん勝った時用になにか必要あるかも　https://cpoint-lab.co.jp/article/202010/17597/

    });
    console.log(filterdAnnotations);

    // 文章オブジェクトのリストの重なりのパターンから選択するオブジェクトを選ぶ　小さいやつが正義
   // 完全に重なっている場合は参照やったらプルダウンメニューとか作ることを考えるけどノード付与はどーしよう
    // 見つけたノードidから nishida 修正必要一番最新のアノテーションを取得する

    const move_nodeMotion = (node_id) => {

        let position = GetPosition(node_id);
        // let position_x = position.top * 1.5;    // 一番上からの位置sを取得
        let position_x = position.top;    // 一番上からの位置を取得
    
        let position_y = position.left;    // 一番上からの位置を取得
        console.log(position_y);
        // console.log(position_y2);
        var zoom = 1.5;
        // $('.jsmind-inner').css('transform', 'scale(' + zoom + ')');
        $('#jsmind_container'+area+',.jsmind-inner').animate({scrollTop: position_x, scrollLeft: position_y}, 1000);
    
    };

    // 見つけたノードidから nishida 修正必要　一番最新のアノテーションを取得する
    if(filterdAnnotations.length > 1){
        let target_node_id = filterdAnnotations.slice(-1)[0].node_id;
        move_nodeMotion(target_node_id);
    }else{
        let target_node_id = filterdAnnotations[0].node_id;
        console.log(target_node_id);
        move_nodeMotion(target_node_id);

    }
      //   console.log(target_node_id);


    // move_nodeMotion(target_node_id);
    // filterdAnnotations.forEach((obj, index) => {

    //     let target_node_id = obj.node_id;
    //     console.log(target_node_id);
    //     move_nodeMotion(target_node_id);
        
        
    // });
    
};
