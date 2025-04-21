import { defineConfig } from "vite";
import preact from "@preact/preset-vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [preact(), basicSsl()],
    server: {
        port: 3000,
        host: "0.0.0.0",
        cors: true,
        https: true,
        headers: {
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
        },
    },
    build: {
        rollupOptions: {
            output: {
                entryFileNames: "vcmi-launcher.js",
                assetFileNames: (info) => {
                    return info.name === "index.css" ? "vcmi-launcher.css" : info.name;
                },
            },
        },
    },
});
