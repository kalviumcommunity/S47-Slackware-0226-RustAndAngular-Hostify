mod routes;
mod handlers;
mod models;
mod config;
mod middleware;
mod state;

use actix_web::{App, HttpServer, web, middleware::Logger};
use actix_web::http::header;
use actix_cors::Cors;
use sqlx::postgres::PgPoolOptions;

use std::env;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    let port = config::get_port();
    println!("Starting server on http://0.0.0.0:{}", port);

    // Read DATABASE_URL from environment
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in the environment");

    // Create a connection pool (created once and shared via AppState)
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(|e| {
            log::error!("Failed to connect to database: {}", e);
            std::io::Error::new(std::io::ErrorKind::Other, "Database connection failed")
        })?;

    // Run embedded migrations from `rust-backend/migrations/`
    // This requires the `migrate` feature for `sqlx` (enabled in Cargo.toml).
    if let Err(e) = sqlx::migrate!().run(&pool).await {
        log::error!("Failed to run database migrations: {}", e);
        return Err(std::io::Error::new(std::io::ErrorKind::Other, "Migration failed"));
    }

    // Create a shared application state and inject into app_data. The state contains
    // the DB pool (created once) and a small in-memory cache for read-heavy endpoints.
    let app_state = state::AppState::new(pool.clone(), std::time::Duration::from_secs(5));
    let app_data = web::Data::new(app_state);

    HttpServer::new(move || {
        App::new()
            // CORS for Angular dev server
            .wrap(
                Cors::default()
                    .allowed_origin("http://localhost:4200")
                    .allowed_methods(vec!["GET", "POST", "PUT", "DELETE", "OPTIONS"])
                    .allowed_headers(vec![header::CONTENT_TYPE, header::AUTHORIZATION])
                    .supports_credentials()
                    .max_age(3600),
            )
            .wrap(Logger::default())
            .app_data(app_data.clone())
            .configure(routes::items::configure)
            .configure(routes::auth::configure)
            .configure(routes::products::configure)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
