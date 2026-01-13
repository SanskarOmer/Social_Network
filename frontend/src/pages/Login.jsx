import "../styles/login.css";
import { useState } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const cleanedEmail = email.trim();
    if (!cleanedEmail) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    try {
      const res = await api.post("login/", { email: cleanedEmail, password });
      localStorage.setItem("token", res.data.access);
      navigate("/profile");
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setError("Invalid email or password");
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="login-wrapper">
      <h2>Social Network Login</h2>

      <form className="login-card" onSubmit={submit}>
        {error && <p className="form-error">{error}</p>}
        <label>Email Address</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Login</button>

        <p>
          Don't have account? <Link to="/signup">Create Account</Link>
        </p>
      </form>
    </div>
  );
}
