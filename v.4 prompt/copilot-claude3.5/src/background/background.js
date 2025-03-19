chrome.runtime.onInstalled.addListener(() => {
    console.log("LinkedIn Chrome Extension installed.");
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url.includes("linkedin.com")) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content/content.js']
        });
    }
});

chrome.alarms.create("visitLinkedInReminder", { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "visitLinkedInReminder") {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: "Reminder",
            message: "Don't forget to check your LinkedIn!",
            priority: 2
        });
    }
});