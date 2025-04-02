import { useState, useEffect, useCallback } from 'react';
import {
  login,
  handleIncomingRedirect,
  getDefaultSession,
} from "@inrupt/solid-client-authn-browser";

// domain validation
const isValidDomain = (hostname) => {
  // Basic security check - ensure at least one subdomain
  return hostname.split('.').length >= 2;
};

// Validate the end session endpoint URL
const isValidEndSessionUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && isValidDomain(urlObj.hostname);
  } catch {
    return false;
  }
};

export function useAuth(onStorageLocation) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [webId, setWebId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsStorage, setNeedsStorage] = useState(false);

  const handleLogin = async (selectedIDP) => {
    try {
      console.log('Starting login with IDP:', selectedIDP.oidcIssuer);
      localStorage.setItem('oidcIssuer', selectedIDP.oidcIssuer);

      // Verify the OIDC configuration endpoint is accessible
      const configUrl = `${selectedIDP.oidcIssuer}/.well-known/openid-configuration`;
      console.log('Attempting to fetch OIDC config from:', configUrl);

      try {
        const configResponse = await fetch(configUrl, {
          headers: {
            'Accept': 'application/json'
          }
        });
        console.log('OIDC config response status:', configResponse.status);

        if (!configResponse.ok) {
          throw new Error(`OIDC config endpoint returned ${configResponse.status}`);
        }

        await configResponse.json();
        console.log('OIDC config successfully fetched');

      } catch (configError) {
        console.error('OIDC configuration fetch failed:', configError);
        // Log the actual error details
        if (configError instanceof TypeError) {
          console.error('Network error details:', configError);
        }
        throw new Error(`OIDC endpoint not accessible: ${configError.message}`);
      }

      console.log('Proceeding with login...');
      await login({
        oidcIssuer: selectedIDP.oidcIssuer,
        redirectUrl: window.location.origin + '/',
        clientName: "SolidFM",
        tokenType: "DPoP"
      });
    } catch (error) {
      console.error('Login error details:', error);
      setError('Authentication failed: ' + error.message);
    }
  };

  const handleLogout = async () => {
    const session = getDefaultSession();
    try {
      const storedIssuer = localStorage.getItem('oidcIssuer') || 'https://login.inrupt.com';

      // Use the stored issuer for configuration
      const response = await fetch(`${storedIssuer}/.well-known/openid-configuration`, {
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch OIDC configuration');
      }

      const { end_session_endpoint } = await response.json();

      // Clear storage
      localStorage.removeItem('podStorage');

      // Perform logout
      await session.logout();

      if (end_session_endpoint && isValidEndSessionUrl(end_session_endpoint)) {
        window.location.href = end_session_endpoint;
      } else {
        window.location.reload();
      }
    } catch (error) {
      console.error("Logout error:", error);
      localStorage.removeItem('podStorage');
      await session.logout();
      window.location.reload();
    }
  };

  const setStorageLocation = useCallback(async (storageUrl) => {
    try {
      // Simple URL normalization
      const normalizedUrl = storageUrl.endsWith('/') ? storageUrl : `${storageUrl}/`;

      // Basic URL validation
      try {
        new URL(normalizedUrl);
      } catch {
        throw new Error('Invalid storage URL');
      }

      // Test if we can access the storage location
      const session = getDefaultSession();
      const response = await session.fetch(normalizedUrl);

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('Access denied. Please check your permissions for this storage location.');
        }
        throw new Error('Could not access storage location. Please verify the URL.');
      }

      // Store and use the validated URL
      localStorage.setItem('podStorage', normalizedUrl);
      await onStorageLocation?.(normalizedUrl);
      setNeedsStorage(false);
      setError(null);
    } catch (error) {
      console.error("Storage location error:", error);
      setError(error.message);
    }
  }, [onStorageLocation]);

  useEffect(() => {
    async function initAuth() {
      try {
        const session = getDefaultSession();
        const info = await handleIncomingRedirect({ restorePreviousSession: true });

        if (info?.isLoggedIn || session.info.isLoggedIn) {
          setIsLoggedIn(true);
          setWebId(info?.webId || session.info.webId);

          // Get the issuer from the active session
          const currentIssuer = session.info.issuer;
          if (currentIssuer) {
            localStorage.setItem('oidcIssuer', currentIssuer);
          }

          const storedStorage = localStorage.getItem('podStorage');
          storedStorage ? await setStorageLocation(storedStorage) : setNeedsStorage(true);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, [setStorageLocation]);

  return {
    isLoggedIn,
    webId,
    isLoading,
    error,
    needsStorage,
    login: handleLogin,
    logout: handleLogout,
    setStorageLocation
  };
}
