<?php

session_start();

//Header("Content-Type: plain/text"); 
Header("Expires: Wed, 01 Jan 1970 00:00:01 GMT"); 
Header("Cache-Control: no-cache"); 
Header("Cache-Control: must-revalidate"); 
Header("Access-Control-Allow-Origin: *");
Header("Access-Control-Allow-Methods: GET");
Header("Content-Encoding: utf-8");

//printf("%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c",71,73,70,56,57,97,1,0,1,0,128,255,0,192,192,192,0,0,0,33,249,4,1,0,0,0,0,44,0,0,0,0,1,0,1,0,0,2,2,68,1,0,59); 

// Development Settings
ini_set("display_errors", "On");
error_reporting(E_ALL | E_STRICT);

// Production Settings
//ini_set("display_errors", "Off");
//error_reporting(0);

$sql_usr = "sf2018"; //SQL Username
$sql_pwd = "sf2018"; //SQL Password
$sql_add = "localhost"; //SQL Address
$sql_prt = "3306"; //SQL Port
$sql_base = "sfcomments"; //SQL DATABASE

$con = mysqli_connect($sql_add, $sql_usr, $sql_pwd, $sql_base, $sql_prt);

if(!$con)
{
	die('{"status": "error", "message": "数据库连接失败。错误代码 ERR_DATABASE_DOWN。请联系管理员。"} ');
}

function formatOut($status="ok", $data="[]" ) {
	echo <<<EOF
	{
		"status": {$status},
		"type": "history",
		"data": {$data}
	}
EOF;
}

$sql = 'SELECT name, comment, time FROM comments;';

// mysqli_select_db( $conn, 'sfcomments' );
$retval = mysqli_query( $con, $sql );
var_dump($retval);

if(! $retval ) {
	die('{"status": "error", "message": "数据读取失败。错误代码 ERR_INVALID_RESPONSE. 请联系管理员。"} ');
}

$output = "";

var_dump($output);

/*

while($row = mysqli_fetch_array($retval, MYSQLI_ASSOC)) {
     $output += "[".
         "name: \"{$row['name']}\",".
         "message: \"{$row['comment']}\",".
         "time: \"{$row['time']}\" ".
         "],";
}

*/
/*
echo "[begin while]";
while($row = mysqli_fetch_array($retval, MYSQLI_BOTH)) {
  echo "[while time]";
     $output = $output + "[".
         "name: \"{$row['name']}\",".
         "message: \"{$row['comment']}\",".
         "time: \"{$row['time']}\" ".
         "],";
}
echo "[end while]";
echo $output;

*/

$rowdebug = mysqli_fetch_array($retval, MYSQLI_BOTH);
var_dump($rowdebug);

/* fetch associative array */
while ($row = mysqli_fetch_array($retval, MYSQLI_BOTH)) {
  $output = $output + " [".
    "\"name\": \"{$row['name']}\",".
    "\"message\": \"{$row['comment']}\",".
    "\"time\": \"{$row['time']}\" ".
  "],";
  var_dump($row);
  echo "Output:";
  var_dump($output);
}

/* free result set */
mysqli_free_result($retval);

$data = substr($output, 0, -1);
formatOut("ok", $data);

mysqli_close($con);