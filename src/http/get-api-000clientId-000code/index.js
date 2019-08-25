const arc = require("@architect/functions");
const { createOAuthAppAuth } = require("@octokit/auth-oauth-app");
const { request } = require("@octokit/request");

// learn more about http functions here: https://arc.codes/primitives/http
exports.handler = async function http(req) {
  const { clientId, code } = req.pathParameters;

  const clientSecret = await getClientSecret(clientId);

  // app for provided clientId could not be found
  if (!clientSecret) {
    return {
      statusCode: 404,
      headers: { "content-type": "application/json; charset=utf8" },
      body: JSON.stringify({
        error: `OAuth app with client id ${clientId} could not be found.`
      })
    };
  }

  // get token
  const auth = createOAuthAppAuth({
    clientId,
    clientSecret,
    code
  });
  const { token } = await auth({
    type: "token"
  });

  // get user data
  const response = await auth.hook(request, "GET /user");
  const user = {
    userId: response.data.id,
    login: response.data.login
  };

  return {
    headers: { "content-type": "application/json; charset=utf8" },
    body: JSON.stringify({
      ...user,
      token
    })
  };
};

async function getClientSecret(clientId) {
  if (clientId === process.env.CLIENT_ID) {
    return process.env.CLIENT_SECRET;
  }

  const data = await arc.tables();
  const app = await data.apps.get({ clientId });

  if (!app) return;

  return app.clientSecret;
}
