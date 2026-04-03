use actix_web::{web, HttpResponse, Responder};
use crate::models::product::{CreateProductRequest, ProductResponse, ProductStatus};
use sqlx::PgPool;

pub async fn create_product(pool: web::Data<PgPool>, req: web::Json<CreateProductRequest>) -> impl Responder {
    let payload = req.into_inner();

    // Insert into DB and return the created row
    let query = "INSERT INTO products (name, price, description, status) VALUES ($1, $2, $3, $4) RETURNING id, name, price, description, status";

    match sqlx::query_as::<_, ProductResponse>(query)
        .bind(payload.name)
        .bind(payload.price)
        .bind(payload.description)
        .bind("available")
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(created) => HttpResponse::Created().json(created),
        Err(e) => {
            eprintln!("DB insert error: {}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn list_products(pool: web::Data<PgPool>) -> impl Responder {
    match sqlx::query_as::<_, ProductResponse>("SELECT id, name, price, description, status FROM products")
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(list) => HttpResponse::Ok().json(list),
        Err(e) => {
            eprintln!("DB query error: {}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}
