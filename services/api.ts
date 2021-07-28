import axios, { AxiosError } from "axios"
import { parseCookies, setCookie } from "nookies";
import { singOut } from "../contexts/AuthContext";
import { AuthTokenError } from "./errors/AuthTokenError";

let isRefreshing = false;
let failedRequestQueue: { resolve: (token: string) => void; reject: (err: AxiosError<any>) => void; }[] = [];

export function setupAPICLient(ctx: any = undefined) {
  let cookies = parseCookies(ctx)

  const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
      Authorization: `Bearer ${cookies['nextauth.token']}`
    }
  });

  api.interceptors.response.use(response => {
    return response;
  }, (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (error.response.data?.code === 'token.expired') {
        cookies = parseCookies(ctx);

        const { 'nextauth.refreshToken': refreshToken } = cookies;
        const originalConfig = error.config

        if (!isRefreshing) {
          isRefreshing = true

          api.post('/refresh', {
            refreshToken
          }).then(respose => {
            const { token } = respose.data

            setCookie(ctx, 'nextauth.token', token, {
              maxAge: 60 * 60 * 24 * 30, //30 days
              path: '/'
            })

            setCookie(ctx, 'nextauth.refreshToken', respose.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30, //30 days
              path: '/'
            })

            api.defaults.headers['Authorization'] = `Bearer ${token}`

            failedRequestQueue.forEach(request => request.resolve(token))
            failedRequestQueue = [];
          }).catch(err => {
            failedRequestQueue.forEach(request => request.reject(err))
            failedRequestQueue = [];

            if (process.browser) {
              singOut()
            }
          }).finally(() => {
            isRefreshing = false
          });
        }

        return new Promise((resolve, reject) => {
          failedRequestQueue.push({
            resolve: (token: string) => {
              originalConfig.headers["Authorization"] = `Bearer ${token}`

              resolve(api(originalConfig))
            },
            reject: (err: AxiosError) => {
              reject(err)
            }
          })
        })

      }
    } else {
      if (process.browser) {
        singOut()
      } else {
        return Promise.reject(new AuthTokenError())
      }

    }

    return Promise.reject(error);
  })
  return api
}
