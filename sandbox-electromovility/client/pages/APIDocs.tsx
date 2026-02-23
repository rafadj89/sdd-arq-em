import Layout from "@/components/Layout";
import { ChevronDown, Copy } from "lucide-react";
import { useState } from "react";

const APIDocs = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>("environments");
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>("versions-get");

  const baseUrl = "https://ocpi.staging.upme.gov.co";

  const environmentInfo = [
    {
      name: "Production",
      url: "https://ocpi.upme.gov.co",
      purpose: "Official transactional environment",
      type: "production",
    },
    {
      name: "Sandbox",
      url: "https://ocpi.staging.upme.gov.co",
      purpose: "Testing and development (current)",
      type: "sandbox",
    },
  ];

  const responseFormat = {
    description: "All API responses follow a standardized envelope format",
    structure: {
      data: "Main requested structure (Cardinality: 1 object, + array, ? optional)",
      status_code: "Internal OCPI response code (1000 = success)",
      status_message: "Optional explanatory text",
      timestamp: "ISO 8601 timestamp of response generation",
    },
    example: {
      data: {},
      status_code: 1000,
      status_message: "Success",
      timestamp: "2025-02-19T14:32:15Z",
    },
  };

  const endpoints = [
    {
      id: "versions-get",
      section: "Versions",
      method: "GET",
      path: "/api/versions",
      description: "List all supported API versions",
      auth: true,
      params: [],
      requestBody: null,
      response: {
        description: "Array of available versions",
        example: {
          data: [
            {
              version: "2.2.1",
              url: "https://ocpi.staging.upme.gov.co/api/2.2.1",
            },
          ],
          status_code: 1000,
          timestamp: "2025-02-19T14:32:15Z",
        },
      },
    },
    {
      id: "version-details-get",
      section: "Versions",
      method: "GET",
      path: "/api/{version}",
      description: "Get detailed endpoints for a specific version",
      auth: true,
      params: [{ name: "version", type: "path", required: true }],
      requestBody: null,
      response: {
        description: "Version details with module endpoints",
        example: {
          data: {
            version: "2.2.1",
            endpoints: [
              {
                identifier: "credentials",
                url: "https://ocpi.staging.upme.gov.co/api/2.2.1/credentials",
              },
              {
                identifier: "locations",
                url: "https://ocpi.staging.upme.gov.co/api/2.2.1/locations",
              },
            ],
          },
          status_code: 1000,
          timestamp: "2025-02-19T14:32:15Z",
        },
      },
    },
    {
      id: "credentials-get",
      section: "Credentials",
      method: "GET",
      path: "/api/{version}/credentials",
      description: "Retrieve details of current credentials",
      auth: true,
      params: [{ name: "version", type: "path", required: true }],
      requestBody: null,
      response: {
        description: "Current credentials information",
        example: {
          data: {
            token: "a12bcb34e5f6g7h8i9j0k1l2m3n4o5p6q7",
            url: "https://ocpi.staging.upme.gov.co/api/2.2.1",
            roles: [
              {
                role: "CPO",
                business_details: {
                  name: "Company Name",
                  website: "https://example.com",
                },
                party_id: "CO1",
                country_code: "CO",
              },
            ],
          },
          status_code: 1000,
          timestamp: "2025-02-19T14:32:15Z",
        },
      },
    },
    {
      id: "credentials-post",
      section: "Credentials",
      method: "POST",
      path: "/api/{version}/credentials",
      description: "Create new credentials for CPO integration",
      auth: true,
      params: [{ name: "version", type: "path", required: true }],
      requestBody: {
        description: "New credentials information",
        example: {
          token: "new_token_value",
          url: "https://cpo-backend.example.com/ocpi",
          roles: [
            {
              role: "CPO",
              business_details: {
                name: "My Charging Company",
                website: "https://mycompany.com",
                logo: "https://mycompany.com/logo.png",
              },
              party_id: "MC1",
              country_code: "CO",
            },
          ],
        },
      },
      response: {
        description: "New credentials confirmation",
        example: {
          data: {
            token: "new_generated_token",
            url: "https://ocpi.staging.upme.gov.co/api/2.2.1",
            roles: [],
          },
          status_code: 1000,
          status_message: "Credentials created successfully",
          timestamp: "2025-02-19T14:32:15Z",
        },
      },
      errors: [
        { code: "3001", http: 400, message: "Error connecting to CPO endpoint" },
        { code: "3003", http: 400, message: "Missing required endpoints" },
        { code: "405", http: 405, message: "CPO not registered or not authorized" },
      ],
    },
    {
      id: "credentials-delete",
      section: "Credentials",
      method: "DELETE",
      path: "/api/{version}/credentials",
      description: "Revoke or delete credentials",
      auth: true,
      params: [{ name: "version", type: "path", required: true }],
      requestBody: null,
      response: {
        description: "Deletion confirmation",
        example: {
          data: null,
          status_code: 1000,
          status_message: "Credentials deleted successfully",
          timestamp: "2025-02-19T14:32:15Z",
        },
      },
      errors: [
        { code: "405", http: 405, message: "CPO not registered" },
      ],
    },
    {
      id: "locations-get",
      section: "Locations",
      method: "GET",
      path: "/api/{version}/locations/{country_code}/{party_id}/{location_id}[/{evse_uid}][/{connector_id}]",
      description: "Retrieve charging location, EVSE, or connector details",
      auth: true,
      params: [
        { name: "version", type: "path", required: true },
        { name: "country_code", type: "path", required: true, example: "CO" },
        { name: "party_id", type: "path", required: true, example: "MC1" },
        { name: "location_id", type: "path", required: true, example: "LOC001" },
        { name: "evse_uid", type: "path", required: false, example: "EVSE001" },
        { name: "connector_id", type: "path", required: false, example: "CONN001" },
      ],
      requestBody: null,
      response: {
        description: "Location, EVSE, or Connector object",
        example: {
          data: {
            id: "LOC001",
            type: "ON_STREET",
            name: "Main Charging Station",
            address: "Carrera 7 #100-01",
            city: "Bogotá",
            postal_code: "110221",
            country: "CO",
            coordinates: {
              latitude: 4.6097,
              longitude: -74.0817,
            },
            evses: [
              {
                uid: "EVSE001",
                evse_id: "CO-MC1-EVSE001",
                status: "AVAILABLE",
                capabilities: ["CHARGING", "RESERVABLE"],
                connectors: [
                  {
                    id: "CONN001",
                    standard: "IEC_62196_T2",
                    format: "CABLE",
                    power_type: "AC",
                  },
                ],
              },
            ],
            operator: {
              name: "UPME",
              website: "https://www.upme.gov.co",
            },
          },
          status_code: 1000,
          timestamp: "2025-02-19T14:32:15Z",
        },
      },
    },
    {
      id: "locations-put",
      section: "Locations",
      method: "PUT",
      path: "/api/{version}/locations/{country_code}/{party_id}/{location_id}[/{evse_uid}][/{connector_id}]",
      description: "Create or replace a location, EVSE, or connector",
      auth: true,
      params: [
        { name: "version", type: "path", required: true },
        { name: "country_code", type: "path", required: true },
        { name: "party_id", type: "path", required: true },
        { name: "location_id", type: "path", required: true },
      ],
      requestBody: {
        description: "Complete Location, EVSE, or Connector object",
        example: {
          id: "LOC001",
          type: "ON_STREET",
          name: "Main Station",
          address: "Carrera 7 #100-01",
          city: "Bogotá",
          postal_code: "110221",
          country: "CO",
          coordinates: {
            latitude: 4.6097,
            longitude: -74.0817,
          },
          opening_times: {
            twentyfourseven: true,
          },
          evses: [],
          operator: { name: "UPME" },
          chargepoint_operator: { name: "Company Name" },
        },
      },
      response: {
        description: "Confirmation of creation/replacement",
        example: {
          data: null,
          status_code: 1000,
          status_message: "Location created/updated successfully",
          timestamp: "2025-02-19T14:32:15Z",
        },
      },
    },
    {
      id: "locations-patch",
      section: "Locations",
      method: "PATCH",
      path: "/api/{version}/locations/{country_code}/{party_id}/{location_id}[/{evse_uid}][/{connector_id}]",
      description: "Partially update a location, EVSE, or connector",
      auth: true,
      params: [
        { name: "version", type: "path", required: true },
        { name: "country_code", type: "path", required: true },
        { name: "party_id", type: "path", required: true },
        { name: "location_id", type: "path", required: true },
      ],
      requestBody: {
        description: "Subset of fields to update",
        example: {
          name: "Updated Station Name",
          evses: [
            {
              uid: "EVSE001",
              status: "CHARGING",
            },
          ],
        },
      },
      response: {
        description: "Confirmation of partial update",
        example: {
          data: null,
          status_code: 1000,
          status_message: "Location partially updated",
          timestamp: "2025-02-19T14:32:15Z",
        },
      },
    },
    {
      id: "tariffs-get",
      section: "Tariffs",
      method: "GET",
      path: "/api/{version}/tariffs/{country_code}/{party_id}/{tariff_id}",
      description: "Retrieve tariff information",
      auth: true,
      params: [
        { name: "version", type: "path", required: true },
        { name: "country_code", type: "path", required: true },
        { name: "party_id", type: "path", required: true },
        { name: "tariff_id", type: "path", required: true },
      ],
      requestBody: null,
      response: {
        description: "Tariff object",
        example: {
          data: {
            id: "TAR001",
            currency: "COP",
            type: "PROFILE_CHEAP",
            display_text: "Off-peak Tariff",
            start_date_time: "2025-01-01T00:00:00Z",
            end_date_time: "2025-12-31T23:59:59Z",
            elements: [
              {
                price_components: [
                  {
                    type: "ENERGY",
                    price: 500,
                    step_size: 1,
                  },
              ],
                restrictions: {
                  start_time: "22:00",
                  end_time: "06:00",
                  day_of_week: ["MON", "TUE", "WED", "THU", "FRI"],
                },
              },
            ],
          },
          status_code: 1000,
          timestamp: "2025-02-19T14:32:15Z",
        },
      },
    },
    {
      id: "tariffs-put",
      section: "Tariffs",
      method: "PUT",
      path: "/api/{version}/tariffs/{country_code}/{party_id}/{tariff_id}",
      description: "Create or update a tariff",
      auth: true,
      params: [
        { name: "version", type: "path", required: true },
        { name: "country_code", type: "path", required: true },
        { name: "party_id", type: "path", required: true },
        { name: "tariff_id", type: "path", required: true },
      ],
      requestBody: {
        description: "Complete Tariff object",
        example: {
          id: "TAR001",
          currency: "COP",
          type: "PROFILE_CHEAP",
          elements: [
            {
              price_components: [
                {
                  type: "ENERGY",
                  price: 500,
                  step_size: 1,
                },
              ],
            },
          ],
        },
      },
      response: {
        description: "Confirmation of creation/update",
        example: {
          data: null,
          status_code: 1000,
          status_message: "Tariff created/updated successfully",
          timestamp: "2025-02-19T14:32:15Z",
        },
      },
    },
    {
      id: "tariffs-patch",
      section: "Tariffs",
      method: "PATCH",
      path: "/api/{version}/tariffs/{country_code}/{party_id}/{tariff_id}",
      description: "Partially update a tariff",
      auth: true,
      params: [
        { name: "version", type: "path", required: true },
        { name: "country_code", type: "path", required: true },
        { name: "party_id", type: "path", required: true },
        { name: "tariff_id", type: "path", required: true },
      ],
      requestBody: {
        description: "Subset of fields to update",
        example: {
          type: "PROFILE_PEAK",
          display_text: "Updated tariff name",
        },
      },
      response: {
        description: "Confirmation of partial update",
        example: {
          data: null,
          status_code: 1000,
          status_message: "Tariff partially updated",
          timestamp: "2025-02-19T14:32:15Z",
        },
      },
    },
    {
      id: "tariffs-delete",
      section: "Tariffs",
      method: "DELETE",
      path: "/api/{version}/tariffs/{country_code}/{party_id}/{tariff_id}",
      description: "Delete a tariff",
      auth: true,
      params: [
        { name: "version", type: "path", required: true },
        { name: "country_code", type: "path", required: true },
        { name: "party_id", type: "path", required: true },
        { name: "tariff_id", type: "path", required: true },
      ],
      requestBody: null,
      response: {
        description: "Confirmation of deletion",
        example: {
          data: null,
          status_code: 1000,
          status_message: "Tariff deleted successfully",
          timestamp: "2025-02-19T14:32:15Z",
        },
      },
      errors: [
        { code: "405", http: 405, message: "Tariff not registered in the system" },
      ],
    },
  ];

  const statusCodes = [
    { code: 1000, title: "Success", description: "Request processed successfully" },
    { code: 2000, title: "Created", description: "Resource created successfully" },
    { code: 2001, title: "Accepted", description: "Request accepted for processing" },
    { code: 3000, title: "Bad Request", description: "Invalid request format or missing required fields" },
    { code: 3001, title: "Connection Error", description: "Error connecting to CPO endpoint" },
    { code: 3003, title: "Incomplete Request", description: "Missing required endpoints or data" },
    { code: 3005, title: "Invalid Data", description: "Request data validation failed" },
    { code: 4001, title: "Unauthorized", description: "Invalid or missing authentication token" },
    { code: 405, title: "Not Allowed", description: "CPO not registered or not authorized" },
  ];

  const groupedEndpoints = endpoints.reduce(
    (acc, endpoint) => {
      if (!acc[endpoint.section]) {
        acc[endpoint.section] = [];
      }
      acc[endpoint.section].push(endpoint);
      return acc;
    },
    {} as Record<string, typeof endpoints>
  );

  const CodeBlock = ({ code }: { code: any }) => (
    <div className="bg-background border border-border rounded-lg p-4 font-mono text-sm text-foreground overflow-x-auto">
      <pre>{JSON.stringify(code, null, 2)}</pre>
    </div>
  );

  return (
    <Layout>
      <div className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              OCPI 2.2.1 API Documentation
            </h1>
            <p className="text-lg text-muted-foreground">
              Complete REST API specification for UPME Sandbox environment
            </p>
          </div>

          {/* Environments Section */}
          <div className="mb-12 p-6 rounded-xl bg-card border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Environments & Routing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {environmentInfo.map((env) => (
                <div
                  key={env.url}
                  className={`p-6 rounded-lg border ${
                    env.type === "sandbox"
                      ? "border-secondary/50 bg-secondary/5"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <h3 className="font-semibold text-foreground mb-2">
                    {env.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {env.purpose}
                  </p>
                  <div className="bg-background border border-border rounded p-3 font-mono text-xs text-foreground flex items-center justify-between gap-2">
                    <span>{env.url}</span>
                    <button className="p-1 hover:bg-muted rounded">
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Authentication */}
          <div className="mb-12 p-6 rounded-xl bg-card border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Authentication
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  Authorization Header
                </h3>
                <p className="text-muted-foreground mb-3">
                  All requests must include a standard HTTP Authorization header with the Token directive and Base64-encoded string:
                </p>
                <CodeBlock code={{ Authorization: "Token [Base64EncodedToken]" }} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">Example</h3>
                <CodeBlock code={{ Authorization: "Token ZWJmM2IzOTkt..." }} />
              </div>
            </div>
          </div>

          {/* Response Format */}
          <div className="mb-12 p-6 rounded-xl bg-card border border-border">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Standardized Response Format
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  Response Envelope (application/json)
                </h3>
                <div className="space-y-3">
                  {Object.entries(responseFormat.structure).map(([key, value]) => (
                    <div key={key} className="border-l-2 border-primary pl-4">
                      <p className="font-mono font-semibold text-primary">{key}</p>
                      <p className="text-sm text-muted-foreground">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-3">
                  Example Response
                </h3>
                <CodeBlock code={responseFormat.example} />
              </div>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              API Endpoints
            </h2>
            <div className="space-y-4">
              {Object.entries(groupedEndpoints).map(([section, sectionEndpoints]) => (
                <div key={section}>
                  <div
                    className="p-6 rounded-lg border border-border bg-muted/20 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === section ? null : section
                      )
                    }
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-foreground">
                        {section} Module
                      </h3>
                      <span className="text-sm font-medium text-muted-foreground">
                        {sectionEndpoints.length} endpoint{sectionEndpoints.length !== 1 ? "s" : ""}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground transition-transform ${
                          expandedSection === section ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {expandedSection === section && (
                    <div className="space-y-4 mt-4">
                      {sectionEndpoints.map((endpoint) => (
                        <div
                          key={endpoint.id}
                          className="border border-border rounded-xl overflow-hidden bg-card"
                        >
                          <button
                            onClick={() =>
                              setExpandedEndpoint(
                                expandedEndpoint === endpoint.id ? null : endpoint.id
                              )
                            }
                            className="w-full p-6 hover:bg-muted/30 transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4 flex-1 text-left">
                              <span
                                className={`px-3 py-1 rounded-lg font-semibold text-sm text-white ${
                                  endpoint.method === "GET"
                                    ? "bg-blue-500"
                                    : endpoint.method === "POST"
                                      ? "bg-green-500"
                                      : endpoint.method === "PUT"
                                        ? "bg-amber-500"
                                        : endpoint.method === "PATCH"
                                          ? "bg-purple-500"
                                          : "bg-red-500"
                                }`}
                              >
                                {endpoint.method}
                              </span>
                              <div className="flex-1">
                                <p className="font-mono font-semibold text-foreground text-sm break-all">
                                  {endpoint.path}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {endpoint.description}
                                </p>
                              </div>
                            </div>
                            <ChevronDown
                              className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${
                                expandedEndpoint === endpoint.id ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {expandedEndpoint === endpoint.id && (
                            <div className="border-t border-border p-6 bg-muted/20 space-y-6">
                              {/* Path Parameters */}
                              {endpoint.params.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-foreground mb-3">
                                    Parameters
                                  </h4>
                                  <div className="space-y-2">
                                    {endpoint.params.map((param) => (
                                      <div
                                        key={param.name}
                                        className="text-sm bg-background p-3 rounded-lg border border-border"
                                      >
                                        <div className="flex items-center gap-2 mb-1">
                                          <code className="font-mono text-primary font-semibold">
                                            {param.name}
                                          </code>
                                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                            {param.type}
                                          </span>
                                          {param.required ? (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                                              required
                                            </span>
                                          ) : (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                                              optional
                                            </span>
                                          )}
                                        </div>
                                        {param.example && (
                                          <p className="text-xs text-muted-foreground">
                                            Example: <code className="text-foreground">{param.example}</code>
                                          </p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Request Body */}
                              {endpoint.requestBody && (
                                <div>
                                  <h4 className="font-semibold text-foreground mb-3">
                                    Request Body
                                  </h4>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {endpoint.requestBody.description}
                                  </p>
                                  <CodeBlock code={endpoint.requestBody.example} />
                                </div>
                              )}

                              {/* Response */}
                              <div>
                                <h4 className="font-semibold text-foreground mb-3">
                                  Response (200 OK)
                                </h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {endpoint.response.description}
                                </p>
                                <CodeBlock code={endpoint.response.example} />
                              </div>

                              {/* Error Codes */}
                              {endpoint.errors && endpoint.errors.length > 0 && (
                                <div>
                                  <h4 className="font-semibold text-foreground mb-3">
                                    Error Codes
                                  </h4>
                                  <div className="space-y-2">
                                    {endpoint.errors.map((error) => (
                                      <div
                                        key={error.code}
                                        className="text-sm bg-destructive/5 border border-destructive/20 p-3 rounded-lg"
                                      >
                                        <div className="flex items-center gap-2">
                                          <code className="font-mono font-semibold text-destructive">
                                            {error.code}
                                          </code>
                                          <span className="text-xs font-medium text-muted-foreground">
                                            HTTP {error.http}
                                          </span>
                                        </div>
                                        <p className="text-muted-foreground mt-1">
                                          {error.message}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status Codes Reference */}
          <div className="mb-12 p-6 rounded-xl border border-border bg-card">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Status Codes Reference
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {statusCodes.map((status) => (
                <div
                  key={status.code}
                  className="p-4 border border-border rounded-lg bg-muted/30"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <code className="font-mono font-bold text-primary">
                      {status.code}
                    </code>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {status.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {status.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rate Limiting */}
          <div className="p-6 rounded-xl border border-border bg-card">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Rate Limiting (Sandbox)
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">Limit:</strong> 10 requests per minute per API key
              </p>
              <p>
                <strong className="text-foreground">Window:</strong> Rolling 60-second window
              </p>
              <p>
                <strong className="text-foreground">Response Header:</strong> X-RateLimit-Remaining
              </p>
              <p>
                <strong className="text-foreground">Exceeded Response:</strong> HTTP 429 with status_code 3009
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default APIDocs;
