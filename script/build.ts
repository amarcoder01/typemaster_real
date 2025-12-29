/**
 * Production Build Script
 * Builds both frontend and backend for production deployment
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function build() {
  console.log('🚀 Starting production build...\n');

  try {
    // Build frontend with Vite
    console.log('📦 Building frontend with Vite...');
    const { stdout: viteOut, stderr: viteErr } = await execAsync('npm run build:client', {
      cwd: process.cwd(),
    });
    if (viteOut) console.log(viteOut);
    if (viteErr) console.error(viteErr);
    console.log('✅ Frontend build complete\n');

    // Build backend with esbuild
    console.log('📦 Building backend with esbuild...');
    const { stdout: backendOut, stderr: backendErr } = await execAsync('npm run build:server', {
      cwd: process.cwd(),
    });
    if (backendOut) console.log(backendOut);
    if (backendErr) console.error(backendErr);
    console.log('✅ Backend build complete\n');

    console.log('🎉 Production build successful!');
  } catch (error: any) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

build();

