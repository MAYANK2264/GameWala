import { Camera } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'

const PERMISSION_KEY = 'camera_permission_requested'

export async function requestCameraPermissionOnce(): Promise<boolean> {
  // Only request on native platforms
  if (!Capacitor.isNativePlatform()) {
    return true // Web browsers handle permissions automatically
  }

  // Check if we've already requested permission
  const alreadyRequested = localStorage.getItem(PERMISSION_KEY)
  if (alreadyRequested === 'granted') {
    return true
  }

  try {
    // Check current permission status
    const status = await Camera.checkPermissions()
    
    if (status.camera === 'granted') {
      localStorage.setItem(PERMISSION_KEY, 'granted')
      return true
    }

    if (status.camera === 'prompt') {
      // Request permission
      const result = await Camera.requestPermissions({ permissions: ['camera'] })
      
      if (result.camera === 'granted') {
        localStorage.setItem(PERMISSION_KEY, 'granted')
        return true
      }
    }

    // Permission denied or not available
    localStorage.setItem(PERMISSION_KEY, 'denied')
    return false
  } catch (error) {
    console.error('Camera permission error:', error)
    return false
  }
}

export function resetCameraPermission() {
  localStorage.removeItem(PERMISSION_KEY)
}

