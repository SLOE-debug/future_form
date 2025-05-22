import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { resolve } from "path";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import viteCompression from "vite-plugin-compression";
import { viteStaticCopy } from "vite-plugin-static-copy";
import monacoEditorPlugin from "vite-plugin-monaco-editor-esm";
import autoImportSassPlugin from "./src/Plugins/AutoImportSassPlugin";

const compressionPlugin = viteCompression({
  verbose: true,
  algorithm: "gzip",
  ext: ".gz",
  threshold: 10240, // 10kb以上文件进行压缩
  deleteOriginFile: false,
});
compressionPlugin.apply = "build";

export default defineConfig({
  // 基本公共路径
  base: "./",

  // 源码目录
  root: process.cwd(),

  // 开发服务器选项
  server: {
    host: "0.0.0.0",
    port: 8080,
    open: false,
    strictPort: false,
    cors: true,
    hmr: true,
  },

  // 构建选项
  build: {
    outDir: "dist",
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          "element-plus": ["element-plus"],
          "monaco-editor": ["monaco-editor"],
        },
      },
    },
  },
  // 解析配置
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
    extensions: [".tsx", ".ts", ".less", ".js", ".jsx", ".vue", ".json"],
  },
  plugins: [
    // 自定义插件用于处理 AutoImportSass
    autoImportSassPlugin(),
    vue(),
    vueJsx({
      include: [/\.tsx?$/, /\.jsx?$/, /\.vue$/],
      exclude: [/node_modules/],
      babelPlugins: [
        [
          "@babel/plugin-transform-typescript",
          { isTSX: true, allowDeclareFields: true },
          "ts-transform", // —— 唯一名字，避开重复检测
        ],
        // 再处理装饰器和 class properties
        ["@babel/plugin-proposal-decorators", { legacy: true }],
        ["@babel/plugin-proposal-class-properties", { loose: false }],
      ],
      transformOn: true,
      mergeProps: true,
    }),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
    monacoEditorPlugin({}),
    compressionPlugin,
    viteStaticCopy({
      targets: [
        {
          src: "src/Plugins/Pwa/serviceWorker.js",
          dest: "",
        },
      ],
    }),
  ],
  css: {
    modules: {
      localsConvention: "camelCaseOnly",
    },
  },

  // 定义全局常量
  define: {
    __VUE_OPTIONS_API__: true,
    __VUE_PROD_DEVTOOLS__: false,
    __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
  },
});
