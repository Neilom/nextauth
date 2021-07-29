import { useContext, useEffect } from "react"
import { Can } from "../components/Can"
import { AuthContext } from "../contexts/AuthContext"
import { setupAPICLient } from "../services/api"
import { api } from "../services/apiClient"
import { SSRAuth } from "../utils/withSSRAuth"

export default function Dashboard() {
  const { user, singOut } = useContext(AuthContext)



  useEffect(() => {
    api.get('/me').then(res => {
      console.log(res)
    })
  }, [])

  return (
    <>
      <h1>Dashboard: {user?.email}</h1>

      <button onClick={singOut}>Sign Out</button>

      <Can permissions={['metrics.list']}>
        <div>Metricas</div>
      </Can>
    </>
  )
}

export const getServerSideProps = SSRAuth(async (ctx) => {
  const apiCliente = setupAPICLient(ctx)

  const response = await apiCliente.get('/me')

  console.log(response.data)

  return {
    props: {}
  }
})