module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          extensions: ['.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/services': './src/services',
            '@/hooks': './src/hooks',
            '@/store': './src/store',
            '@/types': './src/types',
            '@/utils': './src/utils',
            '@/constants': './src/constants',
            '@/content': './src/content',
          },
        },
      ],
      // Must stay LAST — reanimated's babel plugin requires it.
      'react-native-reanimated/plugin',
    ],
  };
};
