use crate::models::product::ProductResponse;
use sqlx::postgres::PgPool;
use tokio::sync::RwLock;
use std::sync::Arc;
use std::time::{Instant, Duration};

struct CachedProducts {
    data: Vec<ProductResponse>,
    expires_at: Instant,
}

#[derive(Clone)]
pub struct AppState {
    pub pool: PgPool,
    product_cache: Arc<RwLock<Option<CachedProducts>>>,
    cache_ttl: Duration,
}

impl AppState {
    pub fn new(pool: PgPool, cache_ttl: Duration) -> Self {
        Self {
            pool,
            product_cache: Arc::new(RwLock::new(None)),
            cache_ttl,
        }
    }

    /// Return cached products if still fresh.
    pub async fn get_cached_products(&self) -> Option<Vec<ProductResponse>> {
        let guard = self.product_cache.read().await;
        if let Some(c) = &*guard {
            if c.expires_at > Instant::now() {
                return Some(c.data.clone());
            }
        }
        None
    }

    /// Overwrite the cached products and set expiry.
    pub async fn set_cached_products(&self, data: Vec<ProductResponse>) {
        let mut guard = self.product_cache.write().await;
        *guard = Some(CachedProducts { data, expires_at: Instant::now() + self.cache_ttl });
    }

    /// Clear the products cache (call on writes).
    pub async fn invalidate_products_cache(&self) {
        let mut guard = self.product_cache.write().await;
        *guard = None;
    }
}
