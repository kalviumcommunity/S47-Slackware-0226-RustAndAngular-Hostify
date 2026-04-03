pub fn get_port() -> u16 {
    std::env::var("PORT").ok().and_then(|s| s.parse().ok()).unwrap_or(8080)
}

pub fn get_auth_token() -> String {
    std::env::var("AUTH_TOKEN").unwrap_or_else(|_| "devtoken123".to_string())
}
