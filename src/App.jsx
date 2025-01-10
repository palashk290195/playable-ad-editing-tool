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
  Grid,
  TextField
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

export default function App() {
  const [projectContext, setProjectContext] = useState(null);
  const [error, setError] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [adRootPath, setAdRootPath] = useState('');

  const handleSelectProject = async () => {
    try {
      setError(null);
      const dirHandle = await window.showDirectoryPicker();
      
      // Store project context object with handle
      setProjectContext({
        handle: dirHandle,
        name: dirHandle.name,
        adRootPath // Store the ad root path with the project context
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Failed to open project: ' + err.message);
      }
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Phaser Ad Tool
            </Typography>
            {projectContext && (
              <Button 
                color="inherit" 
                startIcon={<ExportIcon />}
                onClick={() => setExportOpen(true)}
              >
                Export
              </Button>
            )}
          </Toolbar>
        </AppBar>

        {!projectContext ? (
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              p: 4,
              gap: 2
            }}
          >
            <Paper sx={{ p: 3, maxWidth: 500, width: '100%' }}>
              <Typography variant="h5" gutterBottom>
                Select your Phaser Ad project
              </Typography>
              <TextField
                fullWidth
                label="Ad Root Folder Path"
                placeholder="e.g., /Users/username/ads"
                value={adRootPath}
                onChange={(e) => setAdRootPath(e.target.value)}
                margin="normal"
                helperText="Enter the path to your ads root folder"
              />
              <Button
                variant="contained"
                startIcon={<FolderOpenIcon />}
                onClick={handleSelectProject}
                sx={{ mt: 2 }}
              >
                Select Project Folder
              </Button>
            </Paper>
            {error && (
              <Alert severity="error" sx={{ maxWidth: 500, width: '100%' }}>
                {error}
              </Alert>
            )}
          </Box>
        ) : (
          <Grid container sx={{ flexGrow: 1, height: 'calc(100vh - 64px)' }}>
            {/* Left Panel - Assets and Config */}
            <Grid item xs={12} md={3} sx={{ 
              height: '100%', 
              borderRight: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden'
            }}>
              <Box sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column'
              }}>
                {/* Project Info */}
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Project: {projectContext.name}
                  </Typography>
                  {projectContext.adRootPath && (
                    <Typography variant="caption" display="block" color="text.secondary">
                      Ad Root: {projectContext.adRootPath}
                    </Typography>
                  )}
                </Box>

                {/* Assets Section - Scrollable */}
                <Box sx={{ 
                  height: 'calc(100% - 400px)', // Subtract project info and config height
                  overflow: 'auto'
                }}>
                  <AssetViewer projectHandle={projectContext} />
                </Box>

                {/* Config Section - Scrollable */}
                <Box sx={{ 
                  height: '300px', 
                  overflow: 'auto',
                  borderTop: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Box sx={{ p: 2 }}>
                    <ConfigEditor projectHandle={projectContext} />
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Right Panel - Preview */}
            <Grid item xs={12} md={9} sx={{ 
              height: '100%',
              bgcolor: 'grey.100'
            }}>
              <Box sx={{ 
                height: '100%', 
                overflow: 'auto',
                p: 4,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Box sx={{ 
                  maxWidth: '1200px', 
                  width: '100%',
                  minHeight: '1000px', // Accommodate iPad in both orientations
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <PreviewPanel projectHandle={projectContext} />
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}

        {projectContext && (
          <ExportModal
            open={exportOpen}
            onClose={() => setExportOpen(false)}
            projectContext={projectContext}
          />
        )}
      </Box>
    </ThemeProvider>
  );
}