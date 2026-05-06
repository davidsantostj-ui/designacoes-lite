const fs = require('fs');
const { assertFails, initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { getBlob, ref, uploadBytes } = require('firebase/storage');

let testEnv;

describe('Storage rules', function () {
  this.timeout(20000);

  before(async () => {
    const rules = fs.readFileSync('storage.rules', 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: 'minhas-designacoes-app',
      storage: { rules }
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it('blocks uploads for authenticated users', async () => {
    const aliceStorage = testEnv.authenticatedContext('alice').storage();
    const fileRef = ref(aliceStorage, 'uploads/test.png');
    const data = new Uint8Array([0, 1, 2, 3]);
    await assertFails(uploadBytes(fileRef, data, { contentType: 'image/png' }));
  });

  it('blocks reads for authenticated users', async () => {
    const aliceStorage = testEnv.authenticatedContext('alice').storage();
    const fileRef = ref(aliceStorage, 'uploads/test.png');
    await assertFails(getBlob(fileRef));
  });
});
