/**
 * visualise.js
 * 
 * Handles data loading and chart creation for the tournament visualisation page
 */

// Global chart instances to enable destroying/recreating
let charts = {
    teamStandings: null,
    pointsDistribution: null,
    topScorers: null,
    playerEfficiency: null,
    matchScoreTrends: null,
    playerStatComparison: null,
    doubleTripleLeaders: null
};

// Common chart options
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
        },
        tooltip: {
            mode: 'index',
            intersect: false,
        }
    }
};

// Colors for charts
const chartColors = [
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 99, 132, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)',
    'rgba(83, 102, 255, 0.7)',
    'rgba(40, 167, 69, 0.7)',
    'rgba(220, 53, 69, 0.7)'
];

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded. Initializing visualization page...");
    // Initialise the page
    initPage();
    
    // Handle filter form submission
    const filterForm = document.getElementById('vizFiltersForm');
    if (filterForm) {
        console.log("Filter form found, adding event listener");
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log("Filter form submitted");
            loadVisualisationData();
        });
    } else {
        console.error("Filter form not found in the DOM");
    }
    
    // Handle tournament selection change
    const tournamentSelect = document.getElementById('tournamentSelect');
    if (tournamentSelect) {
        console.log("Tournament select found, adding event listener");
        tournamentSelect.addEventListener('change', function() {
            console.log("Tournament selection changed to:", tournamentSelect.value);
            populateTeamDropdown();
            // Clear player dropdown
            const playerSelect = document.getElementById('playerSelect');
            while (playerSelect.options.length > 1) {
                playerSelect.remove(1);
            }
        });
    } else {
        console.error("Tournament select not found in the DOM");
    }
    
    // Handle team selection change
    const teamSelect = document.getElementById('teamSelect');
    if (teamSelect) {
        console.log("Team select found, adding event listener");
        teamSelect.addEventListener('change', function() {
            console.log("Team selection changed to:", teamSelect.value);
            populatePlayerDropdown();
        });
    } else {
        console.error("Team select not found in the DOM");
    }
    
    // Handle export to PDF
    const exportPDFBtn = document.getElementById('exportPDF');
    if (exportPDFBtn) {
        exportPDFBtn.addEventListener('click', exportToPDF);
    }
});

// Initialise the page
function initPage() {
    console.log("Initializing page");
    // Load initial data when the page loads
    const tournamentSelect = document.getElementById('tournamentSelect');
    if (tournamentSelect) {
        console.log("Tournament select has", tournamentSelect.options.length, "options");
        if (tournamentSelect.options.length > 1) {
            console.log("Loading initial visualization data");
            loadVisualisationData();
        } else {
            console.log("No tournaments available in dropdown");
        }
    } else {
        console.error("Tournament select not found during initialization");
    }
}

// Show loading spinner
function showLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'block';
        console.log("Loading spinner shown");
    } else {
        console.error("Loading spinner element not found");
    }
}

// Hide loading spinner
function hideLoading() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = 'none';
        console.log("Loading spinner hidden");
    }
}
const CURRENT_USER_ID = parseInt(document.body.dataset.userId);
// Populate team dropdown based on selected tournament
function populateTeamDropdown() {
    const tournamentId = document.getElementById('tournamentSelect').value;
    const teamSelect = document.getElementById('teamSelect');
    
    console.log("Populating team dropdown for tournament ID:", tournamentId);
    
    // Clear existing options except the first one
    while (teamSelect.options.length > 1) {
        teamSelect.remove(1);
    }
    
    if (tournamentId === 'all') {
        console.log("Tournament 'all' selected, skipping team fetch");
        return;
    }
    
    showLoading();
    
    // Fetch teams for the selected tournament
    const apiUrl = `/api/teams?tournament_id=${tournamentId}`;
    console.log("Fetching teams from:", apiUrl);
    
    fetch(apiUrl)
        .then(response => {
            console.log("Teams API response status:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(teams => {
            console.log("Received teams data:", teams);
            if (teams.length === 0) {
                console.log("No teams found for this tournament");
            }
            
            teams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.id;
                option.text = team.name;
                teamSelect.add(option);
            });
            
            console.log("Team dropdown populated with", teams.length, "teams");
            hideLoading();
        })
        .catch(error => {
            console.error('Error fetching teams:', error);
            hideLoading();
        });
}

