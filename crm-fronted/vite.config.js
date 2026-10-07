import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(function (_a) {
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), '');
    var apiProxyTarget = env.VITE_API_PROXY_TARGET || env.LARAVEL_URL || 'http://127.0.0.1:8000';
    return {
        plugins: [react()],
        server: {
            proxy: {
                '/api': {
                    target: apiProxyTarget,
                    changeOrigin: true,
                    secure: true,
                },
            },
        },
    };
});
