const arc = require("@architect/functions");

exports.handler = async function http(req) {
  console.log(req.httpMethod, req.path);

  console.log("process.env.NODE_ENV", process.env.NODE_ENV);
  console.log(
    "arc.http.helpers.url('/dashboard')",
    arc.http.helpers.url("/dashboard")
  );

  // reads the session from DynamoDB
  const session = await arc.http.session.read(req);

  if (session.user) {
    if (!session.user) {
      return {
        statusCode: 302,
        headers: { location: arc.http.helpers.url("/dashboard") }
      };
    }
  }

  return {
    headers: { "content-type": "text/html; charset=utf8" },
    body: `
    <h1>GitHub Secrets Keeper</h1>
    <p>
      <a href="${arc.http.helpers.url("/login")}">Login with GitHub</a>
    </p>
    `
  };
};
