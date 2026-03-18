import axios, { type AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

import { AuthResource } from './auth';

export const ACCESS_TOKEN_KEY = 'accessToken';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class RocketChatClient {
  public auth: AuthResource;

  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      const token = Cookies.get(ACCESS_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          return error.response;
        }
        return Promise.reject(error);
      },
    );

    this.auth = new AuthResource(this.client);
  }
}
