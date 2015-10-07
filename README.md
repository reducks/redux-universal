# Redux Universal

A Redux store enhancer taking care of promise resolution for building universal apps.

## Background

Rendering a Redux application on the server requires you to give up on certain programming patterns. For once you can't use singletons on the server as they would be shared between multiple users. Another issue we encountered is resolving Promises trigger from actions within components. While many Redux boilerplates use custom routers to handle data fetching on the client & server we decided to approach it differently. Our goal was to surface a minimal API that can be plugged into any existing Redux application without adding limitations in the way people built their applications.

## Setup

To install the stable version run:

```
npm install --save redux-univeral
```

In the file where you configure your store you need to make sure to use the applyMiddleware when rendering in the backend.

```
const applyMiddleware = __SERVER__ ? require('redux-universal') : require('redux').applyMiddleware;
```

The custom applyMiddleware enhances the store and appends a new method to it.

```
store.renderUniversal(ReactDOM.renderToString, <RootComponent store={store} />)
  .then(({ output }) => {
    response.send(output);
  })
  .catch(({ output, error }) => {
    console.warn(error.message);
    response.send(output);
  });
```


## How it Works

Redux Universal will catch any Promise returned by a middleware. The action itself can be a function (redux-thunk) or an object with a type (redux-catch-promise). Calling `renderUniversal` returns a Promise which is fulfilled once all Promises are resolved.

## Guide with Redux-catch-promise

TODO

## Guide with Redux-thunk

Cities.js

Dispatch the fetchCities action once the Components gets initialized.

```
class Cities extends Component {

  componentWillMount() {
    this.props.dispatch(fetchCities());
  }

  render() {
    return <div>Cities</div>;
  }
}
```

CityActions.js

fetchCities returns a Promise which will fulfill once the response came in and is converted to JSON.

```
const requestCities = () => { type: REQUEST_CITIES };
const receiveCities = (json) => { type: RECEIVE_CITIES, payload: json };

export function fetchCities() {
  return (dispatch) => {
    dispatch(requestCities());

    return fetch('http://cities.example.com')
      .then(response => response.json())
      .then(json => dispatch(receiveCities(json)));
  };
}
```

configureStore.js

Depending on if the application is rendered on the server or client the normal Redux's applyMiddleware or Redux-universal's applyMiddleware must be used.

```
import reducer from '../reducers/index';
import thunkMiddleware from 'redux-thunk';
const applyMiddleware = __SERVER__ ?
  require('redux-universal') :
  require('redux').applyMiddleware;

const createStoreWithMiddlewares = applyMiddleware(thunkMiddleware)(createStore);

export default function configureStore(initialState = {}) {
  return createStoreWithMiddlewares(reducer, initialState);
}
```

server.js
```
function renderHtml(html, initialState) {
  return `<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body>
        <div id="root">${html}</div>
        <script>
          window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};
        </script>
        <script type="application/javascript" src="/static/bundle.js"></script>
      </body>
    </html>`;
}

const app = express();

app.use((request, response) => {
  const history = createHistory({
    getCurrentLocation: () => createLocation(request.path, {}, undefined, 'root'),
  });

  // Create a new Redux store instance
  const store = configureStore();
  const rootComponent = (<Root store={store} history={history} />);

  store.renderUniversal(ReactDOMServer.renderToString, rootComponent)
    .then(({ output }) => {
      const state = store.getState();
      response.send(renderHtml(html, state));
    })
    .catch(({ output, error }) => {
      const state = store.getState();
      response.send(renderHtml(html, state));
    });
});

app.listen(8080);
```

## Limitations

To prevent endless loops there is a mechanism to detect in case the same action
is triggered multiple times. In this case the promise is rejected. While this
works pretty well we still recommend to write your application in a way that
double fetching won't be caused by rendering the app multiple times.

## Why (Isomorphic) Universal rendering?

1. Faster Perceived Load Time

The network roundtrips to load all the resources take time. By already pre-rendering the first page impression the user experience can be improved. This becomes even more important in places with high internet latency.

2. Search Engine Indexability

Many search engines only rely on server side rendering for indexing. Google already improved their search crawler to index client side rendered content, but they still struggle challenges according to this [Angular2 document](https://docs.google.com/document/d/1q6g9UlmEZDXgrkY88AJZ6MUrUxcnwhBGS0EXbVlYicY). By rendering the page on the server you simply

3. Code Reusability & Maintainability

Libraries can be shared between the backend & front-end.

## Client side vs Universal rendering

### Use case with client side rendering

- (Client) Request the website's HTML
- (Server) Serve the page without content
- (Client) Request JavaScript code based on sources in the HTML
- (Server) Serve the JavaScript code
- (Client) Load & execute JavaScript
- (Client) -> Render a loading page
- (Client) Request data based on the executed code
- (Server) Collect and serve the data
- (Client) -> Render the content

Caching definitely helps to reduce the loading times and can be done easily for the HTML as well as for the code.

### Use case with universal rendering

JavaScript code is already loaded when starting the server. From experience I saw this can take a couple hundred milliseconds.

- (Client) Request the website's HTML
- (Server) Execute the JavaScript Code
- (Server) Collect the data
- (Server) Render the page in the backend
- (Server) Serve the page with content
- (Client) -> Render the content
- (Client) Request JavaScript code based on sources in the HTML
- (Server) Serve the JavaScript code
- (Client) Load & execute JavaScript

## Pros & Cons

While with the initial site can be serve faster with client-side rendering there is no relvant content for the user. The network roundtrips increase the time until the user actually sees relevant content. While with the universal approach it takes a bit longer until the user receives the first page it already comes with the content and the total loading time is faster.

### More resource

- https://strongloop.com/strongblog/node-js-react-isomorphic-javascript-why-it-matters/
- http://nerds.airbnb.com/isomorphic-javascript-future-web-apps/
- https://docs.google.com/document/d/1q6g9UlmEZDXgrkY88AJZ6MUrUxcnwhBGS0EXbVlYicY/edit


## Initial Technical Requirements for redux-universal

It should just work out of the box without changing your front-end code. No special routing or restrictions should be needed.

All tools must be ready to work with server-side rendering. Luckily that's the case in the React/Redux eco-sytem:

- React (supports server side rendering)
- React-Router
- Redux (Flux from Facebook uses singletons which makes it hard to use on the backend)
- webpack or browserify
- ismorphic-fetch

## License

MIT
