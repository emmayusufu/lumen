import { Server } from "@hocuspocus/server";
import * as jwt from "jsonwebtoken";
import pg from "pg";
import * as Y from "yjs";

const SECRET_KEY = process.env.SECRET_KEY ?? "dev-secret-change-in-production!";
const PORT = Number(process.env.PORT ?? 1234);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const server = Server.configure({
  port: PORT,

  async onAuthenticate({ token }) {
    try {
      const payload = jwt.verify(token, SECRET_KEY) as {
        sub: string;
        name?: string;
        email?: string;
      };
      return { userId: payload.sub, name: payload.name ?? payload.email ?? "Anonymous" };
    } catch {
      throw new Error("Unauthorized");
    }
  },

  async onLoadDocument({ documentName, document }) {
    const { rows } = await pool.query(
      "SELECT state FROM doc_yjs_state WHERE doc_id = $1",
      [documentName],
    );
    if (rows[0]?.state) {
      Y.applyUpdate(document, new Uint8Array(rows[0].state as Buffer));
    }
    return document;
  },

  async onStoreDocument({ documentName, document }) {
    const state = Buffer.from(Y.encodeStateAsUpdate(document));
    await pool.query(
      `INSERT INTO doc_yjs_state (doc_id, state)
       VALUES ($1, $2)
       ON CONFLICT (doc_id) DO UPDATE SET state = $2, updated_at = NOW()`,
      [documentName, state],
    );
  },
});

server.listen();
console.log(`Collab server listening on port ${PORT}`);
