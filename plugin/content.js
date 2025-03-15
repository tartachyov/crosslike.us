// Setup Phase
chrome.storage.local.get(['setupComplete'], async (result) => {
    if (!result.setupComplete) {
      if (window.location.href.includes('/in/')) {
        // Profile detection and form injection
        const formHTML = `
          <div id="setup-form">
            <input type="email" id="userEmail">
            <input type="password" id="userPassword">
            <button id="completeSetup">Complete Setup</button>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', formHTML);
  
        document.getElementById('completeSetup').addEventListener('click', async () => {
          const userData = {
            email: document.getElementById('userEmail').value,
            password: document.getElementById('userPassword').value,
            profileUrl: window.location.href
          };
  
          // Save user and initiate Stripe
          await chrome.runtime.sendMessage({ action: 'createUser', ...userData });
          window.location.href = chrome.runtime.getURL('stripe/stripe.html');
        });
      }
    } else {
      // Engagement Automation
      const posts = document.querySelectorAll('.feed-shared-update-v2');
      const likeButtons = document.querySelectorAll('[aria-label="Like"]');
  
      for (let i = 0; i < Math.min(5, likeButtons.length); i++) {
        likeButtCroons[i].click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
  
      chrome.runtime.sendMessage({ action: 'profileCompleted' });
    }
  });
  