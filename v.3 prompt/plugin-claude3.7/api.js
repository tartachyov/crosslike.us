// API functions for interacting with Quorini backend

const API_URL = 'https://api.quorini.io/67d199012a8e29e0e15ab2b8/gql';
const AUTH_URL = 'https://auth.quorini.io/67d199012a8e29e0e15ab2b8';
const ENV = 'dev';

/**
 * Makes an API call with authentication
 * @param {string} url API URL
 * @param {Object} payload Request payload
 * @param {boolean} requiresAuth Whether auth token is required
 * @returns {Promise} Promise resolving with response data
 */
async function makeApiCall(url, payload, requiresAuth = true) {
  try {
    // If auth required, ensure we have a valid token
    let headers = {
      'Content-Type': 'application/json'
    };
    
    if (requiresAuth) {
      await refreshTokenIfNeeded();
      const { accessToken } = await loadFromStorage(['accessToken']);
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    logMessage(`API call error: ${error.message}`);
    throw error;
  }
}

/**
 * Creates a new participant
 * @param {string} email User email
 * @param {string} password User password
 * @param {string} linkedInUrl LinkedIn profile URL
 * @returns {Promise} Promise resolving with created participant ID
 */
async function createParticipant(email, password, linkedInUrl) {
  const payload = {
    authOption: {
      username: email,
      password: password
    },
    query: "mutation create($input: createParticipantInput!) { createParticipant(input: $input) { id }}",
    variables: {
      input: {
        linkedInFeedUrl: linkedInUrl
      }
    }
  };
  
  const url = `${API_URL}?env=${ENV}`;
  const response = await makeApiCall(url, payload, false);
  
  if (response.errors) {
    throw new Error(response.errors[0].message);
  }
  
  return response.data.createParticipant.id;
}

/**
 * Verifies email with verification code
 * @param {string} code Verification code
 * @param {string} email User email
 * @returns {Promise} Promise resolving with verification result
 */
async function verifyEmail(code, email) {
  const url = `${AUTH_URL}/verify-email/?code=${code}&username=${encodeURIComponent(email)}&env=${ENV}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`Verification failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    logMessage(`Verification error: ${error.message}`);
    throw error;
  }
}

/**
 * Logs in user and gets auth tokens
 * @param {string} email User email
 * @param {string} password User password
 * @returns {Promise} Promise resolving with auth tokens
 */
async function login(email, password) {
  const payload = {
    authOption: {
      username: email,
      password: password
    }
  };
  
  const url = `${AUTH_URL}/log-in?env=${ENV}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Login failed: ${response.status}`);
    }
    
    const data = await response.json();
    await saveToStorage({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiry: new Date(Date.now() + 60 * 60 * 1000).toISOString() // Set expiry to 1 hour
    });
    
    return data;
  } catch (error) {
    logMessage(`Login error: ${error.message}`);
    throw error;
  }
}

/**
 * Refreshes auth token
 * @returns {Promise} Promise resolving with new auth tokens
 */
async function refreshToken() {
  const { refreshToken } = await loadFromStorage(['refreshToken']);
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const payload = {
    refreshToken: refreshToken
  };
  
  const url = `${AUTH_URL}/refresh-token/?env=${ENV}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }
    
    const data = await response.json();
    await saveToStorage({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiry: new Date(Date.now() + 60 * 60 * 1000).toISOString() // Set expiry to 1 hour
    });
    
    return data;
  } catch (error) {
    logMessage(`Token refresh error: ${error.message}`);
    throw error;
  }
}

/**
 * Checks if token needs refresh and refreshes if needed
 * @returns {Promise} Promise resolving when check/refresh is done
 */
async function refreshTokenIfNeeded() {
  const { accessToken, tokenExpiry } = await loadFromStorage(['accessToken', 'tokenExpiry']);
  
  // If no token or expiry, or token is expired, refresh
  if (!accessToken || !tokenExpiry || new Date(tokenExpiry) <= new Date()) {
    logMessage('Token expired or not found, refreshing...');
    await refreshToken();
  }
}

/**
 * Gets list of participants
 * @returns {Promise} Promise resolving with participants data
 */
async function listParticipants() {
  const payload = {
    query: "query list { listParticipants { id linkedInFeedUrl isActive lastExecuted } }",
    variables: {
      input: {}
    }
  };
  
  const url = `${API_URL}?env=${ENV}`;
  const response = await makeApiCall(url, payload);
  
  if (response.errors) {
    throw new Error(response.errors[0].message);
  }
  
  return response.data.list.listParticipants;
}

/**
 * Gets current user's participant ID
 * @returns {Promise} Promise resolving with current user ID
 */
async function getCurrentUserId() {
  const payload = {
    query: "query list { listParticipantsForUserSelf { id } }",
    variables: {
      input: {}
    }
  };
  
  const url = `${API_URL}?env=${ENV}`;
  const response = await makeApiCall(url, payload);
  
  if (response.errors) {
    throw new Error(response.errors[0].message);
  }
  
  if (!response.data.list.listParticipantsForUserSelf || 
      response.data.list.listParticipantsForUserSelf.length === 0) {
    throw new Error('Current user not found');
  }
  
  return response.data.list.listParticipantsForUserSelf[0].id;
}

/**
 * Updates participant's lastExecuted time
 * @param {string} participantId Participant ID to update
 * @returns {Promise} Promise resolving with update result
 */
async function updateParticipantLastExecuted(participantId) {
  const currentDate = getCurrentDateFormatted();
  
  const payload = {
    query: "mutation update($input: updateParticipantForUserSelfInput!) { updateParticipantForUserSelf(input: $input) { id } }",
    variables: {
      input: {
        lastExecuted: currentDate,
        id: participantId
      }
    }
  };
  
  const url = `${API_URL}?env=${ENV}`;
  const response = await makeApiCall(url, payload);
  
  if (response.errors) {
    throw new Error(response.errors[0].message);
  }
  
  return response.data.updateParticipantForUserSelf;
}