// Populate player dropdown based on selected team
function populatePlayerDropdown() {
    const teamId = document.getElementById('teamSelect').value;
    const playerSelect = document.getElementById('playerSelect');
    
    console.log("Populating player dropdown for team ID:", teamId);
    
    // Clear existing options except the first one
    while (playerSelect.options.length > 1) {
        playerSelect.remove(1);
    }
    
    if (teamId === 'all') {
        console.log("Team 'all' selected, skipping player fetch");
        return;
    }
    
    showLoading();
    
    // Fetch players for the selected team
    const apiUrl = `/api/players?team_id=${teamId}`;
    console.log("Fetching players from:", apiUrl);
    
    fetch(apiUrl)
        .then(response => {
            console.log("Players API response status:", response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(players => {
            console.log("Received players data:", players);
            if (players.length === 0) {
                console.log("No players found for this team");
            }
            
            players.forEach(player => {
                const option = document.createElement('option');
                option.value = player.id;
                option.text = player.name;
                playerSelect.add(option);
            });
            
            console.log("Player dropdown populated with", players.length, "players");
            hideLoading();
        })
        .catch(error => {
            console.error('Error fetching players:', error);
            hideLoading();
        });
}

// Load visualisation data based on filters
function loadVisualisationData() {
    const tournamentId = document.getElementById('tournamentSelect').value;
    const teamId = document.getElementById('teamSelect').value;
    const playerId = document.getElementById('playerSelect').value;
    
    console.log("Loading visualization data with filters:", { tournamentId, teamId, playerId });
    
    showLoading();
    
    // Update tournament title
    updateTournamentTitle();
    
    // Fetch data from the server
    const apiUrl = `/api/tournament_data?tournament_id=${tournamentId}&team_id=${teamId}&player_id=${playerId}`;
    console.log("Fetching tournament data from:", apiUrl);
    
    fetch(apiUrl)
        .then(response => {
            console.log("Tournament data API response status:", response.status);
            console.log("Response headers:", [...response.headers].map(h => `${h[0]}: ${h[1]}`).join(', '));
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Received visualization data:", data);
            
            // Check if data structure is as expected
            if (!data.summary) {
                console.error("Missing 'summary' in API response");
            }
            if (!data.team_standings) {
                console.error("Missing 'team_standings' in API response");
            }
            if (!data.points_distribution) {
                console.error("Missing 'points_distribution' in API response");
            }
            if (!data.top_scorers) {
                console.error("Missing 'top_scorers' in API response");
            }
            if (!data.player_efficiency) {
                console.error("Missing 'player_efficiency' in API response");
            }
            if (!data.match_score_trends) {
                console.error("Missing 'match_score_trends' in API response");
            }
            if (!data.double_triple_leaders) {
                console.error("Missing 'double_triple_leaders' in API response");
            }
            if (!data.team_records) {
                console.error("Missing 'team_records' in API response");
            }
            
            // Update summary cards
            updateSummaryCards(data.summary);
            
            // Create/update all charts
            try {
                console.log("Creating team standings chart with data:", data.team_standings);
                createTeamStandingsChart(data.team_standings);
                
                console.log("Creating points distribution chart with data:", data.points_distribution);
                createPointsDistributionChart(data.points_distribution);
                
                console.log("Creating top scorers chart with data:", data.top_scorers);
                createTopScorersChart(data.top_scorers);
                
                console.log("Creating player efficiency chart with data:", data.player_efficiency);
                createPlayerEfficiencyChart(data.player_efficiency);
                
                console.log("Creating match score trends chart with data:", data.match_score_trends);
                createMatchScoreTrendsChart(data.match_score_trends);
                
                if (playerId !== 'all') {
                    console.log("Player selected, showing player stat comparison chart");
                    document.querySelector('#playerComparisonContainer').style.display = 'none';
                    document.querySelector('#playerStatComparisonChart').parentElement.style.display = 'block';
                    createPlayerStatComparisonChart(playerId);
                } else {
                    console.log("No player selected, showing player selection prompt");
                    document.querySelector('#playerComparisonContainer').style.display = 'block';
                    document.querySelector('#playerStatComparisonChart').parentElement.style.display = 'none';
                }
                
                console.log("Creating double-triple leaders chart with data:", data.double_triple_leaders);
                createDoubleTripleLeadersChart(data.double_triple_leaders);
                
                // Update team records table
                console.log("Updating team records table with data:", data.team_records);
                updateTeamRecordsTable(data.team_records);
            } catch (error) {
                console.error("Error during chart creation:", error);
            }
            
            hideLoading();
        })
        .catch(error => {
            console.error('Error fetching visualization data:', error);
            hideLoading();
            
            // Show error notification
            const alertContainer = document.createElement('div');
            alertContainer.className = 'alert alert-danger alert-dismissible fade show';
            alertContainer.setAttribute('role', 'alert');
            alertContainer.innerHTML = `
                <strong>Error!</strong> Failed to load visualization data: ${error.message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            `;
            
            // Insert at the top of the main container
            const mainContainer = document.querySelector('.container-fluid');
            mainContainer.insertBefore(alertContainer, mainContainer.firstChild);
        });
}

// Update tournament title based on selection
function updateTournamentTitle() {
    const tournamentSelect = document.getElementById('tournamentSelect');
    let title = 'Tournament Summary';

    if (tournamentSelect.value !== 'all') {
        const selectedOption = tournamentSelect.options[tournamentSelect.selectedIndex];
        const isShared = parseInt(selectedOption.dataset.creator) !== CURRENT_USER_ID;
        title = `Tournament Summary: ${selectedOption.text}${isShared ? ' (Shared)' : ''}`;
    }

    console.log("Updating tournament title to:", title);
    document.querySelector('.tournament-title').textContent = title;
}

// Update summary cards with data
function updateSummaryCards(summaryData) {
    console.log("Updating summary cards with data:", summaryData);
    
    if (!summaryData) {
        console.error("Summary data is undefined or null");
        return;
    }
    
    try {
        document.getElementById('teamsCount').textContent = summaryData.teams_count;
        document.getElementById('playersCount').textContent = summaryData.players_count;
        document.getElementById('matchesCount').textContent = summaryData.matches_count;
        document.getElementById('avgPointsPerGame').textContent = summaryData.avg_points_per_game;
        console.log("Summary cards updated successfully");
    } catch (error) {
        console.error("Error updating summary cards:", error);
    }
}

// Create team standings chart
function createTeamStandingsChart(data) {
    const ctx = document.getElementById('teamStandingsChart');
    
    if (!ctx) {
        console.error("Team standings chart canvas not found");
        return;
    }
    
    console.log("Creating team standings chart with context:", ctx);
    
    // Check if data is valid
    if (!data || !data.labels || !data.wins || !data.losses) {
        console.error("Invalid team standings data:", data);
        return;
    }
    
    // Destroy existing chart if it exists
    if (charts.teamStandings) {
        console.log("Destroying existing team standings chart");
        charts.teamStandings.destroy();
    }
    
    try {
        console.log("Creating new team standings chart with labels:", data.labels);
        charts.teamStandings = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Wins',
                        data: data.wins,
                        backgroundColor: 'rgba(40, 167, 69, 0.7)',
                        borderColor: 'rgba(40, 167, 69, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Losses',
                        data: data.losses,
                        backgroundColor: 'rgba(220, 53, 69, 0.7)',
                        borderColor: 'rgba(220, 53, 69, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                ...chartOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Games'
                        }
                    }
                }
            }
        });
        console.log("Team standings chart created successfully");
    } catch (error) {
        console.error("Error creating team standings chart:", error);
    }
}

