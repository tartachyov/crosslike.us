chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('daily-reminder', { periodInMinutes: 1440 });
  });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'daily-reminder') {
      chrome.storage.local.get(['lastVisited', 'setupCompleted'], (data) => {
        const today = new Date().toDateString();
        if (data.setupCompleted && data.lastVisited !== today) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'LinkedIn Reminder',
            message: 'Please visit LinkedIn today to maintain your automation'
          });
        }
      });
    }
  });