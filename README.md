# NextFM File Manager

A file manager for Solid pods with support for multiple visual themes, inspired by Tim Berners-Lee.

## About

NextFM is a file manager for Solid pods that allows users to browse, upload, download, and manage their files in their Solid pod storage. It supports various file operations and provides a visual interface for interacting with Solid storage.

## Features

- Authentication with Solid identity providers
- Browse files and folders
- Upload and download files
- Create, rename, and delete folders
- Move files between folders
- View images and text/code files
- Multiple selection mode
- Drag and drop file moving
- Multiple theme support (Default, NeXT, and Winamp skins)

## Themes

NextFM supports multiple visual themes:

1. **Default Theme** - Clean, modern interface with rounded corners and a light color scheme
2. **NeXT Theme** - A retro theme inspired by the NeXTSTEP operating system that Tim Berners-Lee used when creating the World Wide Web
3. **Winamp Skins** - Import and use classic Winamp skins (.wsz files) to customize the interface

### Using Themes

You can switch between themes using the theme selector in the top-right corner of the application.

### Using Winamp Skins

NextFM supports importing and using classic Winamp skins:

1. Click the "Import Winamp Skin" button next to the theme selector
2. Select a Winamp skin file (.wsz format)
3. The skin will be processed and applied to the interface automatically
4. Imported skins are saved in your browser's localStorage and will appear in the theme dropdown for future use

Winamp skins are analyzed to extract color information which is then applied to NextFM's interface elements. This provides a nostalgic look inspired by the classic media player.

#### Finding Winamp Skins

You can find classic Winamp skins at these resources:

- [Winamp Skin Museum](https://skins.webamp.org/) - Browse and download thousands of classic Winamp skins
- [Internet Archive's Winamp Skin Collection](https://archive.org/details/winampskins)
- [DeviantArt Winamp Skin Collection](https://www.deviantart.com/tag/winampskin)

#### Technical Notes

- Winamp skin support works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Skins are stored in your browser's localStorage, so they persist across sessions
- The feature uses JSZip to extract and analyze the .wsz files client-side
- Only the color information is extracted; the specific UI elements of Winamp are not reproduced
- Memory usage is minimal as only the color data is stored, not the entire skin

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
git clone https://github.com/inrupt/nextfm.git
cd nextfm

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