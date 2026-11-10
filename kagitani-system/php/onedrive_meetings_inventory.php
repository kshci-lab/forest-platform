<?php
/** Read-only filesystem metadata adapter. Never opens document bodies or modifies sync folders. */
class OneDriveMeetingsInventory {
    private $config;
    public function __construct(array $config) { $this->config = $config; }

    private function listing($path) {
        $names = @scandir($path);
        if ($names === false) throw new RuntimeException('OneDriveのフォルダ一覧を読み取れません。Finderで表示できるか確認してください。');
        return array_values(array_diff($names, ['.', '..']));
    }

    private function metadata($path) {
        clearstatcache(true, $path);
        $stat = @lstat($path);
        if ($stat === false) throw new RuntimeException('読み取り中にOneDriveの項目が変化しました。次回の読み取りを待ってください。');
        return $stat;
    }

    private function type(array $stat) { return $stat['mode'] & 0170000; }

    private function webUrl($base, array $parts) {
        if (!$base) return '';
        $url = parse_url($base);
        if (!$url || ($url['scheme'] ?? '') !== 'https' || isset($url['query']) || isset($url['fragment']) ||
            isset($url['user']) || isset($url['pass']) || isset($url['port']) ||
            !preg_match('/(^|\.)sharepoint\.com$/i', $url['host'] ?? '') || strpos($url['path'] ?? '', '/:') !== false) {
            throw new RuntimeException('元資料URLには共有リンクではなく、SharePointのフォルダの直接URLを指定してください。未設定でも集計できます。');
        }
        return rtrim($base, '/') . '/' . implode('/', array_map('rawurlencode', $parts));
    }

    public function scan() {
        $folders = [];
        $files = [];
        $inventory = ['folders' => 0, 'files' => 0, 'excluded_files' => 0, 'ignored_items' => 0];
        $roots = [];
        foreach (SharePointMeetings::ROOTS as $kind => $label) {
            $path = $this->config['roots'][$kind]['path'] ?? '';
            if (!is_string($path) || substr($path, 0, 1) !== '/') throw new RuntimeException('研究MT・全体MTの両方にFinderの絶対パスを設定してください。');
            $root = realpath($path);
            if (!$root || !is_dir($root)) throw new RuntimeException($label . ' の同期フォルダが見つかりません。前回の正常結果を保持します。');
            $roots[$kind] = $root;
        }
        if ($roots['research'] === $roots['general'] || strpos($roots['research'] . '/', $roots['general'] . '/') === 0 ||
            strpos($roots['general'] . '/', $roots['research'] . '/') === 0) throw new RuntimeException('研究MTと全体MTには別々の親フォルダを指定してください。');
        foreach ($roots as $kind => $root) {
            $baseUrl = $this->config['roots'][$kind]['web_url'] ?? '';
            if ($baseUrl) $this->webUrl($baseUrl, []);
            foreach ($this->listing($root) as $name) {
                $path = $root . '/' . $name;
                $stat = $this->metadata($path);
                $date = SharePointMeetings::meetingDate($name);
                if ($this->type($stat) !== 0040000 || !$date) { $inventory['ignored_items']++; continue; }
                $folderId = 'local-' . hash('sha256', $kind . '/' . $name);
                $key = 'onedrive:' . $folderId;
                $folders[$key] = ['id' => $folderId, 'drive_id' => 'onedrive', 'kind' => $kind,
                    'date' => $date, 'name' => $name, 'web_url' => $this->webUrl($baseUrl, [$name]), 'local_path' => $path];
                foreach ($this->listing($path) as $fileName) {
                    $filePath = $path . '/' . $fileName;
                    $fileStat = $this->metadata($filePath);
                    if ($this->type($fileStat) !== 0100000) { $inventory['ignored_items']++; continue; }
                    if (SharePointMeetings::excluded($fileName)) { $inventory['excluded_files']++; continue; }
                    $fileId = 'local-' . hash('sha256', $kind . '/' . $name . '/' . $fileName);
                    $files['onedrive:' . $fileId] = ['id' => $fileId, 'drive_id' => 'onedrive', 'folder_key' => $key,
                        'name' => $fileName, 'file_kind'=>SharePointMeetings::fileKind($fileName),
                        'size_bytes'=>$fileStat['size'], 'modified_at'=>$fileStat['mtime'], 'stem' => SharePointMeetings::stem($fileName),
                        'web_url' => $this->webUrl($baseUrl, [$name, $fileName]), 'local_path' => $filePath];
                }
            }
        }
        ksort($folders); ksort($files);
        $inventory['folders'] = count($folders); $inventory['files'] = count($files);
        return ['folders' => $folders, 'files' => $files, 'inventory' => $inventory];
    }
}
