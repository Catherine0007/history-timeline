import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/history-timeline/', // 关键：确保这行和你仓库名字一致
  plugins: [vue()],
})
