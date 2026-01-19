document.getElementById("selectmodebutton").addEventListener('click', function() {
    const selectmodeoption = document.getElementsByName( "selectmode" );
    for (var i = 0; i < selectmodeoption.length; i++) {
        if (selectmodeoption[i].checked) {
          console.log(selectmodeoption[i].value)
          if(selectmodeoption[i].value === "1"){
            console.log("1")
            window.location.href = "./forest-mrn/select_sheet.php";
          }else if(selectmodeoption[i].value === "2"){
            console.log("2")
            window.location.href = "./kii-system/select_sheet.php";
          }else if(selectmodeoption[i].value === "3"){
            // ここ変える必要あり
            window.location.href = "./fujinaka-system/select_sheet.php";
          }else if(selectmodeoption[i].value === "4"){
            // ここ変える必要あり
            window.location.href = "./kagitani-system/select_sheet.php";
          }else if(selectmodeoption[i].value === "5"){
            // 福島モードは共有知モードを直接起動
            window.location.href = "./fukushima-system/index.php?mode=shared";
          }else if(selectmodeoption[i].value === "6"){
            // ここ変える必要あり
            console.log("島岡システム：未搭載")
            // window.location.href = "shimaoka-system/select_sheet.php";
          }
          return;
        }
    }
});