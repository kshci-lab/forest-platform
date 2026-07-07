document.getElementById("selectmodebutton").addEventListener('click', function() {
    const selectmodeoption = document.getElementsByName( "selectmode" );
    for (var i = 0; i < selectmodeoption.length; i++) {
        if (selectmodeoption[i].checked) {
          console.log(selectmodeoption[i].value)
          if(selectmodeoption[i].value === 1){
            header("Location: select_sheet.php");
          }else if(selectmodeoption[i].value === 2){
            header("Location: select_sheet.php");
          }else if(selectmodeoption[i].value === 3){
            header("Location: ");
          }
          return;
        }
    }
});