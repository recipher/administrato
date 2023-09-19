const { setupServer } = require("msw/node");
const { auth0Handlers } = require("./auth0");

const server = setupServer(
  ...auth0Handlers
);

server.listen({ onUnhandledRequest: "bypass" });
console.info('🔶 Mock server installed')

process.once("SIGINT", () => server.close());
process.once("SIGTERM", () => server.close());
