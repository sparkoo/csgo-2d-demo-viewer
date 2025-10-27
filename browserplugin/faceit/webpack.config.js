const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = (env) => {
  const browser = env.browser || "chrome";
  const isDev = env.WEBPACK_SERVE;

  return {
    entry: {
      "content-script": "./content-script.js",
      popup: "./popup.js",
    },
    output: {
      path: path.resolve(__dirname, `dist/${browser}`),
      filename: "[name].js",
      clean: !isDev, // Don't clean in dev mode to preserve files
    },
    watchOptions: isDev
      ? {
          ignored: /node_modules/,
          aggregateTimeout: 300,
          poll: 1000,
        }
      : undefined,
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
                      browsers:
                        browser === "firefox"
                          ? ["> 0.25%", "not dead", "Firefox ESR"]
                          : ["> 0.25%", "not dead"],
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
      ...(isDev
        ? []
        : [
            new CopyPlugin({
              patterns: [
                { from: "manifest.json", to: "manifest.json" },
                { from: "popup.html", to: "popup.html" },
                { from: "content-styles.css", to: "content-styles.css" },
                { from: "popup.css", to: "popup.css" },
                {
                  from: "icons",
                  to: "icons",
                  globOptions: {
                    ignore: ["**/icon.png"], // Exclude large 1024x1024 icon
                  },
                },
              ],
            }),
          ]),
    ],
    mode: "development",
    devtool: "inline-source-map",
    optimization: {
      minimize: false,
    },
  };
};
