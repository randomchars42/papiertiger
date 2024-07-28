<?php

// send `204 No Content` status code.
http_response_code(204);

$file = 'csp_report';
// get the raw POST data.
$data = file_get_contents('php://input');
// only continue if it’s valid JSON
if ($data = json_decode($data)) {
    // prettify the JSON-formatted data.
    $data = json_encode(
        $data,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
    );
    // append report to `$file`
    // if there's already > ~ 2 MB of reports drop the file and start a new one
    if (file_exists($file) && filesize($file) > 2000000) {
        file_put_contents($file, $data, LOCK_EX);
    } else {
        file_put_contents($file, $data, FILE_APPEND | LOCK_EX);

    }
}

?>
