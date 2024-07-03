import * as dotenv from 'dotenv';
import { Dropbox } from 'dropbox';
import fetch from 'node-fetch';

dotenv.config();

const dbx = new Dropbox({
    accessToken: process.env.ACCESS_TOKEN,
    fetch: fetch
})

export default dbx;