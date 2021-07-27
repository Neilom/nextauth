import axios, { AxiosError } from "axios"
import { parseCookies, setCookie } from "nookies";
import { singOut } from "../contexts/AuthContext";

let cookies = parseCookies()
let isRefreshing = false;
let failedRequestQueue: { resolve: (token: string) => void; reject: (err: AxiosError<any>) => void; }[] = [];

export const api = axios.create({
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
      cookies = parseCookies();

      const { 'nextauth.refreshToken': refreshToken } = cookies;
      const originalConfig = error.config

      if (!isRefreshing) {
        isRefreshing = true

        api.post('/refresh', {
          refreshToken
        }).then(respose => {
          const { token } = respose.data

          setCookie(undefined, 'nextauth.token', token, {
            maxAge: 60 * 60 * 24 * 30, //30 days
            path: '/'
          })

          setCookie(undefined, 'nextauth.refreshToken', respose.data.refreshToken, {
            maxAge: 60 * 60 * 24 * 30, //30 days
            path: '/'
          })

          api.defaults.headers['Authorization'] = `Bearer ${token}`

          failedRequestQueue.forEach(request => request.resolve(token))
          failedRequestQueue = [];
        }).catch(err => {
          failedRequestQueue.forEach(request => request.reject(err))
          failedRequestQueue = [];
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
    singOut();

  }

  return Promise.reject(error);
})

