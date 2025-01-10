// server/controllers/buildController.js
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const buildAd = async (req, res) => {
  const { network, buildType, configPath, projectName, adRootPath } = req.body;

  // Validate required fields
  if (!network || !buildType || !configPath || !projectName || !adRootPath) {
    return res.status(400).json({ 
      error: 'Missing required fields: network, buildType, configPath, projectName, adRootPath' 
    });
  }

  try {
    // Get the root directory (where server and vite configs are)
    const rootDir = process.cwd();
    // Project directory is the ad root path directly
    const projectDir = adRootPath;
    
    console.log('Root directory:', rootDir);
    console.log('Project directory:', projectDir);
    console.log('Config path:', configPath);

    // Get absolute paths - config is in root, output is in project
    const absoluteConfigPath = path.resolve(rootDir, configPath);
    const outDir = buildType === 'split' ? 'dist-split' : 'dist-inline';
    const absoluteOutDir = path.resolve(projectDir, outDir);

    // Ensure project directory exists
    if (!fs.existsSync(projectDir)) {
      throw new Error(`Project directory not found: ${projectDir}`);
    }

    // Ensure config exists
    if (!fs.existsSync(absoluteConfigPath)) {
      throw new Error(`Vite config not found: ${absoluteConfigPath}`);
    }

    console.log(`Starting build for ${network} (${buildType})`);
    console.log(`Using config: ${absoluteConfigPath}`);
    console.log(`Output directory: ${absoluteOutDir}`);

    // Clean up existing output directory
    if (fs.existsSync(absoluteOutDir)) {
      await fs.remove(absoluteOutDir);
    }

    try {
      // Change to project directory for the build
      const originalCwd = process.cwd();
      process.chdir(projectDir);
      console.log('Changed working directory to:', projectDir);

      // Run Vite build with absolute config path
      execSync(`vite build --config ${absoluteConfigPath}`, {
        stdio: 'inherit',
        env: {
          ...process.env,
          NETWORK: network,
          BUILD_TYPE: buildType,
          PROJECT_DIR: projectDir,
          AD_ROOT_PATH: adRootPath
        }
      });

      // Change back to root directory
      process.chdir(originalCwd);

      // Verify build output exists
      if (!fs.existsSync(absoluteOutDir)) {
        throw new Error('Build failed: Output directory not created');
      }

      // Send success response
      res.status(200).json({ 
        success: true,
        message: `Build completed for ${network}`,
        outDir: absoluteOutDir
      });

    } catch (buildError) {
      console.error('Build execution failed:', buildError);
      throw new Error(`Build execution failed: ${buildError.message}`);
    }

  } catch (error) {
    console.error('Build error:', error);
    
    // Send error response
    res.status(500).json({ 
      error: `Build failed: ${error.message}`,
      details: error.stack
    });
  }
};