// Create points distribution chart
function createPointsDistributionChart(data) {
    const ctx = document.getElementById('pointsDistributionChart');
    
    if (!ctx) {
        console.error("Points distribution chart canvas not found");
        return;
    }
    
    // Check if data is valid
    if (!data || !data.labels || !data.points_scored || !data.points_conceded) {
        console.error("Invalid points distribution data:", data);
        return;
    }
    
    // Destroy existing chart if it exists
    if (charts.pointsDistribution) {
        charts.pointsDistribution.destroy();
    }
    
    try {
        charts.pointsDistribution = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Points Scored',
                        data: data.points_scored,
                        backgroundColor: 'rgba(54, 162, 235, 0.7)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Points Conceded',
                        data: data.points_conceded,
                        backgroundColor: 'rgba(255, 99, 132, 0.7)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                ...chartOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Points per Game'
                        }
                    }
                }
            }
        });
        console.log("Points distribution chart created successfully");
    } catch (error) {
        console.error("Error creating points distribution chart:", error);
    }
}

// Create top scorers chart
function createTopScorersChart(data) {
    const ctx = document.getElementById('topScorersChart');
    
    if (!ctx) {
        console.error("Top scorers chart canvas not found");
        return;
    }
    
    // Check if data is valid
    if (!data || !data.labels || !data.points || !data.teams) {
        console.error("Invalid top scorers data:", data);
        return;
    }
    
    // Destroy existing chart if it exists
    if (charts.topScorers) {
        charts.topScorers.destroy();
    }
    
    // Create custom tooltip with team information
    const tooltipCallback = {
        afterLabel: function(context) {
            return `Team: ${data.teams[context.dataIndex]}`;
        }
    };
    
    try {
        charts.topScorers = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Points Per Game',
                    data: data.points,
                    backgroundColor: chartColors.slice(0, data.labels.length),
                    borderColor: chartColors.slice(0, data.labels.length).map(color => color.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                ...chartOptions,
                indexAxis: 'y',
                plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                        callbacks: tooltipCallback
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Points Per Game'
                        }
                    }
                }
            }
        });
        console.log("Top scorers chart created successfully");
    } catch (error) {
        console.error("Error creating top scorers chart:", error);
    }
}

