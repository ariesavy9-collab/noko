require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');

const videos = [
  ['Dream Big', 'Comedy', 'fTyyGV0AOFk'],
  ['Good Vibes Only', 'Anime', 'mxasrCrr_vo'],
  ['The Journey Continues', 'Comedy', 'nc9tVfMGpdA'],
  ['A New Chapter', 'Anime', 'e0fYJoICXVU'],
  ['Keep Moving Forward', 'Comedy', 'Qy__Cyw00hk'],
  ['Behind the Music', 'Anime', 'xYG6zqYKjZI'],
  ['The Sound of Home', 'Comedy', 'pbvJqaf2AV0'],
  ['Moments Like These', 'Anime', 'O2zHRWPtpB8'],
  ['On the Road', 'Comedy', 'lCVMTzeouos'],
  ['One More Time', 'Anime', 'jUmKIg-JeiE']
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const creatorEmail = process.env.CREATOR_EMAIL?.trim().toLowerCase();
  const creatorPassword = process.env.CREATOR_PASSWORD;
  const requestedLocalAdmin = creatorEmail === 'noko@gmail.com' && creatorPassword === 'admin';
  if (!creatorEmail || !creatorPassword || creatorPassword.length > 72
    || (creatorPassword.length < 8 && !requestedLocalAdmin)) {
    throw new Error('Set CREATOR_EMAIL and a CREATOR_PASSWORD with at least 8 characters in backend/.env.');
  }
  if (requestedLocalAdmin) console.warn('Warning: the requested admin password is weak. Change it before deploying this app.');

  await User.findOneAndUpdate(
    { email: creatorEmail },
    {
      name: process.env.CREATOR_NAME || 'Noko Mashaba',
      email: creatorEmail,
      passwordHash: await bcrypt.hash(creatorPassword, 12),
      role: 'creator'
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  await Post.bulkWrite(videos.map(([title, category, videoId]) => ({
    updateOne: {
      filter: { videoId },
      update: {
        $set: {
          title,
          category,
          description: `${title} — official comedy and anime content from Noko Mashaba.`,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
        },
        $setOnInsert: { videoId }
      },
      upsert: true
    }
  })));
  console.log('Creator account and channel videos are ready.');
  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Unable to seed the channel:', error.message);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});
