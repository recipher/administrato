/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  cacheDirectory: "./node_modules/.cache/remix",
  future: {
    v2_errorBoundary: true,
    v2_headers: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
    v2_dev: true,
  },
  ignoredRouteFiles: ["**/.*", "**/*.test.{js,jsx,ts,tsx}"],
  serverDependenciesToBundle: [
    /^rehype.*/,
    /^remark.*/,
    /^unified.*/,
    "@mdx-js/react",
  ],
  publicPath: "/_static/build/",
  postcss: true,
  server: "./server.ts",
  serverBuildPath: "server/index.js",
  serverModuleFormat: "cjs",
  tailwind: true,
  routes(defineRoutes) {
    return defineRoutes((route) => {
      if (process.env.NODE_ENV === "production") return;

      // console.log("⚠️  Test routes enabled.");

      // const appDir = path.join(__dirname, "app");

      // route(
      //   "__tests/create-user",
      //   path.relative(appDir, "cypress/support/test-routes/create-user.ts")
      // );
    });
  },
};
