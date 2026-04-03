use actix_service::Service;
use actix_web::dev::{forward_ready, ServiceRequest, ServiceResponse, Transform};
use actix_web::{Error, HttpMessage, HttpResponse};
use actix_web::body::{EitherBody, MessageBody};
use futures_util::future::{ready, Ready};
use serde::Serialize;
use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;
use std::task::{Context, Poll};

/// Simple header-based auth middleware. Compares Authorization: Bearer <token>
/// against a configured token and returns 401 when missing/invalid.
#[derive(Clone)]
pub struct AuthMiddleware {
    token: String,
}

impl AuthMiddleware {
    pub fn new(token: String) -> Self {
        Self { token }
    }
}

pub struct AuthMiddlewareService<S> {
    service: Arc<S>,
    token: String,
}

impl<S, B> Transform<S, ServiceRequest> for AuthMiddleware
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: Send + 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type InitError = ();
    type Transform = AuthMiddlewareService<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ready(Ok(AuthMiddlewareService {
            service: Arc::new(service),
            token: self.token.clone(),
        }))
    }
}

impl<S, B> Service<ServiceRequest> for AuthMiddlewareService<S>
where
    S: Service<ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: Send + 'static,
    B: MessageBody + 'static,
{
    type Response = ServiceResponse<EitherBody<B>>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

    forward_ready!(service);

    fn call(&self, req: ServiceRequest) -> Self::Future {
        let token = self.token.clone();
        let srv = self.service.clone();

        Box::pin(async move {
            // Allow preflight
            if req.method() == actix_web::http::Method::OPTIONS {
                let resp = HttpResponse::Ok().finish().map_into_right_body();
                return Ok(req.into_response(resp));
            }

            // Check Authorization header (case-insensitive "Bearer" scheme)
            if let Some(header_val) = req.headers().get(actix_web::http::header::AUTHORIZATION) {
                if let Ok(s) = header_val.to_str() {
                    let mut parts = s.splitn(2, ' ');
                    if let Some(scheme) = parts.next() {
                        if scheme.eq_ignore_ascii_case("Bearer") {
                            if let Some(provided_raw) = parts.next() {
                                let provided = provided_raw.trim();
                                if const_time_eq(provided, &token) {
                                    let res = srv.call(req).await?;
                                    return Ok(res.map_into_left_body());
                                } else {
                                    log::debug!("Auth failed: token mismatch");
                                }
                            }
                        } else {
                            log::debug!("Auth failed: scheme not Bearer");
                        }
                    }
                } else {
                    log::debug!("Invalid Authorization header encoding");
                }
            } else {
                log::debug!("Missing Authorization header");
            }

            let er = ErrorResponse { error: "Unauthorized".to_string() };
            let resp = HttpResponse::Unauthorized().json(er).map_into_right_body();
            Ok(req.into_response(resp))
        })
    }
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

fn const_time_eq(a: &str, b: &str) -> bool {
    let a_bytes = a.as_bytes();
    let b_bytes = b.as_bytes();
    let mut res: u8 = 0;
    let max_len = std::cmp::max(a_bytes.len(), b_bytes.len());
    for i in 0..max_len {
        let x = *a_bytes.get(i).unwrap_or(&0);
        let y = *b_bytes.get(i).unwrap_or(&0);
        res |= x ^ y;
    }
    res == 0 && a_bytes.len() == b_bytes.len()
}
