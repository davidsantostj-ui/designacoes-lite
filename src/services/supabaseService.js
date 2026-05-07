/**
 * @module services/supabaseService
 * @description Service centralizado para operações Supabase (PostgREST) - Migração de Firestore
 */

import { supabase } from './supabase';
import { withRetry } from '../utils/asyncUtils';

class SupabaseService {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async query(options = {}) {
    return withRetry(async () => {
      let query = supabase.from(this.tableName).select('*', { count: options.count ? 'exact' : null });

      if (options.whereClauses) {
        options.whereClauses.forEach(([field, op, value]) => {
          switch (op) {
            case '==':
              query = query.eq(field, value);
              break;
            case '>':
              query = query.gt(field, value);
              break;
            case '>=':
              query = query.gte(field, value);
              break;
            case '<':
              query = query.lt(field, value);
              break;
            case '<=':
              query = query.lte(field, value);
              break;
            case 'array-contains':
              query = query.contains(field, [value]);
              break;
          }
        });
      }

      if (options.orderByField) {
        query = query.order(options.orderByField, { ascending: options.orderDirection !== 'desc' });
      }

      if (options.limitCount) {
        query = query.limit(options.limitCount);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limitCount || 10) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;

      const docs = data.map(doc => ({
        id: doc.id,
        ...doc,
        _timestamp: doc.created_at || doc.updated_at
      }));

      return {
        docs,
        lastDoc: docs[docs.length - 1]
      };
    }, {
      maxAttempts: 3,
      retryDelay: 1000
    });
  }

  async get(id) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data ? { id: data.id, ...data } : null;
    });
  }

  async create(data, options = {}) {
    return withRetry(async () => {
      const docData = { ...data };

      if (options.useServerTimestamp) {
        docData.created_at = new Date().toISOString();
        docData.updated_at = new Date().toISOString();
      }

      if (!docData.id) {
        const { data: idData, error: idError } = await supabase
          .rpc('gen_random_uuid');
        if (!idError && idData) {
          docData.id = idData;
        }
      }

      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(docData)
        .select()
        .single();

      if (error) throw error;
      return result.id;
    });
  }

  async update(id, data, options = {}) {
    return withRetry(async () => {
      const updateData = { ...data };

      if (options.useServerTimestamp) {
        updateData.updated_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    });
  }

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

  async delete(id) {
    return withRetry(async () => {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
    });
  }

  async batch(operations) {
    return withRetry(async () => {
      for (const op of operations) {
        const { type, data } = op;
        const opData = { ...data };

        if (type === 'create' || type === 'update') {
          opData.updated_at = new Date().toISOString();
        }
        if (type === 'create') {
          opData.created_at = new Date().toISOString();
        }

        switch (type) {
          case 'create':
            await supabase.from(op.collection || this.tableName).insert(opData);
            break;
          case 'update':
            await supabase.from(op.collection || this.tableName).update(opData).eq('id', op.id);
            break;
          case 'delete':
            await supabase.from(op.collection || this.tableName).delete().eq('id', op.id);
            break;
        }
      }
    });
  }

  async hasDuplicate(field, value, excludeId = null) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('id')
      .eq(field, value);

    if (error) throw error;

    if (excludeId) {
      return data.some(doc => doc.id !== excludeId);
    }

    return data.length > 0;
  }
}

export const assignmentsService = new SupabaseService('assignments');
export const usersService = new SupabaseService('users');
export const meetingsService = new SupabaseService('meetings');
export const notificationsService = new SupabaseService('notifications');
export const rolesService = new SupabaseService('roles');

export default SupabaseService;