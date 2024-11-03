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

// A többi függvény változatlan marad

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
    const topPredictionsContent = document.getElementById('topPredictionsContent');
    const allPredictions = document.getElementById('allPredictions');
    topPredictionsContent.innerHTML = '';
    allPredictions.innerHTML = '';

    predictions.sort((a, b) => b.bothTeamsScoredProb - a.bothTeamsScoredProb);

    predictions.slice(0, 4).forEach(prediction => {
        const predictionCard = createPredictionCard(prediction);
        topPredictionsContent.appendChild(predictionCard);
    });

    predictions.forEach(prediction => {
        const predictionCard = createPredictionCard(prediction);
        allPredictions.appendChild(predictionCard);
    });

    document.getElementById('topPredictions').classList.remove('hidden');
}

function createPredictionCard(prediction) {
    const card = document.createElement('div');
    card.className = 'prediction-card bg-white rounded-lg shadow-md p-4';
    
    const totalMatches = prediction.homeWins + prediction.awayWins + prediction.draws;
    const homeWinPercentage = (prediction.homeWins / totalMatches) * 100;
    const awayWinPercentage = (prediction.awayWins / totalMatches) * 100;

    card.innerHTML = `
        <div class="flex justify-between items-center mb-4">
            <div class="flex items-center">
                <img src="${getTeamLogo(prediction.match.homeTeam)}" alt="${prediction.match.homeTeam}" class="team-logo mr-2">
                <span class="font-semibold">${prediction.match.homeTeam}</span>
            </div>
            <span class="text-lg font-bold">vs</span>
            <div class="flex items-center">
                <span class="font-semibold">${prediction.match.awayTeam}</span>
                <img src="${getTeamLogo(prediction.match.awayTeam)}" alt="${prediction.match.awayTeam}" class="team-logo ml-2">
            </div>
        </div>
        <div class="mb-4">
            <div class="relative pt-1">
                <div class="flex mb-2 items-center justify-between">
                    <div>
                        <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                            ${prediction.match.homeTeam}
                        </span>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-semibold inline-block text-blue-600">
                            ${homeWinPercentage.toFixed(1)}%
                        </span>
                    </div>
                </div>
                <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                    <div style="width:${homeWinPercentage}%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                </div>
            </div>
            <div class="relative pt-1">
                <div class="flex mb-2 items-center justify-between">
                    <div>
                        <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">
                            ${prediction.match.awayTeam}
                        </span>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-semibold inline-block text-red-600">
                            ${awayWinPercentage.toFixed(1)}%
                        </span>
                    </div>
                </div>
                <div class="overflow-hidden h-2 mb-4 text-xs flex rounded bg-red-200">
                    <div style="width:${awayWinPercentage}%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"></div>
                </div>
            </div>
        </div>
        <p class="text-sm text-gray-600">${prediction.explanation}</p>
        <div class="mt-4">
            <button class="good-prediction bg-green-500 text-white px-2 py-1 rounded mr-2 hover:bg-green-600 transition duration-300">Jó tipp</button>
            <button class="bad-prediction bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition duration-300">Rossz  tipp</button>
        </div>
    `;

    card.querySelector('.good-prediction').addEventListener('click', () => handleFeedback(prediction, true));
    card.querySelector('.bad-prediction').addEventListener('click', () => handleFeedback(prediction, false));

    return card;
}

function getTeamLogo(teamName) {
    const logoMap = {
        "Vörös Ördögök": "https://resources.premierleague.com/premierleague/badges/50/t1.png",
        "Chelsea": "https://resources.premierleague.com/premierleague/badges/50/t8.png",
        "Liverpool": "https://resources.premierleague.com/premierleague/badges/50/t14.png",
        "Manchester Kék": "https://resources.premierleague.com/premierleague/badges/50/t43.png",
        "Everton": "https://resources.premierleague.com/premierleague/badges/50/t11.png",
        "Brentford": "https://resources.premierleague.com/premierleague/badges/50/t94.png",
        "Crystal Palace": "https://resources.premierleague.com/premierleague/badges/50/t31.png",
        "Fulham": "https://resources.premierleague.com/premierleague/badges/50/t54.png",
        "Wolverhampton": "https://resources.premierleague.com/premierleague/badges/50/t39.png",
        "London Ágyúk": "https://resources.premierleague.com/premierleague/badges/50/t3.png",
        "Brighton": "https://resources.premierleague.com/premierleague/badges/50/t36.png",
        "Nottingham": "https://resources.premierleague.com/premierleague/badges/50/t17.png",
        "Tottenham": "https://resources.premierleague.com/premierleague/badges/50/t6.png",
        "Newcastle": "https://resources.premierleague.com/premierleague/badges/50/t4.png", 
        "West Ham": "https://resources.premierleague.com/premierleague/badges/50/t21.png",
        "Aston Oroszlán": "https://resources.premierleague.com/premierleague/badges/50/t7.png"
    };
    return logoMap[teamName] || "placeholder.png"; 
}

function handleFeedback(prediction, isGood) {
    console.log(`Feedback for ${prediction.match.homeTeam} vs ${prediction.match.awayTeam}: ${isGood ? 'Good' : 'Bad'}`);
    // Itt küldhetnénk el a visszajelzést egy szervernek
    alert(isGood ? 'Köszönjük a pozitív visszajelzést!' : 'Köszönjük a visszajelzést, igyekszünk javítani az előrejelzéseinken.');
}