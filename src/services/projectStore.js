// src/services/projectStore.js

// Store project paths in memory
const projectPaths = new Map();

/**
 * Store project path and return unique ID
 */
export function storeProjectPath(path) {
  const projectId = crypto.randomUUID();
  projectPaths.set(projectId, path);
  return projectId;
}

/**
 * Get project path by ID
 */
export function getProjectPath(projectId) {
  const path = projectPaths.get(projectId);
  if (!path) {
    throw new Error(`Project ID not found: ${projectId}`);
  }
  return path;
}

/**
 * Remove project from store
 */
export function removeProject(projectId) {
  projectPaths.delete(projectId);
}