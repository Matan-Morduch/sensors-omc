import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envFilePath = mode === 'development' ? path.resolve(__dirname, 'dev.env') : path.resolve(__dirname, '.env');

  if (fs.existsSync(envFilePath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envFilePath));
    for (const k in envConfig) {
      process.env[k] = envConfig[k];
    }
  }
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "process.env": process.env,
    },
  };
});
