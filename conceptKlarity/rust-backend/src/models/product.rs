use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "snake_case")]
pub enum ProductStatus {
    Available,
    OutOfStock,
    Discontinued,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Product {
    pub id: i32,
    pub name: String,
    pub price: f64,
    pub description: Option<String>,
    pub status: ProductStatus,
}

#[derive(Deserialize, Debug)]
pub struct CreateProductRequest {
    pub name: String,
    pub price: f64,
    pub description: Option<String>,
}

#[derive(Serialize, Debug, sqlx::FromRow)]
pub struct ProductResponse {
    pub id: i32,
    pub name: String,
    pub price: f64,
    pub description: Option<String>,
    pub status: ProductStatus,
}
