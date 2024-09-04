<?php
//ini_set('display_errors', 1);
//ini_set('display_startup_errors', 1);
//error_reporting(E_ALL);

$response = [
    'status' => '',
    'content' => ''
];

function exception_handler(Throwable $exception) {
    $response['status'] = 'error';
    $response['content'] = $exception->getMessage();

    header("Content-Type: application/json");
    echo json_encode($response);
    exit;
}

function exceptions_error_handler($severity, $message, $filename, $lineno) {
    throw new ErrorException($message, 0, $severity, $filename, $lineno);
}

set_exception_handler('exception_handler');
set_error_handler('exceptions_error_handler');

function create_backup($file) {
    $pos = strrpos($file, '/');
    if ($pos === false) {
        $basedir = '.';
        $filename = $file;
    } else {
        $basedir = substr($file, 0, $pos + 1);
        $filename = substr($file, $pos + 1);
    }
    $pos = strrpos($filename, '.');
    if ($pos === false) {
        throw new Exception('Invalid filename: ' . $filename);
    }
    $basename = substr($filename, 0, $pos);
    $extension = substr($filename, $pos + 1);

    $date = new DateTimeImmutable();
    $stamp = $date->format('Y-m-d_H-i-s-v');

    // create backup
    $file_backup = "./{$basedir}/{$basename}.bk.{$stamp}.{$extension}";
    if (file_exists($file) && !copy($file, $file_backup)) {
        throw new Exception("Could not copy {$path} to {$file_backup}");
    }

    $backups = [];

    // gather old backups in the base directory
    if ($handle = opendir($basedir)) {
        while (($entry = readdir($handle)) !== false) {
            // omit ".", ".." and directories
            // we are looking for `$entry`s matching `BASENAME.bk`
            // so cut off `$entry` after length of `$basename` + 3 (".bk")
            if (!in_array($entry, array('.', '..')) &&
                !is_dir($basedir.$entry) &&
                substr($entry, 0, strlen($basename) + 3) == "{$basename}.bk") {
                $backups[] = $entry;
            }
        }
    } else {
        throw new Exception("Could not open {$basedir}");
    }

    // if there are > 10 backups
    if (count($backups) > 10) {
        // the names only differ by their timestamp which can be sorted
        // reverse sort the backups so the oldest entries will be the last
        arsort($backups);
        // and delete all but the newest 10 arrays
        $backups_to_remove = array_slice($backups, 10);
        foreach ($backups_to_remove as $backup) {
            unlink("{$basedir}/{$backup}");
        }
    }
}

// `json_encode(DATA, JSON_PRETTY_PRINT)` will inflate the file too much
// try to make it more human friendly
function prettify_json_data($data) {
    $data = json_encode($data, JSON_PRETTY_PRINT);
    // shrink JSON object spanning multiple lines (one for each attribute)
    // to one line
    $data = preg_replace('/,[\n\r]+\s+"(def|del|cat|text|label|items|collapsed)"/', ", \"$1\"", $data);
    $data = preg_replace('/{[\r\n]+\s+"/',  "{\"", $data);
    //$data = preg_replace('/{[\r\n]+\s+"name/',  "{\"name", $data);
    //$data = preg_replace('/{[\r\n]+\s+"label/', "{\"label", $data);
    //$data = preg_replace('/{[\r\n]+\s+"items/', "{\"items", $data);
    //$data = preg_replace('/{[\r\n]+\s+"def/',   "{\"def", $data);
    $data = preg_replace('/"[\r\n]+\s+}/', '"}', $data);
    $data = preg_replace('/\][\r\n]+\s+}/', ']}', $data);
    return $data;
}

$data = json_decode(file_get_contents("php://input"), true);

$dir = getcwd();

foreach ($data as &$file) {
    if ($file['type'] === 'collection') {
        $file_content = prettify_json_data($file['content']);
    } else {
        $file_content = $file['content'];
    }

    if (in_array($file['type'], array('collection', 'source'))) {
        create_backup($file['path']);
    }

    file_put_contents('./' . $file['path'], $file_content);
}

$response['status'] = 'success';
$response['content'] = $file_content;

header("Content-Type: application/json");
echo json_encode($response);
?>
