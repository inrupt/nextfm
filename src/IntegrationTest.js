import React, { useState } from 'react';
import {
  login,
  handleIncomingRedirect,
  getDefaultSession
} from "@inrupt/solid-client-authn-browser";
import {
  getSolidDataset,
  createContainerAt,
  saveFileInContainer,
  deleteFile,
  deleteContainer
} from "@inrupt/solid-client";

export default function IntegrationTest() {
  const [tests, setTests] = useState({
    https: { status: 'pending', message: 'Checking HTTPS...' },
    cors: { status: 'pending', message: 'Checking CORS headers...' },
    auth: { status: 'pending', message: 'Testing authentication...' },
    redirect: { status: 'pending', message: 'Verifying redirect URI...' },
    fileOps: { status: 'pending', message: 'Testing file operations...' }
  });
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (testName, status, message) => {
    setTests(prev => ({
      ...prev,
      [testName]: { status, message }
    }));
  };

  const runTests = async () => {
    setIsRunning(true);
    
    // Test 1: HTTPS
    try {
      const protocol = window.location.protocol;
      if (protocol === 'https:') {
        updateTest('https', 'success', 'HTTPS verified successfully');
      } else {
        updateTest('https', 'error', 'Site is not served over HTTPS');
      }
    } catch (error) {
      updateTest('https', 'error', `HTTPS check failed: ${error.message}`);
    }

    // Test 2: CORS
    try {
      const response = await fetch('https://login.inrupt.com/.well-known/openid-configuration');
      const corsHeader = response.headers.get('access-control-allow-origin');
      
      if (corsHeader) {
        updateTest('cors', 'success', 'CORS headers are properly configured');
      } else {
        updateTest('cors', 'error', 'CORS headers are missing');
      }
    } catch (error) {
      updateTest('cors', 'error', `CORS check failed: ${error.message}`);
    }

    // Test 3: Authentication
    try {
      const session = getDefaultSession();
      if (!session.info.isLoggedIn) {
        await login({
          oidcIssuer: "https://login.inrupt.com",
          redirectUrl: window.location.href,
          clientName: "NextFM"
        });
        return; // Will redirect for auth
      }
      
      const authInfo = await handleIncomingRedirect();
      if (authInfo?.isLoggedIn || session.info.isLoggedIn) {
        updateTest('auth', 'success', 'Authentication successful');
        updateTest('redirect', 'success', 'Redirect URI working correctly');
      }
    } catch (error) {
      updateTest('auth', 'error', `Authentication failed: ${error.message}`);
      updateTest('redirect', 'error', 'Redirect URI may be misconfigured');
    }

    // Test 4: File Operations
    try {
      const podRoot = localStorage.getItem('podStorage');
      if (!podRoot) {
        updateTest('fileOps', 'error', 'No pod storage location set. Please set storage location first.');
        return;
      }

      const session = getDefaultSession();
      const testContainerUrl = `${podRoot}nextfm-test/`;
      
      // Create test container
      await createContainerAt(testContainerUrl, { fetch: session.fetch });
      
      // Create test file
      const testContent = new Blob(['test content'], { type: 'text/plain' });
      await saveFileInContainer(
        testContainerUrl,
        testContent,
        { slug: 'test.txt', contentType: 'text/plain', fetch: session.fetch }
      );
      
      // Verify container exists
      await getSolidDataset(testContainerUrl, { fetch: session.fetch });
      
      // Cleanup
      await deleteFile(`${testContainerUrl}test.txt`, { fetch: session.fetch });
      await deleteContainer(testContainerUrl, { fetch: session.fetch });
      
      updateTest('fileOps', 'success', 'File operations working correctly');
    } catch (error) {
      updateTest('fileOps', 'error', `File operations failed: ${error.message}`);
    }

    setIsRunning(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 bg-gray-900 rounded-lg border border-neon-blue">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-graffiti text-neon-green">PodSpaces Integration Test</h2>
        <button 
          onClick={runTests}
          disabled={isRunning}
          className="px-4 py-2 bg-neon-blue hover:bg-neon-blue-bright text-black font-graffiti rounded-full disabled:opacity-50 transition-colors"
        >
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(tests).map(([testName, { status, message }]) => (
          <div key={testName} className="flex items-center gap-4 p-4 bg-gray-800 rounded-md">
            <div className={`w-3 h-3 rounded-full ${
              status === 'success' ? 'bg-neon-green' :
              status === 'error' ? 'bg-neon-pink' :
              'bg-yellow-500'
            }`} />
            <div className="flex-1">
              <div className="font-medium capitalize text-white">{testName}</div>
              <div className="text-sm text-gray-400">{message}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
