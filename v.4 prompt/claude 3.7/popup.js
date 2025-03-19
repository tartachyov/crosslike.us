import api from './api.js';
import storage from './storage.js';

/**
 * Popup UI Controller
 */
class PopupController {
  constructor() {
    this.emailForVerification = null;
    this.passwordForLogin = null;
    this.initElements();
    this.initEventListeners();
    this.checkAuthStatus();
  }

  /**
   * Initialize DOM elements
   */
  initElements() {
    // Containers
    this.authContainer = document.getElementById('auth-container');
    this.dashboardContainer = document.getElementById('dashboard-container');
    this.successContainer = document.getElementById('success-container');

    // Auth tabs and forms
    this.loginTab = document.getElementById('login-tab');
    this.signupTab = document.getElementById('signup-tab');
    this.loginForm = document.getElementById('login-form');
    this.signupForm = document.getElementById('signup-form');
    this.verifyForm = document.getElementById('verify-form');

    // Login form elements
    this.loginEmail = document.getElementById('login-email');
    this.loginPassword = document.getElementById('login-password');
    this.loginBtn = document.getElementById('login-btn');
    this.loginError = document.getElementById('login-error');

    // Signup form elements
    this.signupEmail = document.getElementById('signup-email');
    this.signupPassword = document.getElementById('signup-password');
    this.linkedinUrl = document.getElementById('linkedin-url');
    this.signupBtn = document.getElementById('signup-btn');
    this.signupError = document.getElementById('signup-error');

    // Verify form elements
    this.verificationCode = document.getElementById('verification-code');
    this.verifyBtn = document.getElementById('verify-btn');
    this.verifyError = document.getElementById('verify-error');

    // Dashboard elements
    this.statusText = document.getElementById('status-text');
    this.lastRun = document.getElementById('last-run');
    this.startBtn = document.getElementById('start-btn');
    this.logoutBtn = document.getElementById('logout-btn');
    this.logContainer = document.getElementById('log-container');

    // Success container elements
    this.continueBtn = document.getElementById('continue-btn');
  }

  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Tab switching
    this.loginTab.addEventListener('click', () => this.switchTab('login'));
    this.signupTab.addEventListener('click', () => this.switchTab('signup'));

    // Form submissions
    this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
    this.verifyForm.addEventListener('submit', (e) => this.handleVerification(e));

    // Dashboard buttons
    this.startBtn.addEventListener('click', () => this.startAutomation());
    this.logoutBtn.addEventListener('click', () => this.handleLogout());

