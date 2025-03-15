Sure, here's the contents for the file: /linkedin-automation-plugin/linkedin-automation-plugin/src/popup/components/StripePayment.tsx

import React from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('your-publishable-key-here');

const StripePayment: React.FC = () => {
    const handlePayment = async () => {
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
            // Your checkout session ID
            sessionId: 'your-session-id-here',
        });

        if (error) {
            console.error('Error redirecting to Stripe Checkout:', error);
        }
    };

    return (
        <div>
            <h2>Subscribe to our service</h2>
            <button role="link" onClick={handlePayment}>
                Pay with Stripe
            </button>
        </div>
    );
};

export default StripePayment;