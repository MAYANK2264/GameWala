import { Capacitor } from '@capacitor/core'

/**
 * Detects if the app is running in a WebView (Android/iOS native app)
 */
export function isWebView(): boolean {
  if (Capacitor.isNativePlatform()) {
    return true
  }
  // Check for WebView user agent patterns
  if (typeof window !== 'undefined' && window.navigator) {
    const ua = window.navigator.userAgent.toLowerCase()
    // Android WebView detection
    if (ua.includes('wv') || ua.includes('webview')) {
      return true
    }
    // iOS WebView detection
    if (ua.includes('iphone') || ua.includes('ipad')) {
      const nav = window.navigator as unknown as { standalone?: boolean }
      if (nav.standalone === true) {
        return true
      }
    }
  }
  return false
}

/**
 * Detects if the app is running in a standalone PWA
 */
export function isStandalonePWA(): boolean {
  if (typeof window === 'undefined') return false
  // Check for standalone display mode
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }
  // iOS standalone check
  const nav = window.navigator as unknown as { standalone?: boolean }
  return nav?.standalone === true
}

/**
 * Determines if we should use redirect flow for authentication
 */
export function shouldUseRedirectAuth(): boolean {
  // Always use redirect for WebView to avoid user agent issues
  // The WebView user agent is configured in MainActivity.java
  return isWebView() || isStandalonePWA()
}

/**
 * Gets the current environment type for debugging
 */
export function getEnvironmentType(): string {
  if (Capacitor.isNativePlatform()) {
    return 'Native (Capacitor)'
  }
  if (isWebView()) {
    return 'WebView'
  }
  if (isStandalonePWA()) {
    return 'Standalone PWA'
  }
  return 'Browser'
}

