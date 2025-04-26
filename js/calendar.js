let calendarMatchData = [];
let calendarTeams = [];
let calendarStadiums = [];
let calendarScores = [];

document.addEventListener("DOMContentLoaded", function () {
  loadCalendarData();
});

function loadCalendarData() {
  fetch("./db.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok: " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      calendarMatchData = data.matches;
      calendarTeams = data.teams;
      calendarStadiums = data.stadiums;
      calendarScores = data.scores;

      console.log("Calendar: 成功加载数据", {
        matches: calendarMatchData.length,
        teams: calendarTeams.length,
      });

      displayUpcomingMatches();
      displayRecentMatches();
    })
    .catch((error) => {
      console.error("Error loading data from db.json:", error);

      const matchCalendar = document.getElementById("match-calendar");
      if (matchCalendar) {
        matchCalendar.innerHTML = `<div class="col-12 text-center text-danger">Failed to load match data. Please try again later.</div>`;
      }

      const recentMatchesList = document.getElementById("recent-matches-list");
      if (recentMatchesList) {
        recentMatchesList.innerHTML = `<div class="text-center text-danger">Failed to load recent match data. Please try again later.</div>`;
      }
    });
}

// Display upcoming matches in the calendar
function displayUpcomingMatches() {
  const matchCalendar = document.getElementById("match-calendar");
  if (!matchCalendar) return;

  matchCalendar.innerHTML = "";

  // Filter for upcoming matches (status 0)
  const upcomingMatches = calendarMatchData.filter(
    (match) => match.status === 0
  );

  if (upcomingMatches.length === 0) {
    matchCalendar.innerHTML = `<div class="col-12 text-center">No upcoming matches scheduled at this time.</div>`;
    return;
  }

  upcomingMatches.sort(
    (a, b) => new Date(a.match_date) - new Date(b.match_date)
  );

  // Only show the next 4 upcoming matches
  const nextMatches = upcomingMatches.slice(0, 4);

  // Create match cards
  nextMatches.forEach((match) => {
    const team1 = calendarTeams.find((team) => team.id === match.team1_id);
    const team2 = calendarTeams.find((team) => team.id === match.team2_id);
    const stadium = calendarStadiums.find(
      (stadium) => stadium.id === match.stadium_id
    );
    const matchDate = new Date(match.match_date);

    const matchCard = document.createElement("div");
    matchCard.className = "col-md-6 col-lg-3 mb-4";
    matchCard.innerHTML = `
      <div class="card match-card h-100">
        <div class="card-header bg-primary text-white">
          <h5 class="card-title mb-0">${formatDate(matchDate)}</h5>
        </div>
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="text-center">
              <h6>${team1.name}</h6>
            </div>
            <div class="vs">VS</div>
            <div class="text-center">
              <h6>${team2.name}</h6>
            </div>
          </div>
          <div class="text-center mt-3">
            <small class="text-muted">
              <i class="fas fa-map-marker-alt me-1"></i> ${stadium.name}
            </small>
          </div>
        </div>
      </div>
    `;

    matchCalendar.appendChild(matchCard);
  });
}

// Display recent match results
function displayRecentMatches() {
  const recentMatchesList = document.getElementById("recent-matches-list");
  if (!recentMatchesList) return;

  recentMatchesList.innerHTML = "";

  // Filter for completed matches (status 2)
  const completedMatches = calendarMatchData.filter(
    (match) => match.status === 2
  );

  if (completedMatches.length === 0) {
    recentMatchesList.innerHTML = `<div class="text-center">No recent match results available.</div>`;
    return;
  }

  // Sort by date (most recent first)
  completedMatches.sort(
    (a, b) => new Date(b.match_date) - new Date(a.match_date)
  );

  // Only show the 3 most recent matches
  const recentMatches = completedMatches.slice(0, 3);

  if (!calendarScores || !Array.isArray(calendarScores)) {
    console.error("Scores data is not available or not an array");
    calendarScores = [];
  }

  const matchesContainer = document.createElement("div");
  matchesContainer.className = "match-results-container border rounded";

  const header = document.createElement("div");
  header.className = "match-header bg-secondary text-white p-3";
  header.innerHTML = `<h2>Recent Match Results</h2>`;
  matchesContainer.appendChild(header);

  recentMatches.forEach((match, index) => {
    const team1 = calendarTeams.find((team) => team.id === match.team1_id);
    const team2 = calendarTeams.find((team) => team.id === match.team2_id);
    const matchDate = new Date(match.match_date);
    const matchScore = calendarScores.find(
      (score) => score.match_id === match.id
    );

    const team1Wins =
      matchScore && matchScore.team1_score > matchScore.team2_score;
    const team2Wins =
      matchScore && matchScore.team2_score > matchScore.team1_score;

    const matchItem = document.createElement("div");
    matchItem.className = "match-item p-3";
    if (index < recentMatches.length - 1) {
      matchItem.className += " border-bottom";
    }

    matchItem.innerHTML = `
      <div class="d-flex justify-content-between align-items-center mb-2">
        <div class="match-score-display">
          <span class="score-text ${
            team1Wins ? "text-success" : "text-danger"
          } fw-bold">${matchScore?.team1_score || "0"}</span>
          <span class="team-name mx-2">${team1.name}</span>
          <span class="vs-text">vs</span>
          <span class="score-text ${
            team2Wins ? "text-success" : "text-danger"
          } fw-bold">${matchScore?.team2_score || "0"}</span>
          <span class="team-name mx-2">${team2.name}</span>

        </div>
        <button onclick="alert('match id: ${
          match.id
        }')" class="btn btn-outline-primary btn-sm detail-btn">
          <i class="fas fa-eye"></i> Details
        </button>
      </div>
      <div class="match-date">
        <i class="far fa-calendar-alt me-2"></i>${formatDate(matchDate)}
      </div>
    `;

    matchesContainer.appendChild(matchItem);
  });

  recentMatchesList.appendChild(matchesContainer);
}

// Helper function to format date
function formatDate(date) {
  const options = {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return date.toLocaleDateString("en-US", options);
}
