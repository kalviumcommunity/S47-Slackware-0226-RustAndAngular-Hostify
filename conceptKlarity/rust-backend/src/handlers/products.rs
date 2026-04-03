use actix_web::{web, HttpResponse, Result};
use crate::models::product::{CreateProductRequest, ProductResponse, ProductStatus, UpdateProductRequest};
use crate::state::AppState;

fn row_to_response(row: (i32, String, f64, Option<String>, String)) -> Result<ProductResponse, String> {
    let (id, name, price, description, status_str) = row;
    match ProductStatus::from_str(&status_str) {
        Some(status) => Ok(ProductResponse { id, name, price, description, status }),
        None => Err(format!("Invalid product status from DB: {}", status_str)),
    }
}

pub async fn create_product(state: web::Data<AppState>, req: web::Json<CreateProductRequest>) -> Result<HttpResponse> {
    let payload = req.into_inner();

    let query = "INSERT INTO products (name, price, description, status) VALUES ($1, $2, $3, $4) RETURNING id, name, price, description, status";

    let row = sqlx::query_as::<_, (i32, String, f64, Option<String>, String)>(query)
        .bind(payload.name)
        .bind(payload.price)
        .bind(payload.description)
        .bind("available")
        .fetch_one(&state.pool)
        .await
        .map_err(|e| {
            log::error!("DB insert error: {}", e);
            actix_web::error::ErrorInternalServerError("DB insert error")
        })?;

    let resp = row_to_response(row).map_err(|err| {
        log::error!("Invalid DB data after insert: {}", err);
        actix_web::error::ErrorInternalServerError("Invalid DB data")
    })?;

    // Invalidate cached product list after a write
    state.invalidate_products_cache().await;

    Ok(HttpResponse::Created().json(resp))
}

pub async fn list_products(state: web::Data<AppState>) -> Result<HttpResponse> {
    // Check in-memory cache first (reduces DB load for frequent reads)
    if let Some(cached) = state.get_cached_products().await {
        return Ok(HttpResponse::Ok().json(cached));
    }

    let query = "SELECT id, name, price, description, status FROM products";
    let rows = sqlx::query_as::<_, (i32, String, f64, Option<String>, String)>(query)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| {
            log::error!("DB query error: {}", e);
            actix_web::error::ErrorInternalServerError("DB query error")
        })?;

    let mut mapped = Vec::with_capacity(rows.len());
    for row in rows.into_iter() {
        mapped.push(row_to_response(row).map_err(|err| {
            log::error!("Invalid DB data in list_products: {}", err);
            actix_web::error::ErrorInternalServerError("Invalid DB data")
        })?);
    }

    // Cache result for subsequent requests
    state.set_cached_products(mapped.clone()).await;

    Ok(HttpResponse::Ok().json(mapped))
}

pub async fn get_product(state: web::Data<AppState>, path: web::Path<i32>) -> Result<HttpResponse> {
    let id = path.into_inner();
    let query = "SELECT id, name, price, description, status FROM products WHERE id = $1";

    match sqlx::query_as::<_, (i32, String, f64, Option<String>, String)>(query)
        .bind(id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| {
            log::error!("DB query error: {}", e);
            actix_web::error::ErrorInternalServerError("DB query error")
        })?
    {
        Some(row) => {
            let resp = row_to_response(row).map_err(|err| {
                log::error!("Invalid DB data for product {}: {}", id, err);
                actix_web::error::ErrorInternalServerError("Invalid DB data")
            })?;
            Ok(HttpResponse::Ok().json(resp))
        }
        None => Ok(HttpResponse::NotFound().body("Product not found")),
    }
}

pub async fn update_product(state: web::Data<AppState>, path: web::Path<i32>, req: web::Json<UpdateProductRequest>) -> Result<HttpResponse> {
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
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| {
            log::error!("DB update error: {}", e);
            actix_web::error::ErrorInternalServerError("DB update error")
        })?
    {
        Some(row) => {
            let resp = row_to_response(row).map_err(|err| {
                log::error!("Invalid DB data after update for id {}: {}", id, err);
                actix_web::error::ErrorInternalServerError("Invalid DB data")
            })?;
            // write -> invalidate cache
            state.invalidate_products_cache().await;
            Ok(HttpResponse::Ok().json(resp))
        }
        None => Ok(HttpResponse::NotFound().body("Product not found")),
    }
}

pub async fn delete_product(state: web::Data<AppState>, path: web::Path<i32>) -> Result<HttpResponse> {
    let id = path.into_inner();
    let r = sqlx::query("DELETE FROM products WHERE id = $1")
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| {
            log::error!("DB delete error: {}", e);
            actix_web::error::ErrorInternalServerError("DB delete error")
        })?;

    if r.rows_affected() == 0 {
        Ok(HttpResponse::NotFound().body("Product not found"))
    } else {
        // write -> invalidate cache
        state.invalidate_products_cache().await;
        Ok(HttpResponse::NoContent().finish())
    }
}
