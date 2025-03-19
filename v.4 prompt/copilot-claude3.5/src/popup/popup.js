document.addEventListener('DOMContentLoaded', function () {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const switchToLogin = document.getElementById('switch-to-login');
    const switchToSignup = document.getElementById('switch-to-signup');

    switchToLogin.addEventListener('click', function () {
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    switchToSignup.addEventListener('click', function () {
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
    });

    signupForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        // Call API to handle signup
        // Example: api.signup(email, password);
    });

    loginForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        // Call API to handle login
        // Example: api.login(email, password);
    });
});