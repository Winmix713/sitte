<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Adatbázis kapcsolat
function createConnection() {
    $servername = "mysql.rackhost.hu";
    $username = "c694347cdsoxru";
    $password = "VvJLxHhKG7Fk";
    $dbname = "c694347cdsoxru";

    $conn = new mysqli($servername, $username, $password, $dbname);
    if ($conn->connect_error) {
        die("Connection failed: " . $conn->connect_error);
    }
    return $conn;
}

// Tábla létrehozása
function createTable($conn) {
    $sql = "CREATE TABLE IF NOT EXISTS matches (
        id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        home_team VARCHAR(50) NOT NULL,
        away_team VARCHAR(50) NOT NULL,
        result VARCHAR(10) NOT NULL
    )";
    
    if ($conn->query($sql) === FALSE) {
        echo json_encode(["error" => "Error creating table: " . $conn->error]);
        exit();
    }
}

// CSV adatainak betöltése
function loadCsvData($conn, $url) {
    $csv_data = array_map('str_getcsv', file($url));
    array_shift($csv_data); // Fejléc eltávolítása

    $stmt = $conn->prepare("INSERT INTO matches (home_team, away_team, result) VALUES (?, ?, ?)");
    
    foreach ($csv_data as $row) {
        $stmt->bind_param("sss", $row[0], $row[1], $row[2]);
        if (!$stmt->execute()) {
            echo json_encode(["error" => "Error: " . $stmt->error]);
        }
    }

    $stmt->close();
}

// Adatok lekérdezése
function getMatches($conn) {
    $sql = "SELECT * FROM matches";
    $result = $conn->query($sql);
    $matches = array();

    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $matches[] = $row;
        }
    }

    echo json_encode($matches);
}

// Adatok beszúrása
function insertFeedback($conn, $data) {
    $stmt = $conn->prepare("INSERT INTO prediction_feedback (home_team, away_team, feedback) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $data['homeTeam'], $data['awayTeam'], $data['feedback']);

    if ($stmt->execute()) {
        echo json_encode(["message" => "Feedback recorded successfully"]);
    } else {
        echo json_encode(["error" => "Error recording feedback"]);
    }

    $stmt->close();
}

// Fő program
$conn = createConnection();
createTable($conn);

// CSV fájl betöltése
$csv_url = 'https://www.winmix.hu/matches.csv';
loadCsvData($conn, $csv_url);

// HTTP metódusok kezelése
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    getMatches($conn);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['homeTeam'], $data['awayTeam'], $data['feedback'])) {
        insertFeedback($conn, $data);
    } else {
        echo json_encode(["error" => "Invalid data received"]);
    }
}

$conn->close();
?>
