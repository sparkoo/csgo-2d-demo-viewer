/**
 * Get the full URL for an asset, supporting both local and CDN-based assets
 * @param {string} assetPath - The relative path to the asset (e.g., "overviews/de_dust2.png")
 * @returns {string} The full URL to the asset
 */
export function getAssetUrl(assetPath) {
  const baseUrl = import.meta.env.VITE_ASSETS_BASE_URL;
  
  if (baseUrl) {
    // Remove leading slash from assetPath if present
    const cleanPath = assetPath.startsWith('/') ? assetPath.substring(1) : assetPath;
    // Ensure baseUrl doesn't end with slash to avoid double slashes
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}/${cleanPath}`;
  }
  
  // Default to local assets (for backward compatibility)
  return assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
}
