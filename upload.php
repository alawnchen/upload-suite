<?php
// Just dump & remove file
header('Content-Type: text/plain');
$o = print_r($_POST);
unlink($_POST['upload_path']);

// TODO: Save file information to SQLite, and indicate an expiration time to remove unuse file.
