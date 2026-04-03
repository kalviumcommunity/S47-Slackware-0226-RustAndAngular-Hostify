use actix_web::web;
use crate::handlers::products::create_product;

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/products")
            .route("", web::get().to(list_products))
            .route("", web::post().to(create_product))
    );
}
