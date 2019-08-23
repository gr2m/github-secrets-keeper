const arc = require("@architect/functions");

exports.handler = async function http(req) {
  console.log(req.httpMethod, req.path);

  // reads the session from DynamoDB
  const session = await arc.http.session.read(req);

  if (session.user) {
    return {
      headers: { "content-type": "text/html; charset=utf8" },
      body: `
      <h1>Welcome, ${session.user.login}!</h1>
  
      <p><a href="/logout">Logout</p>
      `
    };
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
