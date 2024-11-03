<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

$servername = "mysql.rackhost.hu";
$username = "c694347cdsoxru";
$password = "VvJLxHhKG7Fk";
$dbname = "c694347cdsoxru";

$conn = new mysqli($servername, $username, $password, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql =   "SELECT home_team, away_team, " .
            "SUBSTRING_INDEX(result, ':', 1) AS home_score, " .
            "SUBSTRING_INDEX(result, ':', -1) AS away_score " .
            "FROM proba_matches";
    $result = $conn->query($sql);

    $matches = array();
    if ($result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            $matches[] = $row;
        }
    }

    echo json_encode($matches);
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($data['homeTeam'], $data['awayTeam'], $data['feedback'])) {
        $stmt = $conn->prepare("INSERT INTO prediction_feedback (home_team, away_team, feedback) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $data['homeTeam'], $data['awayTeam'], $data['feedback']);
        
        if ($stmt->execute()) {
            echo json_encode(["message" => "Feedback recorded successfully"]);
        } else {
            echo json_encode(["error" => "Error recording feedback"]);
        }
        
        $stmt->close();
    } else {
        echo json_encode(["error" => "Invalid data received"]);
    }
}

$conn->close();
?>