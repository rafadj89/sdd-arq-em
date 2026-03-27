# Scaffolding — Servicio Backend Go

## Estructura del Proyecto

```
service-name/
├── cmd/
│   └── server/
│       └── main.go              # Entrypoint, DI, graceful shutdown
├── internal/
│   ├── config/
│   │   └── config.go            # Env-based config (12-Factor), OCI Vault
│   ├── domain/
│   │   ├── models.go            # Domain models (OCPI entities)
│   │   ├── events.go            # Domain events
│   │   └── errors.go            # Domain-specific errors
│   ├── ports/
│   │   ├── inbound.go           # Service interfaces (use cases)
│   │   └── outbound.go          # Repository/external service interfaces
│   ├── adapters/
│   │   ├── http/
│   │   │   ├── router.go        # Chi router setup
│   │   │   ├── handlers.go      # HTTP handlers
│   │   │   ├── middleware.go     # Auth, logging, correlation ID
│   │   │   └── responses.go     # Standard response helpers (RFC 9457)
│   │   ├── kafka/
│   │   │   ├── producer.go      # Kafka producer with idempotency
│   │   │   └── consumer.go      # Kafka consumer with DLQ handling
│   │   ├── database/
│   │   │   ├── postgres.go      # pgx connection pool
│   │   │   └── migrations/      # SQL migrations (golang-migrate)
│   │   ├── redis/
│   │   │   └── cache.go         # Redis client with circuit breaker
│   │   └── cargame/
│   │       └── client.go        # Cárgame API client (VPN, circuit breaker)
│   └── service/
│       └── service.go           # Business logic implementation
├── pkg/
│   ├── observability/
│   │   ├── tracing.go           # OpenTelemetry setup
│   │   ├── metrics.go           # Prometheus metrics (RED)
│   │   └── logging.go           # Structured JSON logging (slog)
│   └── middleware/
│       └── correlation.go       # X-Correlation-ID propagation
├── api/
│   └── openapi.yaml             # OpenAPI 3.1 contract
├── deployments/
│   ├── Dockerfile               # Multi-stage build
│   ├── helm/                    # Helm chart
│   └── terraform/               # Service-specific Terraform
├── tests/
│   ├── integration/             # Integration tests (testcontainers)
│   └── load/                    # k6 load tests
├── go.mod
├── go.sum
├── Makefile
└── README.md
```

---

## Patrones de Código

### main.go — Graceful Shutdown + DI

```go
package main

import (
    "context"
    "log/slog"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

func main() {
    logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
        Level: slog.LevelInfo,
    }))
    slog.SetDefault(logger)

    cfg, err := config.Load()
    if err != nil {
        slog.Error("failed to load config", "error", err)
        os.Exit(1)
    }

    // Initialize dependencies
    db, err := database.NewPool(cfg.DatabaseURL)
    if err != nil {
        slog.Error("failed to connect to database", "error", err)
        os.Exit(1)
    }
    defer db.Close()

    redisClient := redis.NewClient(cfg.RedisURL)
    defer redisClient.Close()

    kafkaProducer := kafka.NewProducer(cfg.KafkaBrokers)
    defer kafkaProducer.Close()

    // OpenTelemetry
    shutdown, err := observability.InitTracing(cfg.OTLPEndpoint, "ingesta-service")
    if err != nil {
        slog.Error("failed to init tracing", "error", err)
        os.Exit(1)
    }
    defer shutdown(context.Background())

    // Hexagonal: build service + router
    svc := service.New(db, redisClient, kafkaProducer)
    router := httpAdapter.NewRouter(svc, logger)

    server := &http.Server{
        Addr:         ":" + cfg.Port,
        Handler:      router,
        ReadTimeout:  30 * time.Second,
        WriteTimeout: 30 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // Graceful shutdown
    ctx, cancel := signal.NotifyContext(context.Background(),
        os.Interrupt, syscall.SIGTERM)
    defer cancel()

    go func() {
        slog.Info("server starting", "port", cfg.Port)
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            slog.Error("server error", "error", err)
            cancel()
        }
    }()

    <-ctx.Done()
    slog.Info("shutting down gracefully")
    shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 15*time.Second)
    defer shutdownCancel()
    if err := server.Shutdown(shutdownCtx); err != nil {
        slog.Error("shutdown error", "error", err)
    }
}
```

### Middleware Chain

