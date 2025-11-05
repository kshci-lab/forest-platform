document.getElementById("selectmodebutton").addEventListener('click', function() {
    const selectmodeoption = document.getElementsByName( "selectmode" );
    for (var i = 0; i < selectmodeoption.length; i++) {
        if (selectmodeoption[i].checked) {
          console.log(selectmodeoption[i].value)
          if(selectmodeoption[i].value === "1"){
            console.log("1")
            window.location.href = "forest-mrn/select_sheet.php";
          }else if(selectmodeoption[i].value === "2"){
            console.log("2")
            window.location.href = "kii-system/select_sheet.php";
          } else if (selectmodeoption[i].value === "3") {
              window.location.href = "fujinaka-system/select_sheet.php";
      } else if (selectmodeoption[i].value === "4") {
        // 共有知モード選択時は共有知モードで起動するフラグを引き継ぐ
        window.location.href = "fukushima-system/select_sheet.php?shared=1";
          }
          return;
        }
    }
});