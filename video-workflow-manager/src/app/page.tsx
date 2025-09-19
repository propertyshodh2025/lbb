'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect to appropriate dashboard based on role
        switch (user.role) {
          case 'ADMIN':
            router.push('/admin')
            break
          case 'MANAGER':
            router.push('/manager')
            break
          case 'EDITOR':
            router.push('/editor')
            break
          case 'CLIENT':
            router.push('/client')
            break
          default:
            router.push('/login')
        }
      } else {
        router.push('/login')
      }
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
