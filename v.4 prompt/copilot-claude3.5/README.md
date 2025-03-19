# LinkedIn Chrome Extension

This Chrome extension adds a floating button on LinkedIn pages, allowing users to sign up, log in, and interact with their LinkedIn profiles.

## Features

- User signup and login
- Interaction with LinkedIn profiles
- Fetching participants and liking posts

## Project Structure

```
linkedin-chrome-extension
├── src
│   ├── api
│   │   └── index.js
│   ├── background
│   │   └── background.js
│   ├── content
│   │   ├── content.js
│   │   └── styles.css
│   ├── popup
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── popup.css
│   └── utils
│       └── storage.js
├── manifest.json
├── package.json
└── README.md
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd linkedin-chrome-extension
   ```

2. Install dependencies:
   ```
   npm install
   ```

## Building the Extension

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable "Developer mode" in the top right corner.
3. Click on "Load unpacked" and select the `linkedin-chrome-extension` directory.

## Testing the Extension

1. Navigate to a LinkedIn page.
2. Click on the floating button to access the signup and login forms.
3. Test the functionality by signing up and logging in.

## License

This project is licensed under the MIT License.