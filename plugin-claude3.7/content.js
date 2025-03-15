// content.js
let profiles = []
let currentProfileIndex = 0
let processedPosts = 0
let floatingButton = null
let setupOverlay = null
let isProcessing = false

// Initialize floating button
function initFloatingButton() {
    // Check if button already exists
    if (document.getElementById("linkedin-automation-button")) {
        return
    }

    // Create floating button
    floatingButton = document.createElement("div")
    floatingButton.id = "linkedin-automation-button"
    floatingButton.textContent = "LinkedIn Automation"
    floatingButton.addEventListener("click", toggleUI)
    document.body.appendChild(floatingButton)
}

// Toggle UI visibility
function toggleUI() {
    if (setupOverlay && setupOverlay.style.display === "flex") {
        setupOverlay.style.display = "none"
    } else {
        showUI()
    }
}

// Show UI based on setup status
function showUI() {
    chrome.storage.local.get(["userState"], (result) => {
        if (result.userState && result.userState.isSetup) {
            showStatusUI()
        } else {
            showSetupUI()
        }
    })
}

// Show setup UI for first-time users
function showSetupUI() {
    if (setupOverlay) {
        setupOverlay.style.display = "flex"
        return
    }

    setupOverlay = document.createElement("div")
    setupOverlay.id = "linkedin-automation-overlay"
    setupOverlay.className = "linkedin-automation-overlay"

    const setupContainer = document.createElement("div")
    setupContainer.className = "linkedin-automation-container"

    // Create setup content
    setupContainer.innerHTML = `
    <h2>LinkedIn Automation Setup</h2>
    <div class="step-indicator">Step 1 of 2: Account Creation</div>
    <form id="setup-form">
      <div class="form-group">
        <label for="email">Email:</label>
        <input type="email" id="email" required>
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input type="password" id="password" required>
      </div>
      <button type="submit" id="setup-submit">Continue to Payment</button>
    </form>
    <button class="close-button">×</button>
  `

    setupOverlay.appendChild(setupContainer)
    document.body.appendChild(setupOverlay)

    // Add event listeners for setup form
    document.getElementById("setup-form").addEventListener("submit", handleSetupSubmit)
    setupOverlay.querySelector(".close-button").addEventListener("click", () => {
        setupOverlay.style.display = "none"
    })
}

// Show status UI for set-up users
function showStatusUI() {
    if (setupOverlay) {
        setupOverlay.remove()
    }

    setupOverlay = document.createElement("div")
    setupOverlay.id = "linkedin-automation-overlay"
    setupOverlay.className = "linkedin-automation-overlay"

    const statusContainer = document.createElement("div")
    statusContainer.className = "linkedin-automation-container"

    chrome.storage.local.get(["userState"], (result) => {
        const userState = result.userState
        const lastRun = userState.lastRun ? new Date(userState.lastRun).toLocaleString() : "Never"

        statusContainer.innerHTML = `
      <h2>LinkedIn Automation Status</h2>
      <div class="status-info">
        <p>Last automated run: <span id="last-run-time">${lastRun}</span></p>
      </div>
      <div class="action-buttons">
        <button id="start-automation">Start Manual Run</button>
      </div>
      <button class="close-button">×</button>
    `

        setupOverlay.appendChild(statusContainer)
        document.body.appendChild(setupOverlay)

        // Add event listeners
        document.getElementById("start-automation").addEventListener("click", startManualAutomation)
        setupOverlay.querySelector(".close-button").addEventListener("click", () => {
            setupOverlay.style.display = "none"
        })
    })
}

// Handle setup form submission
function handleSetupSubmit(e) {
    e.preventDefault()
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value

    // First, navigate to profile page to get URL
    navigateToProfile().then((profileUrl) => {
        // Send user data to background script
        chrome.runtime.sendMessage(
            {
                action: "createUser",
                email,
                password,
                profileUrl,
            },
            (response) => {
                if (response.success) {
                    showStripeSetup()
                } else {
                    alert(`Setup failed: ${response.error}`)
                }
            }
        )
    })
}

// Show Stripe payment setup
function showStripeSetup() {
    const setupContainer = setupOverlay.querySelector(".linkedin-automation-container")
    setupContainer.innerHTML = `
    <h2>LinkedIn Automation Setup</h2>
    <div class="step-indicator">Step 2 of 2: Payment Information</div>
    <div id="stripe-container">
      <div id="card-element"></div>
      <div id="card-errors" role="alert"></div>
      <button id="complete-setup">Complete Setup</button>
    </div>
    <button class="close-button">×</button>
  `

    // Load Stripe script
    const script = document.createElement("script")
    script.src = "https://js.stripe.com/v3/"
    script.onload = initializeStripe
    document.head.appendChild(script)

    // Add close button event listener
    setupOverlay.querySelector(".close-button").addEventListener("click", () => {
        setupOverlay.style.display = "none"
    })
}

// Initialize Stripe
function initializeStripe() {
    const stripe = Stripe("your_stripe_public_key")
    const elements = stripe.elements()

    // Create card element
    const card = elements.create("card")
    card.mount("#card-element")

    // Handle form submission
    document.getElementById("complete-setup").addEventListener("click", async () => {
        try {
            // Here you would implement the actual payment submission
            // For this example, we'll just simulate a successful payment

            // Notify background script that setup is complete
            chrome.runtime.sendMessage({ action: "setupComplete" }, (response) => {
                if (response.success) {
                    alert("Setup complete! The automation will now run when you visit LinkedIn.")
                    setupOverlay.style.display = "none"

                    // Wait a bit and then start automation
                    setTimeout(() => {
                        startAutomation()
                    }, 2000)
                }
            })
        } catch (error) {
            document.getElementById("card-errors").textContent = error.message
        }
    })
}

