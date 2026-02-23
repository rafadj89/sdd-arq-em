import Layout from "@/components/Layout";
import { CheckCircle, Zap, Shield, Gauge } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <Layout>
      <div className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              About UPME Sandbox
            </h1>
            <p className="text-xl text-muted-foreground">
              An official testing environment mandated by Resolution 40559 of
              2025
            </p>
          </div>

          {/* Resolution Info */}
          <div className="p-8 rounded-xl border border-primary/20 bg-primary/5 mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Resolution 40559 Compliance
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              This sandbox environment is established in accordance with
              <strong> Resolution 40559 of 2025</strong>, issued by the
              Superintendencia de Servicios Públicos Domiciliarios (SSPD) and
              the Ministry of Mines and Energy. Article 5, Paragraph 4 explicitly
              mandates the implementation of a controlled testing environment as
              a prerequisite to official operation.
            </p>
          </div>

          {/* What is UPME Sandbox */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              What is UPME Sandbox?
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                The UPME Sandbox is a fully isolated, controlled testing
                environment designed specifically for Charge Point Operators
                (CPOs) to validate their charging infrastructure integrations
                before deploying to production.
              </p>
              <p>
                Rather than operating real charging stations and processing
                actual transactions, CPOs can test their systems against
                realistic OCPI 2.2.1 API specifications with immediate feedback
                on validation errors and integration issues.
              </p>
              <p>
                This environment ensures that all technical requirements are met
                before connecting to the national infrastructure, reducing
                operational risks and ensuring data quality in energy demand
                reporting.
              </p>
            </div>
          </div>

          {/* Key Objectives */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Key Objectives
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: Shield,
                  title: "Technical Risk Mitigation",
                  description:
                    "Validate API integrations before production to eliminate technical risks",
                },
                {
                  icon: Gauge,
                  title: "Schema Validation",
                  description:
                    "Ensure all data submissions comply with OCPI 2.2.1 standards",
                },
                {
                  icon: Zap,
                  title: "Rapid Development",
                  description:
                    "Quick feedback loops enable faster integration development cycles",
                },
                {
                  icon: CheckCircle,
                  title: "Compliance Assurance",
                  description:
                    "Demonstrate technical compliance to regulatory requirements",
                },
              ].map((objective, index) => {
                const IconComponent = objective.icon;
                return (
                  <div
                    key={index}
                    className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-all"
                  >
                    <IconComponent className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-semibold text-foreground mb-2">
                      {objective.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {objective.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technical Features */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Technical Features
            </h2>
            <div className="space-y-4">
              {[
                {
                  title: "Data Isolation",
                  description:
                    "Sandbox data is completely isolated from production. Test data is automatically purged after 24-48 hours.",
                },
                {
                  title: "Rate Limiting",
                  description:
                    "Fair usage policies (10 requests/minute) ensure service availability for all developers.",
                },
                {
                  title: "Mock Server",
                  description:
                    "Automatic responses based on OCPI 2.2.1 schema validation. See exactly what production will expect.",
                },
                {
                  title: "Transaction Logging",
                  description:
                    "Complete request/response history for debugging and validation verification.",
                },
                {
                  title: "API Key Management",
                  description:
                    "Generate, rotate, and revoke sandbox credentials independently from production.",
                },
                {
                  title: "JWT Token Support",
                  description:
                    "Test short-lived token authentication matching production security requirements.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-border bg-card"
                >
                  <h3 className="font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* OCPI Standards */}
          <div className="p-8 rounded-xl border border-border bg-card mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              OCPI 2.2.1 Compliance
            </h2>
            <p className="text-muted-foreground mb-6">
              All endpoints in the sandbox are compliant with the Open Charge
              Point Interface (OCPI) 2.2.1 specification. Supported modules
              include:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Locations - Charging station location data",
                "Tariffs - Pricing and billing information",
                "Sessions - Active charging sessions",
                "CDRs - Charge Detail Records for billing",
                "Tokens - Authentication and authorization",
                "Commands - Real-time station control",
              ].map((module, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{module}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Getting Started */}
          <div className="p-8 rounded-xl bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 border border-primary/20 text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Register your CPO and start testing your OCPI integration today
            </p>
            <Link
              to="/dashboard"
              className="inline-block px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
