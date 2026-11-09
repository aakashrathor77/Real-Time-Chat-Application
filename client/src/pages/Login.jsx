
import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await API.post("/auth/login", {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      localStorage.setItem("chatToken", response.data.token);
      localStorage.setItem(
        "chatUser",
        JSON.stringify(response.data.user)
      );

      window.location.href = "/chat";

    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">

      {/* LEFT SIDE */}
      <div className="auth-left">
        <div className="brand-logo">
          CHATRIO
        </div>

        <div className="brand-content">
          <h1>Connect. Chat. Share.</h1>

          <p>
            Stay connected with your friends and make every
            conversation meaningful. Enjoy seamless
            communication in one place.
          </p>
        </div>

        <p className="brand-footer">
          Your conversations, one place.
        </p>
      </div>

      {/* RIGHT SIDE */}
      <div className="auth-right">
        <form className="auth-card" onSubmit={handleSubmit}>

          <span className="welcome-label">
            WELCOME BACK
          </span>

          <h1>Login to your account</h1>

          <p className="auth-subtitle">
            Enter your details to continue chatting.
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <label>Email Address</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login to Chat"}
          </button>

          <p className="auth-switch">
            Don't have an account?{" "}
            <Link to="/register">
              Create Account
            </Link>
          </p>

        </form>
      </div>

    </div>
  );
}

export default Login;
