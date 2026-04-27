// =============================================================================
// Responsible for generating GUIDs for all trackable entities in the project.
// (assets, scenes, scene objects, etc.)
//
// Uses Node.js built-in 'crypto' module (no npm installs needed)
// =============================================================================

import { randomUUID } from "crypto";

// -----------------------------------------------------------------------------
// generateGuid()
//
// Generates and returns a new universally unique identifier (UUID v4).
//
// Returns: {string} A new UUID v4 string.
// -----------------------------------------------------------------------------
const generateGuid = () => {
  return randomUUID();
}

export { generateGuid };
