import {
  html,
  Component,
  render
} from "https://unpkg.com/htm@2.2.1/preact/standalone.mjs?module";
import { del, get, set } from "https://cdn.pika.dev/idb-keyval/v3";
import { oauthLoginUrl } from "https://cdn.pika.dev/@octokit/oauth-login-url/v2";

// get client_id based on environment
const CLIENT_ID = location.href.startsWith(
  "https://mzix1huilh.execute-api.us-west-2.amazonaws.com/staging"
)
  ? "06515a89ea053688c263"
  : location.href.startsWith(
      "https://mzix1huilh.execute-api.us-west-2.amazonaws.com/production"
    )
  ? "81910a1a9a45df0f8fc6"
  : "2c171c24de9e23c6a30c";

class App extends Component {
  componentDidMount() {
    this.setState({
      loading: true,
      apps: []
    });
    this.init();
  }

  async init() {
    const expectedOAuthState = await get("oauth-state");

    const { searchParams } = new URL(location.href);
    const code = searchParams.get("code");
    const retrievedOAuthState = searchParams.get("state");

    if (code) {
      this.setState({
        loading: true
      });

      // remove ?code=... and &state=... from URL
      const path =
        location.pathname +
        location.search
          .replace(/&?\bcode=\w+/, "")
          .replace(/&?\bstate=\w+/, "")
          .replace(/\?$/, "");
      history.pushState({}, "", path);

      // remove ouath state from local store
      await del("oauth-state");

      // verify oauth state
      if (expectedOAuthState !== retrievedOAuthState) {
        return this.setState({
          loading: false,
          error: `OAuth state does not match`
        });
      }

      // retrieve session
      try {
        const response = await fetch(`api/${CLIENT_ID}/${code}`);

        if (response.status === 404) {
          return this.setState({
            loading: false,
            error: `OAuth app with client id ${CLIENT_ID} could not be found.`
          });
        }

        const session = await response.json();
        await set("session", session);
        this.setState({
          loading: false,
          session,
          error: null
        });

        this.fetchApps();

        return;
      } catch (error) {
        return this.setState({
          loading: false,
          error: `Something went wrong: ${error}`
        });
      }
    }

    const session = await get("session");

    this.setState({
      loading: false,
      session
    });

    if (session) {
      this.fetchApps();
    }
  }

  async login() {
    const { url, state } = oauthLoginUrl({
      clientId: CLIENT_ID
    });

    await set("oauth-state", state);
    location.href = url;
  }

  async logout() {
    await del("session");
    this.setState({
      session: null,
      error: null
    });
  }

  async fetchApps() {
    const response = await fetch("api/user/client-secrets", {
      headers: {
        authorization: `token ${this.state.session.token}`
      }
    });

    if (response.status !== 200) {
      return this.setState({
        error: `Could not fetch apps`
      });
    }

    this.setState({
      apps: await response.json()
    });
  }

  showAppForm() {
    this.setState({
      showAppForm: true
    });
  }

  async createApp(event) {
    event.preventDefault();
    const app = {};
    const form = event.target;
    for (const input of form.querySelectorAll("input")) {
      app[input.name] = input.value;
    }

    const response = await fetch("api/user/client-secrets", {
      headers: {
        authorization: `token ${this.state.session.token}`
      },
      method: "post",
      body: JSON.stringify(app)
    });

    if (response.status !== 201) {
      return setState({
        error: `Could not create new app`
      });
    }

    this.setState({
      showAppForm: false,
      apps: this.state.apps.concat(await response.json())
    });
  }

  async deleteApp(event) {
    const clientId = event.target.closest("tr").dataset.id;
    const response = await fetch(`api/user/client-secrets/${clientId}`, {
      headers: {
        authorization: `token ${this.state.session.token}`
      },
      method: "delete"
    });

    if (response.status !== 204) {
      return this.setState({
        error: `Could not delete app ${clientId}`
      });
    }

    this.setState({
      apps: this.state.apps.filter(app => app.clientId !== clientId)
    });
  }

  render(
    props,
    {
      loading = true,
      error = null,
      session = null,
      apps = [],
      showAppForm = false
    }
  ) {
    if (loading) {
      return html`
        <div class="loading">
          <h1>Loading ...</h1>
        </div>
      `;
    }
    if (!session) {
      return html`
        <div class="login">
          <${Error} error=${error} />
          <h1>GitHub Secrets Keeper</h1>
          <p>
            <button onClick=${() => this.login()}>Login with GitHub</button>
          </p>
        </div>
      `;
    }

    return html`
      <div class="app">
        <${Error} error=${error} />

        <p class="logout">
          <button onClick=${() => this.logout()}>Logout</button>
        </p>
        <h1>Welcome, ${session.login}!</h1>

        <h2>Your secrets</h2>
        ${apps.length > 0 &&
          html`
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Client ID</th>
                  <th>Client Secret</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${apps.map(
                  app => html`
                    <tr data-id="${app.clientId}">
                      <td>${app.name}</td>
                      <td>${app.clientId}</td>
                      <td>${app.clientSecret}</td>
                      <td>
                        ${new Date(app.createdAt).toISOString().substr(0, 10)}
                      </td>
                      <td>
                        <span onClick=${event => this.deleteApp(event)}
                          >delete</span
                        >
                      </td>
                    </tr>
                  `
                )}
              </tbody>
            </table>
          `}
        ${apps.length === 0 &&
          html`
            <p>No credentials created yet</p>
          `}
        ${!showAppForm &&
          html`
            <p>
              <button onClick=${() => this.showAppForm()}>Create</button>
            </p>
          `}
        ${showAppForm &&
          html`
            <form onSubmit=${event => this.createApp(event)}>
              <p>
                <label>
                  App name
                  <input name="name" />
                </label>
              </p>
              <p>
                <label>
                  Client ID
                  <input name="clientId" />
                </label>
              </p>
              <p>
                <label>
                  Client Secret
                  <input name="clientSecret" />
                </label>
              </p>
              <p>
                <button type="submit">create</button>
              </p>
            </form>
          `}
      </div>
    `;
  }
}

const Error = ({ error }) => {
  if (!error) return;

  return html`
    <div class="error">${error}</div>
  `;
};

render(
  html`
    <${App} />
  `,
  document.body
);
