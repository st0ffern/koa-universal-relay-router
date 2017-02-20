import React from 'react'
import Relay from 'react-relay'
import Helmet from 'react-helmet'
import {match} from 'react-router'
import ReactDOMServer from 'react-dom/server'
import IsomorphicRouter from 'isomorphic-relay-router'


export default (options) => {
    
    // Validate options
    if (!options.routes) throw new Error('Missing options.routes in renderServer')
    else if (!options.render) throw new Error('Missing render function in renderServer')
    else if (!options.networkLayer && !options.graphqlUrl) throw new Error('You need to pass a GraphQL URL or a NetworkLayer, check docs')
    else if (options.networkLayer && options.graphqlUrl) throw new Error('You cannot set both GraphQL URL and a NetworkLayer, please set just one of them')

    // Setup NetworkLayer
    let networkLayer = ''
    if (options.graphqlUrl){
        networkLayer = new Relay.DefaultNetworkLayer(options.graphqlUrl)
    }else{
        networkLayer = options.networkLayer
    }

    // Return middleware
    return async (ctx, next) => {
        const {redirectLocation, renderProps} = await new Promise((resolve, reject) => {
            match({
                routes: options.routes,
                location: ctx.req.url
            }, (err, redirectLocation, renderProps) => {
                if (err) {
                    return reject(err)
                }
                return resolve({redirectLocation, renderProps})
            })
        })

        if (redirectLocation) {
            ctx.redirect(redirectLocation.pathname + redirectLocation.search)
        } else if (renderProps) {
            const {data, props} = await IsomorphicRouter.prepareData(renderProps, networkLayer)
            const reactOutput = ReactDOMServer.renderToString(IsomorphicRouter.render(props))
            const preloadedData = JSON.stringify(data)
            const helmet = Helmet.rewind()

            ctx.status = 200
            ctx.body = await options.render(reactOutput, preloadedData, helmet)
        } else {
            ctx.throw(404, 'Not found')
        }
    }
}
