import express from 'express'
import path from 'path'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import compress from 'compression'
import cors from 'cors'
import helmet from 'helmet'
import multer from 'multer';
import Template from './../template'
import userRoutes from './routes/user.routes'
import authRoutes from './routes/auth.routes'
import postRoutes from './routes/post.routes'

// modules for server side rendering
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import MainRouter from './../client/MainRouter'
import { StaticRouter } from 'react-router-dom'

import { ServerStyleSheets, ThemeProvider } from '@material-ui/styles'
import theme from './../client/theme'
//end

//comment out before building for production
import devBundle from './devBundle'

//check permissions on API calls (express middleware)
import permissionCtrl from './permissions';
import authCtrl from './controllers/auth.controller';

const CURRENT_WORKING_DIR = process.cwd()
const app = express()

//comment out before building for production
devBundle.compile(app)

// parse body params and attache them to req.body
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(compress())
// secure apps by setting various HTTP headers
app.use(helmet())
// enable CORS - Cross Origin Resource Sharing
app.use(cors())
// form data
app.use('/dist', express.static(path.join(CURRENT_WORKING_DIR, 'dist')))

// authorization pipeline
app.use(permissionCtrl.checkPermissions);
app.use(authCtrl.requireLogin)

// mount routes
app.use('/', userRoutes)
app.use('/', authRoutes)
app.use('/', postRoutes)

app.get('*', (req, res) => {
  const sheets = new ServerStyleSheets()

  const context = {}
  const markup = ReactDOMServer.renderToString(
      sheets.collect(
        <StaticRouter location={req.url} context={context}>
          <ThemeProvider theme={theme}>
            <MainRouter />
          </ThemeProvider>
        </StaticRouter>
      )
    )
    if (context.url) {
      return res.redirect(303, context.url)
    }
    const css = sheets.toString()
    res.status(200).send(Template({
      markup: markup,
      css: css
    }))
})

export default app
