// src/components/ConfigEditor.jsx

import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Paper,
  TextField,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import EditIcon from '@mui/icons-material/Edit';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import SaveIcon from '@mui/icons-material/Save';

/**
 * Extracts a config object from a JS file that has:
 * 
 *   export const SOMENAME = {
 *     // ...
 *   };
 * 
 * The regex tries to find:
 * - optional comments
 * - export (const|let|var|default)
 * - variable name
 * - { ... };
 */
async function extractConfigFromJS(file) {
  const content = await file.text();

  // This regex attempts to find: export const VarName = { ... };
  // - capturing group 3 = the variable name
  // - capturing group 4 = the entire { ... };
  // Modify as needed if your code differs significantly.
  const match = content.match(
    /(\/\*[\s\S]*?\*\/|\/\/.*\n)*\s*export\s+(const|let|var|default)\s+([A-Za-z_$][\w$]*)\s*=\s*(\{[\s\S]*?\};)/
  );

  if (!match) {
    throw new Error('No valid config export found in file');
  }

  try {
    const fullMatch = match[0];            // e.g. export const GAME_CONFIG = { ... };
    const exportName = match[3];           // e.g. GAME_CONFIG
    const configSection = match[4];        // e.g. { ... };
    const startIndex = content.indexOf(fullMatch);
    const endIndex = startIndex + fullMatch.length;

    // Everything *before* the export statement
    const prefix = content.substring(0, startIndex);
    // Everything *after* the export statement
    const suffix = content.substring(endIndex);

    // We'll parse the object by constructing a Function
    // e.g. "return { ... };" -> returns the config object
    // This can fail if there is advanced or invalid JS in your object
    const config = new Function(`return ${configSection.replace(/;$/, '')}`)();

    return {
      config,            // The parsed JS object
      prefix,            // Text before export
      suffix,            // Text after export
      originalContent: content,
      configStart: startIndex,
      configEnd: endIndex,
      exportName,
      exportStatement: fullMatch
    };
  } catch (e) {
    console.error('Parse error:', e);
    throw new Error('Failed to parse config object');
  }
}

