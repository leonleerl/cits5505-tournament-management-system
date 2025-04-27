// Global data containers for dynamic content
let teams = [];
let players = [];
let stadiums = [];
let seasons = [];
let tournaments = [];

// Object to track form validation states
const formValidation = {
    tournament: {
        tournamentName: false,
        tournamentYear: false,
        startDate: false,
        endDate: false
    },
    team: {
        teamName: false,
        createdYear: false
    },
    player: {
        playerName: false,
        playerTeam: false,
        playerHeight: false,
        playerWeight: false,
        playerPosition: false,
        jerseyNumber: false
    },
    match: {
        matchDate: false,
        stadiumSelect: false,
        team1Select: false,
        team2Select: false,
        team1Score: false,
        team2Score: false
    },
    batch: {
        dataType: false,
        csvFile: false
    }
};

// Form references
const forms = {};

// Initialise page when DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    // Get references to all forms
    forms.tournament = document.getElementById("tournamentForm");
    forms.team = document.getElementById("teamForm");
    forms.player = document.getElementById("playerForm");
    forms.match = document.getElementById("matchForm");
    forms.batch = document.getElementById("batchUploadForm");
    
    // Load data for dropdowns
    loadFormData();
    
    // Setup form validation and submission
    setupFormHandlers();
    
    // Setup tab change handler to reset notifications
    setupTabChangeHandler();
    
    // Setup file input handlers
    setupFileInputHandlers();
});

// Load data from the database for forms
function loadFormData() {
    fetch("./db.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response error: " + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            teams = data.teams || [];
            players = data.players || [];
            stadiums = data.stadiums || [];
            seasons = data.seasons || [];
            
            // Populate dropdowns with data
            populateTeamDropdowns();
            populateStadiumDropdown();
            
            console.log("Data loaded successfully:", {
                teams: teams.length,
                players: players.length,
                stadiums: stadiums.length,
                seasons: seasons.length
            });
        })
        .catch(error => {
            console.error("Error loading data:", error);
            showNotification("Failed to load data for forms. Some features may not work correctly.", "danger", null);
        });
}

// Populate team selection dropdowns
function populateTeamDropdowns() {
    const teamSelectors = [
        document.getElementById("playerTeam"),
        document.getElementById("team1Select"),
        document.getElementById("team2Select")
    ];
    
    teamSelectors.forEach(selector => {
        if (!selector) return;
        
        // Keep the first default option
        const defaultOption = selector.querySelector("option[value='']");
        selector.innerHTML = "";
        if (defaultOption) {
            selector.appendChild(defaultOption);
        }
        
        // Add team options
        teams.forEach(team => {
            const option = document.createElement("option");
            option.value = team.id;
            option.textContent = team.name;
            selector.appendChild(option);
        });
    });
}

// Populate stadium dropdown
function populateStadiumDropdown() {
    const stadiumSelect = document.getElementById("stadiumSelect");
    if (!stadiumSelect) return;
    
    // Keep the first default option
    const defaultOption = stadiumSelect.querySelector("option[value='']");
    stadiumSelect.innerHTML = "";
    if (defaultOption) {
        stadiumSelect.appendChild(defaultOption);
    }
    
    // Add stadium options
    stadiums.forEach(stadium => {
        const option = document.createElement("option");
        option.value = stadium.id;
        option.textContent = stadium.name;
        stadiumSelect.appendChild(option);
    });
}

