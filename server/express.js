import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compress from 'compression';
import cors from 'cors';
import helmet from 'helmet';

import logger from '@server/logger';

import userRoutes from '@server/routes/user.routes';
import authRoutes from '@server/routes/auth.routes';
import postRoutes from '@server/routes/post.routes';
import commentRoutes from '@server/routes/comment.routes';
import mediaRoutes from '@server/routes/media.routes';
import searchRoutes from '@server/routes/search.routes';
import organizationRoutes from '@server/routes/organization.routes';
import employeeRoutes from '@server/routes/employee.routes';
import productRoutes from '@server/routes/product.routes';
import collectionRoutes from '@server/routes/collection.routes';

import lockerRoutes from '@server/routes/locker/locker.routes';
import lockerCollectionRoutes from '@server/routes/locker/locker.collection.routes';

// modules for server side rendering
const app = express();
// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(compress());
// secure apps by setting various HTTP headers
app.use(helmet());
// enable CORS - Cross Origin Resource Sharing
app.use(cors());
// add logger
// if (process.env.NODE_ENV == 'development') {
//   app.use(logger);
// }
// mount routes
app.use('/', userRoutes);
app.use('/', authRoutes);
app.use('/', postRoutes);
app.use('/', commentRoutes);
app.use('/', mediaRoutes);
app.use('/', searchRoutes);
app.use('/', organizationRoutes);
app.use('/', employeeRoutes);
app.use('/', productRoutes);
app.use('/', collectionRoutes);
app.use('/', lockerRoutes);
app.use('/', lockerCollectionRoutes)

export default app;
