const arc = require("@architect/functions");
const { oauthLoginUrl } = require("@octokit/oauth-login-url");

exports.handler = async function http(req) {
  console.log(req.httpMethod, req.path);

  // https://github.com/octokit/oauth-login-url.js
  const { url, state } = oauthLoginUrl({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET
  });

  // reads the session from DynamoDB
  let session = await arc.http.session.read(req);

  // save the session state to DynamoDB
  let cookie = await arc.http.session.write(Object.assign(session, { state }));

  return { cookie, status: 302, location: url };
};
