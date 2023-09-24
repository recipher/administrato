const { rest } = require("msw");

const auth0Handlers = 
[
  // /api/auth/me
  rest.post('https://recipher.auth0.com/oauth/token', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: { name: 'test', email: 'email@domain.com' },
      }),
    );
  }),
];

module.exports = { auth0Handlers };