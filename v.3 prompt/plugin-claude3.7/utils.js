// Utility functions for the plugin

/**
 * Helper to log messages with prefix
 * @param {string} message Message to log
 */
function logMessage(message) {
    console.log(`[LinkedIn Plugin]: ${message}`);
  }
  
  /**
   * Save data to Chrome storage
   * @param {Object} data Data object to save
   * @returns {Promise} Promise resolving when data is saved
   */
  function saveToStorage(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, () => {
        logMessage('Data saved to storage');
        resolve();
      });
    });
  }
  
  /**
   * Load data from Chrome storage
   * @param {string|Array|Object} keys Keys to retrieve
   * @returns {Promise} Promise resolving with the data
   */
  function loadFromStorage(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, (result) => {
        logMessage('Data loaded from storage');
        resolve(result);
      });
    });
  }
  
  /**
   * Wait for specified time
   * @param {number} ms Milliseconds to wait
   * @returns {Promise} Promise that resolves after specified time
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Generate a random wait time between min and max
   * @param {number} min Minimum milliseconds
   * @param {number} max Maximum milliseconds
   * @returns {number} Random wait time
   */
  function randomWait(min = 1000, max = 3000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  /**
   * Check if a date is within the last N days
   * @param {string} dateString ISO date string
   * @param {number} days Number of days to check
   * @returns {boolean} True if date is within last N days
   */
  function isWithinLastDays(dateString, days) {
    if (!dateString) return false;
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays <= days;
  }
  
  /**
   * Format current date as ISO string for API calls
   * @returns {string} Formatted date string
   */
  function getCurrentDateFormatted() {
    return new Date().toISOString();
  }
  
  /**
   * Shows a notification to the user
   * @param {string} title Notification title
   * @param {string} message Notification message
   */
  function showNotification(title, message) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon128.png',
      title: title,
      message: message
    });
  }