// Setup form validation and submission handlers
function setupFormHandlers() {
    // Tournament form
    if (forms.tournament) {
        // Add validation listeners
        document.getElementById("tournamentName").addEventListener("blur", validateTournamentField);
        document.getElementById("tournamentYear").addEventListener("blur", validateTournamentField);
        document.getElementById("startDate").addEventListener("change", function(e) {
            validateTournamentField(e);
            validateDateRange(); // Check date range whenever start date changes
        });
        document.getElementById("endDate").addEventListener("change", function(e) {
            validateTournamentField(e);
            validateDateRange(); // Check date range whenever end date changes
        });
        
        // Form submission
        forms.tournament.addEventListener("submit", function(event) {
            event.preventDefault();
            handleTournamentSubmit();
        });
    }
    
    // Team form
    if (forms.team) {
        // Add validation listeners
        document.getElementById("teamName").addEventListener("blur", validateTeamField);
        document.getElementById("createdYear").addEventListener("blur", validateTeamField);
        
        // Form submission
        forms.team.addEventListener("submit", function(event) {
            event.preventDefault();
            handleTeamSubmit();
        });
    }
    
    // Player form
    if (forms.player) {
        // Add validation listeners
        document.getElementById("playerName").addEventListener("blur", validatePlayerField);
        document.getElementById("playerTeam").addEventListener("change", validatePlayerField);
        document.getElementById("playerHeight").addEventListener("blur", validatePlayerField);
        document.getElementById("playerWeight").addEventListener("blur", validatePlayerField);
        document.getElementById("playerPosition").addEventListener("change", validatePlayerField);
        document.getElementById("jerseyNumber").addEventListener("blur", validatePlayerField);
        
        // Form submission
        forms.player.addEventListener("submit", function(event) {
            event.preventDefault();
            handlePlayerSubmit();
        });
    }
    
    // Match form
    if (forms.match) {
        // Add validation listeners
        document.getElementById("matchDate").addEventListener("change", validateMatchField);
        document.getElementById("stadiumSelect").addEventListener("change", validateMatchField);
        document.getElementById("team1Select").addEventListener("change", function(e) {
            validateMatchField(e);
            validateTeamSelection(); // Ensure teams are different
        });
        document.getElementById("team2Select").addEventListener("change", function(e) {
            validateMatchField(e);
            validateTeamSelection(); // Ensure teams are different
        });
        document.getElementById("team1Score").addEventListener("blur", validateMatchField);
        document.getElementById("team2Score").addEventListener("blur", validateMatchField);
        
        // Form submission
        forms.match.addEventListener("submit", function(event) {
            event.preventDefault();
            handleMatchSubmit();
        });
    }
    
    // Batch upload form
    if (forms.batch) {
        // Add validation listeners
        document.getElementById("dataType").addEventListener("change", validateBatchField);
        document.getElementById("csvFile").addEventListener("change", validateBatchField);
        
        // Form submission
        forms.batch.addEventListener("submit", function(event) {
            event.preventDefault();
            handleBatchSubmit();
        });
    }
}

// Handle tab change to reset notifications
function setupTabChangeHandler() {
    const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"]');
    tabButtons.forEach(button => {
        button.addEventListener('shown.bs.tab', function(event) {
            // Remove any existing notifications when switching tabs
            document.querySelectorAll('.alert').forEach(alert => {
                alert.remove();
            });
        });
    });
}

// Setup file input preview handlers
function setupFileInputHandlers() {
    // Team logo preview
    setupImagePreview("teamLogo", "team-logo-preview");
    
    // Player photo preview
    setupImagePreview("playerPhoto", "player-photo-preview");
    
    // CSV file validation
    const csvFileInput = document.getElementById("csvFile");
    if (csvFileInput) {
        csvFileInput.addEventListener("change", function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            // Check file extension
            const fileExt = file.name.split('.').pop().toLowerCase();
            if (fileExt !== 'csv') {
                showValidationFeedback(csvFileInput, false, "Please select a CSV file");
                return;
            }
            
            showValidationFeedback(csvFileInput, true);
        });
    }
}

// Setup image preview functionality
function setupImagePreview(inputId, previewContainerId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    input.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Validate file is an image
        if (!file.type.match('image.*')) {
            showValidationFeedback(input, false, "Please select an image file");
            return;
        }
        
        // Create or get the preview container
        let previewContainer = document.getElementById(previewContainerId);
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = previewContainerId;
            previewContainer.className = 'mt-2 text-center';
            input.parentNode.appendChild(previewContainer);
        }
        
        // Clear previous preview
        previewContainer.innerHTML = '';
        
        // Create image preview
        const img = document.createElement('img');
        img.className = 'img-thumbnail';
        img.style.maxHeight = '150px';
        previewContainer.appendChild(img);
        
        // Show the image preview
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        showValidationFeedback(input, true);
    });
}

