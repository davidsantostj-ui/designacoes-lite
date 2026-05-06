const fs = require('fs');
const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} = require('@firebase/rules-unit-testing');
const {
  doc,
  getDoc,
  setDoc,
  updateDoc
} = require('firebase/firestore');

let testEnv;

const userDoc = (db, uid) => doc(db, 'users', uid);
const assignmentDoc = (db, id) => doc(db, 'assignments', id);
const notificationDoc = (db, id) => doc(db, 'notifications', id);

describe('Firestore rules', function () {
  this.timeout(20000);

  before(async () => {
    const rules = fs.readFileSync('firestore.rules', 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: 'minhas-designacoes-app',
      firestore: { rules }
    });

    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(userDoc(db, 'alice'), {
        approved: true,
        isAdmin: false,
        name: 'Alice',
        surname: 'Silva',
        phone: '',
        email: 'alice@example.com',
        assignmentCapabilities: { 'Microfone 1': true }
      });
      await setDoc(userDoc(db, 'bob'), {
        approved: true,
        isAdmin: false,
        name: 'Bob',
        surname: 'Souza',
        phone: '',
        email: 'bob@example.com',
        assignmentCapabilities: { 'Microfone 1': true }
      });
      await setDoc(userDoc(db, 'admin'), {
        approved: true,
        isAdmin: true,
        name: 'Admin',
        surname: 'User',
        phone: '',
        email: 'admin@example.com',
        assignmentCapabilities: { 'Microfone 1': true }
      });
      await setDoc(assignmentDoc(db, 'mine'), {
        date: '2026-04-15',
        usuario_id: 'alice',
        tipo_designacao: 'Microfone 1',
        status: 'pendente',
        allowSwap: true
      });
      await setDoc(assignmentDoc(db, 'swap-open'), {
        date: '2026-04-16',
        usuario_id: 'alice',
        tipo_designacao: 'Microfone 2',
        status: 'troca',
        allowSwap: true
      });
      await setDoc(assignmentDoc(db, 'meeting-assignment'), {
        date: '2026-04-17',
        usuario_id: 'alice',
        tipo_designacao: 'Leitura da Bíblia',
        status: 'troca',
        allowSwap: false
      });
      await setDoc(notificationDoc(db, 'n1'), {
        text: 'Teste',
        authorId: 'admin',
        targetUserId: 'alice',
        read_by: [],
        created_at: new Date('2026-04-10T00:00:00Z')
      });
    });
  });

  after(async () => {
    await testEnv.clearFirestore();
    await testEnv.cleanup();
  });

  it('regular user cannot self-approve during profile creation', async () => {
    const charlieDb = testEnv.authenticatedContext('charlie').firestore();
    await assertFails(
      setDoc(userDoc(charlieDb, 'charlie'), {
        name: 'Charlie',
        surname: 'Costa',
        phone: '',
        email: 'charlie@example.com',
        approved: true,
        isAdmin: true,
        assignmentCapabilities: { 'Microfone 1': true },
        created_at: new Date('2026-04-10T00:00:00Z'),
        last_active: new Date('2026-04-10T00:00:00Z')
      })
    );
  });

  it('regular user can create own pending profile', async () => {
    const charlieDb = testEnv.authenticatedContext('charlie').firestore();
    await assertSucceeds(
      setDoc(userDoc(charlieDb, 'charlie'), {
        name: 'Charlie',
        surname: 'Costa',
        phone: '',
        email: 'charlie@example.com',
        approved: false,
        isAdmin: false,
        assignmentCapabilities: { 'Microfone 1': true },
        created_at: new Date('2026-04-10T00:00:00Z'),
        last_active: new Date('2026-04-10T00:00:00Z')
      })
    );
  });

  it('owner can confirm own assignment', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(updateDoc(assignmentDoc(aliceDb, 'mine'), { status: 'confirmado' }));
  });

  it('owner can request swap for own assignment', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(updateDoc(assignmentDoc(aliceDb, 'mine'), { status: 'troca' }));
  });

  it('owner cannot reassign own assignment directly', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertFails(
      updateDoc(assignmentDoc(aliceDb, 'mine'), {
        usuario_id: 'bob',
        status: 'pendente'
      })
    );
  });

  it('another approved user can accept an assignment that is open for swap', async () => {
    const bobDb = testEnv.authenticatedContext('bob').firestore();
    await assertSucceeds(
      updateDoc(assignmentDoc(bobDb, 'swap-open'), {
        usuario_id: 'bob',
        status: 'pendente'
      })
    );
  });

  it('another approved user cannot accept a meeting assignment with swap disabled', async () => {
    const bobDb = testEnv.authenticatedContext('bob').firestore();
    await assertFails(
      updateDoc(assignmentDoc(bobDb, 'meeting-assignment'), {
        usuario_id: 'bob',
        status: 'pendente'
      })
    );
  });

  it('approved user can only append self to notification read_by', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(updateDoc(notificationDoc(aliceDb, 'n1'), { read_by: ['alice'] }));
    await assertFails(updateDoc(notificationDoc(aliceDb, 'n1'), { read_by: ['bob'] }));
  });

  it('non-matching user cannot read an unapproved profile', async () => {
    const bobDb = testEnv.authenticatedContext('bob').firestore();
    await assertFails(getDoc(userDoc(bobDb, 'charlie')));
  });
});
