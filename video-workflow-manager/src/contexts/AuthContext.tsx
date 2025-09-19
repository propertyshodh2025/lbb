'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { UserRole } from '@prisma/client'
import { TokenPayload } from '@/lib/auth'

interface AuthContextType {
  user: TokenPayload | null
  login: (token: string) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TokenPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token with API
      fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setUser(data.user)
          } else {
            localStorage.removeItem('token')
          }
        })
        .catch(() => {
          localStorage.removeItem('token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (token: string) => {
    localStorage.setItem('token', token)
    // Decode token to get user info (in real app, verify with API)
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as TokenPayload
      setUser(payload)
    } catch {
      console.error('Invalid token')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}