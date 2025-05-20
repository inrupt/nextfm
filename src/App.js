import React, { useState, useCallback } from 'react';
import {
  getSolidDataset,
  getContainedResourceUrlAll,
  getResourceInfo,
  isContainer,
  getSourceUrl,
  createContainerAt
} from "@inrupt/solid-client";
import { validateFolderName, validatePath } from './security';
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";
import { useAuth } from './authentication';
import TimBLFM from './TimBLFM';
import RadioLoader from './RadioLoader';
import { uploadFiles, moveFolder, createProgressTracker, deleteResource } from './fileOperations';
import { ThemeProvider } from './themes/themeContext';
import './index.css';

const SESSION_FETCH_ERROR = "You must be logged in to access files";
const STORAGE_NOT_INITIALIZED = "Storage location not initialized";

const useAuthError = (authError, handleError) => {
  React.useEffect(() => {
    if (authError) {
      handleError(authError);
    }
  }, [authError, handleError]);
};

function App() {
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [podRoot, setPodRoot] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());

  const handleError = useCallback((errorMessage) => {
    setError(errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateFiles = useCallback((resources) => {
    setFiles(resources);
  }, []);


const fetchFiles = useCallback(async (folderUrl) => {
    try {
      const session = getDefaultSession();
      if (!session.info.isLoggedIn) {
        handleError(SESSION_FETCH_ERROR);
        return;
      }

      const targetFolder = folderUrl?.endsWith('/') ? folderUrl : `${folderUrl}/`;
      console.log("Fetching files from:", targetFolder);

      const dataset = await getSolidDataset(targetFolder, {
        fetch: session.fetch
      });

      const resourceUrls = getContainedResourceUrlAll(dataset);
      const resourcePromises = resourceUrls.map(async (url) => {
        try {
          const info = await getResourceInfo(url, { fetch: session.fetch });
          const isFolder = isContainer(info);
          const segments = url.split('/').filter(Boolean);
          const name = decodeURIComponent(segments[segments.length - 1]);

          return {
            name: isFolder ? `${name}/` : name,
            url: getSourceUrl(info),
            isFolder: isFolder
          };
        } catch (err) {
          console.error(`Error processing resource ${url}:`, err);
          return null;
        }
      });

      const resources = (await Promise.all(resourcePromises))
        .filter(resource => resource !== null);

      const sortedResources = resources.sort((a, b) => {
        if (a.isFolder && !b.isFolder) return -1;
        if (!a.isFolder && b.isFolder) return 1;
        return a.name.localeCompare(b.name);
      });

      return { resources: sortedResources, targetFolder };
    } catch (error) {
      console.error("Error fetching resources:", error);
      throw error;
    }
  }, [handleError]);

const handleNavigate = useCallback(async (folderUrl) => {
    if (!folderUrl) return;
    if (!podRoot) {
      handleError(STORAGE_NOT_INITIALIZED);
      return;
    }

    try {
      const result = await fetchFiles(folderUrl);
      if (result) {
        updateFiles(result.resources);
        setCurrentFolder(result.targetFolder);
        clearError();
      }
    } catch (error) {
      console.error("Navigation error:", error);
      handleError(`Error fetching resources: ${error.message}`);

      if (error.message.includes('404') && folderUrl !== podRoot) {
        const parentFolder = folderUrl.split('/').slice(0, -2).join('/') + '/';
        console.log("Navigating to parent folder:", parentFolder);
        await handleNavigate(parentFolder);
      }
    }
  }, [fetchFiles, podRoot, updateFiles, clearError, handleError]);

const {
  isLoggedIn,
  webId,
  isLoading,
  error: authError,
  needsStorage,
  login,
  logout,
  setStorageLocation
} = useAuth(useCallback(async (storageUrl) => {
  console.log("Storage URL received:", storageUrl);
  try {
    if (storageUrl) {
      setPodRoot(storageUrl);
      setCurrentFolder(storageUrl);
      const result = await fetchFiles(storageUrl);
      if (result) {
        updateFiles(result.resources);
        clearError();
      }
    }
  } catch (error) {
    console.error("Error fetching initial files:", error);
    handleError(error.message);
  }
}, [setPodRoot, setCurrentFolder, fetchFiles, updateFiles, clearError, handleError]));

useAuthError(authError, handleError);

const handleUpload = useCallback(async (files) => {
  const session = getDefaultSession();
  const progressTracker = createProgressTracker(setUploadProgress);

  try {
    await uploadFiles(
      files,
      currentFolder,
      { fetch: session.fetch },
      {
        onPrepare: progressTracker.onPrepare,
        onProgress: progressTracker.onProgress,
        onError: progressTracker.onError,
        onComplete: async (message) => {
          progressTracker.onComplete(message);
          // Fetch and update the file list after successful upload
          const result = await fetchFiles(currentFolder);
          if (result) {
            updateFiles(result.resources);
            clearError();
          }
        }
      }
    );
  } catch (error) {
    console.error("Error uploading files:", error);
    handleError(`Upload failed: ${error.message}`);
  }
}, [currentFolder, fetchFiles, updateFiles, clearError, handleError]);

const handleDelete = useCallback(async (itemUrl, isFolder) => {
  const session = getDefaultSession();
  const progressTracker = createProgressTracker(setUploadProgress);

  try {
    await deleteResource(
      itemUrl,
      { fetch: session.fetch },
      {
        onPrepare: progressTracker.onPrepare,
        onProgress: progressTracker.onProgress,
        onError: progressTracker.onError,
        onComplete: async (message) => {
          progressTracker.onComplete(message);
          // Reset selection mode
          setIsSelectionMode(false);
          setSelectedItems(new Set());
          // Fetch and update the file list after successful deletion
          const result = await fetchFiles(currentFolder);
          if (result) {
            updateFiles(result.resources);
            clearError();
          }
        }
      }
    );
  } catch (error) {
    console.error("Error deleting item:", error);
    handleError(`Error deleting item: ${error.message}`);
    // Also reset selection mode on error
    setIsSelectionMode(false);
    setSelectedItems(new Set());
  }
}, [currentFolder, fetchFiles, updateFiles, clearError, handleError, setIsSelectionMode, setSelectedItems]);


const handleCreateFolder = useCallback(async (folderName) => {
  const session = getDefaultSession();

  const validation = validateFolderName(folderName);
  if (!validation.isValid) {
    handleError(validation.error);
    return;
  }

  try {
    const newFolderUrl = `${currentFolder}${validation.sanitizedName}/`;
    const pathValidation = validatePath(newFolderUrl);
    if (!pathValidation.isValid) {
      throw new Error(pathValidation.error);
    }

    await createContainerAt(pathValidation.sanitizedPath, { fetch: session.fetch });
    await fetchFiles(currentFolder);
    clearError();
  } catch (error) {
    console.error("Error creating folder:", error);
    handleError(`Error creating folder: ${error.message}`);
  }
}, [currentFolder, fetchFiles, clearError, handleError]);

const renameFolder = useCallback(async (oldUrl, newName) => {
  try {
    const session = getDefaultSession();
    const newUrl = `${currentFolder}${newName}/`;
    const progressTracker = createProgressTracker(setUploadProgress);

    try {
      await getSolidDataset(newUrl, { fetch: session.fetch });
      throw new Error('A folder with this name already exists');
    } catch (e) {
      if (!e.toString().includes('404')) {
        throw e;
      }
    }

    await moveFolder(
      oldUrl,
      newUrl,
      { fetch: session.fetch },
      {
        onPrepare: progressTracker.onPrepare,
        onProgress: progressTracker.onProgress,
        onError: progressTracker.onError,
        onComplete: progressTracker.onComplete
      }
    );

    // Delete the old folder after successful move
    await deleteResource(
      oldUrl,
      { fetch: session.fetch },
      {
        onProgress: (message, progress) => {
          progressTracker.onProgress(
            `Cleaning up old folder: ${message}`,
            progress
          );
        }
      }
    );

    await fetchFiles(currentFolder);
    clearError();
  } catch (error) {
    console.error("Error renaming folder:", error);
    handleError(`Error renaming folder: ${error.message}`);
  }
}, [currentFolder, fetchFiles, clearError, handleError]);

const handleLogout = useCallback(async () => {
    await logout();
    setFiles([]);
    setCurrentFolder(null);
    setPodRoot(null);
    setUploadProgress({});
    clearError();
  }, [logout, clearError]);

const solidFmProps = React.useMemo(() => ({
  isLoggedIn,
  webId,
  podRoot,
  currentFolder,
  files,
  uploadProgress,
  setUploadProgress,
  onLogin: login,
  onLogout: handleLogout,
  onDelete: handleDelete,
  onUpload: handleUpload,
  onNavigate: handleNavigate,
  onRename: renameFolder,
  onCreate: handleCreateFolder,
  needsStorage,
  setStorageLocation,
  error,
  authError,
  isSelectionMode,
  setIsSelectionMode,
  selectedItems,
  setSelectedItems
}), [
  isLoggedIn,
  webId,
  podRoot,
  currentFolder,
  files,
  uploadProgress,
  setUploadProgress,
  login,
  handleLogout,
  handleDelete,
  handleUpload,
  handleNavigate,
  renameFolder,
  handleCreateFolder,
  needsStorage,
  setStorageLocation,
  error,
  authError,
  isSelectionMode,
  setIsSelectionMode,
  selectedItems,
  setSelectedItems
]);

if (isLoading) {
    return <RadioLoader />;
  }

if (error || authError) {
    const errorMessage = error || authError;
    const isAuthError = errorMessage?.toString().includes('401') ||
                       errorMessage?.toString().includes('invalid_client');

    return (
      <ThemeProvider>
        <div className="min-h-screen bg-gray-100 dark:bg-next-dark p-6">
          <div className="max-w-4xl mx-auto bg-white dark:next-window shadow-lg dark:shadow-none p-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <h1 className="text-2xl font-bold text-red-600 dark:text-next-red">Error</h1>
              <p className="text-gray-800 dark:text-next-white">{errorMessage}</p>
              <button
                onClick={() => {
                  if (isAuthError) {
                    localStorage.clear();
                  }
                  window.location.reload();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:next-button-primary py-2 px-4 rounded dark:rounded-none"
              >
                {isAuthError ? "Reset & Reload" : "Retry"}
              </button>
            </div>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
      <ThemeProvider>
        <div className="App">
          <TimBLFM {...solidFmProps} />
        </div>
      </ThemeProvider>
    );
}

export default App;