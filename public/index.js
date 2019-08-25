import {
  html,
  Component,
  render
} from "https://unpkg.com/htm/preact/index.mjs?module";
import { del, get, set } from "https://unpkg.com/idb-keyval?module";
import { oauthLoginUrl } from "https://cdn.pika.dev/@octokit/oauth-login-url";

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

      await del("oauth-state");
      if (expectedOAuthState !== retrievedOAuthState) {
        return this.setState({
          loading: false,
          error: `OAuth state does not match`
        });
      }

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
        return this.setState({
          loading: false,
          session,
          error: null
        });
      } catch (error) {
        return this.setState({
          loading: false,
          error: `Something went wrong: ${error}`
        });
      }
    }

    const session = await get("session");
    return this.setState({
      session
    });
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

  render() {
    if (this.state.loading) {
      return html`
        <div class="loading">
          <h1>Loading ...</h1>
        </div>
      `;
    }
    if (!this.state.session) {
      return html`
        <div class="login">
          <${Error} error=${this.state.error} />
          <h1>GitHub Secrets Keeper</h1>
          <p>
            <button onClick=${() => this.login()}>Login with GitHub</button>
          </p>
        </div>
      `;
    }

    return html`
      <div class="app">
        <${Error} error=${this.state.error} />
        <h1>Welcome, ${this.state.session.login}!</h1>
        <p>
          <button onClick=${() => this.logout()}>Logout</button>
        </p>
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
