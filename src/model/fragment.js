// Use https://www.npmjs.com/package/nanoid to create unique IDs
const { nanoid } = require('nanoid');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

const logger = require('../logger');

const validTypes = [
  'text/plain',
  'text/markdown',
  'text/html',
  'application/json',
  // 'image/png',
  // 'image/jpeg',
  // 'image/webp',
  // 'image/gif',
];

// NOTE: we store the entire Content-Type (i.e., with the charset if present), 
// but also allow using only the media type (e.g., text/html vs. text/html; charset=iso-8859-1).

class Fragment {
  constructor({ id, ownerId, type, size = 0 }) {
    if (!ownerId || !type) {
      throw new Error("owner id and type is required");
    }	else if (typeof size !== "number") {
      throw new Error("size must be a number");
    } else if (size < 0) {
      throw new Error("size cannot be negative");
    } else if (!(Fragment.isSupportedType(type))) {
      throw new Error("invalid type");
    } else {
      this.id = id || nanoid();
      this.ownerId = ownerId;
      this.created = new Date().toISOString();
      this.updated = new Date().toISOString();
      this.type = type;
      this.size = size;
    }
  }

  /**
	 * Get all fragments (id or full) for the given user
	 * @param {string} ownerId user's hashed email
	 * @param {boolean} expand whether to expand ids to full fragments
	 * @returns Promise<Array<Fragment>>
	 */
  static async byUser(ownerId, expand = false) {
    try {
      return await listFragments(ownerId, expand);
    } catch (err) {
      logger.error({ err }, 'Error getting all fragments');
      throw new Error('Error getting all fragments');
    }
  }

  /**
	 * Gets a fragment for the user by the given id.
	 * @param {string} ownerId user's hashed email
	 * @param {string} id fragment's id
	 * @returns Promise<Fragment>
	 */
  static async byId(ownerId, id) {
    try {
      return await readFragment(ownerId, id);
    } catch (err) {
      logger.warn({ err }, 'error reading fragment from DynamoDB');
      throw new Error('unable to read fragment data');
    }
  }

  /**
	 * Delete the user's fragment data and metadata for the given id
	 * @param {string} ownerId user's hashed email
	 * @param {string} id fragment's id
	 * @returns Promise
	 */
  static async delete(ownerId, id) {
    try {
      return await deleteFragment(ownerId, id);
    } catch (err) {
      logger.error({ err }, 'Unable to delete S3 object');
      throw new Error('Unable to delete S3 object');
    }
  }

  /**
	 * Saves the current fragment to the database
	 * @returns Promise
	 */
  save() {
    this.updated = new Date().toISOString();
    return writeFragment(this);
  }

  /**
	 * Gets the fragment's data from the database
	 * @returns Promise<Buffer>
	 */
  async getData() {
    try {
      return await readFragmentData(this.ownerId, this.id);
    } catch (err) {
      logger.warn({ err }, 'Error streaming fragment data from S3');
      throw new Error('unable to read fragment data');
    }
  }

  /**
	 * Set's the fragment's data in the database
	 * @param {Buffer} data
	 * @returns Promise
	 */
  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error("data is not a Buffer");
    } else {
      this.size = Buffer.byteLength(data);
      this.save();
      try {
        return await writeFragmentData(this.ownerId, this.id, data);
      } catch (err) {
        logger.error({ err }, 'Error uploading fragment data to S3');
        throw new Error('unable to upload fragment data');
      }
    }
  }

  /**
	 * Returns the mime type (e.g., without encoding) for the fragment's type:
	 * "text/html; charset=utf-8" -> "text/html"
	 * @returns {string} fragment's mime type (without encoding)
	 */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
	 * Returns true if this fragment is a text/* mime type
	 * @returns {boolean} true if fragment's type is text/*
	 */
  get isText() {
    if (this.mimeType.match(/text\/+/)) {
      return true;
    } else {
      return false;
    }
  }

  /**
	 * Returns the formats into which this fragment type can be converted
	 * @returns {Array<string>} list of supported mime types
	 */
  get formats() {
    if (this.mimeType === 'text/plain') {
      return ['text/plain'];
    } else if (this.mimeType === 'text/markdown') {
      return ['text/plain', 'text/markdown', 'text/html'];
    } else if (this.mimeType === 'text/html') {
      return ['text/plain', 'text/html'];
    } else if (this.mimeType === 'application/json') {
      return ['text/plain','application/json'];
    }	else {
      return ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    }
  }

  /**
	 * Returns true if we know how to work with this content type
	 * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
	 * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
	 */
  static isSupportedType(value) {
    logger.debug("isSupportedType: " + value);
    return validTypes.some(element => value.includes(element));
  }
}

module.exports.Fragment = Fragment;