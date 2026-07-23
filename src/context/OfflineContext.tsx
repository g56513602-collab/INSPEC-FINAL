import React, { createContext, useContext, useEffect, useState } from 'react'
import { offlineStorage } from '../storage/indexedDB'

export interface GeolocationData {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface OfflineContextType {
  isOnline: boolean
  pendingCount: number
  hasPendingRequests: boolean
  location: GeolocationData | null
  locationError: string | null
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [location, setLocation] = useState<GeolocationData | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)

  // Captura GPS automaticamente ao abrir o app e mantém atualizado em segundo
  // plano (watchPosition), para que toda foto tirada já tenha coordenadas
  // sem exigir um botão manual de "Capturar GPS".
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não suportada neste dispositivo')
      return
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      })
      setLocationError(null)
    }

    const handleError = (err: GeolocationPositionError) => {
      let msg = 'Erro ao obter localização'
      switch (err.code) {
        case err.PERMISSION_DENIED:
          msg = 'Permissão negada para acessar localização. Verifique as configurações do navegador.'
          break
        case err.POSITION_UNAVAILABLE:
          msg = 'Informação de localização não disponível. Tente em um local aberto.'
          break
        case err.TIMEOUT:
          msg = 'Tempo limite excedido ao obter localização'
          break
      }
      setLocationError(msg)
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    })

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Monitor online/offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      offlineStorage.setOfflineState(true).catch(console.error)
      // Trigger sync
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.sync.register('inspec360-sync').catch(console.error)
        })
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      offlineStorage.setOfflineState(false).catch(console.error)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Check pending requests periodically
  useEffect(() => {
    const checkPending = async () => {
      try {
        await offlineStorage.init()
        const pending = await offlineStorage.getPendingRequests()
        setPendingCount(pending.length)
      } catch (error) {
        console.error('Error checking pending requests:', error)
      }
    }

    checkPending()
    const interval = setInterval(checkPending, 5000)

    return () => clearInterval(interval)
  }, [])

  // Clean old cache
  useEffect(() => {
    offlineStorage.clearOldCache().catch(console.error)
    const interval = setInterval(() => {
      offlineStorage.clearOldCache().catch(console.error)
    }, 60 * 60 * 1000) // Every hour

    return () => clearInterval(interval)
  }, [])

  const value: OfflineContextType = {
    isOnline,
    pendingCount,
    hasPendingRequests: pendingCount > 0,
    location,
    locationError
  }

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  )
}

export function useOnlineStatus() {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error('useOnlineStatus must be used within OfflineProvider')
  }
  return context
}
