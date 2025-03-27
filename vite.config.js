import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 加载环境变量
import * as dotenv from 'dotenv'
dotenv.config()

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.PORT || 3000}`,
        changeOrigin: true,
      }
    }
  }
})
