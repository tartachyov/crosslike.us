Sure, here's the contents for the file `/linkedin-automation-plugin/linkedin-automation-plugin/src/popup/popup.tsx`:

import React from 'react';
import OnboardingForm from './components/OnboardingForm';
import StripePayment from './components/StripePayment';

const Popup: React.FC = () => {
    return (
        <div>
            <h1>LinkedIn Automation Plugin</h1>
            <OnboardingForm />
            <StripePayment />
        </div>
    );
};

export default Popup;