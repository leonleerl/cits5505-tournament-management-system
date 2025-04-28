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
