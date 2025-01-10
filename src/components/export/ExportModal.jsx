// src/components/export/ExportModal.jsx
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Box,
  Tooltip,
  TextField
} from '@mui/material';
import { buildForNetwork } from '../../services/buildService';

const AD_NETWORKS = [
  'google',
  'meta',
  'mintegral',
  'tiktok',
  'ironsource',
  'vungle',
  'unityads',
  'applovin',
  'adcolony',
  'kayzen'
];

// Validate build name - only allow alphanumeric, hyphens and underscores
const isValidBuildName = (name) => /^[a-zA-Z0-9-_]+$/.test(name);

export default function ExportModal({ open, onClose, projectContext }) {
  const [selectedNetworks, setSelectedNetworks] = useState([]);
  const [buildName, setBuildName] = useState('');
  const [buildNameError, setBuildNameError] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [error, setError] = useState(null);
  const [buildStatus, setBuildStatus] = useState({});
  const [overwriteConfirm, setOverwriteConfirm] = useState(false);

  const handleNetworkToggle = (network) => {
    setSelectedNetworks(prev =>
      prev.includes(network)
        ? prev.filter(n => n !== network)
        : [...prev, network]
    );
  };

  const validateBuildName = async (name) => {
    if (!name) {
      setBuildNameError('Build name is required');
      return false;
    }
    if (!isValidBuildName(name)) {
      setBuildNameError('Only letters, numbers, hyphens and underscores allowed');
      return false;
    }
    
    // Check if build folder exists
    try {
      // Get the directory handle from projectContext
      const dirHandle = projectContext.handle;
      
      const tempHandle = await dirHandle.getDirectoryHandle('temp', { create: true });
      const buildsHandle = await tempHandle.getDirectoryHandle('playable-ad-builds', { create: true });
      
      try {
        await buildsHandle.getDirectoryHandle(name);
        if (!overwriteConfirm) {
          setBuildNameError('Build name already exists. Click build again to overwrite.');
          setOverwriteConfirm(true);
          return false;
        }
      } catch (e) {
        // Directory doesn't exist, which is good for a new build
      }
      
      return true;
    } catch (e) {
      console.error('Failed to validate build name:', e);
      setBuildNameError('Failed to validate build name');
      return false;
    }
  };

  const handleBuildName = (event) => {
    const value = event.target.value;
    setBuildName(value);
    setBuildNameError('');
    setOverwriteConfirm(false);
  };

  const handleBuildAll = async () => {
    if (selectedNetworks.length === 0) {
      setError('Please select at least one ad network');
      return;
    }

    if (!await validateBuildName(buildName)) {
      return;
    }

    setIsBuilding(true);
    setError(null);
    setBuildStatus({});

    try {
      // Build networks sequentially to avoid Vite conflicts
      for (const network of selectedNetworks) {
        setBuildStatus(prev => ({ ...prev, [network]: 'building' }));
        try {
          await buildForNetwork(projectContext, network, buildName);
          setBuildStatus(prev => ({ ...prev, [network]: 'complete' }));
        } catch (err) {
          console.error(`Build failed for ${network}:`, err);
          setBuildStatus(prev => ({ ...prev, [network]: 'error' }));
          setError(prev => prev ? `${prev}, ${network}` : `Build failed for: ${network}`);
        }
      }

      if (!error) {
        onClose();
      }
    } catch (err) {
      setError('Build process failed');
    } finally {
      setIsBuilding(false);
      setOverwriteConfirm(false);
    }
  };

  const getBuildStatusColor = (network) => {
    switch (buildStatus[network]) {
      case 'building': return 'info';
      case 'complete': return 'success';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={!isBuilding ? onClose : undefined} 
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>Export Builds</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Build Name"
          value={buildName}
          onChange={handleBuildName}
          error={!!buildNameError}
          helperText={buildNameError}
          disabled={isBuilding}
          margin="normal"
          placeholder="my-build-name"
        />
        <FormGroup>
          {AD_NETWORKS.map(network => (
            <FormControlLabel
              key={network}
              control={
                <Checkbox
                  checked={selectedNetworks.includes(network)}
                  onChange={() => handleNetworkToggle(network)}
                  disabled={isBuilding}
                  color={getBuildStatusColor(network)}
                />
              }
              label={network.charAt(0).toUpperCase() + network.slice(1)}
            />
          ))}
        </FormGroup>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {isBuilding && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Tooltip title={isBuilding ? "Build in progress" : ""}>
          <span>
            <Button onClick={onClose} disabled={isBuilding}>
              Cancel
            </Button>
          </span>
        </Tooltip>
        <Tooltip title={selectedNetworks.length === 0 ? "Select at least one network" : ""}>
          <span>
            <Button
              onClick={handleBuildAll}
              variant="contained"
              disabled={selectedNetworks.length === 0 || isBuilding}
              color={overwriteConfirm ? "warning" : "primary"}
            >
              {isBuilding ? 'Building...' : overwriteConfirm ? 'Overwrite Build' : 'Build Selected'}
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
    </Dialog>
  );
}