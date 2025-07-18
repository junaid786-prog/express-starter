const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FileShare API',
            version: '1.0.0',
            description: 'REST API for authentication, user management, and file sharing'
        },
        servers: [
            {
                url: 'http://localhost:8000/api',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./src/api/docs/*.yaml']
};

const swaggerSpec = swaggerJSDoc(options);

function setupSwagger(app) {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
