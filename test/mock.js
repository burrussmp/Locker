import {dropDatabase} from '@test/helper';
import '@server/server';

dropDatabase();
console.log('Dropped Database');