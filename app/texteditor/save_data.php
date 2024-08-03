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
    $date = new DateTimeImmutable();
    $stamp = $date->format('Y-m-d_H-i-s-v');

    $pos = strrpos($file, '/');
    $basedir = substr($file, 0, $pos + 1);
    $filename = substr($file, $pos + 1);
    $pos = strrpos($filename, '.');
    $basename = substr($filename, 0, $pos);
    $extension = substr($filename, $pos + 1);

    $file_backup = "{$basedir}/{$basename}.bk.{$stamp}.{$extension}";
    if (file_exists($file) && !copy($file, $file_backup)) {
        throw new Exception("Could not copy {$path} to {$file_backup}");
    }

    // delete old backups
    $backups = [];

    if ($handle = opendir($basedir)) {
        while (($entry = readdir($handle)) !== false) {
            if (!in_array($entry, array('.', '..')) &&
                !is_dir($basedir.$entry) &&
                substr($entry, 0, strlen($basename) + 3) == "{$basename}.bk") {
                $backups[] = $entry;
            }
        }
    } else {
        throw new Exception("Could not open {$basedir}");
    }

    if (count($backups) > 10) {
        arsort($backups);
        $backups_to_remove = array_slice($backups, 10);

        foreach ($backups_to_remove as $backup) {
            unlink("{$basedir}/{$backup}");
        }
    }
}

$data = json_decode(file_get_contents("php://input"), true);

$dir = getcwd() . '/../texts';

$source_file = "{$dir}/{$data['source']}";
$source_content = $data['md'];
$page_file = "{$dir}/{$data['page']}";
$page_content = $data['html'];

create_backup($source_file);

// write data to file
file_put_contents("{$source_file}", $data['md']);
file_put_contents("{$page_file}", $data['html']);

$response['status'] = 'success';
$response['content'] = $data['md'];

header("Content-Type: application/json");
echo json_encode($response);
?>
