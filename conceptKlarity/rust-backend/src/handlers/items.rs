use actix_web::{web, HttpResponse, Responder};
use crate::models::product::{Product, ProductStatus};

pub async fn get_items() -> impl Responder {
    let items = vec![
        Product {
            id: 1,
            name: "Example".to_string(),
            price: 9.99,
            description: Some("Sample item".to_string()),
            status: ProductStatus::Available,
        }
    ];
    HttpResponse::Ok().json(items)
}

pub async fn create_item(item: web::Json<Product>) -> impl Responder {
    let mut new = item.into_inner();
    // In a real app you'd persist and assign an id. Here we simulate one.
    new.id = 2;
    HttpResponse::Created().json(new)
}
