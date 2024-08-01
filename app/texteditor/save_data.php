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

function create_backup($dir, $file) {
    $date = new DateTimeImmutable();
    $stamp = $date->format('Y-m-d_H-i-s-v');

    $path = "{$dir}/{$file}.json";
    $path_backup = "{$dir}/{$file}.bk.{$stamp}.json";
    if (file_exists($path) && !copy($path, $path_backup)) {
        throw new Exception("Could not copy {$path} to {$path_backup}");
    }

    // delete old backups
    $backups = [];

    if ($handle = opendir($dir)) {
        while (($entry = readdir($handle)) !== false) {
            if (!in_array($entry, array('.', '..')) &&
                !is_dir($dir.$entry) &&
                substr($entry, 0, strlen($file) + 3) == "{$file}.bk") {
                $backups[] = $entry;
            }
        }
    } else {
        throw new Exception("Could not open {$dir}");
    }

    if (count($backups) > 10) {
        arsort($backups);
        $backups_to_remove = array_slice($backups, 10);

        foreach ($backups_to_remove as $backup) {
            unlink("{$dir}/{$backup}");
        }
    }
}

$data = json_decode(file_get_contents("php://input"), true);

$dir = getcwd() . '/../texts';

$basename = $data['name'];
$source_dir = "{$dir}/{$data['source']}";
$source_file = "{$basename}.md";
$source_content = $data['md'];
$destination_dir = "{$dir}/{$data['destination']}";
$destination_content = $data['html'];
$destination_file = "{$basename}.html";

create_backup($source_dir, $source_file);

// write data to file
file_put_contents("{$source_dir}/{$source_file}", $data['md']);
file_put_contents("{$destination_dir}/{$destination_file}", $data['html']);

$response['status'] = 'success';
$response['content'] = $data['md'];

header("Content-Type: application/json");
echo json_encode($response);
?>
