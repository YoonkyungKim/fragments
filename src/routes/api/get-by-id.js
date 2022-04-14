/**
 * Get a fragment data with the given ID
 */
const path = require('path');
const md = require('markdown-it')({
  html: true, //..?
});
const logger = require('../../logger');
const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');

module.exports = async (req, res) => {
  logger.debug(`owner id and id: ${req.user}, ${req.params.id}`);

  try {
    const fragment = await Fragment.byId(req.user, req.params.id.split('.')[0]);

    logger.debug(`get by id req.params: ${JSON.stringify(req.params)}`);

    // If the id does not represent a known fragment, returns an HTTP 404 with an appropriate error message.
    if (!fragment) {
      logger.debug('no fragment with this id (in get-by-id.js)');
      return res.status(404).json(createErrorResponse(404, "No fragment with this id"));
    }

    const data = await fragment.getData();

    logger.debug('data: ' + data);

    const extension = path.extname(req.params.id);
    logger.debug('extension: ' + extension);
    if (extension) {
      const convertableFormats = await fragment.formats;
      logger.debug("mimeType: " + fragment.mimeType);
      logger.debug("convertable formats: " + convertableFormats);
      let typeConvertedTo;
      let valid = true;
      // Initially, you only need to support Markdown fragments (.md) converted to HTML (.html)
      if (extension === '.html') {
        typeConvertedTo = 'text/html';
      } else {
        valid = false;
      }
      if (!convertableFormats.includes(typeConvertedTo)) {
        valid = false;
      }
      logger.debug("valid: " + valid);

      // If the extension used represents an unknown or unsupported type, or if the fragment cannot be converted to this type, 
      // an HTTP 415 error is returned instead, with an appropriate message. For example, a plain text fragment cannot be returned as a PNG.
      if (!valid){
        return res.status(415).json(createErrorResponse(415, "Extension provided is unsupported type or fragment cannot be converted to this type"));
      }

      // For a2, only need to support Markdown fragments (.md) converted to HTML (.html)
      if (fragment.type === 'text/markdown' && typeConvertedTo === 'text/html') {
        logger.debug("convert from md to html: ");
        logger.debug(data.toString());

        let convertedResult = md.render(data.toString());
        logger.debug(convertedResult);
        convertedResult = Buffer.from(convertedResult);

        res.set('Content-Type', typeConvertedTo);
        res.status(200).send(convertedResult);
      }
    } else {
      logger.debug("fragment type in get id: " + fragment.type);
      // Send the raw buffer 
      // set the proper content-type header with the fragment's type
      res.set('Content-Type', fragment.type);
      res.status(200).send(data);
    }
  } catch (e) {
    logger.warn(e.message, 'Error getting fragment by id');
    res.status(500).json(createErrorResponse(500, e.message));
  }
};
  