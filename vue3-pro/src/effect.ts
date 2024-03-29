
let activeEffect // 保存当前正在执行的 effect
// 最外层用来保存每一个 target 的 weakMap
const targetMap = new WeakMap()

class ReactiveEffect{
  private _fn: any
  constructor(fn, public scheduler?) {
    this._fn = fn
  }
  run() {
    // 收集当前的 effect 实例 赋值到全局变量 activeEffect
    activeEffect = this
    // 执行方法并返回
    return this._fn()
  }
}
export function effect(fn, options: any = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler)
    _effect.run()
    // run 函数内部涉及 activeEffect 的赋值 (activeEffect = this) 所以这里应该bind一下
    const runner: any = _effect.run.bind(_effect)
    runner.effect = _effect
    return runner
}
  
/**
 * get 依赖收集函数
 * @param target 传入的对象
 * @param key 对应属性的 key
 */
 export function track(target, key) {
    // 拿到当前 target 对应的 map (每个对应的 target 底下应该保存着自己的 key 的 map)
    let depsMap = targetMap.get(target)
    // 拿不到，说明需要新建一个 map 并存入 weakMap
    if (!depsMap) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }
    // 拿到当前 key 的对应的 set (每个对应 key 底下应该保存着自己的 set， set里边是所有的依赖 ReactiveEffect)
    let dep = depsMap.get(key)
    // 拿不到，说明需要创建一个新的 set 并存入对应的 map
    if (!dep) {
        dep = new Set()
        depsMap.set(key, dep)
    }
    // 已经在 dep 中就不用 add 了
    if (dep.has(activeEffect)) return
    dep.add(activeEffect) // 把对应的 ReactiveEffect 实例加入 set 里
 }
/**
 * set 触发依赖
 * @param target 传入的对象
 * @param key 对应属性的 key
 */
 export function trigger(target, key) {
    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)
    for (const effect of dep) {
        // 这个 effect 有 scheduler 的时候我们就执行 scheduler 不执行 run 了
        if (effect.scheduler) {
            effect.scheduler()
        } else {
            effect.run()
        }
    }
}