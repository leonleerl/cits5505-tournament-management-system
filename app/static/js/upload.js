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
});