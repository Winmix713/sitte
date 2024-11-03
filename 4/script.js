let historicalData = [];
const teamNames = [
    "Vörös Ördögök", "Chelsea", "Liverpool", "Manchester Kék", "Everton",
    "Brentford", "Crystal Palace", "Fulham", "Wolverhampton", "London Ágyúk",
    "Brighton", "Nottingham", "Tottenham", "Newcastle", "West Ham", "Aston Oroszlán"
];

document.addEventListener('DOMContentLoaded', function() {
    loadHistoricalData();
    initializeMatchupInputs();
    document.getElementById('addMatchup').addEventListener('click', addMatchupInput);
    document.getElementById('runPredictions').addEventListener('click', runPredictions);
});

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
        
        document.getElementById('modelInfo').textContent = 'Adatok betöltve, a rendszer készen áll a predikciókra!';
        document.getElementById('modelInfo').classList.remove('hidden');
    } catch (error) {
        console.error('Hiba történt az adatok betöltése során:', error);
        document.getElementById('modelInfo').textContent = 'Hiba történt az adatok betöltése során. Kérjük, próbálja újra később.';
        document.getElementById('modelInfo').classList.remove('hidden');
    }
}

function initializeMatchupInputs() {
    const matchupInputs = document.getElementById('matchupInputs');
    addMatchupInput();
}

function addMatchupInput() {
    const matchupInputs = document.getElementById('matchupInputs');
    const newMatchup = document.createElement('div');
    newMatchup.className = 'matchup flex space-x-2 mb-2';
    newMatchup.innerHTML = `
        <select class="home-team w-1/3 p-2 border rounded">
            ${teamNames.map(team => `<option value="${team}">${team}</option>`).join('')}
        </select>
        <select class="away-team w-1/3 p-2 border rounded">
            ${teamNames.map(team => `<option value="${team}">${team}</option>`).join('')}
        </select>
        <button class="remove-matchup w-1/3 bg-red-500 text-white p-2 rounded">Törlés</button>
    `;
    newMatchup.querySelector('.remove-matchup').addEventListener('click', function() {
        matchupInputs.removeChild(newMatchup);
    });
    matchupInputs.appendChild(newMatchup);
}

function runPredictions() {
    const matchups = Array.from(document.querySelectorAll('.matchup')).map(matchup => ({
        homeTeam: matchup.querySelector('.home-team').value,
        awayTeam: matchup.querySelector('.away-team').value
    }));

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
    const bothTeamsScoredProb = bothTeamsScored / totalMatches;

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

    const avgHomeGoals = homeGoals / totalMatches;
    const avgAwayGoals = awayGoals / totalMatches;
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

function getDefaultPrediction(match) {
    return {
        match,
        bothTeamsScoredProb: 0.5,
        avgHomeGoals: 1.5,
        avgAwayGoals: 1.5,
        homeWins: 0,
        awayWins: 0,
        draws: 0,
        explanation: `
            Nincs elegendő korábbi mérkőzés adat a pontos előrejelzéshez.
            Az átlagos értékeket használtuk az előrejelzéshez.
        `
    };
}

function displayPredictions(predictions) {
    const predictionsContainer = document.getElementById('predictions');
    predictionsContainer.innerHTML = '';

    predictions.forEach(prediction => {
        const predictionElement = document.createElement('div');
        predictionElement.className = 'bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4';
        predictionElement.innerHTML = `
            <h3 class="text-lg font-bold mb-2">${prediction.match.homeTeam} vs ${prediction.match.awayTeam}</h3>
            <p>Mindkét csapat gólszerzési valószínűsége: ${(prediction.bothTeamsScoredProb * 100).toFixed(2)}%</p>
            <p>Átlagos hazai gólok: ${prediction.avgHomeGoals.toFixed(2)}</p>
            <p>Átlagos vendég gólok: ${prediction.avgAwayGoals.toFixed(2)}</p>
            <p>Hazai győzelmek: ${prediction.homeWins}</p>
            <p>Vendég győzelmek: ${prediction.awayWins}</p>
            <p>Döntetlenek: ${prediction.draws}</p>
            <p class="mt-2"><strong>Magyarázat:</strong> ${prediction.explanation}</p>
        `;
        predictionsContainer.appendChild(predictionElement);
    });
}