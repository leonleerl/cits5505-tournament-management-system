let teams = [];
let players = [];
let users = [];
let seasons = [];
let stadiums = [];
let matches = [];
let scores = [];

document.addEventListener("DOMContentLoaded", function () {
  loadData();

  // Season filter change handler
  const seasonSelect = document.getElementById("season-select");
  if (seasonSelect) {
    seasonSelect.addEventListener("change", function () {
      initLeaderboard(this.value);
    });
  }
});

// Load data from db.json
function loadData() {
  fetch("../db.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok: " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      // Store data in variables
      teams = data.teams;
      players = data.players;
      users = data.users;
      seasons = data.seasons;
      stadiums = data.stadiums;
      matches = data.matches;
      scores = data.scores;

      // Initialize the leaderboard after data is loaded
      initLeaderboard();
    })
    .catch((error) => {
      console.error("Error loading data from db.json:", error);
      const leaderboardBody = document.getElementById("leaderboard-body");
      if (leaderboardBody) {
        leaderboardBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Failed to load data. Please try again later.</td></tr>`;
      }
    });
}

// Initialize the leaderboard with team stats
function initLeaderboard(seasonFilter = "all") {
  const leaderboardBody = document.getElementById("leaderboard-body");
  if (!leaderboardBody || !teams.length) return;

  leaderboardBody.innerHTML = "";

  const sortedTeams = [...teams].sort((a, b) => {
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    return b.points - a.points;
  });

  sortedTeams.forEach((team, index) => {
    const winPercentage = (
      (team.wins / (team.wins + team.losses)) *
      100
    ).toFixed(1);

    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${index + 1}</td>
        <td>${team.name}</td>
        <td>${team.wins}</td>
        <td>${team.losses}</td>
        <td>${winPercentage}%</td>
        <td>${team.points}</td>
      `;

    leaderboardBody.appendChild(row);
  });
}
