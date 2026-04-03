mod routes;
mod handlers;
mod models;
mod config;

use actix_web::{App, HttpServer};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    env_logger::init();
    let port = config::get_port();
    println!("Starting server on http://0.0.0.0:{}", port);

    HttpServer::new(|| {
        App::new().configure(routes::items::configure)
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
