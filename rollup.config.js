import ts from 'rollup-plugin-typescript2'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import replace from '@rollup/plugin-replace'
import serve from 'rollup-plugin-serve'
import path from 'path'

export default {
  input: 'src/index.ts', // 入口
  output: {              // 打包输出结果
    name: 'VueReactivity',   // window.reactivity
    format: 'umd',        // 打包格式，兼容度最高的
    file: path.resolve(__dirname, 'dist/reactivity.js'), // 输出的文件路径
    sourcemap: true // 生成映射文件
  },
  plugins: [
    // 解析以ts,js结尾的文件模块
    nodeResolve({
      extensions: ['ts', 'js']
    }),
    // 解析ts，使用的配置文件
    ts({
      tsconfig: path.resolve(__dirname, 'tsconfig.json')
    }),
    // 把process.env.NODE_ENV 环境变量替换为development
    replace({
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    // 启动的本地服务
    serve({
      open: true,
      openPage: '/public/index.html',
      port: 3000,
      contentBase: '',
    })
  ]
}