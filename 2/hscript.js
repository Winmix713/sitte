async function fetchData() {
  const response = await fetch('https://winmix.hu/api/combined_matches_api.php');
  const data = await response.json();
  return data.matches;
}

async function compareTeams() {
  const team1 = document.getElementById('team1').value;
  const team2 = document.getElementById('team2').value;
  const matches = await fetchData();

  const h2hMatches = matches.filter(match =>
    (match.home_team === team1 && match.away_team === team2) ||
    (match.home_team === team2 && match.away_team === team1)
  );

  let comparisonHTML = `
    <h2>${team1} vs ${team2}</h2>
    <h3>Egymás elleni mérkőzések</h3>
  `;

  if (h2hMatches.length === 0) {
    comparisonHTML += '<p>Nincs találat a két csapat közötti mérkőzésekre.</p>';
  } else {
    comparisonHTML += `
      <table>
        <tr>
          <th>Hazai</th>
          <th>Eredmény</th>
          <th>Vendég</th>
        </tr>
    `;
    h2hMatches.forEach(match => {
      comparisonHTML += `
        <tr>
          <td>${match.home_team}</td>
          <td>${match.score.home} - ${match.score.away}</td>
          <td>${match.away_team}</td>
        </tr>
      `;
    });
    comparisonHTML += '</table>';
  }

  document.getElementById('comparison').innerHTML = comparisonHTML;
}