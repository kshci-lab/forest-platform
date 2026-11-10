<?php
/** SharePoint meeting metadata; no document bodies and no writes to SharePoint/MySQL. */
require_once __DIR__ . '/onedrive_meetings_inventory.php';
require_once __DIR__ . '/meeting_lesson_analysis.php';
require_once __DIR__ . '/meeting_supplements.php';
require_once __DIR__ . '/meeting_audio.php';

class SharePointMeetings {
    use MeetingLessonAnalysis;
    use MeetingSupplements;
    use MeetingAudio;
    private $participantCache = [];
    private $participantUserKey = '';
    const METRICS = ['research_mt_total', 'research_mt_days', 'general_mt_sessions', 'shared_lessons_total', 'verified_lessons_total', 'lesson_candidates_total', 'lesson_review_total', 'supplemental_lessons_total', 'research_lesson_shares_assumed_total', 'recorded_discussions_total', 'reframing_discussions_assumed_total', 'lesson_shares_with_assumptions_total', 'meeting_audio_files_total', 'meeting_audio_sessions_total', 'audio_confirmed_lessons_total'];
    const PARTICIPANT_METRICS = ['mt_research_presentations', 'mt_research_sessions', 'mt_general_sessions',
        'mt_shared_files', 'mt_supplemental_lessons', 'mt_verified_lessons', 'mt_lesson_candidates', 'mt_lesson_review', 'mt_research_lesson_shares_assumed', 'mt_recorded_discussions', 'mt_reframing_discussions_assumed', 'mt_lesson_shares_with_assumptions', 'mt_audio_confirmed_lessons'];
    const ROOTS = ['research' => '0010-研究MT', 'general' => '0011-全体MT'];
    private $config;
    private $transport;
    private $token;
    private $loadError;
    private $cachedSnapshot;
    private $snapshotLoaded = false;
    private $deadline;

    public function __construct(array $config = [], callable $transport = null, $loadError = null) {
        $this->config = $config;
        $this->transport = $transport;
        $this->loadError = $loadError;
    }

