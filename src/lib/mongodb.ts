import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "union-db";

if (!uri) {
  console.warn("⚠️ MONGODB_URI is not defined in environment variables. Falling back to local storage.");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (uri) {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
  }
} else {
  // Mock promise that rejects if called without URI
  clientPromise = Promise.reject(new Error("MONGODB_URI is not configured"));
}

let indexesEnsured = false;

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  const db = client.db(dbName);

  if (!indexesEnsured) {
    indexesEnsured = true;
    try {
      const projectsCol = db.collection("projects");
      // Fast search & filter compound indexes for O(log N) operations
      await Promise.allSettled([
        projectsCol.createIndex({
          projectName: "text",
          projectCode: "text",
          contractorName: "text",
          fiscalYear: "text",
          unionName: "text",
          wardNo: "text",
        }),
        projectsCol.createIndex({ isDeleted: 1, _id: -1 }),
        projectsCol.createIndex({ isDeleted: 1, fiscalYear: 1, _id: -1 }),
        projectsCol.createIndex({ isDeleted: 1, updatedAt: -1 }),
        projectsCol.createIndex({ id: 1 }),
      ]);

      // Fast photo query indexes for O(log M + K) operations
      const photosCol = db.collection("project_photos");
      await Promise.allSettled([
        photosCol.createIndex({ projectId: 1, uploadedAt: -1 }),
        photosCol.createIndex({ id: 1, projectId: 1 }),
      ]);
    } catch (e) {
      console.warn("Index creation warning:", e);
    }
  }

  return db;
}

export default clientPromise;
