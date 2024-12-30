// src/utils/base64Converter.js

/**
 * Process file replacement
 */
export async function processFileReplacement(originalAsset, newFile, mediaHandle, assetsHandle) {
    try {
      console.log('Starting file replacement process');
      console.log('Original asset:', originalAsset);
      
      // Use the expected export name from the original asset
      const expectedExportName = originalAsset.expectedExportName;
      console.log('Using export name:', expectedExportName);
      
      // Generate base64 export content using the expected name
      const base64Result = await convertToBase64Export(newFile, expectedExportName);
      console.log('Base64 conversion completed', base64Result);
      
      // Get the expected JS filename (maintain original naming convention)
      const jsFilename = originalAsset.expectedBase64Path;
      console.log('Target JS filename:', jsFilename);
      
      // Write the new base64 file
      try {
        const fileHandle = await mediaHandle.getFileHandle(jsFilename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(base64Result.exportContent);
        await writable.close();
        console.log('Base64 file written successfully');
      } catch (writeError) {
        console.error('Error writing base64 file:', writeError);
        throw new Error(`Failed to write base64 file: ${writeError.message}`);
      }
  
      // Update the original file in public/assets
      try {
        // Split the path into segments
        const pathSegments = originalAsset.path.split('/');
        let currentHandle = assetsHandle;
  
        // Navigate through the path (create directories if needed)
        for (let i = 0; i < pathSegments.length - 1; i++) {
          const segment = pathSegments[i];
          if (segment) {
            currentHandle = await currentHandle.getDirectoryHandle(segment, { create: true });
          }
        }
  
        // Write the new file
        const newAssetHandle = await currentHandle.getFileHandle(pathSegments[pathSegments.length - 1], { create: true });
        const assetWritable = await newAssetHandle.createWritable();
        await assetWritable.write(newFile);
        await assetWritable.close();
        console.log('Original asset updated in public/assets');
      } catch (assetError) {
        console.error('Error updating original asset:', assetError);
        throw new Error(`Failed to update original asset: ${assetError.message}`);
      }
  
      return {
        success: true,
        filename: jsFilename,
        exportName: expectedExportName
      };
    } catch (error) {
      console.error('File replacement error:', error);
      throw error;
    }
  }
  
  /**
   * Convert file to Base64 and generate JS export
   */
  export async function convertToBase64Export(file, exportName) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const mimeType = getMimeType(file.name);
      
      reader.onload = () => {
        try {
          const base64Data = reader.result.split(',')[1];
          
          // Use the provided export name instead of generating one
          const exportContent = 
            `export const ${exportName} = "data:${mimeType};base64,${base64Data}";`;
          
          console.log('Using export name:', exportName);
          
          resolve({
            exportContent,
            exportName,
            mimeType,
            originalName: file.name
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Get MIME type based on file extension
   */
  function getMimeType(filename) {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
  
  /**
   * Validate file replacement
   */
  export function validateReplacement(originalFile, newFile) {
    const getFileCategory = (file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
      if (['mp3', 'wav'].includes(ext)) return 'audio';
      return 'other';
    };
  
    const originalCategory = getFileCategory(originalFile);
    const newCategory = getFileCategory(newFile);
  
    if (originalCategory !== newCategory) {
      throw new Error(`File type mismatch. Expected ${originalCategory} file, got ${newCategory} file.`);
    }
  
    return true;
  }