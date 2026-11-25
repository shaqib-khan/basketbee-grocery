import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryInstance = null;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (uri) {
    try {
      console.log('Attempting to connect to MongoDB URI:', uri);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        dbName: process.env.DB_NAME || 'basketbee',
      });
      console.log(` MongoDB Connected: ${conn.connection.host} [Database: ${conn.connection.name}]`);
      return conn;
    } catch (err) {
      console.warn(` Failed to connect to configured MongoDB URI: ${err.message}`);
      console.log('🔄 Falling back to in-memory MongoDB server for seamless zero-downtime operation...');
    }
  }

  try {
    mongoMemoryInstance = await MongoMemoryServer.create({
      instance: {
        dbName: 'basketbee',
      },
    });
    const memoryUri = mongoMemoryInstance.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(` In-Memory MongoDB Started & Connected: ${conn.connection.host}`);
    console.log(` In-Memory Database Name: basketbee`);
    return conn;
  } catch (error) {
    console.error(` Error connecting to database: ${error.message}`);
    process.exit(1);
  }
};

export const getDBHealth = () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const state = mongoose.connection.readyState;
  return {
    status: state === 1 ? 'healthy' : 'degraded',
    state: stateMap[state] || 'unknown',
    host: mongoose.connection.host || 'local',
    dbName: mongoose.connection.name || 'basketbee',
    isInMemory: !!mongoMemoryInstance,
  };
};

export const closeDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryInstance) {
    await mongoMemoryInstance.stop();
  }
};
