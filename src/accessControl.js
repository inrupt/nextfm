import {
  getEffectiveAccess,
  getResourceInfo,
  deleteFile,
} from "@inrupt/solid-client";
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";
import React, { useEffect, useState } from 'react';
import { Edit2, Trash2, Lock } from 'lucide-react';

/**
 * Check if a resource has the required access rights
 * @param {Object} resource - The Solid resource to check
 * @param {Array<string>} requiredAccess - Array of required access types ("read", "write", "append", etc)
 * @returns {Promise<boolean>} - Whether the user has the required access
 */
export async function hasAccess(resource, requiredAccess) {
  try {
    const accessRights = await getEffectiveAccess(resource);
    return requiredAccess.every(
      (access) => accessRights.user[access] === true
    );
  } catch (error) {
    console.error("Error checking access:", error);
    return false;
  }
}

/**
 * Component that conditionally renders children based on access rights
 */
export function HasAccess({ access, resource, children, fallback = null }) {
  const [hasRequiredAccess, setHasRequiredAccess] = useState(null);

  useEffect(() => {
    let mounted = true;

    const checkAccess = async () => {
      try {
        const result = await hasAccess(resource, access);
        if (mounted) {
          setHasRequiredAccess(result);
        }
      } catch (error) {
        console.error("Error checking access:", error);
        if (mounted) {
          setHasRequiredAccess(false);
        }
      }
    };

    checkAccess();

    return () => {
      mounted = false;
    };
  }, [resource, access]);

  if (hasRequiredAccess === null) {
    return null;
  }

  if (!hasRequiredAccess) {
    return fallback;
  }

  return children;
}

/**
 * Hook to fetch and monitor resource access info
 */
export function useResourceAccess(url) {
  const [resource, setResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const session = getDefaultSession();

    const fetchResource = async () => {
      try {
        setIsLoading(true);
        const resourceInfo = await getResourceInfo(url, {
          fetch: session.fetch
        });
        if (mounted) {
          setResource(resourceInfo);
          setError(null);
        }
      } catch (error) {
        console.error("Error fetching resource info:", error);
        if (mounted) {
          setError(error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchResource();

    return () => {
      mounted = false;
    };
  }, [url]);

  return { resource, isLoading, error };
}

/**
 * Component for access-aware file actions
 */
export function AccessAwareFileActions({ item, onDelete, onRename, disableActions = false }) {
  const { resource, isLoading, error } = useResourceAccess(item.url);

  if (isLoading || error || disableActions) {
    return null;
  }

  return (
    <HasAccess
      access={["write"]}
      resource={resource}
      fallback={
        <div className="text-next-white/40 text-xs flex items-center px-1">
          <Lock className="h-3 w-3 mr-1" /> Read-only
        </div>
      }
    >
      <div className="flex items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRename(item);
          }}
          className="text-next-blue hover:text-next-highlight p-1 rounded transition-colors"
          aria-label={item.isFolder ? "Rename folder" : "Rename file"}
        >
          <Edit2 className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item);
          }}
          className="text-next-red/80 hover:text-next-red p-1 rounded transition-colors"
          aria-label={item.isFolder ? "Delete folder" : "Delete file"}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </HasAccess>
  );
}

// HOC to wrap operations that require specific access
export function withAccessCheck(operation, requiredAccess = ["write"]) {
  return async (resource, ...args) => {
    try {
      const hasRequiredAccess = await hasAccess(resource, requiredAccess);
      if (!hasRequiredAccess) {
        throw new Error("Insufficient permissions to perform this operation");
      }
      return await operation(resource, ...args);
    } catch (error) {
      console.error("Access check failed:", error);
      throw error;
    }
  };
}

// Example usage of withAccessCheck for delete operation
export const secureDelete = withAccessCheck(async (resource, options) => {
  return await deleteFile(resource, options);
});

/**
 * Utility to check upload permissions for a container
 */
export async function canUploadTo(containerUrl) {
  try {
    const session = getDefaultSession();
    const container = await getResourceInfo(containerUrl, {
      fetch: session.fetch
    });
    return await hasAccess(container, ["append", "write"]);
  } catch (error) {
    console.error("Error checking upload permissions:", error);
    return false;
  }
}