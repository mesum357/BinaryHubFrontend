const path = require('path');
const dotenv = require('dotenv');

const appRoot = path.join(__dirname, '..');
const repoRoot = path.join(__dirname, '..', '..');

dotenv.config({ path: path.join(appRoot, '.env') });
dotenv.config({ path: path.join(repoRoot, '.env') });
