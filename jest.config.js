/*
 * @Author: Zhouqi
 * @Date: 2022-04-30 21:20:41
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-30 21:26:52
 */
module.exports = {
  watchPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    '^@simplify-vue/(.*?)$': '<rootDir>/packages/$1/src',
  },
  testMatch: ['<rootDir>/packages/**/__tests__/**/*spec.[jt]s?(x)'],
}