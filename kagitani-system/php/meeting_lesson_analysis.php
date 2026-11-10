<?php
/** Cached local lesson analysis and human reviews. No parsing on dashboard GETs. */
trait MeetingLessonAnalysis {
    private $analysisResults;
    private $analysisReviews;

    public function analysisStatus() {
        if (!$this->config) return ['state'=>'unconfigured','done'=>0,'total'=>0,'message'=>'OneDriveの接続設定が必要です。'];
        try {
            $status = $this->readJson('analysis-status') ?? ['state'=>'never','done'=>0,'total'=>0,'message'=>'本文はまだ解析していません。'];
            if (in_array($status['state'] ?? '', ['running','queued'], true) && time()-strtotime($status['updated_at'] ?? '1970-01-01')>180) {
                $status['state']='interrupted'; $status['message']='解析の進捗が停止しています。完了済み結果を保持しています。再実行してください。';
            }
            return $status;
        } catch (Throwable $e) { return ['state'=>'error','done'=>0,'total'=>0,'message'=>'解析状態を読み込めません。']; }
    }

    private function fileAnalysis(array $file) {
        $empty=['auto_status'=>'unprocessed','effective_status'=>'unprocessed','verified'=>false,'signature'=>null,
            'reason'=>'まだ本文を解析していません。','evidence'=>[]];
        try {
            if ($this->analysisResults === null) {
                $data=$this->readJson('analysis-results') ?? [];
                $this->analysisResults=($data['source_fingerprint'] ?? '')===$this->fingerprint() ? ($data['files'] ?? []) : [];
                $this->analysisReviews=$this->readJson('analysis-reviews') ?? [];
            }
            $key=$file['drive_id'].':'.$file['id'];
            $result=$this->analysisResults[$key] ?? null;
            if (!$result) return $empty;
            $path=$file['local_path'] ?? '';
            clearstatcache(true,$path);
            $stat=$path ? @stat($path) : false;
            if (!$stat || ($result['file_size'] ?? -1)!=$stat['size'] || ($result['file_mtime'] ?? -1)!=$stat['mtime']) {
                $empty['reason']='資料が変更・移動されたため再解析が必要です。以前の確認は今回の件数に含めません。';
                return $empty;
            }
            $result['effective_status']=$result['auto_status']; $result['verified']=false;
            $review=$this->analysisReviews[$key] ?? null;
            if ($review && !empty($result['signature']) && ($review['signature'] ?? '')===$result['signature']) {
                $result['effective_status']=$review['decision']; $result['verified']=true; $result['reviewed_at']=$review['reviewed_at'];
            }
            return $result;
        } catch (Throwable $e) { $empty['reason']='解析キャッシュを読み込めません。再解析してください。'; return $empty; }
    }

    public function startAnalysis() {
        if (!$this->isLocal() || !$this->snapshot()) throw new RuntimeException('OneDriveの正常な資料一覧が必要です。');
        $dir=$this->directory();
        $lock=fopen($dir.'/analysis-launch.lock','c');
        if (!$lock || !flock($lock,LOCK_EX|LOCK_NB)) throw new RuntimeException('解析の起動処理中です。');
        try {
            $status=$this->analysisStatus();
            if (in_array($status['state'] ?? '',['running','queued'],true)) return $status;
            $configPath=$this->config['_config_path'] ?? '';
            $python=$this->config['analysis_python'] ?? (dirname($configPath).'/analysis-venv/bin/python');
            $worker=dirname(__DIR__,2).'/scripts/analyze_meeting_lessons.py';
            if (!$configPath || !is_executable($python) || !is_file($worker) || !function_exists('exec')) throw new RuntimeException('ローカル本文解析用の実行環境を設定してください。');
            $status=['state'=>'queued','done'=>0,'total'=>0,'updated_at'=>gmdate('Y-m-d\TH:i:s\Z'),'message'=>'本文解析を起動しています。'];
            $this->writeJson('analysis-status',$status);
            $command='/usr/bin/nohup '.escapeshellarg($python).' '.escapeshellarg($worker).' --config '.escapeshellarg($configPath).
                ' > '.escapeshellarg($dir.'/analysis-worker.log').' 2>&1 < /dev/null & echo $!';
            exec($command,$output,$exit);
            if ($exit!==0 || empty($output[0]) || !ctype_digit(trim($output[0]))) throw new RuntimeException('本文解析を起動できませんでした。');
            return $status;
        } finally { flock($lock,LOCK_UN); fclose($lock); }
    }

    public function lessonPreview($key) {
        $snapshot=$this->snapshot(); $file=$snapshot['files'][$key] ?? null;
        if (!$file || ($snapshot['folders'][$file['folder_key']]['kind'] ?? '')!=='general') throw new RuntimeException('対象資料が見つかりません。');
        $path=$file['local_path'] ?? ''; $root=realpath($this->config['roots']['general']['path'] ?? '');
        $real=$path ? realpath($path) : false;
        if (!$root || !$real || is_link($path) || !is_file($real) || strpos($real,$root.'/')!==0 ||
            count(explode('/',substr($real,strlen($root)+1)))!==2) throw new RuntimeException('資料を開けません。OneDriveの状態を確認してください。');
        $types=['pdf'=>'application/pdf','png'=>'image/png','jpg'=>'image/jpeg','jpeg'=>'image/jpeg','gif'=>'image/gif','webp'=>'image/webp'];
        $extension=strtolower(pathinfo($real,PATHINFO_EXTENSION));
        if (!isset($types[$extension])) throw new RuntimeException('この形式はFinderのパスから元資料を開いて確認してください。');
        return ['path'=>$real,'name'=>$file['name'],'mime'=>$types[$extension]];
    }

    public function saveLessonReview($fileKey,$signature,$decision,$reviewer) {
        if (!in_array($decision,['yes','no','clear'],true)) throw new InvalidArgumentException('確認結果が不正です。');
        $snapshot=$this->snapshot(); $file=$snapshot['files'][$fileKey] ?? null;
        if (!$file || ($snapshot['folders'][$file['folder_key']]['kind'] ?? '')!=='general') throw new RuntimeException('対象の全体MT資料が見つかりません。');
        $analysis=$this->fileAnalysis($file);
        if (!$signature || ($analysis['signature'] ?? null)!==$signature) throw new RuntimeException('資料または解析結果が変更されています。画面を更新して確認し直してください。');
        $lock=fopen($this->directory().'/analysis-review.lock','c');
        if (!$lock || !flock($lock,LOCK_EX)) throw new RuntimeException('確認結果を保存できません。');
        try {
            $reviews=$this->readJson('analysis-reviews') ?? [];
            if ($decision==='clear') unset($reviews[$fileKey]);
            else $reviews[$fileKey]=['signature'=>$signature,'decision'=>$decision,'reviewer_id'=>$reviewer,'reviewed_at'=>gmdate('Y-m-d\TH:i:s\Z')];
            $this->writeJson('analysis-reviews',$reviews); $this->analysisReviews=$reviews;
        } finally { flock($lock,LOCK_UN); fclose($lock); }
    }
}
