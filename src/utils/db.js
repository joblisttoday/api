/*
	 not workingsqlite in workers (want us to use d1):
	 - @joblist/components(ø HTMLElement),
	 - sql.js(ø fs,path)
	 - @observablehq/sqlite(ø exist)
	 - @libsql/client/web(ø db URL import)
	 - better-sqlite3(ø promisify)
 */

import wasm from "cloudflare-worker-sqlite-wasm/dist/sql-wasm.wasm";
import initSqljs from "cloudflare-worker-sqlite-wasm";

const DATABASE_URL = "https://joblist.gitlab.io/workers/joblist.db";

const initDb = async () => {
	const fetchConfig = {
		/* cloudflare cache */
		cf: {
			// Always cache this fetch regardless of content type
			// for a max of 5 seconds before revalidating the resource
			cacheTtl: 5,
			cacheEverything: true,
		},
	};
	try {
		const databaseFile = await fetch(DATABASE_URL, fetchConfig).then((res) =>
			res.arrayBuffer(),
		);
		const SQL = await initSqljs({
			instantiateWasm(info, receive) {
				let instance = new WebAssembly.Instance(wasm, info);
				receive(instance);
				return instance.exports;
			},
			log: console.log,
			error: console.error,
		});
		return new SQL.Database(new Uint8Array(databaseFile));
	} catch (error) {
		console.log("Error init DB", error);
	}
};

export const sqliteToJson = (sqliteRes = []) => {
	const data = sqliteRes[0];
	const { columns, values } = data || {};
	return values.map((sqliteRow) => {
		return sqliteRow.reduce((acc, value, index) => {
			const key = columns[index];
			acc[key] = value;
			return acc;
		}, {});
	});
};

export default initDb;
