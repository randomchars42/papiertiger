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

//echo file_get_contents("php://input");
$content = json_decode(file_get_contents("php://input"));

if (isset($_GET['file'])) {
    $dir = getcwd() . '/../data';
    $resource = $_GET['file'];
    $date = new DateTimeImmutable();
    $stamp = $date->format('Y-m-d_H-i-s-v');

    // create backup
    $path = "{$dir}/{$resource}.json";
    $path_backup = "{$dir}/{$resource}.bk.{$stamp}.json";
    if (file_exists($path) && !copy($path, $path_backup)) {
        throw new Exception("Could not copy {$path} to {$path_backup}");
    }

    // delete old backups
    $count = 0;
    $backups = [];

    if ($handle = opendir($dir)) {
        while (($file = readdir($handle)) !== false) {
            if (!in_array($file, array('.', '..')) &&
                !is_dir($dir.$file) &&
                substr($file, 0, strlen($resource) + 3) == "{$resource}.bk") {
                $backups[] = $file;
                $count++;
            }
        }
    } else {
        throw new Exception("Could not open {$dir}");
    }

    if ($count > 10) {
        arsort($backups);
        $backups_to_remove = array_slice($backups, 10);

        foreach ($backups_to_remove as $file) {
            unlink("{$dir}/{$file}");
        }
    }

    // write data to file
    file_put_contents($path, json_encode($content, JSON_PRETTY_PRINT));
    $response['status'] = 'success';
    $response['content'] = $content;
} else {
    $response['status'] = 'error';
    $response['content'] = 'no file name';
}

header("Content-Type: application/json");
echo json_encode($response);
?>
