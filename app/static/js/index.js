document.addEventListener("DOMContentLoaded", function () {
  // Initialize tooltips if available
  if (typeof bootstrap !== "undefined") {
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  // Add smooth scrolling to all internal links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      scrollToSection(targetId.substring(1));
    });
  });

  // Apply animation to the leaderboard on page load
  animateLeaderboard();

  // Add season filter event listener
  const seasonSelect = document.getElementById("season-select");
  if (seasonSelect) {
    seasonSelect.addEventListener("change", function () {
      // For now, we'll just reload the page with a query parameter
      // This would be replaced with AJAX in a more interactive implementation
      if (this.value !== "all") {
        window.location.href = `/?season=${this.value}`;
      } else {
        window.location.href = "/";
      }
    });
  }
});

// Function to scroll to a section with navbar offset
function scrollToSection(sectionId) {
  const targetElement = document.getElementById(sectionId);
  if (targetElement) {
    const navHeight = document.querySelector(".navbar")?.offsetHeight || 0;
    const targetPosition = targetElement.offsetTop - navHeight;

    window.scrollTo({
      top: targetPosition,
      behavior: "smooth",
    });
  }
}

// Animation for the leaderboard
function animateLeaderboard() {
  const rows = document.querySelectorAll("#leaderboard-body tr");

  rows.forEach((row, index) => {
    row.style.opacity = "0";
    row.style.transform = "translateY(20px)";
    row.style.transition = "opacity 0.3s ease, transform 0.3s ease";

    setTimeout(() => {
      row.style.opacity = "1";
      row.style.transform = "translateY(0)";
    }, 100 * index);
  });
}
