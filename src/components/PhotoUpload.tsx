import { useState, useRef } from 'react'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { storage } from '../firebaseConfig'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

type PhotoUploadProps = {
  photos: string[]
  onPhotosChange: (urls: string[]) => void
  maxPhotos?: number
}

export default function PhotoUpload({ photos, onPhotosChange, maxPhotos = 5 }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadPhoto = async (file: File | Blob) => {
    if (photos.length >= maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`)
      return
    }

    setUploading(true)
    try {
      const timestamp = Date.now()
      const fileName = `products/${timestamp}_${Math.random().toString(36).substring(7)}.jpg`
      const fileRef = ref(storage, fileName)
      
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)
      
      onPhotosChange([...photos, url])
    } catch (error) {
      console.error('Photo upload failed:', error)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const takePhoto = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        const image = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        })
        
        if (image.dataUrl) {
          // Convert data URL to blob
          const response = await fetch(image.dataUrl)
          const blob = await response.blob()
          await uploadPhoto(blob)
        }
      } else {
        // Web fallback: use file input
        fileInputRef.current?.click()
      }
    } catch (error: any) {
      if (error.message?.includes('permission')) {
        alert('Camera permission is required. Please enable it in your device settings.')
      } else if (error.message?.includes('cancel')) {
        // User cancelled, do nothing
      } else {
        console.error('Camera error:', error)
        // Fallback to file input
        fileInputRef.current?.click()
      }
    }
  }

  const selectPhoto = async () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      await uploadPhoto(file)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index)
    onPhotosChange(newPhotos)
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-neutral-700">Product Photos</label>
      <div className="flex flex-wrap gap-2">
        {photos.map((url, index) => (
          <div key={index} className="relative">
            <img
              src={url}
              alt={`Product ${index + 1}`}
              className="h-20 w-20 rounded-md border border-neutral-300 object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(index)}
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
              aria-label="Remove photo"
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < maxPhotos && (
          <>
            <button
              type="button"
              onClick={takePhoto}
              disabled={uploading}
              className="flex h-20 w-20 items-center justify-center rounded-md border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-600 transition hover:border-neutral-400 hover:bg-neutral-100 disabled:opacity-50"
            >
              {uploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent" />
              ) : (
                <span className="text-2xl">📷</span>
              )}
            </button>
            <button
              type="button"
              onClick={selectPhoto}
              disabled={uploading}
              className="flex h-20 w-20 items-center justify-center rounded-md border-2 border-dashed border-neutral-300 bg-neutral-50 text-neutral-600 transition hover:border-neutral-400 hover:bg-neutral-100 disabled:opacity-50"
            >
              {uploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-600 border-t-transparent" />
              ) : (
                <span className="text-2xl">🖼️</span>
              )}
            </button>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        capture="environment"
      />
      {photos.length > 0 && (
        <p className="text-xs text-neutral-500">
          {photos.length} of {maxPhotos} photos
        </p>
      )}
    </div>
  )
}

