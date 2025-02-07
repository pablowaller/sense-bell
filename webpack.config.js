const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Ignorar módulos nativos para el entorno web
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native/Libraries/Utilities/codegenNativeCommands': false,
  };

  return config;
};