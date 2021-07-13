import { createContext, ReactNode } from "react";

type SingInCrentials = {
  email: string
  password: string
}

type AuthContextData = {
  singIn(credentials: SingInCrentials): Promise<void>;
  isAuthenticated: boolean
}

type AuthProviderProps = {
  children: ReactNode
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({ children }: AuthProviderProps) {
  const isAuthenticated = false

  async function singIn({ email, password }: SingInCrentials) {
    console.log(email, password)
  }
  return (
    <AuthContext.Provider value={{ isAuthenticated, singIn }}>
      {children}
    </AuthContext.Provider>
  )
}