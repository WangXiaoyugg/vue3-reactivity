import { isObject, isSymbol, isArray, isInteger, hasOwn, hasChanged } from '../shared/index';
import { reactive } from './reactive';
import { track, trigger } from './effect'
// 工厂函数，传入参数执行不同的操作，更加灵活
function createGetter() {
  // 获取值执行
  return function get(target, key, receiver) { 
    // 等价于 target[key]
    const res = Reflect.get(target, key, receiver)

    // 如果值为symbol类型， 数组中有很多symbol的内置方法，不处理直接返回
    if (isSymbol(key)) {
      return res;
    }
    
    // 进行依赖收集，
    console.log('数据进行获取操作')
    track(target, key)

    // 当前取值是对象类型，再进行代理，懒递归
    if (isObject(res)) {
      return reactive(res)
    }
    
    return res;
  }
}


function createSetter() {
  // 设置值执行
  return function set(target, key, value, receiver) {
    // 等价于 target[key] = value
    // 如果是修改，肯定有oldVal, 新增的是没有oldVal
    const oldVal = target[key];
    // 第一种数组的逻辑，第二种的对象的逻辑
    // 数组通过索引赋值，判断索引是否小于数组的长度，小于说明修改，大于说明新增
    const hadKey = isArray(target) && isInteger(key) ? Number(key) < target.length :
     hasOwn(target, key);

    // 进行数据更新，视图变化
    if (!hadKey) {
      console.log("新增属性操作")
      trigger(target, 'add', key)
    } else if (hasChanged(value, oldVal)) {
      console.log('修改属性操作')
      trigger(target, 'add', key, value, oldVal)
    }

    const res  = Reflect.set(target, key, value, receiver)
    // vue2不支持新增属性，必须要使用是$set的API特殊处理
    // vue3 proxy支持新增属性，要区分是新增还是修改操作
    return res;
  }
}
const get = createGetter()
const set = createSetter()
export const mutableHandlers = {
  get,
  set,
}