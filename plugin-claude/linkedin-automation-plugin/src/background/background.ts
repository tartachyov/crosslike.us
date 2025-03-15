chrome.runtime.onInstalled.addListener(() => {
    console.log("LinkedIn Automation Plugin installed.");
    scheduleDailyReminder();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url && tab.url.includes("linkedin.com")) {
        chrome.tabs.executeScript(tabId, { file: "contentScript/linkedinController.js" });
    }
});

function scheduleDailyReminder() {
    chrome.alarms.create("dailyReminder", { periodInMinutes: 1440 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "dailyReminder") {
        remindUserToVisitLinkedIn();
    }
});

function remindUserToVisitLinkedIn() {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "LinkedIn Reminder",
        message: "Don't forget to check your LinkedIn today!",
        priority: 2
    });
}