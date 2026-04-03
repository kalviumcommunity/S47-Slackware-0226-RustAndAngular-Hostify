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

#[derive(Deserialize, Debug)]
pub struct UpdateProductRequest {
    pub name: String,
    pub price: f64,
    pub description: Option<String>,
    pub status: Option<ProductStatus>,
}

#[derive(Serialize, Debug, Clone)]
pub struct ProductResponse {
    pub id: i32,
    pub name: String,
    pub price: f64,
    pub description: Option<String>,
    pub status: ProductStatus,
}

impl ProductStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            ProductStatus::Available => "available",
            ProductStatus::OutOfStock => "out_of_stock",
            ProductStatus::Discontinued => "discontinued",
        }
    }

    /// Parse a database status string into `ProductStatus`.
    /// Returns `None` for unknown/invalid strings.
    pub fn from_str(s: &str) -> Option<Self> {
        match s {
            "out_of_stock" => Some(ProductStatus::OutOfStock),
            "discontinued" => Some(ProductStatus::Discontinued),
            "available" => Some(ProductStatus::Available),
            _ => None,
        }
    }
}
