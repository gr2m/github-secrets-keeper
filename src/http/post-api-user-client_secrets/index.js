const arc = require("@architect/functions");
const { request } = require("@octokit/request");

exports.handler = async function http(req) {
  const authorization = req.headers.authorization || req.headers.Authorization;

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
    return {
      statusCode: 401,
      headers: { "content-type": "application/json; charset=utf8" },
      body: JSON.stringify({ error })
    };
  }

  const newApp = JSON.parse(Buffer.from(req.body, "base64"));
  newApp.userId = userId;
  newApp.createdAt = Date.now();

  const data = await arc.tables();
  await data.apps.put(newApp);

  console.log(`[db] new app created (${newApp.clientId})`);

  return {
    statusCode: 201,
    headers: { "content-type": "application/json; charset=utf8" },
    body: JSON.stringify(newApp)
  };
};
