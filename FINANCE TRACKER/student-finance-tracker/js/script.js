document.addEventListener('DOMContentLoaded', function() {
  // Handle active link state
  const navLinks = document.querySelectorAll('.nav-links li a');
  navLinks.forEach(link => {
    link.addEventListener('click', function() {
      navLinks.forEach(l => l.classList.remove('active-link'));
      this.classList.add('active-link');
    });
  });

  // Animation for About section
  const aboutSection = document.querySelector('.about-container');
  const aboutObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      }
      
    });
  }, { threshold: 0.2 });
  aboutObserver.observe(aboutSection);


});