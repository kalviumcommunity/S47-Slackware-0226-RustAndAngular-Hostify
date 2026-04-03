mod routes;
mod handlers;
mod models;
mod config;

use actix_web::{App, HttpServer, web};
use sqlx::postgres::PgPoolOptions;

use std::env;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    let port = config::get_port();
    println!("Starting server on http://0.0.0.0:{}", port);

    // Read DATABASE_URL from environment
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in the environment");

    // Create a connection pool
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(|e| {
            eprintln!("Failed to connect to database: {}", e);
            std::io::Error::new(std::io::ErrorKind::Other, "Database connection failed")
        })?;

    // Run embedded migrations from `rust-backend/migrations/`
    // This requires the `migrate` feature for `sqlx` (enabled in Cargo.toml).
    if let Err(e) = sqlx::migrate!().run(&pool).await {
        eprintln!("Failed to run database migrations: {}", e);
        return Err(std::io::Error::new(std::io::ErrorKind::Other, "Migration failed"));
    }

    HttpServer::new(move || {
        App::new()
            .app_data(web::Data::new(pool.clone()))
            .configure(routes::items::configure)
            .configure(routes::products::configure)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
