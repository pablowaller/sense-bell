module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      process.env.EXPO_TARGET === 'web' && [
        'module-resolver',
        {
          alias: {
            'react-native-maps': '@react-leaflet/core',
          },
        },
      ],
    ].filter(Boolean),
  };
};
