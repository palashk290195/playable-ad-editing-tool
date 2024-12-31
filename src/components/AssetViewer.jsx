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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControlLabel,
  Switch,
  Stack,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ReplaceIcon from '@mui/icons-material/SwapHoriz';
import AudioIcon from '@mui/icons-material/AudioFile';
import FileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import Animation3DIcon from '@mui/icons-material/Animation';

import { scanProject } from '../utils/projectScanner';
import { processFileReplacement, validateReplacement } from '../utils/base64Converter';

/**
 * Individual Asset Card Component
 */
function AssetCard({
  asset,
  onReplace,
  onReplacementComplete
}) {
  const [preview, setPreview] = useState(null);
  const [replacing, setReplacing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadPreview = async () => {
      try {
        const file = await asset.handle.getFile();
        if (asset.type === 'image' || asset.type === 'audio') {
          const url = URL.createObjectURL(file);
          setPreview(url);
          // Cleanup
          return () => URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error('Error loading preview:', error);
      }
    };

    loadPreview();
  }, [asset]);

  const handleReplace = async () => {
    try {
      setReplacing(true);
      setError(null);
      // Call the prop function passed down from parent
      await onReplace(asset);
      // Refresh the asset list after replacing
      onReplacementComplete();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setReplacing(false);
    }
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
              <audio
                controls
                style={{ width: '100%', marginTop: '8px' }}
                src={preview}
              />
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
        badgeContent={asset.inUse ? 'In Use' : 'Unused'}
        color={asset.inUse ? 'primary' : 'error'}
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
            color={
              asset.type === 'image'
                ? 'primary'
                : asset.type === 'audio'
                ? 'secondary'
                : 'default'
            }
          />
          {asset.hasBase64 ? (
            <Tooltip title="Base64 file exists">
              <Chip label="Base64" size="small" color="success" />
            </Tooltip>
          ) : (
            <Tooltip title="Base64 file missing">
              <Chip label="No Base64" size="small" color="error" />
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

const categoryInfo = {
    images: {
      icon: <ImageIcon />,
      title: 'Images',
      empty: 'No images found'
    },
    audio: {
      icon: <AudioIcon />,
      title: 'Audio',
      empty: 'No audio files found'
    },
    spine: {
      icon: <Animation3DIcon />,
      title: 'Spine Animations',
      empty: 'No spine animations found'
    },
    fonts: {
      icon: <TextFieldsIcon />,
      title: 'Fonts',
      empty: 'No fonts found'
    }
  };

export default function AssetViewer({ projectHandle }) {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notification, setNotification] = useState(null);
    const [mediaHandle, setMediaHandle] = useState(null);
    const [assetsHandle, setAssetsHandle] = useState(null);
    const [showUnused, setShowUnused] = useState(false);
    const [expandedCategory, setExpandedCategory] = useState('images');
  
    const loadAssets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!projectHandle || !projectHandle.handle) {
          throw new Error('Invalid project handle');
        }
  
        const result = await scanProject(projectHandle);
        console.log('Loaded assets:', result);
        setAssets(result.assets);
        setMediaHandle(result.mediaHandle);
        setAssetsHandle(result.assetsHandle);
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

  /**
   * The main replace function called from AssetCard
   */
  const handleReplace = async (asset) => {
    try {
      // 1) Let user pick a new file
      const [fileHandle] = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: 'Images or Audio',
            accept: {
              'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'],
              'audio/*': ['.mp3', '.wav', '.ogg']
            }
          }
        ]
      });

      const newFile = await fileHandle.getFile();

      // 2) Validate file type (throw error if incompatible)
      await validateReplacement(asset, newFile);

      // 3) Convert & replace
      await processFileReplacement(asset, newFile, mediaHandle, assetsHandle);

      // 4) Show success notification
      setNotification({ type: 'success', message: `Successfully replaced ${asset.name}` });
    } catch (err) {
      console.error('Error replacing asset:', err);
      setNotification({ type: 'error', message: err.message });
    }
  };

  // Filter assets based on "Show Unused" toggle
  const filteredAssets = showUnused
    ? assets
    : assets.filter((asset) => asset.inUse);

  // Categorize them
  const categorizedAssets = {
    images: filteredAssets.filter((asset) => asset.type === 'image'),
    audio: filteredAssets.filter((asset) => asset.type === 'audio'),
    spine: filteredAssets.filter((asset) => asset.type === 'spine'),
    fonts: filteredAssets.filter((asset) => asset.type === 'font')
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
      <FormControlLabel
        control={
          <Switch
            checked={showUnused}
            onChange={(e) => setShowUnused(e.target.checked)}
          />
        }
        label="Show Unused Assets"
        sx={{ mb: 2 }}
      />

      {Object.entries(categoryInfo).map(([category, info]) => (
        <Accordion
          key={category}
          expanded={expandedCategory === category}
          onChange={() => setExpandedCategory(category)}
          sx={{ mb: 1 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Stack direction="row" spacing={1} alignItems="center">
              {info.icon}
              <Typography>{info.title}</Typography>
              <Chip
                label={categorizedAssets[category].length}
                size="small"
                sx={{ ml: 1 }}
              />
            </Stack>
          </AccordionSummary>
          <AccordionDetails>
            {categorizedAssets[category].length > 0 ? (
              <Grid container spacing={3}>
                {categorizedAssets[category].map((asset) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={asset.path}>
                    <AssetCard
                      asset={asset}
                      onReplace={handleReplace}
                      onReplacementComplete={loadAssets}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Typography color="text.secondary" align="center">
                {showUnused
                  ? `No ${info.title.toLowerCase()} found`
                  : `No used ${info.title.toLowerCase()} found`}
              </Typography>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

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