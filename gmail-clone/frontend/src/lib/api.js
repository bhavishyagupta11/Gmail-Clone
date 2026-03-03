import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const shouldSkipAuthExpiredEvent = (url = "") =>
  ["/user/me", "/user/login", "/user/register"].some((path) => url.includes(path));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || "";

    if (status === 401 && !shouldSkipAuthExpiredEvent(requestUrl)) {
      window.dispatchEvent(new CustomEvent("auth:expired"));
    }
    return Promise.reject(error);
  }
);

export default api;
