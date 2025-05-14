import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ command, mode }) => {
    const isBuild = command === 'build';
    const isTest = mode === 'test';

    if (isBuild)
        return {
            plugins: [react(), tsconfigPaths()],
            server: {
                host: true,
                port: 8080,
                allowedHosts: ['*']
            },
            resolve: {
                alias: {
                    $fonts: resolve('./public/fonts'),
                },
            },
        };

    if (isTest)
        return {
            plugins: [react(), tsconfigPaths()],
            resolve: {
                alias: {
                    $fonts: resolve('./public/fonts'),
                },
            },
            test: {
                globals: true,
                environment: 'jsdom',
                coverage: {
                    provider: 'istanbul',
                    reporters: ['junit'],
                },
                setupFiles: ['./test/vitest.setup.ts'],
            },
        };

    return {
        plugins: [react(), tsconfigPaths()],
        server: {
            host: true,
            port: 8080,
            allowedHosts: ['*']
        },
        resolve: {
            alias: {
                $fonts: resolve('./public/fonts'),
            },
        },
    };
});
