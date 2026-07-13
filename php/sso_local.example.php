<?php

return array(
    'idp_url' => 'https://kshci-lab.net/software/hcimlab_auth',
    'client_id' => 'your-client-id',
    'client_secret' => 'your-client-secret',
    'base_url' => 'https://archive.kshci-lab.net/software/forest-platform',
    'redirect_uri' => 'https://archive.kshci-lab.net/software/forest-platform/auth/callback',
    'scope' => 'openid profile email lab',
    // Optional: override the auto-detected bundle at ../certs/cacert.pem
    // 'ca_bundle' => __DIR__ . '/../certs/cacert.pem',
);
