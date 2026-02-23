import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import {
  Zap,
  Shield,
  Gauge,
  FileText,
  CheckCircle,
  ArrowRight,
  Code,
  Settings,
} from "lucide-react";

export default function Index() {
  const { isAuthenticated } = useAuth();

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-20 md:py-32 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Resolution 40559 Compliant
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 tracking-tight">
              CPO Integration Sandbox
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Official testing environment for Charge Point Operators. Validate
              your OCPI 2.2.1 integration before production deployment with
              complete API documentation and real-time validation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group"
                  >
                    Go to Dashboard
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/api-docs"
                    className="px-8 py-4 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    API Documentation
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group"
                  >
                    Create Account
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/login"
                    className="px-8 py-4 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-5 h-5" />
                    Sign In
                  </Link>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-secondary" />
                <span>OCPI 2.2.1 Compliant</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-secondary" />
                <span>Real-Time Validation</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-secondary" />
                <span>Instant Feedback</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Sandbox Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to test and validate your charging station
              integration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-xl border border-border bg-card hover:border-primary/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Auto-Registration & Onboarding
              </h3>
              <p className="text-muted-foreground">
                Quick self-service registration for CPO developers. Instant
                access to the sandbox without manual approval.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-xl border border-border bg-card hover:border-secondary/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors">
                <Shield className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                API Credentials Management
              </h3>
              <p className="text-muted-foreground">
                Generate and manage sandbox API keys and secrets. Rotate
                credentials securely with full audit trail.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-xl border border-border bg-card hover:border-primary/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Interactive API Documentation
              </h3>
              <p className="text-muted-foreground">
                Full OpenAPI 3.0+ specification with Swagger UI. Test endpoints
                directly from the browser.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-xl border border-border bg-card hover:border-secondary/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors">
                <Gauge className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Schema Validation & Mock Server
              </h3>
              <p className="text-muted-foreground">
                Automatic validation of requests against OCPI 2.2.1 schema.
                Accurate mock responses for all scenarios.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 rounded-xl border border-border bg-card hover:border-primary/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Code className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Transaction Logging
              </h3>
              <p className="text-muted-foreground">
                Complete request/response history. Debug integration issues with
                detailed transaction logs.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 rounded-xl border border-border bg-card hover:border-secondary/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-6 group-hover:bg-secondary/20 transition-colors">
                <Settings className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Rate Limiting & Isolation
              </h3>
              <p className="text-muted-foreground">
                Sandbox is fully isolated from production. Fair rate limiting
                ensures service for all developers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 md:py-32 px-4 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get your CPO integration tested in minutes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: 1,
                title: "Register",
                description:
                  "Create your developer account with company details",
              },
              {
                step: 2,
                title: "Generate Credentials",
                description: "Get your API keys for sandbox testing",
              },
              {
                step: 3,
                title: "Test Integration",
                description: "Use Swagger UI to test OCPI endpoints",
              },
              {
                step: 4,
                title: "Go Production",
                description:
                  "After validation, migrate to production environment",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {item.description}
                  </p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-8 -right-4 w-8 h-0.5 bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="p-12 md:p-16 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border border-primary/20">
            <div className="text-center">
              <h2 className="text-4xl font-bold text-foreground mb-4">
                Ready to Test Your Integration?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join the growing network of CPOs validating their charging
                station solutions in our sandbox environment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/dashboard"
                  className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 group"
                >
                  Start Testing Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/about"
                  className="px-8 py-4 border border-primary text-primary font-semibold rounded-lg hover:bg-primary/5 transition-colors"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
