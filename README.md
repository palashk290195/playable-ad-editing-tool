# Phaser Ad Tool

## Overview
The Phaser Ad Tool is a specialized utility designed to streamline the asset management and build process for Phaser-based playable ads. It provides a visual interface for managing assets, previewing changes, and generating builds for different ad networks.

## Current Implementation Status

### Completed Features
1. Project Structure Scanner
   - Validates project folder structure
   - Identifies media files and their usage
   - Integrates with File System Access API

2. Asset Management UI
   - Grid view of all assets
   - Usage status indicators (In Use/Unused)
   - Basic file replacement functionality
   - Preview support for images and audio

3. Base64 Conversion
   - Single file conversion utility
   - Maintains export format compatibility
   - Automatic MIME type detection

### Known Issues & Limitations
1. Asset Detection Logic
   - **Current Issue**: We're scanning preloader.js for imports, but these are already base64-encoded JS files
   - **Needed Change**: Should scan public/assets folder first, then map to media/*.js files
   - **Impact**: Currently showing incorrect usage status for some assets

2. File Naming Convention
   - **Current Issue**: Base64 encoder naming logic isn't properly synced with asset replacement
   - **Fix Required**: Implement consistent naming strategy across original assets and converted files

3. Preview Functionality
   - **Current Issue**: Some previews don't load correctly
   - **Fix Required**: Improve preview generation and caching

## Project Structure

### Core Files
```
/src
  /components
    AssetViewer.jsx         # Main asset grid display component
  /utils
    projectScanner.js       # Project structure analysis
    base64Converter.js      # File conversion utilities
  App.jsx                   # Main application component
```

### Key Components Description

#### projectScanner.js
- Scans project structure
- Validates required folders
- Maps relationships between original assets and converted files
- **TODO**: Refactor to scan public/assets first

#### base64Converter.js
- Handles single file Base64 conversion
- Manages file writing
- Maintains naming conventions
- **TODO**: Add backup functionality

#### AssetViewer.jsx
- Displays asset grid
- Handles file replacement UI
- Shows preview and status
- **TODO**: Improve error handling

## Implementation Guide for Next Steps

### Phase 1: Asset Scanner Refactor
1. Create new scanner implementation
   ```javascript
   /src/utils/assetScanner.js
   - Scan public/assets folder
   - Map to media/*.js files
   - Generate usage status based on preloader.js imports
   ```

2. File Mapping Logic
   ```javascript
   {
     originalAsset: {
       path: 'public/assets/image.png',
       convertedPath: 'media/image.png.js',
       inUse: boolean,
       type: 'image'
     }
   }
   ```

### Phase 2: Preview System
1. Implement preview server
   - Add npm run dev iframe
   - Handle device simulation
   - Add rotation controls

2. Build System Integration
   - Add build command interface
   - Network selection
   - Progress tracking

### Phase 3: Asset Management Enhancement
1. Backup System
   - Version tracking
   - Rollback capability
   - Asset history

2. Batch Operations
   - Multiple file replacement
   - Bulk status update

## Technical Requirements

### File System Structure
```
project/
  ├── public/
  │   └── assets/
  │       ├── images/
  │       └── audio/
  ├── media/
  │   └── *.js (base64 files)
  └── src/
      └── scenes/
          └── preloader.js
```

### Asset Processing Flow
1. Original Asset Location
   - All original assets must be in public/assets
   - Maintain folder structure (images, audio)

2. Conversion Process
   - Scan original assets
   - Generate Base64 JS files
   - Update preloader.js imports if needed

3. Validation
   - File type checking
   - Size limitations
   - Format compatibility

## Implementation Priorities
1. Fix asset scanning logic (HIGH)
2. Improve preview system (MEDIUM)
3. Add backup functionality (LOW)

## Development Guidelines
1. Error Handling
   - All file operations should have try/catch
   - User-friendly error messages
   - Detailed console logging

2. Performance
   - Lazy load previews
   - Cache file readings
   - Optimize Base64 conversion

3. Code Structure
   - Keep components focused
   - Extract common utilities
   - Document complex logic

## Future Considerations
1. Multi-project support
2. Cloud storage integration
3. Collaborative features
4. Build automation
5. Asset optimization

## Testing Requirements
1. File System Operations
   - Test all file operations
   - Handle permission errors
   - Validate file types

2. UI/UX
   - Test responsive layout
   - Verify preview functionality
   - Check error states

3. Build Process
   - Verify network builds
   - Test configuration changes
   - Validate output

## Notes for Junior Developers
1. Start with the asset scanner refactor
2. Use provided utility functions
3. Maintain error handling patterns
4. Follow existing component structure
5. Test thoroughly before committing

## Questions and Support
Contact [Senior Developer Name] for:
- Architecture decisions
- Complex implementations
- Code review
- Technical blockers