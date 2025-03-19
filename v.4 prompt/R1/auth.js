class AuthService {
    static async signUp(email, password, linkedInUrl) {
      const mutation = `mutation create($input: createParticipantInput!) {
        createParticipant(input: $input) { id }
      }`;
      
      const response = await fetch('https://api.quorini.io/67d199012a8e29e0e15ab2b8/gql?env=dev', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          authOption: { username: email, password },
          query: mutation,
          variables: {
            input: { linkedInFeedUrl: linkedInUrl }
          }
        })
      });
      return response.json();
    }
  
    static async verifyEmail(code, email) {
      const url = `https://auth.quorini.io/67d199012a8e29e0e15ab2b8/verify-email/?code=${code}&username=${email}&env=dev`;
      return fetch(url, { method: 'GET' });
    }
  
    static async login(email, password) {
      const response = await fetch('https://auth.quorini.io/67d199012a8e29e0e15ab2b8/log-in?env=dev', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ authOption: { username: email, password } })
      });
      return response.json();
    }
  
    static async refreshToken(refreshToken) {
      const response = await fetch('https://auth.quorini.io/67d199012a8e29e0e15ab2b8/refresh-token/?env=dev', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ refreshToken })
      });
      return response.json();
    }
  }