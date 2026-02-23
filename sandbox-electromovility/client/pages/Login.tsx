import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, AlertCircle } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(username, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

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
            CPO Developer Portal - Sign In
          </p>
        </div>

        {/* Test Credentials Info */}
        <div className="mb-6 p-4 rounded-lg bg-secondary/10 border border-secondary/20">
          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2">
            Test Credentials
          </p>
          <div className="space-y-1 text-sm text-foreground font-mono">
            <p>
              <span className="text-muted-foreground">User:</span> sandbox-upme
            </p>
            <p>
              <span className="text-muted-foreground">Pass:</span> sandbox
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Username Field */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={isLoading}
              required
            />
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={isLoading}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !username || !password}
            className="w-full px-4 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 group"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin"></div>
                Signing in...
              </>
            ) : (
              <>
                Sign In
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

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Don't have an account?
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-6 py-3 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors"
          >
            Create Account
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 rounded-lg bg-muted/30 border border-border text-center">
          <p className="text-xs text-muted-foreground">
            Resolution 40559 Compliant OCPI 2.2.1 Sandbox Environment
          </p>
        </div>
      </div>
    </div>
  );
}
