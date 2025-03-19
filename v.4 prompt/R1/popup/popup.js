document.addEventListener('DOMContentLoaded', async () => {
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    const verifyForm = document.getElementById('verify-form');
    const showLogin = document.getElementById('show-login');
    const showSignup = document.getElementById('show-signup');
    
    const { accessToken } = await chrome.storage.local.get('accessToken');
    if (accessToken) {
      document.body.innerHTML = '<div class="success">Account connected!</div>';
      return;
    }
  
    // Form toggle
    showLogin.addEventListener('click', () => {
      signupForm.style.display = 'none';
      loginForm.style.display = 'flex';
    });
  
    showSignup.addEventListener('click', () => {
      loginForm.style.display = 'none';
      signupForm.style.display = 'flex';
    });
  
    // Signup
    document.getElementById('signup-btn').addEventListener('click', async () => {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const linkedinUrl = document.getElementById('linkedin-url').value;
  
      try {
        await AuthService.signUp(email, password, linkedinUrl);
        signupForm.style.display = 'none';
        verifyForm.style.display = 'flex';
        
        // Store temporary credentials
        await chrome.storage.local.set({ tempEmail: email, tempPassword: password });
      } catch (error) {
        alert('Signup failed: ' + error.message);
      }
    });
  
    // Verify
    document.getElementById('verify-btn').addEventListener('click', async () => {
      const code = document.getElementById('code').value;
      const { tempEmail } = await chrome.storage.local.get('tempEmail');
      
      try {
        await AuthService.verifyEmail(code, tempEmail);
        verifyForm.style.display = 'none';
        
        // Auto-login
        const { tempPassword } = await chrome.storage.local.get('tempPassword');
        const { accessToken, refreshToken } = await AuthService.login(tempEmail, tempPassword);
        
        await chrome.storage.local.set({
          accessToken,
          refreshToken,
          email: tempEmail
        });
        
        document.body.innerHTML = '<div class="success">Account verified and logged in!</div>';
      } catch (error) {
        alert('Verification failed: ' + error.message);
      }
    });
  
    // Login
    document.getElementById('login-btn').addEventListener('click', async () => {
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
  
      try {
        const { accessToken, refreshToken } = await AuthService.login(email, password);
        
        await chrome.storage.local.set({
          accessToken,
          refreshToken,
          email
        });
        
        document.body.innerHTML = '<div class="success">Logged in successfully!</div>';
      } catch (error) {
        alert('Login failed: ' + error.message);
      }
    });
  });