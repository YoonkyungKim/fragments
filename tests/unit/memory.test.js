const { writeFragment, readFragment, writeFragmentData, readFragmentData, listFragments, deleteFragment } = require('../../src/model/data/memory');

// Wait for a certain number of ms. Returns a Promise.
const wait = async (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

describe('memory', () => {
  const makeOwnerId = () => ('ownerId-' + Date.now());
  let ownerId;

  beforeEach(async () => {
    await wait();
    ownerId = makeOwnerId();
  });

  test('writeFragment() returns nothing', async () => {
    const result = await writeFragment({ ownerId: ownerId, id: '1', fragment: 'fragment 1'});
    expect(result).toBe(undefined);
  });

  test('readFragment() returns what we writeFragment() into the db', async () => {
    await writeFragment({ ownerId: ownerId, id: '1', fragment: 'fragment 1'});
    const result = await readFragment(ownerId, '1');
    expect(result).toEqual({ ownerId: ownerId, id: '1', fragment: 'fragment 1'});
  });

  test('readFragment() with incorrect id returns nothing', async () => {
    await writeFragment({ ownerId: ownerId, id: '1', fragment: 'fragment 1'});
    const result = await readFragment(ownerId, '2');
    expect(result).toBe(undefined);
  });

  test('writeFragmentData() returns nothing', async () => {
    const result = await writeFragmentData(ownerId, '1', 'fragment 1');
    expect(result).toBe(undefined);
  });

  test('readFragmentData() with incorrect id returns nothing', async () => {
    await writeFragmentData(ownerId, '1', 'fragment 1');
    const result = await readFragmentData(ownerId, '2');
    expect(result).toBe(undefined);
  });

  // source: from discussion #53's Dave's response
  test('listFragments() returns array of fragment ids/objects (expanded)', async () => {
    // fragment1 metadata and data
    await writeFragment({ ownerId: ownerId, id: '1', fragment: 'fragment 1 in metadata' });
    await writeFragmentData(ownerId, '1', 'fragment 1');

    // fragment2 metadata and data
    await writeFragment({ ownerId: ownerId, id: '2', fragment: 'fragment 2 in metadata' });
    await writeFragmentData(ownerId, '2', 'fragment 2');

    // fragment3 metadata and data
    await writeFragment({ ownerId: ownerId, id: '3', fragment: 'fragment 3 in metadata' });
    await writeFragmentData(ownerId, '3', 'fragment 3');

    const ids = await listFragments(ownerId);
    expect(Array.isArray(ids)).toBe(true);
    expect(ids).toEqual(['1', '2', '3']);

    const fragments = await listFragments(ownerId, true);
    expect(Array.isArray(fragments)).toBe(true);
    expect(fragments).toEqual([
      { ownerId: ownerId, id: '1', fragment: 'fragment 1 in metadata' },
      { ownerId: ownerId, id: '2', fragment: 'fragment 2 in metadata' },
      { ownerId: ownerId, id: '3', fragment: 'fragment 3 in metadata' },
    ]);
  });

  test('listFragments() returns empty fragments array', async () => {       
    const emptyFragments = await listFragments(ownerId);
    expect(Array.isArray(emptyFragments)).toBe(true);
    expect(emptyFragments).toEqual([]);
  });

  test('deleteFragment() deletes metadata and data from memory db', async () => {
    await writeFragment({ ownerId: ownerId, id: '1', fragment: 'fragment 1'});
    expect(await readFragment(ownerId, '1')).toEqual({ ownerId: ownerId, id: '1', fragment: 'fragment 1'});

    await writeFragmentData(ownerId, '1', 'fragment 1');
    expect(await readFragmentData(ownerId, '1')).toBe('fragment 1');
    
    await deleteFragment(ownerId, '1');
    expect(await readFragment(ownerId, '1')).toBe(undefined);
    expect(await readFragmentData(ownerId, '1')).toBe(undefined);
  });

  test('deleteFragment() throws if owner id and id not in db', async () => {
    expect(() => deleteFragment(ownerId, '1')).rejects.toThrow();
  });
});