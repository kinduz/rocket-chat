import axios, { type AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

import { AuthResource } from './auth';
import { ProfileResource } from './profile';

export const ACCESS_TOKEN_KEY = 'accessToken';

const DEFAULT_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export type TokenGetter = () =>
  | string
  | undefined
  | Promise<string | undefined>;

const browserTokenGetter: TokenGetter = () =>
  typeof document !== 'undefined' ? Cookies.get(ACCESS_TOKEN_KEY) : undefined;

export type RocketChatClientOptions = {
  baseURL?: string;
  accessToken?: string;
};

export class RocketChatClient {
  public auth: AuthResource;
  public profile: ProfileResource;

  private client: AxiosInstance;

  constructor(options: RocketChatClientOptions = {}) {
    this.client = axios.create({
      baseURL: options.baseURL ?? DEFAULT_API_BASE,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(async (config) => {
      const token = options.accessToken ?? browserTokenGetter();
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
    this.profile = new ProfileResource(this.client);
  }
}
