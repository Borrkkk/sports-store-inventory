const { getDefaultConfig } = require('expo/metro-config');
const { startPhotoReceiver } = require('./scripts/photo-receiver');

if (!process.env.CI) {
  startPhotoReceiver();
}

module.exports = getDefaultConfig(__dirname);
