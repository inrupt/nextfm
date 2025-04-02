# Changelog

## [0.9.10-alpha] - 2025-03-20

### Changed
- Dependency updates:
  - tailwindcss to 3.4.17
  - @adobe/css-tools to 4.4.2

## [0.9.9-alpha] - 2025-03-20

### Fixed
- ESLint warnings in StorageFinder.js and authentication.js

### Security
- Updated dependencies to latest:
  - autoprefixer to 10.4.21
  - prism-react-renderer to 2.4.1
  - postcss to 8.5.3
  - lucide-react to 0.483.0
  - web-vitals to 4.2.4
  - Updated all testing libraries to latest versions

## [0.9.8-alpha] - 2024-12-19

### Added
- File renaming support for all file types
- .acl file support in allowed file types
- File rename progress tracking and feedback

### Fixed
- File rename functionality error handling
- File content type validation for uploads

## [0.9.7-alpha] - 2024-12-16

### Fixed
- Storage URL discovery for demo IDP
- Improved 401 error handling
- Storage access permission checks

## [0.9.6-alpha] - 2024-12-10

### Changed
- Manual IDP URL entry option replaced set identity provider

### Security
- Fixed infinite loop vulnerability in nanoid package
- Addressed ReDoS vulnerability in path-to-regexp package
- Updated express dependencies to patch security issues

## [0.9.5-alpha] - 2024-11-27

### Changed
- Redesigned auth for IDP selection using retro buttons
- Revised regex for file upload

## [0.9.4-alpha] - 2024-11-18

### Security
- Updated vulnerable dependencies:
  - serialize-javascript to ^6.0.2
  - rollup to ^3.29.5
  - axe-core to ^4.8.5
  - webpack to ^5.89.0
  - @babel/traverse to ^7.23.2

### Fixed
- Missing Release of Resource after Effective Lifetime
- serialize-javascript XSS vulnerability
- rollup XSS vulnerability

## [0.9.3-alpha] - 2024-11-18

### Added
- Automatic pod discovery during authentication
- Multiple pod support with visual pod selector
- Improved permissions dialog with resource URL display

### Changed
- Enhanced storage location workflow with auto-discovery
- Streamlined authentication process
- Improved permissions UI with better visibility of resource locations

### Fixed
- Manual storage URL entry validation
- Storage URL discovery edge cases
- Permissions dialog rendering

## [0.9.2-alpha] - 2024-11-05

### Fixed
- Resolved package dependency conflicts with postcss
- Updated vulnerable dependencies:
  - serialize-javascript to ^6.0.2
  - rollup to ^3.29.5
  - axe-core to ^4.8.5
  - webpack to ^5.89.0
  - @babel/traverse to ^7.23.2

### Security
- Missing Release of Resource after Effective Lifetime
- Cross-site Scripting (XSS) vulnerability in serialize-javascript
- Cross-site Scripting (XSS) vulnerability in rollup
- MPL-2.0 license requirements
