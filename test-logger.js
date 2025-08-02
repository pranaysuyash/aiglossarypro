console.log('Before logger import');
import { log } from './server/utils/logger';
console.log('After logger import');
log.info('Test log');
console.log('After log.info');
process.exit(0);
