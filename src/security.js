const SECURITY_CONSTANTS = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  MAX_TOTAL_UPLOAD_SIZE: 500 * 1024 * 1024, // 500MB
  ALLOWED_FILE_TYPES: {
    'image/jpeg': '.jpg,.jpeg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'text/plain': '.txt,.acl',
    'text/markdown': '.md',
    'text/csv': '.csv',
    'application/json': '.json',
    'text/html': '.html',
    'text/javascript': '.js',
    'text/css': '.css',
    'application/pdf': '.pdf'
  },
  FOLDER_NAME_MAX_LENGTH: 255,
  FOLDER_NAME_REGEX: /^[a-zA-Z0-9-_. ]+$/,
  MAX_PATH_LENGTH: 4096
};


const validateFile = (file) => {
  const errors = [];

  if (file.size > SECURITY_CONSTANTS.MAX_FILE_SIZE) {
    errors.push(`File size exceeds ${SECURITY_CONSTANTS.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  const isAllowedType = Object.keys(SECURITY_CONSTANTS.ALLOWED_FILE_TYPES).includes(file.type);
  if (!isAllowedType) {
    errors.push('File type not allowed');
  }

  if (!validateFileName(file.name)) {
    errors.push('Invalid file name');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateFileName = (fileName) => {
  const sanitizedName = fileName.replace(/^.*[/\\]/, '');
  const validNameRegex = /^[a-zA-Z0-9-_. %^]+$/;

  if (!validNameRegex.test(sanitizedName)) {
    return false;
  }

  if (sanitizedName.length > 255) {
    return false;
  }

  return true;
};

const validateFolderName = (folderName) => {
  if (!folderName || typeof folderName !== 'string') {
    return {
      isValid: false,
      error: 'Invalid folder name'
    };
  }

  const sanitizedName = folderName.replace(/^.*[/\\]/, '');

  if (!SECURITY_CONSTANTS.FOLDER_NAME_REGEX.test(sanitizedName)) {
    return {
      isValid: false,
      error: 'Folder name contains invalid characters'
    };
  }

  if (sanitizedName.length > SECURITY_CONSTANTS.FOLDER_NAME_MAX_LENGTH) {
    return {
      isValid: false,
      error: 'Folder name is too long'
    };
  }

  return {
    isValid: true,
    sanitizedName
  };
};

const validatePath = (path) => {
  if (!path || typeof path !== 'string') {
    return {
      isValid: false,
      error: 'Invalid path'
    };
  }

  if (path.includes('../') || path.includes('..\\')) {
    return {
      isValid: false,
      error: 'Invalid path'
    };
  }

  if (path.length > SECURITY_CONSTANTS.MAX_PATH_LENGTH) {
    return {
      isValid: false,
      error: 'Path is too long'
    };
  }

  return {
    isValid: true,
    sanitizedPath: path
  };
};

const validateContentType = (contentType) => {
  return Object.keys(SECURITY_CONSTANTS.ALLOWED_FILE_TYPES).includes(contentType);
};

const validateBatchUpload = (files) => {
  let totalSize = 0;
  const errors = [];

  for (const file of files) {
    totalSize += file.size;
    const validation = validateFile(file);
    if (!validation.isValid) {
      errors.push(`${file.name}: ${validation.errors.join(', ')}`);
    }
  }

  if (totalSize > SECURITY_CONSTANTS.MAX_TOTAL_UPLOAD_SIZE) {
    errors.push(`Total upload size exceeds ${SECURITY_CONSTANTS.MAX_TOTAL_UPLOAD_SIZE / 1024 / 1024}MB limit`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export {
  SECURITY_CONSTANTS,
  validateFile,
  validateFileName,
  validateFolderName,
  validatePath,
  validateContentType,
  validateBatchUpload
};
