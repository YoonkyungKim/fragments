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

const validTypes = [
  `text/plain`,
  /*
   Currently, only text/plain is supported. Others will be added later.
  `text/markdown`,
  `text/html`,
  `application/json`,
  `image/png`,
  `image/jpeg`,
  `image/webp`,
  `image/gif`,
  */
];

class Fragment {
  constructor({ id, ownerId, type, size = 0 }) {
    if (!ownerId || !type) {
      throw new Error("owner id and type is required");
    }	else if (typeof size !== "number") {
      throw new Error("size must be a number");
    } else if (size < 0) {
      throw new Error("size cannot be negative");
    } else if (!Fragment.isSupportedType(type)) {
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
    return await listFragments(ownerId, expand);
  }

  /**
	 * Gets a fragment for the user by the given id.
	 * @param {string} ownerId user's hashed email
	 * @param {string} id fragment's id
	 * @returns Promise<Fragment>
	 */
  static async byId(ownerId, id) {
    const fragment = await readFragment(ownerId, id);
    if (fragment) {
      return fragment;
    } else {
      throw new Error("No fragment with this id")
    }
  }

  /**
	 * Delete the user's fragment data and metadata for the given id
	 * @param {string} ownerId user's hashed email
	 * @param {string} id fragment's id
	 * @returns Promise
	 */
  static async delete(ownerId, id) {
    return await deleteFragment(ownerId, id);
  }

  /**
	 * Saves the current fragment to the database
	 * @returns Promise
	 */
  async save() {
    this.updated = await new Date().toISOString();
    return await writeFragment(this);
  }

  /**
	 * Gets the fragment's data from the database
	 * @returns Promise<Buffer>
	 */
  async getData() {
    return Buffer.from(await readFragmentData(this.ownerId, this.id));
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
      return await writeFragmentData(this.ownerId, this.id, data);
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
    // const regex = /text\/+/g;
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
    let valid = false;
    validTypes.forEach((format) => valid = value.includes(format) ? true : false );
    return valid;
  }
}

module.exports.Fragment = Fragment;