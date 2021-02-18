import { isArray, isInteger } from '../shared/index';

// 等价于vue2中的 watch
export function effect(fn, options:any ={}) {
  const effect = createReactiveEffect(fn, options);
  if (!options.lazy) {
    effect()
  }
  return effect
}


// 用来存储当前的effect函数
let activeEffect;
let uid = 0;
// 使用effectStack栈解决effect嵌套的问题
/**
 * effect(() => {
 *    state.name;
 *    effect(() => {
 *        state.age
 *    })
 *    state.address //不用栈的是收集不到address的依赖
 * })
 */

let effectStack = []
function createReactiveEffect(fn, options) {
  const effect = function() {
    // 防止递归执行
    if (!effectStack.includes(effect)) {
      try {
        activeEffect = effect;
        effectStack.push(activeEffect)
        // 计算属性有返回值
        return fn() // fn就是用户写的逻辑, 内部会对数据进行取值操作，取值是获取到activeEffect
      } finally {
        effectStack.pop()
        activeEffect = effectStack[effectStack.length -1 ]
      }
    }
    
  }
  effect.id = uid++
  effect.deps = []; // effect中依赖了那些属性
  effect.options = options
  return effect
}

// 将可以和 activeEffect进行关联
// { object: { key: [effect, effect] } }
const targetMap = new WeakMap()
export function track(target, key) {
  if (activeEffect == undefined) {
    return;
  }
  // 没有就生成depsMap和dep
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  if (!dep) {
    //用Set, 同一属性不能放相同的effect, 重复执行
    depsMap.set(key, (dep = new Set()))
  }
  if(!dep.has(activeEffect)) {
    // 双向关联的过程，你中有我，我中有你
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }

}
// 触发更新
export function trigger(target, type, key, val?, oldVal?) {
  let depsMap = targetMap.get(target)
  if(!depsMap) return
  const run = effects => {
    if (effects) effects.forEach(effect => effect())
  }
  // 数组的处理
  if (key === 'length' && isArray(target)) {
    depsMap.forEach((dep, key) => {
      // 如果改的长度小于数组原有的长度, 应该更新视图
      if (key === 'length' || key >= val) {
        run(dep)
      }
    })
  } else {
    // 说明修改了key. 对象的处理
    if (key !== void 0) {
    
      run(depsMap.get(key))

    } 
    switch (type) {
      case "add":
        // 给数组通过索引增加元素
        if (isArray(target)) {
          if (isInteger(key)) {
            // 如果页面中直接使用了数组，也会对数组进行取值操作，
            // 也会对length进行依赖收集，直接触发length即可
            run(depsMap.get('length'))
          }
        }
        break;    
    }
  }

  


}