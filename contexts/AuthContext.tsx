import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/apiClient";
import Router from "next/router"
import { destroyCookie, parseCookies, setCookie } from "nookies"

type SingInCrentials = {
  email: string
  password: string
}

type AuthContextData = {
  singIn: (credentials: SingInCrentials) => Promise<void>;
  singOut: () => void;
  user?: User;
  isAuthenticated: boolean;
}

type AuthProviderProps = {
  children: ReactNode
}
type User = {
  email: string,
  permissions: string[],
  roles: string[],
}

export function singOut() {
  destroyCookie(undefined, 'nextauth.token')
  destroyCookie(undefined, 'nextauth.refreshToken')

  autoChannel.postMessage('signOut')

  Router.push('/')
}

export const AuthContext = createContext({} as AuthContextData)

let autoChannel: BroadcastChannel

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  useEffect(() => {

    autoChannel = new BroadcastChannel('auth')
    autoChannel.onmessage = (message) => {
      switch (message.data) {
        case 'signOut':
          singOut()
          break
        default:
          break
      }
    }
  }, [])

  useEffect(() => {
    const { 'nextauth.token': token } = parseCookies()
    if (token) {
      api.get('/me').then(response => {
        const { email, permissions, roles } = response?.data

        setUser({ email, permissions, roles })
      }).catch(error => {
        singOut()
      })
    }
  }, [])

  async function singIn({ email, password }: SingInCrentials) {
    try {
      const response = await api.post("sessions", {
        email, password
      })

      const { token, refreshToken, permissions, roles } = response.data

      setCookie(undefined, 'nextauth.token', token, {
        maxAge: 60 * 60 * 24 * 30, //30 days
        path: '/'
      })
      setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30, //30 days
        path: '/'
      })

      setUser({
        email, permissions, roles
      })

      api.defaults.headers['Authorization'] = `Bearer ${token}`

      Router.push('/dashboard')

    } catch (error) {
      console.log(error)
    }
  }
  return (
    <AuthContext.Provider value={{ isAuthenticated, singOut, singIn, user }}>
      {children}
    </AuthContext.Provider>
  )
}