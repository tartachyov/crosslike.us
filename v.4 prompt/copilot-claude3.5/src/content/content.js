// content.js

// Function to create and display the floating button
function createFloatingButton() {
    const button = document.createElement('button');
    button.innerText = 'Interact';
    button.style.position = 'fixed';
    button.style.bottom = '20px';
    button.style.right = '20px';
    button.style.zIndex = '1000';
    button.style.backgroundColor = '#0073b1';
    button.style.color = '#ffffff';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.padding = '10px 15px';
    button.style.cursor = 'pointer';
    
    button.addEventListener('click', () => {
        // Logic to handle button click
        console.log('Floating button clicked!');
        // You can add more functionality here, like opening the popup or interacting with LinkedIn
    });

    document.body.appendChild(button);
}

// Function to fetch participants from LinkedIn
function fetchParticipants() {
    // Logic to fetch participants from LinkedIn
    console.log('Fetching participants...');
}

// Initialize the content script
createFloatingButton();
fetchParticipants();