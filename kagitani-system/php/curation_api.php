<?php
session_start();header('Content-Type: application/json; charset=UTF-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');
require_once __DIR__.'/connect_db.php';require_once __DIR__.'/admin_workbench_lib.php';
try {
    $host=$db_host;$port='3306';if(str_contains($host,':'))[$host,$port]=explode(':',$host,2);
    $pdo=new PDO("mysql:host=$host;port=$port;dbname=$db_dbname;charset=utf8mb4",$db_user,$db_password,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_DEFAULT_FETCH_MODE=>PDO::FETCH_ASSOC]);
    $lib=new AdminWorkbenchLib($pdo);$uid=$_SESSION['USERID']??null;$admin=$lib->checkAdminAuth($uid);
    if(!$uid||(!$admin&&($_SESSION['DASHBOARD_AUTHENTICATED']??false)!==true))throw new RuntimeException('ログインが必要です。',403);
    if(empty($_SESSION['CURATION_CSRF']))$_SESSION['CURATION_CSRF']=bin2hex(random_bytes(32));$csrf=$_SESSION['CURATION_CSRF'];$actor=(string)$uid;
    $input=[];$action=$_GET['action']??'status';
    if($_SERVER['REQUEST_METHOD']==='POST'){
        if((int)($_SERVER['CONTENT_LENGTH']??0)>200000)throw new RuntimeException('要求が大きすぎます。');
        $input=json_decode(file_get_contents('php://input',false,null,0,200001),true,64,JSON_THROW_ON_ERROR);
        if(!$admin||!is_string($input['csrf_token']??null)||!hash_equals($csrf,$input['csrf_token']))throw new RuntimeException('全体の整理判断には管理者権限と有効な認証が必要です。',403);
        $action=$input['action']??'';
    } elseif(!in_array($action,['status','candidates','comparison','history'],true))throw new RuntimeException('POSTが必要です。',405);
    session_write_close();$store=new ResearchCuration(ResearchCuration::path());$st=$store->read();
    $filter=function($f){$ids=$f['user_ids']??[];if(!is_array($ids))$ids=explode(',',(string)$ids);$out=['date_basis'=>($f['date_basis']??'')==='updated_at'?'updated_at':'created_at','user_ids'=>array_map('intval',$ids),'start_date'=>($f['start_date']??null)?:null,'end_date'=>($f['end_date']??null)?:null];foreach(['start_date','end_date']as$k)if($out[$k]&&strlen($out[$k])===10)$out[$k].=$k==='start_date'?' 00:00:00':' 23:59:59';return $out;};
    $allFilter=['date_basis'=>'created_at','user_ids'=>[],'start_date'=>null,'end_date'=>null];
    $rows=function($f)use($lib){$out=[];foreach(array_merge($lib->getLessonsList($f),$lib->getNodesList($f))as$r)$out[ResearchCuration::key($r)]=$r;return $out;};
    if($action==='status')$result=['csrf_token'=>$csrf,'can_curate'=>$admin,'revision'=>$st['revision'],'excluded_count'=>count(ResearchCuration::exclusions($st))];
    elseif($action==='candidates'){$f=$filter($_GET);$rs=$rows($f);$candidates=ResearchCuration::candidates(array_values($rs));foreach($candidates as &$c){$c['judgment']='未確認';foreach($st['decisions']as$d)if(count($d['members'])===count($c['keys'])&&!array_diff($d['members'],$c['keys'])){
$unchanged=true;foreach($d['hashes']as$k=>$h)if(!isset($rs[$k])||ResearchCuration::hash($rs[$k])!==$h)$unchanged=false;if($unchanged)$c['judgment']=$d['mode']==='hold'?'保留':'重複ではない';}}unset($c);$result=['revision'=>$st['revision'],'candidates'=>$candidates,'rows'=>array_values($rs),'exclusions'=>ResearchCuration::exclusions($st),'decisions'=>$st['decisions']];}
    elseif($action==='comparison'){
        $keys=explode(',',$_GET['keys']??'');if(count($keys)>20)throw new RuntimeException('20件以内で比較してください。');$all=$rows($allFilter);$chosen=[];$histories=[];
        foreach($keys as$k)if(isset($all[$k])){
            $r=$all[$k];$chosen[$k]=$r;
            try{
                if(isset($r['origin_type'])){
                    $map=$r['origin_type']==='map';$table=$map?'`object_lesson-learneds`':'`object_journal_lesson-learneds`';$id=$map?'object_le_id':'`object_journal_lesson-learned_id`';$group=$map?'reflection_id':'object_journal_reflection_id';
                    if($r['reflection_group_id']!==null){$where="$group=?";$value=$r['reflection_group_id'];}
                    elseif($map){$where='reflection_id IS NULL AND object_node_id=?';$value=$r['object_node_id'];}else{$where="$id=?";$value=$r['lesson_id'];}
                    $q=$pdo->prepare("SELECT $id AS source_row_id,lesson_learned,why_important,opportunity,created_at,updated_at,deleted FROM $table WHERE $where ORDER BY updated_at DESC,created_at DESC,$id DESC LIMIT 100");$q->execute([$value]);
                }else{$q=$pdo->prepare('SELECT object_node_history_id AS source_row_id,content,status,appeared_at,disappeared_at FROM object_nodes_histories WHERE object_node_id=? ORDER BY appeared_at DESC LIMIT 100');$q->execute([$r['object_node_id']]);}
                $histories[$k]=['available'=>true,'rows'=>$q->fetchAll(),'limit'=>100];
            }catch(PDOException $e){$histories[$k]=['available'=>false,'rows'=>[]];}
        }
        $result=['rows'=>$chosen,'histories'=>$histories,'missing'=>array_values(array_diff($keys,array_keys($chosen))),'revision'=>$st['revision']];
    }
    elseif($action==='history'){$all=$rows($allFilter);$changed=[];foreach($st['groups']as$g)if($g['active'])foreach($g['hashes']as$k=>$hash)if(!isset($all[$k])||ResearchCuration::hash($all[$k])!==$hash)$changed[$g['id']][]=$k;$result=['history'=>$store->history(),'state'=>$st,'changed'=>$changed];}
    elseif($action==='preview'){
        if((int)($input['revision']??-1)!==$st['revision'])throw new RuntimeException('整理版が変わりました。候補を再取得してください。',409);
        $all=$rows($allFilter);$next=ResearchCuration::propose($st,$all,$input,$actor);$keys=$input['mode']==='undo'?($st['groups'][$input['group_id']]['members']??[]):($input['keys']??[]);$hashes=[];foreach($keys as$k)$hashes[$k]=isset($all[$k])?ResearchCuration::hash($all[$k]):null;
        $f=$filter($input['filter']??[]);$before=new AdminWorkbenchLib($pdo);$before->setCuration($st);$after=new AdminWorkbenchLib($pdo);$after->setCuration($next);
        $p=['expected'=>$st['revision'],'next'=>$next,'hashes'=>$hashes,'filter'=>$f,'before'=>$before->getSummary($f),'after'=>$after->getSummary($f),'input'=>$input];unset($p['input']['csrf_token']);$id=$store->preview($actor,$p);$result=['preview_id'=>$id,'before'=>$p['before'],'after'=>$p['after'],'filter'=>$f,'keys'=>$keys,'mode'=>$input['mode'],'representative'=>$input['representative']??'','reason'=>$input['reason']??'','expires_in'=>1800];
    }
    elseif($action==='confirm'){
        $previewId=(string)($input['preview_id']??'');$operation=(string)($input['operation_id']??'');$fingerprint=hash('sha256',$actor.'|'.$previewId);
        if($old=$store->result($operation,$fingerprint))$result=['revision'=>$old['revision'],'replayed'=>true];
        else {$p=$store->previewData($actor,$previewId);$all=$rows($allFilter);foreach($p['hashes']as$k=>$hash)if((isset($all[$k])?ResearchCuration::hash($all[$k]):null)!==$hash)throw new RuntimeException('元記録が更新されています。もう一度比較してください。',409);$saved=$store->commit($actor,$p['expected'],$p['next'],$operation,$fingerprint);$result=['revision'=>$saved['revision']];}
    }else throw new RuntimeException('不明な操作です。');
    echo ResearchCuration::json(['success'=>true]+$result);
}catch(Throwable $e){$code=(int)$e->getCode();http_response_code(in_array($code,[403,404,405,409],true)?$code:400);echo json_encode(['success'=>false,'error'=>$e instanceof PDOException?'整理データを読み書きできません。前回の結果は保持しています。保存先と権限を確認してください。':$e->getMessage()],JSON_UNESCAPED_UNICODE);}
