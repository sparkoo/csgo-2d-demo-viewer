const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (env) => {
  const browser = env.browser || "chrome";

  return {
    entry: {
      "content-script": "./content-script.js",
      popup: "./popup.js",
    },
    output: {
      path: path.resolve(__dirname, `dist/${browser}`),
      filename: "[name].js",
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: [
                [
                  "@babel/preset-env",
                  {
                    useBuiltIns: "usage",
                    corejs: 3,
                    targets: {
                      browsers: browser === "firefox" ? ["> 0.25%", "not dead", "Firefox ESR"] : ["> 0.25%", "not dead"],
                    },
                  },
                ],
              ],
            },
          },
        },
      ],
    },
    resolve: {
      extensions: [".js"],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          { from: "manifest.json", to: "manifest.json" },
          { from: "popup.html", to: "popup.html" },
          { from: "content-styles.css", to: "content-styles.css" },
          { from: "popup.css", to: "popup.css" },
          { from: "icons", to: "icons" },
        ],
      }),
    ],
    mode: "production",
  };
};
