import axios from "axios";

const api = axios.create({
  baseURL: "https://law-firm-management-system-sxd1.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Request Interceptor (Sends the token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor (Handles expired tokens)
api.interceptors.response.use(
  (response) => response, 
  (error) => {
  
    const isAuthRoute = error.config.url.includes("/auth/");

    if (error.response && error.response.status === 401 && !isAuthRoute) {
      alert("Your session has expired. Please log in again.");
      
      localStorage.clear(); 
      window.location.href = "/auth/login"; 
    }
    return Promise.reject(error);
  }
);

export default api;