import decode from "jwt-decode"
import { setupAPICLient } from "../services/api"
import { SSRAuth } from "../utils/withSSRAuth"

export default function Metrics() {
  return (
    <>
      <h1>Metrics</h1>
    </>
  )
}

export const getServerSideProps = SSRAuth(async (ctx) => {
  const apiCliente = setupAPICLient(ctx)
  const response = await apiCliente.get('/me')

  return {
    props: {}
  }
}, {
  permissions: ['metrics.list'],
  roles:['administration']
})