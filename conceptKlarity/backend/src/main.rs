use axum::{extract::{State, Query}, http::StatusCode, response::IntoResponse, routing::{get, post}, Json, Router};
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;
use std::{env, net::SocketAddr, sync::{Arc, Mutex}};
use tower_http::cors::{Any, CorsLayer};

#[derive(Clone)]
struct AppState {
    products: Arc<Mutex<Vec<Product>>>,
    pool: Option<PgPool>,
}

#[derive(Serialize, Deserialize, Clone, sqlx::FromRow)]
struct Product {
    id: u64,
    name: String,
    price: u64,
    description: Option<String>,
}

#[derive(Deserialize)]
struct CreateProduct {
    name: String,
    price: u64,
    description: Option<String>,
}

/// API-level errors converted into structured JSON responses
enum ApiError {
    BadRequest(String),
    NotFound(String),
    Internal(anyhow::Error),
}

impl IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        match self {
            ApiError::BadRequest(msg) => {
                let body = Json(json!({ "error": msg }));
                (StatusCode::BAD_REQUEST, body).into_response()
            }
            ApiError::NotFound(msg) => {
                let body = Json(json!({ "error": msg }));
                (StatusCode::NOT_FOUND, body).into_response()
            }
            ApiError::Internal(err) => {
                // Internal error: hide details but include a request id or message
                let body = Json(json!({ "error": "internal server error" }));
                (StatusCode::INTERNAL_SERVER_ERROR, body).into_response()
            }
        }
    }
}

async fn health() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok" }))
}

async fn list_products(State(state): State<AppState>) -> Result<Json<Vec<Product>>, ApiError> {
    let guard = state.products.lock().map_err(|e| ApiError::Internal(anyhow::anyhow!("lock poisoned: {}", e)))?;
    Ok(Json(guard.clone()))
}

#[derive(Deserialize)]
struct QueryParams {
    page: Option<u32>,
    limit: Option<u32>,
    name: Option<String>,
}

// DB-backed listing with pagination and text filtering
async fn list_products_db(State(state): State<AppState>, Query(params): Query<QueryParams>) -> Result<Json<Vec<Product>>, ApiError> {
    let pool = state.pool.as_ref().ok_or_else(|| ApiError::Internal(anyhow::anyhow!("database not configured")))?;

    let page = params.page.unwrap_or(1).max(1);
    let limit = params.limit.unwrap_or(10).clamp(1, 100);
    let offset = ((page - 1) as i64) * (limit as i64);

    // Use parameterized query to avoid SQL injection and to use typed arguments
    let name_filter = params.name.clone();
    let rows = sqlx::query_as::<_, Product>(
        "SELECT id, name, price, description FROM products WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%') ORDER BY id LIMIT $2 OFFSET $3"
    )
    .bind(name_filter)
    .bind(limit as i64)
    .bind(offset)
    .fetch_all(pool)
    .await
    .map_err(|e| ApiError::Internal(anyhow::anyhow!("db query failed: {}", e)))?;

    Ok(Json(rows))
}

async fn create_product(State(state): State<AppState>, Json(payload): Json<CreateProduct>) -> Result<(StatusCode, Json<Product>), ApiError> {
    // Validate input using Result / Option instead of panics
    if payload.name.trim().is_empty() {
        return Err(ApiError::BadRequest("name is required".into()));
    }
    if payload.price == 0 {
        return Err(ApiError::BadRequest("price must be > 0".into()));
    }

    let mut guard = state.products.lock().map_err(|e| ApiError::Internal(anyhow::anyhow!("lock poisoned: {}", e)))?;
    let id = guard.last().map(|p| p.id + 1).unwrap_or(1);
    let new = Product { id, name: payload.name, price: payload.price, description: payload.description };
    guard.push(new.clone());
    Ok((StatusCode::CREATED, Json(new)))
}

fn read_port_from_env() -> Result<u16> {
    let default = "8080".to_string();
    let raw = env::var("PORT").unwrap_or(default);
    let port: u16 = raw.parse().context("failed to parse PORT env var as u16")?;
    Ok(port)
}

#[tokio::main]
async fn main() -> Result<()> {
    let port = read_port_from_env().context("reading port failed")?;
    let addr = SocketAddr::from(([127, 0, 0, 1], port));

    // attempt to read DATABASE_URL and connect, but do not fail if not present
    let pool = match env::var("DATABASE_URL") {
        Ok(url) => {
            let p = PgPool::connect(&url).await.context("failed to connect to database")?;
            Some(p)
        }
        Err(_) => None,
    };

    let state = AppState { products: Arc::new(Mutex::new(vec![
        Product { id: 1, name: "Wireless Mouse".into(), price: 899, description: Some("Ergonomic".into()) },
        Product { id: 2, name: "Mechanical Keyboard".into(), price: 3499, description: Some("RGB".into()) },
    ])), pool };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health))
        .route("/products", get(list_products).post(create_product))
        .route("/products-db", get(list_products_db))
        .with_state(state)
        .layer(cors);

    println!("Listening on http://{}", addr);
    axum::Server::bind(&addr).serve(app.into_make_service()).await.context("server failed")?;
    Ok(())
}
