// Set up an alarm that fires every 1440 minutes (24 hours)
chrome.alarms.create("dailyCheck", { periodInMinutes: 1440 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyCheck") {
    chrome.storage.local.get("lastVisited", (data) => {
      const lastVisited = data.lastVisited || 0;
      const today = new Date().setHours(0, 0, 0, 0);
      if (lastVisited < today) {
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "LinkedIn Reminder",
          message: "Please visit linkedin.com today!"
        });
      }
    });
  }
});

// When a tab is updated (and finished loading), check if it’s a LinkedIn page.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab.url && tab.url.includes("linkedin.com") && changeInfo.status === "complete") {
    // Record that the user has visited today.
    chrome.storage.local.set({ lastVisited: new Date().setHours(0, 0, 0, 0) });
    // Check if setup is complete.
    chrome.storage.local.get("setupComplete", (data) => {
      if (data.setupComplete) {
        // Fetch list of profiles via GraphQL.
        fetch('https://your-graphql-endpoint.com/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query ListUsers { listUsers { profileUrl } }`
          })
        })
          .then(res => res.json())
          .then(result => {
            const users = result.data.listUsers;
            // Send the list to the content script for processing.
            chrome.tabs.sendMessage(tabId, { action: "processProfiles", profiles: users });
          })
          .catch(err => console.error("Error fetching profiles:", err));
      }
    });
  }
});

// Listen for the content script’s message that profile processing is finished.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "profilesProcessed") {
    // Call updateUser mutation to set lastRun to current date.
    fetch('https://your-graphql-endpoint.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `mutation UpdateUser($lastRun: DateTime!) { updateUser(lastRun: $lastRun) { id } }`,
        variables: { lastRun: new Date().toISOString() }
      })
    })
      .then(res => res.json())
      .then(result => {
        console.log("User update successful:", result);
        sendResponse({ success: true });
      })
      .catch(err => {
        console.error("Error updating user:", err);
        sendResponse({ success: false });
      });
    return true; // Indicates asynchronous response.
  }
});
