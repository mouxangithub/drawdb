import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 加载环境变量
import * as dotenv from 'dotenv'
dotenv.config()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 允许从本地网络访问
    open: true, // 自动打开浏览器
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.PORT || 3000}`,
        changeOrigin: true,
      }
    }
  },
  build: {
    // 提高警告阈值到 80000kB
    chunkSizeWarningLimit: 80000,
  }
})
