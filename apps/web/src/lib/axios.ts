import axios from 'axios';

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      if (token) prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  withCredentials: true, // For HttpOnly Cookie transmission of Refresh Token (if used)
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axiosInstance(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // We assume the refresh endpoint is at /auth/refresh-token
        // We might need to store the refresh token in localStorage if not using cookies
        // But the instructions implied cookies or some mechanism.
        // Let's assume we send the refresh token in the body if we store it, 
        // OR we use the cookie if set.
        // The Service code I wrote earlier expects `refreshToken` in Body.
        // So the frontend needs to retrieve it from storage.
        
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (!storedRefreshToken) {
          throw new Error('No refresh token available');
        }

        const { data } = await axios.post((import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/auth/refresh-token', {
             refreshToken: storedRefreshToken
        });
        
        const newToken = data.accessToken;
        
        // Update storage if needed?
        // localStorage.setItem('token', newToken); // or however we manage it
        
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        processQueue(null, newToken);
        
        // Retry original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Logout user or redirect
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
