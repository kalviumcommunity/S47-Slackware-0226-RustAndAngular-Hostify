use actix_web::web;
use crate::handlers::products::{create_product, list_products, get_product, update_product, delete_product};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/products")
            .route("", web::get().to(list_products))
            .route("", web::post().to(create_product))
            .route("/{id}", web::get().to(get_product))
            .route("/{id}", web::put().to(update_product))
            .route("/{id}", web::delete().to(delete_product))
    );
}
