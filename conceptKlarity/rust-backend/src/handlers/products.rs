use actix_web::{web, HttpResponse, Responder};
use crate::models::product::{CreateProductRequest, ProductResponse, ProductStatus, UpdateProductRequest};
use sqlx::{PgPool, Error as SqlxError};

fn row_to_response(row: (i32, String, f64, Option<String>, String)) -> Result<ProductResponse, String> {
    let (id, name, price, description, status_str) = row;
    match ProductStatus::from_str(&status_str) {
        Some(status) => Ok(ProductResponse { id, name, price, description, status }),
        None => Err(format!("Invalid product status from DB: {}", status_str)),
    }
}

pub async fn create_product(pool: web::Data<PgPool>, req: web::Json<CreateProductRequest>) -> impl Responder {
    let payload = req.into_inner();

    let query = "INSERT INTO products (name, price, description, status) VALUES ($1, $2, $3, $4) RETURNING id, name, price, description, status";

    match sqlx::query_as::<_, (i32, String, f64, Option<String>, String)>(query)
        .bind(payload.name)
        .bind(payload.price)
        .bind(payload.description)
        .bind("available")
        .fetch_one(pool.get_ref())
        .await
    {
        Ok(row) => match row_to_response(row) {
            Ok(resp) => HttpResponse::Created().json(resp),
            Err(err) => {
                log::error!("Invalid DB data after insert: {}", err);
                HttpResponse::InternalServerError().finish()
            }
        },
        Err(e) => {
            log::error!("DB insert error: {}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn list_products(pool: web::Data<PgPool>) -> impl Responder {
    let query = "SELECT id, name, price, description, status FROM products";
    match sqlx::query_as::<_, (i32, String, f64, Option<String>, String)>(query)
        .fetch_all(pool.get_ref())
        .await
    {
        Ok(rows) => {
            let mapped: Result<Vec<ProductResponse>, String> = rows.into_iter().map(row_to_response).collect();
            match mapped {
                Ok(v) => HttpResponse::Ok().json(v),
                Err(err) => {
                    log::error!("Invalid DB data in list_products: {}", err);
                    HttpResponse::InternalServerError().finish()
                }
            }
        }
        Err(e) => {
            log::error!("DB query error: {}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn get_product(pool: web::Data<PgPool>, path: web::Path<i32>) -> impl Responder {
    let id = path.into_inner();
    let query = "SELECT id, name, price, description, status FROM products WHERE id = $1";

    match sqlx::query_as::<_, (i32, String, f64, Option<String>, String)>(query)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(row)) => match row_to_response(row) {
            Ok(resp) => HttpResponse::Ok().json(resp),
            Err(err) => {
                log::error!("Invalid DB data for product {}: {}", id, err);
                HttpResponse::InternalServerError().finish()
            }
        },
        Ok(None) => HttpResponse::NotFound().body("Product not found"),
        Err(e) => {
            log::error!("DB query error: {}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn update_product(pool: web::Data<PgPool>, path: web::Path<i32>, req: web::Json<UpdateProductRequest>) -> impl Responder {
    let id = path.into_inner();
    let payload = req.into_inner();

    let status_str = payload.status.as_ref().map(|s| s.as_str()).unwrap_or("available");

    let query = "UPDATE products SET name=$1, price=$2, description=$3, status=$4 WHERE id=$5 RETURNING id, name, price, description, status";

    match sqlx::query_as::<_, (i32, String, f64, Option<String>, String)>(query)
        .bind(payload.name)
        .bind(payload.price)
        .bind(payload.description)
        .bind(status_str)
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
    {
        Ok(Some(row)) => match row_to_response(row) {
            Ok(resp) => HttpResponse::Ok().json(resp),
            Err(err) => {
                log::error!("Invalid DB data after update for id {}: {}", id, err);
                HttpResponse::InternalServerError().finish()
            }
        },
        Ok(None) => HttpResponse::NotFound().body("Product not found"),
        Err(e) => {
            log::error!("DB update error: {}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}

pub async fn delete_product(pool: web::Data<PgPool>, path: web::Path<i32>) -> impl Responder {
    let id = path.into_inner();
    match sqlx::query("DELETE FROM products WHERE id = $1")
        .bind(id)
        .execute(pool.get_ref())
        .await
    {
        Ok(r) => {
            if r.rows_affected() == 0 {
                HttpResponse::NotFound().body("Product not found")
            } else {
                HttpResponse::NoContent().finish()
            }
        }
        Err(e) => {
            log::error!("DB delete error: {}", e);
            HttpResponse::InternalServerError().finish()
        }
    }
}
