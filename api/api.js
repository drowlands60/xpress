const express = require('express');
const artistRouter = require('./artists');
const seriesRouter = require('./series');

const apiRouter = express.Router();

apiRouter.use('/artists', artistRouter);
apiRouter.use('/series', seriesRouter);

module.exports = apiRouter;