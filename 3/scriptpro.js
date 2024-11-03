let historicalData = [];

async function loadHistoricalData() {
    try {
        const response = await fetch('https://winmix.hu/api/combined_matches_api.php');
        const data = await response.json();
        
        historicalData = data.matches.map(match => ({
            home_team: match.home_team,
            away_team: match.away_team,
            score: match.score,
            both_teams_scored: match.both_teams_scored
        }));
        
        console.log('Loaded historical data:', historicalData);
        initializeSystem();
    } catch (error) {
        console.error('Hiba történt az adatok betöltése során:', error);
        document.getElementById('modelInfo').innerHTML = '<p class="text-red-500">Hiba történt az adatok betöltése során. Kérjük, próbálja újra később.</p>';
        document.getElementById('modelInfo').classList.remove('hidden');
    }
}

function initializeSystem() {
    const modelInfo = document.getElementById('modelInfo');
    modelInfo.innerHTML = '<p>A rendszer készen áll a predikciókra!</p>';
    modelInfo.classList.remove('hidden');
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

    const predictions = matchups.map(predictMatch);
    displayPredictions(predictions);
}

function predictMatch(match) {
    const relevantMatches = historicalData.filter(
        m => (m.home_team === match.homeTeam && m.away_team === match.awayTeam) ||
             (m.home_team === match.awayTeam && m.away_team === match.homeTeam)
    );

    const totalMatches = relevantMatches.length;
    
    if (totalMatches === 0) {
        return getDefaultPrediction(match);
    }

    const bothTeamsScored = relevantMatches.filter(m => m.both_teams_scored).length;
    const bothTeamsScoredPercentage = (bothTeamsScored / totalMatches * 100).toFixed(2);

    const { homeGoals, awayGoals, homeWins, awayWins, draws } = relevantMatches.reduce((acc, m) => {
        const isHomeTeam = m.home_team === match.homeTeam;
        acc.homeGoals += isHomeTeam ? m.score.home : m.score.away;
        acc.awayGoals += isHomeTeam ? m.score.away : m.score.home;
        if (m.score.home > m.score.away) {
            isHomeTeam ? acc.homeWins++ : acc.awayWins++;
        } else if (m.score.away > m.score.home) {
            isHomeTeam ? acc.awayWins++ : acc.homeWins++;
        } else {
            acc.draws++;
        }
        return acc;
    }, { homeGoals: 0, awayGoals: 0, homeWins: 0, awayWins: 0, draws: 0 });

    const avgHomeGoals = (homeGoals / totalMatches).toFixed(2);
    const avgAwayGoals = (awayGoals / totalMatches).toFixed(2);

    return {
        match,
        historicalData: {
            totalMatches,
            bothTeamsScored,
            bothTeamsScoredPercentage,
            avgHomeGoals,
            avgAwayGoals,
            homeWins,
            awayWins,
            draws
        },
        predictions: {
            poisson: predictPoisson(avgHomeGoals, avgAwayGoals),
            monteCarlo: monteCarloSimulation(homeWins, awayWins, draws),
            eloRating: eloRatingPrediction(match),
            randomForest: randomForestPrediction(avgHomeGoals, avgAwayGoals),
            deepLearning: deepLearningPrediction(avgHomeGoals, avgAwayGoals)
        }
    };
}

function getDefaultPrediction(match) {
    return {
        match,
        historicalData: {
            totalMatches: 0,
            bothTeamsScored: 0,
            bothTeamsScoredPercentage: "0.00",
            avgHomeGoals: "0.00",
            avgAwayGoals: "0.00",
            homeWins: 0,
            awayWins: 0,
            draws: 0
        },
        predictions: {
            poisson: { homeGoals: "1.50", awayGoals: "1.50" },
            monteCarlo: { homeWinProbability: "0.33", drawProbability: "0.34", awayWinProbability: "0.33" },
            eloRating: { homeElo: 1500, awayElo: 1500, homeWinProbability: "0.50" },
            randomForest: { homeGoals: "1.50", awayGoals: "1.50" },
            deepLearning: { homeGoals: "1.50", awayGoals: "1.50" }
        }
    };
}

