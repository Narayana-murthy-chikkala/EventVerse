require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Update all admins except admin@gmail.com to organizer
  const result = await User.updateMany(
    { role: 'admin', email: { $ne: 'admin@gmail.com' } },
    { $set: { role: 'organizer' } }
  );
  console.log('Migrated to organizer count:', result.modifiedCount);

  // Ensure admin@gmail.com is admin
  const adminRes = await User.updateOne(
    { email: 'admin@gmail.com' },
    { $set: { role: 'admin' } }
  );
  console.log('Admin confirmed:', adminRes.matchedCount);

  const users = await User.find().select('name email role');
  console.log('Current users and roles:');
  console.log(JSON.stringify(users, null, 2));

  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