// Validate tournament form fields
function validateTournamentField(event) {
    const field = event.target;
    const fieldId = field.id;
    
    removeValidationFeedback(field);
    
    switch (fieldId) {
        case "tournamentName":
            if (field.value.trim() === "") {
                showValidationFeedback(field, false, "Tournament name is required");
                formValidation.tournament.tournamentName = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.tournament.tournamentName = true;
            }
            break;
            
        case "tournamentYear":
            const year = parseInt(field.value);
            const currentYear = new Date().getFullYear();
            
            if (isNaN(year) || year < currentYear || year > currentYear + 10) {
                showValidationFeedback(field, false, `Year must be between ${currentYear} and ${currentYear + 10}`);
                formValidation.tournament.tournamentYear = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.tournament.tournamentYear = true;
            }
            break;
            
        case "startDate":
            if (field.value === "") {
                showValidationFeedback(field, false, "Start date is required");
                formValidation.tournament.startDate = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.tournament.startDate = true;
            }
            break;
            
        case "endDate":
            if (field.value === "") {
                showValidationFeedback(field, false, "End date is required");
                formValidation.tournament.endDate = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.tournament.endDate = true;
            }
            break;
    }
}

// Validate date range (start date must be before end date)
function validateDateRange() {
    const startDateInput = document.getElementById("startDate");
    const endDateInput = document.getElementById("endDate");
    
    if (!startDateInput || !endDateInput || !startDateInput.value || !endDateInput.value) {
        return;
    }
    
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    
    if (startDate > endDate) {
        showValidationFeedback(endDateInput, false, "End date must be after start date");
        formValidation.tournament.endDate = false;
    } else {
        showValidationFeedback(endDateInput, true);
        formValidation.tournament.endDate = true;
    }
}

// Validate team form fields
function validateTeamField(event) {
    const field = event.target;
    const fieldId = field.id;
    
    removeValidationFeedback(field);
    
    switch (fieldId) {
        case "teamName":
            if (field.value.trim() === "") {
                showValidationFeedback(field, false, "Team name is required");
                formValidation.team.teamName = false;
            } else if (teams.some(team => team.name.toLowerCase() === field.value.trim().toLowerCase())) {
                showValidationFeedback(field, false, "Team name already exists");
                formValidation.team.teamName = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.team.teamName = true;
            }
            break;
            
        case "createdYear":
            const year = parseInt(field.value);
            const currentYear = new Date().getFullYear();
            
            if (isNaN(year) || year < 1900 || year > currentYear) {
                showValidationFeedback(field, false, `Year must be between 1900 and ${currentYear}`);
                formValidation.team.createdYear = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.team.createdYear = true;
            }
            break;
    }
}

// Validate player form fields
function validatePlayerField(event) {
    const field = event.target;
    const fieldId = field.id;
    
    removeValidationFeedback(field);
    
    switch (fieldId) {
        case "playerName":
            if (field.value.trim() === "") {
                showValidationFeedback(field, false, "Player name is required");
                formValidation.player.playerName = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.player.playerName = true;
            }
            break;
            
        case "playerTeam":
            if (field.value === "") {
                showValidationFeedback(field, false, "Please select a team");
                formValidation.player.playerTeam = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.player.playerTeam = true;
            }
            break;
            
        case "playerHeight":
            const height = parseInt(field.value);
            if (isNaN(height) || height < 150 || height > 250) {
                showValidationFeedback(field, false, "Height must be between 150cm and 250cm");
                formValidation.player.playerHeight = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.player.playerHeight = true;
            }
            break;
            
        case "playerWeight":
            const weight = parseInt(field.value);
            if (isNaN(weight) || weight < 50 || weight > 150) {
                showValidationFeedback(field, false, "Weight must be between 50kg and 150kg");
                formValidation.player.playerWeight = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.player.playerWeight = true;
            }
            break;
            
        case "playerPosition":
            if (field.value === "") {
                showValidationFeedback(field, false, "Please select a position");
                formValidation.player.playerPosition = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.player.playerPosition = true;
            }
            break;
            
        case "jerseyNumber":
            const number = parseInt(field.value);
            if (isNaN(number) || number < 0 || number > 99) {
                showValidationFeedback(field, false, "Jersey number must be between 0 and 99");
                formValidation.player.jerseyNumber = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.player.jerseyNumber = true;
            }
            break;
    }
}