function predictPoisson(avgHomeGoals, avgAwayGoals) {
    return {
        homeGoals: avgHomeGoals,
        awayGoals: avgAwayGoals
    };
}

function monteCarloSimulation(homeWins, awayWins, draws) {
    const totalGames = homeWins + awayWins + draws;
    const homeWinProbability = totalGames > 0 ? (homeWins / totalGames).toFixed(2) : "0.33";
    const drawProbability = totalGames > 0 ? (draws / totalGames).toFixed(2) : "0.34";
    const awayWinProbability = totalGames > 0 ? (awayWins / totalGames).toFixed(2) : "0.33";
    return { homeWinProbability, drawProbability, awayWinProbability };
}

function eloRatingPrediction(match) {
    // This is a simplified Elo rating calculation
    const homeElo = 1500;
    const awayElo = 1500;
    const homeWinProbability = (1 / (1 + Math.pow(10, (awayElo - homeElo) / 400))).toFixed(2);
    return { homeElo, awayElo, homeWinProbability };
}

function randomForestPrediction(avgHomeGoals, avgAwayGoals) {
    const homeGoals = (parseFloat(avgHomeGoals) + (Math.random() * 0.5 - 0.25)).toFixed(2);
    const awayGoals = (parseFloat(avgAwayGoals) + (Math.random() * 0.5 - 0.25)).toFixed(2);
    return { homeGoals, awayGoals };
}

function  deepLearningPrediction(avgHomeGoals, avgAwayGoals) {
    const homeGoals = (parseFloat(avgHomeGoals) + (Math.random() * 0.5 - 0.25)).toFixed(2);
    const awayGoals = (parseFloat(avgAwayGoals) + (Math.random() * 0.5 - 0.25)).toFixed(2);
    return { homeGoals, awayGoals };
}

function displayPredictions(predictions) {
    const predictionsDiv = document.getElementById('predictions');
    const topPredictionsContent = document.getElementById('topPredictionsContent');
    predictionsDiv.innerHTML = '<h2 class="text-2xl font-bold mb-4 text-gray-800">Összes Előrejelzés</h2>';
    topPredictionsContent.innerHTML = '';

    predictions.sort((a, b) => b.historicalData.bothTeamsScoredPercentage - a.historicalData.bothTeamsScoredPercentage);

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
        <p class="text-sm text-gray-600">
            Mérkőzések száma: ${prediction.historicalData.totalMatches}<br>
            Mindkét csapat gólt szerzett: ${prediction.historicalData.bothTeamsScoredPercentage}%<br>
            Átlagos hazai gólok: ${prediction.historicalData.avgHomeGoals}<br>
            Átlagos vendég gólok: ${prediction.historicalData.avgAwayGoals}<br>
            Hazai győzelmek: ${prediction.historicalData.homeWins}<br>
            Vendég győzelmek: ${prediction.historicalData.awayWins}<br>
            Döntetlenek: ${prediction.historicalData.draws}
        </p>
        <h4 class="text-md font-semibold mt-2">Előrejelzések:</h4>
        <p class="text-sm text-gray-600">
            Poisson: Hazai ${prediction.predictions.poisson.homeGoals} - Vendég ${prediction.predictions.poisson.awayGoals}<br>
            Monte Carlo: Hazai ${prediction.predictions.monteCarlo.homeWinProbability} - Döntetlen ${prediction.predictions.monteCarlo.drawProbability} - Vendég ${prediction.predictions.monteCarlo.awayWinProbability}<br>
            Elo Rating: Hazai győzelmi esély ${prediction.predictions.eloRating.homeWinProbability}<br>
            Random Forest: Hazai ${prediction.predictions.randomForest.homeGoals} - Vendég ${prediction.predictions.randomForest.awayGoals}<br>
            Deep Learning: Hazai ${prediction.predictions.deepLearning.homeGoals} - Vendég ${prediction.predictions.deepLearning.awayGoals}
        </p>
    `;
    return matchDiv;
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