// Fix for mobile menu - corrects class name mismatch between JS and CSS

// Function to correct the mobile menu
function fixMobileMenu() {
    // Get the mobile menu elements
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    
    if (!menuToggle || !navLinks) return;
    
    // Remove old event listeners
    const oldElement = menuToggle.cloneNode(true);
    menuToggle.parentNode.replaceChild(oldElement, menuToggle);
    
    // Get the new reference after replacement
    const newMenuToggle = document.getElementById('mobile-menu');
    let scrollPosition = 0;
    
    // Add correct event listeners with 'active' class
    newMenuToggle.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event bubbling
        this.classList.toggle('active'); // Using 'active' to match CSS
        navLinks.classList.toggle('active');
        
        // Toggle body scroll
        if (navLinks.classList.contains('active')) {
            scrollPosition = window.scrollY;
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            window.scrollTo(0, scrollPosition);
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (navLinks.classList.contains('active') && 
            !navLinks.contains(e.target) && 
            !newMenuToggle.contains(e.target)) {
            navLinks.classList.remove('active');
            newMenuToggle.classList.remove('active');
            document.body.style.overflow = '';
            window.scrollTo(0, scrollPosition);
        }
    });
    
    console.log('Mobile menu fixed - class names corrected');
}

// Run the fix when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    fixMobileMenu();
});

// If the document is already loaded, run it immediately
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(fixMobileMenu, 1);
}
