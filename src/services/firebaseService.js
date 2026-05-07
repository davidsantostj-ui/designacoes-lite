/**
 * @module services/firebaseService
 * @description Service centralizado para operações Firestore com tratamento de erros e retry
 */

import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  writeBatch,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { withRetry } from '../utils/asyncUtils';

/**
 * @class FirestoreService
 * @description Encapsula operações CRUD do Firestore com tratamento de erros adequado
 */
class FirestoreService {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.collectionRef = collection(db, collectionName);
  }

  /**
   * Busca documentos com filtros e paginação
   * @param {Object} options - Opções de query
   * @param {Array} [options.whereClauses] - Cláusulas where [[field, op, value], ...]
   * @param {string} [options.orderByField] - Campo para ordenação
   * @param {string} [options.orderDirection] - 'asc' ou 'desc'
   * @param {number} [options.limitCount] - Limite de resultados
   * @param {Object} [options.startAfterDoc] - Documento para paginação
   * @returns {Promise<{docs: Array, lastDoc: Object}>}
   */
  async query(options = {}) {
    return withRetry(async () => {
      let q = this.collectionRef;

      // Aplica cláusulas where
      if (options.whereClauses) {
        options.whereClauses.forEach(([field, op, value]) => {
          q = query(q, where(field, op, value));
        });
      }

      // Ordenação
      if (options.orderByField) {
        q = query(q, orderBy(options.orderByField, options.orderDirection || 'asc'));
      }

      // Limite
      if (options.limitCount) {
        q = query(q, limit(options.limitCount));
      }

      // Paginação
      if (options.startAfterDoc) {
        q = query(q, startAfter(options.startAfterDoc));
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        _timestamp: doc.data().created_at || doc.data().updated_at
      }));

      return {
        docs,
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
      };
    }, {
      maxAttempts: 3,
      retryDelay: 1000
    });
  }

  /**
   * Busca um documento por ID
   * @param {string} id - ID do documento
   * @returns {Promise<Object|null>}
   */
  async get(id) {
    return withRetry(async () => {
      const docRef = doc(this.collectionRef, id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    });
  }

  /**
   * Cria um novo documento
   * @param {Object} data - Dados do documento
   * @param {Object} [options] - Opções adicionais
   * @param {boolean} [options.useServerTimestamp] - Usa serverTimestamp
   * @returns {Promise<string>} - ID do documento criado
   */
  async create(data, options = {}) {
    return withRetry(async () => {
      const docData = { ...data };
      
      if (options.useServerTimestamp) {
        docData.created_at = serverTimestamp();
        docData.updated_at = serverTimestamp();
      }

      const docRef = await addDoc(this.collectionRef, docData);
      return docRef.id;
    });
  }

  /**
   * Atualiza um documento existente
   * @param {string} id - ID do documento
   * @param {Object} data - Dados para atualizar
   * @param {Object} [options] - Opções adicionais
   * @param {boolean} [options.useServerTimestamp] - Atualiza timestamp
   * @param {boolean} [options.merge=true] - Faz merge dos dados
   * @returns {Promise<void>}
   */
  async update(id, data, options = {}) {
    return withRetry(async () => {
      const docRef = doc(this.collectionRef, id);
      const updateData = { ...data };

      if (options.useServerTimestamp) {
        updateData.updated_at = serverTimestamp();
      }

      await updateDoc(docRef, updateData);
    });
  }

  /**
   * Atualiza ou cria documento com upsert
   * @param {string} id - ID do documento
   * @param {Object} data - Dados
   * @returns {Promise<void>}
   */
  async upsert(id, data) {
    return withRetry(async () => {
      const existing = await this.get(id);
      if (existing) {
        await this.update(id, data);
      } else {
        await this.create({ id, ...data }, { useServerTimestamp: true });
      }
    });
  }

  /**
   * Deleta um documento
   * @param {string} id - ID do documento
   * @returns {Promise<void>}
   */
  async delete(id) {
    return withRetry(async () => {
      const docRef = doc(this.collectionRef, id);
      await deleteDoc(docRef);
    });
  }

  /**
   * Realiza uma transação batch para múltiplas operações
   * @param {Array} operations - Array de operações [{type, collection, id, data}]
   * @returns {Promise<void>}
   */
  async batch(operations) {
    return withRetry(async () => {
      const batch = writeBatch(db);

      operations.forEach(op => {
        const docRef = doc(db, op.collection, op.id || doc(collection(db, op.collection)).id);
        
        switch (op.type) {
          case 'create':
            batch.set(docRef, { ...op.data, created_at: serverTimestamp() });
            break;
          case 'update':
            batch.update(docRef, { ...op.data, updated_at: serverTimestamp() });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
          default:
            throw new Error(`Operação inválida: ${op.type}`);
        }
      });

      await batch.commit();
    });
  }

  /**
   * Verifica duplicatas antes de criar/atualizar
   * @param {string} field - Campo para verificar
   * @param {*} value - Valor a verificar
   * @param {string} [excludeId] - ID para excluir da verificação
   * @returns {Promise<boolean>}
   */
  async hasDuplicate(field, value, excludeId = null) {
    const q = query(
      this.collectionRef,
      where(field, '==', value)
    );
    const snapshot = await getDocs(q);
    
    if (excludeId) {
      return snapshot.docs.some(doc => doc.id !== excludeId);
    }
    
    return !snapshot.empty;
  }
}

// Serviços específicos por coleção
export const assignmentsService = new FirestoreService('assignments');
export const usersService = new FirestoreService('users');
export const meetingsService = new FirestoreService('meetings');
export const notificationsService = new FirestoreService('notifications');
export const rolesService = new FirestoreService('roles');

export default FirestoreService;