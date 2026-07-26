// @ts-nocheck
import type { SQLJsConfig, SqlJsStatic, QueryExecResult } from 'sql.js';

// Use the asm.js build to avoid wasm bundling issues for the web preview.
import initSqlJs from 'sql.js/dist/sql-asm.js';

let SQL: SqlJsStatic | null = null;
let db: WebSqlDatabase | null = null;

function mapResult<T>(result: QueryExecResult): T[] {
  const rows: T[] = [];
  for (const row of result.values) {
    const obj: Record<string, unknown> = {};
    for (let i = 0; i < result.columns.length; i++) {
      obj[result.columns[i]] = row[i];
    }
    rows.push(obj as T);
  }
  return rows;
}

class WebSqlDatabase {
  constructor(private sqlDb: any) {}

  async execAsync(sql: string): Promise<void> {
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      if (/^\s*PRAGMA\s+journal_mode/i.test(statement)) {
        continue;
      }
      try {
        this.sqlDb.exec(statement);
      } catch (e) {
        const message = String(e);
        if (message.includes('cannot change')) {
          continue;
        }
        throw e;
      }
    }
  }

  async runAsync(sql: string, ...params: unknown[]): Promise<unknown> {
    const used = params.slice(0, sql.split('?').length - 1);
    this.sqlDb.run(sql, used);
    return { lastInsertRowId: 0, changes: this.sqlDb.getRowsModified() };
  }

  async getAllAsync<T>(sql: string, ...params: unknown[]): Promise<T[]> {
    const used = params.slice(0, sql.split('?').length - 1);
    const results = this.sqlDb.exec(sql, used);
    if (!results || results.length === 0) return [];
    return mapResult<T>(results[0]);
  }

  async getFirstAsync<T>(sql: string, ...params: unknown[]): Promise<T | null> {
    const rows = await this.getAllAsync<T>(sql, ...params);
    return rows[0] ?? null;
  }
}

export async function getDatabase(): Promise<WebSqlDatabase> {
  if (db) return db;
  if (!SQL) {
    SQL = await initSqlJs({} as SQLJsConfig);
  }
  db = new WebSqlDatabase(new SQL.Database());
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    db = null;
  }
}
