/**
 * Utility class for managing storage
 */
class StorageService {
  /**
   * Save data to chrome storage
   * @param {Object} data - Data to save
   * @returns {Promise} - Promise that resolves when data is saved
   */
  async saveData(data) {
    return chrome.storage.local.set(data);
  }

  /**
   * Get data from chrome storage
   * @param {string|Array|Object} keys - Keys to get
   * @returns {Promise} - Promise that resolves with data
   */
  async getData(keys) {
    return chrome.storage.local.get(keys);
  }

  /**
   * Remove data from chrome storage
   * @param {string|Array} keys - Keys to remove
   * @returns {Promise} - Promise that resolves when data is removed
   */
  async removeData(keys) {
    return chrome.storage.local.remove(keys);
  }

  /**
   * Save authentication tokens
   * @param {Object} tokens - Authentication tokens
   * @returns {Promise} - Promise that resolves when tokens are saved
   */
  async saveAuthTokens(tokens) {
    return this.saveData({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: Date.now() + 3600000 // Assuming 1 hour expiration
    });
  }

  /**
   * Get authentication tokens
   * @returns {Promise} - Promise that resolves with tokens
   */
  async getAuthTokens() {
    return this.getData(['accessToken', 'refreshToken', 'tokenExpiresAt']);
  }

  /**
   * Save current user
   * @param {Object} user - User data
   * @returns {Promise} - Promise that resolves when user is saved
   */
  async saveCurrentUser(user) {
    return this.saveData({ currentUser: user });
  }

  /**
   * Get current user
   * @returns {Promise} - Promise that resolves with user
   */
  async getCurrentUser() {
    const data = await this.getData('currentUser');
    return data.currentUser;
  }

  /**
   * Save automation state
   * @param {Object} state - Automation state
   * @returns {Promise} - Promise that resolves when state is saved 
   */
  async saveAutomationState(state) {
    return this.saveData({ automationState: state });
  }

  /**
   * Get automation state
   * @returns {Promise} - Promise that resolves with state
   */
  async getAutomationState() {
    const data = await this.getData('automationState');
    return data.automationState || null;
  }

  /**
   * Save last visited date
   * @returns {Promise} - Promise that resolves when date is saved
   */
  async saveLastVisitedDate() {
    const today = new Date().toISOString().split('T')[0];
    return this.saveData({ lastVisitedDate: today });
  }

  /**
   * Get last visited date
   * @returns {Promise} - Promise that resolves with date
   */
  async getLastVisitedDate() {
    const data = await this.getData('lastVisitedDate');
    return data.lastVisitedDate;
  }

  /**
   * Clear all data
   * @returns {Promise} - Promise that resolves when data is cleared
   */
  async clearAllData() {
    return chrome.storage.local.clear();
  }
}

const storage = new StorageService();
export default storage;
