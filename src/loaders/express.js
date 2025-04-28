const app = require('../config/app.js');
const logger = require('../config/logger.js');

const startExpress = async (port) => {
    return new Promise((resolve) => {
        const server = app.listen(port, () => {
            logger.info(`Server running on port ${port}`);
            resolve(server);
        });
    });
};

module.exports = startExpress;