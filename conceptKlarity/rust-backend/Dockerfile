# Multi-stage Dockerfile for rust-backend
# Builder stage: builds a release binary with the Rust toolchain
FROM rust:1.71 AS builder
WORKDIR /usr/src/app

# Cache dependencies: copy Cargo files first so Docker can cache expensive crate downloads
COPY Cargo.toml Cargo.lock ./
# Provide a dummy main so `cargo build` will populate the cargo registry/cache layer
RUN mkdir -p src && echo "fn main() { println!(\"dummy\"); }" > src/main.rs
RUN cargo build --release || true

# Copy the full source and build the real binary
COPY . .

# Install system deps required by some crates (e.g., OpenSSL) and strip utility
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates build-essential pkg-config libssl-dev binutils \
  && rm -rf /var/lib/apt/lists/*

RUN cargo build --release

# Reduce binary size where possible (strip symbols). If strip is unavailable this will be a no-op.
RUN strip target/release/rust_backend_mvp || true


# Runtime image: minimal, contains only the compiled binary and necessary certs
FROM debian:bullseye-slim AS runtime

# Create a non-root user for safer runtime
RUN groupadd -r app && useradd -r -g app app

# Install CA certs so TLS works if needed (kept very small)
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy only the release binary from the builder stage
COPY --from=builder /usr/src/app/target/release/rust_backend_mvp /usr/local/bin/rust_backend_mvp
RUN chown app:app /usr/local/bin/rust_backend_mvp

USER app

# Runtime configuration: application reads `PORT` and other env vars at startup
ENV PORT=8080
# Bind port used by the Actix server
EXPOSE 8080

# Final command: run the compiled binary (no cargo or sources in final image)
ENTRYPOINT ["/usr/local/bin/rust_backend_mvp"]
