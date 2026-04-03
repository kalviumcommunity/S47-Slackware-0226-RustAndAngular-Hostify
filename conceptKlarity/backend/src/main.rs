use axum::{routing::get, Router, response::Json};
use serde_json::json;
use std::{env, net::SocketAddr};

async fn health() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok" }))
}

#[tokio::main]
async fn main() -> Result<(), std::io::Error> {
    let port: u16 = env::var("PORT").unwrap_or_else(|_| "8080".to_string()).parse().expect("PORT must be a number");
    let addr = SocketAddr::from(([127, 0, 0, 1], port));

    let app = Router::new().route("/health", get(health));

    println!("Listening on http://{}", addr);
    axum::Server::bind(&addr).serve(app.into_make_service()).await?;
    Ok(())
}
