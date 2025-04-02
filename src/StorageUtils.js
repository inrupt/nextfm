// StorageUtils.js

export function getValidStorageBaseUrl() {
  const storedIssuer = localStorage.getItem('oidcIssuer');
  if (storedIssuer) {
    const domain = new URL(storedIssuer).hostname;
    // First replace openid. (if it exists)
    let storageDomain = domain.replace('openid.', '');
    // Then replace oidc. (if it exists)
    storageDomain = storageDomain.replace('oidc.', '');
    // Finally add storage.
    return `https://storage.${storageDomain}`;
  }
  return 'https://storage.inrupt.com';
}

export function getProvisionBaseUrl() {
  const storageBaseUrl = getValidStorageBaseUrl();
  return storageBaseUrl.replace('storage.', 'provision.');
}


export function validateStorageUrl(url) {
  const validBase = getValidStorageBaseUrl();
  if (!url.startsWith(validBase)) {
    throw new Error(`Invalid storage URL. It should start with ${validBase}`);
  }
  return true;
}

// Other validation helpers
export function isValidInruptDomain(hostname) {
  return hostname.endsWith('.inrupt.com') &&
         hostname.split('.').length >= 3;
}

export function isValidEndSessionUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:' && isValidInruptDomain(urlObj.hostname);
  } catch {
    return false;
  }
}
