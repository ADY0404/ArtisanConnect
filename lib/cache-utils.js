/**
 * Cache Management Utilities
 * Provides functions to handle cache invalidation and real-time updates
 */

/**
 * Add cache invalidation headers to a NextResponse
 * @param {NextResponse} response - The NextResponse object
 * @returns {NextResponse} - Response with cache headers
 */
export function addCacheHeaders(response) {
  response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  response.headers.set('Last-Modified', new Date().toUTCString())
  response.headers.set('ETag', `"${Date.now()}"`)
  return response
}

/**
 * Generate a cache-busting timestamp
 * @returns {string} - Current timestamp for cache busting
 */
export function getCacheBuster() {
  return Date.now().toString()
}

/**
 * Add cache-busting parameter to URL
 * @param {string} url - The URL to add cache buster to
 * @returns {string} - URL with cache buster parameter
 */
export function addCacheBuster(url) {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}_t=${getCacheBuster()}`
}

/**
 * Create a NextResponse with cache invalidation headers
 * @param {any} data - The data to return
 * @param {number} status - HTTP status code (default: 200)
 * @returns {NextResponse} - Response with cache headers
 */
export function createNoCacheResponse(data, status = 200) {
  const response = NextResponse.json(data, { status })
  return addCacheHeaders(response)
} 