// Variables to store DOM elements and validation state
let signupForm;
let formFields = {};
let formValid = {
    fullName: false,
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
    termsAgreement: false
};
let existingUsers = [];

// Initialise page when DOM is fully loaded
document.addEventListener("DOMContentLoaded", function() {
    // Get form and field references
    signupForm = document.getElementById("signupForm");
    
    // Store references to form fields
    formFields = {
        fullName: document.getElementById("fullName"),
        username: document.getElementById("username"),
        email: document.getElementById("email"),
        password: document.getElementById("password"),
        confirmPassword: document.getElementById("confirmPassword"),
        avatar: document.getElementById("avatar"),
        termsAgreement: document.getElementById("termsAgreement")
    };
    
    // Load existing users to check for duplicates
    loadExistingUsers();
    
    // Add event listeners for input validation
    setupValidationListeners();
    
    // Handle form submission
    if (signupForm) {
        signupForm.addEventListener("submit", handleSignupSubmit);
    }
    
    // Setup avatar preview if user uploads an image
    setupAvatarPreview();
});

// Load existing users from the database
function loadExistingUsers() {
    fetch("./db.json")
        .then(response => {
            if (!response.ok) {
                throw new Error("Network response error: " + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            existingUsers = data.users || [];
            console.log("Loaded users:", existingUsers.length);
        })
        .catch(error => {
            console.error("Error loading user data:", error);
            // Show error notification
            showNotification("Error loading user data. Some validation features may not work properly.", "danger");
        });
}

// Setup validation event listeners for each field
function setupValidationListeners() {
    // Validate full name
    if (formFields.fullName) {
        formFields.fullName.addEventListener("blur", function() {
            validateFullName(this);
        });
    }
    
    // Validate username
    if (formFields.username) {
        formFields.username.addEventListener("blur", function() {
            validateUsername(this);
        });
    }
    
    // Validate email
    if (formFields.email) {
        formFields.email.addEventListener("blur", function() {
            validateEmail(this);
        });
    }
    
    // Validate password
    if (formFields.password) {
        formFields.password.addEventListener("input", function() {
            validatePassword(this);
            // If confirm password has content, validate it again to check matching
            if (formFields.confirmPassword.value.length > 0) {
                validateConfirmPassword(formFields.confirmPassword);
            }
        });
    }
    
    // Validate confirm password
    if (formFields.confirmPassword) {
        formFields.confirmPassword.addEventListener("input", function() {
            validateConfirmPassword(this);
        });
    }
    
    // Validate terms agreement
    if (formFields.termsAgreement) {
        formFields.termsAgreement.addEventListener("change", function() {
            validateTermsAgreement(this);
        });
    }
}

// Validate full name
function validateFullName(input) {
    removeValidationFeedback(input);
    
    if (input.value.trim() === "") {
        showValidationFeedback(input, false, "Full name is required");
        formValid.fullName = false;
        return false;
    }
    
    if (input.value.trim().length < 3) {
        showValidationFeedback(input, false, "Full name must be at least 3 characters");
        formValid.fullName = false;
        return false;
    }
    
    showValidationFeedback(input, true);
    formValid.fullName = true;
    return true;
}

// Validate username
function validateUsername(input) {
    removeValidationFeedback(input);
    
    if (input.value.trim() === "") {
        showValidationFeedback(input, false, "Username is required");
        formValid.username = false;
        return false;
    }
    
    if (input.value.trim().length < 4) {
        showValidationFeedback(input, false, "Username must be at least 4 characters");
        formValid.username = false;
        return false;
    }
    
    // Check if username already exists
    const usernameExists = existingUsers.some(user => 
        user.username.toLowerCase() === input.value.trim().toLowerCase()
    );
    
    if (usernameExists) {
        showValidationFeedback(input, false, "Username already exists");
        formValid.username = false;
        return false;
    }
    
    showValidationFeedback(input, true);
    formValid.username = true;
    return true;
}

// Validate email
function validateEmail(input) {
    removeValidationFeedback(input);
    
    if (input.value.trim() === "") {
        showValidationFeedback(input, false, "Email is required");
        formValid.email = false;
        return false;
    }
    
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.value)) {
        showValidationFeedback(input, false, "Please enter a valid email address");
        formValid.email = false;
        return false;
    }
    
    // Check if email already exists
    const emailExists = existingUsers.some(user => 
        user.email.toLowerCase() === input.value.trim().toLowerCase()
    );
    
    if (emailExists) {
        showValidationFeedback(input, false, "Email already registered");
        formValid.email = false;
        return false;
    }
    
    showValidationFeedback(input, true);
    formValid.email = true;
    return true;
}

