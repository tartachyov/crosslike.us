let isProcessing = false;
let currentTabId = null;
let participantsToProcess = [];
let currentParticipantIndex = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'linkedin_loaded' && !isProcessing) {
    isProcessing = true;
    currentTabId = sender.tab.id;
    startMainProcess().then(() => sendResponse({ success: true }));
    return true;
  } else if (message.type === 'posts_liked') {
    processNextParticipant();
    sendResponse({ success: true });
  } else if (message.type === 'signup') {
    createParticipant(message.data.email, message.data.password, message.data.linkedinUrl)
      .then(id => sendResponse({ success: true, id }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (message.type === 'verify') {
    verifyEmail(message.data.code, message.data.username)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (message.type === 'login') {
    login(message.data.email, message.data.password)
      .then(tokens => {
        saveTokens(tokens.accessToken, tokens.refreshToken);
        sendResponse({ success: true });
      })
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  } else if (message.type === 'get_status') {
    getAccessToken().then(token => sendResponse({ loggedIn: !!token }));
    return true;
  } else if (message.type === 'visited_linkedin') {
    chrome.storage.local.set({ lastVisitDate: new Date().toISOString() });
  }
});

async function startMainProcess() {
  try {
    const participants = await fetchParticipants();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    participantsToProcess = participants.filter(p => new Date(p.lastExecuted) >= threeDaysAgo && p.isActive);
    currentParticipantIndex = 0;
    if (participantsToProcess.length > 0) {
      processNextParticipant();
    } else {
      await updateLastExecuted();
      isProcessing = false;
    }
  } catch (error) {
    console.error('Main process error:', error);
    isProcessing = false;
  }
}

function processNextParticipant() {
  if (currentParticipantIndex < participantsToProcess.length) {
    const participant = participantsToProcess[currentParticipantIndex];
    chrome.tabs.update(currentTabId, { url: participant.linkedInFeedUrl }, () => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === currentTabId && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.sendMessage(currentTabId, { type: 'like_posts' });
          currentParticipantIndex++;
        }
      });
    });
  } else {
    updateLastExecuted().then(() => isProcessing = false);
  }
}

async function fetchParticipants() {
  const data = await makeGqlCall('query list { listParticipants { id linkedInFeedUrl isActive lastExecuted } }', {});
  return data.listParticipants;
}

async function updateLastExecuted() {
  const userData = await makeGqlCall('query list { listParticipantsForUserSelf { id } }', {});
  const userId = userData.listParticipantsForUserSelf[0].id;
  const now = new Date().toISOString();
  await makeGqlCall('mutation update($input: updateParticipantForUserSelfInput!) { updateParticipantForUserSelf(input: $input) { id } }', {
    input: { lastExecuted: now, id: userId }
  });
}

async function createParticipant(email, password, linkedInUrl) {
  const url = 'https://api.quorini.io/67d199012a8e29e0e15ab2b8/gql?env=dev';
  const body = {
    authOption: { username: email, password },
    query: 'mutation create($input: createParticipantInput!) { createParticipant(input: $input) { id } }',
    variables: { input: { linkedInFeedUrl: linkedInUrl } }
  };
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data.createParticipant.id;
}

async function verifyEmail(code, username) {
  const url = `https://auth.quorini.io/67d199012a8e29e0e15ab2b8/verify-email/?code=${code}&username=${username}&env=dev`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Verification failed');
}

async function login(email, password) {
  const url = 'https://auth.quorini.io/67d199012a8e29e0e15ab2b8/log-in?env=dev';
  const body = { authOption: { username: email, password } };
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

async function refreshTokenFunc() {
  const refreshToken = await getRefreshToken();
  const url = 'https://auth.quorini.io/67d199012a8e29e0e15ab2b8/refresh-token/?env=dev';
  const body = { refreshToken };
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await response.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return { accessToken: data.accessToken, refreshToken: data.refreshToken };
}

async function makeGqlCall(query, variables) {
  const url = 'https://api.quorini.io/67d199012a8e29e0e15ab2b8/gql?env=dev';
  let accessToken = await getAccessToken();
  const body = { query, variables };
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` };
  let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (response.status === 401) {
    const tokens = await refreshTokenFunc();
    await saveTokens(tokens.accessToken, tokens.refreshToken);
    headers['Authorization'] = `Bearer ${tokens.accessToken}`;
    response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  }
  const data = await response.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data;
}

async function getAccessToken() {
  const { accessToken } = await chrome.storage.local.get('accessToken');
  return accessToken;
}

async function getRefreshToken() {
  const { refreshToken } = await chrome.storage.local.get('refreshToken');
  return refreshToken;
}

async function saveTokens(accessToken, refreshToken) {
  await chrome.storage.local.set({ accessToken, refreshToken });
}

chrome.alarms.create('daily_reminder', { periodInMinutes: 1440 });
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'daily_reminder') {
    checkLastVisit();
  }
});

async function checkLastVisit() {
  const { lastVisitDate } = await chrome.storage.local.get('lastVisitDate');
  const today = new Date().toDateString();
  if (!lastVisitDate || new Date(lastVisitDate).toDateString() !== today) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'Reminder',
      message: 'Please visit LinkedIn today to run the plugin.'
    });
  }
}