// Create player efficiency chart
function createPlayerEfficiencyChart(data) {
    const ctx = document.getElementById('playerEfficiencyChart');
    
    if (!ctx) {
        console.error("Player efficiency chart canvas not found");
        return;
    }
    
    // Check if data is valid
    if (!data || !data.labels || !data.efficiency || !data.teams) {
        console.error("Invalid player efficiency data:", data);
        return;
    }
    
    // Destroy existing chart if it exists
    if (charts.playerEfficiency) {
        charts.playerEfficiency.destroy();
    }
    
    // Create custom tooltip with team information
    const tooltipCallback = {
        afterLabel: function(context) {
            return `Team: ${data.teams[context.dataIndex]}`;
        }
    };
    
    try {
        charts.playerEfficiency = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Efficiency Rating',
                    data: data.efficiency,
                    backgroundColor: chartColors.slice(0, data.labels.length),
                    borderColor: chartColors.slice(0, data.labels.length).map(color => color.replace('0.7', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                ...chartOptions,
                plugins: {
                    ...chartOptions.plugins,
                    tooltip: {
                        callbacks: tooltipCallback
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Efficiency Rating'
                        }
                    }
                }
            }
        });
        console.log("Player efficiency chart created successfully");
    } catch (error) {
        console.error("Error creating player efficiency chart:", error);
    }
}

// Create match score trends chart
function createMatchScoreTrendsChart(data) {
    const ctx = document.getElementById('matchScoreTrendsChart');
    
    if (!ctx) {
        console.error("Match score trends chart canvas not found");
        return;
    }
    
    // Check if data is valid
    if (!data || !data.labels || !data.winning_scores || !data.losing_scores || !data.avg_scores) {
        console.error("Invalid match score trends data:", data);
        return;
    }
    
    // Destroy existing chart if it exists
    if (charts.matchScoreTrends) {
        charts.matchScoreTrends.destroy();
    }
    
    try {
        charts.matchScoreTrends = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Winning Team Score',
                        data: data.winning_scores,
                        borderColor: 'rgba(40, 167, 69, 1)',
                        backgroundColor: 'rgba(40, 167, 69, 0.1)',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Losing Team Score',
                        data: data.losing_scores,
                        borderColor: 'rgba(220, 53, 69, 1)',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Average Score',
                        data: data.avg_scores,
                        borderColor: 'rgba(254, 162, 235, 1)',
                        backgroundColor: 'rgba(254, 162, 235, 0.1)',
                        borderDash: [5, 5],
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                ...chartOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Score'
                        }
                    }
                }
            }
        });
        console.log("Match score trends chart created successfully");
    } catch (error) {
        console.error("Error creating match score trends chart:", error);
    }
}

