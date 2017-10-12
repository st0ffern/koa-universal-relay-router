# koa-universal-relay-router

[![Greenkeeper badge](https://badges.greenkeeper.io/stoffern/koa-universal-relay-router.svg)](https://greenkeeper.io/)
Koa middleware for Universal/Isomorphic React + Relay rendering and routing

### Installation
```js
npm i -S koa-universal-relay-router
```
or
```js
yarn add koa-universal-relay-router
```

###Usage
#####client.js
```js
import Relay from 'react-relay'
import {Router, browserHistory, applyRouterMiddleware } from 'react-router'
import useRelay from 'react-router-relay' 
import {IsomorphicRelay, IsomorphicRouter} from 'koa-universal-relay-router'

const environment = new Relay.Environment();
environment.injectNetworkLayer(
    new Relay.DefaultNetworkLayer('http://example.com/graphql')
)

// Inject preloaded data from the server side
const data = JSON.parse(document.getElementById('preloaded-data').textContent);
IsomorphicRelay.injectPreparedData(environment, data)

// Find the root element
const rootElement = document.getElementById('root');

// Use the same routes object as on the server
match({ routes, history: browserHistory }, (error, redirectLocation, renderProps) => {
  IsomorphicRouter.prepareInitialRender(environment, renderProps).then(props => {
    ReactDOM.render(
      <Router 
        history={browserHistory}
        render={applyRouterMiddleware(useRelay)}
        environment={Relay.Store}
        {...props} 
      />
    , rootElement);
  });
})
```

#####server.js
```js
import Koa from 'koa'
import routes from './routes'
import Relay from 'react-relay'
import {renderServer} from 'koa-universal-relay-router'

let app = new Koa()
app.use(renderServer({
    networkLayer: new Relay.DefaultNetworkLayer('http://example.com/graphql'),
    //or graphqlUrl: 'http://example.com/graphql',
    routes: routes,
    render: async (reactOutput, preloadedData, helmet) => {
        return `
            <!DOCTYPE>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    ${helmet.title.toString()}
                    ${helmet.meta.toString()}
                    ${helmet.link.toString()}
                </head>
                <body>
                    <div id="root">${reactOutput}</div>
                    <script id="preloaded-data" type="application/json">${preloadedData}</script>
                    <script src="app.js"></script>
                </body>
            </html>
        `;
    }
}))
app.listen(8080, () => {
    console.log('Server is up')
})
```

#### Props
#####renderServer
| Prop | Type | Description |
|---|---|---|
|**`routes`**|`react-routes`| Routes for naviation|
|**`render`**|`function`|Function to render default client template|
|**`networkLayer`**|`Relay NetworkLayer`|Send a custom Relay NetworkLayer into the router|
|**`graphqlUrl`**|`string`|URI of the GraphQL API|
