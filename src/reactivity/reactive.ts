import { isObject } from '../shared/index'
import { mutableHandlers } from './baseHandlers'
// weakMap不会有垃圾回收的问题, 内存泄露
const proxyMap = new WeakMap();

export function reactive(target) {
  // 需要将目标变成响应式对象，使用Proxy
  // 当读取数据时，收集依赖
  // 当更新数据时，更新视图
  return createReactiveObject(target, mutableHandlers)
}

function createReactiveObject(target, baseHandlers) {
  // 如果不是对象直接返回target
  if (!isObject(target)) {
    return target
  }

  const existingProxy = proxyMap.get(target)
  // 缓存，避免同一对象重复被代理
  if (existingProxy) {
    return existingProxy;
  }
  
  // 只是对最外层的对象做代理，默认不会递归，而且不会重写对象的属性
  const proxy = new Proxy(target, baseHandlers)
  // 将代理的对象和代理后的结果进行映射
  proxyMap.set(target, proxy)
  return proxy
}