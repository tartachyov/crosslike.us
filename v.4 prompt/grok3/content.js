// Inject floating button
const button = document.createElement('div');
button.id = 'plugin-button';
button.textContent = 'Plugin';
document.body.appendChild(button);

// Inject modal
const modal = document.createElement('div');
modal.id = 'plugin-modal';
modal.style.display = 'none';
const modalContent = document.createElement('div');
modalContent.className = 'modal-content';
modal.appendChild(modalContent);
document.body.appendChild(modal);

let currentState = 'signup'; // signup, login, or status
let signupData = {};

button.addEventListener('click', () => {
  modal.style.display = 'block';
  chrome.runtime.sendMessage({ type: 'get_status' }, response => {
    if (response.loggedIn) {
      showStatus();
    } else {
      showForms();
    }
  });
});

function showForms() {
  modalContent.innerHTML = `
    <button id="close-modal">Close</button>
    <div id="form-container"></div>
    <div>
      <a href="#" id="switch-to-signup">Sign Up</a> |
      <a href="#" id="switch-to-login">Login</a>
    </div>
  `;
  document.getElementById('close-modal').addEventListener('click', () => modal.style.display = 'none');
  document.getElementById('switch-to-signup').addEventListener('click', e => { e.preventDefault(); currentState = 'signup'; showForms(); });
  document.getElementById('switch-to-login').addEventListener('click', e => { e.preventDefault(); currentState = 'login'; showForms(); });

  const formContainer = document.getElementById('form-container');
  if (currentState === 'signup') {
    formContainer.innerHTML = `
      <form id="signup-form">
        <input type="email" id="email" placeholder="Email" required><br>
        <input type="password" id="password" placeholder="Password" required><br>
        <input type="text" id="linkedinUrl" placeholder="LinkedIn Profile URL" required><br>
        <button type="submit">Sign Up</button>
      </form>
    `;
    document.getElementById('signup-form').addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const linkedinUrl = document.getElementById('linkedinUrl').value;
      signupData = { email, password, linkedinUrl };
      chrome.runtime.sendMessage({ type: 'signup', data: signupData }, response => {
        if (response.success) {
          showVerificationForm(email);
        } else {
          alert('Signup failed: ' + response.error);
        }
      });
    });
  } else {
    formContainer.innerHTML = `
      <form id="login-form">
        <input type="email" id="email" placeholder="Email" required><br>
        <input type="password" id="password" placeholder="Password" required><br>
        <button type="submit">Login</button>
      </form>
    `;
    document.getElementById('login-form').addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      chrome.runtime.sendMessage({ type: 'login', data: { email, password } }, response => {
        if (response.success) {
          modalContent.innerHTML = '<p>Login successful!</p>';
          setTimeout(() => modal.style.display = 'none', 2000);
        } else {
          alert('Login failed: ' + response.error);
        }
      });
    });
  }
}

function showVerificationForm(username) {
  modalContent.innerHTML = `
    <form id="verify-form">
      <input type="text" id="code" placeholder="Verification Code" required><br>
      <button type="submit">Verify</button>
    </form>
  `;
  document.getElementById('verify-form').addEventListener('submit', e => {
    e.preventDefault();
    const code = document.getElementById('code').value;
    chrome.runtime.sendMessage({ type: 'verify', data: { code, username } }, response => {
      if (response.success) {
        chrome.runtime.sendMessage({ type: 'login', data: { email: signupData.email, password: signupData.password } }, loginResponse => {
          if (loginResponse.success) {
            modalContent.innerHTML = '<p>Account created successfully!</p>';
            setTimeout(() => modal.style.display = 'none', 2000);
          }
        });
      } else {
        alert('Verification failed: ' + response.error);
      }
    });
  });
}

function showStatus() {
  modalContent.innerHTML = '<p>Logged in. Plugin is active.</p><button id="close-modal">Close</button>';
  document.getElementById('close-modal').addEventListener('click', () => modal.style.display = 'none');
}

// Notify background script on page load
chrome.runtime.sendMessage({ type: 'linkedin_loaded' });
chrome.runtime.sendMessage({ type: 'visited_linkedin' });

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'like_posts') {
    button.textContent = 'Processing...';
    likePosts().then(() => {
      button.textContent = 'Plugin';
      sendResponse({ success: true });
    }).catch(error => {
      button.textContent = 'Plugin';
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
});

async function likePosts() {
  const postContainers = document.querySelectorAll('.feed-shared-update-v2'); // Adjust selector if needed
  let liked = 0;
  for (const container of postContainers) {
    if (liked >= 5) break;
    const likeButton = container.querySelector('button');
    if (likeButton) {
      const span = likeButton.querySelector('span.artdeco-button__text.react-button__text.social-action-button__text');
      if (span && span.textContent.trim() === 'Like' && !span.classList.contains('react-button__text--like')) {
        likeButton.click();
        liked++;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to ensure action registers
      }
    }
  }
}