```go
func NewRouter(svc ports.IngestService, logger *slog.Logger) http.Handler {
    r := chi.NewRouter()

    r.Use(middleware.RequestID)
    r.Use(middleware.CorrelationID)
    r.Use(middleware.StructuredLogger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.Timeout(30 * time.Second))

    // Health (no auth)
    r.Get("/health", handlers.Health)
    r.Get("/ready", handlers.Ready(svc))

    // OCPI endpoints (auth via API Gateway)
    r.Route("/ocpi/2.2.1", func(r chi.Router) {
        r.Put("/locations", handlers.UpdateLocations(svc))
        r.Put("/sessions", handlers.UpdateSessions(svc))
        r.Post("/cdrs", handlers.CreateCDR(svc))
    })

    return r
}
```

### Hexagonal — Ports

```go
// ports/inbound.go
type IngestService interface {
    UpdateLocation(ctx context.Context, cpoID string, loc *domain.LocationUpdate) error
    UpdateSession(ctx context.Context, cpoID string, sess *domain.SessionUpdate) error
    CreateCDR(ctx context.Context, cpoID string, cdr *domain.CDRCreate) error
    Health(ctx context.Context) error
}

// ports/outbound.go
type LocationRepository interface {
    Upsert(ctx context.Context, loc *domain.Location) error
    GetByID(ctx context.Context, id string) (*domain.Location, error)
}

type EventPublisher interface {
    Publish(ctx context.Context, topic string, event domain.Event) error
}

type CPOValidator interface {
    IsActive(ctx context.Context, cpoID string) (bool, error)
}

type CacheStore interface {
    Get(ctx context.Context, key string) ([]byte, error)
    Set(ctx context.Context, key string, value []byte, ttl time.Duration) error
    Delete(ctx context.Context, key string) error
}
```

### Kafka Producer con Idempotencia

```go
func (p *Producer) Publish(ctx context.Context, topic string, event domain.Event) error {
    span := trace.SpanFromContext(ctx)
    defer span.End()

    payload, err := proto.Marshal(event.ToProto())
    if err != nil {
        return fmt.Errorf("marshal event: %w", err)
    }

    msg := &kafka.Message{
        TopicPartition: kafka.TopicPartition{Topic: &topic, Partition: kafka.PartitionAny},
        Key:   []byte(event.AggregateID()),  // Partition by CPO ID
        Value: payload,
        Headers: []kafka.Header{
            {Key: "correlation_id", Value: []byte(middleware.CorrelationIDFromCtx(ctx))},
            {Key: "idempotency_key", Value: []byte(event.RequestID())},
            {Key: "trace_id", Value: []byte(span.SpanContext().TraceID().String())},
        },
    }
    return p.producer.Produce(msg, nil)
}
```

### Redis Cache-Aside con Circuit Breaker

```go
func (c *Cache) GetOrFetch(ctx context.Context, key string, ttl time.Duration, fetch func() ([]byte, error)) ([]byte, error) {
    if val, err := c.client.Get(ctx, key).Bytes(); err == nil {
        metrics.CacheHit.Inc()
        return val, nil
    }
    metrics.CacheMiss.Inc()

    val, err := fetch()
    if err != nil {
        return nil, err
    }

    if err := c.client.Set(ctx, key, val, ttl).Err(); err != nil {
        slog.Warn("cache set failed", "key", key, "error", err)
    }
    return val, nil
}
```

---

## Dockerfile

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /server ./cmd/server

FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
COPY --from=builder /server /server
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/server"]
```

## Makefile

```makefile
.PHONY: build test lint run docker-build migrate

build:
	go build -o bin/server ./cmd/server

test:
	go test ./... -v -race -coverprofile=coverage.out

test-integration:
	go test ./tests/integration/... -v -tags=integration

lint:
	golangci-lint run ./...

run:
	go run ./cmd/server

docker-build:
	docker build -t $(SERVICE_NAME):$(VERSION) .

migrate-up:
	migrate -path internal/adapters/database/migrations -database $(DATABASE_URL) up

migrate-down:
	migrate -path internal/adapters/database/migrations -database $(DATABASE_URL) down 1
```

## Dependencias Clave

| Paquete | Propósito |
|---------|-----------|
| `github.com/go-chi/chi/v5` | HTTP router |
| `github.com/jackc/pgx/v5` | PostgreSQL driver (pgx pool) |
| `github.com/confluentinc/confluent-kafka-go/v2` | Kafka producer/consumer |
| `github.com/redis/go-redis/v9` | Redis client |
| `go.opentelemetry.io/otel` | OpenTelemetry SDK |
| `github.com/prometheus/client_golang` | Prometheus metrics |
| `log/slog` (stdlib) | Structured logging |
| `github.com/stretchr/testify` | Test assertions |
| `github.com/testcontainers/testcontainers-go` | Integration tests |
| `github.com/golang-migrate/migrate/v4` | Database migrations |
