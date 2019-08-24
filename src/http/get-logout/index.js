const arc = require("@architect/functions");

exports.handler = async function http(req) {
  console.log(req.httpMethod, req.path);

  // reads the session from DynamoDB
  let session = await arc.http.session.read(req);

  console.log(`[db] user logout: ${session.user.login} (${session.user.id})`);

  session.user = null;

  // save the session state to DynamoDB
  let cookie = await arc.http.session.write(session);

  return {
    statusCode 302,
    headers: { "set-cookie": cookie, location: arc.http.helpers.url("/") }
  };
};
