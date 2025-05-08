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

  // Animate hero feature cards
  animateHeroFeatures();

  // Apply animation to the leaderboard on page load
  animateLeaderboard();

  // Add season filter event listener
  const seasonSelect = document.getElementById("season-select");
  if (seasonSelect) {
    seasonSelect.addEventListener("change", function () {
      const seasonValue = this.value;
      const currentUrl = new URL(window.location.href);

      if (seasonValue === "all") {
        currentUrl.searchParams.delete("season");
      } else {
        currentUrl.searchParams.set("season", seasonValue);
      }

      window.location.href = currentUrl.toString();
    });
  }

  // Add animation to the point badges on page load
  const pointsBadges = document.querySelectorAll(".points-badge");
  pointsBadges.forEach((badge, index) => {
    setTimeout(() => {
      badge.style.transform = "scale(1.1)";
      setTimeout(() => {
        badge.style.transform = "scale(1)";
      }, 200);
    }, index * 100);
  });

  // Apply dynamic styling based on data attributes
  applyDynamicStyles();
});

// Function to scroll to a section with navbar offset
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    const navHeight = document.querySelector(".navbar")?.offsetHeight || 0;
    const targetPosition = section.offsetTop - navHeight;

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

// Apply dynamic styling based on data attributes
function applyDynamicStyles() {
  // Apply team logo styling
  document.querySelectorAll(".team-logo-styled").forEach((logo) => {
    const primaryColor = logo.dataset.primaryColor;
    const secondaryColor = logo.dataset.secondaryColor;

    if (primaryColor) {
      logo.style.setProperty("--team-primary-color", primaryColor);
    }

    if (secondaryColor) {
      logo.style.setProperty("--team-secondary-color", secondaryColor);
    }
  });

  // Apply win bar styling
  document.querySelectorAll(".win-bar-styled").forEach((bar) => {
    const winPercentage = bar.dataset.winPercentage;
    const primaryColor = bar.dataset.primaryColor;

    if (winPercentage) {
      bar.style.width = `${winPercentage}%`;
    }

    if (primaryColor) {
      bar.style.setProperty("--team-primary-color", primaryColor);
    }
  });

  // Apply colored text
  document.querySelectorAll(".team-colored-text").forEach((element) => {
    const primaryColor = element.dataset.primaryColor;

    if (primaryColor) {
      element.style.setProperty("--team-primary-color", primaryColor);
    }
  });

  // Apply match header gradients
  document.querySelectorAll(".match-gradient-header").forEach((header) => {
    const team1Color = header.dataset.team1Color;
    const team2Color = header.dataset.team2Color;

    if (team1Color && team2Color) {
      header.style.setProperty("--team1-color", team1Color);
      header.style.setProperty("--team2-color", team2Color);
    }
  });
}

// Animate hero feature cards with a staggered effect
function animateHeroFeatures() {
  const cards = document.querySelectorAll(".hero-feature-card");

  cards.forEach((card, index) => {
    // Set initial state
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = "opacity 0.5s ease, transform 0.5s ease";

    // Animate with staggered delay
    setTimeout(() => {
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, 300 + index * 200); // Stagger the animations

    // Animate the icon with a slight bounce
    const icon = card.querySelector(".feature-icon");
    if (icon) {
      icon.style.opacity = "0";
      icon.style.transform = "scale(0.5)";
      icon.style.transition =
        "opacity 0.5s ease, transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";

      setTimeout(() => {
        icon.style.opacity = "1";
        icon.style.transform = "scale(1)";
      }, 600 + index * 200);
    }
  });
}
