# Scaffolding — Frontend React + TypeScript

## Estructura del Proyecto

```
portal/
├── src/
│   ├── app/
│   │   ├── routes/              # File-based routing
│   │   │   ├── _layout.tsx      # Root layout
│   │   │   ├── dashboard.tsx    # Admin dashboard
│   │   │   ├── stations/        # Station management
│   │   │   ├── cpos/            # CPO management
│   │   │   └── public/          # Public consultation
│   │   ├── layouts/
│   │   │   ├── admin-layout.tsx
│   │   │   └── public-layout.tsx
│   │   └── providers.tsx        # App providers (auth, query, theme)
│   ├── features/
│   │   ├── auth/                # KeyCloak OIDC
│   │   │   ├── hooks/use-auth.ts
│   │   │   ├── components/auth-guard.tsx
│   │   │   └── services/keycloak.ts
│   │   ├── dashboard/           # Admin dashboard
│   │   ├── stations/            # Station views
│   │   ├── cpos/                # CPO management
│   │   └── public/              # Public views (prices, map)
│   ├── shared/
│   │   ├── components/ui/       # shadcn/ui primitives
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   ├── api-client.ts    # Fetch wrapper with auth
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   └── config/env.ts
│   ├── main.tsx
│   └── index.css
├── tests/
│   ├── unit/
│   └── e2e/                     # Playwright
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Patrones de Código

### KeyCloak OIDC

```typescript
// features/auth/services/keycloak.ts
import Keycloak from "keycloak-js";

export const keycloak = new Keycloak({
  url: import.meta.env.VITE_KEYCLOAK_URL,
  realm: import.meta.env.VITE_KEYCLOAK_REALM,
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID,
});

// features/auth/hooks/use-auth.ts
export function useAuth() {
  const { keycloak, initialized } = useKeycloak();
  return {
    isAuthenticated: keycloak.authenticated ?? false,
    token: keycloak.token,
    hasRole: (role: string) => keycloak.hasRealmRole(role),
    login: () => keycloak.login(),
    logout: () => keycloak.logout(),
    initialized,
  };
}
```

### API Client con Auth Token

```typescript
// shared/lib/api-client.ts
async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (keycloak.isTokenExpired(30)) {
    await keycloak.updateToken(30);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(keycloak.token && { Authorization: `Bearer ${keycloak.token}` }),
      "X-Correlation-ID": crypto.randomUUID(),
      ...options.headers,
    },
  });

  if (!response.ok) throw new ApiError(await response.json());
  return response.json();
}

export const api = {
  stations: {
    list: (params?: StationFilters) =>
      apiClient<PaginatedResponse<Station>>(`/stations?${new URLSearchParams(params)}`),
    get: (id: string) => apiClient<Station>(`/stations/${id}`),
  },
  dashboard: {
    kpis: () => apiClient<DashboardKPIs>("/dashboard/kpis"),
  },
  public: {
    stations: (params?: Filters) =>
      apiClient<PaginatedResponse<PublicStation>>(`/public/v1/stations?${new URLSearchParams(params)}`),
  },
};
```

### TanStack Query

```typescript
export function useStations(filters?: StationFilters) {
  return useQuery({
    queryKey: ["stations", filters],
    queryFn: () => api.stations.list(filters),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
```

### App Providers

```typescript
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ReactKeycloakProvider authClient={keycloak} initOptions={{ onLoad: "check-sso", pkceMethod: "S256" }}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ReactKeycloakProvider>
  );
}
```

---

## Dependencias Clave

| Paquete | Propósito |
|---------|-----------|
| `react` (18) | UI framework |
| `typescript` | Type safety |
| `vite` | Build tool |
| `tailwindcss` (3) | Utility-first CSS |
| `@radix-ui/*` + `shadcn/ui` | Accessible components |
| `@tanstack/react-query` | Server state |
| `react-router-dom` (v7) | Routing |
| `keycloak-js` | KeyCloak OIDC |
| `recharts` o `visx` | Charts |
| `mapbox-gl` o `leaflet` | Maps |
| `zod` | Schema validation |
| `react-hook-form` | Forms |
| `i18next` | i18n (Spanish) |
| `playwright` | E2E testing |
| `vitest` | Unit testing |

## Accesibilidad y Performance

- WCAG 2.1 AA minimo (Radix UI = WAI-ARIA built-in)
- Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- Code splitting por ruta (React.lazy)
- Prefetch de rutas criticas
