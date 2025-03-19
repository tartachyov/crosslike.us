import storage from './storage.js';

/**
 * API service for Quorini
 */
class ApiService {
  constructor() {
    this.apiBaseUrl = 'https://api.quorini.io/67d199012a8e29e0e15ab2b8';
    this.authBaseUrl = 'https://auth.quorini.io/67d199012a8e29e0e15ab2b8';
    this.env = 'dev';
  }

  /**
   * Get headers with authorization
   * @returns {Object} - Headers
   */
  async getHeaders() {
    const { accessToken } = await storage.getAuthTokens();
    return {
      'Content-Type': 'application/json',
      'Authorization': accessToken ? `Bearer ${accessToken}` : undefined
    };
  }

  /**
   * Make API call with token refresh if needed
   * @param {string} url - URL to call
   * @param {Object} options - Fetch options
   * @returns {Promise} - Promise that resolves with response
   */
  async makeApiCall(url, options) {
    // Check if token refresh is needed
    const { tokenExpiresAt } = await storage.getAuthTokens();
    if (tokenExpiresAt && tokenExpiresAt < Date.now()) {
      await this.refreshToken();
    }

    const headers = await this.getHeaders();
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Create participant
   * @param {Object} data - User data
   * @returns {Promise} - Promise that resolves with response
   */
  async createParticipant(email, password, linkedInFeedUrl) {
    const url = `${this.apiBaseUrl}/gql?env=${this.env}`;
    const query = `mutation create($input: createParticipantInput!) { 
      createParticipant(input: $input) { 
        id 
      }
    }`;

    const body = {
      authOption: {
        username: email,
        password: password
      },
      query: query,
      variables: {
        input: {
          linkedInFeedUrl: linkedInFeedUrl
        }
      }
    };

    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!result.ok) {
      throw new Error('Failed to create participant');
    }

    const data = await result.json();
    return data;
  }

  /**
   * Verify email
   * @param {string} code - Verification code
   * @param {string} email - User email
   * @returns {Promise} - Promise that resolves with response
   */
  async verifyEmail(code, email) {
    const url = `${this.authBaseUrl}/verify-email/?code=${code}&username=${encodeURIComponent(email)}&env=${this.env}`;
    const result = await fetch(url);
    
    if (!result.ok) {
      throw new Error('Failed to verify email');
    }

    return result;
  }

  /**
   * Login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise} - Promise that resolves with tokens
   */
  async login(email, password) {
    const url = `${this.authBaseUrl}/log-in?env=${this.env}`;
    const body = {
      authOption: {
        username: email,
        password: password
      }
    };

    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!result.ok) {
      throw new Error('Failed to login');
    }

    const data = await result.json();
    await storage.saveAuthTokens(data);
    return data;
  }

  /**
   * Refresh token
   * @returns {Promise} - Promise that resolves with new tokens
   */
  async refreshToken() {
    const { refreshToken } = await storage.getAuthTokens();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const url = `${this.authBaseUrl}/refresh-token/?env=${this.env}`;
    const body = { refreshToken };

    const result = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!result.ok) {
      // Token refresh failed, user needs to log in again
      await storage.removeData(['accessToken', 'refreshToken', 'tokenExpiresAt']);
      throw new Error('Token refresh failed');
    }

    const data = await result.json();
    await storage.saveAuthTokens(data);
    return data;
  }

  /**
   * Get participants list
   * @returns {Promise} - Promise that resolves with participants
   */
  async listParticipants() {
    const url = `${this.apiBaseUrl}/gql?env=${this.env}`;
    const query = `query list { 
      listParticipants { 
        id 
        linkedInFeedUrl 
        isActive 
        lastExecuted 
      } 
    }`;

    const body = {
      query,
      variables: { input: {} }
    };

    return this.makeApiCall(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  /**
   * Get current user ID
   * @returns {Promise} - Promise that resolves with user ID
   */
  async getCurrentUserId() {
    const url = `${this.apiBaseUrl}/gql?env=${this.env}`;
    const query = `query list { 
      listParticipantsForUserSelf { 
        id 
      } 
    }`;

    const body = {
      query,
      variables: { input: {} }
    };

    const result = await this.makeApiCall(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (result.data?.list?.listParticipantsForUserSelf?.length > 0) {
      const userId = result.data.list.listParticipantsForUserSelf[0].id;
      await storage.saveCurrentUser({ id: userId });
      return userId;
    }

    throw new Error('Failed to get current user ID');
  }

  /**
   * Update participant last executed date
   * @returns {Promise} - Promise that resolves with updated participant
   */
  async updateParticipantLastExecuted(userId) {
    const url = `${this.apiBaseUrl}/gql?env=${this.env}`;
    const now = new Date().toISOString();
    
    const query = `mutation update($input: updateParticipantForUserSelfInput!) { 
      updateParticipantForUserSelf(input: $input) { 
        id 
      } 
    }`;

    const body = {
      query,
      variables: {
        input: {
          lastExecuted: now,
          id: userId
        }
      }
    };

    return this.makeApiCall(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }
}

const api = new ApiService();
export default api;
