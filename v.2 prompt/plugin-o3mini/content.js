(function() {
    // Only run on linkedin.com pages.
    if (!window.location.href.includes("linkedin.com")) return;
  
    // Add a floating button if it doesn’t exist already.
    if (!document.getElementById("linkedin-plugin-button")) {
      const btn = document.createElement("button");
      btn.id = "linkedin-plugin-button";
      btn.textContent = "Plugin UI";
      btn.style.position = "fixed";
      btn.style.bottom = "20px";
      btn.style.right = "20px";
      btn.style.zIndex = "10000";
      btn.style.padding = "10px 20px";
      btn.style.backgroundColor = "#0073b1";
      btn.style.color = "#fff";
      btn.style.border = "none";
      btn.style.borderRadius = "5px";
      btn.style.cursor = "pointer";
      document.body.appendChild(btn);
  
      btn.addEventListener("click", function() {
        // Show the plugin’s UI modal.
        showPluginModal();
      });
    }
  
    // Function to simulate navigation to the user profile.
    function navigateToUserProfile() {
      const btn1 = document.querySelector("#ember15");
      if (btn1) btn1.click();
      setTimeout(() => {
        const btn2 = document.querySelector("#ember272");
        if (btn2) btn2.click();
      }, 1000);
    }
  
    // Function to create and display the modal UI.
    function showPluginModal() {
      // Create an overlay.
      let overlay = document.createElement("div");
      overlay.id = "plugin-overlay";
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100%";
      overlay.style.height = "100%";
      overlay.style.backgroundColor = "rgba(0,0,0,0.5)";
      overlay.style.zIndex = "10001";
      document.body.appendChild(overlay);
  
      // Create the modal container.
      let modal = document.createElement("div");
      modal.id = "plugin-modal";
      modal.style.position = "fixed";
      modal.style.top = "50%";
      modal.style.left = "50%";
      modal.style.transform = "translate(-50%, -50%)";
      modal.style.backgroundColor = "#fff";
      modal.style.padding = "20px";
      modal.style.borderRadius = "8px";
      modal.style.boxShadow = "0 0 10px rgba(0,0,0,0.25)";
      modal.style.width = "300px";
      overlay.appendChild(modal);
  
      // Begin initialization: simulate navigation to user profile.
      navigateToUserProfile();
  
      // Create the setup form.
      let form = document.createElement("form");
      form.id = "plugin-form";
      form.innerHTML = `
        <h3>Setup Plugin</h3>
        <label>Email:</label><br>
        <input type="email" id="plugin-email" required style="width:100%;"><br><br>
        <label>Password:</label><br>
        <input type="password" id="plugin-password" required style="width:100%;"><br><br>
        <button type="submit" style="width:100%; padding:10px; background:#0073b1; color:#fff; border:none; border-radius:5px;">Submit</button>
      `;
      modal.appendChild(form);
  
      form.addEventListener("submit", function(e) {
        e.preventDefault();
        let email = document.getElementById("plugin-email").value;
        let password = document.getElementById("plugin-password").value;
        let profileUrl = window.location.href;
  
        // Make the GraphQL createUser mutation call.
        fetch('https://your-graphql-endpoint.com/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `mutation CreateUser($email: String!, $password: String!, $profileUrl: String!) {
              createUser(email: $email, password: $password, profileUrl: $profileUrl) { id }
            }`,
            variables: { email, password, profileUrl }
          })
        })
          .then(res => res.json())
          .then(result => {
            console.log("User created:", result);
            // After successful user creation, show the Stripe subscription embed.
            showStripeSubscription(modal);
          })
          .catch(err => {
            console.error("Error creating user:", err);
            alert("Error creating user.");
          });
      });
    }
  
    // Function to display the embedded Stripe subscription UI.
    function showStripeSubscription(modalContainer) {
      // Clear existing content.
      modalContainer.innerHTML = `<h3>Subscribe</h3>`;
      // Embed a Stripe subscription widget (for demo purposes, using a dummy URL).
      let stripeFrame = document.createElement("iframe");
      stripeFrame.src = "https://checkout.stripe.com/pay/cs_test_dummy";
      stripeFrame.style.width = "100%";
      stripeFrame.style.height = "400px";
      stripeFrame.style.border = "none";
      modalContainer.appendChild(stripeFrame);
  
      // Simulate subscription completion after 5 seconds.
      setTimeout(() => {
        // Mark the setup as complete.
        chrome.storage.local.set({ setupComplete: true }, () => {
          alert("Setup complete!");
          // Remove the modal.
          let overlay = document.getElementById("plugin-overlay");
          if (overlay) overlay.remove();
        });
      }, 5000);
    }
  
    // Listen for background messages to process profiles.
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "processProfiles") {
        processProfiles(message.profiles);
      }
    });
  
    // Function to process each profile by navigating to its page, opening posts, and liking up to 5 posts.
    function processProfiles(profiles) {
      if (!profiles || profiles.length === 0) {
        console.log("No profiles to process.");
        return;
      }
      let index = 0;
      function processNext() {
        if (index >= profiles.length) {
          // Notify background that processing is complete.
          chrome.runtime.sendMessage({ action: "profilesProcessed" });
          return;
        }
        let profile = profiles[index];
        console.log("Processing profile:", profile.profileUrl);
        // For demonstration, simulate navigation by setting window.location.href.
        // (In a full implementation, you might open in an iframe or new tab and manage state.)
        window.location.href = profile.profileUrl;
        // Wait for the page to “load” (simulate delay) before processing posts.
        setTimeout(() => {
          // Simulate liking posts: select up to 5 post containers and click the like button if not already liked.
          let posts = document.querySelectorAll(".post-container");
          let likes = 0;
          posts.forEach(post => {
            if (likes < 5) {
              let likeBtn = post.querySelector(".like-button");
              if (likeBtn && !likeBtn.classList.contains("liked")) {
                likeBtn.click();
                likes++;
              }
            }
          });
          index++;
          // Process the next profile after a short delay.
          setTimeout(processNext, 2000);
        }, 3000);
      }
      processNext();
    }
  })();
  