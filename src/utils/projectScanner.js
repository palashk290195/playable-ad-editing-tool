// src/utils/projectScanner.js

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
  
  function getBase64Filename(originalPath) {
    return originalPath
      .replace('public/assets/', '')
      .replace(/[\\/]/g, '_') + '.js';
  }
  
  function getExportName(filename) {
    const name = filename.split('.')[0]
      .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
      .replace(/[^\w\d]/g, '');
    const ext = filename.split('.').pop().toUpperCase();
    return `${name}${ext}`;
  }
  
  async function analyzePreloader(fileHandle) {
    const file = await fileHandle.getFile();
    const content = await file.text();
    
    const imports = new Map();
    const usedAudioVariables = new Set();
  
    // First pass: collect all non-commented imports
    const importLines = content.split('\n')
      .filter(line => !line.trim().startsWith('//') && !line.trim().startsWith('/*'))
      .join('\n');
  
    // Match import statements
    const importRegex = /import\s*{\s*([^}]+)}\s*from\s*['"]([^'"]+)['"]/g;
    let importMatch;
    
    while ((importMatch = importRegex.exec(importLines)) !== null) {
      const variables = importMatch[1].split(',').map(v => v.trim());
      const path = importMatch[2];
      
      variables.forEach(variable => {
        imports.set(variable, {
          path,
          type: path.includes('audio_') ? 'audio' : 'other',
          used: false
        });
      });
    }
  
    // Find LoadBase64Audio usage
    const audioLoaderRegex = /LoadBase64Audio\s*\([^,]+,\s*\[\s*((?:\{[^}]+\},?\s*)+)\]\s*\)/s;
    const audioLoaderMatch = audioLoaderRegex.exec(content);
    if (audioLoaderMatch) {
      const audioContent = audioLoaderMatch[1];
      const audioEntries = audioContent.matchAll(/{\s*key:\s*['"]([^'"]+)['"]\s*,\s*data:\s*([^,}\s]+)\s*}/g);
      
      for (const match of audioEntries) {
        const variable = match[2].trim();
        usedAudioVariables.add(variable);
        console.log('Found used audio variable:', variable);
      }
    }
  
    // Find image loading usage
    const imageLoads = content.matchAll(/this\.load\.(image|atlas)\(['"][^'"]+['"],\s*([^,\s)]+)/g);
    for (const match of imageLoads) {
      const variable = match[2].trim();
      if (imports.has(variable)) {
        imports.get(variable).used = true;
      }
    }
  
    // Mark audio variables as used
    for (const variable of usedAudioVariables) {
      if (imports.has(variable)) {
        const importInfo = imports.get(variable);
        importInfo.used = true;
        importInfo.type = 'audio';
        console.log('Marking audio as used:', variable);
      }
    }
  
    return {
      imports: Array.from(imports.entries()).map(([exportName, info]) => ({
        exportName,
        ...info,
      })),
      usedAudioVariables: Array.from(usedAudioVariables)
    };
  }
  
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
  
  export async function scanProject(projectContext) {
    try {
      const dirHandle = projectContext.handle;
      
      // Get directory handles
      const publicHandle = await dirHandle.getDirectoryHandle('public');
      const assetsHandle = await publicHandle.getDirectoryHandle('assets');
      const mediaHandle = await dirHandle.getDirectoryHandle('media');
      const srcHandle = await dirHandle.getDirectoryHandle('src');
      const scenesHandle = await srcHandle.getDirectoryHandle('scenes');
      const preloaderHandle = await scenesHandle.getFileHandle('preloader.js');
  
      // Analyze preloader.js
      const { imports, usedAudioVariables } = await analyzePreloader(preloaderHandle);
      console.log('Preloader analysis:', { imports, usedAudioVariables });
  
      // Create maps for quick lookup
      const activeImports = new Map(imports.map(imp => [imp.exportName, imp]));
      const mediaFiles = await scanDirectory(mediaHandle);
      const base64Map = new Map(mediaFiles.map(file => [file.path, file]));
  
      // Scan original assets
      const originalAssets = await scanDirectory(assetsHandle);
  
      // Map assets with usage information
      const mappedAssets = originalAssets.map(asset => {
        const expectedBase64Path = getBase64Filename(asset.path);
        const expectedExportName = getExportName(asset.name);
        const base64File = base64Map.get(expectedBase64Path);
        const importInfo = activeImports.get(expectedExportName);
  
        // Override type if it's a known audio file
        const type = importInfo?.type === 'audio' ? 'audio' : asset.type;
        
        // Determine if the asset is used
        const isUsed = importInfo?.used || false;
  
        return {
          ...asset,
          type,
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