export default function ConfigEditor() {
  const [config, setConfig] = useState(null);
  const [fileHandle, setFileHandle] = useState(null);
  const [exportInfo, setExportInfo] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Which Accordion sections are expanded (for nested objects)
  const [expandedSections, setExpandedSections] = useState(new Set());

  // Simple Undo/Redo
  const [history, setHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Helper to push new config states into history
  const pushToHistory = useCallback(
    (newConfig) => {
      setHistory((prev) => [...prev.slice(0, currentIndex + 1), newConfig]);
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex]
  );

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const handleUndo = () => {
    if (canUndo) {
      setCurrentIndex((prev) => prev - 1);
      setConfig(history[currentIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      setCurrentIndex((prev) => prev + 1);
      setConfig(history[currentIndex + 1]);
    }
  };

  /**
   * Show File Picker & Load the config from the chosen JS file
   */
  const handleFileSelect = async () => {
    try {
      setLoading(true);
      setError(null);

      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: 'JavaScript Files',
            accept: { 'text/javascript': ['.js'] }
          }
        ]
      });

      const file = await handle.getFile();
      const extracted = await extractConfigFromJS(file);

      setFileHandle(handle);
      setConfig(extracted.config);
      setExportInfo(extracted);

      // Initialize the history with this config
      setHistory([extracted.config]);
      setCurrentIndex(0);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Re-build the JS file with the updated config object
   */
  const handleSave = async () => {
    if (!fileHandle || !config || !exportInfo) return;

    try {
      const writable = await fileHandle.createWritable();
      // Convert updated config to JSON
      const configString = JSON.stringify(config, null, 2);

      // 1) We'll locate the old { ... }; portion
      // 2) We'll replace it with our new configString (wrapped in { ... };)
      //    The simplest approach: directly re-build the entire export line
      //    or do a targeted find/replace on the object portion.

      // Option A: Rebuild entire export statement
      const newExportStatement = `export const ${exportInfo.exportName} = ${configString};`;

      // Then the new file content is prefix + newExportStatement + suffix
      const newContent = exportInfo.prefix + newExportStatement + exportInfo.suffix;

      // If you prefer the "substring" approach:
      //   substring(0, exportInfo.configStart) +
      //   exportInfo.exportStatement.replace(/\{[\s\S]*?\};/, `${configString};`) +
      //   substring(exportInfo.configEnd);

      await writable.write(newContent);
      await writable.close();
    } catch (err) {
      setError('Failed to save changes: ' + err.message);
    }
  };

  /**
   * Toggle open/close for an accordion path
   */
  const toggleSection = (path) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  /**
   * Update a nested value in config
   */
  const updateValue = (path, value) => {
    const pathArray = path.split('.');

    // Recursively navigate & update
    const updateNestedValue = (obj, keys, newValue) => {
      if (!keys.length) return obj;
      const [head, ...tail] = keys;
      if (!tail.length) {
        // final key -> set
        return { ...obj, [head]: newValue };
      }
      return {
        ...obj,
        [head]: updateNestedValue(obj[head], tail, newValue)
      };
    };

    const newConfig = updateNestedValue(config, pathArray, value);
    setConfig(newConfig);
    pushToHistory(newConfig);
  };

  /**
   * Renders a single value with a TextField for editing
   */
  const renderEditableValue = (value, path) => {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);

    return (
      <TextField
        value={stringValue}
        size="small"
        onChange={(e) => {
          let newVal = e.target.value;
          if (typeof value === 'number') {
            // coerce back to number
            const parsed = Number(newVal);
            if (!isNaN(parsed)) newVal = parsed;
          } else if (typeof value === 'boolean') {
            // coerce to boolean
            newVal = newVal.toLowerCase() === 'true';
          }
          // For arrays or objects in string form, you'd have to parse them, but let's keep it simple
          updateValue(path, newVal);
        }}
        sx={{ ml: 1 }}
      />
    );
  };

  /**
   * Recursively render config objects as nested accordions
   */
  const renderConfigSection = (data, path = '') => {
    if (typeof data !== 'object' || data === null) {
      // primitive value: string/number/boolean/null
      return <Box sx={{ pl: 2 }}>{renderEditableValue(data, path)}</Box>;
    }

    // data is an object or array
    return Object.entries(data).map(([key, value]) => {
      const currentPath = path ? `${path}.${key}` : key;
      const isObject = typeof value === 'object' && value !== null;

      if (isObject) {
        // Render an Accordion for sub-objects
        return (
          <Accordion
            key={currentPath}
            expanded={expandedSections.has(currentPath)}
            onChange={(e, expanded) => {
              e.stopPropagation();
              toggleSection(currentPath);
            }}
            sx={{
              '&.MuiAccordion-root': {
                '&:before': { display: 'none' }
              }
            }}
          >
            <AccordionSummary 
              expandIcon={<ExpandMoreIcon />}
              onClick={(e) => e.stopPropagation()}
            >
              <Typography sx={{ fontWeight: 'bold' }}>{key}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {renderConfigSection(value, currentPath)}
            </AccordionDetails>
          </Accordion>
        );
      }

      // primitive property
      return (
        <Box key={currentPath} sx={{ display: 'flex', alignItems: 'center', p: 1, pl: 2 }}>
          <Typography sx={{ minWidth: 120 }}>
            <strong>{key}:</strong>
          </Typography>
          {renderEditableValue(value, currentPath)}
        </Box>
      );
    });
  };

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <SettingsIcon sx={{ mr: 1 }} />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Config Editor
        </Typography>

        {/* Undo/Redo/Save Buttons */}
        {config && (
          <Stack direction="row" spacing={1}>
            <Tooltip title="Undo">
              <IconButton size="small" onClick={handleUndo} disabled={!canUndo}>
                <UndoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Redo">
              <IconButton size="small" onClick={handleRedo} disabled={!canRedo}>
                <RedoIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Save Changes">
              <IconButton size="small" onClick={handleSave} color="primary">
                <SaveIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Box>

      {/* File Select */}
      {!config ? (
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={handleFileSelect}
          disabled={loading}
        >
          Select Config File
        </Button>
      ) : (
        <Button variant="outlined" size="small" onClick={handleFileSelect} sx={{ mb: 2 }}>
          Change File
        </Button>
      )}

      {loading && <CircularProgress sx={{ m: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Render the config as nested Accordions / fields */}
      {config && <Box sx={{ mt: 2 }}>{renderConfigSection(config)}</Box>}
    </Paper>
  );
}