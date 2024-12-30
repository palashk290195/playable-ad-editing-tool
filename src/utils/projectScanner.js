// src/utils/projectScanner.js

/**
 * Get base64 filename from original asset
 */
function getBase64Filename(originalPath) {
    // Remove public/assets/ prefix
    const cleanPath = originalPath.replace('public/assets/', '');
    // Replace directory separators with underscores
    return cleanPath.replace(/[\\/]/g, '_') + '.js';
  }
  
  /**
   * Get camelCase export name from filename
   */
  function getExportName(filename) {
    const name = filename.split('.')[0]
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/[^\w\d]/g, '');
    const ext = filename.split('.').pop().toUpperCase();
    return `${name}${ext}`;
  }
  
  /**
   * Scans a directory and returns all files recursively
   */
  async function scanDirectory(dirHandle, path = '') {
    const files = [];
    for await (const entry of dirHandle.values()) {
      const entryPath = path ? `${path}/${entry.name}` : entry.name;
      
      if (entry.kind === 'file') {
        files.push({
          name: entry.name,
          path: entryPath,
          handle: entry,
          type: getFileType(entry.name)
        });
      } else if (entry.kind === 'directory') {
        files.push(...await scanDirectory(entry, entryPath));
      }
    }
    return files;
  }
  
  /**
   * Gets the type of file based on extension
   */
  function getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];
    const audioExts = ['mp3', 'wav', 'ogg'];
    
    if (imageExts.includes(ext)) return 'image';
    if (audioExts.includes(ext)) return 'audio';
    return 'other';
  }
  
  /**
   * Extracts import statements from preloader.js
   */
  async function getPreloaderImports(fileHandle) {
    const file = await fileHandle.getFile();
    const content = await file.text();
    
    // Match both import types (direct and LoadBase64Audio)
    const imports = [];
    
    // Match regular imports
    const importRegex = /import\s*{\s*([^}]+)}\s*from\s*['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const variables = match[1].split(',').map(v => v.trim());
      const path = match[2];
      
      variables.forEach(variable => {
        imports.push({
          variable: variable,
          path: path,
          type: 'direct'
        });
      });
    }
    
    // Match LoadBase64Audio calls
    const audioRegex = /LoadBase64Audio\([^{]*{([^}]+)}/g;
    const audioEntryRegex = /{\s*key:\s*['"]([^'"]+)['"]\s*,\s*data:\s*([^,}\s]+)\s*}/g;
    
    while ((match = audioRegex.exec(content)) !== null) {
      const audioContent = match[1];
      let audioMatch;
      
      while ((audioMatch = audioEntryRegex.exec(audioContent)) !== null) {
        imports.push({
          key: audioMatch[1],
          variable: audioMatch[2],
          type: 'audio'
        });
      }
    }
    
    return imports;
  }
  
  /**
   * Main function to scan project and return asset information
   */
  export async function scanProject(projectHandle) {
    try {
      // Get directory handles
      const publicHandle = await projectHandle.getDirectoryHandle('public');
      const assetsHandle = await publicHandle.getDirectoryHandle('assets');
      const mediaHandle = await projectHandle.getDirectoryHandle('media');
      const srcHandle = await projectHandle.getDirectoryHandle('src');
      const scenesHandle = await srcHandle.getDirectoryHandle('scenes');
      const preloaderHandle = await scenesHandle.getFileHandle('preloader.js');
  
      // Scan directories
      const originalAssets = await scanDirectory(assetsHandle);
      const preloaderImports = await getPreloaderImports(preloaderHandle);
      
      // Create map of base64 files
      const mediaFiles = await scanDirectory(mediaHandle);
      const base64Map = new Map(mediaFiles.map(file => [file.path, file]));
  
      // Map original assets to their base64 versions and usage status
      const mappedAssets = originalAssets.map(asset => {
        const expectedBase64Path = getBase64Filename(asset.path);
        const expectedExportName = getExportName(asset.name);
        
        // Check if base64 version exists
        const base64File = base64Map.get(expectedBase64Path);
        
        // Check if it's being used in preloader
        const isUsed = preloaderImports.some(imp => {
          if (imp.type === 'audio') {
            return imp.key === asset.name.split('.')[0] || imp.variable === expectedExportName;
          }
          return imp.variable === expectedExportName;
        });
  
        return {
          ...asset,
          base64File: base64File || null,
          expectedBase64Path,
          expectedExportName,
          inUse: isUsed,
          hasBase64: !!base64File
        };
      });
  
      return {
        assets: mappedAssets,
        mediaHandle,
        assetsHandle
      };
    } catch (error) {
      console.error('Error scanning project:', error);
      throw error;
    }
  }