// Background script for managing alarms and notifications

// Set up daily reminder alarm
chrome.runtime.onInstalled.addListener(() => {
  // Create daily alarm
  chrome.alarms.create('dailyReminder', {
    periodInMinutes: 24 * 60 // Once per day
  });
  
  console.log('LinkedIn Plugin installed and alarm set');
});

// Listen for alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyReminder') {
    // Check if user has visited LinkedIn today
    const { lastVisitDate } = await chrome.storage.local.get(['lastVisitDate']);
    const today = new Date().toDateString();
    
    // Check if setup is complete
    const { setupComplete } = await chrome.storage.local.get(['setupComplete']);
    
    if (setupComplete && lastVisitDate !== today) {
      // Send notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title: 'LinkedIn Reminder',
        message: 'Don\'t forget to visit LinkedIn today to engage with your network!',
        priority: 2
      });
    }
  }
});

// Listen for notification clicks
chrome.notifications.onClicked.addListener(() => {
  // Open LinkedIn
  chrome.tabs.create({ url: 'https://www.linkedin.com' });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'checkAuthentication') {
    chrome.storage.local.get(['accessToken', 'refreshToken', 'setupComplete'], (result) => {
      sendResponse({
        isAuthenticated: !!(result.accessToken && result.refreshToken),
        isSetupComplete: !!result.setupComplete
      });
    });
    return true; // Keep channel open for async response
  }
  
  // Check automation status
  if (message.action === 'checkAutomationStatus') {
    chrome.storage.local.get(['automationInProgress', 'currentParticipantIndex', 'participantList'], (result) => {
      sendResponse({
        automationInProgress: !!result.automationInProgress,
        currentParticipantIndex: result.currentParticipantIndex || 0,
        totalParticipants: (result.participantList || []).length
      });
    });
    return true; // Keep channel open for async response
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // When a LinkedIn page is fully loaded, check for automation in progress
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('linkedin.com')) {
    chrome.storage.local.get(['automationInProgress'], (result) => {
      if (result.automationInProgress) {
        // Send message to content script to resume automation
        chrome.tabs.sendMessage(tabId, { action: 'resumeAutomation' });
      }
    });
  }
});