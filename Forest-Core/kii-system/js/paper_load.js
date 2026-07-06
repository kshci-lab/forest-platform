const setTaggedHTMLPaperData = (file_input_btn_id, paper_area_id) => {
    // 論文のHTMLファイルを入力（選択）して，それをSPANを挟むよう変換して，対象のテキストエリアに挿入するボタンクリックイベントを追加する関数
    console.log(file_input_btn_id);
    const btn = document.getElementById("input_htmlfile");
    console.log(btn);
    btn.addEventListener("click", () => {
        btn.addEventListener("change", (evt) => {
            const file = evt.target.files;
            //FileReaderの作成
            const reader = new FileReader();
            //テキスト形式で読み込む
            reader.readAsText(file[0]);

            //読込終了後の処理
            reader.onload = async() => {
                const new_span = document.createElement('span'); // 改行はいやなのでspan
                new_span.setAttribute('id', 'rebuild');
                new_span.innerHTML = reader.result; //html要素に変換

                //テキストエリアに表示する
                const area = document.getElementById(paper_area_id);
                console.log(area);
                area.innerHTML = new_span.innerHTML;//bodyに追加

                // こっからSPANを突っ込む処理
                const add_span = () => {
                    return new Promise((resolve) => {
                        const recursive_leaf_apply = (target_dom) => {
                            console.log(target_dom);
                            if (target_dom.length === 0) return;
        
                                // テキストノードか確認
                                const target_dom_value = target_dom[0].nodeValue;
                                if (target_dom_value && typeof target_dom_value === "string") {
                                    const tmp = [...target_dom_value].map(char => "<span class='paper_txt_obj'>" + char + "</span>").join('');
                                    target_dom.replaceWith(tmp);
                                    return;
                                }

                            target_dom.contents().each((ind, elm) => {
                                // もし，子要素にさらにDOMがある場合（＝さらに掘り下げたところに文字があるかも知れない場合），再帰して，子要素に対してSPAN付与の必要性チェック
                                return recursive_leaf_apply($(elm));
                            });
                        }

                        const add_id = () => {
                            //spanで区切られた文字にidを付与する
                            const ptolength=$(".paper_txt_obj").length;
                            $(".paper_txt_obj").each((index, elm) => {
                                $(elm).attr({
                                    'char_id': 'p_txt_'+index
                                });
                            });
                        }

                    
                        const before_spanned_text = $("#page-container");
                        recursive_leaf_apply(before_spanned_text); // PDF2HTMLEXで変換・スクリプトで一部だけ取得したHTMLファイルの中身を取得して，SPANを付与
                        add_id();
                        
                        console.log('add_span 完了');
                        resolve();  // Promiseを解決して次の処理を実行
                    });
                }

                //　これが終わるまで次の処理に行かないように
                await add_span();
                             
                // new Promise(() => {
                //     $("#tagged_paper_input").val(area.html());
                // });
                insert_paper_id = Math.floor(10000000 + Math.random() * 90000000);
                var title = document.getElementsByName("paper_title")[0].value;
                var content = area.innerHTML.replace(/'/g, "\\'");
                
                // mapnameを取得
                const mapnameInput = document.querySelector('input[name="mapname"]');
                const mapnameValue = mapnameInput.value;
                
                console.log(mapnameValue);
                console.log(title);
                
                
                $.ajax({
                    url: "php/insert_paper.php",
                    type: "POST",
                    data: { insert : "paper",
                            id : insert_paper_id,
                            paper_title : title,
                            content : content,
                            mapname: mapnameValue
                        },
                    success: function(result){
                        console.log(result);         
                    },
                    error:function(){
                        console.log("エラーです");
                    }
                });
                           
            }
            
        }, false);
    });
    $(file_input_btn_id).off();
    
}

setTaggedHTMLPaperData("input_htmlfile", "paper_read_area");
















