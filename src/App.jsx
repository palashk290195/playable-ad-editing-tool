// src/App.jsx
import { useState } from 'react';
import { 
  Box, 
  ThemeProvider, 
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Paper,
  Alert,
  Divider,
  Grid
} from '@mui/material';
import AssetViewer from './components/AssetViewer';
import PreviewPanel from './components/PreviewPanel';
import ConfigEditor from './components/ConfigEditor';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ExportIcon from '@mui/icons-material/CloudUpload';
import ExportModal from './components/export/ExportModal';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
  },
});

function App() {
  const [projectPath, setProjectPath] = useState(null);
  const [error, setError] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleSelectFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });

      // Store both the directory handle and its name
      console.log("Selected directory:", dirHandle.name);
      
      let isValidProject = false;
      
      try {
        const srcHandle = await dirHandle.getDirectoryHandle('src');
        const scenesHandle = await srcHandle.getDirectoryHandle('scenes');
        await scenesHandle.getFileHandle('preloader.js');
        await dirHandle.getDirectoryHandle('media');
        const publicHandle = await dirHandle.getDirectoryHandle('public');
        await publicHandle.getDirectoryHandle('assets');
        
        isValidProject = true;
      } catch (e) {
        console.error('Project structure validation failed:', e);
      }

      if (!isValidProject) {
        setError('Selected folder is not a valid Phaser ad project. Please ensure it contains the required structure.');
        return;
      }

      // Store project context object with both handle and parent info
      const projectContext = {
        handle: dirHandle,
        name: dirHandle.name,
        // Since we know the parent is 'felcity-games'
        parentDir: 'felcity-games'
      };

      setProjectPath(projectContext);
      setError(null);
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError('Failed to access folder. Please ensure you have the right permissions.');
      console.error('Folder selection error:', e);
    }
  };

  const handleExport = () => {
    setIsExportOpen(true);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Phaser Ad Tool
            </Typography>
            {projectPath && (
              <Button 
                color="inherit" 
                startIcon={<ExportIcon />}
                onClick={handleExport}
              >
                Export
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, p: 2 }}>
          {!projectPath ? (
            // Initial layout with full-width preview
            <Grid container spacing={2} sx={{ height: '100%' }}>
              <Grid item xs={12} lg={8} sx={{ height: '100%' }}>
                <PreviewPanel />
              </Grid>
              <Grid item xs={12} lg={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper 
                  sx={{ 
                    p: 4, 
                    width: '100%',
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '300px'
                  }}
                >
                  <Typography variant="h5" gutterBottom>
                    Select Your Phaser Ad Project
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<FolderOpenIcon />}
                    onClick={handleSelectFolder}
                    size="large"
                    sx={{ mt: 2 }}
                  >
                    Choose Project Folder
                  </Button>
                  {error && (
                    <Alert severity="error" sx={{ mt: 2, width: '100%', maxWidth: '500px' }}>
                      {error}
                    </Alert>
                  )}
                </Paper>
              </Grid>
            </Grid>
          ) : (
            // Project selected layout
            <Grid container spacing={2} sx={{ height: '100%' }}>
              <Grid item xs={12} md={8} sx={{ height: '100%' }}>
                <PreviewPanel />
              </Grid>
              <Grid item xs={12} md={4} sx={{ height: '100%', overflow: 'auto' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Project Info
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Selected project folder is ready for asset management.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<FolderOpenIcon />}
                      onClick={handleSelectFolder}
                      size="small"
                      sx={{ mt: 1 }}
                    >
                      Change Project
                    </Button>
                  </Paper>
                  <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    <AssetViewer projectHandle={projectPath} />
                    <ConfigEditor projectHandle={projectPath} />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </Box>

        {projectPath && (
          <ExportModal
            open={isExportOpen}
            onClose={() => setIsExportOpen(false)}
            projectHandle={projectPath}
          />
        )}
      </Box>
    </ThemeProvider>
  );
}

export default App;