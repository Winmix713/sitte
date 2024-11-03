import React, { useState, useEffect } from 'react';
import './App.css';

const teamNames = [
  "Vörös Ördögök", "Chelsea", "Liverpool", "Manchester Kék", "Everton",
  "Brentford", "Crystal Palace", "Fulham", "Wolverhampton", "London Ágyúk",
  "Brighton", "Nottingham", "Tottenham", "Newcastle", "West Ham", "Aston Oroszlán"
];

function App() {
  const [historicalData, setHistoricalData] = useState([]);
  const [matchups, setMatchups] = useState([{ homeTeam: '', awayTeam: '' }]);
  const [predictions, setPredictions] = useState([]);
  const [modelInfo, setModelInfo] = useState('');

  useEffect(() => {
    loadHistoricalData();
  }, []);

  async function loadHistoricalData() {
    try {
      const response = await fetch('https://winmix.hu/api/combined_matches_api.php');
      const data = await response.json();
      
      setHistoricalData(data.matches.map(match => ({
        home_team: match.home_team,
        away_team: match.away_team,
        score: match.score,
        both_teams_scored: match.both_teams_scored
      })));
      
      setModelInfo('Adatok betöltve, a rendszer készen áll a predikciókra!');
    } catch (error) {
      console.error('Hiba történt az adatok betöltése során:', error);
      setModelInfo('Hiba történt az adatok betöltése során. Kérjük, próbálja újra később.');
    }
  }

  function addMatchupInput() {
    setMatchups([...matchups, { homeTeam: '', awayTeam: '' }]);
  }

  function updateMatchup(index, team, value) {
    const newMatchups = [...matchups];
    newMatchups[index][team] = value;
    setMatchups(newMatchups);
  }

  function runPredictions() {
    const validMatchups = matchups.filter(m => m.homeTeam && m.awayTeam);
    if (validMatchups.length === 0) {
      alert('Kérjük, adjon meg legalább egy érvényes mérkőzést!');
      return;
    }

    const newPredictions = validMatchups.map(predictMatch);
    setPredictions(newPredictions);
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

  function handleFeedback(prediction, isGood) {
    console.log(`Feedback for ${prediction.match.homeTeam} vs ${prediction.match.awayTeam}: ${isGood ? 'Good' : 'Bad'}`);
    alert(isGood ? 'Köszönjük a pozitív visszajelzést!' : 'Köszönjük a visszajelzést, igyekszünk javítani az előrejelzéseinken.');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-gray-800">Professzionális Foci Előrejelző Rendszer</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Mérkőzések megadása</h2>
        <div id="matchupInputs" className="grid gap-4 mb-4">
          {matchups.map((matchup, index) => (
            <div key={index} className="grid grid-cols-2 gap-2">
              <select 
                className="home-team border rounded p-2"
                value={matchup.homeTeam}
                onChange={(e) => updateMatchup(index, 'homeTeam', e.target.value)}
              >
                <option value="">Válassz hazai csapatot</option>
                {teamNames.map(team => <option key={team} value={team}>{team}</option>)}
              </select>
              <select 
                className="away-team border rounded p-2"
                value={matchup.awayTeam}
                onChange={(e) => updateMatchup(index, 'awayTeam', e.target.value)}
              >
                <option value="">Válassz vendég csapatot</option>
                {teamNames.map(team => <option key={team} value={team}>{team}</option>)}
              </select>
            </div>
          ))}
        </div>
        <button onClick={addMatchupInput} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-300 mb-4">+ Új mérkőzés</button>
        <button onClick={runPredictions} className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition duration-300">Előrejelzések futtatása</button>
      </div>

      {modelInfo && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-8 rounded-md">
          {modelInfo}
        </div>
      )}

      {predictions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Top 4 Mérkőzés</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predictions.slice(0, 4).map((prediction, index) => (
              <PredictionCard key={index} prediction={prediction} handleFeedback={handleFeedback} />
            ))}
          </div>
        </div>
      )}

      {predictions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictions.map((prediction, index) => (
            <PredictionCard key={index} prediction={prediction} handleFeedback={handleFeedback} />
          ))}
        </div>
      )}
    </div>
  );
}

function PredictionCard({ prediction, handleFeedback }) {
  const totalMatches = prediction.homeWins + prediction.awayWins + prediction.draws;
  const homeWinPercentage = (prediction.homeWins / totalMatches) * 100;
  const awayWinPercentage = (prediction.awayWins / totalMatches) * 100;

  return (
    <div className="prediction-card bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <img src={getTeamLogo(prediction.match.homeTeam)} alt={prediction.match.homeTeam} className="team-logo mr-2" />
          <span className="font-semibold">{prediction.match.homeTeam}</span>
        </div>
        <span className="text-lg font-bold">vs</span>
        <div className="flex items-center">
          <span className="font-semibold">{prediction.match.awayTeam}</span>
          <img src={getTeamLogo(prediction.match.awayTeam)} alt={prediction.match.awayTeam} className="team-logo ml-2" />
        </div>
      </div>
      <div className="mb-4">
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                {prediction.match.homeTeam}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-blue-600">
                {homeWinPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
            <div style={{ width: `${homeWinPercentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
          </div>
        </div>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-red-600 bg-red-200">
                {prediction.match.awayTeam}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-red-600">
                {awayWinPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-red-200">
            <div style={{ width: `${awayWinPercentage}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-red-500"></div>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600">{prediction.explanation}</p>
      <div className="mt-4">
        <button onClick={() => handleFeedback(prediction, true)} className="good-prediction bg-green-500 text-white px-2 py-1 rounded mr-2 hover:bg-green-600 transition duration-300">Jó tipp</button>
        <button onClick={() => handleFeedback(prediction, false)} className="bad-prediction bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition duration-300">Rossz tipp</button>
      </div>
    </div>
  );
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

export default App;