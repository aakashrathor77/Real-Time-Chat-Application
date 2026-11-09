
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  const isAuthRequest =
    config.url?.includes("/auth/login") ||
    config.url?.includes("/auth/register");

  if (!isAuthRequest) {
    const token = localStorage.getItem("chatToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

export default API;
