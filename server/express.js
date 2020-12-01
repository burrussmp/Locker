import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compress from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from '@server/routes/user.routes';
import authRoutes from '@server/routes/auth.routes';
import postRoutes from '@server/routes/post.routes';
import commentRoutes from '@server/routes/comment.routes';
import mediaRoutes from '@server/routes/media.routes';
import searchRoutes from '@server/routes/search.routes';
import organizationRoutes from '@server/routes/organization.routes';
import employeeRoutes from '@server/routes/employee.routes';
import productRoutes from '@server/routes/product.routes';

// modules for server side rendering

// comment out before building for production
import devBundle from './devBundle';

const app = express();

// comment out before building for production
devBundle.compile(app);

// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(compress());
// secure apps by setting various HTTP headers
app.use(helmet());
// enable CORS - Cross Origin Resource Sharing
app.use(cors());
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

export default app;
