function submitSummary() {
    var rqText = $("#rq").text();
    var e1StrongText = $("#e_1_strong").text();
    var e1WeakText = $("#e_1_weak").text();
    var e2StrongText = $("#e_2_strong").text();
    var e2WeakText = $("#e_2_weak").text();
    var e3StrongText = $("#e_3_strong").text();
    var e3WeakText = $("#e_3_weak").text();
    var summaryText = $("#summary").text();

    $.ajax({
        url: 'php/submit_summary.php',
        type: 'POST',
        data: {
            rq: rqText,
            e1Strong: e1StrongText,
            e1Weak: e1WeakText,
            e2Strong: e2StrongText,
            e2Weak: e2WeakText,
            e3Strong: e3StrongText,
            e3Weak: e3WeakText,
            summary: summaryText,
        },
        success: function(data) {
            alert("送信されました");
        },
        error: function(error) {
            console.error('Error:', error);
        }
    });
}
