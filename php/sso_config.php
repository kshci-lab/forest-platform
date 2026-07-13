<?php

function hcimlab_sso_detect_base_url()
{
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443);
    $scheme = $https ? 'https' : 'http';
    $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost:8888';
    $script = isset($_SERVER['SCRIPT_NAME']) ? str_replace('\\', '/', $_SERVER['SCRIPT_NAME']) : '';

    $authPos = strpos($script, '/auth/');
    if ($authPos !== false) {
        $basePath = substr($script, 0, $authPos);
    } else {
        $basePath = rtrim(dirname($script), '/\\');
    }

    if ($basePath === '/' || $basePath === '\\' || $basePath === '.') {
        $basePath = '';
    }

    return $scheme . '://' . $host . $basePath;
}

$baseUrl = getenv('HCIMLAB_SSO_BASE_URL') ?: hcimlab_sso_detect_base_url();

$config = array(
    'idp_url' => getenv('HCIMLAB_SSO_IDP_URL') ?: 'https://kshci-lab.net/software/hcimlab_auth',
    'client_id' => getenv('HCIMLAB_SSO_CLIENT_ID') ?: '',
    'client_secret' => getenv('HCIMLAB_SSO_CLIENT_SECRET') ?: '',
    'base_url' => rtrim($baseUrl, '/'),
    'redirect_uri' => getenv('HCIMLAB_SSO_REDIRECT_URI') ?: rtrim($baseUrl, '/') . '/auth/callback',
    'scope' => getenv('HCIMLAB_SSO_SCOPE') ?: 'openid profile email lab',
);

$isProduction = false;
if (!empty($_SERVER['DOCUMENT_ROOT']) && strpos($_SERVER['DOCUMENT_ROOT'], '/home/ubuntu/') !== false) {
    $isProduction = true;
}
if (!empty($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'archive.kshci-lab.net') !== false) {
    $isProduction = true;
}

$envConfigPath = $isProduction ? __DIR__ . '/sso_production.php' : __DIR__ . '/sso_local.php';
if (file_exists($envConfigPath)) {
    $envConfig = require $envConfigPath;
    if (is_array($envConfig)) {
        $config = array_merge($config, $envConfig);
    }
}

return $config;
