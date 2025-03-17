// Authentication handling functions

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} Promise resolving with auth status
 */
async function isAuthenticated() {
    const { accessToken, refreshToken } = await loadFromStorage(['accessToken', 'refreshToken']);
    return !!(accessToken && refreshToken);
  }
  
  /**
   * Check if setup is completed
   * @returns {Promise<boolean>} Promise resolving with setup status
   */
  async function isSetupComplete() {
    const { setupComplete } = await loadFromStorage(['setupComplete']);
    return !!setupComplete;
  }
  
  /**
   * Sets up authentication flow
   * @param {string} email User email
   * @param {string} password User password
   * @param {string} linkedInUrl LinkedIn profile URL
   * @param {function} onVerificationNeeded Callback when verification is needed
   * @returns {Promise} Promise resolving when setup is done
   */
  async function setupAuthentication(email, password, linkedInUrl, onVerificationNeeded) {
    try {
      // Step 1: Create participant
      await createParticipant(email, password, linkedInUrl);
      
      // Save credentials for later use
      await saveToStorage({
        email,
        password,
        linkedInUrl
      });
      
      // Notify caller that we need verification
      onVerificationNeeded(email);
      
      return true;
    } catch (error) {
      logMessage(`Setup authentication error: ${error.message}`);
      throw error;
    }
}

/**
 * Completes the verification and login process
 * @param {string} code Verification code
 * @param {string} email User email
 * @param {string} password User password 
 * @returns {Promise} Promise resolving when auth is complete
 */
async function completeVerificationAndLogin(code, email, password) {
  try {
    // Step 2: Verify email
    await verifyEmail(code, email);
    
    // Step 3: Log in
    await login(email, password);
    
    // Mark setup as complete
    await saveToStorage({
      setupComplete: true,
      lastLoginDate: new Date().toISOString()
    });
    
    return true;
  } catch (error) {
    logMessage(`Complete verification error: ${error.message}`);
    throw error;
  }
}

/**
 * Logs user out and clears credentials
 * @returns {Promise} Promise resolving when logout is complete
 */
async function logout() {
  return new Promise((resolve) => {
    chrome.storage.local.remove([
      'accessToken',
      'refreshToken',
      'tokenExpiry',
      'setupComplete',
      'lastLoginDate'
    ], () => {
      logMessage('User logged out');
      resolve();
    });
  });
}