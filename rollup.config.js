/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 14:27:34
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-28 15:48:40
 */
const {
    terser
} = require('rollup-plugin-terser');
const typescript = require('@rollup/plugin-typescript');
const path = require('path');
// const fs = require('fs');
// const targets = fs.readdirSync('packages');
const targets = ['shared', 'reactivity', 'compiler-core', 'compiler-dom', 'runtime-core', 'runtime-dom', 'simplify-vue'];
const packagesDir = path.resolve(__dirname, 'packages');
const resolve = (dir, p) => path.resolve(dir, p);
const entryFile = 'src/index.ts';

const createConfig = (target) => {
    const packageDir = resolve(packagesDir, target);
    const input = resolve(packageDir, entryFile);
    const ouputFile = resolve(packageDir, `dist/${target}.esm.js`);
    return {
        input,
        output: {
            format: "es",
            file: ouputFile
        },
        plugins: [
            typescript({
                exclude: /__test__/
            }),
            terser()
        ],
        onwarn: (msg, warn) => {
            // 去除打包是循环依赖的warning提示
            if (!/Circular/.test(msg)) {
                warn(msg)
            }
        },
    }
};

const packageConfigs = targets.map(target => createConfig(target));

export default packageConfigs;