// Navigate to profile page
async function navigateToProfile() {
    return new Promise((resolve, reject) => {
        // Check if already on profile page
        if (window.location.href.includes("/in/")) {
            resolve(window.location.href)
            return
        }

        // Try to click on the profile link
        let profileLink = document.querySelector("#ember15") || document.querySelector('a[href*="/in/"]')

        if (profileLink) {
            // Store original URL to resolve after navigation
            const originalUrl = window.location.href

            // Add event listener for URL change
            const checkUrlChange = setInterval(() => {
                if (window.location.href !== originalUrl && window.location.href.includes("/in/")) {
                    clearInterval(checkUrlChange)
                    setTimeout(() => {
                        resolve(window.location.href)
                    }, 2000) // Give page time to load
                }
            }, 500)

            // Click the profile link
            profileLink.click()

            // Set timeout in case navigation fails
            setTimeout(() => {
                clearInterval(checkUrlChange)
                reject("Navigation to profile timed out")
            }, 10000)
        } else {
            reject("Could not find profile link")
        }
    })
}

// Start automation process
function startAutomation() {
    if (isProcessing) return
    isProcessing = true

    // Fetch profiles to process
    chrome.runtime.sendMessage({ action: "fetchProfiles" }, async (response) => {
        if (response.success) {
            profiles = response.profiles
            currentProfileIndex = 0

            if (profiles.length > 0) {
                processNextProfile()
            } else {
                alert("No profiles to process")
                isProcessing = false
            }
        } else {
            alert(`Failed to fetch profiles: ${response.error}`)
            isProcessing = false
        }
    })
}

// Start manual automation (from UI button)
function startManualAutomation() {
    setupOverlay.style.display = "none"
    startAutomation()
}

// Process the next profile in the list
async function processNextProfile() {
    if (currentProfileIndex >= profiles.length) {
        // All profiles processed, update last run
        chrome.runtime.sendMessage({ action: "updateLastRun" }, (response) => {
            if (response.success) {
                alert("All profiles processed successfully!")
            } else {
                alert(`Error updating last run: ${response.error}`)
            }
            isProcessing = false
        })
        return
    }

    const profile = profiles[currentProfileIndex]

    try {
        // Navigate to profile
        await navigateToProfileUrl(profile.linkedinProfileUrl)

        // Process posts
        await processProfilePosts()

        // Move to next profile
        currentProfileIndex++
        setTimeout(processNextProfile, 2000) // Add delay between profiles
    } catch (error) {
        console.error("Error processing profile:", error)
        // Continue with next profile
        currentProfileIndex++
        setTimeout(processNextProfile, 2000)
    }
}

// Navigate to a specific profile URL
async function navigateToProfileUrl(url) {
    return new Promise((resolve, reject) => {
        // Already on this profile?
        if (window.location.href === url) {
            resolve()
            return
        }

        // Navigate to URL
        window.location.href = url

        // Check when navigation completes
        const checkLoaded = setInterval(() => {
            if (document.readyState === "complete" && window.location.href === url) {
                clearInterval(checkLoaded)
                clearTimeout(timeout)
                setTimeout(resolve, 2000) // Wait for page to fully render
            }
        }, 500)

        // Set timeout in case navigation fails
        const timeout = setTimeout(() => {
            clearInterval(checkLoaded)
            reject("Navigation to profile URL timed out")
        }, 15000)
    })
}

// Process the posts of the current profile
async function processProfilePosts() {
    return new Promise(async (resolve, reject) => {
        try {
            // Find "Posts" tab and click it
            const postsTab = await waitForElement('a[href*="recent-activity/all/"]')
            if (!postsTab) {
                throw new Error("Posts tab not found")
            }

            postsTab.click()

            // Wait for posts to load
            await new Promise((r) => setTimeout(r, 3000))

            // Find post elements (this selector might need adjustment based on LinkedIn's structure)
            const posts = document.querySelectorAll(".occludable-update")

            // Process up to 5 posts
            let likedCount = 0
            for (let i = 0; i < posts.length && likedCount < 5; i++) {
                const post = posts[i]

                // Check if already liked
                const likeButton = post.querySelector('button[aria-pressed="false"]')
                if (likeButton) {
                    // Like the post
                    likeButton.click()
                    likedCount++

                    // Add small delay between likes
                    await new Promise((r) => setTimeout(r, 1000))
                }
            }

            resolve()
        } catch (error) {
            console.error("Error processing posts:", error)
            reject(error)
        }
    })
}

// Helper function to wait for an element to appear
async function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve) => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector))
        }

        const observer = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                observer.disconnect()
                resolve(document.querySelector(selector))
            }
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true,
        })

        setTimeout(() => {
            observer.disconnect()
            resolve(null)
        }, timeout)
    })
}

// Message listener from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "startSetup":
            initFloatingButton()
            break

        case "startAutomation":
            initFloatingButton()
            // Don't auto-start automation on every page load
            break
    }
    sendResponse({ received: true })
})

// Initialize once DOM is fully loaded
window.addEventListener("load", () => {
    // Initialize floating button
    initFloatingButton()
})
