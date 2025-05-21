import React, { useState } from 'react';
import {
  FileIcon,
  FolderIcon,
  Trash2,
  Upload,
  LogOut,
  Plus
} from 'lucide-react';
import Permissions from './Permissions';
import StorageFinder from './StorageFinder';
import ImageViewer from './ImageViewer';
import FileViewer from './FileViewer';
import { renameFile, createProgressTracker } from './fileOperations';
import BatchUploadProgress from './BatchUploadProgress';
import StationSelector from './StationSelector';
import { validatePath, validateFileName, validateContentType } from './security';
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";
import { saveFileInContainer, deleteFile } from "@inrupt/solid-client";
import { AccessAwareFileActions, canUploadTo } from './accessControl';
import { useTheme, THEMES } from './themes/themeContext';
import { getThemeClasses } from './themes/themeStyles';
import ThemeSelector from './components/ThemeSelector';
// Import theme-specific logos
import nextLogo from './NeXT_logo.svg';
import solidLogo from './solid.png';

const NextFM = ({
  isLoggedIn,
  webId,
  podRoot,
  currentFolder,
  files,
  uploadProgress,
  setUploadProgress,
  onLogin,
  onLogout,
  onDelete,
  onUpload,
  onNavigate,
  onRename,
  onCreate,
  needsStorage,
  setStorageLocation,
  error,
  authError,
  isSelectionMode,
  setIsSelectionMode,
  selectedItems,
  setSelectedItems
}) => {


  const [selectedFiles, setSelectedFiles] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [viewingImage, setViewingImage] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [viewingFile, setViewingFile] = useState(null);

// Login effect
React.useEffect(() => {
    if (isLoggedIn && podRoot && (!currentFolder || currentFolder === podRoot)) {
      onNavigate(podRoot);
    }
  }, [isLoggedIn, podRoot, currentFolder, onNavigate]);

// Clear selection effect
React.useEffect(() => {
  // Clear selection mode when folder changes
  setIsSelectionMode(false);
  setSelectedItems(new Set());
}, [currentFolder, setIsSelectionMode, setSelectedItems]);

  // File type checking
const isImageFile = (filename) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

const isTextFile = (filename) => {
  const textExtensions = ['.json', '.txt', '.md', '.csv', '.js', '.jsx', '.ts', '.tsx', '.css', '.html'];
  return textExtensions.some(ext => filename.toLowerCase().endsWith(ext));
};

  // Navigation handlers
const handleFolderClick = async (event, folderUrl) => {
  if (isSelectionMode) return;

  try {
    // Always ensure URL ends with forward slash
    const normalizedUrl = folderUrl.endsWith('/') ? folderUrl : `${folderUrl}/`;
    console.log("Navigating to:", normalizedUrl);

    event.preventDefault();
    event.stopPropagation();

    // Call onNavigate with normalized URL
    await onNavigate(normalizedUrl);
  } catch (error) {
    console.error("Navigation error:", error);
  }
};


const handleItemClick = (event, item) => {
  if (!item.isFolder && isSelectionMode) {
    toggleSelection(item, event);
    return;
  }

  event.preventDefault();

  if (item.isFolder) {
    const folderUrl = item.url.endsWith('/') ? item.url : `${item.url}/`;
    handleFolderClick(event, folderUrl);
  } else if (isImageFile(item.name)) {
    setViewingImage(item.url);
  } else if (isTextFile(item.name)) {
    handleFileView(item.url);
  }
};

const handleContextMenu = (e, item) => {
  e.preventDefault();
//  if (!isSelectionMode) {
//    setIsSelectionMode(true);
//    setSelectedItems(new Set([item.url]));
//  }
};

  // File upload handlers
  const handleFileChange = (event) => {
    setSelectedFiles(Array.from(event.target.files));
  };

const handleUpload = async () => {
  if (selectedFiles.length > 0) {
    try {
      const canWrite = await canUploadTo(currentFolder);
      if (!canWrite) {
        alert("You don't have permission to upload files here");
        return;
      }
      await onUpload(selectedFiles);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading files: " + error.message);
    }
  }
};

  // Drag and drop handlers
  const handleDragStart = (e, item) => {
    if (!item.isFolder) {
      e.dataTransfer.setData('text/plain', item.url);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e, item) => {
    if (item.isFolder) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverItem(item.url);
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

const handleDrop = async (e, targetFolder) => {
  e.preventDefault();
  setDragOverItem(null);
  const sourceUrl = e.dataTransfer.getData('text/plain');

  // Validate source and target paths
  const sourcePathValidation = validatePath(sourceUrl);
  const targetPathValidation = validatePath(targetFolder.url);

  if (!sourcePathValidation.isValid || !targetPathValidation.isValid) {
    console.error("Invalid path detected");
    return;
  }

  if (sourceUrl && targetFolder.isFolder && sourceUrl !== targetFolder.url) {
    const session = getDefaultSession();
    try {
      const fileName = decodeURIComponent(sourceUrl.split('/').pop());
      // Validate filename
      if (!validateFileName(fileName)) {
        throw new Error('Invalid file name');
      }

      const targetUrl = `${targetFolder.url}${fileName}`;
      // Validate target URL
      const finalTargetValidation = validatePath(targetUrl);
      if (!finalTargetValidation.isValid) {
        throw new Error('Invalid target path');
      }

      const checkResponse = await session.fetch(targetUrl, { method: 'HEAD' });

      if (checkResponse.ok && targetUrl !== sourceUrl) {
        if (!window.confirm(`A file named "${fileName}" already exists in this folder. Do you want to replace it?`)) {
          return;
        }
        await deleteFile(targetUrl, { fetch: session.fetch });
      }

      const fileResponse = await session.fetch(sourceUrl);
      if (!fileResponse.ok) throw new Error('Failed to fetch source file');

      // Validate content type
      const contentType = fileResponse.headers.get('content-type');
      if (!validateContentType(contentType)) {
        throw new Error('Invalid content type');
      }

      const fileBlob = await fileResponse.blob();

      await saveFileInContainer(
        targetFolder.url,
        fileBlob,
        {
          slug: fileName,
          contentType: fileBlob.type,
          fetch: session.fetch
        }
      );

      await deleteFile(sourceUrl, { fetch: session.fetch });
      await onNavigate(currentFolder);
    } catch (error) {
      console.error("Error moving file:", error);
      alert("Error moving file: " + error.message);
    }
  }
};


const toggleSelection = (item, event) => {
  event.stopPropagation();
  setSelectedItems(prev => {
    const newSelection = new Set(prev);
    if (newSelection.has(item.url)) {
      newSelection.delete(item.url);
      if (newSelection.size === 0) {
        setIsSelectionMode(false);
      }
    } else {
      newSelection.add(item.url);
      setIsSelectionMode(true);
    }
    return newSelection;
  });
};

const handleSelectAll = () => {
  const allFiles = files.filter(file => !file.isFolder);

  if (selectedItems.size === allFiles.length) {
    setSelectedItems(new Set());
    setIsSelectionMode(false);
  } else {
    setSelectedItems(new Set(allFiles.map(file => file.url)));
    setIsSelectionMode(true);
  }
};

const handleBulkDelete = async () => {
  if (selectedItems.size === 0) return;

  const message = selectedItems.size === 1
    ? "Are you sure you want to delete this item?"
    : `Are you sure you want to delete these ${selectedItems.size} items?`;

  if (window.confirm(message)) {
    try {
      for (const url of selectedItems) {
        const item = files.find(f => f.url === url);
        await onDelete(url, item.isFolder);
      }
      setSelectedItems(new Set());
    } catch (error) {
      console.error("Bulk delete error:", error);
    }
  }
};

  // Folder management handlers
  const handleDelete = (item) => {
  const confirmMessage = item.isFolder
    ? "Are you sure you want to delete this folder and all its contents? This action cannot be undone."
    : "Are you sure you want to delete this file? This action cannot be undone.";

  if (window.confirm(confirmMessage)) {
    onDelete(item.url, item.isFolder);
    // Reset selection mode immediately after confirmation
    setIsSelectionMode(false);
    setSelectedItems(new Set());
  }
};

  const startRename = (item) => {
    setEditingItem(item);
    setNewFolderName(item.isFolder ? item.name.slice(0, -1) : item.name);
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (newFolderName && editingItem) {
      try {
        if (editingItem.isFolder) {
          await onRename(editingItem.url, newFolderName);
        } else {
          const progressTracker = createProgressTracker(setUploadProgress);
          await renameFile(
            editingItem.url,
            newFolderName,
            { fetch: getDefaultSession().fetch },
            progressTracker
          );
          await onNavigate(currentFolder);
        }
        setEditingItem(null);
        setNewFolderName('');
      } catch (error) {
        console.error("Error renaming item:", error);
        alert("Error renaming item: " + error.message);
      }
    }
  };

  const cancelRename = () => {
    setEditingItem(null);
    setNewFolderName('');
  };

 const handleCreateFolder = async (e) => {
  e.preventDefault();
  if (newFolderName.trim()) {
    try {
      const canWrite = await canUploadTo(currentFolder);
      if (!canWrite) {
        alert("You don't have permission to create folders here");
        return;
      }
      await onCreate(newFolderName.trim());
      setNewFolderName('');
      setNewFolderMode(false);
    } catch (error) {
      console.error("Folder creation error:", error);
      alert("Error creating folder: " + error.message);
    }
  }
};

  const handleFileView = async (fileUrl) => {
  const session = getDefaultSession();
  try {
    const response = await session.fetch(fileUrl);
    const content = await response.text();
    const contentType = response.headers.get('content-type');
    setViewingFile({
      url: fileUrl,
      content,
      type: contentType || 'text/plain'
    });
  } catch (error) {
    console.error("Error viewing file:", error);
  }
};

// Breadcrumb navigation
  const [dragOverBreadcrumb, setDragOverBreadcrumb] = useState(null);

  const renderBreadcrumbs = () => {
    if (!currentFolder || !podRoot) {
      return null;
    }

    const segments = currentFolder.replace(podRoot, '').split('/').filter(Boolean);

    const breadcrumbPaths = segments.reduce((acc, segment, index) => {
      const path = `${podRoot}${segments.slice(0, index + 1).join('/')}/`;
      acc.push({
        name: decodeURIComponent(segment),
        path: path
      });
      return acc;
    }, [{ name: 'Home', path: podRoot }]);

    // Theme-specific breadcrumbs styling
    const breadcrumbClasses = currentTheme === THEMES.NEXT
      ? "bg-next-gray border-b border-next-border py-1 px-2"
      : "bg-inrupt-light border-b border-gray-200 py-2 px-3"; 

    const pathDisplayClasses = currentTheme === THEMES.NEXT
      ? "flex items-center bg-next-white text-next-black border border-next-border px-1 py-0.5 text-xs whitespace-nowrap"
      : "flex items-center gap-1 font-inrupt-body text-inrupt-navy whitespace-nowrap text-sm";

    return (
      <div className={breadcrumbClasses}>
        <div className="flex items-center space-x-1 overflow-x-auto">
          {/* Theme-appropriate browser path display */}
          <div className={pathDisplayClasses}>
            {breadcrumbPaths.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <span className="mx-1">/</span>
                )}
                <span
                  className={`${
                    index === breadcrumbPaths.length - 1 
                      ? currentTheme === THEMES.NEXT ? 'font-bold' : 'font-semibold text-inrupt-blue'
                      : currentTheme === THEMES.NEXT ? 'hover:text-next-blue cursor-pointer' : 'hover:text-inrupt-accent cursor-pointer'
                  }`}
                  onClick={(e) => {
                    if (!isSelectionMode && index !== breadcrumbPaths.length - 1) {
                      handleFolderClick(e, crumb.path);
                    }
                  }}
                  onDragOver={(e) => {
                    if (!isSelectionMode) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      setDragOverBreadcrumb(crumb.path);
                    }
                  }}
                  onDragEnter={(e) => {
                    if (!isSelectionMode) {
                      e.preventDefault();
                      setDragOverBreadcrumb(crumb.path);
                    }
                  }}
                  onDragLeave={(e) => {
                    if (!isSelectionMode) {
                      e.preventDefault();
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        setDragOverBreadcrumb(null);
                      }
                    }
                  }}
                  onDrop={async (e) => {
                    if (!isSelectionMode) {
                      e.preventDefault();
                      setDragOverBreadcrumb(null);
                      const sourceUrl = e.dataTransfer.getData('text/plain');

                      if (sourceUrl) { // Only proceed if we have a source URL
                        const targetFolder = {
                          url: crumb.path,
                          isFolder: true
                        };

                        await handleDrop(e, targetFolder);
                      }
                    }
                  }}
                  style={{
                    background: dragOverBreadcrumb === crumb.path 
                      ? isNeXTTheme ? '#3399FF' : '#7c4dff' // Using solid-purple directly
                      : 'transparent',
                    color: dragOverBreadcrumb === crumb.path ? 'white' : ''
                  }}
                >
                  {crumb.name}
                </span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const displayError = error || authError;

    const { currentTheme } = useTheme();
  const classes = getThemeClasses(currentTheme);
  const isNeXTTheme = currentTheme === THEMES.NEXT;
  const logoToUse = isNeXTTheme ? nextLogo : solidLogo;
  
  return (
    <div className={classes.layout}>
      <div className={classes.container}>
        <div className={classes.window}>
          {/* Title Bar */}
          <div className={classes.titleBar}>
            <div className={classes.titleText}>{isNeXTTheme ? "Solid File Manager" : "Solid File Manager"}</div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 border border-gray-300 dark:border-next-border"></div>
              {isLoggedIn && (
                <button
                  onClick={onLogout}
                  className="text-next-white text-xs"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Menu Bar */}
          <div className={classes.menuBar}>
            <div className="flex items-center">
              <img src={logoToUse} alt="App Logo" className="h-6 mr-3" />
              <span className="font-bold text-white dark:text-next-white mr-6">
                NextFM
              </span>
              <div className="space-x-4 text-white dark:text-next-white text-sm">
                {currentTheme === THEMES.NEXT && (
                  <>
                    <span className={classes.menuItem}>File</span>
                    <span className={classes.menuItem}>Edit</span>
                    <span className={classes.menuItem}>View</span>
                    <span className={classes.menuItem}>Help</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-next-dark">
            {displayError && (
              <div className={classes.errorContainer}>
                <p className="text-sm">{displayError}</p>
              </div>
            )}

              {!isLoggedIn ? (
                <StationSelector onLogin={onLogin} />
              ) : needsStorage ? (
                <StorageFinder
                  onSubmit={setStorageLocation}
                  error={displayError}
                />
              ) : (
              <>
                <div className="mb-4 text-sm space-y-1">
                  <p className="flex items-center">
                    <span className={`${isNeXTTheme ? "text-next-white/50" : "text-solid-purple font-medium"} mr-2`}>User:</span> 
                    <span className={`font-mono text-xs truncate ${isNeXTTheme ? "text-next-white/80" : "text-inrupt-navy"}`}>{webId}</span>
                  </p>
                  <p className="flex items-center">
                    <span className={`${isNeXTTheme ? "text-next-white/50" : "text-solid-purple font-medium"} mr-2`}>Storage:</span> 
                    <span className={`font-mono text-xs truncate ${isNeXTTheme ? "text-next-white/80" : "text-inrupt-navy"}`}>{podRoot}</span>
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  {/* File upload section */}
                 <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        disabled={isSelectionMode}
                        className={`${classes.input} w-full py-1.5 px-3 text-sm ${
                          isSelectionMode ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      />
                    </div>
                    <button
                      onClick={handleUpload}
                      disabled={selectedFiles.length === 0 || isSelectionMode}
                      className={`${classes.buttonPrimary} flex items-center text-sm`}
                    >
                      <Upload className="mr-1 h-4 w-4" /> 
                      Upload {selectedFiles.length > 0 && `(${selectedFiles.length})`}
                    </button>
                    <button
                      onClick={() => !isSelectionMode && setNewFolderMode(true)}
                      disabled={isSelectionMode}
                      className={`${classes.button} flex items-center text-sm ${
                        isSelectionMode ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Plus className="mr-1 h-4 w-4" /> New Folder
                    </button>
                  </div>

                  {/* Upload progress */}
                  {Object.keys(uploadProgress).length > 0 && (
                    <BatchUploadProgress uploadProgress={uploadProgress} />
                  )}

                  {newFolderMode && (
                    <form onSubmit={handleCreateFolder} className="flex items-center gap-2 mt-2">
                      <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="Enter folder name"
                        className="next-input flex-1"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="next-button-primary text-sm"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewFolderMode(false);
                          setNewFolderName('');
                        }}
                        className="next-button text-sm"
                      >
                        Cancel
                      </button>
                    </form>
                  )}
                </div>

                {/* File Browser */}
                <div className={`${classes.panel} mb-4`}>
                  <div className={classes.titleBar}>
                    <div className={classes.titleText}>File Browser</div>
                  </div>
                  
                  {renderBreadcrumbs()}
                  
                  {!currentFolder ? (
                    <p className={currentTheme === THEMES.NEXT 
                      ? "text-next-blue text-sm py-2 px-3" 
                      : "text-solid-purple text-sm py-3 px-4 font-inrupt"}>
                      Loading...
                    </p>
                  ) : files.length === 0 ? (
                    <div className={currentTheme === THEMES.NEXT 
                      ? "bg-next-dark/50 p-6 text-center" 
                      : "bg-gray-50 p-8 text-center"}>
                      <p className={currentTheme === THEMES.NEXT 
                        ? "text-next-white/60 text-sm"
                        : "text-solid-purple font-inrupt"}>
                        This folder is empty
                      </p>
                    </div>
                  ) : (
                    <>
                      <ul className={classes.fileList}>
                        {files.map((item, index) => {
                          const isEditing = editingItem?.url === item.url;
                          const isSelected = selectedItems.has(item.url);
                          
                          return (
                            <li
                              key={index}
                              draggable={!item.isFolder && !isSelectionMode}
                              onDragStart={(e) => handleDragStart(e, item)}
                              onDragOver={(e) => handleDragOver(e, item)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, item)}
                              onContextMenu={(e) => handleContextMenu(e, item)}
                              className={`${classes.fileItem}
                                ${isSelected ? classes.selectedItem : ''}
                                ${dragOverItem === item.url ? 'bg-blue-100/50 dark:bg-next-blue/10 border border-blue-400 dark:border-next-blue/60' : ''}`}
                              onClick={(e) => {
                                // Only handle file/folder clicks if not in selection mode and not clicking checkbox
                                if (!isSelectionMode && !e.target.closest('.checkbox-container')) {
                                  handleItemClick(e, item);
                                }
                              }}
                            >
                              {isEditing ? (
                                <form onSubmit={handleRename} className="flex items-center w-full gap-2">
                                  <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    className="next-input flex-1"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <button
                                    type="submit"
                                    onClick={(e) => e.stopPropagation()}
                                    className="next-button-primary text-xs"
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cancelRename();
                                    }}
                                    className="next-button text-xs"
                                  >
                                    Cancel
                                  </button>
                                </form>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center min-w-0">
                                      {/* Only show checkbox if it's not a folder */}
                                      {!item.isFolder && (
                                        <div className="checkbox-container mr-1">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              toggleSelection(item, e);
                                            }}
                                            className="w-4 h-4 accent-next-blue cursor-pointer"
                                          />
                                        </div>
                                      )}

                                      {/* Theme-appropriate icon */}
                                      <div className={`w-5 h-5 flex items-center justify-center mr-2 border ${
                                        isNeXTTheme 
                                          ? `${item.isFolder ? 'bg-next-accent' : 'bg-next-white'} border-next-border` 
                                          : `${item.isFolder ? 'bg-solid-purple/10' : 'bg-white'} border-gray-300`
                                      }`}>
                                        {item.isFolder ? 
                                          <FolderIcon className={`h-3 w-3 ${isNeXTTheme ? 'text-next-black' : 'text-solid-purple'}`} /> : 
                                          <FileIcon className={`h-3 w-3 ${isNeXTTheme ? 'text-next-black' : 'text-inrupt-navy'}`} />
                                        }
                                      </div>
                                      
                                      <span className={`truncate text-sm ${
                                        isSelected 
                                          ? (isNeXTTheme ? 'text-next-white' : 'text-inrupt-navy') 
                                          : (isNeXTTheme ? 'text-next-white' : 'text-solid-purple')
                                      }`}>
                                        {item.name}
                                      </span>
                                      
                                      {dragOverItem === item.url && (
                                        <span className={`ml-2 text-xs ${isNeXTTheme ? 'text-next-blue' : 'text-solid-purple'}`}>
                                          Drop here
                                        </span>
                                      )}
                                    </div>

                                    {!isSelectionMode && (
                                      <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Permissions resourceUrl={item.url} />
                                        <AccessAwareFileActions
                                          item={item}
                                          onDelete={handleDelete}
                                          onRename={startRename}
                                          disableActions={isSelectionMode}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>

                      {/* Selection mode toolbar */}
                      {isSelectionMode && selectedItems.size > 0 && (
                        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 next-window px-4 py-2 flex items-center gap-3 z-50">
                          <button
                            onClick={handleSelectAll}
                            className="text-next-white hover:text-next-blue text-sm"
                          >
                            {selectedItems.size === files.filter(f => !f.isFolder).length ? "Deselect All" : "Select All"}
                          </button>

                          <div className="h-4 w-px bg-next-white/10"></div>

                          <span className="text-next-white/70 text-sm">
                            {selectedItems.size} selected
                          </span>

                          <div className="h-4 w-px bg-next-white/10"></div>

                          <button
                            onClick={() => {
                              setIsSelectionMode(false);
                              setSelectedItems(new Set());
                            }}
                            className="text-next-white/70 hover:text-next-white text-sm"
                          >
                            Cancel
                          </button>

                          <button
                            onClick={handleBulkDelete}
                            className="text-next-red hover:text-next-red/80 text-sm flex items-center"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          
          {/* Footer */}
          <footer className={classes.footer}>
            <div className="flex items-center">
              <ThemeSelector />
            </div>
          </footer>
        </div>
      </div>

      {viewingImage && (
        <ImageViewer
          url={viewingImage}
          onClose={() => setViewingImage(null)}
        />
      )}
      {viewingFile && (
        <FileViewer
          url={viewingFile.url}
          content={viewingFile.content}
          type={viewingFile.type}
          onClose={() => setViewingFile(null)}
        />
      )}
    </div>
  );
}

export default NextFM;