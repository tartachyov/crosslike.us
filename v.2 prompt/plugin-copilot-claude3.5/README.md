# LinkedIn Automation Plugin

This Chrome extension automates interactions on LinkedIn, helping users manage their profiles and engage with content efficiently.

## Features

- Detects when the user is on LinkedIn and navigates to their profile.
- Allows users to input their email and password for account setup.
- Integrates with Stripe for subscription payments.
- Reminds users to visit LinkedIn daily if they haven't done so.
- Likes the latest posts from profiles fetched via GraphQL.

## Project Structure

```
linkedin-automation-plugin
├── src
│   ├── background
│   │   └── background.ts
│   ├── contentScript
│   │   ├── linkedinController.ts
│   │   └── profileProcessor.ts
│   ├── popup
│   │   ├── components
│   │   │   ├── OnboardingForm.tsx
│   │   │   └── StripePayment.tsx
│   │   └── popup.tsx
│   ├── services
│   │   ├── api.ts
│   │   └── storage.ts
│   └── utils
│       ├── constants.ts
│       └── types.ts
├── public
│   └── manifest.json
├── graphql
│   ├── mutations
│   │   ├── createUser.ts
│   │   └── updateUser.ts
│   └── queries
│       └── listUsers.ts
├── package.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd linkedin-automation-plugin
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Building the Plugin

To build the plugin, run:
```
npm run build
```

## Testing the Plugin

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable "Developer mode" in the top right corner.
3. Click on "Load unpacked" and select the `public` directory of the project.
4. The extension should now be loaded and ready for use.

## Usage

- Click on the extension icon to open the popup.
- Fill in the onboarding form with your LinkedIn credentials.
- Follow the prompts to complete the setup and subscription process.

## License

This project is licensed under the MIT License. See the LICENSE file for details.