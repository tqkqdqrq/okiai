import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.VITE_DIFY_API_KEY': JSON.stringify(env.VITE_DIFY_API_KEY),
        'process.env.VITE_DIFY_BASE_URL': JSON.stringify(env.VITE_DIFY_BASE_URL),
        'process.env.VITE_DIFY_APP_ID': JSON.stringify(env.VITE_DIFY_APP_ID)
      }
    };
});
