/**
 * Get a list of fragments for the current user
 */

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse } = require('../../response');

module.exports = async (req, res) => {
  const fragments = await Fragment.byUser(req.user);
  res.status(200).json(createSuccessResponse({
    fragments: fragments,
  }));
};