import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X, LogOut, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const navLinks = [
    { href: "/", label: "Home" },
    ...(isAuthenticated ? [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/api-docs", label: "API Docs" },
    ] : []),
    { href: "/about", label: "About" },
  ];

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center transform group-hover:scale-105 transition-transform">
                <span className="text-white font-bold text-lg">⚡</span>
              </div>
              <span className="font-bold text-lg text-foreground hidden sm:inline">
                UPME Sandbox
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "text-primary border-b-2 border-primary pb-1"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth Buttons / User Menu */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated && user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium text-foreground">
                      {user.username}
                    </span>
                  </button>

                  {/* User Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg py-2">
                      <div className="px-4 py-2 border-b border-border">
                        <p className="text-xs text-muted-foreground">Logged in as</p>
                        <p className="font-semibold text-foreground">{user.company_name}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Register
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {menuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-border pt-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "block px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(link.href)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-2 text-sm">
                      <p className="text-xs text-muted-foreground">Logged in as</p>
                      <p className="font-semibold text-foreground">{user?.username}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-sm font-medium text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/10 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="w-full px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg text-center hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="w-full px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg text-center hover:bg-primary/90 transition-colors"
                    >
                      Register
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">⚡</span>
                </div>
                <span className="font-bold text-foreground">UPME Sandbox</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Official Electromobility Sandbox for CPO integration testing and
                validation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-foreground">
                Product
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/" className="hover:text-primary transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-primary transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-primary transition-colors">
                    API Reference
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-foreground">
                Company
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/about" className="hover:text-primary transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-primary transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-primary transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-foreground">
                Legal
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/" className="hover:text-primary transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link to="/" className="hover:text-primary transition-colors">
                    Terms
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
            <p>
              © 2025 UPME. Resolution 40559 - Sandbox for CPO Integration
              Testing.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
