<?php
error_reporting(E_ALL);ini_set('display_errors','0');session_start();header('Content-Type: application/json; charset=UTF-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
require_once __DIR__.'/connect_db.php';require_once __DIR__.'/admin_workbench_lib.php';require_once __DIR__.'/qualitative_store.php';
try {
    $host=$db_host;$port='3306';if(str_contains($host,':'))[$host,$port]=explode(':',$host,2);
    $pdo=new PDO("mysql:host=$host;port=$port;dbname=$db_dbname;charset=utf8mb4",$db_user,$db_password,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $lib=new AdminWorkbenchLib($pdo);$uid=$_SESSION['USERID']??null;
    if(!$uid||(!$lib->checkAdminAuth($uid)&&($_SESSION['DASHBOARD_AUTHENTICATED']??false)!==true))throw new RuntimeException('ダッシュボードへのログインが必要です。',403);
    // Actor identity is the existing signed-in user, never a client-provided owner ID.
    $owner='user:'.(string)$uid;if(empty($_SESSION['QUALITATIVE_CSRF']))$_SESSION['QUALITATIVE_CSRF']=bin2hex(random_bytes(32));$token=$_SESSION['QUALITATIVE_CSRF'];
    $action=$_GET['action']??'list';$input=[];
    if($_SERVER['REQUEST_METHOD']==='POST'){
        if((int)($_SERVER['CONTENT_LENGTH']??0)>6*1024*1024)throw new RuntimeException('データが大きすぎます。');
        $raw=file_get_contents('php://input',false,null,0,6*1024*1024+1);if(strlen($raw)>6*1024*1024)throw new RuntimeException('データが大きすぎます。');
        $input=json_decode($raw,true,128,JSON_THROW_ON_ERROR);if(!is_array($input)||!is_string($input['csrf_token']??null)||!hash_equals($token,$input['csrf_token']))throw new RuntimeException('認証が更新されています。ページを再読み込みしてください。',403);
        $action=$input['action']??'';
    } elseif(!in_array($action,['list','get','history','batches','release_data','curation_diff'],true))throw new RuntimeException('この操作はPOSTが必要です。',405);
    session_write_close();$path=getenv('FOREST_QUALITATIVE_DB')?:dirname(__DIR__,4).'/forest-platform-private/qualitative-analysis/analysis.sqlite';$store=new QualitativeStore($path);$curation=new ResearchCuration(ResearchCuration::path());$curationState=$curation->read();$lib->setCuration($curationState);
    $id=(string)($input['set_id']??$_GET['set_id']??'');$rev=(int)($input['revision']??0);$payload=$input['payload']??[];
    $sourceRows=function()use($input,$lib,$curationState){
        $f=$input['filter']??[];if(isset($f['curation_revision'])&&(int)$f['curation_revision']!==$curationState['revision'])throw new RuntimeException('全体の整理版が変わりました。教訓一覧を再取得して選び直してください。',409);
        $f=['start_date'=>$f['start_date']??null,'end_date'=>$f['end_date']??null,'date_basis'=>($f['date_basis']??'')==='updated_at'?'updated_at':'created_at','user_ids'=>array_map('intval',$f['user_ids']??[])];foreach(['start_date','end_date']as$k)if($f[$k]&&strlen($f[$k])===10)$f[$k].=$k==='start_date'?' 00:00:00':' 23:59:59';
        $wanted=$input['lesson_keys']??[];if(!is_array($wanted)||count(array_unique($wanted))!==count($wanted))throw new RuntimeException('教訓の選択を確認してください。');
        $rows=array_values(array_filter($lib->getLessonsList($f),fn($r)=>in_array($r['origin_type'].':'.$r['lesson_id'],$wanted,true)));
        if(count($rows)!==count($wanted))throw new RuntimeException('選択した教訓の一部が更新・削除・整理による除外、または条件外です。一覧を再取得して選び直してください。',409);
        return $rows;
    };
    $curationDiff=function()use($store,$owner,$id,$curationState){$set=$store->get($owner,$id);$excluded=ResearchCuration::exclusions($curationState);$items=[];foreach($set['state']['items']as$i)if(!$i['excluded']&&isset($excluded[$i['source_key']]))$items[]=['item_id'=>$i['id'],'content'=>$i['content'],'source_key'=>$i['source_key']]+$excluded[$i['source_key']];return ['items'=>$items,'set_revision'=>$set['revision'],'curation_revision'=>$curationState['revision']];};
    switch($action){
        case 'curation_diff':$result=$curationDiff();break;
        case 'apply_curation':$d=$curationDiff();if($d['curation_revision']!==(int)($input['curation_revision']??-1)||$d['set_revision']!==$rev)throw new RuntimeException('差分確認後に分析か整理版が変わりました。再確認してください。',409);$result=['set'=>$store->change($owner,$id,$rev,'curation',['items'=>$d['items'],'curation_revision'=>$d['curation_revision']])];break;
        case 'list':$result=['sets'=>$store->list($owner,($_GET['include_archived']??'0')==='1'),'csrf_token'=>$token,'actor'=>(string)$uid];break;
        case 'get':$result=['set'=>$store->get($owner,$id)];break;
        case 'create':$result=['set'=>$store->create($owner,(string)($input['name']??''),(string)($input['purpose']??''),$sourceRows(),array_merge($input['filter']??[],['curation_revision'=>$curationState['revision'],'curation_mode'=>'curated']))];break;
        case 'change':$op=$input['operation']??'';if($op==='curation')throw new RuntimeException('全体整理の反映は差分確認から行ってください。',403);if($op==='add_items')$payload=['rows'=>$sourceRows()];$result=['set'=>$store->change($owner,$id,$rev,$op,$payload)];break;
        case 'history':$result=$store->history($owner,$id);break;
        case 'release':$result=['release'=>$store->release($owner,$id,$rev,(string)($input['name']??''))];break;
        case 'release_data':$result=['release'=>$store->releaseData($owner,$id,(string)($_GET['release_id']??''))];break;
        case 'batch':$result=['requests'=>$store->batch($owner,$id,$rev,(string)($input['instruction']??''),$input['item_ids']??[],$input['fields']??[])];break;
        case 'batches':$result=['batches'=>$store->batches($owner,$id)];break;
        case 'preview_import':$result=['preview'=>$store->preview($owner,$id,(string)($input['raw']??''))];break;
        case 'apply_import':$result=['set'=>$store->import($owner,$id,$rev,(string)($input['raw']??''),array_map('intval',$input['indices']??[]),(bool)($input['allow_new_labels']??false))];break;
        default:throw new RuntimeException('未対応の操作です。',400);
    }
    echo QualitativeStore::json(['success'=>true]+$result);
} catch(Throwable $e){$code=(int)$e->getCode();http_response_code(in_array($code,[403,404,405,409],true)?$code:400);$message=($e instanceof PDOException)?'分析データを読み書きできませんでした。保存先の権限・空き容量を確認してください。':$e->getMessage();echo json_encode(['success'=>false,'error'=>$message],JSON_UNESCAPED_UNICODE);}
