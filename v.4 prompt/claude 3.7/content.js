import api from './api.js';
import storage from './storage.js';

/**
 * Content script for LinkedIn automation
 */
class LinkedInAutomation {
  constructor() {
    this.isRunning = false;
    this.participants = [];
    this.currentParticipantIndex = 0;
    this.processedLikes = 0;
    this.totalLikes = 0;
    this.currentProfileUrl = '';
    this.floatingButton = null;
    this.pluginPanel = null;
    
    this.init();
  }

  /**
   * Initialize automation
   */
  async init() {
    if (window.location.hostname.includes('linkedin.com')) {
      console.log('LinkedIn Automation: Initializing on LinkedIn');
      
      // Create floating button
      this.createFloatingButton();
      
      // Create plugin panel
      this.createPluginPanel();
      
      // Set up message listener
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'startAutomation') {
          this.startAutomation();
        }
        return true;
      });
      
      // Check if there's a saved state to resume
      const state = await storage.getAutomationState();
      if (state && state.isRunning) {
        console.log('LinkedIn Automation: Resuming from saved state');
        this.isRunning = true;
        this.participants = state.participants || [];
        this.currentParticipantIndex = state.currentParticipantIndex || 0;
        this.processedLikes = state.processedLikes || 0;
        this.totalLikes = state.totalLikes || 0;
        this.currentProfileUrl = state.currentProfileUrl || '';
        
        // Resume automation if we're on the right page
        if (window.location.href === this.currentProfileUrl) {
          this.continueAutomation();
        }
      }
      
      // Mark page as visited for daily reminder
      await storage.saveLastVisitedDate();
    }
  }

  /**
   * Create floating button
   */
  createFloatingButton() {
    this.floatingButton = document.createElement('button');
    this.floatingButton.className = 'linkedin-automation-btn';
    this.floatingButton.innerHTML = '<span>Q</span>';
    this.floatingButton.title = 'LinkedIn Automation';
    
    this.floatingButton.addEventListener('click', () => {
      this.togglePluginPanel();
    });
    
    document.body.appendChild(this.floatingButton);
  }

  /**
   * Create plugin panel
   */
  createPluginPanel() {
    this.pluginPanel = document.createElement('div');
    this.pluginPanel.className = 'plugin-panel';
    
    this.pluginPanel.innerHTML = `
      <div class="panel-header">
        <div class="panel-title">LinkedIn Automation</div>
        <button class="close-btn">×</button>
      </div>
      <div class="panel-content">
        <div id="panel-status">Ready</div>
        
        <div class="progress-container">
          <div class="progress-text">Progress: <span id="progress-text">0/0</span></div>
          <div class="progress-bar">
            <div id="progress-fill" class="progress-fill"></div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.pluginPanel);
    
    // Set up close button
    const closeBtn = this.pluginPanel.querySelector('.close-btn');
    closeBtn.addEventListener('click', () => {
      this.togglePluginPanel(false);
    });
  }

  /**
   * Toggle plugin panel
   * @param {boolean} show - Whether to show the panel
   */
  togglePluginPanel(show) {
    if (show === undefined) {
      this.pluginPanel.classList.toggle('visible');
    } else if (show) {
      this.pluginPanel.classList.add('visible');
    } else {
      this.pluginPanel.classList.remove('visible');
    }
  }

  /**
   * Update plugin panel status
   * @param {string} status - Status message
   * @param {number} progress - Progress percentage
   */
  updatePanelStatus(status, progress) {
    const panelStatus = this.pluginPanel.querySelector('#panel-status');
    const progressText = this.pluginPanel.querySelector('#progress-text');
    const progressFill = this.pluginPanel.querySelector('#progress-fill');
    
    if (panelStatus) {
      panelStatus.textContent = status;
    }
    
    if (progressText) {
      progressText.textContent = `${this.processedLikes}/${this.totalLikes}`;
    }
    
    if (progressFill && progress !== undefined) {
      progressFill.style.width = progress + '%';
    }
  }

  /**
   * Start automation
   */
  async startAutomation() {
    if (this.isRunning) {
      console.log('LinkedIn Automation: Already running');
      return;
    }
    
    try {
      console.log('LinkedIn Automation: Starting');
      this.isRunning = true;
      this.floatingButton.classList.add('running');
      this.togglePluginPanel(true);
      this.updatePanelStatus('Fetching participants...', 0);
      
      // Fetch participants
      const result = await api.listParticipants();
      if (!result.data?.list?.listParticipants) {
        throw new Error('Failed to fetch participants');
      }
      
      this.participants = result.data.list.listParticipants.filter(p => p.isActive);
      console.log(`LinkedIn Automation: Found ${this.participants.length} active participants`);
      
      if (this.participants.length === 0) {
        this.updatePanelStatus('No active participants found', 0);
        this.stopAutomation();
        return;
      }
      
      // Filter participants by last executed within 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      this.participants = this.participants.filter(p => {
        if (!p.lastExecuted) return true;
        const lastExecuted = new Date(p.lastExecuted);
        return lastExecuted >= threeDaysAgo;
      });
      
      this.currentParticipantIndex = 0;
      this.processedLikes = 0;
      this.totalLikes = this.participants.length * 5; // 5 posts per participant
      
      this.updatePanelStatus('Starting automation...', 0);
      
      // Start processing
      await this.processNextParticipant();
    } catch (error) {
      console.error('LinkedIn Automation Error:', error);
      this.updatePanelStatus(`Error: ${error.message}`, 0);
      this.stopAutomation();
    }
  }

  /**
   * Process next participant
   */
  async processNextParticipant() {
    if (!this.isRunning || this.currentParticipantIndex >= this.participants.length) {
      await this.finishAutomation();
      return;
    }
    
    const participant = this.participants[this.currentParticipantIndex];
    this.currentProfileUrl = participant.linkedInFeedUrl;
    
    this.updatePanelStatus(`Navigating to profile ${this.currentParticipantIndex + 1}/${this.participants.length}`, 
      (this.processedLikes / this.totalLikes) * 100);
    
    // Save state before navigation
    await this.saveAutomationState();
    
    // Navigate to participant's page
    window.location.href = participant.linkedInFeedUrl;
  }

  /**
   * Continue automation after page navigation
   */
  async continueAutomation() {
    if (!this.isRunning) return;
    
    try {
      // Wait for page to load
      await this.waitForSelector('.social-details-social-activity');
      
      this.updatePanelStatus(`Liking posts for profile ${this.currentParticipantIndex + 1}/${this.participants.length}`, 
        (this.processedLikes / this.totalLikes) * 100);
      
      // Wait to make sure posts are loaded
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Find and like posts
      await this.likePostsOnCurrentPage();
      
      // Move to next participant
      this.currentParticipantIndex++;
      await this.processNextParticipant();
    } catch (error) {
      console.error('LinkedIn Automation Error:', error);
      this.updatePanelStatus(`Error: ${error.message}`, 
        (this.processedLikes / this.totalLikes) * 100);
      this.stopAutomation();
    }
  }

  /**
   * Like posts on current page
   */
  async likePostsOnCurrentPage() {
    // Find all like buttons that match our criteria and are not already liked
    const likeButtons = Array.from(document.querySelectorAll('button')).filter(button => {
      // Check if it contains the text "Like" and doesn't have the "react-button__text--like" class
      const span = button.querySelector('span.artdeco-button__text.react-button__text.social-action-button__text');
      if (!span) return false;
      
      // Ensure it's not already liked
      const isLiked = button.querySelector('span.artdeco-button__text.react-button__text.social-action-button__text.react-button__text--like');
      return span.textContent.trim() === 'Like' && !isLiked;
    });
    
    console.log(`LinkedIn Automation: Found ${likeButtons.length} posts to like`);
    
    // Like up to 5 posts
    const maxLikes = 5;
    const postsToLike = likeButtons.slice(0, maxLikes);
    
    for (let i = 0; i < postsToLike.length; i++) {
      const button = postsToLike[i];
      this.updatePanelStatus(`Liking post ${i + 1}/${postsToLike.length}`, 
        ((this.processedLikes + i) / this.totalLikes) * 100);
      
      // Scroll to button
      button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Click the button
      button.click();
      this.processedLikes++;
      
      // Wait between likes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Update state
    await this.saveAutomationState();
  }

  /**
   * Finish automation
   */
  async finishAutomation() {
    if (!this.isRunning) return;
    
    try {
      this.updatePanelStatus('Finishing automation...', 100);
      
      // Get current user ID
      const currentUserId = await api.getCurrentUserId();
      
      // Update last executed date
      await api.updateParticipantLastExecuted(currentUserId);
      
      this.updatePanelStatus('Automation completed', 100);
      console.log('LinkedIn Automation: Completed successfully');
    } catch (error) {
      console.error('LinkedIn Automation Error:', error);
      this.updatePanelStatus(`Error: ${error.message}`, 100);
    } finally {
      this.stopAutomation();
    }
  }

  /**
   * Stop automation
   */
  async stopAutomation() {
    this.isRunning = false;
    this.floatingButton.classList.remove('running');
    
    // Clear automation state
    await storage.removeData('automationState');
  }

  /**
   * Save automation state
   */
  async saveAutomationState() {
    const state = {
      isRunning: this.isRunning,
      participants: this.participants,
      currentParticipantIndex: this.currentParticipantIndex,
      processedLikes: this.processedLikes,
      totalLikes: this.totalLikes,
      currentProfileUrl: this.currentProfileUrl
    };
    
    await storage.saveAutomationState(state);
  }

  /**
   * Wait for selector to be available
   * @param {string} selector - CSS selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} - Promise that resolves when element is found
   */
  waitForSelector(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Timeout waiting for ${selector}`));
          return;
        }
        
        setTimeout(checkElement, 500);
      };
      
      checkElement();
    });
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new LinkedInAutomation();
});
