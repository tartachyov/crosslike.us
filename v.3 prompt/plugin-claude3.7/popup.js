// Popup script for handling the popup UI

// DOM Elements
const setupSection = document.getElementById('setup-section');
const statusSection = document.getElementById('status-section');
const settingsSection = document.getElementById('settings-section');
const statusMessage = document.getElementById('status-message');
const setupButton = document.getElementById('setup-button');
const runButton = document.getElementById('run-button');
const stopButton = document.getElementById('stop-button');
const settingsButton = document.getElementById('settings-button');
const backButton = document.getElementById('back-button');
const logoutButton = document.getElementById('logout-button');
const dailyReminderCheckbox = document.getElementById('daily-reminder');
const progressInfo = document.getElementById('progress-info');
const progressBar = document.getElementById('progress-bar');

// Initialize the popup
async function initializePopup() {
  const { isAuthenticated, isSetupComplete } = await checkAuthenticationStatus();
  
  // Show appropriate sections based on setup status
  setupSection.classList.toggle('hidden', isSetupComplete);
  statusSection.classList.toggle('hidden', !isSetupComplete);
  
  // Check if automation is in progress
  if (isSetupComplete) {
    const automationStatus = await checkAutomationStatus();
    
    // Update status message and UI
    if (isAuthenticated) {
      if (automationStatus.automationInProgress) {
        statusMessage.textContent = 'Automation in progress...';
        runButton.classList.add('hidden');
        
        // Create and show stop button if it doesn't exist
        if (!stopButton) {
          const newStopButton = document.createElement('button');
          newStopButton.id = 'stop-button';
          newStopButton.className = 'warning-button';
          newStopButton.textContent = 'Stop Automation';
          newStopButton.addEventListener('click', stopAutomation);
          runButton.parentNode.insertBefore(newStopButton, runButton.nextSibling);
        } else {
          stopButton.classList.remove('hidden');
        }
        
        // Show progress bar
        updateProgressBar(automationStatus);
      } else {
        statusMessage.textContent = 'Plugin is active and ready to run';
        runButton.classList.remove('hidden');
        if (stopButton) stopButton.classList.add('hidden');
        progressInfo.classList.add('hidden');
        progressBar.classList.add('hidden');
      }
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
        resolve(response || {isAuthenticated: false, isSetupComplete: false});
      }
    );
  });
}

// Check automation status
function checkAutomationStatus() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: 'checkAutomationStatus' },
      (response) => {
        resolve(response || {automationInProgress: false, currentParticipantIndex: 0, totalParticipants: 0});
      }
    );
  });
}

// Update progress bar
function updateProgressBar(status) {
  if (!progressInfo || !progressBar) return;
  
  progressInfo.classList.remove('hidden');
  progressBar.classList.remove('hidden');
  
  const { currentParticipantIndex, totalParticipants } = status;
  const percentage = Math.floor((currentParticipantIndex / totalParticipants) * 100) || 0;
  
  progressInfo.textContent = `Progress: ${currentParticipantIndex + 1} of ${totalParticipants}`;
  progressBar.querySelector('.progress-fill').style.width = `${percentage}%`;
}

// Stop automation
function stopAutomation() {
  chrome.tabs.query({ url: 'https://www.linkedin.com/*' }, (tabs) => {
    if (tabs.length > 0) {
      // Send message to content script to stop automation
      chrome.tabs.sendMessage(tabs[0].id, { action: 'stopAutomation' });
    }
    
    // Update UI
    statusMessage.textContent = 'Automation stopped';
    runButton.classList.remove('hidden');
    if (stopButton) stopButton.classList.add('hidden');
    progressInfo.classList.add('hidden');
    progressBar.classList.add('hidden');
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
    
    // Update UI immediately
    statusMessage.textContent = 'Starting automation...';
    runButton.classList.add('hidden');
    
    // Create stop button if it doesn't exist
    if (!document.getElementById('stop-button')) {
      const newStopButton = document.createElement('button');
      newStopButton.id = 'stop-button';
      newStopButton.className = 'warning-button';
      newStopButton.textContent = 'Stop Automation';
      newStopButton.addEventListener('click', stopAutomation);
      runButton.parentNode.insertBefore(newStopButton, runButton.nextSibling);
    } else {
      document.getElementById('stop-button').classList.remove('hidden');
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

// Create missing UI elements for progress display
document.addEventListener('DOMContentLoaded', () => {
  const statusSection = document.getElementById('status-section');
  
  if (!document.getElementById('progress-info')) {
    const progressInfo = document.createElement('p');
    progressInfo.id = 'progress-info';
    progressInfo.classList.add('hidden');
    statusSection.insertBefore(progressInfo, document.getElementById('run-button').parentNode);
  }
  
  if (!document.getElementById('progress-bar')) {
    const progressBarContainer = document.createElement('div');
    progressBarContainer.id = 'progress-bar';
    progressBarContainer.classList.add('progress-bar', 'hidden');
    
    const progressFill = document.createElement('div');
    progressFill.classList.add('progress-fill');
    progressBarContainer.appendChild(progressFill);
    
    statusSection.insertBefore(progressBarContainer, document.getElementById('run-button').parentNode);
  }
});