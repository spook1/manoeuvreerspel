import { defineConfig } from 'vite';

export default defineConfig({
    root: '.', // Root is current directory
    base: './', // Relative base path for deployment
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
    },
    server: {
        open: true, // Open browser on start
    }
});
