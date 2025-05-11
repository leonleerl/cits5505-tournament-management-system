/**
 * Basketball Scoreboard Flip Animation - Simplified Approach
 * Creates a more reliable flip animation for the scoreboard
 */
document.addEventListener('DOMContentLoaded', function() {
  console.log('Initializing simplified Basketball Scoreboard Flip animation...');
  
  // Initialize the animation
  initScoreboardAnimation();
  
  /**
   * Initialize the Scoreboard Animation
   */
  function initScoreboardAnimation() {
    // Find the title element to replace
    const titleElement = document.querySelector('.section-title');
    if (!titleElement) {
      console.warn('Title element not found for scoreboard animation');
      return;
    }
    
    // Split text into two lines
    const fullText = titleElement.textContent.trim() || 'Tournament Management';
    let line1, line2;
    
    if (fullText.toLowerCase() === 'tournament management') {
      // Use predefined split for "Tournament Management"
      line1 = 'Tournament';
      line2 = 'Management';
    } else {
      // For other text, try to split roughly in half at a space
      const words = fullText.split(' ');
      const midpoint = Math.ceil(words.length / 2);
      
      line1 = words.slice(0, midpoint).join(' ');
      line2 = words.slice(midpoint).join(' ');
    }
    
    // Create scoreboard container
    const scoreboard = document.createElement('div');
    scoreboard.className = 'scoreboard-container';
    
    // Add scoreboard header with different class name to avoid conflicts
    const header = document.createElement('div');
    header.className = 'scoreboard-flip-header';
    
    // Add scoreboard lights
    const lights = document.createElement('div');
    lights.className = 'scoreboard-lights';
    header.appendChild(lights);
    
    // Add basketball decorations
    const basketballLeft = document.createElement('div');
    basketballLeft.className = 'basketball-decoration basketball-left';
    basketballLeft.innerHTML = '<i class="fas fa-basketball-ball"></i>';
    
    const basketballRight = document.createElement('div');
    basketballRight.className = 'basketball-decoration basketball-right';
    basketballRight.innerHTML = '<i class="fas fa-basketball-ball"></i>';
    
    // Create container for both rows
    const rowsContainer = document.createElement('div');
    rowsContainer.className = 'flip-rows-container';
    
    // Create first row (line 1)
    const row1 = document.createElement('div');
    row1.className = 'flip-panel-container row-1';
    createFlipPanels(row1, line1);
    
    // Create second row (line 2)
    const row2 = document.createElement('div');
    row2.className = 'flip-panel-container row-2';
    createFlipPanels(row2, line2);
    
    // Add rows to container
    rowsContainer.appendChild(row1);
    rowsContainer.appendChild(row2);
    
    // Assemble the scoreboard
    scoreboard.appendChild(header);
    scoreboard.appendChild(basketballLeft);
    scoreboard.appendChild(rowsContainer);
    scoreboard.appendChild(basketballRight);
    
    // Replace the title with our scoreboard
    titleElement.parentNode.replaceChild(scoreboard, titleElement);
    
    // Start the animation with a small delay
    setTimeout(() => {
      // Start first row 
      startFlipAnimation(row1);
      
      // Start second row with a delay
      setTimeout(() => {
        startFlipAnimation(row2);
      }, line1.length * 200 + 300); // Delay second row until after first row completes
      
      // Set up automatic looping every 10 seconds
      setInterval(() => {
        resetAndReplayAnimation(row1, row2);
      }, 10000); // 10 seconds loop
    }, 500);
    
    console.log('Basketball Scoreboard animation initialized with simplified approach');
  }
  
  /**
   * Create flip panels for each character - simplified approach
   * @param {HTMLElement} container - The container to add panels to
   * @param {string} text - The text to display
   */
  function createFlipPanels(container, text) {
    // Clear container
    container.innerHTML = '';
    
    // Create a panel for each character
    for (let i = 0; i < text.length; i++) {
      const character = text[i];
      
      // Create panel
      const panel = document.createElement('div');
      panel.className = character === ' ' ? 'flip-panel space' : 'flip-panel';
      panel.dataset.index = i;
      
      // Create simplified flip card
      const card = document.createElement('div');
      card.className = 'flip-card';
      
      // Create front side (blank)
      const front = document.createElement('div');
      front.className = 'flip-card-front';
      front.textContent = '';
      
      // Create back side (with character)
      const back = document.createElement('div');
      back.className = 'flip-card-back';
      back.textContent = character === ' ' ? '' : character;
      
      // Assemble the card
      card.appendChild(front);
      card.appendChild(back);
      panel.appendChild(card);
      
      // Add to container
      container.appendChild(panel);
    }
  }
  
  /**
   * Start the flip animation sequence
   * @param {HTMLElement} container - The container with panels
   */
  function startFlipAnimation(container) {
    const panels = container.querySelectorAll('.flip-panel');
    
    // Animate each panel with a delay
    panels.forEach((panel, index) => {
      setTimeout(() => {
        // Get the flip card
        const card = panel.querySelector('.flip-card');
        
        // Add the flipped class to trigger animation
        card.classList.add('flipped');
        
        // Play flip sound if allowed
        if (index % 3 === 0) {
          playFlipSound();
        }
      }, index * 200); // 200ms between each flip for more visibility
    });
  }
  
  /**
   * Reset and replay the animation for auto-looping
   * @param {HTMLElement} row1 - The first row container
   * @param {HTMLElement} row2 - The second row container
   */
  function resetAndReplayAnimation(row1, row2) {
    // Reset all flip cards
    const allCards = document.querySelectorAll('.flip-card');
    allCards.forEach(card => {
      card.classList.remove('flipped');
    });
    
    // Start animation after a short delay
    setTimeout(() => {
      // Start first row
      startFlipAnimation(row1);
      
      // Start second row with a delay
      setTimeout(() => {
        startFlipAnimation(row2);
      }, row1.children.length * 200 + 300); // Base delay on actual row length
    }, 300);
  }
  
  /**
   * Play the flip sound effect
   */
  function playFlipSound() {
    console.log('Flip sound would play here');
  }
});