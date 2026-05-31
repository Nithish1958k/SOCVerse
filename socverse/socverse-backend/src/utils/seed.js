import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Alert } from '../models/Alert.js';
import { Ticket } from '../models/Ticket.js';
import { Case } from '../models/Case.js';
import { createAlert, runScenario } from '../services/alertEngine.js';
import { rnd } from './random.js';

const DEMO_USERS = [
  { name: 'Tier1 Analyst', email: 'l1@socverse.local', role: 'L1', password: 'Passw0rd!' },
  { name: 'Tier2 Analyst', email: 'l2@socverse.local', role: 'L2', password: 'Passw0rd!' },
  { name: 'Tier3 Hunter', email: 'l3@socverse.local', role: 'L3', password: 'Passw0rd!' },
  { name: 'SOC Manager', email: 'manager@socverse.local', role: 'Manager', password: 'Passw0rd!' },
];

async function seed() {
  await connectDB();

  // eslint-disable-next-line no-console
  console.log('[seed] clearing existing collections…');
  await Promise.all([
    User.deleteMany({}),
    Alert.deleteMany({}),
    Ticket.deleteMany({}),
    Case.deleteMany({}),
    mongoose.connection.collection('counters').deleteMany({}).catch(() => {}),
  ]);

  // eslint-disable-next-line no-console
  console.log('[seed] creating demo users…');
  for (const u of DEMO_USERS) {
    const user = new User({ name: u.name, email: u.email, role: u.role });
    // eslint-disable-next-line no-await-in-loop
    await user.setPassword(u.password);
    user.stats = { handled: rnd(8, 40), closed: rnd(5, 30) };
    // eslint-disable-next-line no-await-in-loop
    await user.save();
  }

  // eslint-disable-next-line no-console
  console.log('[seed] generating ambient alerts…');
  for (let i = 0; i < 28; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await createAlert(null);
  }

  // eslint-disable-next-line no-console
  console.log('[seed] injecting correlated scenarios (phishing, brute force)…');
  await runScenario(null, 'phish');
  await runScenario(null, 'brute');

  const counts = {
    users: await User.countDocuments(),
    alerts: await Alert.countDocuments(),
  };
  // eslint-disable-next-line no-console
  console.log('[seed] done:', counts);
  // eslint-disable-next-line no-console
  console.log('[seed] login with any of:');
  DEMO_USERS.forEach((u) => console.log(`         ${u.email}  /  ${u.password}  (${u.role})`));

  await disconnectDB();
  process.exit(0);
}

seed().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed:', err);
  process.exit(1);
});
