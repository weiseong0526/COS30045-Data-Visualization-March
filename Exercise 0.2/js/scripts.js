// Navigation Script

function showPage(pageId) {
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    // Show selected page
    document.getElementById(pageId).classList.add('active');

    // Update nav active class
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => link.classList.remove('active'));
    document.querySelector(`nav a[href="#${pageId}"]`).classList.add('active');
}

function goHome() {
    showPage('home');
}

// Initialize home page on load
document.addEventListener('DOMContentLoaded', function() {
    showPage('home');
});