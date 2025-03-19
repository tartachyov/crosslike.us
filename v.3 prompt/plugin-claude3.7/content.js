// Content script for CrossLike.us

// Create floating button
function createFloatingButton() {
  const button = document.createElement('div');
  button.id = 'linkedin-automation-button';
  button.innerHTML = '<span>CL</span>';
  button.title = 'LinkedIn Plugin';
  document.body.appendChild(button);
  
  // Add click event listener
  button.addEventListener('click', togglePluginUI);

  togglePluginUI();
  
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
        <div id="progress-container" class="hidden">
          <div class="progress-info">
            <span id="current-profile"></span>
            <span id="progress-counter"></span>
          </div>
          <div class="progress-bar">
            <div id="progress-fill"></div>
          </div>
        </div>
        <button id="manual-run" class="plugin-button">Run Now</button>
        <button id="stop-automation" class="plugin-button hidden">Stop</button>
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
  document.getElementById('stop-automation').addEventListener('click', stopAutomation);
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
    
    // Check if automation is in progress
    const { automationInProgress } = await loadFromStorage(['automationInProgress']);
    if (automationInProgress) {
      updateProgressUI();
      document.getElementById('manual-run').classList.add('hidden');
      document.getElementById('stop-automation').classList.remove('hidden');
    } else {
      document.getElementById('manual-run').classList.remove('hidden');
      document.getElementById('stop-automation').classList.add('hidden');
      document.getElementById('progress-container').classList.add('hidden');
    }
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

// Stop automation
async function stopAutomation() {
  await saveToStorage({
    automationInProgress: false,
    currentParticipantIndex: 0,
    participantList: []
  });
  
  document.getElementById('status-message').textContent = 'Automation stopped';
  document.getElementById('manual-run').classList.remove('hidden');
  document.getElementById('stop-automation').classList.add('hidden');
  document.getElementById('progress-container').classList.add('hidden');
}

// Update progress UI
async function updateProgressUI() {
  const { 
    currentParticipantIndex = 0, 
    participantList = []
  } = await loadFromStorage(['currentParticipantIndex', 'participantList']);
  
  if (participantList.length > 0) {
    const progressContainer = document.getElementById('progress-container');
    progressContainer.classList.remove('hidden');
    
    const currentProfile = document.getElementById('current-profile');
    const progressCounter = document.getElementById('progress-counter');
    const progressFill = document.getElementById('progress-fill');
    
    const current = parseInt(currentParticipantIndex);
    const total = participantList.length;
    const percentage = Math.floor((current / total) * 100);
    
    currentProfile.textContent = `Processing: ${participantList[current]?.linkedInFeedUrl || 'Unknown'}`;
    progressCounter.textContent = `${current + 1} / ${total}`;
    progressFill.style.width = `${percentage}%`;
  }
}

// Run the automation process
async function runAutomation() {
  if (!await isAuthenticated()) {
    document.getElementById('status-message').textContent = 'Not authenticated. Please set up the plugin first.';
    return;
  }
  
  try {
    // Check if automation is already in progress
    const { automationInProgress, currentParticipantIndex, participantList } = 
      await loadFromStorage(['automationInProgress', 'currentParticipantIndex', 'participantList']);
    
    let participants = participantList || [];
    let currentIndex = currentParticipantIndex || 0;
    
    // If not continuing from previous run, start fresh
    if (!automationInProgress || participants.length === 0) {
      updateButtonStatus('processing');
      document.getElementById('status-message').textContent = 'Starting automation...';
      document.getElementById('manual-run').classList.add('hidden');
      document.getElementById('stop-automation').classList.remove('hidden');
      
      // Get participants list
      participants = await listParticipants();
      
      // Filter participants with lastExecuted within last 3 days
      participants = participants.filter(p => isWithinLastDays(p.lastExecuted, 3));
      
      if (participants.length === 0) {
        document.getElementById('status-message').textContent = 'No participants found with recent activity';
        updateButtonStatus('idle');
        return;
      }
      
      // Save participants list and set automation in progress
      await saveToStorage({
        automationInProgress: true,
        participantList: participants,
        currentParticipantIndex: 0
      });
      
      currentIndex = 0;
    }
    
    // Update UI
    updateProgressUI();
    
    // Process current participant
    const currentParticipant = participants[currentIndex];
    
    if (currentParticipant) {
      document.getElementById('status-message').textContent = `Processing profile: ${currentParticipant.linkedInFeedUrl}`;
      
      // If we're already on the participant's URL, process it
      if (window.location.href === currentParticipant.linkedInFeedUrl) {
        // Like posts
        await likeFirstFivePosts();
        
        // Move to next participant
        await saveToStorage({
          currentParticipantIndex: currentIndex + 1
        });
        
        // If we've processed all participants, finish
        if (currentIndex + 1 >= participants.length) {
          await finishAutomation();
        } else {
          // Wait before loading next profile
          await sleep(randomWait(2000, 4000));
          
          // Navigate to next profile
          window.location.href = participants[currentIndex + 1].linkedInFeedUrl;
        }
      } else {
        // Navigate to participant's LinkedIn URL
        window.location.href = currentParticipant.linkedInFeedUrl;
      }
    } else {
      await finishAutomation();
    }
  } catch (error) {
    document.getElementById('status-message').textContent = `Automation failed: ${error.message}`;
    updateButtonStatus('error');
    
    // Reset automation state
    await saveToStorage({
      automationInProgress: false,
      currentParticipantIndex: 0,
      participantList: []
    });
    
    document.getElementById('manual-run').classList.remove('hidden');
    document.getElementById('stop-automation').classList.add('hidden');
  }
}

// Finish automation process
async function finishAutomation() {
  try {
    // Update current user's lastExecuted
    const currentUserId = await getCurrentUserId();
    await updateParticipantLastExecuted(currentUserId);
    
    // Reset automation state
    await saveToStorage({
      automationInProgress: false,
      currentParticipantIndex: 0,
      participantList: []
    });
    
    document.getElementById('status-message').textContent = 'Automation completed successfully';
    document.getElementById('manual-run').classList.remove('hidden');
    document.getElementById('stop-automation').classList.add('hidden');
    document.getElementById('progress-container').classList.add('hidden');
    updateButtonStatus('idle');
  } catch (error) {
    document.getElementById('status-message').textContent = `Error finishing automation: ${error.message}`;
    updateButtonStatus('error');
  }
}

// Resume in-progress automation
async function resumeAutomation() {
  const { automationInProgress } = await loadFromStorage(['automationInProgress']);
  
  if (automationInProgress) {
    // Delay slightly to ensure page is loaded
    setTimeout(() => {
      runAutomation();
    }, 3000);
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
             !spanElement.children[0]?.children[1]?.classList.contains('react-button__text--like');
    });
    // console.log(likeButtons);
  
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
      }
      
      // Check if there's an automation in progress
      resumeAutomation();
    }
  }
}

// Add message listener for the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'runAutomation') {
    runAutomation();
    sendResponse({success: true});
  } else if (message.action === 'stopAutomation') {
    stopAutomation();
    sendResponse({success: true});
  }
  return true; // Keep channel open for async response
});

// Initialize the plugin when content script loads
initializePlugin();