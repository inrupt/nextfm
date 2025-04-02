# Solid File Manager (Solid-FM)

A file manager for Solid pods with support for multiple visual themes.

## About

Solid-FM is a file manager for Solid pods that allows users to browse, upload, download, and manage their files in their Solid pod storage. It supports various file operations and provides a visual interface for interacting with Solid storage.

## Features

- Authentication with Solid identity providers
- Browse files and folders
- Upload and download files
- Create, rename, and delete folders
- Move files between folders
- View images and text/code files
- Multiple selection mode
- Drag and drop file moving
- Multiple theme support (Default and NeXT)

## Themes

Solid-FM supports multiple visual themes:

1. **Default Theme** - Clean, modern interface with rounded corners and a light color scheme
2. **NeXT Theme** - A retro theme inspired by the NeXTSTEP operating system that Tim Berners-Lee used when creating the World Wide Web

### Using Themes

You can switch between themes using the theme selector in the top-right corner of the application.

### Adding New Themes

Developers can add new themes by:

1. Adding the theme name to the `THEMES` object in `src/themes/themeContext.js`
2. Adding theme classes to `src/themes/themeStyles.js`
3. Updating the theme selector component in `src/components/ThemeSelector.js`

## Development

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/solid-fm.git
cd solid-fm

# Install dependencies
npm install

# Start the development server
npm start
```

## Building for Production

```bash
npm run build
```

## License

MIT License