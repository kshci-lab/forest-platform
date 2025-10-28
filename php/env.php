<?php
// 軽量な .env ローダー（composer 不要）
// 使い方:
//   require_once __DIR__ . '/env.php';
//   load_env('/absolute/path/to/.env');
//   $value = env('KEY', 'default');

if (!function_exists('load_env')) {
    function load_env(string $filePath): array
    {
        $loaded = [];
        if (!is_file($filePath) || !is_readable($filePath)) {
            return $loaded;
        }
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || (isset($line[0]) && $line[0] === ';')) {
                continue;
            }
            // KEY=VALUE 形式のみ対応（VALUE はクォート可）
            $pos = strpos($line, '=');
            if ($pos === false) {
                continue;
            }
            $key = trim(substr($line, 0, $pos));
            $val = trim(substr($line, $pos + 1));
            if ($val !== '') {
                $len = strlen($val);
                if ($len >= 2) {
                    $first = $val[0];
                    $last  = $val[$len - 1];
                    if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                        $val = substr($val, 1, -1);
                    }
                }
            }
            if ($key === '') {
                continue;
            }
            // すでに定義済みでなければセット
            if (!array_key_exists($key, $_ENV)) {
                $_ENV[$key] = $val;
            }
            if (getenv($key) === false) {
                // putenv は文字列を要求
                @putenv($key . '=' . $val);
            }
            $loaded[$key] = $val;
        }
        return $loaded;
    }
}

if (!function_exists('env')) {
    function env(string $key, $default = null)
    {
        if (array_key_exists($key, $_ENV)) {
            return $_ENV[$key];
        }
        $v = getenv($key);
        return $v !== false ? $v : $default;
    }
}
