import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, AlertCircle, CheckCircle } from "lucide-react";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    company_name: "",
    country_code: "CO",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.username || formData.username.length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }
    if (!formData.email || !formData.email.includes("@")) {
      setError("Please enter a valid email");
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!formData.company_name) {
      setError("Company name is required");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        company_name: formData.company_name,
        country_code: formData.country_code,
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
  const passwordsDontMatch = formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary mb-4">
            <span className="text-2xl font-bold text-white">⚡</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">UPME Sandbox</h1>
          <p className="text-muted-foreground mt-2">
            Create Your Developer Account
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Company Name */}
          <div>
            <label htmlFor="company_name" className="block text-sm font-medium text-foreground mb-2">
              Company Name
            </label>
            <input
              id="company_name"
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="Your company name"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={isLoading}
              required
            />
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username (min 3 chars)"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={isLoading}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@company.com"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={isLoading}
              required
            />
          </div>

          {/* Country Code */}
          <div>
            <label htmlFor="country_code" className="block text-sm font-medium text-foreground mb-2">
              Country
            </label>
            <select
              id="country_code"
              name="country_code"
              value={formData.country_code}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={isLoading}
            >
              <option value="CO">Colombia</option>
              <option value="MX">Mexico</option>
              <option value="AR">Argentina</option>
              <option value="BR">Brazil</option>
              <option value="CL">Chile</option>
              <option value="PE">Peru</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 6 characters"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={isLoading}
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                className={`w-full px-4 py-3 rounded-lg border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  passwordsDontMatch
                    ? "border-destructive focus:ring-destructive"
                    : passwordMatch
                      ? "border-secondary focus:ring-secondary"
                      : "border-border focus:ring-primary"
                }`}
                disabled={isLoading}
                required
              />
              {passwordMatch && (
                <CheckCircle className="absolute right-3 top-3.5 w-5 h-5 text-secondary" />
              )}
              {passwordsDontMatch && (
                <AlertCircle className="absolute right-3 top-3.5 w-5 h-5 text-destructive" />
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !formData.username || !formData.email || !formData.password || !formData.company_name}
            className="w-full px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></div>
                Creating Account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-border"></div>
          <span className="text-xs text-muted-foreground uppercase">or</span>
          <div className="flex-1 h-px bg-border"></div>
        </div>

        {/* Sign In Link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Already have an account?
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border text-center">
          <p className="text-xs text-muted-foreground">
            By registering, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
