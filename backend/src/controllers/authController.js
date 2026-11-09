const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, avatarId: user.avatarId || 'avatar-1' };
}

function createToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || name.trim().length > 60 || typeof email !== 'string'
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      || typeof password !== 'string' || password.length < 8 || password.length > 72) {
      return res.status(400).json({ message: 'Add your name, a valid email, and a password of at least 8 characters.' });
    }
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ message: 'An account with that email already exists.' });
    }
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12)
    });
    res.status(201).json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Enter your email and password.' });
    }
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'The email or password is incorrect.' });
    }
    res.json({ token: createToken(user), user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

async function updateProfile(req, res, next) {
  try {
    const { name, avatarId } = req.body;
    if (typeof name !== 'string' || !name.trim() || name.trim().length > 60) {
      return res.status(400).json({ message: 'Your name must be between 1 and 60 characters.' });
    }
    if (!['avatar-1', 'avatar-2', 'avatar-3', 'avatar-4', 'avatar-5', 'avatar-6', 'avatar-7', 'avatar-8'].includes(avatarId)) {
      return res.status(400).json({ message: 'Choose one of the available profile avatars.' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name: name.trim(), avatarId },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: 'Your account is no longer available.' });
    res.json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string'
      || newPassword.length < 8 || newPassword.length > 72) {
      return res.status(400).json({ message: 'Enter your current password and a new password between 8 and 72 characters.' });
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) return res.status(404).json({ message: 'Your account is no longer available.' });
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({ message: 'Your current password is incorrect.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, me, updateProfile, changePassword };
