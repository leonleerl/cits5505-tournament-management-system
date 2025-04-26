let teams = [];
let players = [];
let users = [];
let seasons = [];
let stadiums = [];
let matches = [];
let scores = [];

document.addEventListener("DOMContentLoaded", function () {
  loadData();
});

function loadData() {
  fetch("./db.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response error: " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      teams = data.teams || [];
      players = data.players || [];
      users = data.users || [];
      seasons = data.seasons || [];
      stadiums = data.stadiums || [];
      matches = data.matches || [];
      scores = data.scores || [];

      populateTeamsTable();
    })
    .catch((error) => {
      console.error("Error loading data:", error);
    });
}

function populateTeamsTable() {
  const teamsTableBody = document.getElementById("teamsTableBody");
  if (!teamsTableBody) return;

  teamsTableBody.innerHTML = "";

  teams.forEach((team) => {
    const row = document.createElement("tr");
    row.dataset.id = team.id;
    row.innerHTML = `
      <td>${team.id}</td>
      <td>${team.name}</td>
      <td>${team.description || ""}</td>
      <td>${team.createdYear}</td>
      <td>
        <button class="btn btn-sm btn-primary me-1" data-bs-toggle="tooltip" title="Edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger" data-bs-toggle="tooltip" title="Delete" data-type="teams" data-id="${
          team.id
        }">
          <i class="fas fa-trash"></i>
        </button>
      </td>
    `;

    teamsTableBody.appendChild(row);
  });
}