// Validate match form fields
function validateMatchField(event) {
    const field = event.target;
    const fieldId = field.id;
    
    removeValidationFeedback(field);
    
    switch (fieldId) {
        case "matchDate":
            if (field.value === "") {
                showValidationFeedback(field, false, "Match date is required");
                formValidation.match.matchDate = false;
            } else {
                const matchDate = new Date(field.value);
                const now = new Date();
                
                if (matchDate < now) {
                    showValidationFeedback(field, false, "Match date cannot be in the past");
                    formValidation.match.matchDate = false;
                } else {
                    showValidationFeedback(field, true);
                    formValidation.match.matchDate = true;
                }
            }
            break;
            
        case "stadiumSelect":
            if (field.value === "") {
                showValidationFeedback(field, false, "Please select a stadium");
                formValidation.match.stadiumSelect = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.match.stadiumSelect = true;
            }
            break;
            
        case "team1Select":
            if (field.value === "") {
                showValidationFeedback(field, false, "Please select home team");
                formValidation.match.team1Select = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.match.team1Select = true;
            }
            break;
            
        case "team2Select":
            if (field.value === "") {
                showValidationFeedback(field, false, "Please select away team");
                formValidation.match.team2Select = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.match.team2Select = true;
            }
            break;
            
        case "team1Score":
            const score1 = parseInt(field.value);
            if (isNaN(score1) || score1 < 0) {
                showValidationFeedback(field, false, "Score must be a positive number");
                formValidation.match.team1Score = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.match.team1Score = true;
            }
            break;
            
        case "team2Score":
            const score2 = parseInt(field.value);
            if (isNaN(score2) || score2 < 0) {
                showValidationFeedback(field, false, "Score must be a positive number");
                formValidation.match.team2Score = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.match.team2Score = true;
            }
            break;
    }
}

// Validate that home and away teams are different
function validateTeamSelection() {
    const team1Select = document.getElementById("team1Select");
    const team2Select = document.getElementById("team2Select");
    
    if (!team1Select || !team2Select || team1Select.value === "" || team2Select.value === "") {
        return;
    }
    
    if (team1Select.value === team2Select.value) {
        showValidationFeedback(team2Select, false, "Home and away teams must be different");
        formValidation.match.team2Select = false;
    } else {
        showValidationFeedback(team2Select, true);
        formValidation.match.team2Select = true;
    }
}

// Validate batch upload fields
function validateBatchField(event) {
    const field = event.target;
    const fieldId = field.id;
    
    removeValidationFeedback(field);
    
    switch (fieldId) {
        case "dataType":
            if (field.value === "") {
                showValidationFeedback(field, false, "Please select a data type");
                formValidation.batch.dataType = false;
            } else {
                showValidationFeedback(field, true);
                formValidation.batch.dataType = true;
            }
            break;
            
        case "csvFile":
            if (!field.files || field.files.length === 0) {
                showValidationFeedback(field, false, "Please select a CSV file");
                formValidation.batch.csvFile = false;
            } else {
                const file = field.files[0];
                const fileExt = file.name.split('.').pop().toLowerCase();
                
                if (fileExt !== 'csv') {
                    showValidationFeedback(field, false, "File must be in CSV format");
                    formValidation.batch.csvFile = false;
                } else {
                    showValidationFeedback(field, true);
                    formValidation.batch.csvFile = true;
                }
            }
            break;
    }
}

// Handle tournament form submission
function handleTournamentSubmit() {
    // Validate all fields
    const tournamentName = document.getElementById("tournamentName");
    const tournamentYear = document.getElementById("tournamentYear");
    const startDate = document.getElementById("startDate");
    const endDate = document.getElementById("endDate");
    
    validateTournamentField({ target: tournamentName });
    validateTournamentField({ target: tournamentYear });
    validateTournamentField({ target: startDate });
    validateTournamentField({ target: endDate });
    validateDateRange();
    
    // Check if all fields are valid
    const isFormValid = Object.values(formValidation.tournament).every(value => value === true);
    
    if (!isFormValid) {
        showNotification("Please correct the errors in the form before submitting.", "danger", forms.tournament);
        return;
    }
    
    // Prepare tournament data
    const tournamentData = {
        id: tournaments.length + 1,
        name: tournamentName.value.trim(),
        year: parseInt(tournamentYear.value),
        description: document.getElementById("tournamentDescription").value.trim(),
        startDate: startDate.value,
        endDate: endDate.value,
        status: 0 // 0 = Upcoming, 1 = Active, 2 = Completed
    };
    
    // Simulate API submission
    console.log("Tournament data ready for submission:", tournamentData);
    
    // Show success notification
    showNotification("Tournament created successfully!", "success", forms.tournament);
    
    // Reset form
    forms.tournament.reset();
    resetValidationStyles(forms.tournament);
}

