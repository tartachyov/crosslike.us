import api from './api.js';
import storage from './storage.js';

/**
 * Background script for the LinkedIn Automation extension
 */
class BackgroundService {
  constructor() {
    this.initialize();
  }

  /**
   * Initialize background service
   */
  async initialize() {
    console.log('LinkedIn Automation: Background service initialized');
    
    // Set up alarm for token refresh (every 50 minutes)
    chrome.alarms.create('refreshToken', { periodInMinutes: 50 });
    
    // Set up alarm for daily reminder (check once a day)
    chrome.alarms.create('dailyReminder', { periodInMinutes: 1440 });
    
    // Listen for alarms
    chrome.alarms.onAlarm.addListener(alarm => {
      if (alarm.name === 'refreshToken') {
        this.refreshToken();
      } else if (alarm.name === 'dailyReminder') {
        this.checkDailyReminder();
      }
    });
    
    // Listen for install/update events
    chrome.runtime.onInstalled.addListener(() => {
      console.log('LinkedIn Automation: Extension installed or updated');
    });
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    try {
      const { refreshToken } = await storage.getAuthTokens();
      if (refreshToken) {
        console.log('LinkedIn Automation: Refreshing token');
        await api.refreshToken();
      }
    } catch (error) {
      console.error('LinkedIn Automation: Token refresh failed', error);
    }
  }

  /**
   * Check if we need to remind the user to visit LinkedIn
   */
  async checkDailyReminder() {
    try {
      const lastVisitedDate = await storage.getLastVisitedDate();
      const today = new Date().toISOString().split('T')[0];
      
      if (lastVisitedDate !== today) {
        console.log('LinkedIn Automation: Showing daily reminder');
        this.showReminderNotification();
      }
    } catch (error) {
      console.error('LinkedIn Automation: Error checking daily reminder', error);
    }
  }

  /**
   * Show reminder notification
   */
  showReminderNotification() {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'images/icon128.png',
      title: 'LinkedIn Automation Reminder',
      message: 'Don\'t forget to visit LinkedIn today to keep your network engaged!',
      buttons: [
        { title: 'Open LinkedIn' }
      ]
    });
    
    // Handle notification click
    chrome.notifications.onClicked.addListener(() => {
      chrome.tabs.create({ url: 'https://www.linkedin.com' });
    });
    
    // Handle button click
    chrome.notifications.onButtonClicked.addListener(() => {
      chrome.tabs.create({ url: 'https://www.linkedin.com' });
    });
  }
}

// Initialize background service
new BackgroundService();
