use actix_web::{web};

use crate::handlers::items::{get_items, create_item};

pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.service(
        web::scope("/api/items")
            .route("", web::get().to(get_items))
            .route("", web::post().to(create_item))
    );
}
