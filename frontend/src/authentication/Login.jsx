import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "../utils/axiosConfig";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("registered") === "1") {
      setSuccessMessage("Registration successful. Please check your email and verify your account before logging in.");
    }
    if (params.get("verified") === "1") {
      const message = params.get("message");
      if (message === "already_verified") {
        setSuccessMessage("Your email is already verified. You can log in now.");
      } else {
        setSuccessMessage("Email verified successfully! You can now log in.");
      }
    }
    if (params.get("error") === "invalid_verification_link") {
      setErrors({ general: "Invalid or expired verification link. Please request a new one." });
    }
  }, [location]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = ["Email is required"];
    } else if (!formData.email.endsWith("@student.laverdad.edu.ph")) {
      newErrors.email = ["Only @student.laverdad.edu.ph emails are allowed"];
    }
    if (!formData.password) {
      newErrors.password = ["Password is required"];
    } else if (formData.password.length < 8) {
      newErrors.password = ["Password must be at least 8 characters"];
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/login", {
        email: formData.email,
        password: formData.password,
      });

      // Store token securely
      const token = response.data.token;
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_email", formData.email);
      localStorage.setItem("user_name", response.data.user.name);

      // Get user role from response
      const userRole = response.data.user?.role || 'user';
      localStorage.setItem("user_role", userRole);

      // Show success message
      setSuccessMessage("Welcome back to La Verdad Herald!");

      // Redirect based on user role after a brief delay
      setTimeout(() => {
        if (userRole === "admin") {
          navigate("/admin");
        } else if (userRole === "moderator") {
          navigate("/moderator");
        } else {
          navigate("/home");
        }
      }, 1500);
    } catch (error) {
      const msg = error.response?.data?.errors?.email?.[0] || error.response?.data?.message || '';
      const needsVerification = msg.toLowerCase().includes('verify');
      if (needsVerification) {
        setErrors({ ...error.response?.data?.errors, general: msg || 'Please verify your email before logging in.' });
        setShowResendVerification(true);
        setResendEmail(formData.email);
      } else if (error.response && error.response.status === 403 && error.response.data?.requires_verification) {
        setErrors({ general: error.response.data.message });
        setShowResendVerification(true);
        setResendEmail(formData.email);
      } else if (error.response && error.response.status === 401) {
        setErrors({ general: "Invalid email or password. Please try again." });
      } else if (error.response && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else if (error.response && error.response.data.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: "An error occurred. Please try again later." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      await axios.post("/api/email/resend-verification", { email: resendEmail });
      setSuccessMessage("Verification email sent! Please check your inbox.");
      setShowResendVerification(false);
      setErrors({});
    } catch (error) {
      setErrors({ general: "Failed to resend verification email. Please try again." });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h2 className="mb-1 text-center text-4xl py-5 font-serif text-gray-800">
          Login
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-gray-700 text-left"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoComplete="email"
              autoFocus
              placeholder="Enter your email"
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email[0]}</p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700 text-left"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onPaste={(e) => e.preventDefault()}
                required
                placeholder="Enter your Password"
                autoComplete="current-password"
                className="w-full rounded-md border border-gray-300 px-4 py-2 pr-10 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password[0]}</p>
            )}
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={formData.remember}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
              />
              <label
                htmlFor="remember"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </Link>
          </div>

          {errors.general && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800 text-center">{errors.general}</p>
            </div>
          )}

          {showResendVerification && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800 text-center mb-2">
                Need a new verification link?
              </p>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full rounded-md bg-yellow-600 px-4 py-2 text-white text-sm hover:bg-yellow-700 disabled:opacity-50"
              >
                {isResending ? "Sending..." : "Resend Verification Email"}
              </button>
            </div>
          )}

          {successMessage && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800 text-center">
                {successMessage}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-70 rounded-2xl bg-cyan-700 px-4 py-2 text-white font-bold  hover:bg-cyan-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Signing In..." : "Log in"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
