let historicalData = [];

async function loadHistoricalData() {
    try {
        const response = await fetch('https://winmix.hu/api/combined_matches_api.php');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        historicalData = data.matches;
        initializeSystem();
    } catch (error) {
        console.error('Hiba történt az adatok betöltése során:', error);
        document.getElementById('modelInfo').innerHTML = '<p class="text-red-500">Hiba történt az adatok betöltése során. Kérjük, próbálja újra később.</p>';
        document.getElementById('modelInfo').classList.remove('hidden');
    }
}

function processMatchups() {
    const input = document.getElementById('matchupsInput').value;
    let matchups;
    try {
        matchups = JSON.parse(input);
    } catch (error) {
        alert('Hiba: érvénytelen JSON bemenet. Kérjük, ellenőrizze a bemenetet és próbálja újra.');
        return;
    }

    const predictions = matchups.map(match => predictMatch(match));
    displayPredictions(predictions);
}

function predictMatch(match) {
    const relevantMatches = historicalData.filter(
        m => (m.home_team === match.homeTeam && m.away_team === match.awayTeam) ||
             (m.home_team === match.awayTeam && m.away_team === match.homeTeam)
    );

    const totalMatches = relevantMatches.length;
    const bothTeamsScored = relevantMatches.filter(m => m.both_teams_scored).length;

    const bothTeamsScoredProb = totalMatches > 0 ? bothTeamsScored / totalMatches : 0;

    const { homeGoals, awayGoals, homeWins, awayWins } = relevantMatches.reduce((acc, m) => {
        const isHomeTeam = m.home_team === match.homeTeam;
        
        acc.homeGoals += isHomeTeam ? m.score.home : m.score.away;
        acc.awayGoals += isHomeTeam ? m.score.away : m.score.home;
        
        if (m.score.home > m.score.away) {
            isHomeTeam ? acc.homeWins++ : acc.awayWins++;
        } else if (m.score.away > m.score.home) {
            isHomeTeam ? acc.awayWins++ : acc.homeWins++;
        }
        
        return acc;
    }, { homeGoals: 0, awayGoals: 0, homeWins: 0, awayWins: 0 });

    const avgHomeGoals = totalMatches > 0 ? homeGoals / totalMatches : 0;
    const avgAwayGoals = totalMatches > 0 ? awayGoals / totalMatches : 0;
    const draws = totalMatches - homeWins - awayWins;

    return {
        match,
        bothTeamsScoredProb,
        avgHomeGoals,
        avgAwayGoals,
        homeWins,
        awayWins,
        draws,
        explanation: `
            A számítások ${totalMatches} korábbi mérkőzés alapján készültek.
            Mindkét csapat ${bothTeamsScored} alkalommal szerzett gólt (${(bothTeamsScoredProb * 100).toFixed(2)}%).
            A hazai csapat átlagosan ${avgHomeGoals.toFixed(2)} gólt szerzett, míg a vendég csapat ${avgAwayGoals.toFixed(2)}-t.
            A hazai csapat ${homeWins} alkalommal nyert, a vendég csapat ${awayWins} alkalommal, és ${draws} döntetlen volt.
        `
    };
}

function displayPredictions(predictions) {
    const predictionsDiv = document.getElementById('predictions');
    const topPredictionsContent = document.getElementById('topPredictionsContent');
    predictionsDiv.innerHTML = '<h2 class="text-2xl font-bold mb-4 text-gray-800">Összes Előrejelzés</h2>';
    topPredictionsContent.innerHTML = '';

    predictions.sort((a, b) => b.bothTeamsScoredProb - a.bothTeamsScoredProb);

    predictions.slice(0, 4).forEach(prediction => {
        const matchDiv = createMatchPredictionDiv(prediction);
        topPredictionsContent.appendChild(matchDiv);
    });

    predictions.forEach(prediction => {
        const matchDiv = createMatchPredictionDiv(prediction);
        predictionsDiv.appendChild(matchDiv);
    });
}

function createMatchPredictionDiv(prediction) {
    const matchDiv = document.createElement('div');
    matchDiv.className = 'result-box bg-white p-4 rounded-lg shadow';

    matchDiv.innerHTML = `
        <h3 class="text-lg font-semibold mb-2">${prediction.match.homeTeam} vs ${prediction.match.awayTeam}</h3>
        <p class="text-sm text-gray-600">${prediction.explanation}</p>
    `;
    return matchDiv;
}

function initializeSystem() {
    const modelInfo = document.getElementById('modelInfo');
    modelInfo.innerHTML = '<p>A rendszer készen áll a predikciókra!</p>';
    modelInfo.classList.remove('hidden');
}

// Utility Functions
function selectAllText() {
    document.getElementById('matchupsInput').select();
}

function copyText() {
    const textarea = document.getElementById('matchupsInput');
    textarea.select();
    document.execCommand('copy');
}

async function pasteText() {
    try {
        const text = await navigator.clipboard.readText();
        document.getElementById('matchupsInput').value = text;
    } catch (err) {
        console.error('Nem sikerült beolvasni a vágólap tartalmát:', err);
    }
}

function clearText() {
    document.getElementById('matchupsInput').value = '';
}

// Initialize System and Load Data
window.onload = function() {
    loadHistoricalData();
    document.getElementById('matchupsInput').value = JSON.stringify([
        { "homeTeam": "Manchester Kék", "awayTeam": "Brighton" },
        { "homeTeam": "Tottenham", "awayTeam": "Brentford" },
        { "homeTeam": "Wolverhampton", "awayTeam": "Liverpool" }
    ], null, 2);
};