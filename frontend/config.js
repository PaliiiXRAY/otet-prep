// OTET Test Series - Environment Configuration
window.APP_CONFIG = {
    // In production on Vercel, replace with your live Render/Railway URL (e.g. 'https://otet-api.onrender.com/api/v1')
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8080/api/v1'
        : 'https://otet-api.onrender.com/api/v1'
};
