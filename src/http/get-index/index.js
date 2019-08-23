const arc = require("@architect/functions");
const { createOAuthAppAuth } = require("@octokit/auth-oauth-app");
const { request } = require("@octokit/request");

exports.handler = async function http(req) {
  console.log(req.httpMethod, req.path);

  // reads the session from DynamoDB
  const session = await arc.http.session.read(req);

  const { code, state } = req.queryStringParameters || {};

  if (!code) {
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
  }

  // verify OAuth state
  if (session.state !== state) {
    return {
      status: 401,
      headers: { "content-type": "text/html; charset=utf8" },
      body: `
        <h1>OAuth redirect could not be verified.</h1> 
      `
    };
  }

  const auth = createOAuthAppAuth({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    code,
    state
  });

  let user;
  try {
    const { data } = await auth.hook(request, "GET /user");
    user = {
      id: data.id,
      login: data.login
    };
  } catch (error) {
    console.log(error);

    return {
      status: error.status,
      headers: { "content-type": "text/html; charset=utf8" },
      body: `
        <h1>${error.message}</h1> 
      `
    };
  }

  // save the session state to DynamoDB
  delete session.state;
  let cookie = await arc.http.session.write(Object.assign(session, { user }));

  // create user object in DynomoDB unless it anlready exists
  const data = await arc.tables();
  const dbUser = await data.users.get({ id: user.id });

  if (!dbUser) {
    console.log(`[db] user created: ${user.login} (${user.id})`);
    await data.users.put({
      ...user,
      createdAt: Date.now(),
      lastLoginAt: Date.now()
    });
  } else {
    console.log(`[db] user login: ${user.login} (${user.id})`);
    dbUser.lastLoginAt = Date.now();
    await data.users.put(dbUser);
  }

  return { cookie, status: 302, location: "/" };
};
