const arc = require("@architect/functions");
const url = arc.http.helpers.url;

exports.handler = async function http(req) {
  console.log(req.httpMethod, req.path);

  // reads the session from DynamoDB
  const session = await arc.http.session.read(req);

  if (!session.user) {
    return { status: 302, headers: { location: url("/") } };
  }

  if (session.user.login !== "gr2m") {
    console.log(`Invalid /admin access by ${session.user.login}`);
    return { status: 302, headers: { location: url("/dashboard") } };
  }

  const data = await arc.tables();
  const users = await data.users.scan({});
  const apps = await data.apps.scan({});

  return {
    headers: { "content-type": "text/html; charset=utf8" },
    body: `
    <h1>Admin</h1>

    <p>
      <a href="${url("/dashboard")}">Dashboard</a> |
      <a href="${url("/logout")}">Logout</a>
    </p>

    <hr>

    <h2>Users</h2>

    <pre>${JSON.stringify(users, null, 2)}</pre>

    <h2>Apps</h2>

    <pre>${JSON.stringify(apps, null, 2)}</pre>
    `
  };
};
