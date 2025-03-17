// Popup script for handling the popup UI

// DOM Elements
const setupSection = document.getElementById('setup-section');
const statusSection = document.getElementById('status-section');
const settingsSection = document.getElementById('settings-section');
const statusMessage = document.getElementById('status-message');
const setupButton = document.getElementById('setup-button');
const runButton = document.getElementById('run-button');
const settingsButton = document.getElementById('settings-button');
const backButton = document.getElementById('back-button');
const logoutButton = document.getElementById('logout-button');
const dailyReminderCheckbox = document.getElementById('daily-reminder');

// Initialize the popup
async function initializePopup() {
  const { isAuthenticated, isSetupComplete } = await checkAuthenticationStatus();
  
  // Show appropriate sections based on setup status
  setupSection.classList.toggle('hidden', isSetupComplete);
  statusSection.classList.toggle('hidden', !isSetupComplete);
  
  // Update status message
  if (isSetupComplete) {
    if (isAuthenticated) {
      statusMessage.textContent = 'Plugin is active and ready to run';
    } else {
      statusMessage.textContent = 'Authentication expired. Please log in again.';
    }
  }
  
  // Load settings
  const { dailyReminder = true } = await loadFromStorage(['dailyReminder']);
  dailyReminderCheckbox.checked = dailyReminder;
}

// Check authentication status
function checkAuthenticationStatus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'checkAuthentication' },
      (response) => {
        resolve(response);
      }
    );
  });
}

// Event Listeners
setupButton.addEventListener('click', () => {
  // Open LinkedIn in a new tab if it's not already open
  chrome.tabs.query({ url: 'https://www.linkedin.com/*' }, (tabs) => {
    if (tabs.length > 0) {
      // LinkedIn is already open, focus on it
      chrome.tabs.update(tabs[0].id, { active: true });
    } else {
      // Open LinkedIn
      chrome.tabs.create({ url: 'https://www.linkedin.com' });
    }
  });
});

runButton.addEventListener('click', () => {
  // Find a LinkedIn tab or create one
  chrome.tabs.query({ url: 'https://www.linkedin.com/*' }, (tabs) => {
    if (tabs.length > 0) {
      // LinkedIn is already open, focus on it and send message to run automation
      chrome.tabs.update(tabs[0].id, { active: true });
      chrome.tabs.sendMessage(tabs[0].id, { action: 'runAutomation' });
    } else {
      // Open LinkedIn
      chrome.tabs.create({ url: 'https://www.linkedin.com' }, (tab) => {
        // Wait for the page to load, then send message
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id, { action: 'runAutomation' });
        }, 3000);
      });
    }
    
    // Close the popup
    window.close();
  });
});

settingsButton.addEventListener('click', () => {
  statusSection.classList.add('hidden');
  settingsSection.classList.remove('hidden');
});

backButton.addEventListener('click', () => {
  settingsSection.classList.add('hidden');
  statusSection.classList.remove('hidden');
});

logoutButton.addEventListener('click', async () => {
  await logout();
  initializePopup();
});

dailyReminderCheckbox.addEventListener('change', (event) => {
  saveToStorage({ dailyReminder: event.target.checked });
});

// Initialize the popup when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);