export const cjsTokens = () => ({
  name: 'process-cjs-tokens',
  async transform(src, id) {
    if (
      id.endsWith('/design-tokens/dist/tokens.js') ||
      id.endsWith('node_modules/@utrecht/design-tokens/dist/tokens.cjs')
    ) {
      return {
        code: src.replace('module.exports = ', 'export default '),
        map: null,
      };
    }
  },
});
