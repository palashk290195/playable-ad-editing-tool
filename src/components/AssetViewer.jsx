// src/components/AssetViewer.jsx
import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Badge,
  Snackbar,
  Alert,
  Stack,
  Tooltip
} from '@mui/material';
import ReplaceIcon from '@mui/icons-material/SwapHoriz';
import AudioIcon from '@mui/icons-material/AudioFile';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { scanProject } from '../utils/projectScanner';
import { processFileReplacement, validateReplacement } from '../utils/base64Converter';

function AssetCard({ asset, onReplace, onReplacementComplete }) {
  const [preview, setPreview] = useState(null);
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const file = await asset.handle.getFile();
        if (asset.type === 'image' || asset.type === 'audio') {
          setPreview(URL.createObjectURL(file));
        }
      } catch (error) {
        console.error('Error loading preview:', error);
      }
    };

    loadPreview();
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [asset]);

  const handleReplace = async () => {
    try {
      setReplacing(true);
      setError(null);
      await onReplace(asset);
      onReplacementComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setReplacing(false);
    }
  };

  const getStatusColor = () => {
    if (!asset.hasBase64) return 'error';
    if (!asset.inUse) return 'warning';
    return 'success';
  };

  const getStatusText = () => {
    if (!asset.hasBase64) return 'No Base64';
    if (!asset.inUse) return 'Unused';
    return 'In Use';
  };

  const renderPreview = () => {
    if (replacing) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Converting to Base64...
          </Typography>
        </Box>
      );
    }

    switch (asset.type) {
      case 'image':
        return (
          <CardMedia
            component="img"
            height="140"
            image={preview || 'placeholder.png'}
            alt={asset.name}
            sx={{ objectFit: 'contain', bgcolor: 'grey.100' }}
          />
        );
      case 'audio':
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <AudioIcon sx={{ fontSize: 60, color: 'primary.main' }} />
            {preview && (
              <audio controls style={{ width: '100%', marginTop: '8px' }}>
                <source src={preview} type="audio/mpeg" />
              </audio>
            )}
          </Box>
        );
      default:
        return (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <FileIcon sx={{ fontSize: 60, color: 'grey.500' }} />
          </Box>
        );
    }
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Badge
        badgeContent={getStatusText()}
        color={getStatusColor()}
        sx={{
          '& .MuiBadge-badge': {
            right: 16,
            top: 16
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          {renderPreview()}
          <IconButton
            sx={{
              position: 'absolute',
              right: 8,
              bottom: 8,
              bgcolor: 'background.paper'
            }}
            onClick={handleReplace}
            disabled={replacing}
          >
            <ReplaceIcon />
          </IconButton>
        </Box>
      </Badge>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle2" noWrap title={asset.name}>
          {asset.name}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" noWrap>
          {asset.path}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Chip
            label={asset.type}
            size="small"
            color={asset.type === 'image' ? 'primary' : asset.type === 'audio' ? 'secondary' : 'default'}
          />
          {asset.hasBase64 ? (
            <Tooltip title="Base64 file exists">
              <Chip
                icon={<CheckCircleIcon />}
                label="Base64"
                size="small"
                color="success"
              />
            </Tooltip>
          ) : (
            <Tooltip title="Base64 file missing">
              <Chip
                icon={<WarningIcon />}
                label="No Base64"
                size="small"
                color="error"
              />
            </Tooltip>
          )}
        </Stack>
        {error && (
          <Typography color="error" variant="caption" sx={{ mt: 1, display: 'block' }}>
            {error}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function AssetViewer({ projectHandle }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);
    const [mediaHandle, setMediaHandle] = useState(null);
    const [assetsHandle, setAssetsHandle] = useState(null);
  
    const loadAssets = async () => {
      try {
        setLoading(true);
        const { assets, mediaHandle, assetsHandle } = await scanProject(projectHandle);
        setAssets(assets);
        setMediaHandle(mediaHandle);
        setAssetsHandle(assetsHandle);
      } catch (err) {
        setError(err.message);
        console.error('Error loading assets:', err);
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      if (projectHandle) {
        loadAssets();
      }
    }, [projectHandle]);
  
    const handleReplace = async (asset) => {
      try {
        const [fileHandle] = await window.showOpenFilePicker({
          types: [
            {
              description: 'Asset Files',
              accept: {
                'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
                'audio/*': ['.mp3', '.wav'],
              },
            },
          ],
        });
        
        const file = await fileHandle.getFile();
        const originalFile = await asset.handle.getFile();
        
        // Validate replacement
        validateReplacement(originalFile, file);
        
        // Pass both mediaHandle and assetsHandle
        const result = await processFileReplacement(
          asset, 
          file, 
          mediaHandle,
          assetsHandle
        );
        
        console.log('Replacement result:', result);
        
        setNotification({
          type: 'success',
          message: 'Asset converted to Base64 successfully!'
        });
        
        // Force a complete refresh
        setTimeout(() => {
          loadAssets();
        }, 500);
        
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Replacement error:', error);
          setNotification({
            type: 'error',
            message: error.message || 'Failed to replace asset'
          });
        }
      }
    };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 4 }}>
        <CircularProgress />
        <Typography align="center">Loading assets...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Grid container spacing={3}>
        {assets.map((asset) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={asset.path}>
            <AssetCard 
              asset={asset} 
              onReplace={handleReplace}
              onReplacementComplete={loadAssets}
            />
          </Grid>
        ))}
      </Grid>

      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {notification && (
          <Alert 
            onClose={() => setNotification(null)} 
            severity={notification.type}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
}