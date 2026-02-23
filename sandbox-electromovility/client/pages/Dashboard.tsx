import { Link } from "react-router-dom";
import Layout from "@/components/Layout";
import {
  Copy,
  Eye,
  EyeOff,
  Plus,
  RotateCw,
  Trash2,
  ArrowRight,
  FileText,
  Settings,
  Key,
  Activity,
} from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const [showSecret, setShowSecret] = useState(false);
  const [apiKeys] = useState([
    {
      id: "key_1",
      name: "Production Key",
      clientId: "cpo_dev_001",
      clientSecret: "secret_xxxxx...",
      created: "2025-01-15",
      lastUsed: "2 hours ago",
      status: "active",
    },
    {
      id: "key_2",
      name: "Development Key",
      clientId: "cpo_dev_002",
      clientSecret: "secret_yyyyy...",
      created: "2025-01-10",
      lastUsed: "Never",
      status: "active",
    },
  ]);

  const [transactions] = useState([
    {
      id: "tx_1",
      endpoint: "PUT /ocpi/2.2.1/locations/123",
      method: "PUT",
      status: "success",
      statusCode: 201,
      timestamp: "2025-02-19 14:32:15",
      responseTime: "145ms",
    },
    {
      id: "tx_2",
      endpoint: "GET /ocpi/2.2.1/sessions/abc",
      method: "GET",
      status: "error",
      statusCode: 400,
      timestamp: "2025-02-19 14:20:08",
      responseTime: "87ms",
      error: "Missing required field: power",
    },
    {
      id: "tx_3",
      endpoint: "POST /auth/token",
      method: "POST",
      status: "success",
      statusCode: 200,
      timestamp: "2025-02-19 14:15:42",
      responseTime: "203ms",
    },
  ]);

  return (
    <Layout>
      <div className="py-12 px-4">
        <div className="container mx-auto">
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Welcome back, Developer
            </h1>
            <p className="text-muted-foreground">
              Manage your sandbox API credentials and monitor your integration
              tests
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
            {[
              {
                label: "API Keys",
                value: "2",
                icon: Key,
                color: "primary",
              },
              {
                label: "Requests This Month",
                value: "1,247",
                icon: Activity,
                color: "secondary",
              },
              {
                label: "Success Rate",
                value: "98.5%",
                icon: FileText,
                color: "primary",
              },
              {
                label: "Avg Response Time",
                value: "142ms",
                icon: Settings,
                color: "secondary",
              },
            ].map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-lg border border-border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </span>
                    <div
                      className={`p-2 rounded-lg ${
                        stat.color === "primary"
                          ? "bg-primary/10"
                          : "bg-secondary/10"
                      }`}
                    >
                      <IconComponent
                        className={`w-5 h-5 ${
                          stat.color === "primary"
                            ? "text-primary"
                            : "text-secondary"
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - API Keys Section */}
            <div className="lg:col-span-2 space-y-8">
              {/* API Keys Card */}
              <div className="p-8 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    API Credentials
                  </h2>
                  <button className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Generate New Key
                  </button>
                </div>

                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div
                      key={key.id}
                      className="p-4 border border-border rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {key.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created {key.created} • Last used {key.lastUsed}
                          </p>
                        </div>
                        <span className="px-2 py-1 text-xs font-medium bg-secondary/20 text-secondary rounded-full">
                          {key.status}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* Client ID */}
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                            Client ID
                          </label>
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border font-mono text-sm text-foreground">
                            <span className="flex-1">{key.clientId}</span>
                            <button
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title="Copy Client ID"
                            >
                              <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </button>
                          </div>
                        </div>

                        {/* Client Secret */}
                        <div>
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
                            Client Secret
                          </label>
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-background border border-border font-mono text-sm text-foreground">
                            <span className="flex-1">
                              {showSecret ? key.clientSecret : "••••••••••••••••"}
                            </span>
                            <button
                              onClick={() => setShowSecret(!showSecret)}
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title="Toggle visibility"
                            >
                              {showSecret ? (
                                <EyeOff className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              ) : (
                                <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                              )}
                            </button>
                            <button
                              className="p-1.5 hover:bg-muted rounded transition-colors"
                              title="Copy Secret"
                            >
                              <Copy className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                        <button className="px-3 py-1.5 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted transition-colors flex items-center gap-1">
                          <RotateCw className="w-4 h-4" />
                          Rotate
                        </button>
                        <button className="px-3 py-1.5 text-sm font-medium text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/10 transition-colors flex items-center gap-1">
                          <Trash2 className="w-4 h-4" />
                          Revoke
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Authentication Test Card */}
              <div className="p-8 rounded-xl border border-border bg-card">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  Quick Test
                </h3>
                <p className="text-muted-foreground mb-6">
                  Test your API credentials by obtaining a JWT token:
                </p>
                <button className="px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors">
                  Get JWT Token
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Links */}
              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Quick Links
                </h3>
                <div className="space-y-3">
                  <Link
                    to="/api-docs"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">
                        API Documentation
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                  <Link
                    to="/"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-secondary" />
                      <span className="font-medium text-foreground">
                        Code Examples
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                  <Link
                    to="/"
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">
                        Integration Guide
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="p-6 rounded-xl border border-border bg-card">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-2 text-sm">
                  {transactions.slice(0, 3).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-start gap-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          tx.status === "success"
                            ? "bg-secondary"
                            : "bg-destructive"
                        }`}
                      />
                      <div className="flex-1">
                        <p className="font-mono text-xs">{tx.endpoint}</p>
                        <p className="text-xs">{tx.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/"
                  className="mt-4 pt-4 border-t border-border text-primary font-medium text-sm flex items-center gap-1 hover:gap-2 transition-all group"
                >
                  View all transactions
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

          {/* Recent Transactions Section */}
          <div className="mt-12 p-8 rounded-xl border border-border bg-card">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Recent Transactions
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Endpoint
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Time
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Response
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                      Duration
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-foreground">
                        {tx.method}{" "}
                        <span className="text-muted-foreground">
                          {tx.endpoint.split(" ")[1]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                            tx.status === "success"
                              ? "bg-secondary/20 text-secondary"
                              : "bg-destructive/20 text-destructive"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              tx.status === "success"
                                ? "bg-secondary"
                                : "bg-destructive"
                            }`}
                          />
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {tx.timestamp}
                      </td>
                      <td className="px-4 py-3 font-mono text-foreground">
                        {tx.statusCode}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {tx.responseTime}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Link
              to="/"
              className="mt-6 inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all group"
            >
              View complete transaction logs
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
