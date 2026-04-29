const setTaggedHTMLPaperData = (fileInputBtnId, paperAreaId) => {
    const btn = document.getElementById(fileInputBtnId);
    const paperTitleInputs = document.getElementsByName("paper_title");
    const actionButtons = document.querySelectorAll('input[type="button"][name="newsheet"]');
    const titleInput = paperTitleInputs.length > 0 ? paperTitleInputs[paperTitleInputs.length - 1] : null;
    const saveButton = actionButtons.length > 0 ? actionButtons[actionButtons.length - 1] : null;
    if (!btn || !titleInput || !saveButton) {
        return;
    }

    let pendingPaperContent = "";
    let pendingPaperId = null;

    const isHTMLFile = (file) => {
        return file && file.name && /\.html?$/i.test(file.name);
    };

    const addSpansToTextNodes = (rootTarget) => {
        const recursiveLeafApply = (targetDom) => {
            if (!targetDom || targetDom.length === 0) {
                return;
            }

            if (targetDom.contents().length === 0) {
                const node = targetDom[0];
                if (!node || node.nodeType !== 3) {
                    return;
                }

                const textValue = node.nodeValue || "";
                if (textValue.length === 0) {
                    return;
                }

                const replacedHTML = [...textValue].map((char) => {
                    return "<span class='paper_txt_obj'>" + char + "</span>";
                }).join("");

                targetDom.replaceWith(replacedHTML);
                return;
            }

            targetDom.contents().each((_, elm) => {
                recursiveLeafApply($(elm));
            });
        };

        recursiveLeafApply(rootTarget);

        $(".paper_txt_obj").each((index, elm) => {
            $(elm).attr({
                char_id: "p_txt_" + index
            });
        });
    };

    btn.addEventListener("change", (evt) => {
        const files = evt.target.files;
        if (!files || !files[0]) {
            return;
        }

        const file = files[0];
        if (!isHTMLFile(file)) {
            alert("HTMLファイルを選択してください。");
            evt.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.readAsText(file);

        reader.onload = () => {
            const area = document.getElementById(paperAreaId);
            if (!area) {
                return;
            }

            const rebuild = document.createElement("span");
            rebuild.setAttribute("id", "rebuild");
            rebuild.innerHTML = reader.result;
            area.innerHTML = rebuild.innerHTML;

            const beforeSpannedText = $("#page-container").length > 0 ? $("#page-container") : $(area);
            addSpansToTextNodes(beforeSpannedText);

            pendingPaperId = Math.floor(10000000 + Math.random() * 90000000);
            pendingPaperContent = area.innerHTML;
        };
    }, false);

    saveButton.addEventListener("click", () => {
        const title = titleInput.value.trim();
        if (pendingPaperContent === "") {
            alert("HTMLファイルを選択してください。");
            return;
        }

        if (title === "") {
            alert("論文のタイトルを入力してください。");
            titleInput.focus();
            return;
        }

        $.ajax({
            url: "php/insert_paper.php",
            type: "POST",
            data: {
                insert: "paper",
                id: pendingPaperId,
                paper_title: title,
                content: pendingPaperContent
            },
            success: function(result) {
                console.log(result);
                alert("論文を保存しました。");
            },
            error: function(xhr) {
                console.log("paper save failed");
                console.log(xhr.responseText);
                alert("論文データの保存に失敗しました。詳細はコンソールを確認してください。");
            }
        });
    });
};

setTaggedHTMLPaperData("input_htmlfile", "paper_read_area");
