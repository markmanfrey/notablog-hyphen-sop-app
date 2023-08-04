const { Logger } = require('../lib')

const log = new Logger('HelloApp', { logLevel: 'verbose', useColor: true })

log.verbose('Something verbose', 'Second verbose message')
log.debug('Something for debugging')
log.info('Some useful info')
log.warn('Some warnings')
log.error('Something goes wrong')
