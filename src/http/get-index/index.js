const arc = require("@architect/functions");

exports.handler = async function http(req) {
  console.log(req.httpMethod, req.path);

  // reads the session from DynamoDB
  const session = await arc.http.session.read(req);

  if (session.user) {
    if (!session.user) {
      return { status: 302, location: "/dashboard" };
    }
  }

  return {
    headers: { "content-type": "text/html; charset=utf8" },
    body: `
    <h1>GitHub Secrets Keeper</h1>
    <p>
      <a href="/login">Login with GitHub</a>
    </p>
    `
  };
};