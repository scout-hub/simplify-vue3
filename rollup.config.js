/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 14:27:34
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-26 13:37:24
 */
import typescript from "@rollup/plugin-typescript";

// const fs = require('fs');
const path = require('path');
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
            })
        ]
    }
};

const packageConfigs = targets.map(target => createConfig(target));

export default packageConfigs;