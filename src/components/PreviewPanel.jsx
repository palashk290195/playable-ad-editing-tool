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
  const previewStyle = {
    width: orientation === 'portrait' ? width : height,
    height: orientation === 'portrait' ? height : width,
    border: '1px solid #ccc',
    overflow: 'hidden'
  };

  return (
    <Box sx={{ p: 2 }}>
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Device</InputLabel>
        <Select value={device} onChange={handleDeviceChange}>
          {Object.keys(devices).map((deviceName) => (
            <MenuItem key={deviceName} value={deviceName}>
              {deviceName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" onClick={toggleOrientation} sx={{ mr: 2 }}>
        Rotate
      </Button>
      <Button variant="contained" onClick={refreshPreview}>
        Refresh
      </Button>
      <Box sx={{ mt: 2, ...previewStyle }}>
        <iframe
          ref={iframeRef}
          src="http://localhost:8080" // Example URL, replace with actual
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Preview"
        />
      </Box>
    </Box>
  );
}