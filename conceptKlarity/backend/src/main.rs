use axum::{extract::State, routing::{get, post}, Json, Router};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::{env, net::SocketAddr, sync::{Arc, Mutex}};

#[derive(Clone)]
struct AppState {
    products: Arc<Mutex<Vec<Product>>>,
}

#[derive(Serialize, Deserialize, Clone)]
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

async fn health() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok" }))
}

async fn list_products(State(state): State<AppState>) -> Json<Vec<Product>> {
    let products = state.products.lock().unwrap();
    Json(products.clone())
}

async fn create_product(State(state): State<AppState>, Json(payload): Json<CreateProduct>) -> (axum::http::StatusCode, Json<Product>) {
    let mut products = state.products.lock().unwrap();
    let id = products.last().map(|p| p.id + 1).unwrap_or(1);
    let new = Product { id, name: payload.name, price: payload.price, description: payload.description };
    products.push(new.clone());
    (axum::http::StatusCode::CREATED, Json(new))
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    let port: u16 = env::var("PORT").unwrap_or_else(|_| "8080".to_string()).parse().expect("PORT must be a number");
    let addr = SocketAddr::from(([127, 0, 0, 1], port));

    let state = AppState { products: Arc::new(Mutex::new(vec![
        Product { id: 1, name: "Wireless Mouse".into(), price: 899, description: Some("Ergonomic".into()) },
        Product { id: 2, name: "Mechanical Keyboard".into(), price: 3499, description: Some("RGB".into()) },
    ])) };

    let app = Router::new()
        .route("/health", get(health))
        .route("/products", get(list_products).post(create_product))
        .with_state(state);

    println!("Listening on http://{}", addr);
    axum::Server::bind(&addr).serve(app.into_make_service()).await?;
    Ok(())
}
