const CLIENT_ID = '1030456782417-s76tvqmecn9hk21pu41o9p3u3ak2g99o.apps.googleusercontent.com';

export const initGoogleAuth = () => {
  return new Promise((resolve) => {
    if (window.google?.accounts) {
      resolve(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => {
      setTimeout(() => resolve(true), 500);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
};

export const signInWithGooglePopup = () => {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts) {
      reject('Google SDK not loaded');
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: 'email profile',
      callback: async (response) => {
        if (response.error) {
          reject(response.error);
          return;
        }
        
        try {
          // Get user info using the access token
          const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${response.access_token}`);
          const userData = await userResponse.json();
          
          resolve({
            id: userData.id,
            name: userData.name,
            email: userData.email,
            picture: userData.picture
          });
        } catch (error) {
          reject('Failed to get user info');
        }
      }
    });

    // Request access token (this opens the popup)
    client.requestAccessToken();
  });
};