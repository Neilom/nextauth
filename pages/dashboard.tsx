import { destroyCookie } from "nookies"
import { useContext, useEffect } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { setupAPICLient } from "../services/api"
import { api } from "../services/apiClient"
import { AuthTokenError } from "../services/errors/AuthTokenError"
import { SSRAuth } from "../utils/withSSRAuth"

export default function Dashboard() {
  const { user } = useContext(AuthContext)

  useEffect(() => {
    api.get('/me').then(res => {
      console.log(res)
    })
  }, [])

  return (
    <h1>Dashboard: {user?.email}</h1>
  )
}

export const getServerSideProps = SSRAuth(async (ctx) => {
  const apiCliente = setupAPICLient(ctx)
  try {
    const response = await apiCliente.get('/me')

    console.log(response.data)
  } catch (error) {
    destroyCookie(ctx, 'nextauth.token')
    destroyCookie(ctx, 'nextauth.refreshToken')

    return {
      redirect: {
        destination: '/',
        permanent: false
      }
    }
  }
  return {
    props: {}
  }
})