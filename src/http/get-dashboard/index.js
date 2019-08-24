const arc = require("@architect/functions");
const url = arc.http.helpers.url;

exports.handler = async function http(req) {
  console.log(req.httpMethod, req.path);

  // reads the session from DynamoDB
  const session = await arc.http.session.read(req);

  if (!session.user) {
    return { statusCode: 302, headers: { location: url("/") } };
  }

  const data = await arc.tables();
  const apps = await data.apps.scan({ userId: session.user.id });

  return {
    headers: { "content-type": "text/html; charset=utf8" },
    body: `
    <h1>Welcome, ${session.user.login}!</h1>

    <p>
      ${
        session.user.login === "gr2m"
          ? `<a href="${url("/admin")}">Admin</a> | `
          : ""
      }
      <a href="${url("/logout")}">Logout</a>
    </p>

    <hr>

    <h2>Your apps</h2>

    <pre>${JSON.stringify(apps, null, 2)}</pre>
    `
  };
};
