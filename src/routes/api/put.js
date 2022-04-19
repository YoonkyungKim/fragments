// Allows the authenticated user to update (i.e., replace) the data for their existing fragment with the specified id.
// The entire request body is used to update the fragment's data, replacing the original value.
const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

module.exports = async (req, res) => {
  logger.debug({ body: req.body }, 'PUT /fragments/:id');

  if (!Buffer.isBuffer(req.body)) {
    return res.status(415).json(createErrorResponse(415, 'Unsupported Media Type'));
  }

  const id = req.params.id.split('.')[0];

  try {
    const existingFragment = await Fragment.byId(req.user, id);

    // If no such fragment exists with the given id, returns an HTTP 404 with an appropriate error message.
    if (!existingFragment) {
      return res.status(404).json(createErrorResponse(404, 'No fragment with this id'));
    }
    
    // If the Content-Type of the request does not match the existing fragment's type, 
    // returns an HTTP 400 with an appropriate error message. A fragment's type can not be changed after it is created.
    if (existingFragment.type !== req.get('Content-Type')) {
      return res.status(400).json(createErrorResponse(400, "Content type doesn't match the existing fragment's type"));
    }

    const newFragment = new Fragment({ ownerId: req.user, id: id, created: existingFragment.created, type: req.get('Content-Type') });
    await newFragment.save();
    await newFragment.setData(req.body);

    logger.debug({ newFragment }, 'Fragment updated');
    
    res.set('Content-Type', newFragment.type);
    res.set('Location', `${process.env.API_URL}/v1/fragments/${newFragment.id}`);
    res.status(201).json(createSuccessResponse({
      fragment: newFragment,
    }));
  } catch (err) {
    res.status(500).json(createErrorResponse(500, err));
  }
}