// server/controllers/buildController.js
import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const buildAd = async (req, res) => {
  const { network, buildType, configPath, projectName } = req.body;

  // Validate required fields
  if (!network || !buildType || !configPath || !projectName) {
    return res.status(400).json({ 
      error: 'Missing required fields: network, buildType, configPath, projectName' 
    });
  }

  try {
    // Use the project name directly as the path since we're already in the correct directory
    const projectPath = projectName;
    console.log('Project path:', projectPath);

    // Verify project directory exists
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project directory not found: ${projectPath}`);
    }

    // Get absolute paths
    const absoluteConfigPath = path.join(projectPath, configPath);
    const outDir = buildType === 'split' ? 'dist-split' : 'dist-inline';
    const absoluteOutDir = path.join(projectPath, outDir);

    // Ensure config exists
    if (!fs.existsSync(absoluteConfigPath)) {
      throw new Error(`Vite config not found: ${absoluteConfigPath}`);
    }

    console.log(`Starting build for ${network} (${buildType})`);
    console.log(`Project directory: ${projectPath}`);
    console.log(`Using config: ${absoluteConfigPath}`);
    console.log(`Output directory: ${absoluteOutDir}`);

    // Clean up existing output directory
    if (fs.existsSync(absoluteOutDir)) {
      await fs.remove(absoluteOutDir);
    }

    try {
      // Change to project directory
      const originalCwd = process.cwd();
      process.chdir(projectPath);
      console.log('Changed working directory to:', projectPath);

      // Run Vite build
      execSync(`vite build --config ${configPath}`, {
        stdio: 'inherit',
        env: {
          ...process.env,
          NETWORK: network,
          BUILD_TYPE: buildType
        }
      });

      // Change back to original directory
      process.chdir(originalCwd);
      console.log('Restored working directory to:', originalCwd);

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