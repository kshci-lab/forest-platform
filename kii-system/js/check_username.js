//アカウントを新規作成する際に
//データベース内に同じユーザ名がないかチェックする機能

const $username = document.getElementById("username");
const $check = document.getElementsByClassName("check_button")[0];
const $submit = document.getElementById("signUp");

$username.addEventListener('change', update, false);
$username.addEventListener('input', update, false);

function update(e) {
  // バリデーションが総合的に通っているかどうかのフラグ
  const isValid = $check.checkValidity(); //初期値は0(true)

  $submit.setAttribute('disabled', 'disabled');//名前が変更されるたびにsignUpは隠す

  if ($username.value.length >= 4) {  // ４文字以上ならチェック可能にする
    $check.removeAttribute('disabled');
    return;
  }
  else{  // 通っていなければ非活性にする
    $check.setAttribute('disabled', 'disabled');
  }

}



//USER ID横のボタンが押された際に，DB内に同じ名前があるかチェックする
//同じ名前があれば使用できない
$('.check_button').on('click', function(){

  username = document.getElementById('username').value;
  // username = $('#username').val(); //jqueryの書き方　上の行と同じ操作

  $.ajax({
      url:'php/checkname.php',
      type:"GET",
      data:{
        username: username
      }
  })

  .then(
    function(data){

      if(data != 1){
        alert('使用できます');
        $submit.removeAttribute('disabled');
      }
      else{
        alert('使用できません');
      }

  })
});
