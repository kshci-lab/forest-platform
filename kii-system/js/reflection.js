function submitSummary() {
    var button = document.getElementById("submit_summary");
    if (button) {
        button.disabled = true;
    }

    $.ajax({
        url: "php/submit_summary.php",
        type: "POST",
        dataType: "json",
        data: {
            action: "save",
            rq: $("#rq").text(),
            e1Strong: $("#e_1_strong").text(),
            e1Weak: $("#e_1_weak").text(),
            e2Strong: $("#e_2_strong").text(),
            e2Weak: $("#e_2_weak").text(),
            e3Strong: $("#e_3_strong").text(),
            e3Weak: $("#e_3_weak").text(),
            summary: $("#summary").text()
        },
        success: function(response) {
            if (response && response.success) {
                alert("\u9001\u4fe1\u3055\u308c\u307e\u3057\u305f");
            }
        },
        error: function(xhr) {
            console.error("Failed to save summary:", xhr.responseText);
        },
        complete: function() {
            if (button) {
                button.disabled = false;
            }
        }
    });
}

function loadSummary() {
    $.ajax({
        url: "php/submit_summary.php",
        type: "POST",
        dataType: "json",
        data: { action: "get" },
        success: function(response) {
            if (!response || !response.success || !response.summary) {
                return;
            }

            $("#rq").text(response.summary.rq || "");
            $("#e_1_strong").text(response.summary.e_1_strong || "");
            $("#e_1_weak").text(response.summary.e_1_weak || "");
            $("#e_2_strong").text(response.summary.e_2_strong || "");
            $("#e_2_weak").text(response.summary.e_2_weak || "");
            $("#e_3_strong").text(response.summary.e_3_strong || "");
            $("#e_3_weak").text(response.summary.e_3_weak || "");
            $("#summary").text(response.summary.summary || "");
        },
        error: function(xhr) {
            console.error("Failed to load summary:", xhr.responseText);
        }
    });
}

$(loadSummary);

