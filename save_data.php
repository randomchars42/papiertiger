<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

//header("Content-Type: application/json");
//echo file_get_contents("php://input");
$content = json_decode(file_get_contents("php://input"));

if (isset($_GET['file'])) {
    $dir = getcwd() . '/data';
    $resource = $_GET['file'];
    $date = new DateTimeImmutable();
    $stamp = $date->format('Y-m-d_H-i-s-v');

    // create backup
    $path = "{$dir}/{$resource}.json";
    $path_backup = "{$dir}/{$resource}.bk.{$stamp}.json";
    if (!copy($path, $path_backup)) {
        echo "failed to copy {$path}...\n";
    }

    // delete old backups
    $count = 0;
    $backups = [];

    if ($handle = opendir($dir)) {
        while (($file = readdir($handle)) !== false) {
            echo $file;
            if (!in_array($file, array('.', '..')) &&
                !is_dir($dir.$file) &&
                substr($file, 0, strlen($resource) + 3) == "{$resource}.bk") {
                $backups[] = $file;
                $count++;
            }
        }
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
    echo json_encode($content);
} else {
    echo json_encode(['status' => 500, 'error' => 'no file name']);
}
?>
