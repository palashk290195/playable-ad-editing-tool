// src/services/buildService.js

/**
 * Update the ad project's config.js with network-specific settings
 */
async function updateConfig(projectHandle, network, adRootPath) {
    try {
      // Get original config from the ad root path
      const configPath = `${adRootPath}/src/config.js`;
      const configFile = await fetch(`file://${configPath}`).then(res => res.text());

      // Extract existing store links
      const googlePlayStoreLinkMatch = configFile.match(/googlePlayStoreLink:\s*"(.*?)"/);
      const appleStoreLinkMatch = configFile.match(/appleStoreLink:\s*"(.*?)"/);

      const googlePlayStoreLink = googlePlayStoreLinkMatch ? googlePlayStoreLinkMatch[1] : '';
      const appleStoreLink = appleStoreLinkMatch ? appleStoreLinkMatch[1] : '';

      // Create new config content
      const configContent = `
        export const config = {
          adNetworkType: "${network}",
          googlePlayStoreLink: "${googlePlayStoreLink}",
          appleStoreLink: "${appleStoreLink}",
        };
      `;

      // Write updated config
      const srcHandle = await projectHandle.getDirectoryHandle('src', { create: true });
      const configHandle = await srcHandle.getFileHandle('config.js', { create: true });
      const writable = await configHandle.createWritable();
      await writable.write(configContent);
      await writable.close();

    } catch (error) {
      console.error('Config update failed:', error);
      throw new Error(`Failed to update config: ${error.message}`);
    }
}

/**
 * Ensure required build directories exist
 */
async function setupBuildDirectories(projectHandle, buildName) {
    try {
      // Create temp directory if it doesn't exist
      const tempHandle = await projectHandle.getDirectoryHandle('temp', { create: true });
      
      // Create playable-ad-builds directory
      const buildsHandle = await tempHandle.getDirectoryHandle('playable-ad-builds', { create: true });
      
      // Create build-specific directory
      const buildHandle = await buildsHandle.getDirectoryHandle(buildName, { create: true });
      
      return buildHandle;
    } catch (error) {
      console.error('Failed to setup build directories:', error);
      throw new Error(`Failed to setup build directories: ${error.message}`);
    }
}

/**
 * Move build output to final location
 */
async function moveBuildOutput(projectHandle, network, buildName, buildType) {
    try {
      const sourceDir = buildType === 'split' ? 'dist-split' : 'dist-inline';
      const buildHandle = await setupBuildDirectories(projectHandle, buildName);

      // Get source directory
      const sourceDirHandle = await projectHandle.getDirectoryHandle(sourceDir);
      
      // Move directory contents
      for await (const entry of sourceDirHandle.values()) {
        if (entry.kind === 'file' && entry.name.endsWith('.zip')) {
          const sourceFile = await entry.getFile();
          const newHandle = await buildHandle.getFileHandle(`${network}.zip`, { create: true });
          const writable = await newHandle.createWritable();
          await writable.write(await sourceFile.arrayBuffer());
          await writable.close();
        }
      }

      // Cleanup source directory
      await projectHandle.removeEntry(sourceDir, { recursive: true });

    } catch (error) {
      console.error('Failed to move build output:', error);
      throw new Error(`Failed to move build output: ${error.message}`);
    }
}

/**
 * Main build function
 */
export async function buildForNetwork(projectContext, network, buildName) {
    console.log(`Starting build for ${network} (${buildName})`);
    
    try {
      // Get the project directory handle and ad root path
      const dirHandle = projectContext.handle;
      const adRootPath = projectContext.adRootPath;
      
      if (!adRootPath) {
        throw new Error('Ad root path is not specified');
      }

      // Update config.js with network settings
      await updateConfig(dirHandle, network, adRootPath);

      // Determine build type and config path
      const isMeta = network === 'meta';
      const configPath = `vite/config-${isMeta ? 'zip' : 'inline'}.prod.mjs`;
      
      // Send build request to backend
      const response = await fetch('/api/build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          network,
          buildType: isMeta ? 'split' : 'inline',
          configPath,
          projectName: dirHandle.name,
          adRootPath
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Build request failed: ${response.statusText}`);
      }

      // Move build output to final location
      await moveBuildOutput(dirHandle, network, buildName, isMeta ? 'split' : 'inline');

      console.log(`Build completed for ${network}`);
      
    } catch (error) {
      console.error(`Build failed for ${network}:`, error);
      throw new Error(`Failed to build ${network}: ${error.message}`);
    }
}