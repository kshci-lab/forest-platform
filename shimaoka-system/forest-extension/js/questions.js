document.addEventListener("DOMContentLoaded", () => {
    // 二重実行ガード（スクリプト重複読み込み対策）
    if (window.__questionsJsInitialized) return;
    window.__questionsJsInitialized = true;

    const actionsContainer = document.getElementById('question-actions');
    if (!actionsContainer) return;

    // 既にボタンがある場合は再追加しない
    if (actionsContainer.querySelector('.adopt-btn, .reject-btn')) return;

    document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".question-block").forEach(block => {
        const questionText = block.querySelector(".question-text").textContent;

        const adoptBtn = block.querySelector(".adopt-btn");
        const rejectBtn = block.querySelector(".reject-btn");

        adoptBtn.addEventListener("click", () => {
            const reason = prompt("採用理由を入力してください");
            if (reason !== null) {
                saveFeedback(questionText, 1, reason);
            }
        });

        rejectBtn.addEventListener("click", () => {
            const reason = prompt("不採用理由を入力してください");
            if (reason !== null) {
                saveFeedback(questionText, 0, reason);
            }
        });
    });

    function saveFeedback(questionText, isAdopted, reason) {
        fetch("save_feedback.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            user_id: 1,           // ログイン機能未実装なら仮で固定
            question_text: questionText,
            is_adopted: isAdopted,
            reason: reason
        })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("保存しました！");
            } else {
                alert("保存エラー: " + data.error);
            }
        });
    }
});
});