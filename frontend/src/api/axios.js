import axios from "axios";

export const BASE_URL = "http://127.0.0.1:8000";

export const formatApiError = (err) => {
  const data = err?.response?.data;
  if (!data) return err?.message || "Request failed";
  if (typeof data === "string") return data;
  if (typeof data === "object" && data.detail) return String(data.detail);

  if (Array.isArray(data)) {
    return data.map((x) => String(x)).join("\n");
  }

  if (typeof data === "object") {
    const lines = [];
    for (const [key, value] of Object.entries(data)) {
      const label = key === "non_field_errors"
        ? ""
        : key.replaceAll("_", " ");

      if (Array.isArray(value)) {
        const msg = value.map((x) => String(x)).join(" ");
        lines.push(label ? `${label}: ${msg}` : msg);
      } else if (value && typeof value === "object") {
        lines.push(label ? `${label}: ${JSON.stringify(value)}` : JSON.stringify(value));
      } else {
        lines.push(label ? `${label}: ${String(value)}` : String(value));
      }
    }
    return lines.filter(Boolean).join("\n") || "Request failed";
  }

  return String(data);
};

const api = axios.create({
  baseURL: `${BASE_URL}/api/`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      // Avoid infinite loops; force navigation back to login.
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
