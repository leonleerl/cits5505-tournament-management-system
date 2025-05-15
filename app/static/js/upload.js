/**
 * Tournament Upload JavaScript
 * Handles client-side validation, interaction, and animations for the tournament upload feature
 */
document.addEventListener('DOMContentLoaded', function() {
    // Form elements
    const uploadForm = document.querySelector('form.upload-form') || document.querySelector('form');
    const fileInput = document.getElementById('file');
    const confirmCheck = document.getElementById('confirmCheck');
    const submitButton = document.querySelector('input[type="submit"]');
    const fileInfoText = document.querySelector('.form-text');
    
    // Custom file upload elements
    const fileUploadArea = document.getElementById('fileUploadArea');
    const selectedFile = document.getElementById('selectedFile');
    const removeFileBtn = document.getElementById('removeFile');
    const uploadProgress = document.getElementById('uploadProgress');
    
    // Step indicators
    const stepItems = document.querySelectorAll('.step-item');
    const stepProgress = document.querySelectorAll('.step-progress');
    
    // Size limits
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    
    // Initialize the page with animations if available
    if (typeof initializeAnimations === 'function') {
        initializeAnimations();
    } else {
        // Define the function if not already available
        window.initializeAnimations = function() {
            // Animate floating basketballs with random positions
            document.querySelectorAll('.floating-ball').forEach(ball => {
                const randomLeft = Math.floor(Math.random() * 80) + 10; // 10% to 90%
                const randomTop = Math.floor(Math.random() * 80) + 10; // 10% to 90%
                
                ball.style.left = `${randomLeft}%`;
                ball.style.top = `${randomTop}%`;
            });
            
            // Set first step as active if available
            if (stepItems && stepItems.length > 0) {
                updateStepStatus(0, 'active');
            }
            
            // Animate section header
            const header = document.querySelector('.section-header');
            if (header) {
                header.classList.add('animated', 'fadeIn');
            }
            
            // Animate cards with staggered delay
            const cards = document.querySelectorAll('.action-card');
            cards.forEach((card, index) => {
                setTimeout(() => {
                    card.classList.add('animated', 'fadeIn');
                }, 200 * (index + 1));
            });
        }
        
        // Call the function
        initializeAnimations();
    }
    
    // File upload area click handler
    if (fileUploadArea) {
        fileUploadArea.addEventListener('click', function() {
            fileInput.click();
        });
        
        // Drag and drop functionality
        fileUploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('dragover');
        });
        
        fileUploadArea.addEventListener('dragleave', function() {
            this.classList.remove('dragover');
        });
        
        fileUploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('dragover');
            
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                validateFile();
            }
        });
    }
    
    // File selection handler
    if (fileInput) {
        fileInput.addEventListener('change', function(event) {
            validateFile();
        });
    }
    
    // Remove file button handler
    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', function() {
            clearFileInput();
        });
    }
    
    // Global flag to track if we're submitting the form
    let isSubmitting = false;
    
    // Form submission
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(event) {
            // If the form is already being submitted, let it proceed
            if (isSubmitting) {
                return;
            }
            
            // Prevent the default form submission temporarily
            event.preventDefault();
            
            // Validate file size (WTForms handles other validations)
            if (!validateFileSize()) {
                return false;
            }
            
            // Update step indicators if they exist
            if (stepItems && stepItems.length > 1) {
                updateStepStatus(1, 'active');
                updateStepStatus(0, 'completed');
            }
            
            if (stepProgress && stepProgress.length > 0) {
                updateProgressBar(0, 'completed');
            }
            
            // Show loading state
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.value = 'Uploading...';
                
                // Add animation to the submit button if supported
                submitButton.classList.add('uploading');
                
                // Show progress animation
                if (uploadProgress) {
                    uploadProgress.classList.add('active');
                } else {
                    // Add a spinner icon next to the button (from original code)
                    const spinner = document.createElement('span');
                    spinner.className = 'spinner-border spinner-border-sm me-2';
                    spinner.setAttribute('role', 'status');
                    spinner.setAttribute('aria-hidden', 'true');
                    submitButton.parentNode.insertBefore(spinner, submitButton);
                }
            }
            
            // Complete the upload animation sequence with delay
            setTimeout(function() {
                // Update step indicators for completion if they exist
                if (stepItems && stepItems.length > 2) {
                    updateStepStatus(1, 'completed');
                    updateStepStatus(2, 'active');
                }
                
                if (stepProgress && stepProgress.length > 1) {
                    updateProgressBar(1, 'completed');
                }
                
                // Set the isSubmitting flag to true so the event handler won't be triggered again
                isSubmitting = true;
                
                // Create a hidden form and copy all form data to it for submission
                const hiddenForm = document.createElement('form');
                hiddenForm.method = uploadForm.method;
                hiddenForm.action = uploadForm.action;
                hiddenForm.enctype = uploadForm.enctype;
                hiddenForm.style.display = 'none';
                
                // Copy all form inputs to the hidden form
                const formData = new FormData(uploadForm);
                for (const [name, value] of formData.entries()) {
                    if (name === 'file') {
                        // Special handling for file input
                        if (fileInput && fileInput.files.length > 0) {
                            const newFileInput = document.createElement('input');
                            newFileInput.type = 'file';
                            newFileInput.name = 'file';
                            
                            // Create a new FileList-like object
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(fileInput.files[0]);
                            newFileInput.files = dataTransfer.files;
                            
                            hiddenForm.appendChild(newFileInput);
                        }
                    } else {
                        // For other inputs
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = name;
                        input.value = value;
                        hiddenForm.appendChild(input);
                    }
                }
                
                // Append the hidden form to the body, submit it, and remove it
                document.body.appendChild(hiddenForm);
                hiddenForm.submit();
                document.body.removeChild(hiddenForm);
                
            }, 1500); // Delay to show animation
        });
    }
    
    // File validation function - check size since WTForms handles type validation
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
        
        return true;
    }
    
    // Update file info when a file is selected
    function validateFile() {
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            return;
        }
        
        const file = fileInput.files[0];
        
        // Check if it's an Excel file (.xlsx extension check from new code)
        if (file.name.endsWith && !file.name.endsWith('.xlsx')) {
            showValidationError(fileInput, 'Only .xlsx files are allowed');
            return;
        }
        
        // Validate file size
        if (file.size > maxFileSize) {
            showValidationError(fileInput, `File size exceeds maximum limit of ${maxFileSize / 1024 / 1024}MB`);
            return;
        }
        
        // Clear any previous validation errors
        clearValidationError(fileInput);
        
        // Update the selected file display
        if (selectedFile) {
            const fileNameElement = selectedFile.querySelector('.file-name');
            if (fileNameElement) {
                fileNameElement.textContent = file.name;
            }
            selectedFile.classList.add('active');
        }
        
        // Update file info text
        if (fileInfoText) {
            fileInfoText.innerHTML = `Selected file: <strong>${file.name}</strong> (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        }
        
        // Hide the upload area if using the new UI
        if (fileUploadArea) {
            fileUploadArea.style.display = 'none';
        }
        
        // Update step indicators if they exist
        if (stepItems && stepItems.length > 0) {
            updateStepStatus(0, 'completed');
        }
        
        // Check if the confirm checkbox is checked
        if (confirmCheck && confirmCheck.checked) {
            enableSubmitButton();
        }
    }
    
    // Clear file input and reset display
    function clearFileInput() {
        if (fileInput) {
            fileInput.value = '';
        }
        
        if (selectedFile) {
            selectedFile.classList.remove('active');
        }
        
        if (fileUploadArea) {
            fileUploadArea.style.display = 'block';
        }
        
        if (fileInfoText) {
            fileInfoText.innerHTML = 'Upload a single Excel file containing all tournament data.';
        }
        
        // Update step indicators if they exist
        if (stepItems && stepItems.length > 0) {
            updateStepStatus(0, 'active');
        }
        
        // Disable submit button
        if (submitButton) {
            submitButton.disabled = true;
        }
    }
    
    // Show validation error
    function showValidationError(element, message) {
        // Add invalid class
        element.classList.remove('is-valid');
        element.classList.add('is-invalid');
        
        // Hide the selected file info if using the new UI
        if (selectedFile) {
            selectedFile.classList.remove('active');
        }
        
        // Show the upload area if using the new UI
        if (fileUploadArea) {
            fileUploadArea.style.display = 'block';
        }
        
        // Create or update feedback message
        let feedbackElement = element.nextElementSibling;
        if (!feedbackElement || !feedbackElement.classList.contains('invalid-feedback')) {
            feedbackElement = document.createElement('div');
            feedbackElement.className = 'invalid-feedback d-block';
            element.parentNode.insertBefore(feedbackElement, element.nextSibling);
        }
        
        feedbackElement.textContent = message;
    }
    
    // Clear validation error
    function clearValidationError(element) {
        // Remove invalid class
        element.classList.remove('is-invalid');
        
        // Remove feedback message
        const feedbackElements = document.querySelectorAll('.invalid-feedback');
        feedbackElements.forEach(el => {
            if (el.classList.contains('d-block')) {
                el.remove();
            } else {
                el.remove();
            }
        });
    }
    
    // Enable the submit button if all conditions are met
    function enableSubmitButton() {
        if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
            return;
        }
        
        if (!confirmCheck || !confirmCheck.checked) {
            return;
        }
        
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
    
    // Disable the submit button
    function disableSubmitButton() {
        if (submitButton) {
            submitButton.disabled = true;
        }
    }
    
    // Confirm checkbox change handler
    if (confirmCheck) {
        confirmCheck.addEventListener('change', function() {
            if (this.checked && fileInput && fileInput.files && fileInput.files.length > 0) {
                enableSubmitButton();
            } else {
                disableSubmitButton();
            }
        });
    }
    
    // Update step status
    function updateStepStatus(stepIndex, status) {
        if (!stepItems || stepItems.length <= stepIndex) {
            return;
        }
        
        // Remove all status classes
        stepItems[stepIndex].classList.remove('active', 'completed');
        
        // Add the new status class
        stepItems[stepIndex].classList.add(status);
    }
    
    // Update progress bar status
    function updateProgressBar(progressIndex, status) {
        if (!stepProgress || stepProgress.length <= progressIndex) {
            return;
        }
        
        // Remove completed class
        stepProgress[progressIndex].classList.remove('completed');
        
        // Add the new status class if it's 'completed'
        if (status === 'completed') {
            stepProgress[progressIndex].classList.add('completed');
        }
    }
    
    // Reset the form
    function resetForm() {
        if (uploadForm) {
            uploadForm.reset();
        }
        
        clearFileInput();
        
        // Reset step indicators
        if (stepItems) {
            document.querySelectorAll('.step-item').forEach(item => {
                item.classList.remove('active', 'completed');
            });
        }
        
        if (stepProgress) {
            document.querySelectorAll('.step-progress').forEach(progress => {
                progress.classList.remove('completed');
            });
        }
        
        // Set first step as active if it exists
        if (stepItems && stepItems.length > 0) {
            updateStepStatus(0, 'active');
        }
        
        // Reset submit button
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.value = 'Upload Tournament';
            submitButton.classList.remove('uploading');
        }
        
        // Hide progress animation
        if (uploadProgress) {
            uploadProgress.classList.remove('active');
        }
    }
    
    // Scroll to upload form when the upload button is clicked
    const uploadBtn = document.querySelector('.upload-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const formSection = document.getElementById('uploadFormSection');
            if (formSection) {
                formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
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
        if (editTournamentModal) {
            editModal = new bootstrap.Modal(editTournamentModal);
        }
        if (deleteTournamentModal) {
            deleteModal = new bootstrap.Modal(deleteTournamentModal);
        }
    }
    
    // Get CSRF token from meta tag or form
    function getCsrfToken() {
        // First try to get it from meta tag
        const metaTag = document.querySelector('meta[name="csrf-token"]');
        if (metaTag) {
            return metaTag.getAttribute('content');
        }
        
        // If not in meta tag, try to get it from form
        const csrfInput = document.querySelector('input[name="csrf_token"]');
        if (csrfInput) {
            return csrfInput.value;
        }
        
        return null;
    }
    
    // Load tournaments on page load if the table exists
    if (tournamentTableBody) {
        loadTournaments();
    }
    
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
        
        // Get CSRF token
        const csrfToken = getCsrfToken();
        
        // Send update request
        fetch(`/api/tournament/${editTournamentId.value}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
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
        
        // Get CSRF token
        const csrfToken = getCsrfToken();
        
        // Send delete request
        fetch(`/api/tournament/${deleteTournamentId.value}`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': csrfToken
            }
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