document.addEventListener('DOMContentLoaded', async () => {
    const setupContainer = document.getElementById('setup-container');
    const statusContainer = document.createElement('div');
    let userData = await chrome.storage.local.get(['setupComplete', 'lastRun', 'stripeId']);
  
    // Create status UI elements
    statusContainer.innerHTML = `
      <h2>Auto Engagement Status</h2>
      <p>Last run: <span id="last-run">${userData.lastRun || 'Never'}</span></p>
      <p>Subscription: <span id="subscription-status">${userData.stripeId ? 'Active' : 'Inactive'}</span></p>
      <button id="manual-trigger">Run Now</button>
      <button id="open-linkedin">Open LinkedIn</button>
    `;
  
    document.body.appendChild(statusContainer);
  
    // Check setup status
    if (!userData.setupComplete) {
      statusContainer.style.display = 'none';
      setupContainer.innerHTML += `
        <button id="start-setup">Start Setup</button>
      `;
      
      document.getElementById('start-setup').addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.update(tabs[0].id, {url: 'https://www.linkedin.com'}, (tab) => {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['contentScript.js']
            });
          });
        });
      });
    } else {
      setupContainer.style.display = 'none';
      statusContainer.style.display = 'block';
  
      // Update last run time every minute
      setInterval(async () => {
        userData = await chrome.storage.local.get('lastRun');
        document.getElementById('last-run').textContent = userData.lastRun || 'Never';
      }, 60000);
    }
  
    // Manual trigger handler
    document.getElementById('manual-trigger')?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'startProcessing' });
      window.close();
    });
  
    // LinkedIn opener
    document.getElementById('open-linkedin')?.addEventListener('click', () => {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.update(tabs[0].id, {url: 'https://www.linkedin.com'}, (tab) => {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['contentScript.js']
          });
        });
      });
      window.close();
    });
  
    // Listen for storage updates
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.setupComplete) {
        window.location.reload();
      }
      if (changes.lastRun) {
        document.getElementById('last-run').textContent = changes.lastRun.newValue;
      }
      if (changes.stripeId) {
        document.getElementById('subscription-status').textContent = 
          changes.stripeId.newValue ? 'Active' : 'Inactive';
      }
    });
  });