// Create player stat comparison chart
function createPlayerStatComparisonChart(playerId) {
    const ctx = document.getElementById('playerStatComparisonChart');
    
    if (!ctx) {
        console.error("Player stat comparison chart canvas not found");
        return;
    }
    
    // Destroy existing chart if it exists
    if (charts.playerStatComparison) {
        charts.playerStatComparison.destroy();
    }
    
    showLoading();
    
    console.log("Fetching player stats for player ID:", playerId);
    // Fetch player data for comparison
    fetch(`/api/player_stats?player_id=${playerId}`)
        .then(response => {
            console.log("Player stats API response status:", response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("Received player stats data:", data);
            
            // For now, we'll use dummy data until the API endpoint is implemented
            const playerName = document.getElementById('playerSelect').options[document.getElementById('playerSelect').selectedIndex].text;
            const statLabels = ['Points', 'Rebounds', 'Assists', 'Steals', 'Blocks', '3-Pointers'];
            const playerStats = [25.3, 6.8, 7.2, 1.5, 0.8, 2.4];
            const leagueAvgStats = [15.7, 5.2, 4.3, 1.1, 0.6, 1.8];
            
            try {
                charts.playerStatComparison = new Chart(ctx.getContext('2d'), {
                    type: 'radar',
                    data: {
                        labels: statLabels,
                        datasets: [
                            {
                                label: playerName,
                                data: playerStats,
                                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                borderColor: 'rgba(54, 162, 235, 1)',
                                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                                pointBorderColor: '#fff',
                                pointHoverBackgroundColor: '#fff',
                                pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
                            },
                            {
                                label: 'League Average',
                                data: leagueAvgStats,
                                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                borderColor: 'rgba(255, 99, 132, 1)',
                                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                                pointBorderColor: '#fff',
                                pointHoverBackgroundColor: '#fff',
                                pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
                            }
                        ]
                    },
                    options: {
                        ...chartOptions,
                        scales: {
                            r: {
                                angleLines: {
                                    display: true
                                },
                                suggestedMin: 0
                            }
                        }
                    }
                });
                console.log("Player stat comparison chart created successfully");
            } catch (error) {
                console.error("Error creating player stat comparison chart:", error);
            }
            
            hideLoading();
        })
        .catch(error => {
            console.error('Error fetching player stats:', error);
            console.log("Using fallback dummy data for player comparison chart");
            hideLoading();
            
            // Create a basic chart with dummy data
            const playerName = document.getElementById('playerSelect').options[document.getElementById('playerSelect').selectedIndex].text;
            const statLabels = ['Points', 'Rebounds', 'Assists', 'Steals', 'Blocks', '3-Pointers'];
            const playerStats = [25.3, 6.8, 7.2, 1.5, 0.8, 2.4];
            const leagueAvgStats = [15.7, 5.2, 4.3, 1.1, 0.6, 1.8];
            
            try {
                charts.playerStatComparison = new Chart(ctx.getContext('2d'), {
                    type: 'radar',
                    data: {
                        labels: statLabels,
                        datasets: [
                            {
                                label: playerName,
                                data: playerStats,
                                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                                borderColor: 'rgba(54, 162, 235, 1)',
                                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                                pointBorderColor: '#fff',
                                pointHoverBackgroundColor: '#fff',
                                pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
                            },
                            {
                                label: 'League Average',
                                data: leagueAvgStats,
                                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                                borderColor: 'rgba(255, 99, 132, 1)',
                                pointBackgroundColor: 'rgba(255, 99, 132, 1)',
                                pointBorderColor: '#fff',
                                pointHoverBackgroundColor: '#fff',
                                pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
                            }
                        ]
                    },
                    options: {
                        ...chartOptions,
                        scales: {
                            r: {
                                angleLines: {
                                    display: true
                                },
                                suggestedMin: 0
                            }
                        }
                    }
                });
                console.log("Fallback player stat comparison chart created successfully");
            } catch (error) {
                console.error("Error creating fallback player stat comparison chart:", error);
            }
        });
}

// Create double-double and triple-double leaders chart
function createDoubleTripleLeadersChart(data) {
    const ctx = document.getElementById('doubleTripleLeadersChart');
    
    if (!ctx) {
        console.error("Double-triple leaders chart canvas not found");
        return;
    }
    
    // Check if data is valid
    if (!data || !data.labels || !data.double_doubles || !data.triple_doubles) {
        console.error("Invalid double-triple leaders data:", data);
        return;
    }
    
    // Destroy existing chart if it exists
    if (charts.doubleTripleLeaders) {
        charts.doubleTripleLeaders.destroy();
    }
    
    try {
        charts.doubleTripleLeaders = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Double-Doubles',
                        data: data.double_doubles,
                        backgroundColor: 'rgba(75, 192, 192, 0.7)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Triple-Doubles',
                        data: data.triple_doubles,
                        backgroundColor: 'rgba(153, 102, 255, 0.7)',
                        borderColor: 'rgba(153, 102, 255, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                ...chartOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Count'
                        }
                    }
                }
            }
        });
        console.log("Double-triple leaders chart created successfully");
    } catch (error) {
        console.error("Error creating double-triple leaders chart:", error);
    }
}

