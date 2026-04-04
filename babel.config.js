module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          root: ["."],
          extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx"],
          alias: {
            "@": "./app",
            "@components": "./app/components",
            "@screens": "./app/screens",
            "@services": "./app/services",
            "@store": "./app/store",
            "@types": "./app/types",
            "@utils": "./app/utils",
            "@assets": "./assets",
          },
        },
      ],
    ],
  };
};