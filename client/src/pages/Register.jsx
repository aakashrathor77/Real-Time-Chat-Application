
import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
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
      const response = await API.post("/auth/register", {
        name: formData.name.trim(),
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
        err.response?.data?.message ||
        "Registration failed. Please try again."
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
          <h1>Join. Connect. Communicate.</h1>

          <p>
            Create your account and become part of a
            connected community. Start conversations,
            share ideas and stay connected with everyone.
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
            GET STARTED
          </span>

          <h1>Create Your Account</h1>

          <p className="auth-subtitle">
            Fill in your details to start chatting.
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <label>Full Name</label>

          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            required
          />

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
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            minLength={6}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <p className="auth-switch">
            Already have an account?{" "}
            <Link to="/">
              Login
            </Link>
          </p>

        </form>
      </div>

    </div>
  );
}

export default Register;
