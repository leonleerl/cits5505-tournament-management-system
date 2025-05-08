document.addEventListener("DOMContentLoaded", function() {
    const signupForm = document.getElementById("signupForm");
    const fullName = document.getElementById("fullName");
    const username = document.getElementById("username");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPassword = document.getElementById("confirmPassword");
    const termsAgreement = document.getElementById("termsAgreement");

    signupForm.addEventListener("submit", function(event) {
        event.preventDefault();

        // Client-side validation
        const errors = [];

        if (fullName.value.trim().length < 3) {
            errors.push("Full name must be at least 3 characters long.");
        }

        if (username.value.trim().length < 4) {
            errors.push("Username must be at least 4 characters long.");
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.value.trim())) {
            errors.push("Invalid email format.");
        }

        if (password.value.length < 8 || !/[a-zA-Z]/.test(password.value) || !/\d/.test(password.value)) {
            errors.push("Password must be at least 8 characters long and contain both letters and numbers.");
        }

        if (password.value !== confirmPassword.value) {
            errors.push("Passwords do not match.");
        }

        if (!termsAgreement.checked) {
            errors.push("You must agree to the terms of service.");
        }

        // Show errors if any
        const errorContainer = document.getElementById("signupErrors");
        if (errorContainer) errorContainer.innerHTML = "";
        if (errors.length > 0) {
            errors.forEach(msg => {
                const div = document.createElement("div");
                div.className = "alert alert-danger";
                div.textContent = msg;
                errorContainer.appendChild(div);
            });
            return;
        }

        // Submit form if no errors
        signupForm.submit();
    });
});
