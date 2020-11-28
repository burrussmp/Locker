import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compress from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import postRoutes from './routes/post.routes';
import mediaRoutes from './routes/media.routes';
import searchRoutes from './routes/search.routes';
import organizationRoutes from './routes/organization.routes';
import employeeRoutes from './routes/employee.routes';
import productRoutes from './routes/product.routes';

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
app.use('/', mediaRoutes);
app.use('/', searchRoutes);
app.use('/', organizationRoutes);
app.use('/', employeeRoutes);
app.use('/', productRoutes);

export default app;
