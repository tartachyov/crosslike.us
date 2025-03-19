class ApiService {
    static async makeAuthenticatedRequest(body) {
      let { accessToken, refreshToken } = await chrome.storage.local.get(['accessToken', 'refreshToken']);
      
      // Refresh token if needed
      if (!accessToken) {
        const newTokens = await AuthService.refreshToken(refreshToken);
        await chrome.storage.local.set({
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken
        });
      }
      
      const response = await fetch('https://api.quorini.io/67d199012a8e29e0e15ab2b8/gql?env=dev', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
      });
      
      return response.json();
    }
  
    static async listParticipants() {
      const query = `query list { 
        listParticipants { 
          id 
          linkedInFeedUrl 
          isActive 
          lastExecuted 
        } 
      }`;
      
      return this.makeAuthenticatedRequest({ query, variables: { input: {} } });
    }
  
    static async updateParticipant(participantId, lastExecuted) {
      const mutation = `mutation update($input: updateParticipantForUserSelfInput!) {
        updateParticipantForUserSelf(input: $input) { id }
      }`;
      
      return this.makeAuthenticatedRequest({
        query: mutation,
        variables: {
          input: {
            id: participantId,
            lastExecuted: new Date().toISOString()
          }
        }
      });
    }
  }