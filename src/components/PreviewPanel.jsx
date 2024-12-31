// src/components/PreviewPanel.jsx
import React, { useState, useRef } from 'react';
import { Box, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const devices = {
  'iPhone SE': { width: 375, height: 667 },
  'iPhone 14 Pro': { width: 390, height: 844 },
  'iPad': { width: 768, height: 1024 }
};

export default function PreviewPanel() {
  const [device, setDevice] = useState('iPhone SE');
  const [orientation, setOrientation] = useState('portrait');
  const iframeRef = useRef(null);

  const handleDeviceChange = (event) => {
    setDevice(event.target.value);
  };

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === 'portrait' ? 'landscape' : 'portrait'));
  };

  const refreshPreview = () => {
    if (iframeRef.current) {
      const src = iframeRef.current.src;
      iframeRef.current.src = ''; // Clear the src
      iframeRef.current.src = src; // Reset the src to reload
    }
  };

  const { width, height } = devices[device];
  const scale = 0.8; // Scale to fit nicely in the preview area
  const previewStyle = {
    width: orientation === 'portrait' ? width : height,
    height: orientation === 'portrait' ? height : width,
    transform: `scale(${scale})`,
    transformOrigin: 'top center',
    border: '12px solid #222',
    borderRadius: '32px',
    overflow: 'hidden',
    boxShadow: '0 0 20px rgba(0,0,0,0.2)',
    margin: '0 auto',
    marginTop: '20px',
    backgroundColor: '#fff'
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minHeight: '100%',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px'
  };

  const controlsStyle = {
    display: 'flex',
    gap: '16px',
    width: '100%',
    maxWidth: '600px'
  };

  return (
    <Box sx={containerStyle}>
      <Box sx={controlsStyle}>
        <FormControl fullWidth>
          <InputLabel>Device</InputLabel>
          <Select value={device} onChange={handleDeviceChange}>
            {Object.keys(devices).map((deviceName) => (
              <MenuItem key={deviceName} value={deviceName}>
                {deviceName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={toggleOrientation} sx={{ minWidth: '100px' }}>
          Rotate
        </Button>
        <Button variant="contained" onClick={refreshPreview} sx={{ minWidth: '100px' }}>
          Refresh
        </Button>
      </Box>
      <Box sx={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        flexGrow: 1,
        overflow: 'auto'
      }}>
        <div style={previewStyle}>
          <iframe
            ref={iframeRef}
            src="http://localhost:8080" // Example URL, replace with actual
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Preview"
          />
        </div>
      </Box>
    </Box>
  );
}