const arc = require("@architect/functions");
const { request } = require("@octokit/request");

// learn more about http functions here: https://arc.codes/primitives/http
exports.handler = async function http(req) {
  const {
    headers: { authorization }
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
  const result = await data.apps.scan({ userId });

  return {
    headers: { "content-type": "application/json; charset=utf8" },
    body: JSON.stringify(result.Items.sort((a, b) => a.createdAt - b.createdAt))
  };
};
