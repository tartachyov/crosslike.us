document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Stripe with your publishable key
    const stripe = Stripe('pk_test_your_publishable_key_here');
    const elements = stripe.elements();
    const cardElement = elements.create('card');
    
    cardElement.mount('#card-element');
    const submitButton = document.getElementById('submit-button');
    const errorMessage = document.getElementById('error-message');
  
    submitButton.addEventListener('click', async (e) => {
      e.preventDefault();
      submitButton.disabled = true;
      errorMessage.textContent = '';
  
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });
  
      if (error) {
        errorMessage.textContent = error.message;
        submitButton.disabled = false;
      } else {
        try {
          // Get user data from storage
          const { userId } = await chrome.storage.local.get('userId');
          
          // Create subscription on your backend
          const response = await fetch('https://your-api-endpoint.com/create-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentMethodId: paymentMethod.id,
              userId: userId
            })
          });
  
          const result = await response.json();
          
          if (result.error) {
            throw new Error(result.error);
          }
  
          // Save Stripe customer ID to storage
          await chrome.storage.local.set({ 
            stripeId: result.customerId,
            setupComplete: true
          });
  
          // Close the Stripe window
          window.close();
  
        } catch (error) {
          errorMessage.textContent = error.message;
          submitButton.disabled = false;
        }
      }
    });
  });