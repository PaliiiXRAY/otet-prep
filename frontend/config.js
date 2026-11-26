// ============================================================================
// OTET Exam System - Dynamic API Configuration
// ============================================================================

const defaultLocalApi = 'http://localhost:8080/api/v1';
// Default live Render backend
const defaultProdApi = 'https://otet-prep.onrender.com/api/v1';

const customOverride = localStorage.getItem('otet_custom_api_url');

window.APP_CONFIG = {
    API_BASE_URL: customOverride
        ? customOverride
        : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? defaultLocalApi
            : defaultProdApi)
};
