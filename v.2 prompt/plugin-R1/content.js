let pluginActive = false;

// Inject floating button
const button = document.createElement('button');
button.id = 'plugin-main-btn';
document.body.appendChild(button);

button.addEventListener('click', async () => {
  if (!pluginActive) {
    await showPluginUI();
  }
});

async function showPluginUI() {
  // Load form HTML
  const response = await chrome.runtime.getURL('ui/form.html');
  const html = await (await fetch(response)).text();
  
  const container = document.createElement('div');
  container.id = 'plugin-container';
  container.innerHTML = html;
  document.body.appendChild(container);

  // Handle form submission
  container.querySelector('#signup-form').addEventListener('submit', handleSubmit);
}

async function handleSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Create user
  const response = await fetch('YOUR_GQL_ENDPOINT', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation CreateUser($email: String!, $password: String!) {
        createUser(email: $email, password: $password) {
          id
        }
      }`,
      variables: { email, password }
    })
  });

  // Load Stripe
  loadStripeCheckout();
}

function loadStripeCheckout() {
  // Load Stripe.js and create checkout
  const script = document.createElement('script');
  script.src = 'https://js.stripe.com/v3/';
  document.head.appendChild(script);

  script.onload = () => {
    const stripe = Stripe('YOUR_STRIPE_KEY');
    stripe.redirectToCheckout({
      lineItems: [{ price: 'STRIPE_PRICE_ID', quantity: 1 }],
      mode: 'subscription',
      successUrl: window.location.href,
      cancelUrl: window.location.href
    });
  };
}

// Automation logic
chrome.runtime.sendMessage({ action: 'runAutomation' }, async (response) => {
  if (response.profiles) {
    for (const profile of response.profiles) {
      await navigateToProfile(profile.url);
      await likePosts();
    }
    await updateLastRun();
  }
});

async function navigateToProfile(url) {
  // Implement LinkedIn navigation logic
  // Note: LinkedIn uses dynamic ember IDs which might change - needs regular maintenance
  const profileLink = document.querySelector('#ember15');
  if (profileLink) profileLink.click();
  
  // Wait for profile to load
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function likePosts() {
  const posts = document.querySelectorAll('.social-details-social-counts__reactions');
  for (let i = 0; i < Math.min(5, posts.length); i++) {
    if (!posts[i].querySelector('.liked')) {
      posts[i].click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}