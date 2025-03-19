// Daily reminder
chrome.alarms.create('dailyReminder', { periodInMinutes: 1440 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyReminder') {
    const { lastVisit } = await chrome.storage.local.get('lastVisit');
    if (!lastVisit || Date.now() - lastVisit > 86400000) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Quorini Reminder',
        message: 'Please visit LinkedIn today to continue processing!'
      });
    }
  }
});

// Track LinkedIn visits
chrome.webNavigation.onCompleted.addListener((details) => {
  if (details.url.includes('linkedin.com')) {
    chrome.storage.local.set({ lastVisit: Date.now() });
    chrome.tabs.sendMessage(details.tabId, { action: 'processLinkedIn' });
  }
});