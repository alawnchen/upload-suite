<?php
class UploadApi {

	private $pdo = null;

	function __construct() {
		$action = $this->getParam('action');
		if (method_exists($this, $action)) {
			$dbpath = '/tmp/upload_info.sqlite3';
			$this->pdo = new PDO('sqlite:' . $dbpath);
			$result = array(
				'status' => 'OK',
				'result' => $this->$action()
			);
		} else {
			$result = array(
				'status' => 'ERROR',
				'reason' => sprintf("Method %s didn't exist.", $action)
			);
		}

		header('Content-Type: application/json');
		echo json_encode($result, JSON_PRETTY_PRINT);
	}

	/**
	 * Get upload batch info.
	 */
	function info() {
		$batch_id = $this->getParam('batch_id');
		$stmt = $this->pdo->prepare('SELECT id,name,temp,utime FROM upload_info WHERE batch_id=?');
		$stmt->execute(array($batch_id));
		$result = $stmt->fetchAll(PDO::FETCH_ASSOC);
		$stmt->closeCursor();
		for ($i=0;$i<count($result);$i++) {
			$result[$i]['utime'] = date('Y-m-d H:i:s', (int)$result[$i]['utime']);
		}
		return $result;
	}

	function getParam($key) {
		if (isset($_POST[$key])) return $_POST[$key];
		if (isset($_GET[$key])) return $_GET[$key];
		return '';
	}

}

new UploadApi();
