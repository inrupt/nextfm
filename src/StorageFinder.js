import { useState, useEffect } from 'react';
import { FolderIcon, Loader2, AlertCircle } from 'lucide-react';
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";

async function discoverPods() {
  const session = getDefaultSession();
  const storedIssuer = localStorage.getItem('oidcIssuer');

  if (!storedIssuer) return null;

  try {
    // Special handling for PodSpaces
    if (storedIssuer === 'https://login.inrupt.com') {
      const response = await session.fetch('https://provision.inrupt.com/list');
      if (response.ok) {
        const podPaths = await response.json();
        return podPaths.map(path => ({
          url: `https://storage.inrupt.com${path}`,
          id: path.split('/')[1]
        }));
      }
    }

    // For other IDPs, try standard pod discovery
    const provisionUrl = storedIssuer.replace('openid.', 'provision.')
                                   .replace('oidc.', 'provision.');

    const response = await session.fetch(`${provisionUrl}/list`);
    if (response.ok) {
      const podPaths = await response.json();
      const storageUrl = storedIssuer.replace('openid.', 'storage.')
                                   .replace('oidc.', 'storage.');
      return podPaths.map(path => ({
        url: `${storageUrl}${path}`,
        id: path.split('/')[1]
      }));
    }

    // If that fails, try the profile page method
    const baseDomain = new URL(storedIssuer).hostname
      .replace('openid.', '')
      .replace('oidc.', '');

    const profileUrl = `https://start.${baseDomain}/profile`;
    const profileResponse = await session.fetch(profileUrl);

    if (profileResponse.ok) {
      const html = await profileResponse.text();

      // Parse the storage URLs from the HTML
      const matches = html.match(/https:\/\/storage\.[^/]+\/[a-f0-9-]+\//g);
      if (matches) {
        return matches.map(url => ({
          url: url,
          id: url.split('/').slice(-2)[0]
        }));
      }
    }
  } catch (error) {
    console.error("Pod discovery failed:", error);
  }

  return null;
}

export default function StorageFinder({ onSubmit, error: externalError }) {
  const [mode, setMode] = useState('discovering');
  const [pods, setPods] = useState([]);
  const [manualUrl, setManualUrl] = useState('');
  const [inputError, setInputError] = useState('');
  const [profileUrl, setProfileUrl] = useState('');

  useEffect(() => {
    getDefaultSession();
    const storedIssuer = localStorage.getItem('oidcIssuer');

    // Set profile URL based on IDP
    if (storedIssuer) {
      const baseDomain = new URL(storedIssuer).hostname
        .replace('openid.', '')
        .replace('oidc.', '');
      setProfileUrl(`start.${baseDomain}/profile`);
    }

    let mounted = true;
    async function discover() {
      const discoveredPods = await discoverPods();
      if (!mounted) return;
      if (discoveredPods && discoveredPods.length > 0) {
        setPods(discoveredPods);
        setMode('select');
      } else {
        setMode('manual');
      }
    }
    discover();
    return () => { mounted = false; };
  }, []);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setInputError('');

    if (!manualUrl) {
      setInputError('Please enter a storage URL');
      return;
    }

    try {
      // Add https:// if not present
      let fullUrl = manualUrl;
      if (!fullUrl.startsWith('http')) {
        fullUrl = `https://${fullUrl}`;
      }

      const url = new URL(fullUrl);
      if (url.protocol !== 'https:') {
        setInputError('Storage URL must use HTTPS');
        return;
      }

      // Ensure URL ends with trailing slash
      const normalizedUrl = fullUrl.endsWith('/') ? fullUrl : `${fullUrl}/`;
      onSubmit(normalizedUrl);
    } catch {
      setInputError('Invalid storage URL');
    }
  };

  const displayError = inputError || externalError;

  if (mode === 'discovering') {
    return (
      <div className="next-panel p-4">
        <div className="flex items-center justify-center space-y-4 py-8">
          <Loader2 className="h-8 w-8 text-next-blue animate-spin" />
          <span className="text-next-white/80 ml-3">Discovering your pods...</span>
        </div>
      </div>
    );
  }

  if (mode === 'select' && pods.length > 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-next-white mb-4">
          Select Your Pod Storage
        </h2>

        <div className="next-panel p-4 space-y-3">
          {pods.map((pod) => (
            <button
              key={pod.id}
              onClick={() => onSubmit(pod.url)}
              className="w-full bg-next-gray/70 hover:bg-next-blue/20 p-3 rounded-sm flex items-center space-x-3 group transition-colors"
            >
              <FolderIcon className="h-5 w-5 text-next-accent flex-shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-next-white text-sm">{pod.id}</div>
                <div className="text-next-white/60 text-xs font-mono truncate">
                  {pod.url}
                </div>
              </div>
            </button>
          ))}

          <div className="pt-3 border-t border-next-white/10">
            <button
              onClick={() => setMode('manual')}
              className="text-next-blue hover:text-next-highlight text-sm"
            >
              Use a different Storage URL
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-next-white mb-2">
        Enter Your Pod URL
      </h2>

      <form onSubmit={handleManualSubmit} className="next-panel p-4 space-y-4">
        <div className="flex flex-col space-y-3">
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="storage.your-domain.com/your-pod-id/"
            className="next-input w-full py-2 px-3 text-sm"
            autoFocus
          />
          <button
            type="submit"
            className="next-button-primary"
          >
            Connect
          </button>
        </div>

        {displayError && (
          <div className="bg-next-red/10 border-l-2 border-next-red p-2 text-sm rounded-sm flex items-center">
            <AlertCircle className="h-4 w-4 text-next-red mr-2 flex-shrink-0" />
            <span className="text-next-white/90">{displayError}</span>
          </div>
        )}

        {profileUrl && (
          <div className="text-next-white/60 text-xs border-t border-next-white/10 pt-3">
            <p>
              Find your storage URL at{' '}
              <a
                href={`https://${profileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-next-blue hover:text-next-highlight"
              >
                {profileUrl}
              </a>
            </p>
          </div>
        )}
      </form>
    </div>
  );
}