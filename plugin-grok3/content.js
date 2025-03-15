// Content script
class LinkedInPlugin {
    constructor() {
      this.apiEndpoint = 'YOUR_GQL_API_ENDPOINT'; // Replace with your GraphQL endpoint
      this.initializeUI();
      this.checkSetup();
    }
  
    initializeUI() {
      const button = document.createElement('button');
      button.id = 'linkedin-plugin-btn';
      button.textContent = 'Plugin';
      document.body.appendChild(button);
  
      button.addEventListener('click', () => this.showSetupForm());
    }
  
    async checkSetup() {
      const { userSetup } = await chrome.storage.local.get('userSetup');
      if (!userSetup) {
        this.initialSetup();
      } else {
        this.startAutomation();
      }
    }
  
    initialSetup() {
      // Navigate to profile page
      const profileBtn = document.querySelector('#ember15');
      if (profileBtn) profileBtn.click();
      setTimeout(() => {
        const viewProfile = document.querySelector('#ember272');
        if (viewProfile) viewProfile.click();
      }, 1000);
    }
  
    showSetupForm() {
      const modal = document.createElement('div');
      modal.id = 'plugin-modal';
      modal.innerHTML = `
        <div class="modal-content">
          <form id="setup-form">
            <input type="email" id="email" placeholder="Email" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit">Submit</button>
          </form>
          <div id="stripe-container"></div>
        </div>
      `;
      document.body.appendChild(modal);
  
      document.getElementById('setup-form').addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSetupSubmit(modal);
      });
    }
  
    async handleSetupSubmit(modal) {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const profileUrl = window.location.href;
  
      // Create user via GraphQL
      const userData = await this.graphqlRequest('mutation', `
        mutation CreateUser($input: UserInput!) {
          createUser(input: $input) {
            id
          }
        }
      `, {
        input: { email, password, profileUrl }
      });
  
      if (userData) {
        this.showStripePayment(modal);
      }
    }
  
    showStripePayment(modal) {
      const stripeContainer = document.getElementById('stripe-container');
      stripeContainer.innerHTML = '<script src="https://js.stripe.com/v3/"></script>';
      // Add your Stripe implementation here
      // This is a placeholder - you'll need to implement actual Stripe integration
      setTimeout(() => {
        chrome.storage.local.set({ userSetup: true });
        modal.remove();
        this.startAutomation();
      }, 2000);
    }
  
    async startAutomation() {
      const users = await this.graphqlRequest('query', `
        query {
          listUsers {
            id
            profileUrl
          }
        }
      `);
  
      for (const user of users.listUsers) {
        await this.processUserProfile(user.profileUrl);
      }
  
      await this.graphqlRequest('mutation', `
        mutation UpdateUser($input: UpdateUserInput!) {
          updateUser(input: $input) {
            id
          }
        }
      `, {
        input: { lastRun: new Date().toISOString() }
      });
    }
  
    async processUserProfile(profileUrl) {
      window.location.href = profileUrl;
      await new Promise(resolve => setTimeout(resolve, 2000));
  
      // Open posts section
      const posts = Array.from(document.querySelectorAll('.feed-shared-update-v2'))
        .slice(0, 5);
  
      for (const post of posts) {
        const likeBtn = post.querySelector('.react-button__trigger');
        if (likeBtn && !likeBtn.classList.contains('react-button__trigger--liked')) {
          likeBtn.click();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  
    async graphqlRequest(type, query, variables = {}) {
      try {
        const response = await fetch(this.apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, variables })
        });
        const data = await response.json();
        return data.data[type === 'query' ? Object.keys(data.data)[0] : type];
      } catch (error) {
        console.error('GraphQL Error:', error);
        return null;
      }
    }
  }
  
  if (window.location.host.includes('linkedin.com')) {
    new LinkedInPlugin();
  }