// Handle team form submission
function handleTeamSubmit() {
    // Validate all fields
    const teamName = document.getElementById("teamName");
    const createdYear = document.getElementById("createdYear");
    
    validateTeamField({ target: teamName });
    validateTeamField({ target: createdYear });
    
    // Check if all fields are valid
    const isFormValid = Object.values(formValidation.team).every(value => value === true);
    
    if (!isFormValid) {
        showNotification("Please correct the errors in the form before submitting.", "danger", forms.team);
        return;
    }
    
    // Prepare team data
    const teamData = {
        id: teams.length + 1,
        name: teamName.value.trim(),
        description: document.getElementById("teamDescription").value.trim(),
        createdYear: parseInt(createdYear.value),
        wins: 0,
        losses: 0,
        points: 0
    };
    
    // Simulate API submission
    console.log("Team data ready for submission:", teamData);
    
    // Show success notification
    showNotification("Team registered successfully!", "success", forms.team);
    
    // Reset form
    forms.team.reset();
    resetValidationStyles(forms.team);
    
    // Clear image preview if exists
    const previewContainer = document.getElementById("team-logo-preview");
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
}

// Handle player form submission
function handlePlayerSubmit() {
    // Validate all fields
    const playerName = document.getElementById("playerName");
    const playerTeam = document.getElementById("playerTeam");
    const playerHeight = document.getElementById("playerHeight");
    const playerWeight = document.getElementById("playerWeight");
    const playerPosition = document.getElementById("playerPosition");
    const jerseyNumber = document.getElementById("jerseyNumber");
    
    validatePlayerField({ target: playerName });
    validatePlayerField({ target: playerTeam });
    validatePlayerField({ target: playerHeight });
    validatePlayerField({ target: playerWeight });
    validatePlayerField({ target: playerPosition });
    validatePlayerField({ target: jerseyNumber });
    
    // Check if all fields are valid
    const isFormValid = Object.values(formValidation.player).every(value => value === true);
    
    if (!isFormValid) {
        showNotification("Please correct the errors in the form before submitting.", "danger", forms.player);
        return;
    }
    
    // Prepare player data
    const playerData = {
        id: players.length + 1,
        name: playerName.value.trim(),
        height: parseInt(playerHeight.value),
        weight: parseInt(playerWeight.value),
        teamId: parseInt(playerTeam.value),
        position: playerPosition.value,
        jerseyNumber: parseInt(jerseyNumber.value)
    };
    
    // Simulate API submission
    console.log("Player data ready for submission:", playerData);
    
    // Show success notification
    showNotification("Player added successfully!", "success", forms.player);
    
    // Reset form
    forms.player.reset();
    resetValidationStyles(forms.player);
    
    // Clear image preview if exists
    const previewContainer = document.getElementById("player-photo-preview");
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }
}

// Handle match form submission
function handleMatchSubmit() {
    // Validate all fields
    const matchDate = document.getElementById("matchDate");
    const stadiumSelect = document.getElementById("stadiumSelect");
    const team1Select = document.getElementById("team1Select");
    const team2Select = document.getElementById("team2Select");
    const team1Score = document.getElementById("team1Score");
    const team2Score = document.getElementById("team2Score");
    
    validateMatchField({ target: matchDate });
    validateMatchField({ target: stadiumSelect });
    validateMatchField({ target: team1Select });
    validateMatchField({ target: team2Select });
    validateMatchField({ target: team1Score });
    validateMatchField({ target: team2Score });
    validateTeamSelection();
    
    // Check if all fields are valid
    const isFormValid = Object.values(formValidation.match).every(value => value === true);
    
    if (!isFormValid) {
        showNotification("Please correct the errors in the form before submitting.", "danger", forms.match);
        return;
    }
    
    // Prepare match data
    const matchData = {
        id: Math.max(...matches.map(m => m.id), 0) + 1,
        team1_id: parseInt(team1Select.value),
        team2_id: parseInt(team2Select.value),
        status: 2, // 0 = Scheduled, 1 = In Progress, 2 = Completed
        match_date: matchDate.value,
        season_id: 1, // Default to current season
        stadium_id: parseInt(stadiumSelect.value),
        creator_id: 1 // Default admin
    };
    
    // Prepare score data
    const scoreData = {
        id: Math.max(...scores.map(s => s.id), 0) + 1,
        match_id: matchData.id,
        team1_score: parseInt(team1Score.value),
        team2_score: parseInt(team2Score.value)
    };
    
    // Simulate API submission
    console.log("Match data ready for submission:", { match: matchData, score: scoreData });
    
    // Show success notification
    showNotification("Match results saved successfully!", "success", forms.match);
    
    // Reset form
    forms.match.reset();
    resetValidationStyles(forms.match);
}

