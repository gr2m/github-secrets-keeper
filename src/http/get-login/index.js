const arc = require("@architect/functions");
const { createOAuthAppAuth } = require("@octokit/auth-oauth-app");
const { oauthLoginUrl } = require("@octokit/oauth-login-url");
const { request } = require("@octokit/request");

/**
 * GET /login does two things
 *
 * 1. If no query parameters are present, it redirects to the OAuth Login URL on github.com.
 *    Once the user authenticates the app, they get redirected back to /login?code=...
 * 2. When the /login?code=... query parameter is present, exchange it for a token and persist the session
 */
exports.handler = async function http(req) {
  console.log("process.env.NODE_ENV", process.env.NODE_ENV);
  console.log(req);

  const { code, state } = req.queryStringParameters || {};

  if (!code) {
    // https://github.com/octokit/oauth-login-url.js
    const { url, state } = oauthLoginUrl({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET
    });

    // reads the session from DynamoDB
    let session = await arc.http.session.read(req);

    // save the session state to DynamoDB
    let cookie = await arc.http.session.write(
      Object.assign(session, { state })
    );

    return { status: 302, headers: { "set-cookie": cookie, location: url } };
  }

  // reads the session from DynamoDB
  let session = await arc.http.session.read(req);

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

  return {
    status: 302,
    headers: {
      "set-cookie": cookie,
      location: arc.http.helpers.url("/dashboard")
    }
  };
};
