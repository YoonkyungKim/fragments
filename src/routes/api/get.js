/**
 * Get a list of fragments for the current user
 */

const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse } = require('../../response');

module.exports = async (req, res) => {
  logger.debug("req.query: " + JSON.stringify(req.query));
  let expand;
  (req.query.expand && req.query.expand === "1") ? expand = true : expand = false;
  const fragments = await Fragment.byUser(req.user, expand);
  res.status(200).json(createSuccessResponse({
    fragments: fragments,
  }));
};