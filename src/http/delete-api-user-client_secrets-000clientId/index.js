const arc = require("@architect/functions");
const { request } = require("@octokit/request");

// learn more about http functions here: https://arc.codes/primitives/http
exports.handler = async function http(req) {
  const {
    headers: { authorization },
    pathParameters: { clientId }
  } = req;

  if (!authorization) {
    return {
      statusCode: 401,
      headers: { "content-type": "application/json; charset=utf8" },
      body: JSON.stringify({
        error: "Authorization missing"
      })
    };
  }

  let userId;
  try {
    const { data } = await request("GET /user", {
      headers: { authorization }
    });
    userId = data.id;
  } catch (error) {
    console.log(error);
    return {
      statusCode: 401,
      headers: { "content-type": "application/json; charset=utf8" },
      body: JSON.stringify({ error: error.toString() })
    };
  }

  const data = await arc.tables();
  const app = await data.apps.get({ clientId });

  if (app.userId !== userId) {
    return {
      statusCode: 404,
      headers: { "content-type": "application/json; charset=utf8" },
      body: JSON.stringify({
        error: `App not found (${clientId})`
      })
    };
  }

  await data.apps.delete({ clientId });

  return {
    statusCode: 204
  };
};