// Validate password
function validatePassword(input) {
    removeValidationFeedback(input);
    
    if (input.value === "") {
        showValidationFeedback(input, false, "Password is required");
        formValid.password = false;
        return false;
    }
    
    if (input.value.length < 8) {
        showValidationFeedback(input, false, "Password must be at least 8 characters");
        formValid.password = false;
        return false;
    }
    
    // Check password strength (at least one number and one letter)
    const hasNumber = /\d/.test(input.value);
    const hasLetter = /[a-zA-Z]/.test(input.value);
    
    if (!hasNumber || !hasLetter) {
        showValidationFeedback(input, false, "Password must include both letters and numbers");
        formValid.password = false;
        return false;
    }
    
    showValidationFeedback(input, true);
    formValid.password = true;
    return true;
}

// Validate confirm password
function validateConfirmPassword(input) {
    removeValidationFeedback(input);
    
    if (input.value === "") {
        showValidationFeedback(input, false, "Please confirm your password");
        formValid.confirmPassword = false;
        return false;
    }
    
    if (input.value !== formFields.password.value) {
        showValidationFeedback(input, false, "Passwords do not match");
        formValid.confirmPassword = false;
        return false;
    }
    
    showValidationFeedback(input, true);
    formValid.confirmPassword = true;
    return true;
}

// Validate terms agreement checkbox
function validateTermsAgreement(input) {
    const parentElement = input.closest('.form-check');
    
    // Remove any existing feedback
    const existingFeedback = parentElement.querySelector('.invalid-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    if (!input.checked) {
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'invalid-feedback';
        feedbackElement.textContent = 'You must agree to the terms to continue';
        feedbackElement.style.display = 'block';
        parentElement.appendChild(feedbackElement);
        
        formValid.termsAgreement = false;
        return false;
    }
    
    formValid.termsAgreement = true;
    return true;
}

// Set up avatar preview
function setupAvatarPreview() {
    const avatarInput = document.getElementById('avatar');
    if (!avatarInput) return;
    
    avatarInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Create or get the preview element
        let previewContainer = document.getElementById('avatar-preview-container');
        if (!previewContainer) {
            previewContainer = document.createElement('div');
            previewContainer.id = 'avatar-preview-container';
            previewContainer.className = 'mt-2 text-center';
            avatarInput.parentNode.appendChild(previewContainer);
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
    });
}

// Handle form submission
function handleSignupSubmit(event) {
    event.preventDefault();
    
    // Validate all fields
    validateFullName(formFields.fullName);
    validateUsername(formFields.username);
    validateEmail(formFields.email);
    validatePassword(formFields.password);
    validateConfirmPassword(formFields.confirmPassword);
    validateTermsAgreement(formFields.termsAgreement);
    
    // Check if form is valid
    const isFormValid = Object.values(formValid).every(value => value === true);
    
    if (!isFormValid) {
        // Show error notification
        showNotification("Please correct the errors in the form before submitting.", "danger");
        return;
    }
    
    // Prepare user data for submission
    const userData = {
        id: existingUsers.length + 1,
        username: formFields.username.value.trim(),
        email: formFields.email.value.trim(),
        avatar: formFields.avatar.files.length > 0 ? formFields.avatar.files[0].name : "default-avatar.jpg",
        isAdmin: false
    };
    
    // Simulate API submission (since this is a frontend mockup)
    console.log("User data ready for submission:", userData);
    
    // Show success notification
    showNotification("Account created successfully! Redirecting to login...", "success");
    
    // Simulate redirect to login after short delay
    setTimeout(() => {
        window.location.href = "login.html";
    }, 2000);
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

// Show notification alert
function showNotification(message, type = "info") {
    // Create notification element
    const notificationElement = document.createElement("div");
    notificationElement.className = `alert alert-${type} alert-dismissible fade show`;
    notificationElement.setAttribute("role", "alert");
    
    // Add content
    notificationElement.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Insert at the top of the form
    signupForm.parentNode.insertBefore(notificationElement, signupForm);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notificationElement.classList.remove("show");
        setTimeout(() => {
            notificationElement.remove();
        }, 150);
    }, 5000);
}