<?php
error_reporting(E_ALL);
header('Access-Control-Allow-Origin: *');


function sendResult($file_name, $last_modified_time) {
    // resend it
    $file = file_get_contents($file_name);
    header('Last-Modified: ' . $last_modified_time->format('D, d M Y H:i:s T'));
    echo $file;
}

$file_name = 'gtfs.bin';


if (file_exists($file_name)) {
    $modified = new DateTimeImmutable();
    $modified = $modified->setTimestamp(filemtime($file_name));

    $nowMinus = new DateTimeImmutable();
    $nowMinus = $nowMinus->sub(new DateInterval("PT15S")); // 15s

    if($nowMinus < $modified) {
        header('x-cache: HIT');
        sendResult($file_name, $modified);
        exit();
    }
}


$curl = curl_init();
$fp = fopen($file_name, "w");

if($modified && $modified->format('s') > 30) {
    $key = "XX";
    header('x-key: 1');
} else {
    $key = "YYY";  // doc one
    header('x-key: 2');
}

curl_setopt_array($curl, [
    CURLOPT_URL => "https://gtfsrt.tectime.be/proto/RealTime/vehicles?key=".$key,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_CUSTOMREQUEST => "GET",
    CURLOPT_HTTPHEADER => [
      "Accept: */*"
    ],
    CURLOPT_FILE => $fp,
  ]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);
fclose($fp);

if ($err) {
    die("cURL Error #:" . $err);
}
header('x-cache: MISS');
sendResult($file_name, new DateTimeImmutable());
