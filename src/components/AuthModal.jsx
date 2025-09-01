import React, { useState } from "react";
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { authService } from "../firebase";

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (!isLogin && formData.password !== formData.confirmPassword) {
        setError("Passwords don't match");
        setIsLoading(false);
        return;
      }

      let user;
      if (isLogin) {
        // Sign in
        user = await authService.signIn(formData.email, formData.password);
      } else {
        // Sign up
        user = await authService.signUp(
          formData.email,
          formData.password,
          formData.name
        );
      }

      // Call the success callback with user data
      onAuthSuccess({
        user: {
          id: user.uid,
          name: user.displayName || formData.name || "User",
          email: user.email,
        },
        token: await user.getIdToken(),
      });
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        setError("No account found with this email. Please sign up first.");
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password. Please try again.");
      } else if (err.code === "auth/email-already-in-use") {
        setError(
          "An account with this email already exists. Please sign in instead."
        );
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters long.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    });
    setError("");
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-auth">
      <div className="modal-content modal-content-auth">
        <div className="modal-header">
          <h2 className="modal-title">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="auth-form-container">
          <div className="auth-illustration">
            <div className="auth-icon">
              <User size={32} />
            </div>
            <p className="auth-subtitle">
              {isLogin
                ? "Sign in to access your 2FA codes"
                : "Join us to start managing your 2FA codes securely"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="form-group">
                <label className="form-label">
                  <User size={16} />
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input auth-input"
                  placeholder="Enter your full name"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                <Mail size={16} />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="form-input auth-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={16} />
                Password
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input auth-input password-input"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="form-group">
                <label className="form-label">
                  <Lock size={16} />
                  Confirm Password
                </label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input auth-input password-input"
                    placeholder="Confirm your password"
                    required={!isLogin}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}

            <button
              type="submit"
              className={`btn btn-primary btn-auth ${
                isLoading ? "loading" : ""
              }`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-spinner" />
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <button
              type="button"
              className="auth-mode-toggle"
              onClick={toggleMode}
            >
              <ArrowLeft size={16} />
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
