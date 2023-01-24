// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const isProduction = process.env.NODE_ENV == "production";
const BASE_URL = process.env.BASE_URL || ".";

const stylesHandler = isProduction
  ? MiniCssExtractPlugin.loader
  : "style-loader";

const entry = { main: "./src/index.ts" };
const plugins = [
  new HtmlWebpackPlugin({
    template: "./src/index.html",
    chunks: ["main"],
    base: BASE_URL,
  }),
];

if (isProduction)
  plugins.push(
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name].css",
      chunkFilename: "[id].css",
    })
  );

const project = (name) => {
  entry[name] = `./src/projects/${name}/index.ts`;

  plugins.push(
    new HtmlWebpackPlugin({
      template: `./src/projects/${name}/index.html`,
      filename: `p/${name}.html`,
      chunks: [name],
      base: BASE_URL,
    })
  );
};

project("collision-model");
project("field-lines");
project("gravity");

const config = {
  entry,
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name]-[chunkhash].js",
  },
  devServer: {
    open: true,
    host: "localhost",
  },
  plugins,
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
      {
        test: /\.css$/i,
        use: [
          stylesHandler,
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              // Prefer `dart-sass`
              implementation: require("sass"),
            },
          },
        ],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: "asset",
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", "..."],
    modules: ["./src", "node_modules"],
    // alias: {
    //     "@common/*": path.join(__dirname, "./src/@common/*")
    // }
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
