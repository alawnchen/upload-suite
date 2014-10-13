<?php
/**
 * A simple back-end hook.
 */

function accessApi($postdata) {
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, 'http://localhost/upload-suite/api.php');
	curl_setopt($ch, CURLOPT_POST, 1);
	curl_setopt($ch, CURLOPT_POSTFIELDS, $postdata);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	$ret = curl_exec($ch);
	return json_decode($ret, true);
}

$DELETE_FILES = true;

header('Content-Type: text/plain; charset=utf-8');

$postdata = array(
	'action'   => 'info',
	'batch_id' => $_POST['batch_id']
);
print_r(accessApi($postdata));

if ($DELETE_FILES) {
	$postdata = array(
		'action'   => 'delete',
		'batch_id' => $_POST['batch_id']
	);
	accessApi($postdata);
}
