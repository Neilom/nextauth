import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/api";
import Router from "next/router"
import { destroyCookie, parseCookies, setCookie } from "nookies"

type SingInCrentials = {
  email: string
  password: string
}

type AuthContextData = {
  singIn(credentials: SingInCrentials): Promise<void>;
  user?: User,
  isAuthenticated: boolean,
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

  Router.push('/')
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

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
    <AuthContext.Provider value={{ isAuthenticated, singIn, user }}>
      {children}
    </AuthContext.Provider>
  )
}