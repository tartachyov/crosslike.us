// Content script for CrossLike.us

// Create floating button
function createFloatingButton() {
    const button = document.createElement('div');
    button.id = 'linkedin-automation-button';
    button.innerHTML = '<span>LP</span>';
    button.title = 'LinkedIn Plugin';
    document.body.appendChild(button);
    
    // Add click event listener
    button.addEventListener('click', togglePluginUI);
    
    return button;
  }
  
  // Create plugin UI container
  function createPluginUI() {
    const container = document.createElement('div');
    container.id = 'linkedin-automation-container';
    container.classList.add('hidden');
    container.innerHTML = `
      <div class="plugin-header">
        <h2>CrossLike.us</h2>
        <button id="close-plugin-ui">×</button>
      </div>
      <div class="plugin-content">
        <div id="setup-form" class="plugin-section">
          <h3>Setup</h3>
          <form id="registration-form">
            <div class="form-group">
              <label for="email">Email:</label>
              <input type="email" id="email" required>
            </div>
            <div class="form-group">
              <label for="password">Password:</label>
              <input type="password" id="password" required>
            </div>
            <div class="form-group">
              <label for="linkedin-url">LinkedIn Profile URL:</label>
              <input type="url" id="linkedin-url" required>
            </div>
            <button type="submit" class="plugin-button">Register</button>
          </form>
        </div>
        
        <div id="verification-form" class="plugin-section hidden">
          <h3>Verify Email</h3>
          <form id="verify-form">
            <div class="form-group">
              <label for="verification-code">Verification Code:</label>
              <input type="text" id="verification-code" required>
            </div>
            <button type="submit" class="plugin-button">Verify</button>
          </form>
        </div>
        
        <div id="success-section" class="plugin-section hidden">
          <h3>Setup Complete</h3>
          <p>Your account has been created and verified successfully!</p>
          <button id="start-automation" class="plugin-button">Start Automation</button>
        </div>
        
        <div id="status-section" class="plugin-section hidden">
          <h3>Status</h3>
          <div id="status-message">
            <p>Plugin is inactive</p>
          </div>
          <button id="manual-run" class="plugin-button">Run Now</button>
          <button id="logout-button" class="plugin-button secondary">Logout</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Add event listeners
    document.getElementById('close-plugin-ui').addEventListener('click', togglePluginUI);
    document.getElementById('registration-form').addEventListener('submit', handleRegistration);
    document.getElementById('verify-form').addEventListener('submit', handleVerification);
    document.getElementById('start-automation').addEventListener('click', startAutomation);
    document.getElementById('manual-run').addEventListener('click', runAutomation);
    document.getElementById('logout-button').addEventListener('click', handleLogout);
    
    return container;
  }
  
  // Toggle plugin UI visibility
  function togglePluginUI() {
    const container = document.getElementById('linkedin-automation-container') || createPluginUI();
    container.classList.toggle('hidden');
    
    if (!container.classList.contains('hidden')) {
      updateUIState();
    }
  }
  
  // Update UI state based on auth status
  async function updateUIState() {
    const setupComplete = await isSetupComplete();
    const authenticated = await isAuthenticated();
    
    document.getElementById('setup-form').classList.toggle('hidden', setupComplete);
    document.getElementById('verification-form').classList.toggle('hidden', true);
    document.getElementById('success-section').classList.toggle('hidden', true);
    document.getElementById('status-section').classList.toggle('hidden', !setupComplete);
    
    if (setupComplete && authenticated) {
      document.getElementById('status-message').textContent = 'Plugin is active and ready to run';
    }
  }
  
  // Handle registration form submission
  async function handleRegistration(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const linkedInUrl = document.getElementById('linkedin-url').value;
    
    try {
      await setupAuthentication(email, password, linkedInUrl, () => {
        // Show verification form
        document.getElementById('setup-form').classList.add('hidden');
        document.getElementById('verification-form').classList.remove('hidden');
      });
    } catch (error) {
      alert(`Registration failed: ${error.message}`);
    }
  }
  
  // Handle verification form submission
  async function handleVerification(event) {
    event.preventDefault();
    
    const code = document.getElementById('verification-code').value;
    const { email, password } = await loadFromStorage(['email', 'password']);
    
    try {
      await completeVerificationAndLogin(code, email, password);
      
      // Show success message
      document.getElementById('verification-form').classList.add('hidden');
      document.getElementById('success-section').classList.remove('hidden');
    } catch (error) {
      alert(`Verification failed: ${error.message}`);
    }
  }
  
  // Handle start automation button click
  function startAutomation() {
    document.getElementById('success-section').classList.add('hidden');
    document.getElementById('status-section').classList.remove('hidden');
    
    // Check if we're on LinkedIn and run automation
    if (window.location.hostname.includes('linkedin.com')) {
      runAutomation();
    } else {
      document.getElementById('status-message').textContent = 'Please navigate to LinkedIn to run automation';
    }
  }
  
  // Handle logout button click
  async function handleLogout() {
    try {
      await logout();
      updateUIState();
      document.getElementById('status-message').textContent = 'Logged out successfully';
    } catch (error) {
      alert(`Logout failed: ${error.message}`);
    }
  }
  
  // Run the automation process
  async function runAutomation() {
    if (!await isAuthenticated()) {
      document.getElementById('status-message').textContent = 'Not authenticated. Please set up the plugin first.';
      return;
    }
    
    try {
      updateButtonStatus('processing');
      document.getElementById('status-message').textContent = 'Running automation...';
      
      // Get participants list
      const participants = await listParticipants();
      
      // Filter participants with lastExecuted within last 3 days
      const recentParticipants = participants.filter(p => isWithinLastDays(p.lastExecuted, 3));
      
      if (recentParticipants.length === 0) {
        document.getElementById('status-message').textContent = 'No participants found with recent activity';
        updateButtonStatus('idle');
        return;
      }
      
      // Process each participant
      for (const participant of recentParticipants) {
        document.getElementById('status-message').textContent = `Processing profile: ${participant.linkedInFeedUrl}`;
        
        // Navigate to participant's LinkedIn URL
        window.location.href = participant.linkedInFeedUrl;
        
        // Wait for page to load
        await waitForPageLoad();
        
        // Like posts
        await likeFirstFivePosts();
        
        // Wait between participants
        await sleep(randomWait(3000, 5000));
      }
      
      // Update current user's lastExecuted
      const currentUserId = await getCurrentUserId();
      await updateParticipantLastExecuted(currentUserId);
      
      document.getElementById('status-message').textContent = 'Automation completed successfully';
      updateButtonStatus('idle');
    } catch (error) {
      document.getElementById('status-message').textContent = `Automation failed: ${error.message}`;
      updateButtonStatus('error');
    }
  }
  
  // Wait for page to fully load
  function waitForPageLoad() {
    return new Promise(resolve => {
      // If document is already complete, resolve immediately
      if (document.readyState === 'complete') {
        resolve();
        return;
      }
      
      // Otherwise wait for load event
      window.addEventListener('load', () => {
        // Give a little extra time for dynamic content
        setTimeout(resolve, 2000);
      });
    });
  }
  
  // Like first 5 posts on current page
  async function likeFirstFivePosts() {
    // Query for all like buttons
    const likeButtons = Array.from(document.querySelectorAll('button'))
      .filter(button => {
        // Check if button contains the Like text but not the already-liked class
        const spanElement = button.querySelector('span.artdeco-button__text');
        return spanElement && 
               spanElement.textContent.trim() === 'Like' && 
               !spanElement.classList.contains('react-button__text--like');
      });
    
    // Get the first 5 buttons
    const buttonsToClick = likeButtons.slice(0, 5);
    
    // Click each button with random delay
    for (let i = 0; i < buttonsToClick.length; i++) {
      const button = buttonsToClick[i];
      document.getElementById('status-message').textContent = `Liking post ${i + 1} of ${buttonsToClick.length}`;
      
      // Scroll to the button to ensure it's in view
      button.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await sleep(randomWait(500, 1000));
      
      // Click the button
      button.click();
      
      // Wait between clicks
      await sleep(randomWait(1500, 3000));
    }
    
    document.getElementById('status-message').textContent = `Liked ${buttonsToClick.length} posts`;
  }
  
  // Update floating button status
  function updateButtonStatus(status) {
    const button = document.getElementById('linkedin-automation-button');
    if (!button) return;
    
    // Remove all status classes
    button.classList.remove('processing', 'error', 'idle');
    
    // Add appropriate class
    button.classList.add(status);
  }
  
  // Check for LinkedIn visits and initialize plugin
  async function initializePlugin() {
    // Create floating button
    const button = createFloatingButton();
    
    // Check if we're on LinkedIn
    if (window.location.hostname.includes('linkedin.com')) {
      // Check if user has authenticated
      if (await isAuthenticated() && await isSetupComplete()) {
        // Get last visit date
        const { lastVisitDate } = await loadFromStorage(['lastVisitDate']);
        const today = new Date().toDateString();
        
        // If first visit today, check if automation should run
        if (lastVisitDate !== today) {
          // Update last visit date
          await saveToStorage({ lastVisitDate: today });
          
          // Run automation
          setTimeout(() => {
            runAutomation();
          }, 5000);
        }
      }
    }
  }
  
  // Initialize the plugin when content script loads
  initializePlugin();