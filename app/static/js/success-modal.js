/**
 * Success Modal Handler
 * Detects success messages and shows modal with animation
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Success modal handler initialized');
    
    // Success modal detection
    const successModal = document.getElementById('successModal');
    let successModalInstance = null;
    
    if (typeof bootstrap !== 'undefined' && successModal) {
        successModalInstance = new bootstrap.Modal(successModal);
        console.log('Success modal initialized');
    } else {
        console.warn('Bootstrap or success modal not found');
    }
    
    // Check for success message in flash messages
    const flashMessages = document.querySelectorAll('.alert');
    let foundSuccessMessage = false;
    
    flashMessages.forEach(message => {
        if (message.classList.contains('alert-success') && 
            message.textContent.includes('Tournament uploaded successfully')) {
            console.log('Success message found!'); // Debug log
            foundSuccessMessage = true;
            
            // If we have a success message and a modal, show it
            if (successModalInstance) {
                // Hide the flash message since we'll show the modal instead
                message.style.display = 'none';
                
                // Show animation with slight delay for better UX
                setTimeout(() => {
                    successModalInstance.show();
                }, 500);
            }
        }
    });
    
    // If no success messages found in the alerts, check the URL
    if (!foundSuccessMessage && window.location.search.includes('success=true')) {
        console.log('Success parameter found in URL');
        
        if (successModalInstance) {
            // Show animation with slight delay for better UX
            setTimeout(() => {
                successModalInstance.show();
            }, 500);
        }
    }
    
    // Also mark the third step as completed if we're showing the success modal
    if (foundSuccessMessage || window.location.search.includes('success=true')) {
        const stepItems = document.querySelectorAll('.step-item');
        const stepProgress = document.querySelectorAll('.step-progress');
        
        if (stepItems && stepItems.length >= 3) {
            // Update all step indicators to completed
            for (let i = 0; i < stepItems.length; i++) {
                stepItems[i].classList.remove('active');
                stepItems[i].classList.add('completed');
            }
            
            // Mark the last step as active
            stepItems[2].classList.remove('completed');
            stepItems[2].classList.add('active');
        }
        
        if (stepProgress && stepProgress.length >= 2) {
            // Update all progress bars to completed
            for (let i = 0; i < stepProgress.length; i++) {
                stepProgress[i].classList.add('completed');
            }
        }
    }
    
    // Add event listener to "Upload Another" button in success modal
    const uploadAnotherBtn = document.querySelector('#successModal .btn-outline-secondary');
    if (uploadAnotherBtn) {
        uploadAnotherBtn.addEventListener('click', function() {
            // Reset the form if it exists
            const uploadForm = document.querySelector('form.upload-form') || document.querySelector('form');
            if (uploadForm) {
                uploadForm.reset();
                
                // If there's a reset function, call it
                if (typeof resetForm === 'function') {
                    resetForm();
                } else {
                    // Basic reset functionality
                    const fileInput = document.getElementById('file');
                    const fileUploadArea = document.getElementById('fileUploadArea');
                    const selectedFile = document.getElementById('selectedFile');
                    const fileInfoText = document.querySelector('.form-text');
                    
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
                }
                
                // Reset step indicators - Improved step reset logic
                const stepItems = document.querySelectorAll('.step-item');
                if (stepItems && stepItems.length > 0) {
                    // First clear all statuses
                    stepItems.forEach(item => {
                        item.classList.remove('active', 'completed');
                    });
                    
                    // Set first step as active
                    stepItems[0].classList.add('active');
                    
                    // Ensure other steps are neither active nor completed
                    for (let i = 1; i < stepItems.length; i++) {
                        stepItems[i].classList.remove('active', 'completed');
                    }
                }
                
                // Reset progress bars
                const stepProgress = document.querySelectorAll('.step-progress');
                if (stepProgress && stepProgress.length > 0) {
                    stepProgress.forEach(progress => {
                        progress.classList.remove('completed');
                    });
                }
                
                // Remove success parameter from URL
                if (window.history && window.history.replaceState) {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('success');
                    window.history.replaceState({}, document.title, url.toString());
                }
            }
        });
    }
});