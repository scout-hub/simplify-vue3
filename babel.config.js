/*
 * @Author: Zhouqi
 * @Date: 2022-03-20 20:39:29
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-03-20 20:59:37
 */
module.exports = {
    presets: [
        ['@babel/preset-env', {
            targets: {
                node: 'current'
            }
        }], '@babel/preset-typescript'
    ],
};