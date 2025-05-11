/**
 * Tournament Upload JavaScript
 * Handles client-side validation and interaction for the tournament upload feature
 */
document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const uploadForm = document.querySelector('form');
    const fileInput = document.getElementById('file');
    const confirmCheck = document.getElementById('confirmCheck');
    const submitButton = document.querySelector('input[type="submit"]');
    const fileInfoText = document.querySelector('.form-text');
   
    // Size limits
    const maxFileSize = 10 * 1024 * 1024; // 10MB
   
    // File selection handler
    if (fileInput) {
        fileInput.addEventListener('change', function(event) {
            validateFile();
        });
    }
   
    // Form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(event) {
            // Validate file size (WTForms handles other validations)
            if (!validateFileSize()) {
                event.preventDefault();
                return false;
            }
           
            // Show loading state
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.value = 'Uploading...';
               
                // Add a spinner icon next to the button
                const spinner = document.createElement('span');
                spinner.className = 'spinner-border spinner-border-sm me-2';
                spinner.setAttribute('role', 'status');
                spinner.setAttribute('aria-hidden', 'true');
                submitButton.parentNode.insertBefore(spinner, submitButton);
            }
        });
    }
   
    // File validation function - only check size since WTForms handles type validation
    function validateFileSize() {
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            return true; // WTForms will handle the empty file case
        }
       
        const file = fileInput.files[0];
       
        // Validate file size
        if (file.size > maxFileSize) {
            showValidationError(fileInput, `File size exceeds maximum limit of ${maxFileSize / 1024 / 1024}MB`);
            return false;
        }
       
        // Update file info text
        if (fileInfoText) {
            fileInfoText.innerHTML = `Selected file: <strong>${file.name}</strong> (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        }
       
        return true;
    }
   
    // Update file info when a file is selected
    function validateFile() {
        validateFileSize();
    }
   
    // Show validation error
    function showValidationError(element, message) {
        // Add invalid class
        element.classList.remove('is-valid');
        element.classList.add('is-invalid');
       
        // Create or update feedback message
        let feedbackElement = element.nextElementSibling;
        if (!feedbackElement || !feedbackElement.classList.contains('invalid-feedback')) {
            feedbackElement = document.createElement('div');
            feedbackElement.className = 'invalid-feedback';
            element.parentNode.insertBefore(feedbackElement, element.nextSibling);
        }
       
        feedbackElement.textContent = message;
    }
   
    // Clear validation error
    function clearValidationError(element) {
        // Remove invalid class
        element.classList.remove('is-invalid');
       
        // Remove feedback message
        const feedbackElement = element.nextElementSibling;
        if (feedbackElement && feedbackElement.classList.contains('invalid-feedback')) {
            feedbackElement.remove();
        }
    }

    // =============================================
    // Tournament Management Functionality
    // =============================================
    
    // DOM elements for tournament management
    const tournamentSearch = document.getElementById('tournamentSearch');
    const searchButton = document.getElementById('searchButton');
    const tournamentTableBody = document.getElementById('tournamentTableBody');
    const noTournamentsMessage = document.getElementById('noTournamentsMessage');
    const loadingSpinner = document.getElementById('loadingSpinner');
    
    // Edit tournament modal elements
    const editTournamentModal = document.getElementById('editTournamentModal');
    const editTournamentForm = document.getElementById('editTournamentForm');
    const editTournamentId = document.getElementById('editTournamentId');
    const editTournamentName = document.getElementById('editTournamentName');
    const editTournamentYear = document.getElementById('editTournamentYear');
    const editTournamentDescription = document.getElementById('editTournamentDescription');
    const editTournamentStartDate = document.getElementById('editTournamentStartDate');
    const editTournamentEndDate = document.getElementById('editTournamentEndDate');
    const saveTournamentButton = document.getElementById('saveTournamentButton');
    
    // Delete tournament modal elements
    const deleteTournamentModal = document.getElementById('deleteTournamentModal');
    const deleteTournamentId = document.getElementById('deleteTournamentId');
    const deleteTournamentName = document.getElementById('deleteTournamentName');
    const confirmDeleteButton = document.getElementById('confirmDeleteButton');
    
    // Initialize modals if Bootstrap is available
    let editModal, deleteModal;
    if (typeof bootstrap !== 'undefined') {
        editModal = new bootstrap.Modal(editTournamentModal);
        deleteModal = new bootstrap.Modal(deleteTournamentModal);
    }
    
    // Load tournaments on page load
    loadTournaments();
    
    // Search button click handler
    if (searchButton) {
        searchButton.addEventListener('click', function() {
            loadTournaments(tournamentSearch.value);
        });
    }
    
    // Search input enter key handler
    if (tournamentSearch) {
        tournamentSearch.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                loadTournaments(tournamentSearch.value);
            }
        });
    }
    
    // Save tournament changes button click handler
    if (saveTournamentButton) {
        saveTournamentButton.addEventListener('click', function() {
            updateTournament();
        });
    }
    
    // Confirm delete button click handler
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener('click', function() {
            deleteTournament();
        });
    }
    
    /**
     * Load tournaments with optional search filter
     * @param {string} searchQuery - Optional search query
     */
    function loadTournaments(searchQuery = '') {
        if (!tournamentTableBody) return;
        
        // Show loading spinner
        if (loadingSpinner) {
            loadingSpinner.classList.remove('d-none');
        }
        
        // Hide no tournaments message
        if (noTournamentsMessage) {
            noTournamentsMessage.classList.add('d-none');
        }
        
        // Clear current table rows
        tournamentTableBody.innerHTML = '';
        
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
                if (loadingSpinner) {
                    loadingSpinner.classList.add('d-none');
                }
                
                if (tournaments.length === 0) {
                    // Show no tournaments message
                    if (noTournamentsMessage) {
                        noTournamentsMessage.classList.remove('d-none');
                    }
                    return;
                }
                
                // Render tournaments in table
                tournaments.forEach(tournament => {
                    renderTournamentRow(tournament);
                });
            })
            .catch(error => {
                console.error('Error loading tournaments:', error);
                
                // Hide loading spinner
                if (loadingSpinner) {
                    loadingSpinner.classList.add('d-none');
                }
                
                // Show error message
                alert('Error loading tournaments: ' + error.message);
            });
    }
    
    /**
     * Render a tournament row in the table
     * @param {Object} tournament - Tournament data
     */
    function renderTournamentRow(tournament) {
        const row = document.createElement('tr');
        
        // Format date range
        let dateRange = 'N/A';
        if (tournament.start_date && tournament.end_date) {
            const startDate = new Date(tournament.start_date);
            const endDate = new Date(tournament.end_date);
            dateRange = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
        }
        
        // Create truncated description for display
        const description = tournament.description || 'No description';
        const truncatedDescription = description.length > 50 
            ? description.substring(0, 47) + '...' 
            : description;
        
        // Build row HTML
        row.innerHTML = `
            <td>${tournament.name}</td>
            <td>${tournament.year}</td>
            <td title="${description}">${truncatedDescription}</td>
            <td>${dateRange}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary edit-tournament" data-id="${tournament.id}">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-sm btn-outline-danger ms-1 delete-tournament" data-id="${tournament.id}" data-name="${tournament.name}">
                    <i class="fas fa-trash-alt"></i> Delete
                </button>
            </td>
        `;
        
        // Add row to table
        tournamentTableBody.appendChild(row);
        
        // Add event listeners for action buttons
        const editButton = row.querySelector('.edit-tournament');
        if (editButton) {
            editButton.addEventListener('click', function() {
                openEditModal(tournament.id);
            });
        }
        
        const deleteButton = row.querySelector('.delete-tournament');
        if (deleteButton) {
            deleteButton.addEventListener('click', function() {
                openDeleteModal(tournament.id, tournament.name);
            });
        }
    }
    
    /**
     * Open the edit tournament modal and load tournament data
     * @param {number} tournamentId - ID of the tournament to edit
     */
    function openEditModal(tournamentId) {
        // Reset form
        if (editTournamentForm) {
            editTournamentForm.reset();
        }
        
        // Show loading state
        if (saveTournamentButton) {
            saveTournamentButton.disabled = true;
            saveTournamentButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Loading...';
        }
        
        // Open modal
        if (editModal) {
            editModal.show();
        }
        
        // Fetch tournament details
        fetch(`/api/tournament/${tournamentId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load tournament details');
                }
                return response.json();
            })
            .then(tournament => {
                // Populate form fields
                if (editTournamentId) editTournamentId.value = tournament.id;
                if (editTournamentName) editTournamentName.value = tournament.name;
                if (editTournamentYear) editTournamentYear.value = tournament.year;
                if (editTournamentDescription) editTournamentDescription.value = tournament.description || '';
                
                if (editTournamentStartDate && tournament.start_date) {
                    editTournamentStartDate.value = tournament.start_date.split('T')[0];
                }
                
                if (editTournamentEndDate && tournament.end_date) {
                    editTournamentEndDate.value = tournament.end_date.split('T')[0];
                }
                
                // Reset button state
                if (saveTournamentButton) {
                    saveTournamentButton.disabled = false;
                    saveTournamentButton.textContent = 'Save Changes';
                }
            })
            .catch(error => {
                console.error('Error loading tournament details:', error);
                
                // Close modal
                if (editModal) {
                    editModal.hide();
                }
                
                // Show error message
                alert('Error loading tournament details: ' + error.message);
            });
    }
    
    /**
     * Update tournament with form data
     */
    function updateTournament() {
        if (!editTournamentId || !editTournamentId.value) return;
        
        // Show loading state
        if (saveTournamentButton) {
            saveTournamentButton.disabled = true;
            saveTournamentButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';
        }
        
        // Validate form fields
        if (editTournamentName && !editTournamentName.value) {
            alert('Tournament name is required');
            saveTournamentButton.disabled = false;
            saveTournamentButton.textContent = 'Save Changes';
            return;
        }
        
        if (editTournamentYear && !editTournamentYear.value) {
            alert('Year is required');
            saveTournamentButton.disabled = false;
            saveTournamentButton.textContent = 'Save Changes';
            return;
        }
        
        if (editTournamentStartDate && !editTournamentStartDate.value) {
            alert('Start date is required');
            saveTournamentButton.disabled = false;
            saveTournamentButton.textContent = 'Save Changes';
            return;
        }
        
        if (editTournamentEndDate && !editTournamentEndDate.value) {
            alert('End date is required');
            saveTournamentButton.disabled = false;
            saveTournamentButton.textContent = 'Save Changes';
            return;
        }
        
        // Validate date range
        if (editTournamentStartDate && editTournamentEndDate) {
            const startDate = new Date(editTournamentStartDate.value);
            const endDate = new Date(editTournamentEndDate.value);
            
            if (startDate > endDate) {
                alert('End date must be after start date');
                saveTournamentButton.disabled = false;
                saveTournamentButton.textContent = 'Save Changes';
                return;
            }
        }
        
        // Prepare data
        const tournamentData = {
            name: editTournamentName ? editTournamentName.value : '',
            year: editTournamentYear ? parseInt(editTournamentYear.value) : 0,
            description: editTournamentDescription ? editTournamentDescription.value : '',
            start_date: editTournamentStartDate ? editTournamentStartDate.value : null,
            end_date: editTournamentEndDate ? editTournamentEndDate.value : null
        };
        
        // Send update request
        fetch(`/api/tournament/${editTournamentId.value}`, {
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
                // Close modal
                if (editModal) {
                    editModal.hide();
                }
                
                // Reload tournaments
                loadTournaments(tournamentSearch ? tournamentSearch.value : '');
                
                // Show success message
                alert('Tournament updated successfully');
            })
            .catch(error => {
                console.error('Error updating tournament:', error);
                
                // Reset button state
                if (saveTournamentButton) {
                    saveTournamentButton.disabled = false;
                    saveTournamentButton.textContent = 'Save Changes';
                }
                
                // Show error message
                alert('Error updating tournament: ' + error.message);
            });
    }
    
    /**
     * Open the delete tournament confirmation modal
     * @param {number} tournamentId - ID of the tournament to delete
     * @param {string} tournamentName - Name of the tournament to delete
     */
    function openDeleteModal(tournamentId, tournamentName) {
        if (deleteTournamentId) deleteTournamentId.value = tournamentId;
        if (deleteTournamentName) deleteTournamentName.textContent = tournamentName;
        
        // Open modal
        if (deleteModal) {
            deleteModal.show();
        }
    }
    
    /**
     * Delete the tournament
     */
    function deleteTournament() {
        if (!deleteTournamentId || !deleteTournamentId.value) return;
        
        // Show loading state
        if (confirmDeleteButton) {
            confirmDeleteButton.disabled = true;
            confirmDeleteButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Deleting...';
        }
        
        // Send delete request
        fetch(`/api/tournament/${deleteTournamentId.value}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete tournament');
                }
                return response.json();
            })
            .then(result => {
                // Close modal
                if (deleteModal) {
                    deleteModal.hide();
                }
                
                // Reload tournaments
                loadTournaments(tournamentSearch ? tournamentSearch.value : '');
                
                // Show success message
                alert('Tournament deleted successfully');
            })
            .catch(error => {
                console.error('Error deleting tournament:', error);
                
                // Reset button state
                if (confirmDeleteButton) {
                    confirmDeleteButton.disabled = false;
                    confirmDeleteButton.textContent = 'Delete Tournament';
                }
                
                // Close modal
                if (deleteModal) {
                    deleteModal.hide();
                }
                
                // Show error message
                alert('Error deleting tournament: ' + error.message);
            });
    }
});