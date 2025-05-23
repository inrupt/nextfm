// fileOperations.js
import {
  deleteFile,
  deleteSolidDataset,
  getSolidDataset,
  getContainedResourceUrlAll,
  getSourceUrl,
  isContainer,
  saveFileInContainer,
  createContainerAt,
  getResourceInfo
} from "@inrupt/solid-client";
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";
import { validateBatchUpload } from './security';

/**
 * Upload multiple files with progress tracking
 */
export async function uploadFiles(files, currentFolder, options, callbacks = {}) {
  const {
    onProgress,
    onPrepare,
    onError,
    onComplete
  } = callbacks;

  const batchValidation = validateBatchUpload(files);
  if (!batchValidation.isValid) {
    throw new Error(`Upload validation failed: ${batchValidation.errors.join('; ')}`);
  }

  const totalFiles = files.length;
  let completedFiles = 0;

  // Proceed with file operations
    if (onPrepare) {
      onPrepare(`Validating ${totalFiles} files`);
    }

    for (const file of files) {
      try {
        if (onProgress) {
          onProgress(
            `Uploading ${file.name} (${completedFiles + 1}/${totalFiles})`,
            (completedFiles / totalFiles) * 100
          );
        }

        const sanitizedName = file.name.replace(/^.*[/\\]/, '');
        await saveFileInContainer(
          currentFolder,
          file,
          {
            slug: sanitizedName,
            contentType: file.type,
            ...options
          }
        );
        completedFiles++;
      } catch (error) {
        if (onError) {
          onError(error, file.name);
        }
        throw error;
      }
    }

    if (onComplete) {
      onComplete(`Completed ${completedFiles}/${totalFiles} files`);
    }
}

/**
 * Move/Rename a folder with progress tracking
 */
export async function moveFolder(oldUrl, newUrl, options, callbacks = {}) {
  const {
    onProgress,
    onPrepare,
    onError,
    onComplete
  } = callbacks;

  // Proceed with folder operations
    if (onPrepare) {
      onPrepare("Creating new folder");
    }

    await createContainerAt(newUrl, options);

    const dataset = await getSolidDataset(oldUrl, options);
    const resources = getContainedResourceUrlAll(dataset);
    const totalItems = resources.length;
    let processedItems = 0;

    for (const resourceUrl of resources) {
      try {
        const name = decodeURIComponent(resourceUrl.split("/").pop());

        if (onProgress) {
          onProgress(
            `Moving ${name}`,
            (processedItems / totalItems) * 100
          );
        }

        const response = await options.fetch(resourceUrl);
        const blob = await response.blob();
        await saveFileInContainer(
          newUrl,
          blob,
          {
            slug: name,
            contentType: blob.type,
            ...options
          }
        );
        processedItems++;
      } catch (error) {
        if (onError) {
          onError(error, resourceUrl);
        }
        throw error;
      }
    }

    if (onComplete) {
      onComplete("Folder moved successfully");
    }
}

/**
 * Move/Rename a file with progress tracking
 */
export async function renameFile(oldUrl, newName, options, callbacks = {}) {
  const {
    onProgress,
    onPrepare,
    onError,
    onComplete
  } = callbacks;

  try {
    if (onPrepare) {
      onPrepare(`Preparing to rename file`);
    }

    const session = options.fetch ? { fetch: options.fetch } : getDefaultSession();
    const response = await session.fetch(oldUrl);
    if (!response.ok) throw new Error('Failed to fetch source file');

    const fileBlob = await response.blob();
    const parentUrl = oldUrl.substring(0, oldUrl.lastIndexOf('/') + 1);

    if (onProgress) {
      onProgress('Moving file to new name', 50);
    }

    await saveFileInContainer(
      parentUrl,
      fileBlob,
      {
        slug: newName,
        contentType: fileBlob.type,
        ...options
      }
    );

    await deleteFile(oldUrl, options);

    if (onComplete) {
      onComplete('File renamed successfully');
    }
  } catch (error) {
    if (onError) {
      onError(error, oldUrl);
    }
    throw error;
  }
}

/**
 * Delete a resource or container recursively with progress tracking
 */
