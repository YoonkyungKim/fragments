/**
 * Allows the authenticated user to delete one of their existing fragments with the given id.
 */

const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');


module.exports = async (req, res) => {
  logger.debug(`owner id and id: ${req.user}, ${req.params.id}`);

  const id = req.params.id.split('.')[0];
  try {
    const fragment = await Fragment.byId(req.user, id);

    // If the id is not found, returns an HTTP 404 with an appropriate error message.
    if (!fragment) {
      return res.status(404).json(createErrorResponse(404, "Id not found"));
    }

    await Fragment.delete(req.user, id);

    // Once the fragment is deleted, an HTTP 200 is returned, along with the ok status:
    res.status(200).json(createSuccessResponse());
  } catch (e) {
    res.status(500).json(createErrorResponse(500, e.message));
  }  
}