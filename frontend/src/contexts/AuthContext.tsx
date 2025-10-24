import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { authApi } from '@/handlers/api/api'
import { UserType } from '@/types'
import { toast } from 'sonner'

interface UserConfig {
  userType: UserType | null
  isPasswordSet: boolean | null
  firstName: string | null
  lastName: string | null
  middleName: string | null
}

interface AuthContextType {
  user: User | null
  userConfig: UserConfig
  session: Session | null
  loading: boolean
  signIn: ({ email, password }: { email: string, password: string }) => Promise<{ error: any, data?: any }>
  signUp: ({ email, password }: { email: string, password: string }) => Promise<{ error: any }>
  signOut: () => Promise<void>,
  getProfile: () => Promise<{ error: any, data?: any }>
  setPassword: ({ password, confirmPassword }: { password: string, confirmPassword: string }) => Promise<{ error: any, data?: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userConfig, setUserConfig] = useState<UserConfig>({
    firstName: null,
    lastName: null,
    middleName: null,
    userType: null,
    isPasswordSet: null
  })
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (!session?.user) {
        setUserConfig({
          userType: null,
          isPasswordSet: null,
          firstName: null,
          lastName: null,
          middleName: null
        })
        
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async ({ email, password }: { email: string, password: string }) => {
    try {
      const { error: supabaseError, data: supabaseData } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (supabaseError) {
        return { error: supabaseError.message }
      }

      const { error: apiError, message: apiMessage, data: apiData } = await authApi.login(supabaseData.session?.access_token)
      if (apiError) {
        return { error: apiMessage }
      }

      setUserConfig({
        userType: apiData?.user?.userType,
        isPasswordSet: apiData?.user?.isPasswordSet,
        firstName: apiData?.user?.firstName,
        lastName: apiData?.user?.lastName,
        middleName: apiData?.user?.middleName
      })

      await getProfile()

      return { error: apiError ? apiMessage : null, data: apiData }
    } catch (error: any) {
      return { error: { message: error.message } }
    }
  }

  const signUp = async ({ email, password }: { email: string, password: string }) => {
    try {
      const { error: supabaseError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (supabaseError) {
        return { error: supabaseError }
      }

      return { error: null }
    } catch (error: any) {
      return { error: { message: error.message } }
    }
  }

  const signOut = async () => {
    try {
      const { error: apiError, message: apiMessage, data: apiData } = await authApi.logout()
      if (apiError) {
        console.error('Logout API error:', apiMessage)
      }
      if (apiData) {
        await supabase.auth.signOut();
        setUser(null)
        setUserConfig({
          userType: null,
          isPasswordSet: null,
          firstName: null,
          lastName: null,
          middleName: null
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
      await supabase.auth.signOut()
    }
    finally {
      toast.success('Logged out!')
    }
  }

  const getProfile = async () => {
    try {
      const { error: apiError, message: apiMessage, data: apiData } = await authApi.getProfile()
      if (apiError) {
        return { error: apiError }
      }
      setUserConfig({
        userType: apiData.userType,
        isPasswordSet: apiData.isPasswordSet,
        firstName: apiData.firstName,
        lastName: apiData.lastName,
        middleName: apiData.middleName
      })
      return { error: apiError ? apiMessage : null, data: apiData }
    } catch (error: any) {
      return { error: { message: error.message } }
    }
  }

  const setPassword = async ({ password, confirmPassword }: { password: string, confirmPassword: string }) => {
    try {
      const { error: apiError, message: apiMessage, data: apiData } = await authApi.setPassword({ password, confirmPassword })
      if (apiError) {
        return { error: apiMessage }
      }
      return { error: apiError ? apiMessage : null, data: apiData }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  const value = {
    user,
    userConfig,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    getProfile,
    setPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}