// Use https://www.npmjs.com/package/nanoid to create unique IDs
const { nanoid } = require('nanoid');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');
const md = require('markdown-it')({
  html: true,
});
const sharp = require('sharp');
var mime = require('mime-types');

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
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

// NOTE: we store the entire Content-Type (i.e., with the charset if present), 
// but also allow using only the media type (e.g., text/html vs. text/html; charset=iso-8859-1).

class Fragment {
  constructor({ id, ownerId, type, created = undefined, updated = undefined, size = 0 }) {
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
      this.created = created || new Date().toISOString();
      this.updated = updated || new Date().toISOString();
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
      const fragment = await readFragment(ownerId, id);
      if (fragment) {
        if (fragment instanceof Fragment === false) {
          return new Fragment(fragment);
        } else {
          return fragment;
        }
      }
    } catch (err) {
      logger.warn({ err }, 'error reading fragment data');
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
      logger.error({ err }, 'Unable to delete fragment object');
      throw new Error('Unable to delete fragment object');
    }
  }

  /**
	 * Saves the current fragment to the database
	 * @returns Promise
	 */
  async save() {
    try {
      this.updated = new Date().toISOString();
      return await writeFragment(this);
    } catch (err) {
      logger.warn({ err }, 'Error to save fragment');
      throw new Error('unable to save fragment');
    }
  }

  /**
	 * Gets the fragment's data from the database
	 * @returns Promise<Buffer>
	 */
  async getData() {
    try {
      return await readFragmentData(this.ownerId, this.id);
    } catch (err) {
      logger.warn({ err }, 'Error to read fragment data');
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
        logger.error({ err }, 'Error setting fragment data');
        throw new Error('unable to set fragment data');
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

  /**
	 * Returns the data converted to the desired type
	 * @param {Buffer} data fragment data to be converted
   * @param {string} extension the type extension you want to convert to (desired type)
	 * @returns {Buffer} converted fragment data
	 */
  async convertType(data, extension) {
    let destType = mime.lookup(extension);
    const convertableFormats = this.formats;

    logger.debug("type: " + this.type);
    logger.debug("mimeType: " + this.mimeType);
    logger.debug("convertable formats: " + convertableFormats);

    if (!convertableFormats.includes(destType)) {
      logger.warn('Cannot convert fragment to this type');
      // throw new Error('Cannot convert fragment to this type');
      return false;
    }

    let convertedResult = data;
    if (this.mimeType !== destType) {
      if (this.mimeType === 'text/markdown' && destType === 'text/html') {
        convertedResult = md.render(data.toString());
        convertedResult = Buffer.from(convertedResult);
      } else if (destType === 'image/jpeg') {
        convertedResult = await sharp(data)
          .jpeg()
          .toBuffer();
      } else if (destType === 'image/png') {
        convertedResult = await sharp(data)
          .png()
          .toBuffer();
      } else if (destType === 'image/webp') {
        convertedResult = await sharp(data)
          .webp()
          .toBuffer();
      } else if (destType === 'image/gif') {
        convertedResult = await sharp(data)
          .gif()
          .toBuffer();
      }
    }
    return { convertedResult, convertedType: destType };
  }
}

module.exports.Fragment = Fragment;