    // Success container
    this.continueBtn.addEventListener('click', () => this.showDashboard());
  }

  /**
   * Switch between login and signup tabs
   * @param {string} tab - Tab to switch to
   */
  switchTab(tab) {
    if (tab === 'login') {
      this.loginTab.classList.add('active');
      this.signupTab.classList.remove('active');
      this.loginForm.classList.remove('hidden');
      this.signupForm.classList.add('hidden');
    } else {
      this.loginTab.classList.remove('active');
      this.signupTab.classList.add('active');
      this.loginForm.classList.add('hidden');
      this.signupForm.classList.remove('hidden');
    }
  }

  /**
   * Check authentication status
   */
  async checkAuthStatus() {
    try {
      const { accessToken } = await storage.getAuthTokens();
      if (accessToken) {
        await this.loadDashboardData();
        this.showDashboard();
      } else {
        this.showAuth();
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.showAuth();
    }
  }

  /**
   * Show authentication container
   */
  showAuth() {
    this.authContainer.classList.remove('hidden');
    this.dashboardContainer.classList.add('hidden');
    this.successContainer.classList.add('hidden');
  }

  /**
   * Show dashboard container
   */
  showDashboard() {
    this.authContainer.classList.add('hidden');
    this.dashboardContainer.classList.remove('hidden');
    this.successContainer.classList.add('hidden');
  }

  /**
   * Show success container
   */
  showSuccess() {
    this.authContainer.classList.add('hidden');
    this.dashboardContainer.classList.add('hidden');
    this.successContainer.classList.remove('hidden');
  }

  /**
   * Show verification form
   */
  showVerification() {
    this.loginForm.classList.add('hidden');
    this.signupForm.classList.add('hidden');
    this.verifyForm.classList.remove('hidden');
  }

  /**
   * Handle login form submission
   * @param {Event} e - Form submit event
   */
  async handleLogin(e) {
    e.preventDefault();
    
    try {
      this.loginError.textContent = '';
      this.loginBtn.disabled = true;
      this.loginBtn.textContent = 'Logging in...';
      
      const email = this.loginEmail.value;
      const password = this.loginPassword.value;
      
      await api.login(email, password);
      await this.loadDashboardData();
      this.showDashboard();
    } catch (error) {
      console.error('Login error:', error);
      this.loginError.textContent = 'Login failed. Please check your credentials.';
    } finally {
      this.loginBtn.disabled = false;
      this.loginBtn.textContent = 'Login';
    }
  }

  /**
   * Handle signup form submission
   * @param {Event} e - Form submit event
   */
  async handleSignup(e) {
    e.preventDefault();
    
    try {
      this.signupError.textContent = '';
      this.signupBtn.disabled = true;
      this.signupBtn.textContent = 'Creating account...';
      
      const email = this.signupEmail.value;
      const password = this.signupPassword.value;
      const linkedInUrl = this.linkedinUrl.value;
      
      // Save for later use in verification
      this.emailForVerification = email;
      this.passwordForLogin = password;
      
      await api.createParticipant(email, password, linkedInUrl);
      this.showVerification();
    } catch (error) {
      console.error('Signup error:', error);
      this.signupError.textContent = 'Signup failed. Please try again.';
    } finally {
      this.signupBtn.disabled = false;
      this.signupBtn.textContent = 'Sign Up';
    }
  }

  /**
   * Handle verification form submission
   * @param {Event} e - Form submit event
   */
  async handleVerification(e) {
    e.preventDefault();
    
    try {
      this.verifyError.textContent = '';
      this.verifyBtn.disabled = true;
      this.verifyBtn.textContent = 'Verifying...';
      
      const code = this.verificationCode.value;
      
      await api.verifyEmail(code, this.emailForVerification);
      await api.login(this.emailForVerification, this.passwordForLogin);
      
      this.showSuccess();
    } catch (error) {
      console.error('Verification error:', error);
      this.verifyError.textContent = 'Verification failed. Please check the code and try again.';
    } finally {
      this.verifyBtn.disabled = false;
      this.verifyBtn.textContent = 'Verify';
    }
  }

  /**
   * Load dashboard data
   */
  async loadDashboardData() {
    try {
      const userId = await api.getCurrentUserId();
      const user = await storage.getCurrentUser();
      
      if (user) {
        const state = await storage.getAutomationState();
        if (state) {
          this.statusText.textContent = state.isRunning ? 'Running' : 'Ready';
        }

        if (user.lastExecuted) {
          const lastExecutedDate = new Date(user.lastExecuted);
          this.lastRun.textContent = lastExecutedDate.toLocaleString();
        } else {
          this.lastRun.textContent = 'Never';
        }
      }
      
      this.addLogMessage('Plugin ready');
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.addLogMessage('Error loading user data');
    }
  }

  /**
   * Start automation
   */
  startAutomation() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab.url.includes('linkedin.com')) {
        chrome.tabs.sendMessage(currentTab.id, { action: 'startAutomation' });
        this.addLogMessage('Starting automation...');
        this.statusText.textContent = 'Starting...';
      } else {
        this.addLogMessage('Please navigate to LinkedIn first');
        chrome.tabs.create({ url: 'https://www.linkedin.com' });
      }
    });
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    try {
      await storage.clearAllData();
      this.showAuth();
      this.addLogMessage('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  /**
   * Add log message
   * @param {string} message - Message to log
   */
  addLogMessage(message) {
    const time = new Date().toLocaleTimeString();
    const logItem = document.createElement('div');
    logItem.className = 'log-item';
    
    const logTime = document.createElement('span');
    logTime.className = 'log-time';
    logTime.textContent = time;
    
    const logMessage = document.createElement('span');
    logMessage.textContent = message;
    
    logItem.appendChild(logTime);
    logItem.appendChild(logMessage);
    this.logContainer.appendChild(logItem);

    // Scroll to bottom
    this.logContainer.scrollTop = this.logContainer.scrollHeight;
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
