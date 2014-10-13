<?php
// $_POST structure
/*
Array
(
    [upload_name] => 07版xps.rar
    [upload_content_type] => application/x-rar-compressed
    [upload_path] => /tmp/0000000023
    [upload_md5] => 9c8b34b22d628b48e30f8e5738062bb3
    [upload_size] => 2067743
    [batch_id] => 585bced9-a7db-90a7-4f14-aae97755f9dc
)
*/

// TODO: compare md5 hash

$dbpath = '/tmp/upload_info.sqlite3';
$lifetime = 1800; // files can keep 10 mins

$SCHEMA = 'CREATE TABLE IF NOT EXISTS upload_info (' .
	'id       INTEGER PRIMARY KEY,' .
	'name     VARCHAR(255),' .
	'temp     TEXT,' .
	'ip       VARCHAR(45),' .
	'batch_id VARCHAR(36),' .
	'utime    INTEGER' .
')';

$INSERT = 'INSERT INTO upload_info(name,temp,ip,batch_id,utime) VALUES (?,?,?,?,?)';

$dbh = new PDO('sqlite:' . $dbpath);
$dbh->exec($SCHEMA);
$stmt = $dbh->prepare($INSERT);

if ($stmt!==false) {
	$now = time();
	$stmt->bindParam(1, $_POST['upload_name']);
	$stmt->bindParam(2, $_POST['upload_path']);
	$stmt->bindParam(3, $_SERVER['REMOTE_ADDR']);
	$stmt->bindParam(4, $_POST['batch_id']);
	$stmt->bindParam(5, $now);
	$stmt->execute();	
}

$dbh = null;

header('Content-Type: application/json');
echo json_encode(array(
	'status' => 'OK'
));