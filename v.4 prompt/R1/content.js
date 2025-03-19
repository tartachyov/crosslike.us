// Floating button
const floatingBtn = document.createElement('div');
floatingBtn.id = 'quorini-floating-btn';
document.body.appendChild(floatingBtn);

// Plugin UI container
const pluginUI = document.createElement('div');
pluginUI.id = 'quorini-plugin-ui';
document.body.appendChild(pluginUI);

let isProcessing = false;

floatingBtn.addEventListener('click', () => {
  pluginUI.style.display = pluginUI.style.display === 'block' ? 'none' : 'block';
});

// LinkedIn automation logic
async function processParticipants() {
  const participants = await ApiService.listParticipants();
  const state = await chrome.storage.local.get('processingState');
  
  for (const participant of participants.data.list.listParticipants) {
    if (new Date(participant.lastExecuted) > Date.now() - 3 * 24 * 60 * 60 * 1000) {
      window.location.href = participant.linkedInFeedUrl;
      
      await new Promise(resolve => {
        const checkLoaded = setInterval(() => {
          if (document.querySelector('[class*="social-action-button__text"]')) {
            clearInterval(checkLoaded);
            resolve();
          }
        }, 500);
      });
      
      const likeButtons = Array.from(document.querySelectorAll('button'))
        .filter(btn => btn.querySelector('span[class*="social-action-button__text"]'))
        .slice(0, 5);
      
      for (const btn of likeButtons) {
        if (!btn.querySelector('span[class*="--like"]')) {
          btn.click();
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      
      await chrome.storage.local.set({
        processingState: { 
          currentParticipantIndex: participants.indexOf(participant) + 1 
        }
      });
    }
  }
  
  // Update last executed
  const userResponse = await ApiService.makeAuthenticatedRequest({
    query: "query { listParticipantsForUserSelf { id } }"
  });
  const userId = userResponse.data.list.listParticipantsForUserSelf[0].id;
  await ApiService.updateParticipant(userId, new Date().toISOString());
}

// Detect LinkedIn navigation
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'processLinkedIn') {
    isProcessing = true;
    processParticipants();
  }
});