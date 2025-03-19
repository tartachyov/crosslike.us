# LinkedIn Automation Chrome Plugin

A Chrome plugin that automates LinkedIn post interactions based on specified criteria.

## Features

- Authentication system with signup, login, and email verification
- Daily reminders to visit LinkedIn
- Automated liking of posts from a list of participants
- Progress tracking and resumable automation
- Floating UI button and panel on LinkedIn pages

## Setup and Installation

### Prerequisites

- Google Chrome browser
- Basic knowledge of Chrome extension development

### Installation Steps

1. Clone or download this repository to your local machine
2. Create the project structure as follows:

```
linkedin-automation/
├── manifest.json
├── popup.html
├── popup.js
├── content.js
├── background.js
├── api.js
├── storage.js
├── styles.css
└── images/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

3. Add placeholder icons to the `images` directory or create your own icons in the sizes 16px, 48px, and 128px

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" by toggling the switch in the top right corner
   - Click "Load unpacked" and select the directory containing your extension files

## Testing the Plugin

1. After loading the extension, you should see the plugin icon in your Chrome toolbar
2. Click the icon to open the popup interface
3. Create a new account using the signup form:
   - Enter your email, password, and LinkedIn profile URL
   - Submit the form
   - You'll be prompted to verify your email with a code (in a real environment, you'd receive this via email)
   - Enter the verification code
   - After verification, you'll be automatically logged in

4. To test the automation:
   - Navigate to [LinkedIn](https://www.linkedin.com/)
   - Click the floating "Q" button that appears on the LinkedIn page, or
   - Click the plugin icon in the toolbar and press "Start Automation"

5. The plugin will:
   - Fetch a list of participants
   - Navigate to each participant's profile
   - Like up to 5 posts per profile
   - Update the last executed date when complete

## Development Notes

### Module Dependencies

The plugin uses ES modules, which are supported in Chrome extension manifest v3. The files are structured as follows:

- **manifest.json**: Extension configuration
- **popup.html/js**: User interface and interaction logic
- **content.js**: Content script that runs on LinkedIn pages
- **background.js**: Background service for token refresh and notifications
- **api.js**: API service for Quorini endpoints
- **storage.js**: Utility for managing extension state

### Debugging

- Use Chrome DevTools to debug the extension
- For background script debugging, go to `chrome://extensions/`, find your extension, and click "background page" under "Inspect views"
- For content script debugging, open DevTools on a LinkedIn page and look for console logs prefixed with "LinkedIn Automation:"
- For popup debugging, right-click the popup and select "Inspect"

### Known Limitations

- The plugin stores authentication tokens in Chrome storage, which may expire if not refreshed
- LinkedIn's UI may change, which could break the selectors used to find like buttons
- The plugin assumes certain URL structures and API endpoints

## Building for Distribution

To build the plugin for distribution:

1. Create a ZIP file containing all the required files
2. Rename the ZIP file to have a `.crx` extension
3. The plugin can then be distributed via the Chrome Web Store or as a direct download

## Security Considerations

- The plugin stores authentication credentials securely in Chrome storage
- API requests are made with proper authentication headers
- Token refresh is handled automatically

## Additional Notes

- The plugin is configured to work with the development environment (env=dev)
- For production use, update API endpoints to remove the env parameter or change it to the appropriate value
