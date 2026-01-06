import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
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
  (response) => response, // If the request succeeds, do nothing
  (error) => {
    // Check if the error is 401 (Unauthorized) 
    // or if the backend sends a 500 because req.user was missing
    if (error.response && (error.response.status === 401)) {
      alert("Your session has expired. Please log in again.");
      
      localStorage.removeItem("token");
      localStorage.removeItem("role"); // If you store role there too
      
      window.location.href = "/login"; 
    }
    return Promise.reject(error);
  }
);

export default api;