const path = require("path");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const AutoImport = require("unplugin-auto-import/webpack");
const Components = require("unplugin-vue-components/webpack");
const { ElementPlusResolver } = require("unplugin-vue-components/resolvers");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");

module.exports = {
  publicPath: "./",
  productionSourceMap: false,
  configureWebpack: {
    devServer: {
      hot: true,
      historyApiFallback: true,
    },
    devtool: "source-map",
    module: {
      rules: [
        {
          test: /\.tsx$/,
          use: [
            {
              loader: path.resolve("src/Plugins/AutoImportLessLoader.ts"),
            },
          ],
        },
      ],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
      extensions: [".tsx", ".less"],
    },
    plugins: [
      new MonacoWebpackPlugin(),
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve("src/Plugins/Pwa/serviceWorker.js"),
            to: path.resolve("dist/serviceWorker.js"),
          },
        ],
      }),
      new CompressionPlugin({
        filename: "[path][base].gz", // 生成的文件名
        algorithm: "gzip", // 使用 gzip 压缩
        test: /\.(js|css|html|svg)$/, // 匹配要压缩的文件类型
        threshold: 10240, // 只处理大于 10KB 的文件
        minRatio: 0.8, // 压缩比例小于 0.8 的文件才会被压缩
      }),
      // new BundleAnalyzerPlugin(),
    ],
  },
  chainWebpack: (config) => {
    config.plugin("define").tap((definitions) => {
      Object.assign(definitions[0], {
        __VUE_OPTIONS_API__: "true",
        __VUE_PROD_DEVTOOLS__: "false",
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: "false",
      });
      return definitions;
    });
    config.module
      .rule("vue")
      .use("vue-loader")
      .tap((options) => {
        options.compilerOptions = options.compilerOptions || {};
        options.compilerOptions.hoistStatic = false;
        return options;
      });
  },
  css: {
    loaderOptions: {
      css: {
        modules: {
          auto: (p) => {
            return p.indexOf("node_modules") == -1 && path.basename(p).indexOf(".global.") == -1;
          },
          localIdentName: "[local]_[hash:base64:5]",
        },
      },
    },
  },
  pages: {
    index: {
      entry: path.resolve("src/Main.ts"),
    },
  },
};