    public static function fromEnvironment() {
        $path = getenv('FOREST_SP_CONFIG');
        if (!$path) {
            // Optional private installation config beside MAMP, never inside htdocs.
            $candidate = dirname(__DIR__, 4) . '/forest-platform-private/sharepoint-meetings.json';
            if (is_file($candidate)) $path = $candidate;
        }
        if (!$path) return new self();
        try {
            self::privatePath($path);
            $config = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($config)) throw new RuntimeException('Invalid configuration');
            $config['_config_path'] = $path;
            return new self($config);
        } catch (Throwable $e) {
            return new self([], null, 'SharePoint設定ファイルを読み込めません。保存先とJSON形式を確認してください。');
        }
    }

    // Credentials, configuration and cached personal metadata must live outside the public tree.
    private static function privatePath($path) {
        $real = realpath($path);
        if ($real === false) throw new RuntimeException('保存先が存在しません。');
        $publicRoots = [realpath(__DIR__ . '/../..')];
        if (!empty($_SERVER['DOCUMENT_ROOT'])) $publicRoots[] = realpath($_SERVER['DOCUMENT_ROOT']);
        foreach ($publicRoots as $root) {
            if ($root && ($real === $root || strpos($real, $root . DIRECTORY_SEPARATOR) === 0)) {
                throw new RuntimeException('設定・キャッシュは公開ディレクトリの外に置いてください。');
            }
        }
        return $real;
    }

    private function directory() {
        $dir = $this->config['cache_dir'] ?? '';
        if (!$dir || !is_dir($dir)) throw new RuntimeException('非公開のキャッシュディレクトリを設定してください。');
        $dir = self::privatePath($dir);
        if ((fileperms($dir) & 0007) !== 0) throw new RuntimeException('キャッシュの他ユーザー向け権限を外してください（0700または0770）。');
        return $dir;
    }

    private function fingerprint() {
        $roots = $this->config['roots'] ?? [];
        if ($this->isLocal()) $roots = ['mode' => 'onedrive', 'roots' => $roots];
        return hash('sha256', json_encode($roots, JSON_UNESCAPED_UNICODE));
    }

    private function readJson($name) {
        $path = $this->directory() . '/' . $name . '.json';
        if (!is_file($path)) return null;
        $data = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($data)) throw new RuntimeException('キャッシュを読み込めません。');
        return $data;
    }

    private function snapshot() {
        if ($this->snapshotLoaded) return $this->cachedSnapshot;
        $snapshot = $this->readJson('snapshot');
        if ($snapshot && ($snapshot['source_fingerprint'] ?? '') !== $this->fingerprint()) $snapshot = null;
        $this->cachedSnapshot = $snapshot;
        $this->snapshotLoaded = true;
        return $snapshot;
    }

    private function writeJson($name, array $value) {
        $dir = $this->directory();
        $tmp = tempnam($dir, '.sync-');
        if ($tmp === false) throw new RuntimeException('同期結果を保存できません。');
        try {
            chmod($tmp, 0600);
            $data = json_encode($value, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            if (file_put_contents($tmp, $data) !== strlen($data) || !rename($tmp, $dir . '/' . $name . '.json')) {
                throw new RuntimeException('同期結果を保存できません。');
            }
        } finally {
            if (is_file($tmp)) unlink($tmp);
        }
    }

    private function isLocal() { return ($this->config['source_mode'] ?? 'graph') === 'onedrive'; }

    public function status() {
        if (!$this->config) return ['configured' => false, 'available' => false, 'result' => 'unconfigured',
            'message' => $this->loadError ?: '未設定：OneDriveの同期フォルダ、またはMicrosoft Graphの接続を設定してください。', 'last_success_at' => null];
        try {
            $snapshot = $this->snapshot();
            $attempt = $this->readJson('status') ?? [];
            $result = $attempt['result'] ?? 'never';
            if ($snapshot && ($snapshot['synced_at'] ?? '') > ($attempt['finished_at'] ?? '')) $result = 'success';
            $message = in_array($result, ['failed', 'pending'], true) ? ($attempt['message'] ?? '同期失敗。前回の正常データを表示します。') :
                ($snapshot ? '前回の正常な同期データを表示しています。' : 'まだ正常な同期結果がありません。');
            if ($this->isLocal()) $message .= ' OneDriveの同期完了はOneDriveアプリで確認してください。';
            return ['source_mode' => $this->isLocal() ? 'onedrive' : 'graph', 'configured' => true, 'available' => (bool)$snapshot, 'result' => $result,
                'message' => $message, 'last_success_at' => $snapshot['synced_at'] ?? null,
                'last_attempt_at' => $attempt['attempted_at'] ?? null,
                'inventory' => $snapshot['inventory'] ?? null, 'inventory_changed'=>$snapshot['inventory_changed'] ?? true, 'rules' => self::rules()];
        } catch (Throwable $e) {
            return ['configured' => true, 'available' => false, 'result' => 'configuration_error',
                'message' => '設定またはキャッシュを読み込めません。非公開の保存先と権限を確認してください。', 'last_success_at' => null];
        }
    }

    public static function rules() {
        return [
            'date' => '親フォルダ直下のフォルダ名先頭YYYY-MM-DD（実在する日付）を実施日として使用。作成・更新日時基準の切替には依存しない。',
            'scope' => '日付フォルダ直下の実ファイルのみ。下位フォルダ・ショートカット・日付以外のフォルダは計上しない。',
            'exclude' => '~$で始まる名前、末尾~、拡張子.tmp/.temp（大小文字無視）、.DS_Store、Thumbs.db、desktop.iniを除外。',
            'dedup' => '研究MTは日付フォルダID内で最後の拡張子を除く名前が完全一致する場合のみ統合。全体MTはファイルIDごとに1件。',
            'participant' => 'ファイルID・完全一致名の指定を優先し、未指定の資料は漢字/英字の苗字で照合。複数人・同姓・複数形式間の矛盾は未判定。更新者は使用しない。',
            'sessions' => '開催はフォルダごとに1件。参加者指定時は該当者に確認済みの資料があるフォルダを1回だけ計上。開催自体は個人に割り当てない。'
        ];
    }

    public static function meetingDate($name) {
        if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $name, $m)) return null;
        return checkdate((int)$m[2], (int)$m[3], (int)$m[1]) ? $m[0] : null;
    }

    public static function excluded($name) {
        return strpos($name, '~$') === 0 || substr($name, -1) === '~' ||
            in_array(strtolower($name), ['.ds_store', 'thumbs.db', 'desktop.ini'], true) ||
            preg_match('/\.(tmp|temp)$/i', $name) === 1;
    }

    public static function fileKind($name) {
        $ext=strtolower(pathinfo($name,PATHINFO_EXTENSION));
        if(in_array($ext,['m4a','mp3','wav','aac','aif','aiff','caf','flac','ogg','opus'],true))return 'audio';
        if(in_array($ext,['mp4','mov','m4v','mkv','avi','webm'],true))return 'video';
        if(in_array($ext,['pdf','pptx','ppt','docx','doc','png','jpg','jpeg','gif','webp','svg','txt','md','xlsx','xls','csv','pages','key','numbers'],true))return 'document';
        return 'unknown';
    }

    public static function stem($name) {
        $pos = strrpos($name, '.');
        return $pos !== false && $pos > 0 ? substr($name, 0, $pos) : $name;
    }

    private static function safeUrl($url) {
        return is_string($url) && preg_match('~^https://[^\s]+$~i', $url) ? $url : '';
    }

    private static function b64($text) { return rtrim(strtr(base64_encode($text), '+/', '-_'), '='); }

    private function accessToken() {
        if ($this->token) return $this->token;
        $tenant = $this->config['tenant_id'] ?? '';
        $client = $this->config['client_id'] ?? '';
        if (!preg_match('/^[a-zA-Z0-9.-]+$/', $tenant) || !$client) throw new RuntimeException('テナントID・アプリIDが未設定です。');
        $url = 'https://login.microsoftonline.com/' . rawurlencode($tenant) . '/oauth2/v2.0/token';
        $params = ['client_id' => $client, 'scope' => 'https://graph.microsoft.com/.default', 'grant_type' => 'client_credentials'];
        if (!empty($this->config['certificate_path']) && !empty($this->config['private_key_path'])) {
            $cert = file_get_contents(self::privatePath($this->config['certificate_path']));
            $keyPath = self::privatePath($this->config['private_key_path']);
            $key = openssl_pkey_get_private(file_get_contents($keyPath), getenv('FOREST_SP_KEY_PASSWORD') ?: '');
            $fingerprint = openssl_x509_fingerprint($cert, 'sha1', true);
            if (!$key || !$fingerprint) throw new RuntimeException('同期用証明書を読み込めません。');
            $header = self::b64(json_encode(['alg' => 'RS256', 'typ' => 'JWT', 'x5t' => self::b64($fingerprint)]));
            $now = time();
            $payload = self::b64(json_encode(['aud' => $url, 'iss' => $client, 'sub' => $client,
                'jti' => bin2hex(random_bytes(16)), 'nbf' => $now - 30, 'exp' => $now + 300]));
            if (!openssl_sign($header . '.' . $payload, $signature, $key, OPENSSL_ALGO_SHA256)) throw new RuntimeException('同期用の署名に失敗しました。');
            $params['client_assertion_type'] = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
            $params['client_assertion'] = $header . '.' . $payload . '.' . self::b64($signature);
        } else {
            $secret = getenv('FOREST_SP_CLIENT_SECRET');
            if (!$secret) throw new RuntimeException('同期用証明書または環境変数の秘密情報が未設定です。');
            $params['client_secret'] = $secret;
        }
        $data = $this->request('POST', $url, ['Content-Type: application/x-www-form-urlencoded'], http_build_query($params));
        if (empty($data['access_token'])) throw new RuntimeException('Microsoft 365の認証に失敗しました。');
        return $this->token = $data['access_token'];
    }

    private function request($method, $url, array $headers, $body = null) {
        for ($attempt = 0; $attempt < 3; $attempt++) {
            if ($this->deadline && microtime(true) > $this->deadline) throw new RuntimeException('同期の制限時間を超えました。前回データを保持します。CLIで再同期してください。');
            if ($this->transport) {
                $response = call_user_func($this->transport, $method, $url, $headers, $body);
            } else {
                $retryAfter = null;
                $curl = curl_init($url);
                curl_setopt_array($curl, [CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => false,
                    CURLOPT_CONNECTTIMEOUT => 10, CURLOPT_TIMEOUT => 30, CURLOPT_HTTPHEADER => $headers,
                    CURLOPT_CUSTOMREQUEST => $method, CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
                    CURLOPT_HEADERFUNCTION => function ($ch, $line) use (&$retryAfter) {
                        if (stripos($line, 'Retry-After:') === 0) $retryAfter = trim(substr($line, 12));
                        return strlen($line);
                    }]);
                if ($body !== null) curl_setopt($curl, CURLOPT_POSTFIELDS, $body);
                $raw = curl_exec($curl);
                $code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
                curl_close($curl);
                if ($raw === false) throw new RuntimeException('Microsoft 365に接続できません。前回の正常データは保持されます。');
                $response = ['status' => $code, 'body' => $raw, 'retry_after' => $retryAfter];
            }
            $code = $response['status'];
            if (in_array($code, [429, 503, 504], true) && $attempt < 2) {
                $delay = $response['retry_after'] ?? (1 << $attempt);
                if (!is_numeric($delay) || (int)$delay > 10) throw new RuntimeException('Microsoft 365が混雑しています。後ほど再同期してください。');
                if (!$this->transport) sleep(max(1, (int)$delay));
                continue;
            }
            if ($code < 200 || $code >= 300) {
                throw new RuntimeException('Microsoft Graph取得失敗（HTTP ' . (int)$code . '）。接続設定・閲覧権限を確認してください。');
            }
            $data = json_decode($response['body'], true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($data)) throw new RuntimeException('Microsoft Graphから不正な応答を受信しました。');
            return $data;
        }
        throw new RuntimeException('Microsoft Graphへの接続に失敗しました。');
    }

    private function graph($url) {
        // Never forward a bearer token to an untrusted pagination URL or redirects.
        $parts = parse_url($url);
        if (($parts['scheme'] ?? '') !== 'https' || ($parts['host'] ?? '') !== 'graph.microsoft.com' ||
            isset($parts['user']) || isset($parts['pass']) || isset($parts['port']) ||
            strpos($parts['path'] ?? '', '/v1.0/drives/') !== 0) throw new RuntimeException('不正なGraphページURLです。');
        return $this->request('GET', $url, ['Authorization: Bearer ' . $this->accessToken(), 'Accept: application/json']);
    }

    private function itemUrl($drive, $id) {
        return 'https://graph.microsoft.com/v1.0/drives/' . rawurlencode($drive) . '/items/' . rawurlencode($id);
    }

    private function children($drive, $id) {
        $url = $this->itemUrl($drive, $id) . '/children?' . http_build_query([
            '$select' => 'id,name,webUrl,folder,file,parentReference,deleted,remoteItem', '$top' => 200]);
        $items = [];
        $pages = [];
        do {
            if (isset($pages[$url]) || count($pages) > 10000) throw new RuntimeException('Graphのページ取得を完了できません。');
            $pages[$url] = true;
            $page = $this->graph($url);
            if (!isset($page['value']) || !is_array($page['value'])) throw new RuntimeException('Graphの一覧応答が不正です。');
            foreach ($page['value'] as $item) {
                if (!is_array($item) || empty($item['id']) || !isset($item['name'])) throw new RuntimeException('Graphの項目応答が不正です。');
                if (isset($item['deleted'])) continue;
                $items[$item['id']] = $item;
            }
            $url = $page['@odata.nextLink'] ?? null;
            if ($url !== null && !is_string($url)) throw new RuntimeException('GraphのページURLが不正です。');
        } while ($url);
        return array_values($items);
    }

    public function sync() {
        if (!$this->config) throw new RuntimeException('Microsoft 365の接続設定が必要です。');
        $dir = $this->directory();
        $lock = fopen($dir . '/sync.lock', 'c');
        if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) throw new RuntimeException('別の同期が実行中です。');
        chmod($dir . '/sync.lock', 0600);
        $this->deadline = microtime(true) + 240;
        $attemptedAt = gmdate('Y-m-d\TH:i:s\Z');
        $previousSnapshot=null;
        try {
            $previousSnapshot=$this->snapshot();
            if ($this->isLocal()) {
                $adapter = new OneDriveMeetingsInventory($this->config);
                $scan = $adapter->scan();
                $hash = hash('sha256', json_encode($scan, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
                $candidate = $this->readJson('local_candidate');
                // Do not publish a transient partial local listing. A second identical scan is required.
                if (!$candidate || ($candidate['source_fingerprint'] ?? '') !== $this->fingerprint() ||
                    ($candidate['hash'] ?? '') !== $hash) {
                    $this->writeJson('local_candidate', ['hash' => $hash, 'source_fingerprint' => $this->fingerprint(), 'observed_at' => time()]);
                    $candidate = ['observed_at' => time()];
                    $needsAnotherScan = true;
                } else {
                    $needsAnotherScan = time() - $candidate['observed_at'] < 30;
                }
                if ($needsAnotherScan) {
                    $this->writeJson('status', ['result' => 'pending', 'attempted_at' => $attemptedAt,
                        'finished_at' => gmdate('Y-m-d\TH:i:s\Z'),
                        'message' => 'OneDriveの一覧変化を確認しました。前回結果を保持し、30秒以上後の再読み取りで同じ一覧なら反映します。']);
                    return $this->status();
                }
                $folders = $scan['folders']; $files = $scan['files']; $inventory = $scan['inventory'];
            } else {
                $folders = [];
                $files = [];
                $inventory = ['folders' => 0, 'files' => 0, 'excluded_files' => 0, 'ignored_items' => 0];
                $seenRoots = [];
                foreach (self::ROOTS as $kind => $name) {
                    $root = $this->config['roots'][$kind] ?? [];
                    $drive = $root['drive_id'] ?? '';
                    $id = $root['folder_id'] ?? '';
                    if (!$drive || !$id) throw new RuntimeException('2種類の対象ドライブID・フォルダIDを設定してください。');
                    $rootKey = $drive . ':' . $id;
                    if (isset($seenRoots[$rootKey])) throw new RuntimeException('2種類の親フォルダに同じIDは指定できません。');
                    $seenRoots[$rootKey] = true;
                    $meta = $this->graph($this->itemUrl($drive, $id) . '?$select=id,name,folder');
                    if (($meta['id'] ?? '') !== $id || ($meta['name'] ?? '') !== $name || !isset($meta['folder'])) {
                        throw new RuntimeException('親フォルダIDが指定された研究MT・全体MTフォルダと一致しません。');
                    }
                    foreach ($this->children($drive, $id) as $folder) {
                        $date = self::meetingDate($folder['name']);
                        if (!isset($folder['folder']) || isset($folder['remoteItem']) || !$date) { $inventory['ignored_items']++; continue; }
                        $folderKey = $drive . ':' . $folder['id'];
                        $folders[$folderKey] = ['id' => $folder['id'], 'drive_id' => $drive, 'kind' => $kind,
                            'date' => $date, 'name' => $folder['name'], 'web_url' => self::safeUrl($folder['webUrl'] ?? '')];
                        foreach ($this->children($drive, $folder['id']) as $file) {
                            if (!isset($file['file']) || isset($file['folder']) || isset($file['remoteItem'])) { $inventory['ignored_items']++; continue; }
                            if (self::excluded($file['name'])) { $inventory['excluded_files']++; continue; }
                            $fileKey = $drive . ':' . $file['id'];
                            // A file cannot belong to two date folders in one consistent inventory.
                            if (isset($files[$fileKey]) && $files[$fileKey]['folder_key'] !== $folderKey) {
                                throw new RuntimeException('取得中にファイルの移動を検出しました。再同期してください。');
                            }
                            $files[$fileKey] = ['id' => $file['id'], 'drive_id' => $drive, 'folder_key' => $folderKey,
                                'name' => $file['name'], 'file_kind'=>self::fileKind($file['name']), 'stem' => self::stem($file['name']), 'web_url' => self::safeUrl($file['webUrl'] ?? '')];
                        }
                    }
                }
                $inventory['folders'] = count($folders);
                $inventory['files'] = count($files);
            }
            $inventoryHash=hash('sha256',json_encode(['folders'=>$folders,'files'=>$files],JSON_UNESCAPED_UNICODE));
            $inventoryChanged=($previousSnapshot['inventory_hash'] ?? '')!==$inventoryHash;
            $snapshot = ['inventory_hash'=>$inventoryHash,'inventory_changed'=>$inventoryChanged,'version' => 1, 'source_fingerprint' => $this->fingerprint(), 'synced_at' => gmdate('Y-m-d\TH:i:s\Z'),
                'source_mode' => $this->isLocal() ? 'onedrive' : 'graph',
                'folders' => $folders, 'files' => $files, 'inventory' => $inventory];
            // Publish one complete generation atomically, never a partial first-root result.
            $this->writeJson('snapshot', $snapshot);
            $this->snapshotLoaded = false;
            // The complete snapshot is authoritative if the auxiliary status write fails.
            try { $this->writeJson('status', ['result' => 'success', 'attempted_at' => $attemptedAt, 'finished_at' => $snapshot['synced_at']]); } catch (Throwable $ignored) {}
            return $this->status();
        } catch (Throwable $e) {
            $message = $e instanceof JsonException ? '同期応答の形式が不正です。前回の正常データを保持します。' : $e->getMessage();
            try { $this->writeJson('status', ['result' => 'failed', 'attempted_at' => $attemptedAt,
                'finished_at' => gmdate('Y-m-d\TH:i:s\Z'), 'message' => $message]); } catch (Throwable $ignored) {}
            throw new RuntimeException($message);
        } finally {
            $this->deadline = null;
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }

    /** Resolve filename surnames only when exactly one registered participant matches. */
    public static function surnameParticipant($stem, array $aliasesByUser, array $usersById) {
        $normalize = function ($text) {
            if (function_exists('mb_convert_kana')) $text = mb_convert_kana($text, 'asKV', 'UTF-8');
            if (class_exists('Normalizer')) $text = Normalizer::normalize($text, Normalizer::FORM_C);
            return $text;
        };
        $stem = $normalize($stem);
        // Detect registered same-surname users even if only one has an alias entry so far.
        $configuredAliases = $aliasesByUser;
        foreach ($configuredAliases as $aliases) {
            if (!is_array($aliases)) continue;
            foreach ($aliases as $alias) {
                if (!is_string($alias) || trim($alias) === '') continue;
                $alias = $normalize(trim($alias));
                foreach ($usersById as $uid => $name) {
                    $name = preg_replace('/[\s　]+/u', '', $normalize($name));
                    $same = preg_match('/^\p{Han}+$/u', $alias)
                        ? strpos($name, $alias) === 0 : strcasecmp($name, $alias) === 0;
                    if ($same) $aliasesByUser[(string)$uid] = array_merge($aliasesByUser[(string)$uid] ?? [], $aliases);
                }
            }
        }
        $hits = [];
        foreach ($aliasesByUser as $uid => $aliases) {
            if (!isset($usersById[(string)$uid]) || !is_array($aliases)) continue;
            foreach ($aliases as $alias) {
                if (!is_string($alias) || trim($alias) === '') continue;
                $alias = $normalize(trim($alias));
                $literal = preg_quote($alias, '~');
                // ASCII letter boundaries distinguish kawa from nakagawa, while allowing dates/Japanese suffixes.
                $pattern = preg_match('/^[a-z]+$/i', $alias)
                    ? '~(?<![a-z])' . $literal . '(?![a-z])~iu' : '~' . $literal . '~u';
                preg_match_all($pattern, $stem, $matches, PREG_OFFSET_CAPTURE);
                foreach ($matches[0] as $match) $hits[] = ['uid' => (string)$uid, 'start' => $match[1], 'end' => $match[1] + strlen($match[0])];
            }
        }
        $candidates = [];
        foreach ($hits as $hit) {
            $contained = false;
            foreach ($hits as $other) {
                // 江川 must not also identify 川. Equal surname spans retain ambiguity across users.
                if ($other['start'] <= $hit['start'] && $other['end'] >= $hit['end'] &&
                    ($other['start'] < $hit['start'] || $other['end'] > $hit['end'])) { $contained = true; break; }
            }
            if (!$contained) $candidates[$hit['uid']] = true;
        }
        return count($candidates) === 1 ? (string)array_key_first($candidates) : null;
    }

    private function participant(array $file, array $usersById) {
        $key = $this->participantUserKey . ':' . $file['drive_id'] . ':' . $file['id'] . ':' . $file['stem'];
        if (!array_key_exists($key, $this->participantCache)) $this->participantCache[$key] = $this->resolveParticipant($file, $usersById);
        return $this->participantCache[$key];
    }

    private function resolveParticipant(array $file, array $usersById) {
        $rules = $this->config['participants'] ?? [];
        $key = $file['drive_id'] . ':' . $file['id'];
        if (array_key_exists($key, $rules['file_ids'] ?? [])) {
            $id = $rules['file_ids'][$key];
        } elseif (array_key_exists($file['stem'], $rules['stems'] ?? [])) {
            $id = $rules['stems'][$file['stem']];
        } else {
            return self::surnameParticipant($file['stem'], $rules['surname_aliases'] ?? [], $usersById);
        }
        return $id !== null && isset($usersById[(string)$id]) ? (string)$id : null;
    }

    public function records($metric, array $filter, array $users = []) {
        if (!in_array($metric, self::METRICS, true)) throw new InvalidArgumentException('未対応のMT指標です。');
        if (!$this->status()['available']) return [];
        if(in_array($metric,['meeting_audio_files_total','meeting_audio_sessions_total','audio_confirmed_lessons_total'],true))return $this->audioMetricRecords($metric,$filter,$users);
        if ($metric === 'supplemental_lessons_total') return $this->supplementalRecords($filter,$users);
        if (in_array($metric,['research_lesson_shares_assumed_total','recorded_discussions_total','reframing_discussions_assumed_total'],true)) return $this->historicalResearchRecords($metric,$filter,$users);
        if ($metric==='lesson_shares_with_assumptions_total') return array_merge($this->records('verified_lessons_total',$filter,$users),$this->records('research_lesson_shares_assumed_total',$filter,$users));
        $snapshot = $this->snapshot();
        $usersById = [];
        foreach ($users as $user) $usersById[(string)$user['user_id']] = $user['name'] ?? $user['user_name'];
        $this->participantUserKey = hash('sha256', json_encode($usersById));
        $groups = [];
        $folderUsers = [];
        foreach ($snapshot['files'] as $file) {
            if(self::fileKind($file['name'])!=='document')continue;
            $folder = $snapshot['folders'][$file['folder_key']];
            $uid = $this->participant($file, $usersById);
            $folderUsers[$file['folder_key']][] = $uid;
            $isResearch = $folder['kind'] === 'research';
            if (($metric === 'research_mt_total' && !$isResearch) || (in_array($metric, ['shared_lessons_total', 'verified_lessons_total', 'lesson_candidates_total', 'lesson_review_total'], true) && $isResearch)) continue;
            $key = $isResearch ? $file['folder_key'] . ':' . $file['stem'] : $file['drive_id'] . ':' . $file['id'];
            if (!isset($groups[$key])) $groups[$key] = ['folder' => $folder, 'name' => $isResearch ? $file['stem'] : $file['name'], 'files' => [], 'uids' => []];
            $groups[$key]['files'][] = $file;
            $groups[$key]['uids'][] = $uid;
        }
        $isSession = in_array($metric, ['research_mt_days', 'general_mt_sessions'], true);
        if ($isSession) {
            $groups = [];
            foreach ($snapshot['folders'] as $key => $folder) {
                if (($metric === 'research_mt_days') !== ($folder['kind'] === 'research')) continue;
                $files = array_values(array_filter($snapshot['files'], function ($file) use ($key) { return $file['folder_key'] === $key && self::fileKind($file['name'])==='document'; }));
                $groups[$key] = ['folder' => $folder, 'name' => $folder['name'], 'files' => $files, 'uids' => $folderUsers[$key] ?? []];
            }
        }
        if ($metric==='general_mt_sessions') {
            foreach ($this->supplementalRecords($filter,$users) as $record) {
                $folder=$record['folder'];$key=$folder['drive_id'].':'.$folder['id'];
                if (!isset($groups[$key])) $groups[$key]=['folder'=>$folder,'name'=>$folder['name'],'files'=>[],'uids'=>[]];
                $groups[$key]['uids'][]=$record['user_id'];
                $groups[$key]['supplements'][]=$record['supplemental'];
            }
        }
        $selected = array_map('strval', $filter['user_ids'] ?? []);
        $includeUnknown = !empty($filter['include_unmatched']);
        $result = [];
        foreach ($groups as $key => $group) {
            $folder = $group['folder'];
            if ($folder['kind'] === 'general') {
                foreach ($group['files'] as &$file) { $file['analysis'] = $this->fileAnalysis($file); $file['file_key'] = $file['drive_id'].':'.$file['id']; }
                unset($file);
                $analysis = $group['files'][0]['analysis'] ?? ['effective_status'=>'unprocessed','verified'=>false];
                if ($metric === 'verified_lessons_total' && !($analysis['verified'] && $analysis['effective_status'] === 'yes')) continue;
                if ($metric === 'lesson_candidates_total' && !(!$analysis['verified'] && $analysis['effective_status'] === 'yes')) continue;
                if ($metric === 'lesson_review_total' && !in_array($analysis['effective_status'], ['review','unprocessed'], true)) continue;
            }
            $date = $folder['date'];
            if (!empty($filter['start_date']) && $date < substr($filter['start_date'], 0, 10)) continue;
            if (!empty($filter['end_date']) && $date > substr($filter['end_date'], 0, 10)) continue;
            $known = array_values(array_unique(array_filter($group['uids'], function ($id) { return $id !== null; })));
            $uid = count($known) === 1 ? $known[0] : null;
            if ($isSession) {
                $matches = !$selected || count(array_intersect($selected, $known)) > 0 ||
                    ($includeUnknown && in_array(null, $group['uids'], true));
            } else {
                $matches = !$selected || ($uid !== null && in_array($uid, $selected, true)) || ($uid === null && $includeUnknown);
            }
            if (!$matches) continue;
            $result[] = ['record_id' => $key, 'meeting_date' => $date, 'created_at' => $date . ' 00:00:00',
                'updated_at' => $date . ' 00:00:00', 'origin_type' => $folder['kind'],
                'user_id' => $isSession ? null : $uid,
                'user_name' => $isSession ? '開催（参加者割当なし）' : ($uid === null ? '未判定' : $usersById[$uid]),
                'name' => $group['name'], 'folder' => $folder, 'files' => $group['files'],
                'file_count' => count($group['files']), 'participant_conflict' => !$isSession && count($known) > 1, 'supplements' => $group['supplements'] ?? []];
        }
        if ($metric==='verified_lessons_total') $result=array_merge($result,$this->supplementalRecords($filter,$users));
        usort($result, function ($a, $b) { return strcmp($a['meeting_date'] . $a['record_id'], $b['meeting_date'] . $b['record_id']); });
        return $result;
    }

    /** Participant totals count each person's attributed files and distinct date folders.
     * Session totals are person-sessions, distinct from the global number of folders.
     * Unresolved owners never enter a participant's count or population statistics.
     */
    public function participantCounts(array $filter, array $users) {
        $available=$this->status()['available'];
        $selected=array_map('strval',$filter['user_ids'] ?? []);
        $rows=[];
        foreach ($users as $user) {
            $uid=(string)$user['user_id'];
            if ($selected && !in_array($uid,$selected,true)) continue;
            $rows[$uid]=array_fill_keys(self::PARTICIPANT_METRICS,$available ? 0 : null);
        }
        $researchFolders=[]; $generalFolders=[]; $researchDates=[];
        if ($available) {
            foreach ($this->records('research_mt_total',$filter,$users) as $record) {
                $uid=$record['user_id'];
                if ($uid===null || !isset($rows[$uid])) continue;
                $rows[$uid]['mt_research_presentations']++;
                $researchDates[$uid][$record['meeting_date']]=true;
                $researchFolders[$uid][$record['folder']['drive_id'].':'.$record['folder']['id']]=true;
            }
            foreach ($this->records('shared_lessons_total',$filter,$users) as $record) {
                $uid=$record['user_id'];
                if ($uid===null || !isset($rows[$uid])) continue;
                $rows[$uid]['mt_shared_files']++;
                $generalFolders[$uid][$record['folder']['drive_id'].':'.$record['folder']['id']]=true;
                $analysis=$record['files'][0]['analysis'];
                if ($analysis['verified'] && $analysis['effective_status']==='yes') $rows[$uid]['mt_verified_lessons']++;
                if (!$analysis['verified'] && $analysis['effective_status']==='yes') $rows[$uid]['mt_lesson_candidates']++;
                if (in_array($analysis['effective_status'],['review','unprocessed'],true)) $rows[$uid]['mt_lesson_review']++;
            }
            foreach ($this->records('supplemental_lessons_total',$filter,$users) as $record) {
                $uid=$record['user_id'];
                if (!isset($rows[$uid])) continue;
                $rows[$uid]['mt_supplemental_lessons']++;
                $rows[$uid]['mt_verified_lessons']++;
                $generalFolders[$uid][$record['folder']['drive_id'].':'.$record['folder']['id']]=true;
            }
            foreach($this->records('research_lesson_shares_assumed_total',$filter,$users) as $record) {
                $uid=$record['user_id'];if(isset($rows[$uid]))$rows[$uid]['mt_research_lesson_shares_assumed']++;
            }
            foreach($this->records('recorded_discussions_total',$filter,$users) as $record) {
                $uid=$record['user_id'];if(!isset($rows[$uid]))continue;
                $rows[$uid]['mt_recorded_discussions']++;
                if(!empty($record['historical']['reframing_assumed']))$rows[$uid]['mt_reframing_discussions_assumed']++;
                if(empty($researchDates[$uid][$record['meeting_date']])) {
                    $researchFolders[$uid][$record['folder']['drive_id'].':'.$record['folder']['id']]=true;
                    $researchDates[$uid][$record['meeting_date']]=true;
                }
            }
            foreach($this->records('audio_confirmed_lessons_total',$filter,$users) as $record) {
                $uid=$record['user_id'];if($uid!==null&&isset($rows[$uid]))$rows[$uid]['mt_audio_confirmed_lessons']++;
            }
            foreach ($rows as $uid=>&$row) {
                $row['mt_research_sessions']=count($researchFolders[$uid] ?? []);
                $row['mt_lesson_shares_with_assumptions']=$row['mt_verified_lessons']+$row['mt_research_lesson_shares_assumed'];
                $row['mt_general_sessions']=count($generalFolders[$uid] ?? []);
            }
            unset($row);
        }
        $totals=[];
        foreach (self::PARTICIPANT_METRICS as $key) $totals[$key]=$available ? array_sum(array_column(array_values($rows),$key)) : null;
        return ['per_user'=>$rows,'totals'=>$totals];
    }

    public function summary(array $filter, array $users) {
        $status = $this->status();
        $totals = [];
        foreach (self::METRICS as $metric) $totals[$metric] = $status['available'] ? count($this->records($metric, $filter, $users)) : null;
        $research = $this->records('research_mt_total', $filter, $users);
        $totals['research_mt_files'] = $status['available'] ? array_sum(array_column($research, 'file_count')) : null;
        $totals['research_mt_unmatched'] = $status['available'] ? count(array_filter($research, function ($r) { return $r['user_id'] === null; })) : null;
        $shared = $this->records('shared_lessons_total', $filter, $users);
        $totals['shared_lessons_unmatched'] = $status['available'] ? count(array_filter($shared, function ($r) { return $r['user_id'] === null; })) : null;
        // Explain why a valid snapshot can produce zero under the participant filter.
        $dateOnly = array_merge($filter, ['user_ids' => []]);
        $excluded = ['research_mt' => 0, 'shared_lessons' => 0];
        if ($status['available'] && !empty($filter['user_ids']) && empty($filter['include_unmatched'])) {
            foreach (['research_mt' => 'research_mt_total', 'shared_lessons' => 'shared_lessons_total'] as $key => $metric) {
                foreach ($this->records($metric, $dateOnly, $users) as $record) {
                    if ($record['user_id'] === null) $excluded[$key]++;
                }
            }
        }
        return array_merge($totals, ['analysis_status' => $this->analysisStatus(), 'excluded_unmatched' => $excluded, 'sync' => $status]);
    }

    public static function axisKey(array $record, $axis) {
        if ($axis === 'all') return '全体';
        if ($axis === 'user') return $record['user_id'] === null ? $record['user_name'] : $record['user_name'] . ' (ID:' . $record['user_id'] . ')';
        if ($axis === 'origin') return $record['origin_type'] === 'research' ? '研究MT' : '全体MT';
        if ($axis === 'status') return '対象外（MT資料）';
        $date = new DateTimeImmutable($record['meeting_date'], new DateTimeZone('Asia/Tokyo'));
        if ($axis === 'year') return $date->format('Y年');
        if ($axis === 'month') return $date->format('Y年m月');
        if ($axis === 'week') return $date->format('o年 W週');
        if ($axis === 'day') return $date->format('Y/m/d');
        return '全体';
    }
}
