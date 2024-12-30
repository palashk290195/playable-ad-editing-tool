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

  const handleSelectFolder = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });

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

      setProjectPath(dirHandle);
      setError(null);
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError('Failed to access folder. Please ensure you have the right permissions.');
      console.error('Folder selection error:', e);
    }
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
          </Toolbar>
        </AppBar>

        <Box sx={{ flexGrow: 1, mt: 4, mb: 4 }}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            <Grid item xs={12} md={8} sx={{ overflow: 'auto' }}>
              <PreviewPanel />
            </Grid>
            <Grid item xs={12} md={4} sx={{ overflow: 'auto' }}>
              {!projectPath ? (
                <Paper 
                  sx={{ 
                    p: 4, 
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
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                  <Divider />
                  <Box sx={{ overflow: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                    <AssetViewer projectHandle={projectPath} />
                    <ConfigEditor projectHandle={projectPath} />
                  </Box>
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;