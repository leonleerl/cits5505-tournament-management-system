/**
 * Tournament Editor JavaScript
 * Handles all tournament editing functionality
 */
document.addEventListener('DOMContentLoaded', function() {
    // Cached DOM elements for tournament selection
    const tournamentSearch = document.getElementById('tournamentSearch');
    const searchButton = document.getElementById('searchButton');
    const tournamentList = document.getElementById('tournamentList');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const noTournamentsMessage = document.getElementById('noTournamentsMessage');
    const deleteTournamentBtn = document.getElementById('deleteTournamentBtn');
    
    // Editor elements
    const currentTournamentName = document.getElementById('currentTournamentName');
    const selectTournamentMessage = document.getElementById('selectTournamentMessage');
    const editorContent = document.getElementById('editorContent');
    const tournamentId = document.getElementById('tournamentId');
    const tournamentDetailsForm = document.getElementById('tournamentDetailsForm');
    
    // Modals and helpers
    const deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    const teamModal = new bootstrap.Modal(document.getElementById('teamModal'));
    const playerModal = new bootstrap.Modal(document.getElementById('playerModal'));
    const matchModal = new bootstrap.Modal(document.getElementById('matchModal'));
    
    // Current state
    let currentTournament = null;
    let allTeams = [];
    
    // Initialize the editor
    init();
    
    /**
     * Initialize the editor
     */
    function init() {
        // Load tournaments
        loadTournaments();
        
        // Add event listeners
        if (searchButton) {
            searchButton.addEventListener('click', function() {
                loadTournaments(tournamentSearch.value);
            });
        }
        
        if (tournamentSearch) {
            tournamentSearch.addEventListener('keyup', function(event) {
                if (event.key === 'Enter') {
                    loadTournaments(tournamentSearch.value);
                }
            });
        }
        
        if (deleteTournamentBtn) {
            deleteTournamentBtn.addEventListener('click', function() {
                if (!currentTournament) {
                    alert('Please select a tournament first');
                    return;
                }
                
                openDeleteModal(
                    currentTournament.id, 
                    currentTournament.name, 
                    'tournament'
                );
            });
        }
        
        // Tournament details form submission
        if (tournamentDetailsForm) {
            tournamentDetailsForm.addEventListener('submit', function(event) {
                event.preventDefault();
                updateTournamentDetails();
            });
        }
        
        // Team tab events
        document.getElementById('addTeamBtn')?.addEventListener('click', () => openTeamModal());
        document.getElementById('saveTeamBtn')?.addEventListener('click', saveTeam);
        
        // Player tab events
        document.getElementById('addPlayerBtn')?.addEventListener('click', () => openPlayerModal());
        document.getElementById('savePlayerBtn')?.addEventListener('click', savePlayer);
        document.getElementById('playerTeamFilter')?.addEventListener('change', filterPlayers);
        
        // Match tab events
        document.getElementById('addMatchBtn')?.addEventListener('click', () => openMatchModal());
        document.getElementById('saveMatchBtn')?.addEventListener('click', saveMatch);
        document.getElementById('hasScore')?.addEventListener('change', toggleScoreInputs);
        
        // Stats tab events
        document.getElementById('statMatchFilter')?.addEventListener('change', loadPlayerStats);
        document.getElementById('statTeamFilter')?.addEventListener('change', filterPlayerStats);
        
        // Delete confirmation
        document.getElementById('confirmDeleteBtn')?.addEventListener('click', confirmDelete);
    }
    
    /**
     * Load tournaments with optional search filter
     * @param {string} searchQuery - Optional search term
     */
    function loadTournaments(searchQuery = '') {
        if (!tournamentList) return;
        
        // Show loading state
        loadingSpinner.classList.remove('d-none');
        noTournamentsMessage.classList.add('d-none');
        tournamentList.innerHTML = '';
        
        // Build API URL
        let url = '/api/tournaments';
        if (searchQuery) {
            url += `?q=${encodeURIComponent(searchQuery)}`;
        }
        
        // Fetch tournaments
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load tournaments');
                }
                return response.json();
            })
            .then(tournaments => {
                // Hide loading spinner
                loadingSpinner.classList.add('d-none');
                
                if (tournaments.length === 0) {
                    // Show no tournaments message
                    noTournamentsMessage.classList.remove('d-none');
                    return;
                }
                
                // Create list group for tournaments
                const listGroup = document.createElement('div');
                listGroup.className = 'list-group';
                
                // Render each tournament
                tournaments.forEach(tournament => {
                    const item = createTournamentListItem(tournament);
                    listGroup.appendChild(item);
                });
                
                tournamentList.appendChild(listGroup);
            })
            .catch(error => {
                console.error('Error loading tournaments:', error);
                loadingSpinner.classList.add('d-none');
                alert('Error loading tournaments: ' + error.message);
            });
    }
    
    /**
     * Create a tournament list item
     * @param {Object} tournament - Tournament data
     * @returns {HTMLElement} The created list item
     */
    function createTournamentListItem(tournament) {
        const item = document.createElement('a');
        item.href = '#';
        item.className = 'list-group-item list-group-item-action tournament-item';
        item.dataset.id = tournament.id;
        
        const title = document.createElement('div');
        title.className = 'tournament-item-title';
        title.textContent = tournament.name;
        
        const details = document.createElement('div');
        details.className = 'tournament-item-details';
        details.textContent = `${tournament.year} · ${tournament.teams_count || 0} teams · ${tournament.matches_count || 0} matches`;
        
        item.appendChild(title);
        item.appendChild(details);
        
        // Add click handler
        item.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Remove active class from all items
            document.querySelectorAll('.tournament-item').forEach(el => {
                el.classList.remove('active');
            });
            
            // Add active class to this item
            item.classList.add('active');
            
            // Load tournament details
            loadTournament(tournament.id);
        });
        
        return item;
    }
    
    /**
     * Load a specific tournament's details
     * @param {number} id - Tournament ID
     */
    function loadTournament(id) {
        // Show loading state in current tournament name
        currentTournamentName.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Loading...';
        
        // Fetch tournament details
        fetch(`/api/tournament/${id}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load tournament details');
                }
                return response.json();
            })
            .then(tournament => {
                // Store current tournament
                currentTournament = tournament;
                
                // Update UI
                currentTournamentName.textContent = tournament.name;
                selectTournamentMessage.classList.add('d-none');
                editorContent.classList.remove('d-none');
                
                // Load tabs data
                populateTournamentDetailsForm(tournament);
                loadTeams(tournament.id);
                loadMatches(tournament.id);
                
                // Reset player stats tab
                resetPlayerStatsTab();
            })
            .catch(error => {
                console.error('Error loading tournament:', error);
                currentTournamentName.textContent = 'Error Loading Tournament';
                alert('Error loading tournament: ' + error.message);
            });
    }
    
    /**
     * Populate the tournament details form
     * @param {Object} tournament - Tournament data
     */
    function populateTournamentDetailsForm(tournament) {
        document.getElementById('tournamentId').value = tournament.id;
        document.getElementById('tournamentName').value = tournament.name;
        document.getElementById('tournamentYear').value = tournament.year;
        document.getElementById('tournamentDescription').value = tournament.description || '';
        
        if (tournament.start_date) {
            document.getElementById('tournamentStartDate').value = tournament.start_date.split('T')[0];
        }
        
        if (tournament.end_date) {
            document.getElementById('tournamentEndDate').value = tournament.end_date.split('T')[0];
        }
    }
    
    /**
     * Update tournament details
     */
    function updateTournamentDetails() {
        const id = document.getElementById('tournamentId').value;
        
        if (!id) {
            alert('No tournament selected');
            return;
        }
        
        // Get form values
        const tournamentData = {
            name: document.getElementById('tournamentName').value,
            year: parseInt(document.getElementById('tournamentYear').value),
            description: document.getElementById('tournamentDescription').value,
            start_date: document.getElementById('tournamentStartDate').value,
            end_date: document.getElementById('tournamentEndDate').value
        };
        
        // Validate dates
        const startDate = new Date(tournamentData.start_date);
        const endDate = new Date(tournamentData.end_date);
        
        if (startDate > endDate) {
            alert('End date must be after start date');
            return;
        }
        
        // Show loading state
        const submitBtn = tournamentDetailsForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...';
        
        // Send update request
        fetch(`/api/tournament/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tournamentData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update tournament');
                }
                return response.json();
            })
            .then(result => {
                // Update current tournament object
                currentTournament.name = tournamentData.name;
                currentTournament.year = tournamentData.year;
                currentTournament.description = tournamentData.description;
                currentTournament.start_date = tournamentData.start_date;
                currentTournament.end_date = tournamentData.end_date;
                
                // Update UI
                currentTournamentName.textContent = tournamentData.name;
                
                // Update tournament list item
                const item = document.querySelector(`.tournament-item[data-id="${id}"]`);
                if (item) {
                    const title = item.querySelector('.tournament-item-title');
                    if (title) {
                        title.textContent = tournamentData.name;
                    }
                }
                
                // Show success message
                alert('Tournament updated successfully');
            })
            .catch(error => {
                console.error('Error updating tournament:', error);
                alert('Error updating tournament: ' + error.message);
            })
            .finally(() => {
                // Reset button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            });
    }
    
    /**
     * Open the delete confirmation modal
     * @param {number} id - Item ID
     * @param {string} name - Item name
     * @param {string} type - Item type (tournament, team, player, match)
     */
    function openDeleteModal(id, name, type) {
        document.getElementById('deleteItemId').value = id;
        document.getElementById('deleteItemType').value = type;
        document.getElementById('deleteItemName').textContent = name;
        
        // Update modal title based on type
        const modalTitle = document.getElementById('deleteConfirmModalLabel');
        modalTitle.textContent = `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`;
        
        deleteConfirmModal.show();
    }
    
    /**
     * Confirm delete action
     */
    function confirmDelete() {
        const id = document.getElementById('deleteItemId').value;
        const type = document.getElementById('deleteItemType').value;
        
        if (!id || !type) {
            alert('Missing item information');
            return;
        }
        
        // Show loading state
        const deleteBtn = document.getElementById('confirmDeleteBtn');
        const originalText = deleteBtn.textContent;
        deleteBtn.disabled = true;
        deleteBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Deleting...';
        
        // Determine endpoint based on type
        let endpoint;
        switch (type) {
            case 'tournament':
                endpoint = `/api/tournament/${id}`;
                break;
            case 'team':
                endpoint = `/api/team/${id}`;
                break;
            case 'player':
                endpoint = `/api/player/${id}`;
                break;
            case 'match':
                endpoint = `/api/match/${id}`;
                break;
            default:
                alert('Invalid item type');
                deleteBtn.disabled = false;
                deleteBtn.textContent = originalText;
                return;
        }
        
        // Send delete request
        fetch(endpoint, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to delete ${type}`);
                }
                return response.json();
            })
            .then(result => {
                // Close modal
                deleteConfirmModal.hide();
                
                // Handle specific type actions
                if (type === 'tournament') {
                    // Reload tournaments list
                    loadTournaments(tournamentSearch.value);
                    
                    // Reset editor
                    currentTournament = null;
                    currentTournamentName.textContent = 'Select a Tournament';
                    selectTournamentMessage.classList.remove('d-none');
                    editorContent.classList.add('d-none');
                } else if (type === 'team') {
                    // Reload teams
                    loadTeams(currentTournament.id);
                    
                    // Reload player team filter options
                    updatePlayerTeamFilters();
                    
                    // Reload matches (as they reference teams)
                    loadMatches(currentTournament.id);
                } else if (type === 'player') {
                    // Reload players
                    loadPlayers(currentTournament.id);
                } else if (type === 'match') {
                    // Reload matches
                    loadMatches(currentTournament.id);
                    
                    // Reset player stats tab
                    resetPlayerStatsTab();
                }
                
                // Show success message
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
            })
            .catch(error => {
                console.error(`Error deleting ${type}:`, error);
                alert(`Error deleting ${type}: ${error.message}`);
            })
            .finally(() => {
                // Reset button state
                deleteBtn.disabled = false;
                deleteBtn.textContent = originalText;
            });
    }
    
    // =============================================
    // TEAMS MANAGEMENT
    // =============================================
    
    /**
     * Load teams for the tournament
     * @param {number} tournamentId - Tournament ID
     */
    function loadTeams(tournamentId) {
        const teamsLoading = document.getElementById('teamsLoading');
        const noTeamsMessage = document.getElementById('noTeamsMessage');
        const teamsTable = document.getElementById('teamsTable');
        const teamsTableBody = document.getElementById('teamsTableBody');
        
        if (!teamsTableBody) return;
        
        // Show loading state
        teamsLoading.classList.remove('d-none');
        noTeamsMessage.classList.add('d-none');
        teamsTableBody.innerHTML = '';
        
        // Fetch teams
        fetch(`/api/tournament/${tournamentId}/teams`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load teams');
                }
                return response.json();
            })
            .then(teams => {
                // Hide loading state
                teamsLoading.classList.add('d-none');
                
                // Store for reference
                allTeams = teams;
                
                // Update all team dropdowns
                updatePlayerTeamFilters();
                updateMatchTeamDropdowns();
                
                if (teams.length === 0) {
                    noTeamsMessage.classList.remove('d-none');
                    teamsTable.classList.add('d-none');
                    return;
                }
                
                // Show table
                teamsTable.classList.remove('d-none');
                
                // Render teams
                teams.forEach(team => {
                    const row = createTeamRow(team);
                    teamsTableBody.appendChild(row);
                });
                
                // Load players after teams are loaded
                loadPlayers(tournamentId);
            })
            .catch(error => {
                console.error('Error loading teams:', error);
                teamsLoading.classList.add('d-none');
                noTeamsMessage.classList.remove('d-none');
                noTeamsMessage.textContent = 'Error loading teams: ' + error.message;
            });
    }
    
    /**
     * Create a team table row
     * @param {Object} team - Team data
     * @returns {HTMLElement} The created table row
     */
    function createTeamRow(team) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${team.name}</td>
            <td>
                <div class="team-colors">
                    <span class="team-color-preview" style="background-color: ${team.primary_color};"></span>
                    <span class="team-color-preview" style="background-color: ${team.secondary_color};"></span>
                </div>
            </td>
            <td>${team.created_year || '-'}</td>
            <td>${team.wins}</td>
            <td>${team.losses}</td>
            <td>${team.points}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary edit-team-btn" data-id="${team.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger ms-1 delete-team-btn" data-id="${team.id}" data-name="${team.name}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        // Add event listeners
        row.querySelector('.edit-team-btn').addEventListener('click', function() {
            const teamId = this.getAttribute('data-id');
            openTeamModal(teamId);
        });
        
        row.querySelector('.delete-team-btn').addEventListener('click', function() {
            const teamId = this.getAttribute('data-id');
            const teamName = this.getAttribute('data-name');
            openDeleteModal(teamId, teamName, 'team');
        });
        
        return row;
    }
    
    /**
     * Open the team modal for adding or editing
     * @param {number} teamId - Optional team ID for editing
     */
    function openTeamModal(teamId = null) {
        const teamForm = document.getElementById('teamForm');
        const modalTitle = document.getElementById('teamModalLabel');
        const saveBtn = document.getElementById('saveTeamBtn');
        
        // Reset form
        teamForm.reset();
        document.getElementById('teamId').value = '';
        
        if (teamId) {
            // Editing existing team
            modalTitle.textContent = 'Edit Team';
            saveBtn.textContent = 'Update Team';
            
            // Show loading state
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Loading...';
            
            // Fetch team details
            fetch(`/api/team/${teamId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to load team details');
                    }
                    return response.json();
                })
                .then(team => {
                    // Populate form
                    document.getElementById('teamId').value = team.id;
                    document.getElementById('teamName').value = team.name;
                    document.getElementById('teamCreatedYear').value = team.created_year || '';
                    document.getElementById('teamPrimaryColor').value = team.primary_color;
                    document.getElementById('teamSecondaryColor').value = team.secondary_color;
                    document.getElementById('teamLogoShape').value = team.logo_shape_type;
                    
                    // Reset button state
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Update Team';
                })
                .catch(error => {
                    console.error('Error loading team:', error);
                    alert('Error loading team: ' + error.message);
                    teamModal.hide();
                });
        } else {
            // Adding new team
            modalTitle.textContent = 'Add Team';
            saveBtn.textContent = 'Add Team';
            
            // Set default colors
            document.getElementById('teamPrimaryColor').value = '#000000';
            document.getElementById('teamSecondaryColor').value = '#FFFFFF';
        }
        
        teamModal.show();
    }
    
    /**
     * Save or update a team
     */
    function saveTeam() {
        const teamId = document.getElementById('teamId').value;
        const isEditing = !!teamId;
        
        // Get form values
        const teamData = {
            name: document.getElementById('teamName').value,
            created_year: document.getElementById('teamCreatedYear').value || null,
            logo_shape_type: document.getElementById('teamLogoShape').value,
            primary_color: document.getElementById('teamPrimaryColor').value,
            secondary_color: document.getElementById('teamSecondaryColor').value
        };
        
        // Validate name
        if (!teamData.name) {
            alert('Team name is required');
            return;
        }
        
        // Show loading state
        const saveBtn = document.getElementById('saveTeamBtn');
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...';
        
        // Determine URL and method
        const url = isEditing ? 
            `/api/team/${teamId}` : 
            `/api/tournament/${currentTournament.id}/teams`;
        
        const method = isEditing ? 'PUT' : 'POST';
        
        // Send request
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(teamData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save team');
                }
                return response.json();
            })
            .then(result => {
                // Close modal
                teamModal.hide();
                
                // Reload teams
                loadTeams(currentTournament.id);
                
                // Show success message
                alert(isEditing ? 'Team updated successfully' : 'Team added successfully');
            })
            .catch(error => {
                console.error('Error saving team:', error);
                alert('Error saving team: ' + error.message);
            })
            .finally(() => {
                // Reset button state
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            });
    }
    
    /**
     * Update player team filter options and match team dropdowns
     */
    function updatePlayerTeamFilters() {
        // Update player team filter
        const playerTeamFilter = document.getElementById('playerTeamFilter');
        if (playerTeamFilter) {
            const currentValue = playerTeamFilter.value;
            
            // Clear options except "All Teams"
            playerTeamFilter.innerHTML = '<option value="all">All Teams</option>';
            
            // Add team options
            allTeams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.id;
                option.textContent = team.name;
                playerTeamFilter.appendChild(option);
            });
            
            // Try to restore previous selection
            if (currentValue !== 'all') {
                const exists = Array.from(playerTeamFilter.options).some(option => option.value === currentValue);
                playerTeamFilter.value = exists ? currentValue : 'all';
            }
        }
        
        // Update stats team filter
        const statTeamFilter = document.getElementById('statTeamFilter');
        if (statTeamFilter) {
            const currentValue = statTeamFilter.value;
            
            // Clear options except "All Teams"
            statTeamFilter.innerHTML = '<option value="all">All Teams</option>';
            
            // Add team options
            allTeams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.id;
                option.textContent = team.name;
                statTeamFilter.appendChild(option);
            });
            
            // Try to restore previous selection
            if (currentValue !== 'all') {
                const exists = Array.from(statTeamFilter.options).some(option => option.value === currentValue);
                statTeamFilter.value = exists ? currentValue : 'all';
            }
        }
        
        // Update player team dropdown in player modal
        const playerTeam = document.getElementById('playerTeam');
        if (playerTeam) {
            // Clear options except empty
            playerTeam.innerHTML = '<option value="">Select team</option>';
            
            // Add team options
            allTeams.forEach(team => {
                const option = document.createElement('option');
                option.value = team.id;
                option.textContent = team.name;
                playerTeam.appendChild(option);
            });
        }
    }
    
    /**
     * Update match team dropdowns
     */
    function updateMatchTeamDropdowns() {
        // Update match team dropdowns
        const matchTeam1 = document.getElementById('matchTeam1');
        const matchTeam2 = document.getElementById('matchTeam2');
        
        if (matchTeam1 && matchTeam2) {
            // Clear options
            matchTeam1.innerHTML = '<option value="">Select team</option>';
            matchTeam2.innerHTML = '<option value="">Select team</option>';
            
            // Add team options
            allTeams.forEach(team => {
                const option1 = document.createElement('option');
                option1.value = team.id;
                option1.textContent = team.name;
                matchTeam1.appendChild(option1);
                
                const option2 = document.createElement('option');
                option2.value = team.id;
                option2.textContent = team.name;
                matchTeam2.appendChild(option2);
            });
        }
    }
    
    // =============================================
    // PLAYERS MANAGEMENT
    // =============================================
    
    /**
     * Load players for the tournament
     * @param {number} tournamentId - Tournament ID
     */
    function loadPlayers(tournamentId) {
        const playersLoading = document.getElementById('playersLoading');
        const noPlayersMessage = document.getElementById('noPlayersMessage');
        const playersTable = document.getElementById('playersTable');
        const playersTableBody = document.getElementById('playersTableBody');
        
        if (!playersTableBody) return;
        
        // Show loading state
        playersLoading.classList.remove('d-none');
        noPlayersMessage.classList.add('d-none');
        playersTableBody.innerHTML = '';
        
        // Fetch players
        fetch(`/api/tournament/${tournamentId}/players`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load players');
                }
                return response.json();
            })
            .then(players => {
                // Hide loading state
                playersLoading.classList.add('d-none');
                
                if (players.length === 0) {
                    noPlayersMessage.classList.remove('d-none');
                    playersTable.classList.add('d-none');
                    return;
                }
                
                // Show table
                playersTable.classList.remove('d-none');
                
                // Store all players
                allPlayers = players;
                
                // Apply team filter if selected
                const teamFilter = document.getElementById('playerTeamFilter').value;
                if (teamFilter !== 'all') {
                    players = players.filter(player => player.team_id.toString() === teamFilter);
                }
                
                // Render players
                players.forEach(player => {
                    const row = createPlayerRow(player);
                    playersTableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Error loading players:', error);
                playersLoading.classList.add('d-none');
                noPlayersMessage.classList.remove('d-none');
                noPlayersMessage.textContent = 'Error loading players: ' + error.message;
            });
    }
    
    /**
     * Create a player table row
     * @param {Object} player - Player data
     * @returns {HTMLElement} The created table row
     */
    function createPlayerRow(player) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${player.name}</td>
            <td>${player.team_name}</td>
            <td><span class="position-badge">${player.position}</span></td>
            <td>${player.jersey_number}</td>
            <td>${player.height ? player.height + ' cm' : '-'}</td>
            <td>${player.weight ? player.weight + ' kg' : '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary edit-player-btn" data-id="${player.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger ms-1 delete-player-btn" data-id="${player.id}" data-name="${player.name}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        // Add event listeners
        row.querySelector('.edit-player-btn').addEventListener('click', function() {
            const playerId = this.getAttribute('data-id');
            openPlayerModal(playerId);
        });
        
        row.querySelector('.delete-player-btn').addEventListener('click', function() {
            const playerId = this.getAttribute('data-id');
            const playerName = this.getAttribute('data-name');
            openDeleteModal(playerId, playerName, 'player');
        });
        
        return row;
    }
    
    /**
     * Filter players by team
     */
    function filterPlayers() {
        const teamId = this.value;
        loadPlayers(currentTournament.id);
    }
    
    /**
     * Open the player modal for adding or editing
     * @param {number} playerId - Optional player ID for editing
     */
    function openPlayerModal(playerId = null) {
        const playerForm = document.getElementById('playerForm');
        const modalTitle = document.getElementById('playerModalLabel');
        const saveBtn = document.getElementById('savePlayerBtn');
        
        // Reset form
        playerForm.reset();
        document.getElementById('playerId').value = '';
        
        // Populate team dropdown
        updatePlayerTeamFilters();
        
        if (playerId) {
            // Editing existing player
            modalTitle.textContent = 'Edit Player';
            saveBtn.textContent = 'Update Player';
            
            // Show loading state
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Loading...';
            
            // Fetch player details
            fetch(`/api/player/${playerId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to load player details');
                    }
                    return response.json();
                })
                .then(player => {
                    // Populate form
                    document.getElementById('playerId').value = player.id;
                    document.getElementById('playerName').value = player.name;
                    document.getElementById('playerTeam').value = player.team_id;
                    document.getElementById('playerPosition').value = player.position;
                    document.getElementById('playerJerseyNumber').value = player.jersey_number;
                    
                    if (player.height) {
                        document.getElementById('playerHeight').value = player.height;
                    }
                    
                    if (player.weight) {
                        document.getElementById('playerWeight').value = player.weight;
                    }
                    
                    // Reset button state
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Update Player';
                })
                .catch(error => {
                    console.error('Error loading player:', error);
                    alert('Error loading player: ' + error.message);
                    playerModal.hide();
                });
        } else {
            // Adding new player
            modalTitle.textContent = 'Add Player';
            saveBtn.textContent = 'Add Player';
            
            // Pre-select team if filtered
            const teamFilter = document.getElementById('playerTeamFilter').value;
            if (teamFilter !== 'all') {
                document.getElementById('playerTeam').value = teamFilter;
            }
        }
        
        playerModal.show();
    }
    
    /**
     * Save or update a player
     */
    function savePlayer() {
        const playerId = document.getElementById('playerId').value;
        const isEditing = !!playerId;
        
        // Get form values
        const playerData = {
            name: document.getElementById('playerName').value,
            team_id: document.getElementById('playerTeam').value,
            position: document.getElementById('playerPosition').value,
            jersey_number: document.getElementById('playerJerseyNumber').value,
            height: document.getElementById('playerHeight').value || null,
            weight: document.getElementById('playerWeight').value || null
        };
        
        // Validate required fields
        if (!playerData.name || !playerData.team_id || !playerData.position || !playerData.jersey_number) {
            alert('Name, team, position, and jersey number are required');
            return;
        }
        
        // Show loading state
        const saveBtn = document.getElementById('savePlayerBtn');
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...';
        
        // Determine URL and method
        const url = isEditing ? 
            `/api/player/${playerId}` : 
            `/api/team/${playerData.team_id}/players`;
        
        const method = isEditing ? 'PUT' : 'POST';
        
        // Send request
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(playerData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save player');
                }
                return response.json();
            })
            .then(result => {
                // Close modal
                playerModal.hide();
                
                // Reload players
                loadPlayers(currentTournament.id);
                
                // Show success message
                alert(isEditing ? 'Player updated successfully' : 'Player added successfully');
            })
            .catch(error => {
                console.error('Error saving player:', error);
                alert('Error saving player: ' + error.message);
            })
            .finally(() => {
                // Reset button state
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            });
    }
    
    // =============================================
    // MATCHES MANAGEMENT
    // =============================================
    
    /**
     * Load matches for the tournament
     * @param {number} tournamentId - Tournament ID
     */
    function loadMatches(tournamentId) {
        const matchesLoading = document.getElementById('matchesLoading');
        const noMatchesMessage = document.getElementById('noMatchesMessage');
        const matchesTable = document.getElementById('matchesTable');
        const matchesTableBody = document.getElementById('matchesTableBody');
        const matchesCardContainer = document.getElementById('matchesCardContainer');
        
        if (!matchesTableBody || !matchesCardContainer) return;
        
        // Show loading state
        matchesLoading.classList.remove('d-none');
        noMatchesMessage.classList.add('d-none');
        matchesTableBody.innerHTML = '';
        matchesCardContainer.innerHTML = '';
        
        // Fetch matches
        fetch(`/api/tournament/${tournamentId}/matches`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load matches');
                }
                return response.json();
            })
            .then(matches => {
                // Hide loading state
                matchesLoading.classList.add('d-none');
                
                if (matches.length === 0) {
                    noMatchesMessage.classList.remove('d-none');
                    matchesTable.classList.add('d-none');
                    return;
                }
                
                // Show table
                matchesTable.classList.remove('d-none');
                
                // Store all matches
                allMatches = matches;
                
                // Update match filter in stats tab
                updateMatchFilter(matches);
                
                // Render matches in list view
                matches.forEach(match => {
                    const row = createMatchRow(match);
                    matchesTableBody.appendChild(row);
                    
                    const card = createMatchCard(match);
                    matchesCardContainer.appendChild(card);
                });
            })
            .catch(error => {
                console.error('Error loading matches:', error);
                matchesLoading.classList.add('d-none');
                noMatchesMessage.classList.remove('d-none');
                noMatchesMessage.textContent = 'Error loading matches: ' + error.message;
            });
    }
    
    /**
     * Update match filter in stats tab
     * @param {Array} matches - Matches data
     */
    function updateMatchFilter(matches) {
        const statMatchFilter = document.getElementById('statMatchFilter');
        if (!statMatchFilter) return;
        
        const currentValue = statMatchFilter.value;
        
        // Clear options
        statMatchFilter.innerHTML = '<option value="">Select Match</option>';
        
        // Add match options
        matches.forEach(match => {
            // Only include matches with scores
            if (match.has_score) {
                const matchDate = new Date(match.match_date);
                const dateStr = matchDate.toLocaleDateString();
                
                const option = document.createElement('option');
                option.value = match.id;
                option.textContent = `${match.team1_name} vs ${match.team2_name} (${dateStr})`;
                statMatchFilter.appendChild(option);
            }
        });
        
        // Try to restore previous selection
        if (currentValue) {
            const exists = Array.from(statMatchFilter.options).some(option => option.value === currentValue);
            statMatchFilter.value = exists ? currentValue : '';
        }
    }
    
    /**
     * Create a match table row
     * @param {Object} match - Match data
     * @returns {HTMLElement} The created table row
     */
    function createMatchRow(match) {
        const row = document.createElement('tr');
        const matchDate = new Date(match.match_date);
        
        let scoreDisplay = '-';
        if (match.has_score) {
            scoreDisplay = `${match.team1_score} - ${match.team2_score}`;
        }
        
        row.innerHTML = `
            <td>${matchDate.toLocaleString()}</td>
            <td>${match.team1_name}</td>
            <td>${match.team2_name}</td>
            <td><span class="score-display">${scoreDisplay}</span></td>
            <td>${match.venue_name || '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary edit-match-btn" data-id="${match.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger ms-1 delete-match-btn" data-id="${match.id}" 
                        data-name="${match.team1_name} vs ${match.team2_name}">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        
        // Add event listeners
        row.querySelector('.edit-match-btn').addEventListener('click', function() {
            const matchId = this.getAttribute('data-id');
            openMatchModal(matchId);
        });
        
        row.querySelector('.delete-match-btn').addEventListener('click', function() {
            const matchId = this.getAttribute('data-id');
            const matchName = this.getAttribute('data-name');
            openDeleteModal(matchId, matchName, 'match');
        });
        
        return row;
    }
    
    /**
     * Create a match card for calendar view
     * @param {Object} match - Match data
     * @returns {HTMLElement} The created card
     */
    function createMatchCard(match) {
        const col = document.createElement('div');
        col.className = 'col';
        
        const matchDate = new Date(match.match_date);
        
        let badgeClass1 = 'bg-secondary';
        let badgeClass2 = 'bg-secondary';
        
        if (match.has_score) {
            if (match.team1_score > match.team2_score) {
                badgeClass1 = 'bg-success';
                badgeClass2 = 'bg-danger';
            } else if (match.team2_score > match.team1_score) {
                badgeClass1 = 'bg-danger';
                badgeClass2 = 'bg-success';
            } else {
                badgeClass1 = 'bg-warning';
                badgeClass2 = 'bg-warning';
            }
        }
        
        col.innerHTML = `
            <div class="card match-card h-100" data-id="${match.id}">
                <div class="card-header bg-light">
                    <small class="match-date">${matchDate.toLocaleString()}</small>
                </div>
                <div class="card-body">
                    <div class="match-team">
                        <h6 class="card-title mb-0">${match.team1_name}</h6>
                        ${match.has_score ? `<span class="badge ${badgeClass1} match-score">${match.team1_score}</span>` : ''}
                    </div>
                    <div class="match-team">
                        <h6 class="card-title mb-0">${match.team2_name}</h6>
                        ${match.has_score ? `<span class="badge ${badgeClass2} match-score">${match.team2_score}</span>` : ''}
                    </div>
                </div>
                <div class="card-footer">
                    <small class="match-venue">${match.venue_name || 'No venue'}</small>
                </div>
            </div>
        `;
        
        // Add click event to edit match
        col.querySelector('.match-card').addEventListener('click', function() {
            const matchId = this.getAttribute('data-id');
            openMatchModal(matchId);
        });
        
        return col;
    }
    
    /**
     * Open the match modal for adding or editing
     * @param {number} matchId - Optional match ID for editing
     */
    function openMatchModal(matchId = null) {
        const matchForm = document.getElementById('matchForm');
        const modalTitle = document.getElementById('matchModalLabel');
        const saveBtn = document.getElementById('saveMatchBtn');
        const hasScoreCheckbox = document.getElementById('hasScore');
        const scoreContainer = document.getElementById('scoreContainer');
        
        // Reset form
        matchForm.reset();
        document.getElementById('matchId').value = '';
        scoreContainer.classList.add('d-none');
        
        // Populate team dropdowns
        updateMatchTeamDropdowns();
        
        if (matchId) {
            // Editing existing match
            modalTitle.textContent = 'Edit Match';
            saveBtn.textContent = 'Update Match';
            
            // Show loading state
            saveBtn.disabled = true;
            saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Loading...';
            
            // Fetch match details
            fetch(`/api/match/${matchId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to load match details');
                    }
                    return response.json();
                })
                .then(match => {
                    // Populate form
                    document.getElementById('matchId').value = match.id;
                    document.getElementById('matchTeam1').value = match.team1_id;
                    document.getElementById('matchTeam2').value = match.team2_id;
                    
                    // Format datetime for input
                    const matchDate = new Date(match.match_date);
                    const dateTimeStr = matchDate.toISOString().slice(0, 16);
                    document.getElementById('matchDate').value = dateTimeStr;
                    
                    document.getElementById('matchVenue').value = match.venue_name || '';
                    
                    // Handle score
                    hasScoreCheckbox.checked = match.has_score;
                    if (match.has_score) {
                        scoreContainer.classList.remove('d-none');
                        document.getElementById('team1Score').value = match.team1_score;
                        document.getElementById('team2Score').value = match.team2_score;
                    }
                    
                    // Reset button state
                    saveBtn.disabled = false;
                    saveBtn.textContent = 'Update Match';
                })
                .catch(error => {
                    console.error('Error loading match:', error);
                    alert('Error loading match: ' + error.message);
                    matchModal.hide();
                });
        } else {
            // Adding new match
            modalTitle.textContent = 'Add Match';
            saveBtn.textContent = 'Add Match';
            
            // Set default date to now
            const now = new Date();
            const dateTimeStr = now.toISOString().slice(0, 16);
            document.getElementById('matchDate').value = dateTimeStr;
        }
        
        matchModal.show();
    }
    
    /**
     * Toggle score inputs visibility based on checkbox
     */
    function toggleScoreInputs() {
        const scoreContainer = document.getElementById('scoreContainer');
        if (this.checked) {
            scoreContainer.classList.remove('d-none');
        } else {
            scoreContainer.classList.add('d-none');
        }
    }
    
    /**
     * Save or update a match
     */
    function saveMatch() {
        const matchId = document.getElementById('matchId').value;
        const isEditing = !!matchId;
        
        // Get form values
        const matchData = {
            team1_id: document.getElementById('matchTeam1').value,
            team2_id: document.getElementById('matchTeam2').value,
            match_date: document.getElementById('matchDate').value,
            venue_name: document.getElementById('matchVenue').value,
            remove_score: false
        };
        
        // Validate required fields
        if (!matchData.team1_id || !matchData.team2_id || !matchData.match_date) {
            alert('Teams and match date are required');
            return;
        }
        
        // Validate teams are different
        if (matchData.team1_id === matchData.team2_id) {
            alert('Team 1 and Team 2 cannot be the same');
            return;
        }
        
        // Handle score
        const hasScore = document.getElementById('hasScore').checked;
        if (hasScore) {
            const team1Score = document.getElementById('team1Score').value;
            const team2Score = document.getElementById('team2Score').value;
            
            if (!team1Score || !team2Score) {
                alert('Both scores are required');
                return;
            }
            
            matchData.team1_score = parseInt(team1Score);
            matchData.team2_score = parseInt(team2Score);
        } else if (isEditing) {
            // If editing and unchecking score, set flag to remove score
            matchData.remove_score = true;
        }
        
        // Show loading state
        const saveBtn = document.getElementById('saveMatchBtn');
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Saving...';
        
        // Determine URL and method
        const url = isEditing ? 
            `/api/match/${matchId}` : 
            `/api/tournament/${currentTournament.id}/matches`;
        
        const method = isEditing ? 'PUT' : 'POST';
        
        // Send request
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(matchData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save match');
                }
                return response.json();
            })
            .then(result => {
                // Close modal
                matchModal.hide();
                
                // Reload matches
                loadMatches(currentTournament.id);
                
                // Show success message
                alert(isEditing ? 'Match updated successfully' : 'Match added successfully');
            })
            .catch(error => {
                console.error('Error saving match:', error);
                alert('Error saving match: ' + error.message);
            })
            .finally(() => {
                // Reset button state
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            });
    }
    
    // =============================================
    // PLAYER STATISTICS MANAGEMENT
    // =============================================
    
    /**
     * Reset the player stats tab
     */
    function resetPlayerStatsTab() {
        const statsLoading = document.getElementById('statsLoading');
        const noStatsMessage = document.getElementById('noStatsMessage');
        const statsTable = document.getElementById('statsTable');
        const statsTableBody = document.getElementById('statsTableBody');
        
        if (!statsTableBody) return;
        
        // Show no stats message
        statsLoading.classList.add('d-none');
        noStatsMessage.classList.remove('d-none');
        statsTableBody.innerHTML = '';
        
        // Reset match filter to force selection
        const statMatchFilter = document.getElementById('statMatchFilter');
        if (statMatchFilter) {
            statMatchFilter.value = '';
        }
    }
    
    /**
     * Load player statistics for a match
     */
    function loadPlayerStats() {
        const matchId = this.value;
        if (!matchId) {
            resetPlayerStatsTab();
            return;
        }
        
        const statsLoading = document.getElementById('statsLoading');
        const noStatsMessage = document.getElementById('noStatsMessage');
        const statsTable = document.getElementById('statsTable');
        const statsTableBody = document.getElementById('statsTableBody');
        
        if (!statsTableBody) return;
        
        // Show loading state
        statsLoading.classList.remove('d-none');
        noStatsMessage.classList.add('d-none');
        statsTableBody.innerHTML = '';
        
        // Fetch stats
        fetch(`/api/match/${matchId}/stats`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load statistics');
                }
                return response.json();
            })
            .then(stats => {
                // Hide loading state
                statsLoading.classList.add('d-none');
                
                // Get the match to find participating teams and players
                const match = allMatches.find(m => m.id.toString() === matchId);
                if (!match) {
                    noStatsMessage.classList.remove('d-none');
                    noStatsMessage.textContent = 'Match not found';
                    return;
                }
                
                // Find teams for this match
                const team1 = allTeams.find(t => t.id === match.team1_id);
                const team2 = allTeams.find(t => t.id === match.team2_id);
                if (!team1 || !team2) {
                    noStatsMessage.classList.remove('d-none');
                    noStatsMessage.textContent = 'Teams not found for this match';
                    return;
                }
                
                // If we have no stats, create empty stats for players in these teams
                if (stats.length === 0) {
                    // Need to load all players for these teams
                    Promise.all([
                        fetch(`/api/team/${team1.id}/players`).then(res => res.json()),
                        fetch(`/api/team/${team2.id}/players`).then(res => res.json())
                    ])
                        .then(([team1Players, team2Players]) => {
                            const players = [...team1Players, ...team2Players];
                            
                            if (players.length === 0) {
                                noStatsMessage.classList.remove('d-none');
                                noStatsMessage.textContent = 'No players found for these teams';
                                return;
                            }
                            
                            // Filter based on team if selected
                            const teamFilter = document.getElementById('statTeamFilter').value;
                            let filteredPlayers = players;
                            
                            if (teamFilter !== 'all') {
                                filteredPlayers = players.filter(p => p.team_id.toString() === teamFilter);
                            }
                            
                            // Render empty stats rows
                            filteredPlayers.forEach(player => {
                                const row = createEmptyStatsRow(player, matchId);
                                statsTableBody.appendChild(row);
                            });
                        })
                        .catch(error => {
                            console.error('Error loading players for stats:', error);
                            noStatsMessage.classList.remove('d-none');
                            noStatsMessage.textContent = 'Error loading players: ' + error.message;
                        });
                } else {
                    // We have stats, display them
                    
                    // Filter based on team if selected
                    const teamFilter = document.getElementById('statTeamFilter').value;
                    let filteredStats = stats;
                    
                    if (teamFilter !== 'all') {
                        filteredStats = stats.filter(s => s.team_id.toString() === teamFilter);
                    }
                    
                    if (filteredStats.length === 0) {
                        noStatsMessage.classList.remove('d-none');
                        noStatsMessage.textContent = 'No statistics found for the selected team';
                        return;
                    }
                    
                    // Render stats rows
                    filteredStats.forEach(stat => {
                        const row = createStatsRow(stat);
                        statsTableBody.appendChild(row);
                    });
                }
            })
            .catch(error => {
                console.error('Error loading statistics:', error);
                statsLoading.classList.add('d-none');
                noStatsMessage.classList.remove('d-none');
                noStatsMessage.textContent = 'Error loading statistics: ' + error.message;
            });
    }
    
    /**
     * Filter player statistics based on team
     */
    function filterPlayerStats() {
        // Re-fetch stats with the current match and new team filter
        const matchId = document.getElementById('statMatchFilter').value;
        if (matchId) {
            loadPlayerStats.call({ value: matchId });
        }
    }
    
    /**
     * Create a player statistics row
     * @param {Object} stat - Statistics data
     * @returns {HTMLElement} The created table row
     */
    function createStatsRow(stat) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${stat.player_name}</td>
            <td>${stat.team_name}</td>
            <td><input type="number" class="form-control stat-input" value="${stat.points}" min="0" data-field="points"></td>
            <td><input type="number" class="form-control stat-input" value="${stat.rebounds}" min="0" data-field="rebounds"></td>
            <td><input type="number" class="form-control stat-input" value="${stat.assists}" min="0" data-field="assists"></td>
            <td><input type="number" class="form-control stat-input" value="${stat.steals}" min="0" data-field="steals"></td>
            <td><input type="number" class="form-control stat-input" value="${stat.blocks}" min="0" data-field="blocks"></td>
            <td><input type="number" class="form-control stat-input" value="${stat.turnovers}" min="0" data-field="turnovers"></td>
            <td><input type="number" class="form-control stat-input" value="${stat.three_pointers}" min="0" data-field="three_pointers"></td>
            <td>${stat.efficiency}</td>
            <td><span class="badge ${stat.double_double ? 'bg-success' : 'bg-secondary'} stat-badge">${stat.double_double ? 'Yes' : 'No'}</span></td>
            <td><span class="badge ${stat.triple_double ? 'bg-success' : 'bg-secondary'} stat-badge">${stat.triple_double ? 'Yes' : 'No'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-success save-stats-btn" data-player-id="${stat.player_id}" data-match-id="${stat.match_id}">
                    <i class="fas fa-save"></i>
                </button>
            </td>
        `;
        
        // Add save event listener
        row.querySelector('.save-stats-btn').addEventListener('click', function() {
            const playerId = this.getAttribute('data-player-id');
            const matchId = this.getAttribute('data-match-id');
            const inputs = row.querySelectorAll('.stat-input');
            
            // Collect values
            const statsData = {};
            inputs.forEach(input => {
                statsData[input.getAttribute('data-field')] = parseInt(input.value) || 0;
            });
            
            // Save stats
            updatePlayerStatsForMatch(playerId, matchId, statsData, this);
        });
        
        return row;
    }
    
    /**
     * Create an empty player statistics row
     * @param {Object} player - Player data
     * @param {number} matchId - Match ID
     * @returns {HTMLElement} The created table row
     */
    function createEmptyStatsRow(player, matchId) {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${player.name}</td>
            <td>${player.team_name || 'Team'}</td>
            <td><input type="number" class="form-control stat-input" value="0" min="0" data-field="points"></td>
            <td><input type="number" class="form-control stat-input" value="0" min="0" data-field="rebounds"></td>
            <td><input type="number" class="form-control stat-input" value="0" min="0" data-field="assists"></td>
            <td><input type="number" class="form-control stat-input" value="0" min="0" data-field="steals"></td>
            <td><input type="number" class="form-control stat-input" value="0" min="0" data-field="blocks"></td>
            <td><input type="number" class="form-control stat-input" value="0" min="0" data-field="turnovers"></td>
            <td><input type="number" class="form-control stat-input" value="0" min="0" data-field="three_pointers"></td>
            <td>0</td>
            <td><span class="badge bg-secondary stat-badge">No</span></td>
            <td><span class="badge bg-secondary stat-badge">No</span></td>
            <td>
                <button class="btn btn-sm btn-outline-success save-stats-btn" data-player-id="${player.id}" data-match-id="${matchId}">
                    <i class="fas fa-save"></i>
                </button>
            </td>
        `;
        
        // Add save event listener
        row.querySelector('.save-stats-btn').addEventListener('click', function() {
            const playerId = this.getAttribute('data-player-id');
            const matchId = this.getAttribute('data-match-id');
            const inputs = row.querySelectorAll('.stat-input');
            
            // Collect values
            const statsData = {};
            inputs.forEach(input => {
                statsData[input.getAttribute('data-field')] = parseInt(input.value) || 0;
            });
            
            // Create new stats
            createPlayerStatsForMatch(playerId, matchId, statsData, this);
        });
        
        return row;
    }
    
    /**
     * Create new player statistics for a match
     * @param {number} playerId - Player ID
     * @param {number} matchId - Match ID
     * @param {Object} statsData - Statistics data
     * @param {HTMLElement} button - Button element for loading state
     */
    function createPlayerStatsForMatch(playerId, matchId, statsData, button) {
        // Show loading state
        const originalHTML = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        
        // Send request
        fetch(`/api/match/${matchId}/stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player_id: playerId,
                ...statsData
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save statistics');
                }
                return response.json();
            })
            .then(result => {
                // Reload stats to get calculated fields
                loadPlayerStats.call({ value: matchId });
                
                // Show success indicator briefly
                button.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    button.disabled = false;
                    button.innerHTML = originalHTML;
                }, 1000);
            })
            .catch(error => {
                console.error('Error saving statistics:', error);
                alert('Error saving statistics: ' + error.message);
                
                // Reset button
                button.disabled = false;
                button.innerHTML = originalHTML;
            });
    }
    
    /**
     * Update existing player statistics for a match
     * @param {number} playerId - Player ID
     * @param {number} matchId - Match ID
     * @param {Object} statsData - Statistics data
     * @param {HTMLElement} button - Button element for loading state
     */
    function updatePlayerStatsForMatch(playerId, matchId, statsData, button) {
        // Show loading state
        const originalHTML = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
        
        // Send request
        fetch(`/api/player/${playerId}/stats/${matchId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(statsData)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to update statistics');
                }
                return response.json();
            })
            .then(result => {
                // Reload stats to get calculated fields
                loadPlayerStats.call({ value: matchId });
                
                // Show success indicator briefly
                button.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    button.disabled = false;
                    button.innerHTML = originalHTML;
                }, 1000);
            })
            .catch(error => {
                console.error('Error updating statistics:', error);
                alert('Error updating statistics: ' + error.message);
                
                // Reset button
                button.disabled = false;
                button.innerHTML = originalHTML;
            });
    }
});