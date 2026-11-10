<?php
/** Password material is kept outside both Git and the web root. */
function forestDashboardVerifyPassword(string $password): bool {
    $hash=getenv('FOREST_DASHBOARD_PASSWORD_HASH');
    if(!$hash){$path=getenv('FOREST_DASHBOARD_AUTH_FILE')?:dirname(__DIR__,4).'/forest-platform-private/dashboard-password.hash';$hash=is_readable($path)?trim(file_get_contents($path)):'';}
    return is_string($hash)&&$hash!==''&&password_verify($password,$hash);
}
