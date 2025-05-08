// Get initial window width
let winWidth = window.innerWidth;
console.log(winWidth);

// Function to add or remove border based on window width
function loginBorder() {
  const loginBorderElements = document.querySelectorAll('.login-border');

  loginBorderElements.forEach((element) => {
    if (window.innerWidth > 576) {
      element.classList.add('border');
    } else {
      element.classList.remove('border');
    }
  });
}

// Initial call
loginBorder();

// Add event listener to window resize
window.addEventListener('resize', function() {
  loginBorder();
});

document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault(); // Stop actual form submit

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value.trim();

      if (username === "" || password === "") {
        showLoginAlert("Please enter both username and password.", "danger");
        return;
      }

      // For demo: simple dummy login
      if (username === "admin" && password === "admin123") {
        showLoginAlert("Login successful! Redirecting...", "success");

        setTimeout(() => {
          window.location.href = "index.html"; // Redirect to homepage
        }, 1500);
      } else {
        showLoginAlert("Invalid username or password.", "danger");
      }
    });
  }
});

function showLoginAlert(message, type = "info") {
  const alertPlaceholder = document.querySelector(".login-border");

  const existingAlert = document.getElementById("login-alert");
  if (existingAlert) existingAlert.remove();

  const alertElement = document.createElement("div");
  alertElement.id = "login-alert";
  alertElement.className = `alert alert-${type} alert-dismissible fade show mt-3`;
  alertElement.role = "alert";
  alertElement.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  alertPlaceholder.insertBefore(alertElement, alertPlaceholder.firstChild);
}


// Forgot password functionality
document.addEventListener("DOMContentLoaded", function () {
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", function (event) {
      event.preventDefault(); // Prevent actual form submit

      const emailInput = document.getElementById("email");
      const email = emailInput.value.trim();

      if (email === "") {
        showForgotPasswordAlert("Please enter your email address.", "danger");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showForgotPasswordAlert("Please enter a valid email address.", "danger");
        return;
      }

      // Simulate sending reset link
      showForgotPasswordAlert("A password reset link has been sent to your email!", "success");

      // Optionally reset form
      forgotPasswordForm.reset();
    });
  }
});

function showForgotPasswordAlert(message, type = "info") {
  const formContainer = document.querySelector(".col-md-6");

  const existingAlert = document.getElementById("forgot-password-alert");
  if (existingAlert) existingAlert.remove();

  const alertElement = document.createElement("div");
  alertElement.id = "forgot-password-alert";
  alertElement.className = `alert alert-${type} alert-dismissible fade show mt-3`;
  alertElement.role = "alert";
  alertElement.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;

  formContainer.insertBefore(alertElement, formContainer.firstChild);
}