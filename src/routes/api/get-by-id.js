/**
 * Get a fragment data with the given ID
 */

const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');

module.exports = async (req, res) => {
  logger.debug(`owner id and id: ${req.user}, ${req.params.id}`);
  
  const fragment = await Fragment.byId(req.user, req.params.id);
  const data = await fragment.getData();
  res.status(200).json(data.toString());
};