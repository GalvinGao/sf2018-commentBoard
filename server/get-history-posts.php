<?php

//Header("Content-Type: plain/text"); 
Header("Expires: Wed, 11 Nov 1998 11:11:11 GMT"); 
Header("Cache-Control: no-cache"); 
Header("Cache-Control: must-revalidate"); 
Header("Access-Control-Allow-Origin: *");
Header("Content-Encoding: utf-8");

//echo "<meta charset='utf-8'>";

//printf("%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c%c",71,73,70,56,57,97,1,0,1,0,128,255,0,192,192,192,0,0,0,33,249,4,1,0,0,0,0,44,0,0,0,0,1,0,1,0,0,2,2,68,1,0,59); 

ini_set("display_errors", "On");
error_reporting(E_ALL | E_STRICT);

$sql_usr = $_ENV["mysqluser"]; //SQL Username
$sql_pwd = $_ENV["mysqlpassword"]; //SQL Password
$sql_add = $_ENV["mysqlhost"]; //SQL Address
$sql_prt = $_ENV["mysqlport"]; //SQL Port
$sql_base = $_ENV["mysqldatabase"]; //SQL DATABASE

$con = mysqli_connect($sql_add, $sql_usr, $sql_pwd, $sql_base, $sql_prt);

if(!$con)
{
	die('{"status": "error", "message": "数据库连接失败。错误代码 ERR_DATABASE_DOWN。请联系管理员。"} ');
}

function formatOut($status="ok", $data="{}" ) {
	echo <<<EOF
	{
		"status": {$status},
		"type": "history",
		"data": {$data}
	}
EOF;
}

$sql = 'SELECT name, comment, time FROM comments';
// mysqli_select_db( $conn, 'sfcomments' );
$retval = mysqli_query( $con, $sql );
if(! $retval )
{
	die('{"status": "error", "message": "数据读取失败。错误代码 ERR_INVALID_RESPONSE. 请联系管理员。"} ');
}
$output = "";
while($row = mysqli_fetch_array($retval, MYSQLI_ASSOC))
{
     $output = $output + "[".
         "name: \"{$row['name']}\",".
         "message: \"{$row['comment']}\",".
         "time: \"{$row['time']}\" ".
         "],";
}

$data = substr($output,0,-1);
formatOut("ok", $data)