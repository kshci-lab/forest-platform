


function count_node(){
    var jmnode = document.getElementsByTagName("jmnode");
    var count_predict = 0;
    var count_toi = 0;
    var count_toi_deep = 0;
    var count_answer = 0;
    var count_criticism = 0;
    
    console.log("総ノード数"+jmnode.length);
    
    for(var i=0; i<jmnode.length; i++){
        
        
        var content = jmnode[i].innerHTML;
        
        // nishida ノード内容変更による後続するノード追加
        if(jmnode[i].getAttribute("type") == "predict"){
            
            count_predict += 1;
        }else if(jmnode[i].getAttribute("type") == "toi"){
            
            count_toi += 1;
        }else if(jmnode[i].getAttribute("type") == "answer"){
            
            count_answer += 1;
        }else if(jmnode[i].getAttribute("type") == "toi_deep"){
            
            count_toi_deep += 1;
        }else{
            count_criticism += 1;
        }
        
        
        
    }
    
    console.log("未回答問いノード数"+count_toi);
    console.log("回答済問いノード数"+count_toi_deep);
    console.log("総予測ノード数"+count_predict);
    console.log("解釈ノード数"+count_answer);
    console.log("批評ノード数"+count_criticism);
};
