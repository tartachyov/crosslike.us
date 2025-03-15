// popup.js
document.addEventListener('DOMContentLoaded', function() {
    const contentDiv = document.getElementById('content');
    
    // Get user state from storage
    chrome.storage.local.get(['userState'], function(result) {
      const userState = result.userState || {};
      
      if (!userState.isSetup) {
        showSetupRequired();
      } else {
        showStatus(userState);
      }
    });
    
    // Show setup required message
    function showSetupRequired() {
      contentDiv.innerHTML = `
        <div class="setup-required">Setup required</div>
        <p>You need to complete the setup process to use this extension.</p>
        <div class="actions">
          <button id="start-setup">Start Setup</button>
        </div>
      `;
      
      document.getElementById('start-setup').addEventListener('click', function() {
        // Open LinkedIn in new tab if not already open
        chrome.tabs.create({ url: 'https://www.linkedin.com/' });
      });
    }
    
    // Show status for configured users
    function showStatus(userState) {
      const lastRun = userState.lastRun ? new Date(userState.lastRun).toLocaleString() : 'Never';
      const lastVisit = userState.lastLinkedInVisit ? new Date(userState.lastLinkedInVisit).toLocaleString() : 'Never';
      
      contentDiv.innerHTML = `
        <div class="status-container">
          <div class="status-item"><strong>Last automation:</strong> ${lastRun}</div>
          <div class="status-item"><strong>Last LinkedIn visit:</strong> ${lastVisit}</div>
        </div>
        <div class="actions">
          <button id="run-now">Run Automation Now</button>
          <button id="open-linkedin">Open LinkedIn</button>
        </div>
      `;
      
      // Add event listeners
      document.getElementById('run-now').addEventListener('click', function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          // Check if current tab is LinkedIn
          if (tabs[0].url.includes('linkedin.com')) {
            chrome.tabs.sendMessage(tabs[0].id, { action: 'startAutomation' });
          } else {
            // Open LinkedIn in new tab
            chrome.tabs.create({ url: 'https://www.linkedin.com/' }, function(tab) {
              // We'll rely on the background script to detect LinkedIn and start automation
            });
          }
        });
      });
      
      document.getElementById('open-linkedin').addEventListener('click', function() {
        chrome.tabs.create({ url: 'https://www.linkedin.com/' });
      });
    }
  });