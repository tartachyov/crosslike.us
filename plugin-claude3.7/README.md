# LinkedIn Automation Chrome Extension

This Chrome extension automates interactions with LinkedIn profiles. It helps users engage with content from selected LinkedIn profiles by automatically liking their recent posts.

## Features

- Automated LinkedIn profile engagement
- Daily reminders to visit LinkedIn
- Post interaction tracking
- User authentication and subscription management
- Manual and automatic operation modes

## Project Structure

```
linkedin-automation/
├── manifest.json
├── background.js
├── content.js
├── content.css
├── popup.html
├── popup.js
├── images/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## Build Instructions

### Prerequisites

- Google Chrome browser
- Node.js and npm (for building)

### Setup

1. Clone this repository or download the source code.

2. Create the `images` directory and add icon files:
   - icon16.png (16x16)
   - icon48.png (48x48)
   - icon128.png (128x128)

   You can create these icons using any image editor or icon generator.

3. Update the GraphQL API endpoint:
   - In `background.js`, replace `https://your-api-endpoint.com/graphql` with your actual GraphQL endpoint.

4. Update Stripe integration:
   - In `content.js`, replace `your_stripe_public_key` with your actual Stripe public key.

### Building the Extension

1. Ensure all files are in the proper directory structure.

2. Open Google Chrome and navigate to `chrome://extensions/`.

3. Enable "Developer mode" using the toggle in the top-right corner.

4. Click "Load unpacked" and select the directory containing your extension files.

5. The extension should now appear in your Chrome browser with the icon visible in the toolbar.

## Testing the Extension

1. **Initial Setup:**
   - Click the extension icon in your Chrome toolbar
   - Click "Start Setup" or navigate to LinkedIn directly
   - The floating button should appear on LinkedIn pages
   - Click the button to start the setup process
   - Enter your email and password
   - Complete the Stripe payment process
   - The setup should be complete

2. **Testing Automation:**
   - After setup, visit LinkedIn
   - The extension should automatically start or you can click the floating button
   - Click "Start Manual Run" to begin the automation process
   - The extension will:
     - Navigate to each profile from your list
     - Open the posts section
     - Like up to 5 recent posts per profile
     - Move to the next profile
     - Update the last run timestamp when complete

3. **Testing Reminder:**
   - The extension will create a notification if you haven't visited LinkedIn for a day
   - Click the notification to open LinkedIn

## Troubleshooting

- **Extension not working:**
  - Make sure you're logged into LinkedIn
  - Check the console for any error messages (F12 > Console)
  - Ensure the API endpoint is correct and accessible

- **Automation not starting:**
  - Check if you've completed the setup process
  - Ensure you have profiles to process in your API

- **LinkedIn layout changes:**
  - If LinkedIn updates its layout, the selectors in the code may need to be updated

## API Requirements

The extension expects a GraphQL API with the following operations:

1. `createUser` mutation - Takes email, password, and LinkedIn profile URL
2. `updateUser` mutation - Updates the lastRun timestamp
3. `listUsers` query - Fetches the list of profiles to process

## Customization

You can customize the extension by:

1. Modifying `content.css` to change the appearance of the floating button and UI
2. Updating the selectors in `content.js` if LinkedIn changes its layout
3. Adjusting the automation logic in `processProfilePosts()` to perform different actions

## Security Considerations

- This extension requires users to enter their email and password
- Payment information is handled through Stripe
- The extension navigates through LinkedIn and performs actions on behalf of the user
- Ensure proper data handling and security measures are in place when deploying this extension

## Limitations

- The extension may break if LinkedIn changes its layout or selectors
- Excessive automation may be detected by LinkedIn and could lead to account restrictions
- The extension is limited to the capabilities of Chrome extensions and may not be able to perform all actions