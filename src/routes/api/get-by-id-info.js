/**
 * GET /fragments/:id/info
 * Allows the authenticated user to get (i.e., read) the metadata for one of their existing fragments with the specified id
 * If no such fragment exists, returns an HTTP 404 with an appropriate error message
 */

const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  // logger.debug("req.query in get-by-id-info: " + JSON.stringify(req.query));
  // logger.debug(`owner id and id: ${req.user}, ${req.params.id}`);

  // Any await'ed call needs to have the error case handled so your server doesn't crash
  try {
    const fragment = await Fragment.byId(req.user, req.params.id);
    
    logger.debug(`get by id req.params: ${JSON.stringify(req.params)}`);

    // If the id does not represent a known fragment, returns an HTTP 404 with an appropriate error message.
    if (!fragment) {
      return res.status(404).json(createErrorResponse(404, "No fragment with this id"));
    }

    res.status(200).json(createSuccessResponse({
      fragment: fragment,
    }));
  } catch (e) {
    logger.warn(e.message, 'Error getting fragment by id');
    res.status(500).json(createErrorResponse(500, e.message));
  }  
}
  