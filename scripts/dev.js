/*
 * @Author: Zhouqi
 * @Date: 2022-04-28 15:14:45
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-28 19:57:21
 */
const {
    build
} = require('esbuild')

build({
    entryPoints: [`./packages/simplify-vue/src/index.ts`],
    outfile: './packages/simplify-vue/dist/simplify-vue.global.js',
    bundle: true,
    sourcemap: true,
    format: 'iife',
    globalName: 'Vue',
    watch: {
        onRebuild(error) {
            console.log('rebuild');
        }
    }
}).then(() => {
    console.log(`watching`)
})