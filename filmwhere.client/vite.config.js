import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

// Configuración para certificados HTTPS (solo para desarrollo)
const setupHttpsCerts = () => {
    const baseFolder =
        env.APPDATA !== undefined && env.APPDATA !== ''
            ? `${env.APPDATA}/ASP.NET/https`
            : `${env.HOME}/.aspnet/https`;

    const certificateName = "filmwhere.client";
    const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
    const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

    if (!fs.existsSync(baseFolder)) {
        fs.mkdirSync(baseFolder, { recursive: true });
    }

    if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
        if (0 !== child_process.spawnSync('dotnet', [
            'dev-certs',
            'https',
            '--export-path',
            certFilePath,
            '--format',
            'Pem',
            '--no-password',
        ], { stdio: 'inherit', }).status) {
            throw new Error("Could not create certificate.");
        }
    }

    return { certFilePath, keyFilePath };
};

export default defineConfig(({ mode }) => {
    const isDev = mode === 'development';

    let serverConfig = {
        assetsInclude: ['**/*.{png,jpg,gif,svg,webp,woff,woff2,eot,ttf,otf}'],
        port: parseInt(env.DEV_SERVER_PORT || '56839'),
    };

    // Solo configurar HTTPS y proxy en desarrollo
    if (isDev) {
        const { certFilePath, keyFilePath } = setupHttpsCerts();

        serverConfig = {
            ...serverConfig,
            proxy: {
                '/api': {
                    target: 'http://filmwhere.somee.com',
                    changeOrigin: true,
                    secure: false
                }
            },
            https: {
                key: fs.readFileSync(keyFilePath),
                cert: fs.readFileSync(certFilePath),
            }
        };
    }

    return {
        plugins: [react()],
        base: '/', // Asegurar que la base sea correcta
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        server: serverConfig,
        build: {
            outDir: 'dist',
            assetsDir: 'assets',
            sourcemap: false,
            rollupOptions: {
                output: {
                    manualChunks: undefined,
                }
            }
        }
    };
});