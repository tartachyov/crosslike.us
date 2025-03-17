// Background service worker
chrome.alarms.create('linkedinReminder', {
    periodInMinutes: 1440 // Check once daily
  });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'linkedinReminder') {
      chrome.storage.local.get(['lastVisit'], (result) => {
        const lastVisit = result.lastVisit || 0;
        const today = new Date().setHours(0,0,0,0);
        
        if (lastVisit < today) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'LinkedIn Reminder',
            message: 'Please visit LinkedIn today!'
          });
        }
      });
    }
  });
  
  chrome.webNavigation.onCompleted.addListener((details) => {
    chrome.storage.local.set({ lastVisit: Date.now() });
  }, { url: [{ hostContains: 'linkedin.com' }] });