// Handle batch upload form submission
function handleBatchSubmit() {
    // Validate all fields
    const dataType = document.getElementById("dataType");
    const csvFile = document.getElementById("csvFile");
    
    validateBatchField({ target: dataType });
    validateBatchField({ target: csvFile });
    
    // Check if all fields are valid
    const isFormValid = Object.values(formValidation.batch).every(value => value === true);
    
    if (!isFormValid) {
        showNotification("Please correct the errors in the form before submitting.", "danger", forms.batch);
        return;
    }
    
    // In a real application, you would read and parse the CSV file here
    console.log("Processing CSV upload for:", dataType.value);
    
    // Simulate processing time
    showNotification("Processing file...", "info", forms.batch);
    
    setTimeout(() => {
        // Show success notification
        showNotification("Data uploaded successfully! Processed " + Math.floor(Math.random() * 50 + 10) + " records.", "success", forms.batch);
        
        // Reset form
        forms.batch.reset();
        resetValidationStyles(forms.batch);
    }, 1500);
}

// Show validation feedback under an input field
function showValidationFeedback(inputElement, isValid, message = "") {
    // Add the appropriate Bootstrap validation class
    inputElement.classList.remove(isValid ? "is-invalid" : "is-valid");
    inputElement.classList.add(isValid ? "is-valid" : "is-invalid");
    
    // Add or update feedback message for invalid inputs
    if (!isValid && message) {
        // Find existing feedback element or create new one
        let feedbackElement = inputElement.nextElementSibling;
        if (!feedbackElement || !feedbackElement.classList.contains("invalid-feedback")) {
            feedbackElement = document.createElement("div");
            feedbackElement.className = "invalid-feedback";
            inputElement.parentNode.insertBefore(feedbackElement, inputElement.nextSibling);
        }
        feedbackElement.textContent = message;
    }
}

// Remove validation feedback
function removeValidationFeedback(inputElement) {
    inputElement.classList.remove("is-valid", "is-invalid");
    
    // Remove any existing feedback elements
    const feedbackElement = inputElement.nextElementSibling;
    if (feedbackElement && feedbackElement.classList.contains("invalid-feedback")) {
        feedbackElement.remove();
    }
}

// Reset all validation styles in a form
function resetValidationStyles(form) {
    form.querySelectorAll('.is-valid, .is-invalid').forEach(element => {
        element.classList.remove('is-valid', 'is-invalid');
    });
    
    form.querySelectorAll('.invalid-feedback, .valid-feedback').forEach(element => {
        element.remove();
    });
}

// Show notification alert
function showNotification(message, type = "info", targetForm = null) {
    // Create notification element
    const notificationElement = document.createElement("div");
    notificationElement.className = `alert alert-${type} alert-dismissible fade show`;
    notificationElement.setAttribute("role", "alert");
    
    // Add content
    notificationElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insert at the top of the form or container
    if (targetForm) {
        targetForm.parentNode.insertBefore(notificationElement, targetForm);
    } else {
        // Insert at top of the main container if no specific target
        const container = document.querySelector('.container');
        if (container) {
            container.insertBefore(notificationElement, container.firstChild);
        }
    }
    
    // Auto remove after 5 seconds for success messages
    if (type === "success" || type === "info") {
        setTimeout(() => {
            notificationElement.classList.remove("show");
            setTimeout(() => {
                notificationElement.remove();
            }, 150);
        }, 5000);
    }
}