export async function deleteResource(url, options, callbacks = {}) {
  const {
    onProgress,
    onPrepare,
    onError,
    onComplete
  } = callbacks;

  try {
    // Try to get resource info first
    const resourceInfo = await getResourceInfo(url, options);
    const isResourceContainer = isContainer(resourceInfo);

    // If it's not a container, delete it directly
    if (!isResourceContainer) {
      if (onPrepare) {
        onPrepare(`Preparing to delete ${url.split('/').pop()}`);
      }
      await deleteFile(url, options);
      if (onComplete) {
        onComplete("File deleted successfully");
      }
      return;
    }

    // For containers, proceed with recursive deletion
    const dataset = await getSolidDataset(url, options);

    // Count items first for accurate progress
    let totalItems = 1; // Count the container itself
    let deletedItems = 0;

    const countItems = async (ds) => {
      const urls = getContainedChildrenUrls(ds);
      totalItems += urls.length;

      await Promise.all(urls.map(async (childUrl) => {
        try {
          const childInfo = await getResourceInfo(childUrl, options);
          if (isContainer(childInfo)) {
            const childDataset = await getSolidDataset(childUrl, options);
            await countItems(childDataset);
          }
        } catch {
          // If not a dataset, just count it as one item
        }
      }));
    };

    if (onPrepare) {
      onPrepare("Calculating items to delete...");
    }
    await countItems(dataset);

    // Recursive delete function
    const deleteRecursively = async (ds) => {
      const containedUrls = getContainedChildrenUrls(ds);

      await Promise.all(
        containedUrls.map(async (resourceUrl) => {
          try {
            const childInfo = await getResourceInfo(resourceUrl, options);
            if (isContainer(childInfo)) {
              const childDataset = await getSolidDataset(resourceUrl, options);
              await deleteRecursively(childDataset);
            } else {
              await deleteFile(resourceUrl, options);
            }
            deletedItems++;
            if (onProgress) {
              const name = resourceUrl.split('/').pop();
              onProgress(
                `Deleting ${name}`,
                (deletedItems / totalItems) * 100
              );
            }
          } catch (error) {
            if (onError) {
              onError(error, resourceUrl);
            }
            throw error;
          }
        })
      );

      await deleteSolidDataset(ds, options);
      deletedItems++;
      if (onProgress) {
        onProgress(
          "Cleaning up...",
          (deletedItems / totalItems) * 100
        );
      }
    };

    await deleteRecursively(dataset);

    if (onComplete) {
      onComplete("Deletion completed successfully");
    }
  } catch (error) {
    if (onError) {
      onError(error, url);
    }
    throw error;
  }
}

// Helper function to get contained children URLs
function getContainedChildrenUrls(container) {
  if (!isContainer(container)) {
    return [];
  }

  const containerUrl = getSourceUrl(container);

  function isValidChild(childUrl) {
    return childUrl !== null && childUrl.startsWith(containerUrl);
  }

  return getContainedResourceUrlAll(container)
    .map((url) => {
      try {
        return new URL(url).href;
      } catch {
        return null;
      }
    })
    .filter(isValidChild);
}

/**
 * Create an operation progress tracker
 */
export function createProgressTracker(setUploadProgress) {
  const operationId = Math.random().toString(36).substring(7);

  return {
    id: operationId,
    onPrepare: (message) => {
      setUploadProgress(() => ({
        [operationId]: {
          filename: message,
          status: 'preparing',
          progress: 0
        }
      }));
    },
    onProgress: (message, progress) => {
      setUploadProgress(() => ({
        [operationId]: {
          filename: message,
          status: 'progress',
          progress: Math.round(progress)
        }
      }));
    },
    onError: (error, filename) => {
      setUploadProgress(() => ({
        [operationId]: {
          filename: `Error with ${filename}: ${error.message}`,
          status: 'error',
          progress: 0
        }
      }));
    },
    onComplete: (message) => {
      setUploadProgress(() => ({
        [operationId]: {
          filename: message,
          status: 'completed',
          progress: 100
        }
      }));

      // Use the variable before removal to avoid unused variable warning
      setTimeout(() => {
        setUploadProgress(prev => {
          // Extract the operation to be removed and the rest
          const { [operationId]: completedOp, ...rest } = prev;
          // Log completion for debugging if needed
          if (process.env.NODE_ENV === 'development') {
            console.debug('Removing completed operation:', completedOp);
          }
          return rest;
        });
      }, 3000);
    }
  };
}