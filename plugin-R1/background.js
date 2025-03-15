let isProcessing = false;

// Daily reminder logic
function checkDailyVisit() {
  chrome.storage.local.get(['lastRun', 'setupComplete'], (result) => {
    if (!result.setupComplete) return;

    const today = new Date().toDateString();
    if (result.lastRun !== today) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon.png',
        title: 'Daily Reminder',
        message: 'Please visit LinkedIn to run auto-engagement!'
      });
    }
  });
}

// Setup check interval
chrome.runtime.onInstalled.addListener(() => {
  setInterval(checkDailyVisit, 60 * 60 * 1000);
});

// Profile processing logic
async function processProfiles() {
  const { userId } = await chrome.storage.local.get('userId');
  const response = await fetch('<https://your-api-endpoint.com/graphql>', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query { listUsers { profileUrl } }`
    })
  });

  const profiles = await response.json();
  for (const profile of profiles.data.listUsers) {
    await chrome.tabs.create({ url: profile.profileUrl });
    // Wait for content script to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Update last run
  await fetch('<https://your-api-endpoint.com/graphql>', {
    method: 'POST',
    body: JSON.stringify({
      query: `mutation { updateUser(lastRun: "${new Date().toISOString()}") }`
    })
  });
  chrome.storage.local.set({ lastRun: new Date().toDateString() });
}

// Message handling
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === 'startProcessing' && !isProcessing) {
    isProcessing = true;
    processProfiles();
    isProcessing = false;
  }
});