// Update team records table with data
function updateTeamRecordsTable(teamRecords) {
    console.log("Updating team records table with data:", teamRecords);
    
    const tableBody = document.querySelector('#teamRecordsTable tbody');
    
    if (!tableBody) {
        console.error("Team records table body not found");
        return;
    }
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (!teamRecords || teamRecords.length === 0) {
        console.log("No team records available, showing empty state");
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" class="text-center">No team records available</td>';
        tableBody.appendChild(row);
        return;
    }
    
    try {
        // Add rows to the table
        teamRecords.forEach((record, index) => {
            console.log(`Processing team record ${index + 1}:`, record);
            
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${record.team}</td>
                <td>${record.wins}</td>
                <td>${record.losses}</td>
                <td>${record.win_pct.toFixed(1)}%</td>
                <td>${record.pts_scored.toFixed(1)}</td>
                <td>${record.pts_allowed.toFixed(1)}</td>
                <td class="${record.diff >= 0 ? 'text-success' : 'text-danger'}">${record.diff >= 0 ? '+' : ''}${record.diff.toFixed(1)}</td>
            `;
            
            tableBody.appendChild(row);
        });
        console.log("Team records table updated successfully with", teamRecords.length, "rows");
    } catch (error) {
        console.error("Error updating team records table:", error);
    }
}

function exportToPDF() {
    console.log("Starting PDF export process");
    showLoading();

    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        console.error("jsPDF not available");
        hideLoading();
        return;
    }

    const doc = new jsPDF('landscape', 'mm', 'a4');
    const chartContainers = document.querySelectorAll('.chart-container');
    const tournamentSelect = document.getElementById('tournamentSelect');
    let title = 'Tournament Visualisation Report';
    if (tournamentSelect.value !== 'all') {
        title += ': ' + tournamentSelect.options[tournamentSelect.selectedIndex].text;
    }

    doc.setFontSize(20);
    doc.text(title, 20, 20);
    doc.setFontSize(12);
    doc.text('Generated on: ' + new Date().toLocaleString(), 20, 30);

    let yPosition = 40;
    let processedCharts = 0;
    const totalCharts = chartContainers.length;

    const captureChart = (container, index) => {
        html2canvas(container, { scale: 2 }).then(canvas => {
            const imgWidth = 260;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            if (index > 0 && (yPosition + imgHeight > 190)) {
                doc.addPage();
                yPosition = 20;
                console.log("Added new page to PDF");
            }

            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
            yPosition += imgHeight + 10;

            processedCharts++;
            if (processedCharts === totalCharts) {
                const filename = `tournament_visualisation_${Date.now()}.pdf`;
                doc.save(filename);
                hideLoading();
            }
        });
    };

    setTimeout(() => {
        chartContainers.forEach((container, index) => {
            captureChart(container, index);
        });
    }, 500);
}
