// src/components/PreviewPanel.jsx
import React, { useState, useRef } from 'react';
import { Box, Button, Select, MenuItem, FormControl, InputLabel, IconButton } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScreenRotationIcon from '@mui/icons-material/ScreenRotation';

export default function PreviewPanel() {
  const [device, setDevice] = useState('iPhone SE');
  const [orientation, setOrientation] = useState('portrait');
  const iframeRef = useRef(null);

  const devices = {
    'iPhone SE': { width: 375, height: 667 },
    'iPhone 14 Pro': { width: 393, height: 852 },
    'iPad': { width: 820, height: 1180 },
  };

  const handleDeviceChange = (event) => {
    setDevice(event.target.value);
  };

  const handleRotate = () => {
    setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait');
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
    height: '100%',
    padding: '16px'
  };

  const controlsStyle = {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    width: '100%',
    flexShrink: 0
  };

  const previewStyle = {
    width: orientation === 'portrait' ? devices[device].width : devices[device].height,
    height: orientation === 'portrait' ? devices[device].height : devices[device].width,
    transform: 'scale(1)',
    transformOrigin: 'top center',
    border: '12px solid #000',
    borderRadius: '36px',
    overflow: 'hidden',
    backgroundColor: '#fff'
  };

  return (
    <Box sx={containerStyle}>
      <Box sx={controlsStyle}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Device</InputLabel>
          <Select value={device} onChange={handleDeviceChange}>
            {Object.keys(devices).map((deviceName) => (
              <MenuItem key={deviceName} value={deviceName}>
                {deviceName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <IconButton onClick={handleRotate} title="Rotate Device">
          <ScreenRotationIcon />
        </IconButton>
        <IconButton onClick={handleRefresh} title="Refresh Preview">
          <RefreshIcon />
        </IconButton>
      </Box>
      <Box sx={{
        flexGrow: 1,
        overflow: 'auto',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '16px'
      }}>
        <div style={previewStyle}>
          <iframe
            ref={iframeRef}
            src="http://localhost:8080"
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Preview"
          />
        </div>
      </Box>
    </Box>
  );
}