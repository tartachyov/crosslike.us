// background.js
let userState = {
    isSetup: false,
    lastLinkedInVisit: null,
    lastRun: null,
}

// GraphQL API endpoint
const API_ENDPOINT = "https://your-api-endpoint.com/graphql"

// Initialize alarm for daily reminder
chrome.runtime.onInstalled.addListener(() => {
    // Initialize storage
    chrome.storage.local.get(["userState"], (result) => {
        if (result.userState) {
            userState = result.userState
        } else {
            chrome.storage.local.set({ userState })
        }
    })

    // Create daily alarm for reminders
    chrome.alarms.create("dailyReminder", { periodInMinutes: 1440 }) // 24 hours
})

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "dailyReminder") {
        const today = new Date().toDateString()
        if (!userState.lastLinkedInVisit || new Date(userState.lastLinkedInVisit).toDateString() !== today) {
            showReminder()
        }
    }
})

// Show reminder notification
function showReminder() {
    chrome.notifications.create({
        type: "basic",
        iconUrl: "images/icon128.png",
        title: "LinkedIn Reminder",
        message: "You haven't visited LinkedIn today yet. Click to open LinkedIn.",
        buttons: [{ title: "Open LinkedIn" }],
        priority: 2,
    })
}

// Listen for notification click
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (buttonIndex === 0) {
        chrome.tabs.create({ url: "https://www.linkedin.com/" })
    }
})

// Track when LinkedIn is visited
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url && tab.url.includes("linkedin.com")) {
        // Update last visit time
        userState.lastLinkedInVisit = new Date().toString()
        chrome.storage.local.set({ userState })

        // Check if setup is complete
        if (userState.isSetup) {
            // Notify content script to start automation
            chrome.tabs.sendMessage(tabId, { action: "startAutomation" })
        } else {
            // Notify content script to start setup
            chrome.tabs.sendMessage(tabId, { action: "startSetup" })
        }
    }
})

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "createUser":
            createUser(request.email, request.password, request.profileUrl)
                .then((response) => {
                    userState.userId = response.data.createUser.id
                    chrome.storage.local.set({ userState })
                    sendResponse({ success: true, userId: response.data.createUser.id })
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message })
                })
            return true // Keep the message channel open for async response

        case "setupComplete":
            userState.isSetup = true
            chrome.storage.local.set({ userState })
            sendResponse({ success: true })
            return false

        case "updateLastRun":
            userState.lastRun = new Date().toString()
            chrome.storage.local.set({ userState })

            // Call GraphQL mutation
            updateUserLastRun(userState.userId)
                .then((response) => {
                    sendResponse({ success: true })
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message })
                })
            return true // Keep the message channel open for async response

        case "fetchProfiles":
            fetchUsersList()
                .then((response) => {
                    sendResponse({ success: true, profiles: response.data.listUsers })
                })
                .catch((error) => {
                    sendResponse({ success: false, error: error.message })
                })
            return true // Keep the message channel open for async response
    }
})

// GraphQL API calls
async function createUser(email, password, profileUrl) {
    const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: `
          mutation CreateUser($email: String!, $password: String!, $profileUrl: String!) {
            createUser(input: {
              email: $email,
              password: $password,
              linkedinProfileUrl: $profileUrl
            }) {
              id
              email
              linkedinProfileUrl
            }
          }
        `,
            variables: {
                email,
                password,
                profileUrl,
            },
        }),
    })

    return await response.json()
}

async function updateUserLastRun(userId) {
    const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: `
          mutation UpdateUser($userId: ID!, $lastRun: String!) {
            updateUser(input: {
              id: $userId,
              lastRun: $lastRun
            }) {
              id
              lastRun
            }
          }
        `,
            variables: {
                userId,
                lastRun: new Date().toISOString(),
            },
        }),
    })

    return await response.json()
}

async function fetchUsersList() {
    const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query: `
          query ListUsers {
            listUsers {
              id
              linkedinProfileUrl
            }
          }
        `,
        }),
    })

    return await response.json()
}
