# CrossLike.us Plugin - Build and Installation Instructions

## Project Structure

Ensure your project has the following structure:
```
linkedin-automation-plugin/
│
├── manifest.json
├── background.js
├── content.js
├── popup.html
├── popup.js
├── styles.css
├── content-styles.css
├── utils.js
├── api.js
├── auth.js
│
└── images/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## Icons

You'll need to create icons for your extension. You can use any icon creation tool like Photoshop, Illustrator, or online tools like Figma or Canva. Create three versions:
- 16x16 pixels (icon16.png)
- 48x48 pixels (icon48.png)
- 128x128 pixels (icon128.png)

## Building the Extension

1. Create a new folder for your extension
2. Create all the files as provided in the code snippets above
3. Place your icons in the `images` folder

## Installation in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle switch in the top right)
3. Click "Load unpacked" button
4. Select your extension folder
5. The extension should now appear in your Chrome toolbar

## Testing the Extension

1. Click on the extension icon in your Chrome toolbar
2. If it's your first time, you'll see the setup screen
3. Navigate to LinkedIn.com
4. Look for the floating button (LP) on the right side of the page
5. Click the button to open the plugin interface
6. Complete the setup process:
   - Enter your email, password, and LinkedIn profile URL
   - Check your email for the verification code
   - Enter the verification code in the plugin interface
7. Once setup is complete, the plugin will start running when you visit LinkedIn
8. You can manually trigger the automation by clicking "Run Now"

## Debugging

If you encounter any issues:

1. Check the Chrome DevTools console for errors:
   - Right-click on the page and select "Inspect"
   - Navigate to the "Console" tab
   - Look for any error messages related to the plugin

2. You can also debug the background script:
   - Go to `chrome://extensions/`
   - Find your extension and click "Details"
   - Find the "Inspect views" section
   - Click on "background page" to open DevTools for the background script

3. To debug the popup:
   - Click on the extension icon
   - Right-click on the popup and select "Inspect"

## Updating the Extension

To update the extension after making changes:

1. Go to `chrome://extensions/`
2. Find your extension and click the refresh icon
3. Reload any open LinkedIn pages

## Production Deployment

For distributing to users:

1. Create a ZIP file of your extension folder
2. Upload to the Chrome Web Store (requires developer account)
3. Follow the Chrome Web Store guidelines for publishing

## Security Notes

- This plugin handles sensitive information (email, password)
- Ensure you're using HTTPS for all API calls
- Consider implementing more robust error handling and retries for API