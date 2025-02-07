const { getDefaultConfig } = require('@react-native/metro-config');
const path = require('path');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);

  return {
    ...defaultConfig,
    resolver: {
      ...defaultConfig.resolver,
      assetExts: [...defaultConfig.resolver.assetExts, 'png'],
      blockList:
        process.env.PLATFORM === 'web'
          ? /react-native-maps/
          : undefined, 
    },
  };
})();
