(function (factory) {
    typeof define === 'function' && define.amd ? define(factory) :
    factory();
})((function () { 'use strict';

    /**
     * Make a map and return a function for checking if a key
     * is in that map.
     * IMPORTANT: all calls of this function must be prefixed with
     * \/\*#\_\_PURE\_\_\*\/
     * So that rollup can tree-shake them if necessary.
     */
    function makeMap(str, expectsLowerCase) {
        const map = Object.create(null);
        const list = str.split(',');
        for (let i = 0; i < list.length; i++) {
            map[list[i]] = true;
        }
        return expectsLowerCase ? val => !!map[val.toLowerCase()] : val => !!map[val];
    }

    /**
     * On the client we only need to offer special cases for boolean attributes that
     * have different names from their corresponding dom properties:
     * - itemscope -> N/A
     * - allowfullscreen -> allowFullscreen
     * - formnovalidate -> formNoValidate
     * - ismap -> isMap
     * - nomodule -> noModule
     * - novalidate -> noValidate
     * - readonly -> readOnly
     */
    const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
    const isSpecialBooleanAttr = /*#__PURE__*/ makeMap(specialBooleanAttrs);
    /**
     * Boolean attributes should be included if the value is truthy or ''.
     * e.g. `<select multiple>` compiles to `{ multiple: '' }`
     */
    function includeBooleanAttr(value) {
        return !!value || value === '';
    }

    function normalizeStyle(value) {
        if (isArray(value)) {
            const res = {};
            for (let i = 0; i < value.length; i++) {
                const item = value[i];
                const normalized = isString(item)
                    ? parseStringStyle(item)
                    : normalizeStyle(item);
                if (normalized) {
                    for (const key in normalized) {
                        res[key] = normalized[key];
                    }
                }
            }
            return res;
        }
        else if (isString(value)) {
            return value;
        }
        else if (isObject(value)) {
            return value;
        }
    }
    const listDelimiterRE = /;(?![^(]*\))/g;
    const propertyDelimiterRE = /:(.+)/;
    function parseStringStyle(cssText) {
        const ret = {};
        cssText.split(listDelimiterRE).forEach(item => {
            if (item) {
                const tmp = item.split(propertyDelimiterRE);
                tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
            }
        });
        return ret;
    }
    function normalizeClass(value) {
        let res = '';
        if (isString(value)) {
            res = value;
        }
        else if (isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                const normalized = normalizeClass(value[i]);
                if (normalized) {
                    res += normalized + ' ';
                }
            }
        }
        else if (isObject(value)) {
            for (const name in value) {
                if (value[name]) {
                    res += name + ' ';
                }
            }
        }
        return res.trim();
    }

    const EMPTY_OBJ = {};
    const EMPTY_ARR = [];
    const NOOP = () => { };
    /**
     * Always return false.
     */
    const NO = () => false;
    const onRE = /^on[^a-z]/;
    const isOn = (key) => onRE.test(key);
    const isModelListener = (key) => key.startsWith('onUpdate:');
    const extend = Object.assign;
    const remove = (arr, el) => {
        const i = arr.indexOf(el);
        if (i > -1) {
            arr.splice(i, 1);
        }
    };
    const hasOwnProperty = Object.prototype.hasOwnProperty;
    const hasOwn = (val, key) => hasOwnProperty.call(val, key);
    const isArray = Array.isArray;
    const isMap = (val) => toTypeString(val) === '[object Map]';
    const isSet = (val) => toTypeString(val) === '[object Set]';
    const isFunction = (val) => typeof val === 'function';
    const isString = (val) => typeof val === 'string';
    const isSymbol = (val) => typeof val === 'symbol';
    const isObject = (val) => val !== null && typeof val === 'object';
    const isPromise = (val) => {
        return isObject(val) && isFunction(val.then) && isFunction(val.catch);
    };
    const objectToString = Object.prototype.toString;
    const toTypeString = (value) => objectToString.call(value);
    const toRawType = (value) => {
        // extract "RawType" from strings like "[object RawType]"
        return toTypeString(value).slice(8, -1);
    };
    const isPlainObject = (val) => toTypeString(val) === '[object Object]';
    const isIntegerKey = (key) => isString(key) &&
        key !== 'NaN' &&
        key[0] !== '-' &&
        '' + parseInt(key, 10) === key;
    const isReservedProp = /*#__PURE__*/ makeMap(
    // the leading comma is intentional so empty string "" is also included
    ',key,ref,ref_for,ref_key,' +
        'onVnodeBeforeMount,onVnodeMounted,' +
        'onVnodeBeforeUpdate,onVnodeUpdated,' +
        'onVnodeBeforeUnmount,onVnodeUnmounted');
    const cacheStringFunction = (fn) => {
        const cache = Object.create(null);
        return ((str) => {
            const hit = cache[str];
            return hit || (cache[str] = fn(str));
        });
    };
    const camelizeRE = /-(\w)/g;
    /**
     * @private
     */
    const camelize = cacheStringFunction((str) => {
        return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
    });
    const hyphenateRE = /\B([A-Z])/g;
    /**
     * @private
     */
    const hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, '-$1').toLowerCase());
    /**
     * @private
     */
    const capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
    /**
     * @private
     */
    const toHandlerKey = cacheStringFunction((str) => str ? `on${capitalize(str)}` : ``);
    // compare whether a value has changed, accounting for NaN.
    const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
    const invokeArrayFns = (fns, arg) => {
        for (let i = 0; i < fns.length; i++) {
            fns[i](arg);
        }
    };
    const def = (obj, key, value) => {
        Object.defineProperty(obj, key, {
            configurable: true,
            enumerable: false,
            value
        });
    };
    const toNumber = (val) => {
        const n = parseFloat(val);
        return isNaN(n) ? val : n;
    };
    let _globalThis;
    const getGlobalThis = () => {
        return (_globalThis ||
            (_globalThis =
                typeof globalThis !== 'undefined'
                    ? globalThis
                    : typeof self !== 'undefined'
                        ? self
                        : typeof window !== 'undefined'
                            ? window
                            : typeof global !== 'undefined'
                                ? global
                                : {}));
    };

    let activeEffectScope;
    class EffectScope {
        constructor(detached = false) {
            this.active = true;
            this.effects = [];
            this.cleanups = [];
            if (!detached && activeEffectScope) {
                this.parent = activeEffectScope;
                this.index =
                    (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(this) - 1;
            }
        }
        run(fn) {
            if (this.active) {
                try {
                    activeEffectScope = this;
                    return fn();
                }
                finally {
                    activeEffectScope = this.parent;
                }
            }
        }
        on() {
            activeEffectScope = this;
        }
        off() {
            activeEffectScope = this.parent;
        }
        stop(fromParent) {
            if (this.active) {
                let i, l;
                for (i = 0, l = this.effects.length; i < l; i++) {
                    this.effects[i].stop();
                }
                for (i = 0, l = this.cleanups.length; i < l; i++) {
                    this.cleanups[i]();
                }
                if (this.scopes) {
                    for (i = 0, l = this.scopes.length; i < l; i++) {
                        this.scopes[i].stop(true);
                    }
                }
                // nested scope, dereference from parent to avoid memory leaks
                if (this.parent && !fromParent) {
                    // optimized O(1) removal
                    const last = this.parent.scopes.pop();
                    if (last && last !== this) {
                        this.parent.scopes[this.index] = last;
                        last.index = this.index;
                    }
                }
                this.active = false;
            }
        }
    }
    function recordEffectScope(effect, scope = activeEffectScope) {
        if (scope && scope.active) {
            scope.effects.push(effect);
        }
    }

    const createDep = (effects) => {
        const dep = new Set(effects);
        dep.w = 0;
        dep.n = 0;
        return dep;
    };
    const wasTracked = (dep) => (dep.w & trackOpBit) > 0;
    const newTracked = (dep) => (dep.n & trackOpBit) > 0;
    const initDepMarkers = ({ deps }) => {
        if (deps.length) {
            for (let i = 0; i < deps.length; i++) {
                deps[i].w |= trackOpBit; // set was tracked
            }
        }
    };
    const finalizeDepMarkers = (effect) => {
        const { deps } = effect;
        if (deps.length) {
            let ptr = 0;
            for (let i = 0; i < deps.length; i++) {
                const dep = deps[i];
                if (wasTracked(dep) && !newTracked(dep)) {
                    dep.delete(effect);
                }
                else {
                    deps[ptr++] = dep;
                }
                // clear bits
                dep.w &= ~trackOpBit;
                dep.n &= ~trackOpBit;
            }
            deps.length = ptr;
        }
    };

    const targetMap = new WeakMap();
    // The number of effects currently being tracked recursively.
    let effectTrackDepth = 0;
    let trackOpBit = 1;
    /**
     * The bitwise track markers support at most 30 levels of recursion.
     * This value is chosen to enable modern JS engines to use a SMI on all platforms.
     * When recursion depth is greater, fall back to using a full cleanup.
     */
    const maxMarkerBits = 30;
    let activeEffect;
    const ITERATE_KEY = Symbol('');
    const MAP_KEY_ITERATE_KEY = Symbol('');
    class ReactiveEffect {
        constructor(fn, scheduler = null, scope) {
            this.fn = fn;
            this.scheduler = scheduler;
            this.active = true;
            this.deps = [];
            this.parent = undefined;
            recordEffectScope(this, scope);
        }
        run() {
            if (!this.active) {
                return this.fn();
            }
            let parent = activeEffect;
            let lastShouldTrack = shouldTrack;
            while (parent) {
                if (parent === this) {
                    return;
                }
                parent = parent.parent;
            }
            try {
                this.parent = activeEffect;
                activeEffect = this;
                shouldTrack = true;
                trackOpBit = 1 << ++effectTrackDepth;
                if (effectTrackDepth <= maxMarkerBits) {
                    initDepMarkers(this);
                }
                else {
                    cleanupEffect(this);
                }
                return this.fn();
            }
            finally {
                if (effectTrackDepth <= maxMarkerBits) {
                    finalizeDepMarkers(this);
                }
                trackOpBit = 1 << --effectTrackDepth;
                activeEffect = this.parent;
                shouldTrack = lastShouldTrack;
                this.parent = undefined;
            }
        }
        stop() {
            if (this.active) {
                cleanupEffect(this);
                if (this.onStop) {
                    this.onStop();
                }
                this.active = false;
            }
        }
    }
    function cleanupEffect(effect) {
        const { deps } = effect;
        if (deps.length) {
            for (let i = 0; i < deps.length; i++) {
                deps[i].delete(effect);
            }
            deps.length = 0;
        }
    }
    let shouldTrack = true;
    const trackStack = [];
    function pauseTracking() {
        trackStack.push(shouldTrack);
        shouldTrack = false;
    }
    function resetTracking() {
        const last = trackStack.pop();
        shouldTrack = last === undefined ? true : last;
    }
    function track(target, type, key) {
        if (shouldTrack && activeEffect) {
            let depsMap = targetMap.get(target);
            if (!depsMap) {
                targetMap.set(target, (depsMap = new Map()));
            }
            let dep = depsMap.get(key);
            if (!dep) {
                depsMap.set(key, (dep = createDep()));
            }
            trackEffects(dep);
        }
    }
    function trackEffects(dep, debuggerEventExtraInfo) {
        let shouldTrack = false;
        if (effectTrackDepth <= maxMarkerBits) {
            if (!newTracked(dep)) {
                dep.n |= trackOpBit; // set newly tracked
                shouldTrack = !wasTracked(dep);
            }
        }
        else {
            // Full cleanup mode.
            shouldTrack = !dep.has(activeEffect);
        }
        if (shouldTrack) {
            dep.add(activeEffect);
            activeEffect.deps.push(dep);
        }
    }
    function trigger(target, type, key, newValue, oldValue, oldTarget) {
        const depsMap = targetMap.get(target);
        if (!depsMap) {
            // never been tracked
            return;
        }
        let deps = [];
        if (type === "clear" /* CLEAR */) {
            // collection being cleared
            // trigger all effects for target
            deps = [...depsMap.values()];
        }
        else if (key === 'length' && isArray(target)) {
            depsMap.forEach((dep, key) => {
                if (key === 'length' || key >= newValue) {
                    deps.push(dep);
                }
            });
        }
        else {
            // schedule runs for SET | ADD | DELETE
            if (key !== void 0) {
                deps.push(depsMap.get(key));
            }
            // also run for iteration key on ADD | DELETE | Map.SET
            switch (type) {
                case "add" /* ADD */:
                    if (!isArray(target)) {
                        deps.push(depsMap.get(ITERATE_KEY));
                        if (isMap(target)) {
                            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
                        }
                    }
                    else if (isIntegerKey(key)) {
                        // new index added to array -> length changes
                        deps.push(depsMap.get('length'));
                    }
                    break;
                case "delete" /* DELETE */:
                    if (!isArray(target)) {
                        deps.push(depsMap.get(ITERATE_KEY));
                        if (isMap(target)) {
                            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
                        }
                    }
                    break;
                case "set" /* SET */:
                    if (isMap(target)) {
                        deps.push(depsMap.get(ITERATE_KEY));
                    }
                    break;
            }
        }
        if (deps.length === 1) {
            if (deps[0]) {
                {
                    triggerEffects(deps[0]);
                }
            }
        }
        else {
            const effects = [];
            for (const dep of deps) {
                if (dep) {
                    effects.push(...dep);
                }
            }
            {
                triggerEffects(createDep(effects));
            }
        }
    }
    function triggerEffects(dep, debuggerEventExtraInfo) {
        // spread into array for stabilization
        for (const effect of isArray(dep) ? dep : [...dep]) {
            if (effect !== activeEffect || effect.allowRecurse) {
                if (effect.scheduler) {
                    effect.scheduler();
                }
                else {
                    effect.run();
                }
            }
        }
    }

    const isNonTrackableKeys = /*#__PURE__*/ makeMap(`__proto__,__v_isRef,__isVue`);
    const builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol)
        .map(key => Symbol[key])
        .filter(isSymbol));
    const get = /*#__PURE__*/ createGetter();
    const shallowGet = /*#__PURE__*/ createGetter(false, true);
    const readonlyGet = /*#__PURE__*/ createGetter(true);
    const arrayInstrumentations = /*#__PURE__*/ createArrayInstrumentations();
    function createArrayInstrumentations() {
        const instrumentations = {};
        ['includes', 'indexOf', 'lastIndexOf'].forEach(key => {
            instrumentations[key] = function (...args) {
                const arr = toRaw(this);
                for (let i = 0, l = this.length; i < l; i++) {
                    track(arr, "get" /* GET */, i + '');
                }
                // we run the method using the original args first (which may be reactive)
                const res = arr[key](...args);
                if (res === -1 || res === false) {
                    // if that didn't work, run it again using raw values.
                    return arr[key](...args.map(toRaw));
                }
                else {
                    return res;
                }
            };
        });
        ['push', 'pop', 'shift', 'unshift', 'splice'].forEach(key => {
            instrumentations[key] = function (...args) {
                pauseTracking();
                const res = toRaw(this)[key].apply(this, args);
                resetTracking();
                return res;
            };
        });
        return instrumentations;
    }
    function createGetter(isReadonly = false, shallow = false) {
        return function get(target, key, receiver) {
            if (key === "__v_isReactive" /* IS_REACTIVE */) {
                return !isReadonly;
            }
            else if (key === "__v_isReadonly" /* IS_READONLY */) {
                return isReadonly;
            }
            else if (key === "__v_isShallow" /* IS_SHALLOW */) {
                return shallow;
            }
            else if (key === "__v_raw" /* RAW */ &&
                receiver ===
                    (isReadonly
                        ? shallow
                            ? shallowReadonlyMap
                            : readonlyMap
                        : shallow
                            ? shallowReactiveMap
                            : reactiveMap).get(target)) {
                return target;
            }
            const targetIsArray = isArray(target);
            if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key)) {
                return Reflect.get(arrayInstrumentations, key, receiver);
            }
            const res = Reflect.get(target, key, receiver);
            if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
                return res;
            }
            if (!isReadonly) {
                track(target, "get" /* GET */, key);
            }
            if (shallow) {
                return res;
            }
            if (isRef(res)) {
                // ref unwrapping - does not apply for Array + integer key.
                const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
                return shouldUnwrap ? res.value : res;
            }
            if (isObject(res)) {
                // Convert returned value into a proxy as well. we do the isObject check
                // here to avoid invalid value warning. Also need to lazy access readonly
                // and reactive here to avoid circular dependency.
                return isReadonly ? readonly(res) : reactive(res);
            }
            return res;
        };
    }
    const set = /*#__PURE__*/ createSetter();
    const shallowSet = /*#__PURE__*/ createSetter(true);
    function createSetter(shallow = false) {
        return function set(target, key, value, receiver) {
            let oldValue = target[key];
            if (isReadonly(oldValue) && isRef(oldValue) && !isRef(value)) {
                return false;
            }
            if (!shallow && !isReadonly(value)) {
                if (!isShallow(value)) {
                    value = toRaw(value);
                    oldValue = toRaw(oldValue);
                }
                if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
                    oldValue.value = value;
                    return true;
                }
            }
            const hadKey = isArray(target) && isIntegerKey(key)
                ? Number(key) < target.length
                : hasOwn(target, key);
            const result = Reflect.set(target, key, value, receiver);
            // don't trigger if target is something up in the prototype chain of original
            if (target === toRaw(receiver)) {
                if (!hadKey) {
                    trigger(target, "add" /* ADD */, key, value);
                }
                else if (hasChanged(value, oldValue)) {
                    trigger(target, "set" /* SET */, key, value);
                }
            }
            return result;
        };
    }
    function deleteProperty(target, key) {
        const hadKey = hasOwn(target, key);
        target[key];
        const result = Reflect.deleteProperty(target, key);
        if (result && hadKey) {
            trigger(target, "delete" /* DELETE */, key, undefined);
        }
        return result;
    }
    function has(target, key) {
        const result = Reflect.has(target, key);
        if (!isSymbol(key) || !builtInSymbols.has(key)) {
            track(target, "has" /* HAS */, key);
        }
        return result;
    }
    function ownKeys(target) {
        track(target, "iterate" /* ITERATE */, isArray(target) ? 'length' : ITERATE_KEY);
        return Reflect.ownKeys(target);
    }
    const mutableHandlers = {
        get,
        set,
        deleteProperty,
        has,
        ownKeys
    };
    const readonlyHandlers = {
        get: readonlyGet,
        set(target, key) {
            return true;
        },
        deleteProperty(target, key) {
            return true;
        }
    };
    const shallowReactiveHandlers = /*#__PURE__*/ extend({}, mutableHandlers, {
        get: shallowGet,
        set: shallowSet
    });

    const toShallow = (value) => value;
    const getProto = (v) => Reflect.getPrototypeOf(v);
    function get$1(target, key, isReadonly = false, isShallow = false) {
        // #1772: readonly(reactive(Map)) should return readonly + reactive version
        // of the value
        target = target["__v_raw" /* RAW */];
        const rawTarget = toRaw(target);
        const rawKey = toRaw(key);
        if (key !== rawKey) {
            !isReadonly && track(rawTarget, "get" /* GET */, key);
        }
        !isReadonly && track(rawTarget, "get" /* GET */, rawKey);
        const { has } = getProto(rawTarget);
        const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
        if (has.call(rawTarget, key)) {
            return wrap(target.get(key));
        }
        else if (has.call(rawTarget, rawKey)) {
            return wrap(target.get(rawKey));
        }
        else if (target !== rawTarget) {
            // #3602 readonly(reactive(Map))
            // ensure that the nested reactive `Map` can do tracking for itself
            target.get(key);
        }
    }
    function has$1(key, isReadonly = false) {
        const target = this["__v_raw" /* RAW */];
        const rawTarget = toRaw(target);
        const rawKey = toRaw(key);
        if (key !== rawKey) {
            !isReadonly && track(rawTarget, "has" /* HAS */, key);
        }
        !isReadonly && track(rawTarget, "has" /* HAS */, rawKey);
        return key === rawKey
            ? target.has(key)
            : target.has(key) || target.has(rawKey);
    }
    function size(target, isReadonly = false) {
        target = target["__v_raw" /* RAW */];
        !isReadonly && track(toRaw(target), "iterate" /* ITERATE */, ITERATE_KEY);
        return Reflect.get(target, 'size', target);
    }
    function add(value) {
        value = toRaw(value);
        const target = toRaw(this);
        const proto = getProto(target);
        const hadKey = proto.has.call(target, value);
        if (!hadKey) {
            target.add(value);
            trigger(target, "add" /* ADD */, value, value);
        }
        return this;
    }
    function set$1(key, value) {
        value = toRaw(value);
        const target = toRaw(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
            key = toRaw(key);
            hadKey = has.call(target, key);
        }
        const oldValue = get.call(target, key);
        target.set(key, value);
        if (!hadKey) {
            trigger(target, "add" /* ADD */, key, value);
        }
        else if (hasChanged(value, oldValue)) {
            trigger(target, "set" /* SET */, key, value);
        }
        return this;
    }
    function deleteEntry(key) {
        const target = toRaw(this);
        const { has, get } = getProto(target);
        let hadKey = has.call(target, key);
        if (!hadKey) {
            key = toRaw(key);
            hadKey = has.call(target, key);
        }
        get ? get.call(target, key) : undefined;
        // forward the operation before queueing reactions
        const result = target.delete(key);
        if (hadKey) {
            trigger(target, "delete" /* DELETE */, key, undefined);
        }
        return result;
    }
    function clear() {
        const target = toRaw(this);
        const hadItems = target.size !== 0;
        // forward the operation before queueing reactions
        const result = target.clear();
        if (hadItems) {
            trigger(target, "clear" /* CLEAR */, undefined, undefined);
        }
        return result;
    }
    function createForEach(isReadonly, isShallow) {
        return function forEach(callback, thisArg) {
            const observed = this;
            const target = observed["__v_raw" /* RAW */];
            const rawTarget = toRaw(target);
            const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
            !isReadonly && track(rawTarget, "iterate" /* ITERATE */, ITERATE_KEY);
            return target.forEach((value, key) => {
                // important: make sure the callback is
                // 1. invoked with the reactive map as `this` and 3rd arg
                // 2. the value received should be a corresponding reactive/readonly.
                return callback.call(thisArg, wrap(value), wrap(key), observed);
            });
        };
    }
    function createIterableMethod(method, isReadonly, isShallow) {
        return function (...args) {
            const target = this["__v_raw" /* RAW */];
            const rawTarget = toRaw(target);
            const targetIsMap = isMap(rawTarget);
            const isPair = method === 'entries' || (method === Symbol.iterator && targetIsMap);
            const isKeyOnly = method === 'keys' && targetIsMap;
            const innerIterator = target[method](...args);
            const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
            !isReadonly &&
                track(rawTarget, "iterate" /* ITERATE */, isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
            // return a wrapped iterator which returns observed versions of the
            // values emitted from the real iterator
            return {
                // iterator protocol
                next() {
                    const { value, done } = innerIterator.next();
                    return done
                        ? { value, done }
                        : {
                            value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
                            done
                        };
                },
                // iterable protocol
                [Symbol.iterator]() {
                    return this;
                }
            };
        };
    }
    function createReadonlyMethod(type) {
        return function (...args) {
            return type === "delete" /* DELETE */ ? false : this;
        };
    }
    function createInstrumentations() {
        const mutableInstrumentations = {
            get(key) {
                return get$1(this, key);
            },
            get size() {
                return size(this);
            },
            has: has$1,
            add,
            set: set$1,
            delete: deleteEntry,
            clear,
            forEach: createForEach(false, false)
        };
        const shallowInstrumentations = {
            get(key) {
                return get$1(this, key, false, true);
            },
            get size() {
                return size(this);
            },
            has: has$1,
            add,
            set: set$1,
            delete: deleteEntry,
            clear,
            forEach: createForEach(false, true)
        };
        const readonlyInstrumentations = {
            get(key) {
                return get$1(this, key, true);
            },
            get size() {
                return size(this, true);
            },
            has(key) {
                return has$1.call(this, key, true);
            },
            add: createReadonlyMethod("add" /* ADD */),
            set: createReadonlyMethod("set" /* SET */),
            delete: createReadonlyMethod("delete" /* DELETE */),
            clear: createReadonlyMethod("clear" /* CLEAR */),
            forEach: createForEach(true, false)
        };
        const shallowReadonlyInstrumentations = {
            get(key) {
                return get$1(this, key, true, true);
            },
            get size() {
                return size(this, true);
            },
            has(key) {
                return has$1.call(this, key, true);
            },
            add: createReadonlyMethod("add" /* ADD */),
            set: createReadonlyMethod("set" /* SET */),
            delete: createReadonlyMethod("delete" /* DELETE */),
            clear: createReadonlyMethod("clear" /* CLEAR */),
            forEach: createForEach(true, true)
        };
        const iteratorMethods = ['keys', 'values', 'entries', Symbol.iterator];
        iteratorMethods.forEach(method => {
            mutableInstrumentations[method] = createIterableMethod(method, false, false);
            readonlyInstrumentations[method] = createIterableMethod(method, true, false);
            shallowInstrumentations[method] = createIterableMethod(method, false, true);
            shallowReadonlyInstrumentations[method] = createIterableMethod(method, true, true);
        });
        return [
            mutableInstrumentations,
            readonlyInstrumentations,
            shallowInstrumentations,
            shallowReadonlyInstrumentations
        ];
    }
    const [mutableInstrumentations, readonlyInstrumentations, shallowInstrumentations, shallowReadonlyInstrumentations] = /* #__PURE__*/ createInstrumentations();
    function createInstrumentationGetter(isReadonly, shallow) {
        const instrumentations = shallow
            ? isReadonly
                ? shallowReadonlyInstrumentations
                : shallowInstrumentations
            : isReadonly
                ? readonlyInstrumentations
                : mutableInstrumentations;
        return (target, key, receiver) => {
            if (key === "__v_isReactive" /* IS_REACTIVE */) {
                return !isReadonly;
            }
            else if (key === "__v_isReadonly" /* IS_READONLY */) {
                return isReadonly;
            }
            else if (key === "__v_raw" /* RAW */) {
                return target;
            }
            return Reflect.get(hasOwn(instrumentations, key) && key in target
                ? instrumentations
                : target, key, receiver);
        };
    }
    const mutableCollectionHandlers = {
        get: /*#__PURE__*/ createInstrumentationGetter(false, false)
    };
    const shallowCollectionHandlers = {
        get: /*#__PURE__*/ createInstrumentationGetter(false, true)
    };
    const readonlyCollectionHandlers = {
        get: /*#__PURE__*/ createInstrumentationGetter(true, false)
    };

    const reactiveMap = new WeakMap();
    const shallowReactiveMap = new WeakMap();
    const readonlyMap = new WeakMap();
    const shallowReadonlyMap = new WeakMap();
    function targetTypeMap(rawType) {
        switch (rawType) {
            case 'Object':
            case 'Array':
                return 1 /* COMMON */;
            case 'Map':
            case 'Set':
            case 'WeakMap':
            case 'WeakSet':
                return 2 /* COLLECTION */;
            default:
                return 0 /* INVALID */;
        }
    }
    function getTargetType(value) {
        return value["__v_skip" /* SKIP */] || !Object.isExtensible(value)
            ? 0 /* INVALID */
            : targetTypeMap(toRawType(value));
    }
    function reactive(target) {
        // if trying to observe a readonly proxy, return the readonly version.
        if (isReadonly(target)) {
            return target;
        }
        return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
    }
    /**
     * Return a shallowly-reactive copy of the original object, where only the root
     * level properties are reactive. It also does not auto-unwrap refs (even at the
     * root level).
     */
    function shallowReactive(target) {
        return createReactiveObject(target, false, shallowReactiveHandlers, shallowCollectionHandlers, shallowReactiveMap);
    }
    /**
     * Creates a readonly copy of the original object. Note the returned copy is not
     * made reactive, but `readonly` can be called on an already reactive object.
     */
    function readonly(target) {
        return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
    }
    function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers, proxyMap) {
        if (!isObject(target)) {
            return target;
        }
        // target is already a Proxy, return it.
        // exception: calling readonly() on a reactive object
        if (target["__v_raw" /* RAW */] &&
            !(isReadonly && target["__v_isReactive" /* IS_REACTIVE */])) {
            return target;
        }
        // target already has corresponding Proxy
        const existingProxy = proxyMap.get(target);
        if (existingProxy) {
            return existingProxy;
        }
        // only a whitelist of value types can be observed.
        const targetType = getTargetType(target);
        if (targetType === 0 /* INVALID */) {
            return target;
        }
        const proxy = new Proxy(target, targetType === 2 /* COLLECTION */ ? collectionHandlers : baseHandlers);
        proxyMap.set(target, proxy);
        return proxy;
    }
    function isReactive(value) {
        if (isReadonly(value)) {
            return isReactive(value["__v_raw" /* RAW */]);
        }
        return !!(value && value["__v_isReactive" /* IS_REACTIVE */]);
    }
    function isReadonly(value) {
        return !!(value && value["__v_isReadonly" /* IS_READONLY */]);
    }
    function isShallow(value) {
        return !!(value && value["__v_isShallow" /* IS_SHALLOW */]);
    }
    function isProxy(value) {
        return isReactive(value) || isReadonly(value);
    }
    function toRaw(observed) {
        const raw = observed && observed["__v_raw" /* RAW */];
        return raw ? toRaw(raw) : observed;
    }
    function markRaw(value) {
        def(value, "__v_skip" /* SKIP */, true);
        return value;
    }
    const toReactive = (value) => isObject(value) ? reactive(value) : value;
    const toReadonly = (value) => isObject(value) ? readonly(value) : value;

    function trackRefValue(ref) {
        if (shouldTrack && activeEffect) {
            ref = toRaw(ref);
            {
                trackEffects(ref.dep || (ref.dep = createDep()));
            }
        }
    }
    function triggerRefValue(ref, newVal) {
        ref = toRaw(ref);
        if (ref.dep) {
            {
                triggerEffects(ref.dep);
            }
        }
    }
    function isRef(r) {
        return !!(r && r.__v_isRef === true);
    }
    function ref(value) {
        return createRef(value, false);
    }
    function shallowRef(value) {
        return createRef(value, true);
    }
    function createRef(rawValue, shallow) {
        if (isRef(rawValue)) {
            return rawValue;
        }
        return new RefImpl(rawValue, shallow);
    }
    class RefImpl {
        constructor(value, __v_isShallow) {
            this.__v_isShallow = __v_isShallow;
            this.dep = undefined;
            this.__v_isRef = true;
            this._rawValue = __v_isShallow ? value : toRaw(value);
            this._value = __v_isShallow ? value : toReactive(value);
        }
        get value() {
            trackRefValue(this);
            return this._value;
        }
        set value(newVal) {
            newVal = this.__v_isShallow ? newVal : toRaw(newVal);
            if (hasChanged(newVal, this._rawValue)) {
                this._rawValue = newVal;
                this._value = this.__v_isShallow ? newVal : toReactive(newVal);
                triggerRefValue(this);
            }
        }
    }
    function unref(ref) {
        return isRef(ref) ? ref.value : ref;
    }
    const shallowUnwrapHandlers = {
        get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
        set: (target, key, value, receiver) => {
            const oldValue = target[key];
            if (isRef(oldValue) && !isRef(value)) {
                oldValue.value = value;
                return true;
            }
            else {
                return Reflect.set(target, key, value, receiver);
            }
        }
    };
    function proxyRefs(objectWithRefs) {
        return isReactive(objectWithRefs)
            ? objectWithRefs
            : new Proxy(objectWithRefs, shallowUnwrapHandlers);
    }

    class ComputedRefImpl {
        constructor(getter, _setter, isReadonly, isSSR) {
            this._setter = _setter;
            this.dep = undefined;
            this.__v_isRef = true;
            this._dirty = true;
            this.effect = new ReactiveEffect(getter, () => {
                if (!this._dirty) {
                    this._dirty = true;
                    triggerRefValue(this);
                }
            });
            this.effect.computed = this;
            this.effect.active = this._cacheable = !isSSR;
            this["__v_isReadonly" /* IS_READONLY */] = isReadonly;
        }
        get value() {
            // the computed ref may get wrapped by other proxies e.g. readonly() #3376
            const self = toRaw(this);
            trackRefValue(self);
            if (self._dirty || !self._cacheable) {
                self._dirty = false;
                self._value = self.effect.run();
            }
            return self._value;
        }
        set value(newValue) {
            this._setter(newValue);
        }
    }
    function computed$1(getterOrOptions, debugOptions, isSSR = false) {
        let getter;
        let setter;
        const onlyGetter = isFunction(getterOrOptions);
        if (onlyGetter) {
            getter = getterOrOptions;
            setter = NOOP;
        }
        else {
            getter = getterOrOptions.get;
            setter = getterOrOptions.set;
        }
        const cRef = new ComputedRefImpl(getter, setter, onlyGetter || !setter, isSSR);
        return cRef;
    }
    Promise.resolve();

    function callWithErrorHandling(fn, instance, type, args) {
        let res;
        try {
            res = args ? fn(...args) : fn();
        }
        catch (err) {
            handleError(err, instance, type);
        }
        return res;
    }
    function callWithAsyncErrorHandling(fn, instance, type, args) {
        if (isFunction(fn)) {
            const res = callWithErrorHandling(fn, instance, type, args);
            if (res && isPromise(res)) {
                res.catch(err => {
                    handleError(err, instance, type);
                });
            }
            return res;
        }
        const values = [];
        for (let i = 0; i < fn.length; i++) {
            values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
        }
        return values;
    }
    function handleError(err, instance, type, throwInDev = true) {
        const contextVNode = instance ? instance.vnode : null;
        if (instance) {
            let cur = instance.parent;
            // the exposed instance is the render proxy to keep it consistent with 2.x
            const exposedInstance = instance.proxy;
            // in production the hook receives only the error code
            const errorInfo = type;
            while (cur) {
                const errorCapturedHooks = cur.ec;
                if (errorCapturedHooks) {
                    for (let i = 0; i < errorCapturedHooks.length; i++) {
                        if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) {
                            return;
                        }
                    }
                }
                cur = cur.parent;
            }
            // app-level handling
            const appErrorHandler = instance.appContext.config.errorHandler;
            if (appErrorHandler) {
                callWithErrorHandling(appErrorHandler, null, 10 /* APP_ERROR_HANDLER */, [err, exposedInstance, errorInfo]);
                return;
            }
        }
        logError(err, type, contextVNode, throwInDev);
    }
    function logError(err, type, contextVNode, throwInDev = true) {
        {
            // recover in prod to reduce the impact on end-user
            console.error(err);
        }
    }

    let isFlushing = false;
    let isFlushPending = false;
    const queue = [];
    let flushIndex = 0;
    const pendingPreFlushCbs = [];
    let activePreFlushCbs = null;
    let preFlushIndex = 0;
    const pendingPostFlushCbs = [];
    let activePostFlushCbs = null;
    let postFlushIndex = 0;
    const resolvedPromise = Promise.resolve();
    let currentFlushPromise = null;
    let currentPreFlushParentJob = null;
    function nextTick(fn) {
        const p = currentFlushPromise || resolvedPromise;
        return fn ? p.then(this ? fn.bind(this) : fn) : p;
    }
    // #2768
    // Use binary-search to find a suitable position in the queue,
    // so that the queue maintains the increasing order of job's id,
    // which can prevent the job from being skipped and also can avoid repeated patching.
    function findInsertionIndex(id) {
        // the start index should be `flushIndex + 1`
        let start = flushIndex + 1;
        let end = queue.length;
        while (start < end) {
            const middle = (start + end) >>> 1;
            const middleJobId = getId(queue[middle]);
            middleJobId < id ? (start = middle + 1) : (end = middle);
        }
        return start;
    }
    function queueJob(job) {
        // the dedupe search uses the startIndex argument of Array.includes()
        // by default the search index includes the current job that is being run
        // so it cannot recursively trigger itself again.
        // if the job is a watch() callback, the search will start with a +1 index to
        // allow it recursively trigger itself - it is the user's responsibility to
        // ensure it doesn't end up in an infinite loop.
        if ((!queue.length ||
            !queue.includes(job, isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex)) &&
            job !== currentPreFlushParentJob) {
            if (job.id == null) {
                queue.push(job);
            }
            else {
                queue.splice(findInsertionIndex(job.id), 0, job);
            }
            queueFlush();
        }
    }
    function queueFlush() {
        if (!isFlushing && !isFlushPending) {
            isFlushPending = true;
            currentFlushPromise = resolvedPromise.then(flushJobs);
        }
    }
    function invalidateJob(job) {
        const i = queue.indexOf(job);
        if (i > flushIndex) {
            queue.splice(i, 1);
        }
    }
    function queueCb(cb, activeQueue, pendingQueue, index) {
        if (!isArray(cb)) {
            if (!activeQueue ||
                !activeQueue.includes(cb, cb.allowRecurse ? index + 1 : index)) {
                pendingQueue.push(cb);
            }
        }
        else {
            // if cb is an array, it is a component lifecycle hook which can only be
            // triggered by a job, which is already deduped in the main queue, so
            // we can skip duplicate check here to improve perf
            pendingQueue.push(...cb);
        }
        queueFlush();
    }
    function queuePreFlushCb(cb) {
        queueCb(cb, activePreFlushCbs, pendingPreFlushCbs, preFlushIndex);
    }
    function queuePostFlushCb(cb) {
        queueCb(cb, activePostFlushCbs, pendingPostFlushCbs, postFlushIndex);
    }
    function flushPreFlushCbs(seen, parentJob = null) {
        if (pendingPreFlushCbs.length) {
            currentPreFlushParentJob = parentJob;
            activePreFlushCbs = [...new Set(pendingPreFlushCbs)];
            pendingPreFlushCbs.length = 0;
            for (preFlushIndex = 0; preFlushIndex < activePreFlushCbs.length; preFlushIndex++) {
                activePreFlushCbs[preFlushIndex]();
            }
            activePreFlushCbs = null;
            preFlushIndex = 0;
            currentPreFlushParentJob = null;
            // recursively flush until it drains
            flushPreFlushCbs(seen, parentJob);
        }
    }
    function flushPostFlushCbs(seen) {
        if (pendingPostFlushCbs.length) {
            const deduped = [...new Set(pendingPostFlushCbs)];
            pendingPostFlushCbs.length = 0;
            // #1947 already has active queue, nested flushPostFlushCbs call
            if (activePostFlushCbs) {
                activePostFlushCbs.push(...deduped);
                return;
            }
            activePostFlushCbs = deduped;
            activePostFlushCbs.sort((a, b) => getId(a) - getId(b));
            for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
                activePostFlushCbs[postFlushIndex]();
            }
            activePostFlushCbs = null;
            postFlushIndex = 0;
        }
    }
    const getId = (job) => job.id == null ? Infinity : job.id;
    function flushJobs(seen) {
        isFlushPending = false;
        isFlushing = true;
        flushPreFlushCbs(seen);
        // Sort queue before flush.
        // This ensures that:
        // 1. Components are updated from parent to child. (because parent is always
        //    created before the child so its render effect will have smaller
        //    priority number)
        // 2. If a component is unmounted during a parent component's update,
        //    its update can be skipped.
        queue.sort((a, b) => getId(a) - getId(b));
        // conditional usage of checkRecursiveUpdate must be determined out of
        // try ... catch block since Rollup by default de-optimizes treeshaking
        // inside try-catch. This can leave all warning code unshaked. Although
        // they would get eventually shaken by a minifier like terser, some minifiers
        // would fail to do that (e.g. https://github.com/evanw/esbuild/issues/1610)
        const check = NOOP;
        try {
            for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
                const job = queue[flushIndex];
                if (job && job.active !== false) {
                    if (("production" !== 'production') && check(job)) ;
                    // console.log(`running:`, job.id)
                    callWithErrorHandling(job, null, 14 /* SCHEDULER */);
                }
            }
        }
        finally {
            flushIndex = 0;
            queue.length = 0;
            flushPostFlushCbs();
            isFlushing = false;
            currentFlushPromise = null;
            // some postFlushCb queued jobs!
            // keep flushing until it drains.
            if (queue.length ||
                pendingPreFlushCbs.length ||
                pendingPostFlushCbs.length) {
                flushJobs(seen);
            }
        }
    }

    let devtools;
    let buffer = [];
    let devtoolsNotInstalled = false;
    function emit(event, ...args) {
        if (devtools) {
            devtools.emit(event, ...args);
        }
        else if (!devtoolsNotInstalled) {
            buffer.push({ event, args });
        }
    }
    function setDevtoolsHook(hook, target) {
        var _a, _b;
        devtools = hook;
        if (devtools) {
            devtools.enabled = true;
            buffer.forEach(({ event, args }) => devtools.emit(event, ...args));
            buffer = [];
        }
        else if (
        // handle late devtools injection - only do this if we are in an actual
        // browser environment to avoid the timer handle stalling test runner exit
        // (#4815)
        // eslint-disable-next-line no-restricted-globals
        typeof window !== 'undefined' &&
            // some envs mock window but not fully
            window.HTMLElement &&
            // also exclude jsdom
            !((_b = (_a = window.navigator) === null || _a === void 0 ? void 0 : _a.userAgent) === null || _b === void 0 ? void 0 : _b.includes('jsdom'))) {
            const replay = (target.__VUE_DEVTOOLS_HOOK_REPLAY__ =
                target.__VUE_DEVTOOLS_HOOK_REPLAY__ || []);
            replay.push((newHook) => {
                setDevtoolsHook(newHook, target);
            });
            // clear buffer after 3s - the user probably doesn't have devtools installed
            // at all, and keeping the buffer will cause memory leaks (#4738)
            setTimeout(() => {
                if (!devtools) {
                    target.__VUE_DEVTOOLS_HOOK_REPLAY__ = null;
                    devtoolsNotInstalled = true;
                    buffer = [];
                }
            }, 3000);
        }
        else {
            // non-browser env, assume not installed
            devtoolsNotInstalled = true;
            buffer = [];
        }
    }
    function devtoolsInitApp(app, version) {
        emit("app:init" /* APP_INIT */, app, version, {
            Fragment,
            Text,
            Comment,
            Static
        });
    }
    function devtoolsUnmountApp(app) {
        emit("app:unmount" /* APP_UNMOUNT */, app);
    }
    const devtoolsComponentAdded = /*#__PURE__*/ createDevtoolsComponentHook("component:added" /* COMPONENT_ADDED */);
    const devtoolsComponentUpdated = 
    /*#__PURE__*/ createDevtoolsComponentHook("component:updated" /* COMPONENT_UPDATED */);
    const devtoolsComponentRemoved = 
    /*#__PURE__*/ createDevtoolsComponentHook("component:removed" /* COMPONENT_REMOVED */);
    function createDevtoolsComponentHook(hook) {
        return (component) => {
            emit(hook, component.appContext.app, component.uid, component.parent ? component.parent.uid : undefined, component);
        };
    }
    function devtoolsComponentEmit(component, event, params) {
        emit("component:emit" /* COMPONENT_EMIT */, component.appContext.app, component, event, params);
    }

    function emit$1(instance, event, ...rawArgs) {
        const props = instance.vnode.props || EMPTY_OBJ;
        let args = rawArgs;
        const isModelListener = event.startsWith('update:');
        // for v-model update:xxx events, apply modifiers on args
        const modelArg = isModelListener && event.slice(7);
        if (modelArg && modelArg in props) {
            const modifiersKey = `${modelArg === 'modelValue' ? 'model' : modelArg}Modifiers`;
            const { number, trim } = props[modifiersKey] || EMPTY_OBJ;
            if (trim) {
                args = rawArgs.map(a => a.trim());
            }
            else if (number) {
                args = rawArgs.map(toNumber);
            }
        }
        if (__VUE_PROD_DEVTOOLS__) {
            devtoolsComponentEmit(instance, event, args);
        }
        let handlerName;
        let handler = props[(handlerName = toHandlerKey(event))] ||
            // also try camelCase event handler (#2249)
            props[(handlerName = toHandlerKey(camelize(event)))];
        // for v-model update:xxx events, also trigger kebab-case equivalent
        // for props passed via kebab-case
        if (!handler && isModelListener) {
            handler = props[(handlerName = toHandlerKey(hyphenate(event)))];
        }
        if (handler) {
            callWithAsyncErrorHandling(handler, instance, 6 /* COMPONENT_EVENT_HANDLER */, args);
        }
        const onceHandler = props[handlerName + `Once`];
        if (onceHandler) {
            if (!instance.emitted) {
                instance.emitted = {};
            }
            else if (instance.emitted[handlerName]) {
                return;
            }
            instance.emitted[handlerName] = true;
            callWithAsyncErrorHandling(onceHandler, instance, 6 /* COMPONENT_EVENT_HANDLER */, args);
        }
    }
    function normalizeEmitsOptions(comp, appContext, asMixin = false) {
        const cache = appContext.emitsCache;
        const cached = cache.get(comp);
        if (cached !== undefined) {
            return cached;
        }
        const raw = comp.emits;
        let normalized = {};
        // apply mixin/extends props
        let hasExtends = false;
        if (__VUE_OPTIONS_API__ && !isFunction(comp)) {
            const extendEmits = (raw) => {
                const normalizedFromExtend = normalizeEmitsOptions(raw, appContext, true);
                if (normalizedFromExtend) {
                    hasExtends = true;
                    extend(normalized, normalizedFromExtend);
                }
            };
            if (!asMixin && appContext.mixins.length) {
                appContext.mixins.forEach(extendEmits);
            }
            if (comp.extends) {
                extendEmits(comp.extends);
            }
            if (comp.mixins) {
                comp.mixins.forEach(extendEmits);
            }
        }
        if (!raw && !hasExtends) {
            cache.set(comp, null);
            return null;
        }
        if (isArray(raw)) {
            raw.forEach(key => (normalized[key] = null));
        }
        else {
            extend(normalized, raw);
        }
        cache.set(comp, normalized);
        return normalized;
    }
    // Check if an incoming prop key is a declared emit event listener.
    // e.g. With `emits: { click: null }`, props named `onClick` and `onclick` are
    // both considered matched listeners.
    function isEmitListener(options, key) {
        if (!options || !isOn(key)) {
            return false;
        }
        key = key.slice(2).replace(/Once$/, '');
        return (hasOwn(options, key[0].toLowerCase() + key.slice(1)) ||
            hasOwn(options, hyphenate(key)) ||
            hasOwn(options, key));
    }

    /**
     * mark the current rendering instance for asset resolution (e.g.
     * resolveComponent, resolveDirective) during render
     */
    let currentRenderingInstance = null;
    let currentScopeId = null;
    /**
     * Note: rendering calls maybe nested. The function returns the parent rendering
     * instance if present, which should be restored after the render is done:
     *
     * ```js
     * const prev = setCurrentRenderingInstance(i)
     * // ...render
     * setCurrentRenderingInstance(prev)
     * ```
     */
    function setCurrentRenderingInstance(instance) {
        const prev = currentRenderingInstance;
        currentRenderingInstance = instance;
        currentScopeId = (instance && instance.type.__scopeId) || null;
        return prev;
    }
    /**
     * Wrap a slot function to memoize current rendering instance
     * @private compiler helper
     */
    function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot // false only
    ) {
        if (!ctx)
            return fn;
        // already normalized
        if (fn._n) {
            return fn;
        }
        const renderFnWithContext = (...args) => {
            // If a user calls a compiled slot inside a template expression (#1745), it
            // can mess up block tracking, so by default we disable block tracking and
            // force bail out when invoking a compiled slot (indicated by the ._d flag).
            // This isn't necessary if rendering a compiled `<slot>`, so we flip the
            // ._d flag off when invoking the wrapped fn inside `renderSlot`.
            if (renderFnWithContext._d) {
                setBlockTracking(-1);
            }
            const prevInstance = setCurrentRenderingInstance(ctx);
            const res = fn(...args);
            setCurrentRenderingInstance(prevInstance);
            if (renderFnWithContext._d) {
                setBlockTracking(1);
            }
            if (__VUE_PROD_DEVTOOLS__) {
                devtoolsComponentUpdated(ctx);
            }
            return res;
        };
        // mark normalized to avoid duplicated wrapping
        renderFnWithContext._n = true;
        // mark this as compiled by default
        // this is used in vnode.ts -> normalizeChildren() to set the slot
        // rendering flag.
        renderFnWithContext._c = true;
        // disable block tracking by default
        renderFnWithContext._d = true;
        return renderFnWithContext;
    }
    function markAttrsAccessed() {
    }
    function renderComponentRoot(instance) {
        const { type: Component, vnode, proxy, withProxy, props, propsOptions: [propsOptions], slots, attrs, emit, render, renderCache, data, setupState, ctx, inheritAttrs } = instance;
        let result;
        let fallthroughAttrs;
        const prev = setCurrentRenderingInstance(instance);
        try {
            if (vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) {
                // withProxy is a proxy with a different `has` trap only for
                // runtime-compiled render functions using `with` block.
                const proxyToUse = withProxy || proxy;
                result = normalizeVNode(render.call(proxyToUse, proxyToUse, renderCache, props, setupState, data, ctx));
                fallthroughAttrs = attrs;
            }
            else {
                // functional
                const render = Component;
                // in dev, mark attrs accessed if optional props (attrs === props)
                if (("production" !== 'production') && attrs === props) ;
                result = normalizeVNode(render.length > 1
                    ? render(props, ("production" !== 'production')
                        ? {
                            get attrs() {
                                markAttrsAccessed();
                                return attrs;
                            },
                            slots,
                            emit
                        }
                        : { attrs, slots, emit })
                    : render(props, null /* we know it doesn't need it */));
                fallthroughAttrs = Component.props
                    ? attrs
                    : getFunctionalFallthrough(attrs);
            }
        }
        catch (err) {
            blockStack.length = 0;
            handleError(err, instance, 1 /* RENDER_FUNCTION */);
            result = createVNode(Comment);
        }
        // attr merging
        // in dev mode, comments are preserved, and it's possible for a template
        // to have comments along side the root element which makes it a fragment
        let root = result;
        if (fallthroughAttrs && inheritAttrs !== false) {
            const keys = Object.keys(fallthroughAttrs);
            const { shapeFlag } = root;
            if (keys.length) {
                if (shapeFlag & (1 /* ELEMENT */ | 6 /* COMPONENT */)) {
                    if (propsOptions && keys.some(isModelListener)) {
                        // If a v-model listener (onUpdate:xxx) has a corresponding declared
                        // prop, it indicates this component expects to handle v-model and
                        // it should not fallthrough.
                        // related: #1543, #1643, #1989
                        fallthroughAttrs = filterModelListeners(fallthroughAttrs, propsOptions);
                    }
                    root = cloneVNode(root, fallthroughAttrs);
                }
            }
        }
        // inherit directives
        if (vnode.dirs) {
            root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
        }
        // inherit transition data
        if (vnode.transition) {
            root.transition = vnode.transition;
        }
        {
            result = root;
        }
        setCurrentRenderingInstance(prev);
        return result;
    }
    const getFunctionalFallthrough = (attrs) => {
        let res;
        for (const key in attrs) {
            if (key === 'class' || key === 'style' || isOn(key)) {
                (res || (res = {}))[key] = attrs[key];
            }
        }
        return res;
    };
    const filterModelListeners = (attrs, props) => {
        const res = {};
        for (const key in attrs) {
            if (!isModelListener(key) || !(key.slice(9) in props)) {
                res[key] = attrs[key];
            }
        }
        return res;
    };
    function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
        const { props: prevProps, children: prevChildren, component } = prevVNode;
        const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
        const emits = component.emitsOptions;
        // force child update for runtime directive or transition on component vnode.
        if (nextVNode.dirs || nextVNode.transition) {
            return true;
        }
        if (optimized && patchFlag >= 0) {
            if (patchFlag & 1024 /* DYNAMIC_SLOTS */) {
                // slot content that references values that might have changed,
                // e.g. in a v-for
                return true;
            }
            if (patchFlag & 16 /* FULL_PROPS */) {
                if (!prevProps) {
                    return !!nextProps;
                }
                // presence of this flag indicates props are always non-null
                return hasPropsChanged(prevProps, nextProps, emits);
            }
            else if (patchFlag & 8 /* PROPS */) {
                const dynamicProps = nextVNode.dynamicProps;
                for (let i = 0; i < dynamicProps.length; i++) {
                    const key = dynamicProps[i];
                    if (nextProps[key] !== prevProps[key] &&
                        !isEmitListener(emits, key)) {
                        return true;
                    }
                }
            }
        }
        else {
            // this path is only taken by manually written render functions
            // so presence of any children leads to a forced update
            if (prevChildren || nextChildren) {
                if (!nextChildren || !nextChildren.$stable) {
                    return true;
                }
            }
            if (prevProps === nextProps) {
                return false;
            }
            if (!prevProps) {
                return !!nextProps;
            }
            if (!nextProps) {
                return true;
            }
            return hasPropsChanged(prevProps, nextProps, emits);
        }
        return false;
    }
    function hasPropsChanged(prevProps, nextProps, emitsOptions) {
        const nextKeys = Object.keys(nextProps);
        if (nextKeys.length !== Object.keys(prevProps).length) {
            return true;
        }
        for (let i = 0; i < nextKeys.length; i++) {
            const key = nextKeys[i];
            if (nextProps[key] !== prevProps[key] &&
                !isEmitListener(emitsOptions, key)) {
                return true;
            }
        }
        return false;
    }
    function updateHOCHostEl({ vnode, parent }, el // HostNode
    ) {
        while (parent && parent.subTree === vnode) {
            (vnode = parent.vnode).el = el;
            parent = parent.parent;
        }
    }

    const isSuspense = (type) => type.__isSuspense;
    function queueEffectWithSuspense(fn, suspense) {
        if (suspense && suspense.pendingBranch) {
            if (isArray(fn)) {
                suspense.effects.push(...fn);
            }
            else {
                suspense.effects.push(fn);
            }
        }
        else {
            queuePostFlushCb(fn);
        }
    }

    function provide(key, value) {
        if (!currentInstance) ;
        else {
            let provides = currentInstance.provides;
            // by default an instance inherits its parent's provides object
            // but when it needs to provide values of its own, it creates its
            // own provides object using parent provides object as prototype.
            // this way in `inject` we can simply look up injections from direct
            // parent and let the prototype chain do the work.
            const parentProvides = currentInstance.parent && currentInstance.parent.provides;
            if (parentProvides === provides) {
                provides = currentInstance.provides = Object.create(parentProvides);
            }
            // TS doesn't allow symbol as index type
            provides[key] = value;
        }
    }
    function inject(key, defaultValue, treatDefaultAsFactory = false) {
        // fallback to `currentRenderingInstance` so that this can be called in
        // a functional component
        const instance = currentInstance || currentRenderingInstance;
        if (instance) {
            // #2400
            // to support `app.use` plugins,
            // fallback to appContext's `provides` if the instance is at root
            const provides = instance.parent == null
                ? instance.vnode.appContext && instance.vnode.appContext.provides
                : instance.parent.provides;
            if (provides && key in provides) {
                // TS doesn't allow symbol as index type
                return provides[key];
            }
            else if (arguments.length > 1) {
                return treatDefaultAsFactory && isFunction(defaultValue)
                    ? defaultValue.call(instance.proxy)
                    : defaultValue;
            }
            else ;
        }
    }

    // Simple effect.
    function watchEffect(effect, options) {
        return doWatch(effect, null, options);
    }
    // initial value for watchers to trigger on undefined initial values
    const INITIAL_WATCHER_VALUE = {};
    // implementation
    function watch(source, cb, options) {
        return doWatch(source, cb, options);
    }
    function doWatch(source, cb, { immediate, deep, flush, onTrack, onTrigger } = EMPTY_OBJ) {
        const instance = currentInstance;
        let getter;
        let forceTrigger = false;
        let isMultiSource = false;
        if (isRef(source)) {
            getter = () => source.value;
            forceTrigger = isShallow(source);
        }
        else if (isReactive(source)) {
            getter = () => source;
            deep = true;
        }
        else if (isArray(source)) {
            isMultiSource = true;
            forceTrigger = source.some(isReactive);
            getter = () => source.map(s => {
                if (isRef(s)) {
                    return s.value;
                }
                else if (isReactive(s)) {
                    return traverse(s);
                }
                else if (isFunction(s)) {
                    return callWithErrorHandling(s, instance, 2 /* WATCH_GETTER */);
                }
                else ;
            });
        }
        else if (isFunction(source)) {
            if (cb) {
                // getter with cb
                getter = () => callWithErrorHandling(source, instance, 2 /* WATCH_GETTER */);
            }
            else {
                // no cb -> simple effect
                getter = () => {
                    if (instance && instance.isUnmounted) {
                        return;
                    }
                    if (cleanup) {
                        cleanup();
                    }
                    return callWithAsyncErrorHandling(source, instance, 3 /* WATCH_CALLBACK */, [onCleanup]);
                };
            }
        }
        else {
            getter = NOOP;
        }
        if (cb && deep) {
            const baseGetter = getter;
            getter = () => traverse(baseGetter());
        }
        let cleanup;
        let onCleanup = (fn) => {
            cleanup = effect.onStop = () => {
                callWithErrorHandling(fn, instance, 4 /* WATCH_CLEANUP */);
            };
        };
        // in SSR there is no need to setup an actual effect, and it should be noop
        // unless it's eager
        if (isInSSRComponentSetup) {
            // we will also not call the invalidate callback (+ runner is not set up)
            onCleanup = NOOP;
            if (!cb) {
                getter();
            }
            else if (immediate) {
                callWithAsyncErrorHandling(cb, instance, 3 /* WATCH_CALLBACK */, [
                    getter(),
                    isMultiSource ? [] : undefined,
                    onCleanup
                ]);
            }
            return NOOP;
        }
        let oldValue = isMultiSource ? [] : INITIAL_WATCHER_VALUE;
        const job = () => {
            if (!effect.active) {
                return;
            }
            if (cb) {
                // watch(source, cb)
                const newValue = effect.run();
                if (deep ||
                    forceTrigger ||
                    (isMultiSource
                        ? newValue.some((v, i) => hasChanged(v, oldValue[i]))
                        : hasChanged(newValue, oldValue)) ||
                    (false  )) {
                    // cleanup before running cb again
                    if (cleanup) {
                        cleanup();
                    }
                    callWithAsyncErrorHandling(cb, instance, 3 /* WATCH_CALLBACK */, [
                        newValue,
                        // pass undefined as the old value when it's changed for the first time
                        oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
                        onCleanup
                    ]);
                    oldValue = newValue;
                }
            }
            else {
                // watchEffect
                effect.run();
            }
        };
        // important: mark the job as a watcher callback so that scheduler knows
        // it is allowed to self-trigger (#1727)
        job.allowRecurse = !!cb;
        let scheduler;
        if (flush === 'sync') {
            scheduler = job; // the scheduler function gets called directly
        }
        else if (flush === 'post') {
            scheduler = () => queuePostRenderEffect(job, instance && instance.suspense);
        }
        else {
            // default: 'pre'
            scheduler = () => {
                if (!instance || instance.isMounted) {
                    queuePreFlushCb(job);
                }
                else {
                    // with 'pre' option, the first call must happen before
                    // the component is mounted so it is called synchronously.
                    job();
                }
            };
        }
        const effect = new ReactiveEffect(getter, scheduler);
        // initial run
        if (cb) {
            if (immediate) {
                job();
            }
            else {
                oldValue = effect.run();
            }
        }
        else if (flush === 'post') {
            queuePostRenderEffect(effect.run.bind(effect), instance && instance.suspense);
        }
        else {
            effect.run();
        }
        return () => {
            effect.stop();
            if (instance && instance.scope) {
                remove(instance.scope.effects, effect);
            }
        };
    }
    // this.$watch
    function instanceWatch(source, value, options) {
        const publicThis = this.proxy;
        const getter = isString(source)
            ? source.includes('.')
                ? createPathGetter(publicThis, source)
                : () => publicThis[source]
            : source.bind(publicThis, publicThis);
        let cb;
        if (isFunction(value)) {
            cb = value;
        }
        else {
            cb = value.handler;
            options = value;
        }
        const cur = currentInstance;
        setCurrentInstance(this);
        const res = doWatch(getter, cb.bind(publicThis), options);
        if (cur) {
            setCurrentInstance(cur);
        }
        else {
            unsetCurrentInstance();
        }
        return res;
    }
    function createPathGetter(ctx, path) {
        const segments = path.split('.');
        return () => {
            let cur = ctx;
            for (let i = 0; i < segments.length && cur; i++) {
                cur = cur[segments[i]];
            }
            return cur;
        };
    }
    function traverse(value, seen) {
        if (!isObject(value) || value["__v_skip" /* SKIP */]) {
            return value;
        }
        seen = seen || new Set();
        if (seen.has(value)) {
            return value;
        }
        seen.add(value);
        if (isRef(value)) {
            traverse(value.value, seen);
        }
        else if (isArray(value)) {
            for (let i = 0; i < value.length; i++) {
                traverse(value[i], seen);
            }
        }
        else if (isSet(value) || isMap(value)) {
            value.forEach((v) => {
                traverse(v, seen);
            });
        }
        else if (isPlainObject(value)) {
            for (const key in value) {
                traverse(value[key], seen);
            }
        }
        return value;
    }

    // implementation, close to no-op
    function defineComponent(options) {
        return isFunction(options) ? { setup: options, name: options.name } : options;
    }

    const isAsyncWrapper = (i) => !!i.type.__asyncLoader;

    const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
    function onActivated(hook, target) {
        registerKeepAliveHook(hook, "a" /* ACTIVATED */, target);
    }
    function onDeactivated(hook, target) {
        registerKeepAliveHook(hook, "da" /* DEACTIVATED */, target);
    }
    function registerKeepAliveHook(hook, type, target = currentInstance) {
        // cache the deactivate branch check wrapper for injected hooks so the same
        // hook can be properly deduped by the scheduler. "__wdc" stands for "with
        // deactivation check".
        const wrappedHook = hook.__wdc ||
            (hook.__wdc = () => {
                // only fire the hook if the target instance is NOT in a deactivated branch.
                let current = target;
                while (current) {
                    if (current.isDeactivated) {
                        return;
                    }
                    current = current.parent;
                }
                return hook();
            });
        injectHook(type, wrappedHook, target);
        // In addition to registering it on the target instance, we walk up the parent
        // chain and register it on all ancestor instances that are keep-alive roots.
        // This avoids the need to walk the entire component tree when invoking these
        // hooks, and more importantly, avoids the need to track child components in
        // arrays.
        if (target) {
            let current = target.parent;
            while (current && current.parent) {
                if (isKeepAlive(current.parent.vnode)) {
                    injectToKeepAliveRoot(wrappedHook, type, target, current);
                }
                current = current.parent;
            }
        }
    }
    function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
        // injectHook wraps the original for error handling, so make sure to remove
        // the wrapped version.
        const injected = injectHook(type, hook, keepAliveRoot, true /* prepend */);
        onUnmounted(() => {
            remove(keepAliveRoot[type], injected);
        }, target);
    }

    function injectHook(type, hook, target = currentInstance, prepend = false) {
        if (target) {
            const hooks = target[type] || (target[type] = []);
            // cache the error handling wrapper for injected hooks so the same hook
            // can be properly deduped by the scheduler. "__weh" stands for "with error
            // handling".
            const wrappedHook = hook.__weh ||
                (hook.__weh = (...args) => {
                    if (target.isUnmounted) {
                        return;
                    }
                    // disable tracking inside all lifecycle hooks
                    // since they can potentially be called inside effects.
                    pauseTracking();
                    // Set currentInstance during hook invocation.
                    // This assumes the hook does not synchronously trigger other hooks, which
                    // can only be false when the user does something really funky.
                    setCurrentInstance(target);
                    const res = callWithAsyncErrorHandling(hook, target, type, args);
                    unsetCurrentInstance();
                    resetTracking();
                    return res;
                });
            if (prepend) {
                hooks.unshift(wrappedHook);
            }
            else {
                hooks.push(wrappedHook);
            }
            return wrappedHook;
        }
    }
    const createHook = (lifecycle) => (hook, target = currentInstance) => 
    // post-create lifecycle registrations are noops during SSR (except for serverPrefetch)
    (!isInSSRComponentSetup || lifecycle === "sp" /* SERVER_PREFETCH */) &&
        injectHook(lifecycle, hook, target);
    const onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
    const onMounted = createHook("m" /* MOUNTED */);
    const onBeforeUpdate = createHook("bu" /* BEFORE_UPDATE */);
    const onUpdated = createHook("u" /* UPDATED */);
    const onBeforeUnmount = createHook("bum" /* BEFORE_UNMOUNT */);
    const onUnmounted = createHook("um" /* UNMOUNTED */);
    const onServerPrefetch = createHook("sp" /* SERVER_PREFETCH */);
    const onRenderTriggered = createHook("rtg" /* RENDER_TRIGGERED */);
    const onRenderTracked = createHook("rtc" /* RENDER_TRACKED */);
    function onErrorCaptured(hook, target = currentInstance) {
        injectHook("ec" /* ERROR_CAPTURED */, hook, target);
    }
    let shouldCacheAccess = true;
    function applyOptions(instance) {
        const options = resolveMergedOptions(instance);
        const publicThis = instance.proxy;
        const ctx = instance.ctx;
        // do not cache property access on public proxy during state initialization
        shouldCacheAccess = false;
        // call beforeCreate first before accessing other options since
        // the hook may mutate resolved options (#2791)
        if (options.beforeCreate) {
            callHook(options.beforeCreate, instance, "bc" /* BEFORE_CREATE */);
        }
        const { 
        // state
        data: dataOptions, computed: computedOptions, methods, watch: watchOptions, provide: provideOptions, inject: injectOptions, 
        // lifecycle
        created, beforeMount, mounted, beforeUpdate, updated, activated, deactivated, beforeDestroy, beforeUnmount, destroyed, unmounted, render, renderTracked, renderTriggered, errorCaptured, serverPrefetch, 
        // public API
        expose, inheritAttrs, 
        // assets
        components, directives, filters } = options;
        const checkDuplicateProperties = null;
        // options initialization order (to be consistent with Vue 2):
        // - props (already done outside of this function)
        // - inject
        // - methods
        // - data (deferred since it relies on `this` access)
        // - computed
        // - watch (deferred since it relies on `this` access)
        if (injectOptions) {
            resolveInjections(injectOptions, ctx, checkDuplicateProperties, instance.appContext.config.unwrapInjectedRef);
        }
        if (methods) {
            for (const key in methods) {
                const methodHandler = methods[key];
                if (isFunction(methodHandler)) {
                    // In dev mode, we use the `createRenderContext` function to define
                    // methods to the proxy target, and those are read-only but
                    // reconfigurable, so it needs to be redefined here
                    {
                        ctx[key] = methodHandler.bind(publicThis);
                    }
                }
            }
        }
        if (dataOptions) {
            const data = dataOptions.call(publicThis, publicThis);
            if (!isObject(data)) ;
            else {
                instance.data = reactive(data);
            }
        }
        // state initialization complete at this point - start caching access
        shouldCacheAccess = true;
        if (computedOptions) {
            for (const key in computedOptions) {
                const opt = computedOptions[key];
                const get = isFunction(opt)
                    ? opt.bind(publicThis, publicThis)
                    : isFunction(opt.get)
                        ? opt.get.bind(publicThis, publicThis)
                        : NOOP;
                const set = !isFunction(opt) && isFunction(opt.set)
                    ? opt.set.bind(publicThis)
                    : NOOP;
                const c = computed({
                    get,
                    set
                });
                Object.defineProperty(ctx, key, {
                    enumerable: true,
                    configurable: true,
                    get: () => c.value,
                    set: v => (c.value = v)
                });
            }
        }
        if (watchOptions) {
            for (const key in watchOptions) {
                createWatcher(watchOptions[key], ctx, publicThis, key);
            }
        }
        if (provideOptions) {
            const provides = isFunction(provideOptions)
                ? provideOptions.call(publicThis)
                : provideOptions;
            Reflect.ownKeys(provides).forEach(key => {
                provide(key, provides[key]);
            });
        }
        if (created) {
            callHook(created, instance, "c" /* CREATED */);
        }
        function registerLifecycleHook(register, hook) {
            if (isArray(hook)) {
                hook.forEach(_hook => register(_hook.bind(publicThis)));
            }
            else if (hook) {
                register(hook.bind(publicThis));
            }
        }
        registerLifecycleHook(onBeforeMount, beforeMount);
        registerLifecycleHook(onMounted, mounted);
        registerLifecycleHook(onBeforeUpdate, beforeUpdate);
        registerLifecycleHook(onUpdated, updated);
        registerLifecycleHook(onActivated, activated);
        registerLifecycleHook(onDeactivated, deactivated);
        registerLifecycleHook(onErrorCaptured, errorCaptured);
        registerLifecycleHook(onRenderTracked, renderTracked);
        registerLifecycleHook(onRenderTriggered, renderTriggered);
        registerLifecycleHook(onBeforeUnmount, beforeUnmount);
        registerLifecycleHook(onUnmounted, unmounted);
        registerLifecycleHook(onServerPrefetch, serverPrefetch);
        if (isArray(expose)) {
            if (expose.length) {
                const exposed = instance.exposed || (instance.exposed = {});
                expose.forEach(key => {
                    Object.defineProperty(exposed, key, {
                        get: () => publicThis[key],
                        set: val => (publicThis[key] = val)
                    });
                });
            }
            else if (!instance.exposed) {
                instance.exposed = {};
            }
        }
        // options that are handled when creating the instance but also need to be
        // applied from mixins
        if (render && instance.render === NOOP) {
            instance.render = render;
        }
        if (inheritAttrs != null) {
            instance.inheritAttrs = inheritAttrs;
        }
        // asset options.
        if (components)
            instance.components = components;
        if (directives)
            instance.directives = directives;
    }
    function resolveInjections(injectOptions, ctx, checkDuplicateProperties = NOOP, unwrapRef = false) {
        if (isArray(injectOptions)) {
            injectOptions = normalizeInject(injectOptions);
        }
        for (const key in injectOptions) {
            const opt = injectOptions[key];
            let injected;
            if (isObject(opt)) {
                if ('default' in opt) {
                    injected = inject(opt.from || key, opt.default, true /* treat default function as factory */);
                }
                else {
                    injected = inject(opt.from || key);
                }
            }
            else {
                injected = inject(opt);
            }
            if (isRef(injected)) {
                // TODO remove the check in 3.3
                if (unwrapRef) {
                    Object.defineProperty(ctx, key, {
                        enumerable: true,
                        configurable: true,
                        get: () => injected.value,
                        set: v => (injected.value = v)
                    });
                }
                else {
                    ctx[key] = injected;
                }
            }
            else {
                ctx[key] = injected;
            }
        }
    }
    function callHook(hook, instance, type) {
        callWithAsyncErrorHandling(isArray(hook)
            ? hook.map(h => h.bind(instance.proxy))
            : hook.bind(instance.proxy), instance, type);
    }
    function createWatcher(raw, ctx, publicThis, key) {
        const getter = key.includes('.')
            ? createPathGetter(publicThis, key)
            : () => publicThis[key];
        if (isString(raw)) {
            const handler = ctx[raw];
            if (isFunction(handler)) {
                watch(getter, handler);
            }
        }
        else if (isFunction(raw)) {
            watch(getter, raw.bind(publicThis));
        }
        else if (isObject(raw)) {
            if (isArray(raw)) {
                raw.forEach(r => createWatcher(r, ctx, publicThis, key));
            }
            else {
                const handler = isFunction(raw.handler)
                    ? raw.handler.bind(publicThis)
                    : ctx[raw.handler];
                if (isFunction(handler)) {
                    watch(getter, handler, raw);
                }
            }
        }
        else ;
    }
    /**
     * Resolve merged options and cache it on the component.
     * This is done only once per-component since the merging does not involve
     * instances.
     */
    function resolveMergedOptions(instance) {
        const base = instance.type;
        const { mixins, extends: extendsOptions } = base;
        const { mixins: globalMixins, optionsCache: cache, config: { optionMergeStrategies } } = instance.appContext;
        const cached = cache.get(base);
        let resolved;
        if (cached) {
            resolved = cached;
        }
        else if (!globalMixins.length && !mixins && !extendsOptions) {
            {
                resolved = base;
            }
        }
        else {
            resolved = {};
            if (globalMixins.length) {
                globalMixins.forEach(m => mergeOptions$1(resolved, m, optionMergeStrategies, true));
            }
            mergeOptions$1(resolved, base, optionMergeStrategies);
        }
        cache.set(base, resolved);
        return resolved;
    }
    function mergeOptions$1(to, from, strats, asMixin = false) {
        const { mixins, extends: extendsOptions } = from;
        if (extendsOptions) {
            mergeOptions$1(to, extendsOptions, strats, true);
        }
        if (mixins) {
            mixins.forEach((m) => mergeOptions$1(to, m, strats, true));
        }
        for (const key in from) {
            if (asMixin && key === 'expose') ;
            else {
                const strat = internalOptionMergeStrats[key] || (strats && strats[key]);
                to[key] = strat ? strat(to[key], from[key]) : from[key];
            }
        }
        return to;
    }
    const internalOptionMergeStrats = {
        data: mergeDataFn,
        props: mergeObjectOptions,
        emits: mergeObjectOptions,
        // objects
        methods: mergeObjectOptions,
        computed: mergeObjectOptions,
        // lifecycle
        beforeCreate: mergeAsArray,
        created: mergeAsArray,
        beforeMount: mergeAsArray,
        mounted: mergeAsArray,
        beforeUpdate: mergeAsArray,
        updated: mergeAsArray,
        beforeDestroy: mergeAsArray,
        beforeUnmount: mergeAsArray,
        destroyed: mergeAsArray,
        unmounted: mergeAsArray,
        activated: mergeAsArray,
        deactivated: mergeAsArray,
        errorCaptured: mergeAsArray,
        serverPrefetch: mergeAsArray,
        // assets
        components: mergeObjectOptions,
        directives: mergeObjectOptions,
        // watch
        watch: mergeWatchOptions,
        // provide / inject
        provide: mergeDataFn,
        inject: mergeInject
    };
    function mergeDataFn(to, from) {
        if (!from) {
            return to;
        }
        if (!to) {
            return from;
        }
        return function mergedDataFn() {
            return (extend)(isFunction(to) ? to.call(this, this) : to, isFunction(from) ? from.call(this, this) : from);
        };
    }
    function mergeInject(to, from) {
        return mergeObjectOptions(normalizeInject(to), normalizeInject(from));
    }
    function normalizeInject(raw) {
        if (isArray(raw)) {
            const res = {};
            for (let i = 0; i < raw.length; i++) {
                res[raw[i]] = raw[i];
            }
            return res;
        }
        return raw;
    }
    function mergeAsArray(to, from) {
        return to ? [...new Set([].concat(to, from))] : from;
    }
    function mergeObjectOptions(to, from) {
        return to ? extend(extend(Object.create(null), to), from) : from;
    }
    function mergeWatchOptions(to, from) {
        if (!to)
            return from;
        if (!from)
            return to;
        const merged = extend(Object.create(null), to);
        for (const key in from) {
            merged[key] = mergeAsArray(to[key], from[key]);
        }
        return merged;
    }

    function initProps(instance, rawProps, isStateful, // result of bitwise flag comparison
    isSSR = false) {
        const props = {};
        const attrs = {};
        def(attrs, InternalObjectKey, 1);
        instance.propsDefaults = Object.create(null);
        setFullProps(instance, rawProps, props, attrs);
        // ensure all declared prop keys are present
        for (const key in instance.propsOptions[0]) {
            if (!(key in props)) {
                props[key] = undefined;
            }
        }
        if (isStateful) {
            // stateful
            instance.props = isSSR ? props : shallowReactive(props);
        }
        else {
            if (!instance.type.props) {
                // functional w/ optional props, props === attrs
                instance.props = attrs;
            }
            else {
                // functional w/ declared props
                instance.props = props;
            }
        }
        instance.attrs = attrs;
    }
    function updateProps(instance, rawProps, rawPrevProps, optimized) {
        const { props, attrs, vnode: { patchFlag } } = instance;
        const rawCurrentProps = toRaw(props);
        const [options] = instance.propsOptions;
        let hasAttrsChanged = false;
        if (
        // always force full diff in dev
        // - #1942 if hmr is enabled with sfc component
        // - vite#872 non-sfc component used by sfc component
        (optimized || patchFlag > 0) &&
            !(patchFlag & 16 /* FULL_PROPS */)) {
            if (patchFlag & 8 /* PROPS */) {
                // Compiler-generated props & no keys change, just set the updated
                // the props.
                const propsToUpdate = instance.vnode.dynamicProps;
                for (let i = 0; i < propsToUpdate.length; i++) {
                    let key = propsToUpdate[i];
                    // PROPS flag guarantees rawProps to be non-null
                    const value = rawProps[key];
                    if (options) {
                        // attr / props separation was done on init and will be consistent
                        // in this code path, so just check if attrs have it.
                        if (hasOwn(attrs, key)) {
                            if (value !== attrs[key]) {
                                attrs[key] = value;
                                hasAttrsChanged = true;
                            }
                        }
                        else {
                            const camelizedKey = camelize(key);
                            props[camelizedKey] = resolvePropValue(options, rawCurrentProps, camelizedKey, value, instance, false /* isAbsent */);
                        }
                    }
                    else {
                        if (value !== attrs[key]) {
                            attrs[key] = value;
                            hasAttrsChanged = true;
                        }
                    }
                }
            }
        }
        else {
            // full props update.
            if (setFullProps(instance, rawProps, props, attrs)) {
                hasAttrsChanged = true;
            }
            // in case of dynamic props, check if we need to delete keys from
            // the props object
            let kebabKey;
            for (const key in rawCurrentProps) {
                if (!rawProps ||
                    // for camelCase
                    (!hasOwn(rawProps, key) &&
                        // it's possible the original props was passed in as kebab-case
                        // and converted to camelCase (#955)
                        ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey)))) {
                    if (options) {
                        if (rawPrevProps &&
                            // for camelCase
                            (rawPrevProps[key] !== undefined ||
                                // for kebab-case
                                rawPrevProps[kebabKey] !== undefined)) {
                            props[key] = resolvePropValue(options, rawCurrentProps, key, undefined, instance, true /* isAbsent */);
                        }
                    }
                    else {
                        delete props[key];
                    }
                }
            }
            // in the case of functional component w/o props declaration, props and
            // attrs point to the same object so it should already have been updated.
            if (attrs !== rawCurrentProps) {
                for (const key in attrs) {
                    if (!rawProps ||
                        (!hasOwn(rawProps, key) &&
                            (!false ))) {
                        delete attrs[key];
                        hasAttrsChanged = true;
                    }
                }
            }
        }
        // trigger updates for $attrs in case it's used in component slots
        if (hasAttrsChanged) {
            trigger(instance, "set" /* SET */, '$attrs');
        }
    }
    function setFullProps(instance, rawProps, props, attrs) {
        const [options, needCastKeys] = instance.propsOptions;
        let hasAttrsChanged = false;
        let rawCastValues;
        if (rawProps) {
            for (let key in rawProps) {
                // key, ref are reserved and never passed down
                if (isReservedProp(key)) {
                    continue;
                }
                const value = rawProps[key];
                // prop option names are camelized during normalization, so to support
                // kebab -> camel conversion here we need to camelize the key.
                let camelKey;
                if (options && hasOwn(options, (camelKey = camelize(key)))) {
                    if (!needCastKeys || !needCastKeys.includes(camelKey)) {
                        props[camelKey] = value;
                    }
                    else {
                        (rawCastValues || (rawCastValues = {}))[camelKey] = value;
                    }
                }
                else if (!isEmitListener(instance.emitsOptions, key)) {
                    if (!(key in attrs) || value !== attrs[key]) {
                        attrs[key] = value;
                        hasAttrsChanged = true;
                    }
                }
            }
        }
        if (needCastKeys) {
            const rawCurrentProps = toRaw(props);
            const castValues = rawCastValues || EMPTY_OBJ;
            for (let i = 0; i < needCastKeys.length; i++) {
                const key = needCastKeys[i];
                props[key] = resolvePropValue(options, rawCurrentProps, key, castValues[key], instance, !hasOwn(castValues, key));
            }
        }
        return hasAttrsChanged;
    }
    function resolvePropValue(options, props, key, value, instance, isAbsent) {
        const opt = options[key];
        if (opt != null) {
            const hasDefault = hasOwn(opt, 'default');
            // default values
            if (hasDefault && value === undefined) {
                const defaultValue = opt.default;
                if (opt.type !== Function && isFunction(defaultValue)) {
                    const { propsDefaults } = instance;
                    if (key in propsDefaults) {
                        value = propsDefaults[key];
                    }
                    else {
                        setCurrentInstance(instance);
                        value = propsDefaults[key] = defaultValue.call(null, props);
                        unsetCurrentInstance();
                    }
                }
                else {
                    value = defaultValue;
                }
            }
            // boolean casting
            if (opt[0 /* shouldCast */]) {
                if (isAbsent && !hasDefault) {
                    value = false;
                }
                else if (opt[1 /* shouldCastTrue */] &&
                    (value === '' || value === hyphenate(key))) {
                    value = true;
                }
            }
        }
        return value;
    }
    function normalizePropsOptions(comp, appContext, asMixin = false) {
        const cache = appContext.propsCache;
        const cached = cache.get(comp);
        if (cached) {
            return cached;
        }
        const raw = comp.props;
        const normalized = {};
        const needCastKeys = [];
        // apply mixin/extends props
        let hasExtends = false;
        if (__VUE_OPTIONS_API__ && !isFunction(comp)) {
            const extendProps = (raw) => {
                hasExtends = true;
                const [props, keys] = normalizePropsOptions(raw, appContext, true);
                extend(normalized, props);
                if (keys)
                    needCastKeys.push(...keys);
            };
            if (!asMixin && appContext.mixins.length) {
                appContext.mixins.forEach(extendProps);
            }
            if (comp.extends) {
                extendProps(comp.extends);
            }
            if (comp.mixins) {
                comp.mixins.forEach(extendProps);
            }
        }
        if (!raw && !hasExtends) {
            cache.set(comp, EMPTY_ARR);
            return EMPTY_ARR;
        }
        if (isArray(raw)) {
            for (let i = 0; i < raw.length; i++) {
                const normalizedKey = camelize(raw[i]);
                if (validatePropName(normalizedKey)) {
                    normalized[normalizedKey] = EMPTY_OBJ;
                }
            }
        }
        else if (raw) {
            for (const key in raw) {
                const normalizedKey = camelize(key);
                if (validatePropName(normalizedKey)) {
                    const opt = raw[key];
                    const prop = (normalized[normalizedKey] =
                        isArray(opt) || isFunction(opt) ? { type: opt } : opt);
                    if (prop) {
                        const booleanIndex = getTypeIndex(Boolean, prop.type);
                        const stringIndex = getTypeIndex(String, prop.type);
                        prop[0 /* shouldCast */] = booleanIndex > -1;
                        prop[1 /* shouldCastTrue */] =
                            stringIndex < 0 || booleanIndex < stringIndex;
                        // if the prop needs boolean casting or default value
                        if (booleanIndex > -1 || hasOwn(prop, 'default')) {
                            needCastKeys.push(normalizedKey);
                        }
                    }
                }
            }
        }
        const res = [normalized, needCastKeys];
        cache.set(comp, res);
        return res;
    }
    function validatePropName(key) {
        if (key[0] !== '$') {
            return true;
        }
        return false;
    }
    // use function string name to check type constructors
    // so that it works across vms / iframes.
    function getType(ctor) {
        const match = ctor && ctor.toString().match(/^\s*function (\w+)/);
        return match ? match[1] : ctor === null ? 'null' : '';
    }
    function isSameType(a, b) {
        return getType(a) === getType(b);
    }
    function getTypeIndex(type, expectedTypes) {
        if (isArray(expectedTypes)) {
            return expectedTypes.findIndex(t => isSameType(t, type));
        }
        else if (isFunction(expectedTypes)) {
            return isSameType(expectedTypes, type) ? 0 : -1;
        }
        return -1;
    }

    const isInternalKey = (key) => key[0] === '_' || key === '$stable';
    const normalizeSlotValue = (value) => isArray(value)
        ? value.map(normalizeVNode)
        : [normalizeVNode(value)];
    const normalizeSlot$1 = (key, rawSlot, ctx) => {
        const normalized = withCtx((...args) => {
            return normalizeSlotValue(rawSlot(...args));
        }, ctx);
        normalized._c = false;
        return normalized;
    };
    const normalizeObjectSlots = (rawSlots, slots, instance) => {
        const ctx = rawSlots._ctx;
        for (const key in rawSlots) {
            if (isInternalKey(key))
                continue;
            const value = rawSlots[key];
            if (isFunction(value)) {
                slots[key] = normalizeSlot$1(key, value, ctx);
            }
            else if (value != null) {
                const normalized = normalizeSlotValue(value);
                slots[key] = () => normalized;
            }
        }
    };
    const normalizeVNodeSlots = (instance, children) => {
        const normalized = normalizeSlotValue(children);
        instance.slots.default = () => normalized;
    };
    const initSlots = (instance, children) => {
        if (instance.vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
            const type = children._;
            if (type) {
                // users can get the shallow readonly version of the slots object through `this.$slots`,
                // we should avoid the proxy object polluting the slots of the internal instance
                instance.slots = toRaw(children);
                // make compiler marker non-enumerable
                def(children, '_', type);
            }
            else {
                normalizeObjectSlots(children, (instance.slots = {}));
            }
        }
        else {
            instance.slots = {};
            if (children) {
                normalizeVNodeSlots(instance, children);
            }
        }
        def(instance.slots, InternalObjectKey, 1);
    };
    const updateSlots = (instance, children, optimized) => {
        const { vnode, slots } = instance;
        let needDeletionCheck = true;
        let deletionComparisonTarget = EMPTY_OBJ;
        if (vnode.shapeFlag & 32 /* SLOTS_CHILDREN */) {
            const type = children._;
            if (type) {
                // compiled slots.
                if (optimized && type === 1 /* STABLE */) {
                    // compiled AND stable.
                    // no need to update, and skip stale slots removal.
                    needDeletionCheck = false;
                }
                else {
                    // compiled but dynamic (v-if/v-for on slots) - update slots, but skip
                    // normalization.
                    extend(slots, children);
                    // #2893
                    // when rendering the optimized slots by manually written render function,
                    // we need to delete the `slots._` flag if necessary to make subsequent updates reliable,
                    // i.e. let the `renderSlot` create the bailed Fragment
                    if (!optimized && type === 1 /* STABLE */) {
                        delete slots._;
                    }
                }
            }
            else {
                needDeletionCheck = !children.$stable;
                normalizeObjectSlots(children, slots);
            }
            deletionComparisonTarget = children;
        }
        else if (children) {
            // non slot object children (direct value) passed to a component
            normalizeVNodeSlots(instance, children);
            deletionComparisonTarget = { default: 1 };
        }
        // delete stale slots
        if (needDeletionCheck) {
            for (const key in slots) {
                if (!isInternalKey(key) && !(key in deletionComparisonTarget)) {
                    delete slots[key];
                }
            }
        }
    };
    function invokeDirectiveHook(vnode, prevVNode, instance, name) {
        const bindings = vnode.dirs;
        const oldBindings = prevVNode && prevVNode.dirs;
        for (let i = 0; i < bindings.length; i++) {
            const binding = bindings[i];
            if (oldBindings) {
                binding.oldValue = oldBindings[i].value;
            }
            let hook = binding.dir[name];
            if (hook) {
                // disable tracking inside all lifecycle hooks
                // since they can potentially be called inside effects.
                pauseTracking();
                callWithAsyncErrorHandling(hook, instance, 8 /* DIRECTIVE_HOOK */, [
                    vnode.el,
                    binding,
                    vnode,
                    prevVNode
                ]);
                resetTracking();
            }
        }
    }

    function createAppContext() {
        return {
            app: null,
            config: {
                isNativeTag: NO,
                performance: false,
                globalProperties: {},
                optionMergeStrategies: {},
                errorHandler: undefined,
                warnHandler: undefined,
                compilerOptions: {}
            },
            mixins: [],
            components: {},
            directives: {},
            provides: Object.create(null),
            optionsCache: new WeakMap(),
            propsCache: new WeakMap(),
            emitsCache: new WeakMap()
        };
    }
    let uid = 0;
    function createAppAPI(render, hydrate) {
        return function createApp(rootComponent, rootProps = null) {
            if (rootProps != null && !isObject(rootProps)) {
                rootProps = null;
            }
            const context = createAppContext();
            const installedPlugins = new Set();
            let isMounted = false;
            const app = (context.app = {
                _uid: uid++,
                _component: rootComponent,
                _props: rootProps,
                _container: null,
                _context: context,
                _instance: null,
                version,
                get config() {
                    return context.config;
                },
                set config(v) {
                },
                use(plugin, ...options) {
                    if (installedPlugins.has(plugin)) ;
                    else if (plugin && isFunction(plugin.install)) {
                        installedPlugins.add(plugin);
                        plugin.install(app, ...options);
                    }
                    else if (isFunction(plugin)) {
                        installedPlugins.add(plugin);
                        plugin(app, ...options);
                    }
                    else ;
                    return app;
                },
                mixin(mixin) {
                    if (__VUE_OPTIONS_API__) {
                        if (!context.mixins.includes(mixin)) {
                            context.mixins.push(mixin);
                        }
                    }
                    return app;
                },
                component(name, component) {
                    if (!component) {
                        return context.components[name];
                    }
                    context.components[name] = component;
                    return app;
                },
                directive(name, directive) {
                    if (!directive) {
                        return context.directives[name];
                    }
                    context.directives[name] = directive;
                    return app;
                },
                mount(rootContainer, isHydrate, isSVG) {
                    if (!isMounted) {
                        const vnode = createVNode(rootComponent, rootProps);
                        // store app context on the root VNode.
                        // this will be set on the root instance on initial mount.
                        vnode.appContext = context;
                        if (isHydrate && hydrate) {
                            hydrate(vnode, rootContainer);
                        }
                        else {
                            render(vnode, rootContainer, isSVG);
                        }
                        isMounted = true;
                        app._container = rootContainer;
                        rootContainer.__vue_app__ = app;
                        if (__VUE_PROD_DEVTOOLS__) {
                            app._instance = vnode.component;
                            devtoolsInitApp(app, version);
                        }
                        return getExposeProxy(vnode.component) || vnode.component.proxy;
                    }
                },
                unmount() {
                    if (isMounted) {
                        render(null, app._container);
                        if (__VUE_PROD_DEVTOOLS__) {
                            app._instance = null;
                            devtoolsUnmountApp(app);
                        }
                        delete app._container.__vue_app__;
                    }
                },
                provide(key, value) {
                    // TypeScript doesn't allow symbols as index type
                    // https://github.com/Microsoft/TypeScript/issues/24587
                    context.provides[key] = value;
                    return app;
                }
            });
            return app;
        };
    }

    /**
     * Function for handling a template ref
     */
    function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
        if (isArray(rawRef)) {
            rawRef.forEach((r, i) => setRef(r, oldRawRef && (isArray(oldRawRef) ? oldRawRef[i] : oldRawRef), parentSuspense, vnode, isUnmount));
            return;
        }
        if (isAsyncWrapper(vnode) && !isUnmount) {
            // when mounting async components, nothing needs to be done,
            // because the template ref is forwarded to inner component
            return;
        }
        const refValue = vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */
            ? getExposeProxy(vnode.component) || vnode.component.proxy
            : vnode.el;
        const value = isUnmount ? null : refValue;
        const { i: owner, r: ref } = rawRef;
        const oldRef = oldRawRef && oldRawRef.r;
        const refs = owner.refs === EMPTY_OBJ ? (owner.refs = {}) : owner.refs;
        const setupState = owner.setupState;
        // dynamic ref changed. unset old ref
        if (oldRef != null && oldRef !== ref) {
            if (isString(oldRef)) {
                refs[oldRef] = null;
                if (hasOwn(setupState, oldRef)) {
                    setupState[oldRef] = null;
                }
            }
            else if (isRef(oldRef)) {
                oldRef.value = null;
            }
        }
        if (isFunction(ref)) {
            callWithErrorHandling(ref, owner, 12 /* FUNCTION_REF */, [value, refs]);
        }
        else {
            const _isString = isString(ref);
            const _isRef = isRef(ref);
            if (_isString || _isRef) {
                const doSet = () => {
                    if (rawRef.f) {
                        const existing = _isString ? refs[ref] : ref.value;
                        if (isUnmount) {
                            isArray(existing) && remove(existing, refValue);
                        }
                        else {
                            if (!isArray(existing)) {
                                if (_isString) {
                                    refs[ref] = [refValue];
                                }
                                else {
                                    ref.value = [refValue];
                                    if (rawRef.k)
                                        refs[rawRef.k] = ref.value;
                                }
                            }
                            else if (!existing.includes(refValue)) {
                                existing.push(refValue);
                            }
                        }
                    }
                    else if (_isString) {
                        refs[ref] = value;
                        if (hasOwn(setupState, ref)) {
                            setupState[ref] = value;
                        }
                    }
                    else if (isRef(ref)) {
                        ref.value = value;
                        if (rawRef.k)
                            refs[rawRef.k] = value;
                    }
                    else ;
                };
                if (value) {
                    doSet.id = -1;
                    queuePostRenderEffect(doSet, parentSuspense);
                }
                else {
                    doSet();
                }
            }
        }
    }

    /**
     * This is only called in esm-bundler builds.
     * It is called when a renderer is created, in `baseCreateRenderer` so that
     * importing runtime-core is side-effects free.
     *
     * istanbul-ignore-next
     */
    function initFeatureFlags() {
        if (typeof __VUE_OPTIONS_API__ !== 'boolean') {
            getGlobalThis().__VUE_OPTIONS_API__ = true;
        }
        if (typeof __VUE_PROD_DEVTOOLS__ !== 'boolean') {
            getGlobalThis().__VUE_PROD_DEVTOOLS__ = false;
        }
    }

    const queuePostRenderEffect = queueEffectWithSuspense
        ;
    /**
     * The createRenderer function accepts two generic arguments:
     * HostNode and HostElement, corresponding to Node and Element types in the
     * host environment. For example, for runtime-dom, HostNode would be the DOM
     * `Node` interface and HostElement would be the DOM `Element` interface.
     *
     * Custom renderers can pass in the platform specific types like this:
     *
     * ``` js
     * const { render, createApp } = createRenderer<Node, Element>({
     *   patchProp,
     *   ...nodeOps
     * })
     * ```
     */
    function createRenderer(options) {
        return baseCreateRenderer(options);
    }
    // implementation
    function baseCreateRenderer(options, createHydrationFns) {
        // compile-time feature flags check
        {
            initFeatureFlags();
        }
        const target = getGlobalThis();
        target.__VUE__ = true;
        if (__VUE_PROD_DEVTOOLS__) {
            setDevtoolsHook(target.__VUE_DEVTOOLS_GLOBAL_HOOK__, target);
        }
        const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, createComment: hostCreateComment, setText: hostSetText, setElementText: hostSetElementText, parentNode: hostParentNode, nextSibling: hostNextSibling, setScopeId: hostSetScopeId = NOOP, cloneNode: hostCloneNode, insertStaticContent: hostInsertStaticContent } = options;
        // Note: functions inside this closure should use `const xxx = () => {}`
        // style in order to prevent being inlined by minifiers.
        const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, isSVG = false, slotScopeIds = null, optimized = !!n2.dynamicChildren) => {
            if (n1 === n2) {
                return;
            }
            // patching & not same type, unmount old tree
            if (n1 && !isSameVNodeType(n1, n2)) {
                anchor = getNextHostNode(n1);
                unmount(n1, parentComponent, parentSuspense, true);
                n1 = null;
            }
            if (n2.patchFlag === -2 /* BAIL */) {
                optimized = false;
                n2.dynamicChildren = null;
            }
            const { type, ref, shapeFlag } = n2;
            switch (type) {
                case Text:
                    processText(n1, n2, container, anchor);
                    break;
                case Comment:
                    processCommentNode(n1, n2, container, anchor);
                    break;
                case Static:
                    if (n1 == null) {
                        mountStaticNode(n2, container, anchor, isSVG);
                    }
                    break;
                case Fragment:
                    processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                    break;
                default:
                    if (shapeFlag & 1 /* ELEMENT */) {
                        processElement(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                    }
                    else if (shapeFlag & 6 /* COMPONENT */) {
                        processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                    }
                    else if (shapeFlag & 64 /* TELEPORT */) {
                        type.process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, internals);
                    }
                    else if (shapeFlag & 128 /* SUSPENSE */) {
                        type.process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, internals);
                    }
                    else ;
            }
            // set ref
            if (ref != null && parentComponent) {
                setRef(ref, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
            }
        };
        const processText = (n1, n2, container, anchor) => {
            if (n1 == null) {
                hostInsert((n2.el = hostCreateText(n2.children)), container, anchor);
            }
            else {
                const el = (n2.el = n1.el);
                if (n2.children !== n1.children) {
                    hostSetText(el, n2.children);
                }
            }
        };
        const processCommentNode = (n1, n2, container, anchor) => {
            if (n1 == null) {
                hostInsert((n2.el = hostCreateComment(n2.children || '')), container, anchor);
            }
            else {
                // there's no support for dynamic comments
                n2.el = n1.el;
            }
        };
        const mountStaticNode = (n2, container, anchor, isSVG) => {
            [n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, isSVG, n2.el, n2.anchor);
        };
        const moveStaticNode = ({ el, anchor }, container, nextSibling) => {
            let next;
            while (el && el !== anchor) {
                next = hostNextSibling(el);
                hostInsert(el, container, nextSibling);
                el = next;
            }
            hostInsert(anchor, container, nextSibling);
        };
        const removeStaticNode = ({ el, anchor }) => {
            let next;
            while (el && el !== anchor) {
                next = hostNextSibling(el);
                hostRemove(el);
                el = next;
            }
            hostRemove(anchor);
        };
        const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
            isSVG = isSVG || n2.type === 'svg';
            if (n1 == null) {
                mountElement(n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
            }
            else {
                patchElement(n1, n2, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
            }
        };
        const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
            let el;
            let vnodeHook;
            const { type, props, shapeFlag, transition, patchFlag, dirs } = vnode;
            if (vnode.el &&
                hostCloneNode !== undefined &&
                patchFlag === -1 /* HOISTED */) {
                // If a vnode has non-null el, it means it's being reused.
                // Only static vnodes can be reused, so its mounted DOM nodes should be
                // exactly the same, and we can simply do a clone here.
                // only do this in production since cloned trees cannot be HMR updated.
                el = vnode.el = hostCloneNode(vnode.el);
            }
            else {
                el = vnode.el = hostCreateElement(vnode.type, isSVG, props && props.is, props);
                // mount children first, since some props may rely on child content
                // being already rendered, e.g. `<select value>`
                if (shapeFlag & 8 /* TEXT_CHILDREN */) {
                    hostSetElementText(el, vnode.children);
                }
                else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                    mountChildren(vnode.children, el, null, parentComponent, parentSuspense, isSVG && type !== 'foreignObject', slotScopeIds, optimized);
                }
                if (dirs) {
                    invokeDirectiveHook(vnode, null, parentComponent, 'created');
                }
                // props
                if (props) {
                    for (const key in props) {
                        if (key !== 'value' && !isReservedProp(key)) {
                            hostPatchProp(el, key, null, props[key], isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                        }
                    }
                    /**
                     * Special case for setting value on DOM elements:
                     * - it can be order-sensitive (e.g. should be set *after* min/max, #2325, #4024)
                     * - it needs to be forced (#1471)
                     * #2353 proposes adding another renderer option to configure this, but
                     * the properties affects are so finite it is worth special casing it
                     * here to reduce the complexity. (Special casing it also should not
                     * affect non-DOM renderers)
                     */
                    if ('value' in props) {
                        hostPatchProp(el, 'value', null, props.value);
                    }
                    if ((vnodeHook = props.onVnodeBeforeMount)) {
                        invokeVNodeHook(vnodeHook, parentComponent, vnode);
                    }
                }
                // scopeId
                setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
            }
            if (__VUE_PROD_DEVTOOLS__) {
                Object.defineProperty(el, '__vnode', {
                    value: vnode,
                    enumerable: false
                });
                Object.defineProperty(el, '__vueParentComponent', {
                    value: parentComponent,
                    enumerable: false
                });
            }
            if (dirs) {
                invokeDirectiveHook(vnode, null, parentComponent, 'beforeMount');
            }
            // #1583 For inside suspense + suspense not resolved case, enter hook should call when suspense resolved
            // #1689 For inside suspense + suspense resolved case, just call it
            const needCallTransitionHooks = (!parentSuspense || (parentSuspense && !parentSuspense.pendingBranch)) &&
                transition &&
                !transition.persisted;
            if (needCallTransitionHooks) {
                transition.beforeEnter(el);
            }
            hostInsert(el, container, anchor);
            if ((vnodeHook = props && props.onVnodeMounted) ||
                needCallTransitionHooks ||
                dirs) {
                queuePostRenderEffect(() => {
                    vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
                    needCallTransitionHooks && transition.enter(el);
                    dirs && invokeDirectiveHook(vnode, null, parentComponent, 'mounted');
                }, parentSuspense);
            }
        };
        const setScopeId = (el, vnode, scopeId, slotScopeIds, parentComponent) => {
            if (scopeId) {
                hostSetScopeId(el, scopeId);
            }
            if (slotScopeIds) {
                for (let i = 0; i < slotScopeIds.length; i++) {
                    hostSetScopeId(el, slotScopeIds[i]);
                }
            }
            if (parentComponent) {
                let subTree = parentComponent.subTree;
                if (vnode === subTree) {
                    const parentVNode = parentComponent.vnode;
                    setScopeId(el, parentVNode, parentVNode.scopeId, parentVNode.slotScopeIds, parentComponent.parent);
                }
            }
        };
        const mountChildren = (children, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, start = 0) => {
            for (let i = start; i < children.length; i++) {
                const child = (children[i] = optimized
                    ? cloneIfMounted(children[i])
                    : normalizeVNode(children[i]));
                patch(null, child, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
            }
        };
        const patchElement = (n1, n2, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
            const el = (n2.el = n1.el);
            let { patchFlag, dynamicChildren, dirs } = n2;
            // #1426 take the old vnode's patch flag into account since user may clone a
            // compiler-generated vnode, which de-opts to FULL_PROPS
            patchFlag |= n1.patchFlag & 16 /* FULL_PROPS */;
            const oldProps = n1.props || EMPTY_OBJ;
            const newProps = n2.props || EMPTY_OBJ;
            let vnodeHook;
            // disable recurse in beforeUpdate hooks
            parentComponent && toggleRecurse(parentComponent, false);
            if ((vnodeHook = newProps.onVnodeBeforeUpdate)) {
                invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
            }
            if (dirs) {
                invokeDirectiveHook(n2, n1, parentComponent, 'beforeUpdate');
            }
            parentComponent && toggleRecurse(parentComponent, true);
            const areChildrenSVG = isSVG && n2.type !== 'foreignObject';
            if (dynamicChildren) {
                patchBlockChildren(n1.dynamicChildren, dynamicChildren, el, parentComponent, parentSuspense, areChildrenSVG, slotScopeIds);
            }
            else if (!optimized) {
                // full diff
                patchChildren(n1, n2, el, null, parentComponent, parentSuspense, areChildrenSVG, slotScopeIds, false);
            }
            if (patchFlag > 0) {
                // the presence of a patchFlag means this element's render code was
                // generated by the compiler and can take the fast path.
                // in this path old node and new node are guaranteed to have the same shape
                // (i.e. at the exact same position in the source template)
                if (patchFlag & 16 /* FULL_PROPS */) {
                    // element props contain dynamic keys, full diff needed
                    patchProps(el, n2, oldProps, newProps, parentComponent, parentSuspense, isSVG);
                }
                else {
                    // class
                    // this flag is matched when the element has dynamic class bindings.
                    if (patchFlag & 2 /* CLASS */) {
                        if (oldProps.class !== newProps.class) {
                            hostPatchProp(el, 'class', null, newProps.class, isSVG);
                        }
                    }
                    // style
                    // this flag is matched when the element has dynamic style bindings
                    if (patchFlag & 4 /* STYLE */) {
                        hostPatchProp(el, 'style', oldProps.style, newProps.style, isSVG);
                    }
                    // props
                    // This flag is matched when the element has dynamic prop/attr bindings
                    // other than class and style. The keys of dynamic prop/attrs are saved for
                    // faster iteration.
                    // Note dynamic keys like :[foo]="bar" will cause this optimization to
                    // bail out and go through a full diff because we need to unset the old key
                    if (patchFlag & 8 /* PROPS */) {
                        // if the flag is present then dynamicProps must be non-null
                        const propsToUpdate = n2.dynamicProps;
                        for (let i = 0; i < propsToUpdate.length; i++) {
                            const key = propsToUpdate[i];
                            const prev = oldProps[key];
                            const next = newProps[key];
                            // #1471 force patch value
                            if (next !== prev || key === 'value') {
                                hostPatchProp(el, key, prev, next, isSVG, n1.children, parentComponent, parentSuspense, unmountChildren);
                            }
                        }
                    }
                }
                // text
                // This flag is matched when the element has only dynamic text children.
                if (patchFlag & 1 /* TEXT */) {
                    if (n1.children !== n2.children) {
                        hostSetElementText(el, n2.children);
                    }
                }
            }
            else if (!optimized && dynamicChildren == null) {
                // unoptimized, full diff
                patchProps(el, n2, oldProps, newProps, parentComponent, parentSuspense, isSVG);
            }
            if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
                queuePostRenderEffect(() => {
                    vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
                    dirs && invokeDirectiveHook(n2, n1, parentComponent, 'updated');
                }, parentSuspense);
            }
        };
        // The fast path for blocks.
        const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, isSVG, slotScopeIds) => {
            for (let i = 0; i < newChildren.length; i++) {
                const oldVNode = oldChildren[i];
                const newVNode = newChildren[i];
                // Determine the container (parent element) for the patch.
                const container = 
                // oldVNode may be an errored async setup() component inside Suspense
                // which will not have a mounted element
                oldVNode.el &&
                    // - In the case of a Fragment, we need to provide the actual parent
                    // of the Fragment itself so it can move its children.
                    (oldVNode.type === Fragment ||
                        // - In the case of different nodes, there is going to be a replacement
                        // which also requires the correct parent container
                        !isSameVNodeType(oldVNode, newVNode) ||
                        // - In the case of a component, it could contain anything.
                        oldVNode.shapeFlag & (6 /* COMPONENT */ | 64 /* TELEPORT */))
                    ? hostParentNode(oldVNode.el)
                    : // In other cases, the parent container is not actually used so we
                        // just pass the block element here to avoid a DOM parentNode call.
                        fallbackContainer;
                patch(oldVNode, newVNode, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, true);
            }
        };
        const patchProps = (el, vnode, oldProps, newProps, parentComponent, parentSuspense, isSVG) => {
            if (oldProps !== newProps) {
                for (const key in newProps) {
                    // empty string is not valid prop
                    if (isReservedProp(key))
                        continue;
                    const next = newProps[key];
                    const prev = oldProps[key];
                    // defer patching value
                    if (next !== prev && key !== 'value') {
                        hostPatchProp(el, key, prev, next, isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                    }
                }
                if (oldProps !== EMPTY_OBJ) {
                    for (const key in oldProps) {
                        if (!isReservedProp(key) && !(key in newProps)) {
                            hostPatchProp(el, key, oldProps[key], null, isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
                        }
                    }
                }
                if ('value' in newProps) {
                    hostPatchProp(el, 'value', oldProps.value, newProps.value);
                }
            }
        };
        const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
            const fragmentStartAnchor = (n2.el = n1 ? n1.el : hostCreateText(''));
            const fragmentEndAnchor = (n2.anchor = n1 ? n1.anchor : hostCreateText(''));
            let { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;
            // check if this is a slot fragment with :slotted scope ids
            if (fragmentSlotScopeIds) {
                slotScopeIds = slotScopeIds
                    ? slotScopeIds.concat(fragmentSlotScopeIds)
                    : fragmentSlotScopeIds;
            }
            if (n1 == null) {
                hostInsert(fragmentStartAnchor, container, anchor);
                hostInsert(fragmentEndAnchor, container, anchor);
                // a fragment can only have array children
                // since they are either generated by the compiler, or implicitly created
                // from arrays.
                mountChildren(n2.children, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
            }
            else {
                if (patchFlag > 0 &&
                    patchFlag & 64 /* STABLE_FRAGMENT */ &&
                    dynamicChildren &&
                    // #2715 the previous fragment could've been a BAILed one as a result
                    // of renderSlot() with no valid children
                    n1.dynamicChildren) {
                    // a stable fragment (template root or <template v-for>) doesn't need to
                    // patch children order, but it may contain dynamicChildren.
                    patchBlockChildren(n1.dynamicChildren, dynamicChildren, container, parentComponent, parentSuspense, isSVG, slotScopeIds);
                    if (
                    // #2080 if the stable fragment has a key, it's a <template v-for> that may
                    //  get moved around. Make sure all root level vnodes inherit el.
                    // #2134 or if it's a component root, it may also get moved around
                    // as the component is being moved.
                    n2.key != null ||
                        (parentComponent && n2 === parentComponent.subTree)) {
                        traverseStaticChildren(n1, n2, true /* shallow */);
                    }
                }
                else {
                    // keyed / unkeyed, or manual fragments.
                    // for keyed & unkeyed, since they are compiler generated from v-for,
                    // each child is guaranteed to be a block so the fragment will never
                    // have dynamicChildren.
                    patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                }
            }
        };
        const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
            n2.slotScopeIds = slotScopeIds;
            if (n1 == null) {
                if (n2.shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
                    parentComponent.ctx.activate(n2, container, anchor, isSVG, optimized);
                }
                else {
                    mountComponent(n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
                }
            }
            else {
                updateComponent(n1, n2, optimized);
            }
        };
        const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
            const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent, parentSuspense));
            // inject renderer internals for keepAlive
            if (isKeepAlive(initialVNode)) {
                instance.ctx.renderer = internals;
            }
            // resolve props and slots for setup context
            {
                setupComponent(instance);
            }
            // setup() is async. This component relies on async logic to be resolved
            // before proceeding
            if (instance.asyncDep) {
                parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect);
                // Give it a placeholder if this is not hydration
                // TODO handle self-defined fallback
                if (!initialVNode.el) {
                    const placeholder = (instance.subTree = createVNode(Comment));
                    processCommentNode(null, placeholder, container, anchor);
                }
                return;
            }
            setupRenderEffect(instance, initialVNode, container, anchor, parentSuspense, isSVG, optimized);
        };
        const updateComponent = (n1, n2, optimized) => {
            const instance = (n2.component = n1.component);
            if (shouldUpdateComponent(n1, n2, optimized)) {
                if (instance.asyncDep &&
                    !instance.asyncResolved) {
                    updateComponentPreRender(instance, n2, optimized);
                    return;
                }
                else {
                    // normal update
                    instance.next = n2;
                    // in case the child component is also queued, remove it to avoid
                    // double updating the same child component in the same flush.
                    invalidateJob(instance.update);
                    // instance.update is the reactive effect.
                    instance.update();
                }
            }
            else {
                // no update needed. just copy over properties
                n2.component = n1.component;
                n2.el = n1.el;
                instance.vnode = n2;
            }
        };
        const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, isSVG, optimized) => {
            const componentUpdateFn = () => {
                if (!instance.isMounted) {
                    let vnodeHook;
                    const { el, props } = initialVNode;
                    const { bm, m, parent } = instance;
                    const isAsyncWrapperVNode = isAsyncWrapper(initialVNode);
                    toggleRecurse(instance, false);
                    // beforeMount hook
                    if (bm) {
                        invokeArrayFns(bm);
                    }
                    // onVnodeBeforeMount
                    if (!isAsyncWrapperVNode &&
                        (vnodeHook = props && props.onVnodeBeforeMount)) {
                        invokeVNodeHook(vnodeHook, parent, initialVNode);
                    }
                    toggleRecurse(instance, true);
                    if (el && hydrateNode) {
                        // vnode has adopted host node - perform hydration instead of mount.
                        const hydrateSubTree = () => {
                            instance.subTree = renderComponentRoot(instance);
                            hydrateNode(el, instance.subTree, instance, parentSuspense, null);
                        };
                        if (isAsyncWrapperVNode) {
                            initialVNode.type.__asyncLoader().then(
                            // note: we are moving the render call into an async callback,
                            // which means it won't track dependencies - but it's ok because
                            // a server-rendered async wrapper is already in resolved state
                            // and it will never need to change.
                            () => !instance.isUnmounted && hydrateSubTree());
                        }
                        else {
                            hydrateSubTree();
                        }
                    }
                    else {
                        const subTree = (instance.subTree = renderComponentRoot(instance));
                        patch(null, subTree, container, anchor, instance, parentSuspense, isSVG);
                        initialVNode.el = subTree.el;
                    }
                    // mounted hook
                    if (m) {
                        queuePostRenderEffect(m, parentSuspense);
                    }
                    // onVnodeMounted
                    if (!isAsyncWrapperVNode &&
                        (vnodeHook = props && props.onVnodeMounted)) {
                        const scopedInitialVNode = initialVNode;
                        queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, scopedInitialVNode), parentSuspense);
                    }
                    // activated hook for keep-alive roots.
                    // #1742 activated hook must be accessed after first render
                    // since the hook may be injected by a child keep-alive
                    if (initialVNode.shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
                        instance.a && queuePostRenderEffect(instance.a, parentSuspense);
                    }
                    instance.isMounted = true;
                    if (__VUE_PROD_DEVTOOLS__) {
                        devtoolsComponentAdded(instance);
                    }
                    // #2458: deference mount-only object parameters to prevent memleaks
                    initialVNode = container = anchor = null;
                }
                else {
                    // updateComponent
                    // This is triggered by mutation of component's own state (next: null)
                    // OR parent calling processComponent (next: VNode)
                    let { next, bu, u, parent, vnode } = instance;
                    let originNext = next;
                    let vnodeHook;
                    // Disallow component effect recursion during pre-lifecycle hooks.
                    toggleRecurse(instance, false);
                    if (next) {
                        next.el = vnode.el;
                        updateComponentPreRender(instance, next, optimized);
                    }
                    else {
                        next = vnode;
                    }
                    // beforeUpdate hook
                    if (bu) {
                        invokeArrayFns(bu);
                    }
                    // onVnodeBeforeUpdate
                    if ((vnodeHook = next.props && next.props.onVnodeBeforeUpdate)) {
                        invokeVNodeHook(vnodeHook, parent, next, vnode);
                    }
                    toggleRecurse(instance, true);
                    const nextTree = renderComponentRoot(instance);
                    const prevTree = instance.subTree;
                    instance.subTree = nextTree;
                    patch(prevTree, nextTree, 
                    // parent may have changed if it's in a teleport
                    hostParentNode(prevTree.el), 
                    // anchor may have changed if it's in a fragment
                    getNextHostNode(prevTree), instance, parentSuspense, isSVG);
                    next.el = nextTree.el;
                    if (originNext === null) {
                        // self-triggered update. In case of HOC, update parent component
                        // vnode el. HOC is indicated by parent instance's subTree pointing
                        // to child component's vnode
                        updateHOCHostEl(instance, nextTree.el);
                    }
                    // updated hook
                    if (u) {
                        queuePostRenderEffect(u, parentSuspense);
                    }
                    // onVnodeUpdated
                    if ((vnodeHook = next.props && next.props.onVnodeUpdated)) {
                        queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent, next, vnode), parentSuspense);
                    }
                    if (__VUE_PROD_DEVTOOLS__) {
                        devtoolsComponentUpdated(instance);
                    }
                }
            };
            // create reactive effect for rendering
            const effect = (instance.effect = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update), instance.scope // track it in component's effect scope
            ));
            const update = (instance.update = effect.run.bind(effect));
            update.id = instance.uid;
            // allowRecurse
            // #1801, #2043 component render effects should allow recursive updates
            toggleRecurse(instance, true);
            update();
        };
        const updateComponentPreRender = (instance, nextVNode, optimized) => {
            nextVNode.component = instance;
            const prevProps = instance.vnode.props;
            instance.vnode = nextVNode;
            instance.next = null;
            updateProps(instance, nextVNode.props, prevProps, optimized);
            updateSlots(instance, nextVNode.children, optimized);
            pauseTracking();
            // props update may have triggered pre-flush watchers.
            // flush them before the render update.
            flushPreFlushCbs(undefined, instance.update);
            resetTracking();
        };
        const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized = false) => {
            const c1 = n1 && n1.children;
            const prevShapeFlag = n1 ? n1.shapeFlag : 0;
            const c2 = n2.children;
            const { patchFlag, shapeFlag } = n2;
            // fast path
            if (patchFlag > 0) {
                if (patchFlag & 128 /* KEYED_FRAGMENT */) {
                    // this could be either fully-keyed or mixed (some keyed some not)
                    // presence of patchFlag means children are guaranteed to be arrays
                    patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                    return;
                }
                else if (patchFlag & 256 /* UNKEYED_FRAGMENT */) {
                    // unkeyed
                    patchUnkeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                    return;
                }
            }
            // children has 3 possibilities: text, array or no children.
            if (shapeFlag & 8 /* TEXT_CHILDREN */) {
                // text children fast path
                if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                    unmountChildren(c1, parentComponent, parentSuspense);
                }
                if (c2 !== c1) {
                    hostSetElementText(container, c2);
                }
            }
            else {
                if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                    // prev children was array
                    if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                        // two arrays, cannot assume anything, do full diff
                        patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                    }
                    else {
                        // no new children, just unmount old
                        unmountChildren(c1, parentComponent, parentSuspense, true);
                    }
                }
                else {
                    // prev children was text OR null
                    // new children is array OR null
                    if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
                        hostSetElementText(container, '');
                    }
                    // mount new if array
                    if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                        mountChildren(c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                    }
                }
            }
        };
        const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
            c1 = c1 || EMPTY_ARR;
            c2 = c2 || EMPTY_ARR;
            const oldLength = c1.length;
            const newLength = c2.length;
            const commonLength = Math.min(oldLength, newLength);
            let i;
            for (i = 0; i < commonLength; i++) {
                const nextChild = (c2[i] = optimized
                    ? cloneIfMounted(c2[i])
                    : normalizeVNode(c2[i]));
                patch(c1[i], nextChild, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
            }
            if (oldLength > newLength) {
                // remove old
                unmountChildren(c1, parentComponent, parentSuspense, true, false, commonLength);
            }
            else {
                // mount new
                mountChildren(c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, commonLength);
            }
        };
        // can be all-keyed or mixed
        const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
            let i = 0;
            const l2 = c2.length;
            let e1 = c1.length - 1; // prev ending index
            let e2 = l2 - 1; // next ending index
            // 1. sync from start
            // (a b) c
            // (a b) d e
            while (i <= e1 && i <= e2) {
                const n1 = c1[i];
                const n2 = (c2[i] = optimized
                    ? cloneIfMounted(c2[i])
                    : normalizeVNode(c2[i]));
                if (isSameVNodeType(n1, n2)) {
                    patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                }
                else {
                    break;
                }
                i++;
            }
            // 2. sync from end
            // a (b c)
            // d e (b c)
            while (i <= e1 && i <= e2) {
                const n1 = c1[e1];
                const n2 = (c2[e2] = optimized
                    ? cloneIfMounted(c2[e2])
                    : normalizeVNode(c2[e2]));
                if (isSameVNodeType(n1, n2)) {
                    patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                }
                else {
                    break;
                }
                e1--;
                e2--;
            }
            // 3. common sequence + mount
            // (a b)
            // (a b) c
            // i = 2, e1 = 1, e2 = 2
            // (a b)
            // c (a b)
            // i = 0, e1 = -1, e2 = 0
            if (i > e1) {
                if (i <= e2) {
                    const nextPos = e2 + 1;
                    const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
                    while (i <= e2) {
                        patch(null, (c2[i] = optimized
                            ? cloneIfMounted(c2[i])
                            : normalizeVNode(c2[i])), container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                        i++;
                    }
                }
            }
            // 4. common sequence + unmount
            // (a b) c
            // (a b)
            // i = 2, e1 = 2, e2 = 1
            // a (b c)
            // (b c)
            // i = 0, e1 = 0, e2 = -1
            else if (i > e2) {
                while (i <= e1) {
                    unmount(c1[i], parentComponent, parentSuspense, true);
                    i++;
                }
            }
            // 5. unknown sequence
            // [i ... e1 + 1]: a b [c d e] f g
            // [i ... e2 + 1]: a b [e d c h] f g
            // i = 2, e1 = 4, e2 = 5
            else {
                const s1 = i; // prev starting index
                const s2 = i; // next starting index
                // 5.1 build key:index map for newChildren
                const keyToNewIndexMap = new Map();
                for (i = s2; i <= e2; i++) {
                    const nextChild = (c2[i] = optimized
                        ? cloneIfMounted(c2[i])
                        : normalizeVNode(c2[i]));
                    if (nextChild.key != null) {
                        keyToNewIndexMap.set(nextChild.key, i);
                    }
                }
                // 5.2 loop through old children left to be patched and try to patch
                // matching nodes & remove nodes that are no longer present
                let j;
                let patched = 0;
                const toBePatched = e2 - s2 + 1;
                let moved = false;
                // used to track whether any node has moved
                let maxNewIndexSoFar = 0;
                // works as Map<newIndex, oldIndex>
                // Note that oldIndex is offset by +1
                // and oldIndex = 0 is a special value indicating the new node has
                // no corresponding old node.
                // used for determining longest stable subsequence
                const newIndexToOldIndexMap = new Array(toBePatched);
                for (i = 0; i < toBePatched; i++)
                    newIndexToOldIndexMap[i] = 0;
                for (i = s1; i <= e1; i++) {
                    const prevChild = c1[i];
                    if (patched >= toBePatched) {
                        // all new children have been patched so this can only be a removal
                        unmount(prevChild, parentComponent, parentSuspense, true);
                        continue;
                    }
                    let newIndex;
                    if (prevChild.key != null) {
                        newIndex = keyToNewIndexMap.get(prevChild.key);
                    }
                    else {
                        // key-less node, try to locate a key-less node of the same type
                        for (j = s2; j <= e2; j++) {
                            if (newIndexToOldIndexMap[j - s2] === 0 &&
                                isSameVNodeType(prevChild, c2[j])) {
                                newIndex = j;
                                break;
                            }
                        }
                    }
                    if (newIndex === undefined) {
                        unmount(prevChild, parentComponent, parentSuspense, true);
                    }
                    else {
                        newIndexToOldIndexMap[newIndex - s2] = i + 1;
                        if (newIndex >= maxNewIndexSoFar) {
                            maxNewIndexSoFar = newIndex;
                        }
                        else {
                            moved = true;
                        }
                        patch(prevChild, c2[newIndex], container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                        patched++;
                    }
                }
                // 5.3 move and mount
                // generate longest stable subsequence only when nodes have moved
                const increasingNewIndexSequence = moved
                    ? getSequence(newIndexToOldIndexMap)
                    : EMPTY_ARR;
                j = increasingNewIndexSequence.length - 1;
                // looping backwards so that we can use last patched node as anchor
                for (i = toBePatched - 1; i >= 0; i--) {
                    const nextIndex = s2 + i;
                    const nextChild = c2[nextIndex];
                    const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;
                    if (newIndexToOldIndexMap[i] === 0) {
                        // mount new
                        patch(null, nextChild, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
                    }
                    else if (moved) {
                        // move if:
                        // There is no stable subsequence (e.g. a reverse)
                        // OR current node is not among the stable sequence
                        if (j < 0 || i !== increasingNewIndexSequence[j]) {
                            move(nextChild, container, anchor, 2 /* REORDER */);
                        }
                        else {
                            j--;
                        }
                    }
                }
            }
        };
        const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
            const { el, type, transition, children, shapeFlag } = vnode;
            if (shapeFlag & 6 /* COMPONENT */) {
                move(vnode.component.subTree, container, anchor, moveType);
                return;
            }
            if (shapeFlag & 128 /* SUSPENSE */) {
                vnode.suspense.move(container, anchor, moveType);
                return;
            }
            if (shapeFlag & 64 /* TELEPORT */) {
                type.move(vnode, container, anchor, internals);
                return;
            }
            if (type === Fragment) {
                hostInsert(el, container, anchor);
                for (let i = 0; i < children.length; i++) {
                    move(children[i], container, anchor, moveType);
                }
                hostInsert(vnode.anchor, container, anchor);
                return;
            }
            if (type === Static) {
                moveStaticNode(vnode, container, anchor);
                return;
            }
            // single nodes
            const needTransition = moveType !== 2 /* REORDER */ &&
                shapeFlag & 1 /* ELEMENT */ &&
                transition;
            if (needTransition) {
                if (moveType === 0 /* ENTER */) {
                    transition.beforeEnter(el);
                    hostInsert(el, container, anchor);
                    queuePostRenderEffect(() => transition.enter(el), parentSuspense);
                }
                else {
                    const { leave, delayLeave, afterLeave } = transition;
                    const remove = () => hostInsert(el, container, anchor);
                    const performLeave = () => {
                        leave(el, () => {
                            remove();
                            afterLeave && afterLeave();
                        });
                    };
                    if (delayLeave) {
                        delayLeave(el, remove, performLeave);
                    }
                    else {
                        performLeave();
                    }
                }
            }
            else {
                hostInsert(el, container, anchor);
            }
        };
        const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
            const { type, props, ref, children, dynamicChildren, shapeFlag, patchFlag, dirs } = vnode;
            // unset ref
            if (ref != null) {
                setRef(ref, null, parentSuspense, vnode, true);
            }
            if (shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
                parentComponent.ctx.deactivate(vnode);
                return;
            }
            const shouldInvokeDirs = shapeFlag & 1 /* ELEMENT */ && dirs;
            const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
            let vnodeHook;
            if (shouldInvokeVnodeHook &&
                (vnodeHook = props && props.onVnodeBeforeUnmount)) {
                invokeVNodeHook(vnodeHook, parentComponent, vnode);
            }
            if (shapeFlag & 6 /* COMPONENT */) {
                unmountComponent(vnode.component, parentSuspense, doRemove);
            }
            else {
                if (shapeFlag & 128 /* SUSPENSE */) {
                    vnode.suspense.unmount(parentSuspense, doRemove);
                    return;
                }
                if (shouldInvokeDirs) {
                    invokeDirectiveHook(vnode, null, parentComponent, 'beforeUnmount');
                }
                if (shapeFlag & 64 /* TELEPORT */) {
                    vnode.type.remove(vnode, parentComponent, parentSuspense, optimized, internals, doRemove);
                }
                else if (dynamicChildren &&
                    // #1153: fast path should not be taken for non-stable (v-for) fragments
                    (type !== Fragment ||
                        (patchFlag > 0 && patchFlag & 64 /* STABLE_FRAGMENT */))) {
                    // fast path for block nodes: only need to unmount dynamic children.
                    unmountChildren(dynamicChildren, parentComponent, parentSuspense, false, true);
                }
                else if ((type === Fragment &&
                    patchFlag &
                        (128 /* KEYED_FRAGMENT */ | 256 /* UNKEYED_FRAGMENT */)) ||
                    (!optimized && shapeFlag & 16 /* ARRAY_CHILDREN */)) {
                    unmountChildren(children, parentComponent, parentSuspense);
                }
                if (doRemove) {
                    remove(vnode);
                }
            }
            if ((shouldInvokeVnodeHook &&
                (vnodeHook = props && props.onVnodeUnmounted)) ||
                shouldInvokeDirs) {
                queuePostRenderEffect(() => {
                    vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
                    shouldInvokeDirs &&
                        invokeDirectiveHook(vnode, null, parentComponent, 'unmounted');
                }, parentSuspense);
            }
        };
        const remove = vnode => {
            const { type, el, anchor, transition } = vnode;
            if (type === Fragment) {
                removeFragment(el, anchor);
                return;
            }
            if (type === Static) {
                removeStaticNode(vnode);
                return;
            }
            const performRemove = () => {
                hostRemove(el);
                if (transition && !transition.persisted && transition.afterLeave) {
                    transition.afterLeave();
                }
            };
            if (vnode.shapeFlag & 1 /* ELEMENT */ &&
                transition &&
                !transition.persisted) {
                const { leave, delayLeave } = transition;
                const performLeave = () => leave(el, performRemove);
                if (delayLeave) {
                    delayLeave(vnode.el, performRemove, performLeave);
                }
                else {
                    performLeave();
                }
            }
            else {
                performRemove();
            }
        };
        const removeFragment = (cur, end) => {
            // For fragments, directly remove all contained DOM nodes.
            // (fragment child nodes cannot have transition)
            let next;
            while (cur !== end) {
                next = hostNextSibling(cur);
                hostRemove(cur);
                cur = next;
            }
            hostRemove(end);
        };
        const unmountComponent = (instance, parentSuspense, doRemove) => {
            const { bum, scope, update, subTree, um } = instance;
            // beforeUnmount hook
            if (bum) {
                invokeArrayFns(bum);
            }
            // stop effects in component scope
            scope.stop();
            // update may be null if a component is unmounted before its async
            // setup has resolved.
            if (update) {
                // so that scheduler will no longer invoke it
                update.active = false;
                unmount(subTree, instance, parentSuspense, doRemove);
            }
            // unmounted hook
            if (um) {
                queuePostRenderEffect(um, parentSuspense);
            }
            queuePostRenderEffect(() => {
                instance.isUnmounted = true;
            }, parentSuspense);
            // A component with async dep inside a pending suspense is unmounted before
            // its async dep resolves. This should remove the dep from the suspense, and
            // cause the suspense to resolve immediately if that was the last dep.
            if (parentSuspense &&
                parentSuspense.pendingBranch &&
                !parentSuspense.isUnmounted &&
                instance.asyncDep &&
                !instance.asyncResolved &&
                instance.suspenseId === parentSuspense.pendingId) {
                parentSuspense.deps--;
                if (parentSuspense.deps === 0) {
                    parentSuspense.resolve();
                }
            }
            if (__VUE_PROD_DEVTOOLS__) {
                devtoolsComponentRemoved(instance);
            }
        };
        const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
            for (let i = start; i < children.length; i++) {
                unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
            }
        };
        const getNextHostNode = vnode => {
            if (vnode.shapeFlag & 6 /* COMPONENT */) {
                return getNextHostNode(vnode.component.subTree);
            }
            if (vnode.shapeFlag & 128 /* SUSPENSE */) {
                return vnode.suspense.next();
            }
            return hostNextSibling((vnode.anchor || vnode.el));
        };
        const render = (vnode, container, isSVG) => {
            if (vnode == null) {
                if (container._vnode) {
                    unmount(container._vnode, null, null, true);
                }
            }
            else {
                patch(container._vnode || null, vnode, container, null, null, null, isSVG);
            }
            flushPostFlushCbs();
            container._vnode = vnode;
        };
        const internals = {
            p: patch,
            um: unmount,
            m: move,
            r: remove,
            mt: mountComponent,
            mc: mountChildren,
            pc: patchChildren,
            pbc: patchBlockChildren,
            n: getNextHostNode,
            o: options
        };
        let hydrate;
        let hydrateNode;
        if (createHydrationFns) {
            [hydrate, hydrateNode] = createHydrationFns(internals);
        }
        return {
            render,
            hydrate,
            createApp: createAppAPI(render, hydrate)
        };
    }
    function toggleRecurse({ effect, update }, allowed) {
        effect.allowRecurse = update.allowRecurse = allowed;
    }
    /**
     * #1156
     * When a component is HMR-enabled, we need to make sure that all static nodes
     * inside a block also inherit the DOM element from the previous tree so that
     * HMR updates (which are full updates) can retrieve the element for patching.
     *
     * #2080
     * Inside keyed `template` fragment static children, if a fragment is moved,
     * the children will always be moved. Therefore, in order to ensure correct move
     * position, el should be inherited from previous nodes.
     */
    function traverseStaticChildren(n1, n2, shallow = false) {
        const ch1 = n1.children;
        const ch2 = n2.children;
        if (isArray(ch1) && isArray(ch2)) {
            for (let i = 0; i < ch1.length; i++) {
                // this is only called in the optimized path so array children are
                // guaranteed to be vnodes
                const c1 = ch1[i];
                let c2 = ch2[i];
                if (c2.shapeFlag & 1 /* ELEMENT */ && !c2.dynamicChildren) {
                    if (c2.patchFlag <= 0 || c2.patchFlag === 32 /* HYDRATE_EVENTS */) {
                        c2 = ch2[i] = cloneIfMounted(ch2[i]);
                        c2.el = c1.el;
                    }
                    if (!shallow)
                        traverseStaticChildren(c1, c2);
                }
            }
        }
    }
    // https://en.wikipedia.org/wiki/Longest_increasing_subsequence
    function getSequence(arr) {
        const p = arr.slice();
        const result = [0];
        let i, j, u, v, c;
        const len = arr.length;
        for (i = 0; i < len; i++) {
            const arrI = arr[i];
            if (arrI !== 0) {
                j = result[result.length - 1];
                if (arr[j] < arrI) {
                    p[i] = j;
                    result.push(i);
                    continue;
                }
                u = 0;
                v = result.length - 1;
                while (u < v) {
                    c = (u + v) >> 1;
                    if (arr[result[c]] < arrI) {
                        u = c + 1;
                    }
                    else {
                        v = c;
                    }
                }
                if (arrI < arr[result[u]]) {
                    if (u > 0) {
                        p[i] = result[u - 1];
                    }
                    result[u] = i;
                }
            }
        }
        u = result.length;
        v = result[u - 1];
        while (u-- > 0) {
            result[u] = v;
            v = p[v];
        }
        return result;
    }

    const isTeleport = (type) => type.__isTeleport;

    const COMPONENTS = 'components';
    /**
     * @private
     */
    function resolveComponent(name, maybeSelfReference) {
        return resolveAsset(COMPONENTS, name, true, maybeSelfReference) || name;
    }
    const NULL_DYNAMIC_COMPONENT = Symbol();
    // implementation
    function resolveAsset(type, name, warnMissing = true, maybeSelfReference = false) {
        const instance = currentRenderingInstance || currentInstance;
        if (instance) {
            const Component = instance.type;
            // explicit self name has highest priority
            if (type === COMPONENTS) {
                const selfName = getComponentName(Component);
                if (selfName &&
                    (selfName === name ||
                        selfName === camelize(name) ||
                        selfName === capitalize(camelize(name)))) {
                    return Component;
                }
            }
            const res = 
            // local registration
            // check instance[type] first which is resolved for options API
            resolve(instance[type] || Component[type], name) ||
                // global registration
                resolve(instance.appContext[type], name);
            if (!res && maybeSelfReference) {
                // fallback to implicit self-reference
                return Component;
            }
            return res;
        }
    }
    function resolve(registry, name) {
        return (registry &&
            (registry[name] ||
                registry[camelize(name)] ||
                registry[capitalize(camelize(name))]));
    }

    const Fragment = Symbol(undefined);
    const Text = Symbol(undefined);
    const Comment = Symbol(undefined);
    const Static = Symbol(undefined);
    // Since v-if and v-for are the two possible ways node structure can dynamically
    // change, once we consider v-if branches and each v-for fragment a block, we
    // can divide a template into nested blocks, and within each block the node
    // structure would be stable. This allows us to skip most children diffing
    // and only worry about the dynamic nodes (indicated by patch flags).
    const blockStack = [];
    let currentBlock = null;
    /**
     * Open a block.
     * This must be called before `createBlock`. It cannot be part of `createBlock`
     * because the children of the block are evaluated before `createBlock` itself
     * is called. The generated code typically looks like this:
     *
     * ```js
     * function render() {
     *   return (openBlock(),createBlock('div', null, [...]))
     * }
     * ```
     * disableTracking is true when creating a v-for fragment block, since a v-for
     * fragment always diffs its children.
     *
     * @private
     */
    function openBlock(disableTracking = false) {
        blockStack.push((currentBlock = disableTracking ? null : []));
    }
    function closeBlock() {
        blockStack.pop();
        currentBlock = blockStack[blockStack.length - 1] || null;
    }
    // Whether we should be tracking dynamic child nodes inside a block.
    // Only tracks when this value is > 0
    // We are not using a simple boolean because this value may need to be
    // incremented/decremented by nested usage of v-once (see below)
    let isBlockTreeEnabled = 1;
    /**
     * Block tracking sometimes needs to be disabled, for example during the
     * creation of a tree that needs to be cached by v-once. The compiler generates
     * code like this:
     *
     * ``` js
     * _cache[1] || (
     *   setBlockTracking(-1),
     *   _cache[1] = createVNode(...),
     *   setBlockTracking(1),
     *   _cache[1]
     * )
     * ```
     *
     * @private
     */
    function setBlockTracking(value) {
        isBlockTreeEnabled += value;
    }
    function setupBlock(vnode) {
        // save current block children on the block vnode
        vnode.dynamicChildren =
            isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARR : null;
        // close block
        closeBlock();
        // a block is always going to be patched, so track it as a child of its
        // parent block
        if (isBlockTreeEnabled > 0 && currentBlock) {
            currentBlock.push(vnode);
        }
        return vnode;
    }
    /**
     * @private
     */
    function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
        return setupBlock(createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, true /* isBlock */));
    }
    /**
     * Create a block root vnode. Takes the same exact arguments as `createVNode`.
     * A block root keeps track of dynamic nodes within the block in the
     * `dynamicChildren` array.
     *
     * @private
     */
    function createBlock(type, props, children, patchFlag, dynamicProps) {
        return setupBlock(createVNode(type, props, children, patchFlag, dynamicProps, true /* isBlock: prevent a block from tracking itself */));
    }
    function isVNode(value) {
        return value ? value.__v_isVNode === true : false;
    }
    function isSameVNodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    const InternalObjectKey = `__vInternal`;
    const normalizeKey = ({ key }) => key != null ? key : null;
    const normalizeRef = ({ ref, ref_key, ref_for }) => {
        return (ref != null
            ? isString(ref) || isRef(ref) || isFunction(ref)
                ? { i: currentRenderingInstance, r: ref, k: ref_key, f: !!ref_for }
                : ref
            : null);
    };
    function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : 1 /* ELEMENT */, isBlockNode = false, needFullChildrenNormalization = false) {
        const vnode = {
            __v_isVNode: true,
            __v_skip: true,
            type,
            props,
            key: props && normalizeKey(props),
            ref: props && normalizeRef(props),
            scopeId: currentScopeId,
            slotScopeIds: null,
            children,
            component: null,
            suspense: null,
            ssContent: null,
            ssFallback: null,
            dirs: null,
            transition: null,
            el: null,
            anchor: null,
            target: null,
            targetAnchor: null,
            staticCount: 0,
            shapeFlag,
            patchFlag,
            dynamicProps,
            dynamicChildren: null,
            appContext: null
        };
        if (needFullChildrenNormalization) {
            normalizeChildren(vnode, children);
            // normalize suspense children
            if (shapeFlag & 128 /* SUSPENSE */) {
                type.normalize(vnode);
            }
        }
        else if (children) {
            // compiled element vnode - if children is passed, only possible types are
            // string or Array.
            vnode.shapeFlag |= isString(children)
                ? 8 /* TEXT_CHILDREN */
                : 16 /* ARRAY_CHILDREN */;
        }
        // track vnode for block tree
        if (isBlockTreeEnabled > 0 &&
            // avoid a block node from tracking itself
            !isBlockNode &&
            // has current parent block
            currentBlock &&
            // presence of a patch flag indicates this node needs patching on updates.
            // component nodes also should always be patched, because even if the
            // component doesn't need to update, it needs to persist the instance on to
            // the next vnode so that it can be properly unmounted later.
            (vnode.patchFlag > 0 || shapeFlag & 6 /* COMPONENT */) &&
            // the EVENTS flag is only for hydration and if it is the only flag, the
            // vnode should not be considered dynamic due to handler caching.
            vnode.patchFlag !== 32 /* HYDRATE_EVENTS */) {
            currentBlock.push(vnode);
        }
        return vnode;
    }
    const createVNode = (_createVNode);
    function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
        if (!type || type === NULL_DYNAMIC_COMPONENT) {
            type = Comment;
        }
        if (isVNode(type)) {
            // createVNode receiving an existing vnode. This happens in cases like
            // <component :is="vnode"/>
            // #2078 make sure to merge refs during the clone instead of overwriting it
            const cloned = cloneVNode(type, props, true /* mergeRef: true */);
            if (children) {
                normalizeChildren(cloned, children);
            }
            return cloned;
        }
        // class component normalization.
        if (isClassComponent(type)) {
            type = type.__vccOpts;
        }
        // class & style normalization.
        if (props) {
            // for reactive or proxy objects, we need to clone it to enable mutation.
            props = guardReactiveProps(props);
            let { class: klass, style } = props;
            if (klass && !isString(klass)) {
                props.class = normalizeClass(klass);
            }
            if (isObject(style)) {
                // reactive state objects need to be cloned since they are likely to be
                // mutated
                if (isProxy(style) && !isArray(style)) {
                    style = extend({}, style);
                }
                props.style = normalizeStyle(style);
            }
        }
        // encode the vnode type information into a bitmap
        const shapeFlag = isString(type)
            ? 1 /* ELEMENT */
            : isSuspense(type)
                ? 128 /* SUSPENSE */
                : isTeleport(type)
                    ? 64 /* TELEPORT */
                    : isObject(type)
                        ? 4 /* STATEFUL_COMPONENT */
                        : isFunction(type)
                            ? 2 /* FUNCTIONAL_COMPONENT */
                            : 0;
        return createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, isBlockNode, true);
    }
    function guardReactiveProps(props) {
        if (!props)
            return null;
        return isProxy(props) || InternalObjectKey in props
            ? extend({}, props)
            : props;
    }
    function cloneVNode(vnode, extraProps, mergeRef = false) {
        // This is intentionally NOT using spread or extend to avoid the runtime
        // key enumeration cost.
        const { props, ref, patchFlag, children } = vnode;
        const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
        const cloned = {
            __v_isVNode: true,
            __v_skip: true,
            type: vnode.type,
            props: mergedProps,
            key: mergedProps && normalizeKey(mergedProps),
            ref: extraProps && extraProps.ref
                ? // #2078 in the case of <component :is="vnode" ref="extra"/>
                    // if the vnode itself already has a ref, cloneVNode will need to merge
                    // the refs so the single vnode can be set on multiple refs
                    mergeRef && ref
                        ? isArray(ref)
                            ? ref.concat(normalizeRef(extraProps))
                            : [ref, normalizeRef(extraProps)]
                        : normalizeRef(extraProps)
                : ref,
            scopeId: vnode.scopeId,
            slotScopeIds: vnode.slotScopeIds,
            children: children,
            target: vnode.target,
            targetAnchor: vnode.targetAnchor,
            staticCount: vnode.staticCount,
            shapeFlag: vnode.shapeFlag,
            // if the vnode is cloned with extra props, we can no longer assume its
            // existing patch flag to be reliable and need to add the FULL_PROPS flag.
            // note: preserve flag for fragments since they use the flag for children
            // fast paths only.
            patchFlag: extraProps && vnode.type !== Fragment
                ? patchFlag === -1 // hoisted node
                    ? 16 /* FULL_PROPS */
                    : patchFlag | 16 /* FULL_PROPS */
                : patchFlag,
            dynamicProps: vnode.dynamicProps,
            dynamicChildren: vnode.dynamicChildren,
            appContext: vnode.appContext,
            dirs: vnode.dirs,
            transition: vnode.transition,
            // These should technically only be non-null on mounted VNodes. However,
            // they *should* be copied for kept-alive vnodes. So we just always copy
            // them since them being non-null during a mount doesn't affect the logic as
            // they will simply be overwritten.
            component: vnode.component,
            suspense: vnode.suspense,
            ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
            ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
            el: vnode.el,
            anchor: vnode.anchor
        };
        return cloned;
    }
    /**
     * @private
     */
    function createTextVNode(text = ' ', flag = 0) {
        return createVNode(Text, null, text, flag);
    }
    function normalizeVNode(child) {
        if (child == null || typeof child === 'boolean') {
            // empty placeholder
            return createVNode(Comment);
        }
        else if (isArray(child)) {
            // fragment
            return createVNode(Fragment, null, 
            // #3666, avoid reference pollution when reusing vnode
            child.slice());
        }
        else if (typeof child === 'object') {
            // already vnode, this should be the most common since compiled templates
            // always produce all-vnode children arrays
            return cloneIfMounted(child);
        }
        else {
            // strings and numbers
            return createVNode(Text, null, String(child));
        }
    }
    // optimized normalization for template-compiled render fns
    function cloneIfMounted(child) {
        return child.el === null || child.memo ? child : cloneVNode(child);
    }
    function normalizeChildren(vnode, children) {
        let type = 0;
        const { shapeFlag } = vnode;
        if (children == null) {
            children = null;
        }
        else if (isArray(children)) {
            type = 16 /* ARRAY_CHILDREN */;
        }
        else if (typeof children === 'object') {
            if (shapeFlag & (1 /* ELEMENT */ | 64 /* TELEPORT */)) {
                // Normalize slot to plain children for plain element and Teleport
                const slot = children.default;
                if (slot) {
                    // _c marker is added by withCtx() indicating this is a compiled slot
                    slot._c && (slot._d = false);
                    normalizeChildren(vnode, slot());
                    slot._c && (slot._d = true);
                }
                return;
            }
            else {
                type = 32 /* SLOTS_CHILDREN */;
                const slotFlag = children._;
                if (!slotFlag && !(InternalObjectKey in children)) {
                    children._ctx = currentRenderingInstance;
                }
                else if (slotFlag === 3 /* FORWARDED */ && currentRenderingInstance) {
                    // a child component receives forwarded slots from the parent.
                    // its slot type is determined by its parent's slot type.
                    if (currentRenderingInstance.slots._ === 1 /* STABLE */) {
                        children._ = 1 /* STABLE */;
                    }
                    else {
                        children._ = 2 /* DYNAMIC */;
                        vnode.patchFlag |= 1024 /* DYNAMIC_SLOTS */;
                    }
                }
            }
        }
        else if (isFunction(children)) {
            children = { default: children, _ctx: currentRenderingInstance };
            type = 32 /* SLOTS_CHILDREN */;
        }
        else {
            children = String(children);
            // force teleport children to array so it can be moved around
            if (shapeFlag & 64 /* TELEPORT */) {
                type = 16 /* ARRAY_CHILDREN */;
                children = [createTextVNode(children)];
            }
            else {
                type = 8 /* TEXT_CHILDREN */;
            }
        }
        vnode.children = children;
        vnode.shapeFlag |= type;
    }
    function mergeProps(...args) {
        const ret = {};
        for (let i = 0; i < args.length; i++) {
            const toMerge = args[i];
            for (const key in toMerge) {
                if (key === 'class') {
                    if (ret.class !== toMerge.class) {
                        ret.class = normalizeClass([ret.class, toMerge.class]);
                    }
                }
                else if (key === 'style') {
                    ret.style = normalizeStyle([ret.style, toMerge.style]);
                }
                else if (isOn(key)) {
                    const existing = ret[key];
                    const incoming = toMerge[key];
                    if (incoming &&
                        existing !== incoming &&
                        !(isArray(existing) && existing.includes(incoming))) {
                        ret[key] = existing
                            ? [].concat(existing, incoming)
                            : incoming;
                    }
                }
                else if (key !== '') {
                    ret[key] = toMerge[key];
                }
            }
        }
        return ret;
    }
    function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
        callWithAsyncErrorHandling(hook, instance, 7 /* VNODE_HOOK */, [
            vnode,
            prevVNode
        ]);
    }

    /**
     * #2437 In Vue 3, functional components do not have a public instance proxy but
     * they exist in the internal parent chain. For code that relies on traversing
     * public $parent chains, skip functional ones and go to the parent instead.
     */
    const getPublicInstance = (i) => {
        if (!i)
            return null;
        if (isStatefulComponent(i))
            return getExposeProxy(i) || i.proxy;
        return getPublicInstance(i.parent);
    };
    const publicPropertiesMap = extend(Object.create(null), {
        $: i => i,
        $el: i => i.vnode.el,
        $data: i => i.data,
        $props: i => (i.props),
        $attrs: i => (i.attrs),
        $slots: i => (i.slots),
        $refs: i => (i.refs),
        $parent: i => getPublicInstance(i.parent),
        $root: i => getPublicInstance(i.root),
        $emit: i => i.emit,
        $options: i => (__VUE_OPTIONS_API__ ? resolveMergedOptions(i) : i.type),
        $forceUpdate: i => () => queueJob(i.update),
        $nextTick: i => nextTick.bind(i.proxy),
        $watch: i => (__VUE_OPTIONS_API__ ? instanceWatch.bind(i) : NOOP)
    });
    const PublicInstanceProxyHandlers = {
        get({ _: instance }, key) {
            const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
            // data / props / ctx
            // This getter gets called for every property access on the render context
            // during render and is a major hotspot. The most expensive part of this
            // is the multiple hasOwn() calls. It's much faster to do a simple property
            // access on a plain object, so we use an accessCache object (with null
            // prototype) to memoize what access type a key corresponds to.
            let normalizedProps;
            if (key[0] !== '$') {
                const n = accessCache[key];
                if (n !== undefined) {
                    switch (n) {
                        case 1 /* SETUP */:
                            return setupState[key];
                        case 2 /* DATA */:
                            return data[key];
                        case 4 /* CONTEXT */:
                            return ctx[key];
                        case 3 /* PROPS */:
                            return props[key];
                        // default: just fallthrough
                    }
                }
                else if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
                    accessCache[key] = 1 /* SETUP */;
                    return setupState[key];
                }
                else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
                    accessCache[key] = 2 /* DATA */;
                    return data[key];
                }
                else if (
                // only cache other properties when instance has declared (thus stable)
                // props
                (normalizedProps = instance.propsOptions[0]) &&
                    hasOwn(normalizedProps, key)) {
                    accessCache[key] = 3 /* PROPS */;
                    return props[key];
                }
                else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
                    accessCache[key] = 4 /* CONTEXT */;
                    return ctx[key];
                }
                else if (!__VUE_OPTIONS_API__ || shouldCacheAccess) {
                    accessCache[key] = 0 /* OTHER */;
                }
            }
            const publicGetter = publicPropertiesMap[key];
            let cssModule, globalProperties;
            // public $xxx properties
            if (publicGetter) {
                if (key === '$attrs') {
                    track(instance, "get" /* GET */, key);
                }
                return publicGetter(instance);
            }
            else if (
            // css module (injected by vue-loader)
            (cssModule = type.__cssModules) &&
                (cssModule = cssModule[key])) {
                return cssModule;
            }
            else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
                // user may set custom properties to `this` that start with `$`
                accessCache[key] = 4 /* CONTEXT */;
                return ctx[key];
            }
            else if (
            // global properties
            ((globalProperties = appContext.config.globalProperties),
                hasOwn(globalProperties, key))) {
                {
                    return globalProperties[key];
                }
            }
            else ;
        },
        set({ _: instance }, key, value) {
            const { data, setupState, ctx } = instance;
            if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
                setupState[key] = value;
                return true;
            }
            else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
                data[key] = value;
                return true;
            }
            else if (hasOwn(instance.props, key)) {
                return false;
            }
            if (key[0] === '$' && key.slice(1) in instance) {
                return false;
            }
            else {
                {
                    ctx[key] = value;
                }
            }
            return true;
        },
        has({ _: { data, setupState, accessCache, ctx, appContext, propsOptions } }, key) {
            let normalizedProps;
            return (!!accessCache[key] ||
                (data !== EMPTY_OBJ && hasOwn(data, key)) ||
                (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) ||
                ((normalizedProps = propsOptions[0]) && hasOwn(normalizedProps, key)) ||
                hasOwn(ctx, key) ||
                hasOwn(publicPropertiesMap, key) ||
                hasOwn(appContext.config.globalProperties, key));
        },
        defineProperty(target, key, descriptor) {
            if (descriptor.get != null) {
                this.set(target, key, descriptor.get(), null);
            }
            else if (descriptor.value != null) {
                this.set(target, key, descriptor.value, null);
            }
            return Reflect.defineProperty(target, key, descriptor);
        }
    };

    const emptyAppContext = createAppContext();
    let uid$1 = 0;
    function createComponentInstance(vnode, parent, suspense) {
        const type = vnode.type;
        // inherit parent app context - or - if root, adopt from root vnode
        const appContext = (parent ? parent.appContext : vnode.appContext) || emptyAppContext;
        const instance = {
            uid: uid$1++,
            vnode,
            type,
            parent,
            appContext,
            root: null,
            next: null,
            subTree: null,
            effect: null,
            update: null,
            scope: new EffectScope(true /* detached */),
            render: null,
            proxy: null,
            exposed: null,
            exposeProxy: null,
            withProxy: null,
            provides: parent ? parent.provides : Object.create(appContext.provides),
            accessCache: null,
            renderCache: [],
            // local resovled assets
            components: null,
            directives: null,
            // resolved props and emits options
            propsOptions: normalizePropsOptions(type, appContext),
            emitsOptions: normalizeEmitsOptions(type, appContext),
            // emit
            emit: null,
            emitted: null,
            // props default value
            propsDefaults: EMPTY_OBJ,
            // inheritAttrs
            inheritAttrs: type.inheritAttrs,
            // state
            ctx: EMPTY_OBJ,
            data: EMPTY_OBJ,
            props: EMPTY_OBJ,
            attrs: EMPTY_OBJ,
            slots: EMPTY_OBJ,
            refs: EMPTY_OBJ,
            setupState: EMPTY_OBJ,
            setupContext: null,
            // suspense related
            suspense,
            suspenseId: suspense ? suspense.pendingId : 0,
            asyncDep: null,
            asyncResolved: false,
            // lifecycle hooks
            // not using enums here because it results in computed properties
            isMounted: false,
            isUnmounted: false,
            isDeactivated: false,
            bc: null,
            c: null,
            bm: null,
            m: null,
            bu: null,
            u: null,
            um: null,
            bum: null,
            da: null,
            a: null,
            rtg: null,
            rtc: null,
            ec: null,
            sp: null
        };
        {
            instance.ctx = { _: instance };
        }
        instance.root = parent ? parent.root : instance;
        instance.emit = emit$1.bind(null, instance);
        // apply custom element special handling
        if (vnode.ce) {
            vnode.ce(instance);
        }
        return instance;
    }
    let currentInstance = null;
    const getCurrentInstance = () => currentInstance || currentRenderingInstance;
    const setCurrentInstance = (instance) => {
        currentInstance = instance;
        instance.scope.on();
    };
    const unsetCurrentInstance = () => {
        currentInstance && currentInstance.scope.off();
        currentInstance = null;
    };
    function isStatefulComponent(instance) {
        return instance.vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */;
    }
    let isInSSRComponentSetup = false;
    function setupComponent(instance, isSSR = false) {
        isInSSRComponentSetup = isSSR;
        const { props, children } = instance.vnode;
        const isStateful = isStatefulComponent(instance);
        initProps(instance, props, isStateful, isSSR);
        initSlots(instance, children);
        const setupResult = isStateful
            ? setupStatefulComponent(instance, isSSR)
            : undefined;
        isInSSRComponentSetup = false;
        return setupResult;
    }
    function setupStatefulComponent(instance, isSSR) {
        const Component = instance.type;
        // 0. create render proxy property access cache
        instance.accessCache = Object.create(null);
        // 1. create public instance / render proxy
        // also mark it raw so it's never observed
        instance.proxy = markRaw(new Proxy(instance.ctx, PublicInstanceProxyHandlers));
        // 2. call setup()
        const { setup } = Component;
        if (setup) {
            const setupContext = (instance.setupContext =
                setup.length > 1 ? createSetupContext(instance) : null);
            setCurrentInstance(instance);
            pauseTracking();
            const setupResult = callWithErrorHandling(setup, instance, 0 /* SETUP_FUNCTION */, [instance.props, setupContext]);
            resetTracking();
            unsetCurrentInstance();
            if (isPromise(setupResult)) {
                setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
                if (isSSR) {
                    // return the promise so server-renderer can wait on it
                    return setupResult
                        .then((resolvedResult) => {
                        handleSetupResult(instance, resolvedResult, isSSR);
                    })
                        .catch(e => {
                        handleError(e, instance, 0 /* SETUP_FUNCTION */);
                    });
                }
                else {
                    // async setup returned Promise.
                    // bail here and wait for re-entry.
                    instance.asyncDep = setupResult;
                }
            }
            else {
                handleSetupResult(instance, setupResult, isSSR);
            }
        }
        else {
            finishComponentSetup(instance, isSSR);
        }
    }
    function handleSetupResult(instance, setupResult, isSSR) {
        if (isFunction(setupResult)) {
            // setup returned an inline render function
            if (instance.type.__ssrInlineRender) {
                // when the function's name is `ssrRender` (compiled by SFC inline mode),
                // set it as ssrRender instead.
                instance.ssrRender = setupResult;
            }
            else {
                instance.render = setupResult;
            }
        }
        else if (isObject(setupResult)) {
            // setup returned bindings.
            // assuming a render function compiled from template is present.
            if (__VUE_PROD_DEVTOOLS__) {
                instance.devtoolsRawSetupState = setupResult;
            }
            instance.setupState = proxyRefs(setupResult);
        }
        else ;
        finishComponentSetup(instance, isSSR);
    }
    let compile;
    function finishComponentSetup(instance, isSSR, skipOptions) {
        const Component = instance.type;
        // template / render function normalization
        // could be already set when returned from setup()
        if (!instance.render) {
            // only do on-the-fly compile if not in SSR - SSR on-the-fly compilation
            // is done by server-renderer
            if (!isSSR && compile && !Component.render) {
                const template = Component.template;
                if (template) {
                    const { isCustomElement, compilerOptions } = instance.appContext.config;
                    const { delimiters, compilerOptions: componentCompilerOptions } = Component;
                    const finalCompilerOptions = extend(extend({
                        isCustomElement,
                        delimiters
                    }, compilerOptions), componentCompilerOptions);
                    Component.render = compile(template, finalCompilerOptions);
                }
            }
            instance.render = (Component.render || NOOP);
        }
        // support for 2.x options
        if (__VUE_OPTIONS_API__ && !(false )) {
            setCurrentInstance(instance);
            pauseTracking();
            applyOptions(instance);
            resetTracking();
            unsetCurrentInstance();
        }
    }
    function createAttrsProxy(instance) {
        return new Proxy(instance.attrs, {
                get(target, key) {
                    track(instance, "get" /* GET */, '$attrs');
                    return target[key];
                }
            });
    }
    function createSetupContext(instance) {
        const expose = exposed => {
            instance.exposed = exposed || {};
        };
        let attrs;
        {
            return {
                get attrs() {
                    return attrs || (attrs = createAttrsProxy(instance));
                },
                slots: instance.slots,
                emit: instance.emit,
                expose
            };
        }
    }
    function getExposeProxy(instance) {
        if (instance.exposed) {
            return (instance.exposeProxy ||
                (instance.exposeProxy = new Proxy(proxyRefs(markRaw(instance.exposed)), {
                    get(target, key) {
                        if (key in target) {
                            return target[key];
                        }
                        else if (key in publicPropertiesMap) {
                            return publicPropertiesMap[key](instance);
                        }
                    }
                })));
        }
    }
    function getComponentName(Component) {
        return isFunction(Component)
            ? Component.displayName || Component.name
            : Component.name;
    }
    function isClassComponent(value) {
        return isFunction(value) && '__vccOpts' in value;
    }

    const computed = ((getterOrOptions, debugOptions) => {
        // @ts-ignore
        return computed$1(getterOrOptions, debugOptions, isInSSRComponentSetup);
    });

    // Actual implementation
    function h(type, propsOrChildren, children) {
        const l = arguments.length;
        if (l === 2) {
            if (isObject(propsOrChildren) && !isArray(propsOrChildren)) {
                // single vnode without props
                if (isVNode(propsOrChildren)) {
                    return createVNode(type, null, [propsOrChildren]);
                }
                // props without children
                return createVNode(type, propsOrChildren);
            }
            else {
                // omit props
                return createVNode(type, null, propsOrChildren);
            }
        }
        else {
            if (l > 3) {
                children = Array.prototype.slice.call(arguments, 2);
            }
            else if (l === 3 && isVNode(children)) {
                children = [children];
            }
            return createVNode(type, propsOrChildren, children);
        }
    }

    // Core API ------------------------------------------------------------------
    const version = "3.2.31";

    const svgNS = 'http://www.w3.org/2000/svg';
    const doc = (typeof document !== 'undefined' ? document : null);
    const templateContainer = doc && doc.createElement('template');
    const nodeOps = {
        insert: (child, parent, anchor) => {
            parent.insertBefore(child, anchor || null);
        },
        remove: child => {
            const parent = child.parentNode;
            if (parent) {
                parent.removeChild(child);
            }
        },
        createElement: (tag, isSVG, is, props) => {
            const el = isSVG
                ? doc.createElementNS(svgNS, tag)
                : doc.createElement(tag, is ? { is } : undefined);
            if (tag === 'select' && props && props.multiple != null) {
                el.setAttribute('multiple', props.multiple);
            }
            return el;
        },
        createText: text => doc.createTextNode(text),
        createComment: text => doc.createComment(text),
        setText: (node, text) => {
            node.nodeValue = text;
        },
        setElementText: (el, text) => {
            el.textContent = text;
        },
        parentNode: node => node.parentNode,
        nextSibling: node => node.nextSibling,
        querySelector: selector => doc.querySelector(selector),
        setScopeId(el, id) {
            el.setAttribute(id, '');
        },
        cloneNode(el) {
            const cloned = el.cloneNode(true);
            // #3072
            // - in `patchDOMProp`, we store the actual value in the `el._value` property.
            // - normally, elements using `:value` bindings will not be hoisted, but if
            //   the bound value is a constant, e.g. `:value="true"` - they do get
            //   hoisted.
            // - in production, hoisted nodes are cloned when subsequent inserts, but
            //   cloneNode() does not copy the custom property we attached.
            // - This may need to account for other custom DOM properties we attach to
            //   elements in addition to `_value` in the future.
            if (`_value` in el) {
                cloned._value = el._value;
            }
            return cloned;
        },
        // __UNSAFE__
        // Reason: innerHTML.
        // Static content here can only come from compiled templates.
        // As long as the user only uses trusted templates, this is safe.
        insertStaticContent(content, parent, anchor, isSVG, start, end) {
            // <parent> before | first ... last | anchor </parent>
            const before = anchor ? anchor.previousSibling : parent.lastChild;
            // #5308 can only take cached path if:
            // - has a single root node
            // - nextSibling info is still available
            if (start && (start === end || start.nextSibling)) {
                // cached
                while (true) {
                    parent.insertBefore(start.cloneNode(true), anchor);
                    if (start === end || !(start = start.nextSibling))
                        break;
                }
            }
            else {
                // fresh insert
                templateContainer.innerHTML = isSVG ? `<svg>${content}</svg>` : content;
                const template = templateContainer.content;
                if (isSVG) {
                    // remove outer svg wrapper
                    const wrapper = template.firstChild;
                    while (wrapper.firstChild) {
                        template.appendChild(wrapper.firstChild);
                    }
                    template.removeChild(wrapper);
                }
                parent.insertBefore(template, anchor);
            }
            return [
                // first
                before ? before.nextSibling : parent.firstChild,
                // last
                anchor ? anchor.previousSibling : parent.lastChild
            ];
        }
    };

    // compiler should normalize class + :class bindings on the same element
    // into a single binding ['staticClass', dynamic]
    function patchClass(el, value, isSVG) {
        // directly setting className should be faster than setAttribute in theory
        // if this is an element during a transition, take the temporary transition
        // classes into account.
        const transitionClasses = el._vtc;
        if (transitionClasses) {
            value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(' ');
        }
        if (value == null) {
            el.removeAttribute('class');
        }
        else if (isSVG) {
            el.setAttribute('class', value);
        }
        else {
            el.className = value;
        }
    }

    function patchStyle(el, prev, next) {
        const style = el.style;
        const isCssString = isString(next);
        if (next && !isCssString) {
            for (const key in next) {
                setStyle(style, key, next[key]);
            }
            if (prev && !isString(prev)) {
                for (const key in prev) {
                    if (next[key] == null) {
                        setStyle(style, key, '');
                    }
                }
            }
        }
        else {
            const currentDisplay = style.display;
            if (isCssString) {
                if (prev !== next) {
                    style.cssText = next;
                }
            }
            else if (prev) {
                el.removeAttribute('style');
            }
            // indicates that the `display` of the element is controlled by `v-show`,
            // so we always keep the current `display` value regardless of the `style`
            // value, thus handing over control to `v-show`.
            if ('_vod' in el) {
                style.display = currentDisplay;
            }
        }
    }
    const importantRE = /\s*!important$/;
    function setStyle(style, name, val) {
        if (isArray(val)) {
            val.forEach(v => setStyle(style, name, v));
        }
        else {
            if (name.startsWith('--')) {
                // custom property definition
                style.setProperty(name, val);
            }
            else {
                const prefixed = autoPrefix(style, name);
                if (importantRE.test(val)) {
                    // !important
                    style.setProperty(hyphenate(prefixed), val.replace(importantRE, ''), 'important');
                }
                else {
                    style[prefixed] = val;
                }
            }
        }
    }
    const prefixes = ['Webkit', 'Moz', 'ms'];
    const prefixCache = {};
    function autoPrefix(style, rawName) {
        const cached = prefixCache[rawName];
        if (cached) {
            return cached;
        }
        let name = camelize(rawName);
        if (name !== 'filter' && name in style) {
            return (prefixCache[rawName] = name);
        }
        name = capitalize(name);
        for (let i = 0; i < prefixes.length; i++) {
            const prefixed = prefixes[i] + name;
            if (prefixed in style) {
                return (prefixCache[rawName] = prefixed);
            }
        }
        return rawName;
    }

    const xlinkNS = 'http://www.w3.org/1999/xlink';
    function patchAttr(el, key, value, isSVG, instance) {
        if (isSVG && key.startsWith('xlink:')) {
            if (value == null) {
                el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
            }
            else {
                el.setAttributeNS(xlinkNS, key, value);
            }
        }
        else {
            // note we are only checking boolean attributes that don't have a
            // corresponding dom prop of the same name here.
            const isBoolean = isSpecialBooleanAttr(key);
            if (value == null || (isBoolean && !includeBooleanAttr(value))) {
                el.removeAttribute(key);
            }
            else {
                el.setAttribute(key, isBoolean ? '' : value);
            }
        }
    }

    // __UNSAFE__
    // functions. The user is responsible for using them with only trusted content.
    function patchDOMProp(el, key, value, 
    // the following args are passed only due to potential innerHTML/textContent
    // overriding existing VNodes, in which case the old tree must be properly
    // unmounted.
    prevChildren, parentComponent, parentSuspense, unmountChildren) {
        if (key === 'innerHTML' || key === 'textContent') {
            if (prevChildren) {
                unmountChildren(prevChildren, parentComponent, parentSuspense);
            }
            el[key] = value == null ? '' : value;
            return;
        }
        if (key === 'value' &&
            el.tagName !== 'PROGRESS' &&
            // custom elements may use _value internally
            !el.tagName.includes('-')) {
            // store value as _value as well since
            // non-string values will be stringified.
            el._value = value;
            const newValue = value == null ? '' : value;
            if (el.value !== newValue ||
                // #4956: always set for OPTION elements because its value falls back to
                // textContent if no value attribute is present. And setting .value for
                // OPTION has no side effect
                el.tagName === 'OPTION') {
                el.value = newValue;
            }
            if (value == null) {
                el.removeAttribute(key);
            }
            return;
        }
        if (value === '' || value == null) {
            const type = typeof el[key];
            if (type === 'boolean') {
                // e.g. <select multiple> compiles to { multiple: '' }
                el[key] = includeBooleanAttr(value);
                return;
            }
            else if (value == null && type === 'string') {
                // e.g. <div :id="null">
                el[key] = '';
                el.removeAttribute(key);
                return;
            }
            else if (type === 'number') {
                // e.g. <img :width="null">
                // the value of some IDL attr must be greater than 0, e.g. input.size = 0 -> error
                try {
                    el[key] = 0;
                }
                catch (_a) { }
                el.removeAttribute(key);
                return;
            }
        }
        // some properties perform value validation and throw
        try {
            el[key] = value;
        }
        catch (e) {
        }
    }

    // Async edge case fix requires storing an event listener's attach timestamp.
    let _getNow = Date.now;
    let skipTimestampCheck = false;
    if (typeof window !== 'undefined') {
        // Determine what event timestamp the browser is using. Annoyingly, the
        // timestamp can either be hi-res (relative to page load) or low-res
        // (relative to UNIX epoch), so in order to compare time we have to use the
        // same timestamp type when saving the flush timestamp.
        if (_getNow() > document.createEvent('Event').timeStamp) {
            // if the low-res timestamp which is bigger than the event timestamp
            // (which is evaluated AFTER) it means the event is using a hi-res timestamp,
            // and we need to use the hi-res version for event listeners as well.
            _getNow = () => performance.now();
        }
        // #3485: Firefox <= 53 has incorrect Event.timeStamp implementation
        // and does not fire microtasks in between event propagation, so safe to exclude.
        const ffMatch = navigator.userAgent.match(/firefox\/(\d+)/i);
        skipTimestampCheck = !!(ffMatch && Number(ffMatch[1]) <= 53);
    }
    // To avoid the overhead of repeatedly calling performance.now(), we cache
    // and use the same timestamp for all event listeners attached in the same tick.
    let cachedNow = 0;
    const p = Promise.resolve();
    const reset = () => {
        cachedNow = 0;
    };
    const getNow = () => cachedNow || (p.then(reset), (cachedNow = _getNow()));
    function addEventListener(el, event, handler, options) {
        el.addEventListener(event, handler, options);
    }
    function removeEventListener(el, event, handler, options) {
        el.removeEventListener(event, handler, options);
    }
    function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
        // vei = vue event invokers
        const invokers = el._vei || (el._vei = {});
        const existingInvoker = invokers[rawName];
        if (nextValue && existingInvoker) {
            // patch
            existingInvoker.value = nextValue;
        }
        else {
            const [name, options] = parseName(rawName);
            if (nextValue) {
                // add
                const invoker = (invokers[rawName] = createInvoker(nextValue, instance));
                addEventListener(el, name, invoker, options);
            }
            else if (existingInvoker) {
                // remove
                removeEventListener(el, name, existingInvoker, options);
                invokers[rawName] = undefined;
            }
        }
    }
    const optionsModifierRE = /(?:Once|Passive|Capture)$/;
    function parseName(name) {
        let options;
        if (optionsModifierRE.test(name)) {
            options = {};
            let m;
            while ((m = name.match(optionsModifierRE))) {
                name = name.slice(0, name.length - m[0].length);
                options[m[0].toLowerCase()] = true;
            }
        }
        return [hyphenate(name.slice(2)), options];
    }
    function createInvoker(initialValue, instance) {
        const invoker = (e) => {
            // async edge case #6566: inner click event triggers patch, event handler
            // attached to outer element during patch, and triggered again. This
            // happens because browsers fire microtask ticks between event propagation.
            // the solution is simple: we save the timestamp when a handler is attached,
            // and the handler would only fire if the event passed to it was fired
            // AFTER it was attached.
            const timeStamp = e.timeStamp || _getNow();
            if (skipTimestampCheck || timeStamp >= invoker.attached - 1) {
                callWithAsyncErrorHandling(patchStopImmediatePropagation(e, invoker.value), instance, 5 /* NATIVE_EVENT_HANDLER */, [e]);
            }
        };
        invoker.value = initialValue;
        invoker.attached = getNow();
        return invoker;
    }
    function patchStopImmediatePropagation(e, value) {
        if (isArray(value)) {
            const originalStop = e.stopImmediatePropagation;
            e.stopImmediatePropagation = () => {
                originalStop.call(e);
                e._stopped = true;
            };
            return value.map(fn => (e) => !e._stopped && fn && fn(e));
        }
        else {
            return value;
        }
    }

    const nativeOnRE = /^on[a-z]/;
    const patchProp = (el, key, prevValue, nextValue, isSVG = false, prevChildren, parentComponent, parentSuspense, unmountChildren) => {
        if (key === 'class') {
            patchClass(el, nextValue, isSVG);
        }
        else if (key === 'style') {
            patchStyle(el, prevValue, nextValue);
        }
        else if (isOn(key)) {
            // ignore v-model listeners
            if (!isModelListener(key)) {
                patchEvent(el, key, prevValue, nextValue, parentComponent);
            }
        }
        else if (key[0] === '.'
            ? ((key = key.slice(1)), true)
            : key[0] === '^'
                ? ((key = key.slice(1)), false)
                : shouldSetAsProp(el, key, nextValue, isSVG)) {
            patchDOMProp(el, key, nextValue, prevChildren, parentComponent, parentSuspense, unmountChildren);
        }
        else {
            // special case for <input v-model type="checkbox"> with
            // :true-value & :false-value
            // store value as dom properties since non-string values will be
            // stringified.
            if (key === 'true-value') {
                el._trueValue = nextValue;
            }
            else if (key === 'false-value') {
                el._falseValue = nextValue;
            }
            patchAttr(el, key, nextValue, isSVG);
        }
    };
    function shouldSetAsProp(el, key, value, isSVG) {
        if (isSVG) {
            // most keys must be set as attribute on svg elements to work
            // ...except innerHTML & textContent
            if (key === 'innerHTML' || key === 'textContent') {
                return true;
            }
            // or native onclick with function values
            if (key in el && nativeOnRE.test(key) && isFunction(value)) {
                return true;
            }
            return false;
        }
        // spellcheck and draggable are numerated attrs, however their
        // corresponding DOM properties are actually booleans - this leads to
        // setting it with a string "false" value leading it to be coerced to
        // `true`, so we need to always treat them as attributes.
        // Note that `contentEditable` doesn't have this problem: its DOM
        // property is also enumerated string values.
        if (key === 'spellcheck' || key === 'draggable') {
            return false;
        }
        // #1787, #2840 form property on form elements is readonly and must be set as
        // attribute.
        if (key === 'form') {
            return false;
        }
        // #1526 <input list> must be set as attribute
        if (key === 'list' && el.tagName === 'INPUT') {
            return false;
        }
        // #2766 <textarea type> must be set as attribute
        if (key === 'type' && el.tagName === 'TEXTAREA') {
            return false;
        }
        // native onclick with string value, must be set as attribute
        if (nativeOnRE.test(key) && isString(value)) {
            return false;
        }
        return key in el;
    }

    const rendererOptions = extend({ patchProp }, nodeOps);
    // lazy create the renderer - this makes core renderer logic tree-shakable
    // in case the user only imports reactivity utilities from Vue.
    let renderer;
    function ensureRenderer() {
        return (renderer ||
            (renderer = createRenderer(rendererOptions)));
    }
    const createApp = ((...args) => {
        const app = ensureRenderer().createApp(...args);
        const { mount } = app;
        app.mount = (containerOrSelector) => {
            const container = normalizeContainer(containerOrSelector);
            if (!container)
                return;
            const component = app._component;
            if (!isFunction(component) && !component.render && !component.template) {
                // __UNSAFE__
                // Reason: potential execution of JS expressions in in-DOM template.
                // The user must make sure the in-DOM template is trusted. If it's
                // rendered by the server, the template should not contain any user data.
                component.template = container.innerHTML;
            }
            // clear content before mounting
            container.innerHTML = '';
            const proxy = mount(container, false, container instanceof SVGElement);
            if (container instanceof Element) {
                container.removeAttribute('v-cloak');
                container.setAttribute('data-v-app', '');
            }
            return proxy;
        };
        return app;
    });
    function normalizeContainer(container) {
        if (isString(container)) {
            const res = document.querySelector(container);
            return res;
        }
        return container;
    }

    var _export_sfc = (sfc, props) => {
      const target = sfc.__vccOpts || sfc;
      for (const [key, val] of props) {
        target[key] = val;
      }
      return target;
    };

    const _sfc_main$1 = {};
    function _sfc_render$1(_ctx, _cache) {
      const _component_router_view = resolveComponent("router-view");
      return openBlock(), createBlock(_component_router_view);
    }
    var App = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1], ["__file", "App.vue"]]);

    function getDevtoolsGlobalHook() {
        return getTarget().__VUE_DEVTOOLS_GLOBAL_HOOK__;
    }
    function getTarget() {
        // @ts-ignore
        return (typeof navigator !== 'undefined' && typeof window !== 'undefined')
            ? window
            : typeof global !== 'undefined'
                ? global
                : {};
    }
    const isProxyAvailable = typeof Proxy === 'function';

    const HOOK_SETUP = 'devtools-plugin:setup';
    const HOOK_PLUGIN_SETTINGS_SET = 'plugin:settings:set';

    let supported;
    let perf;
    function isPerformanceSupported() {
        var _a;
        if (supported !== undefined) {
            return supported;
        }
        if (typeof window !== 'undefined' && window.performance) {
            supported = true;
            perf = window.performance;
        }
        else if (typeof global !== 'undefined' && ((_a = global.perf_hooks) === null || _a === void 0 ? void 0 : _a.performance)) {
            supported = true;
            perf = global.perf_hooks.performance;
        }
        else {
            supported = false;
        }
        return supported;
    }
    function now() {
        return isPerformanceSupported() ? perf.now() : Date.now();
    }

    class ApiProxy {
        constructor(plugin, hook) {
            this.target = null;
            this.targetQueue = [];
            this.onQueue = [];
            this.plugin = plugin;
            this.hook = hook;
            const defaultSettings = {};
            if (plugin.settings) {
                for (const id in plugin.settings) {
                    const item = plugin.settings[id];
                    defaultSettings[id] = item.defaultValue;
                }
            }
            const localSettingsSaveId = `__vue-devtools-plugin-settings__${plugin.id}`;
            let currentSettings = Object.assign({}, defaultSettings);
            try {
                const raw = localStorage.getItem(localSettingsSaveId);
                const data = JSON.parse(raw);
                Object.assign(currentSettings, data);
            }
            catch (e) {
                // noop
            }
            this.fallbacks = {
                getSettings() {
                    return currentSettings;
                },
                setSettings(value) {
                    try {
                        localStorage.setItem(localSettingsSaveId, JSON.stringify(value));
                    }
                    catch (e) {
                        // noop
                    }
                    currentSettings = value;
                },
                now() {
                    return now();
                },
            };
            if (hook) {
                hook.on(HOOK_PLUGIN_SETTINGS_SET, (pluginId, value) => {
                    if (pluginId === this.plugin.id) {
                        this.fallbacks.setSettings(value);
                    }
                });
            }
            this.proxiedOn = new Proxy({}, {
                get: (_target, prop) => {
                    if (this.target) {
                        return this.target.on[prop];
                    }
                    else {
                        return (...args) => {
                            this.onQueue.push({
                                method: prop,
                                args,
                            });
                        };
                    }
                },
            });
            this.proxiedTarget = new Proxy({}, {
                get: (_target, prop) => {
                    if (this.target) {
                        return this.target[prop];
                    }
                    else if (prop === 'on') {
                        return this.proxiedOn;
                    }
                    else if (Object.keys(this.fallbacks).includes(prop)) {
                        return (...args) => {
                            this.targetQueue.push({
                                method: prop,
                                args,
                                resolve: () => { },
                            });
                            return this.fallbacks[prop](...args);
                        };
                    }
                    else {
                        return (...args) => {
                            return new Promise(resolve => {
                                this.targetQueue.push({
                                    method: prop,
                                    args,
                                    resolve,
                                });
                            });
                        };
                    }
                },
            });
        }
        async setRealTarget(target) {
            this.target = target;
            for (const item of this.onQueue) {
                this.target.on[item.method](...item.args);
            }
            for (const item of this.targetQueue) {
                item.resolve(await this.target[item.method](...item.args));
            }
        }
    }

    function setupDevtoolsPlugin(pluginDescriptor, setupFn) {
        const descriptor = pluginDescriptor;
        const target = getTarget();
        const hook = getDevtoolsGlobalHook();
        const enableProxy = isProxyAvailable && descriptor.enableEarlyProxy;
        if (hook && (target.__VUE_DEVTOOLS_PLUGIN_API_AVAILABLE__ || !enableProxy)) {
            hook.emit(HOOK_SETUP, pluginDescriptor, setupFn);
        }
        else {
            const proxy = enableProxy ? new ApiProxy(descriptor, hook) : null;
            const list = target.__VUE_DEVTOOLS_PLUGINS__ = target.__VUE_DEVTOOLS_PLUGINS__ || [];
            list.push({
                pluginDescriptor: descriptor,
                setupFn,
                proxy,
            });
            if (proxy)
                setupFn(proxy.proxiedTarget);
        }
    }

    /*!
      * vue-router v4.0.14
      * (c) 2022 Eduardo San Martin Morote
      * @license MIT
      */

    const hasSymbol = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';
    const PolySymbol = (name) => 
    // vr = vue router
    hasSymbol
        ? Symbol(name)
        : ('_vr_') + name;
    // rvlm = Router View Location Matched
    /**
     * RouteRecord being rendered by the closest ancestor Router View. Used for
     * `onBeforeRouteUpdate` and `onBeforeRouteLeave`. rvlm stands for Router View
     * Location Matched
     *
     * @internal
     */
    const matchedRouteKey = /*#__PURE__*/ PolySymbol('rvlm');
    /**
     * Allows overriding the router view depth to control which component in
     * `matched` is rendered. rvd stands for Router View Depth
     *
     * @internal
     */
    const viewDepthKey = /*#__PURE__*/ PolySymbol('rvd');
    /**
     * Allows overriding the router instance returned by `useRouter` in tests. r
     * stands for router
     *
     * @internal
     */
    const routerKey = /*#__PURE__*/ PolySymbol('r');
    /**
     * Allows overriding the current route returned by `useRoute` in tests. rl
     * stands for route location
     *
     * @internal
     */
    const routeLocationKey = /*#__PURE__*/ PolySymbol('rl');
    /**
     * Allows overriding the current route used by router-view. Internally this is
     * used when the `route` prop is passed.
     *
     * @internal
     */
    const routerViewLocationKey = /*#__PURE__*/ PolySymbol('rvl');

    const isBrowser = typeof window !== 'undefined';

    function isESModule(obj) {
        return obj.__esModule || (hasSymbol && obj[Symbol.toStringTag] === 'Module');
    }
    const assign = Object.assign;
    function applyToParams(fn, params) {
        const newParams = {};
        for (const key in params) {
            const value = params[key];
            newParams[key] = Array.isArray(value) ? value.map(fn) : fn(value);
        }
        return newParams;
    }
    const noop = () => { };

    const TRAILING_SLASH_RE = /\/$/;
    const removeTrailingSlash = (path) => path.replace(TRAILING_SLASH_RE, '');
    /**
     * Transforms an URI into a normalized history location
     *
     * @param parseQuery
     * @param location - URI to normalize
     * @param currentLocation - current absolute location. Allows resolving relative
     * paths. Must start with `/`. Defaults to `/`
     * @returns a normalized history location
     */
    function parseURL(parseQuery, location, currentLocation = '/') {
        let path, query = {}, searchString = '', hash = '';
        // Could use URL and URLSearchParams but IE 11 doesn't support it
        const searchPos = location.indexOf('?');
        const hashPos = location.indexOf('#', searchPos > -1 ? searchPos : 0);
        if (searchPos > -1) {
            path = location.slice(0, searchPos);
            searchString = location.slice(searchPos + 1, hashPos > -1 ? hashPos : location.length);
            query = parseQuery(searchString);
        }
        if (hashPos > -1) {
            path = path || location.slice(0, hashPos);
            // keep the # character
            hash = location.slice(hashPos, location.length);
        }
        // no search and no query
        path = resolveRelativePath(path != null ? path : location, currentLocation);
        // empty path means a relative query or hash `?foo=f`, `#thing`
        return {
            fullPath: path + (searchString && '?') + searchString + hash,
            path,
            query,
            hash,
        };
    }
    /**
     * Stringifies a URL object
     *
     * @param stringifyQuery
     * @param location
     */
    function stringifyURL(stringifyQuery, location) {
        const query = location.query ? stringifyQuery(location.query) : '';
        return location.path + (query && '?') + query + (location.hash || '');
    }
    /**
     * Strips off the base from the beginning of a location.pathname in a non
     * case-sensitive way.
     *
     * @param pathname - location.pathname
     * @param base - base to strip off
     */
    function stripBase(pathname, base) {
        // no base or base is not found at the beginning
        if (!base || !pathname.toLowerCase().startsWith(base.toLowerCase()))
            return pathname;
        return pathname.slice(base.length) || '/';
    }
    /**
     * Checks if two RouteLocation are equal. This means that both locations are
     * pointing towards the same {@link RouteRecord} and that all `params`, `query`
     * parameters and `hash` are the same
     *
     * @param a - first {@link RouteLocation}
     * @param b - second {@link RouteLocation}
     */
    function isSameRouteLocation(stringifyQuery, a, b) {
        const aLastIndex = a.matched.length - 1;
        const bLastIndex = b.matched.length - 1;
        return (aLastIndex > -1 &&
            aLastIndex === bLastIndex &&
            isSameRouteRecord(a.matched[aLastIndex], b.matched[bLastIndex]) &&
            isSameRouteLocationParams(a.params, b.params) &&
            stringifyQuery(a.query) === stringifyQuery(b.query) &&
            a.hash === b.hash);
    }
    /**
     * Check if two `RouteRecords` are equal. Takes into account aliases: they are
     * considered equal to the `RouteRecord` they are aliasing.
     *
     * @param a - first {@link RouteRecord}
     * @param b - second {@link RouteRecord}
     */
    function isSameRouteRecord(a, b) {
        // since the original record has an undefined value for aliasOf
        // but all aliases point to the original record, this will always compare
        // the original record
        return (a.aliasOf || a) === (b.aliasOf || b);
    }
    function isSameRouteLocationParams(a, b) {
        if (Object.keys(a).length !== Object.keys(b).length)
            return false;
        for (const key in a) {
            if (!isSameRouteLocationParamsValue(a[key], b[key]))
                return false;
        }
        return true;
    }
    function isSameRouteLocationParamsValue(a, b) {
        return Array.isArray(a)
            ? isEquivalentArray(a, b)
            : Array.isArray(b)
                ? isEquivalentArray(b, a)
                : a === b;
    }
    /**
     * Check if two arrays are the same or if an array with one single entry is the
     * same as another primitive value. Used to check query and parameters
     *
     * @param a - array of values
     * @param b - array of values or a single value
     */
    function isEquivalentArray(a, b) {
        return Array.isArray(b)
            ? a.length === b.length && a.every((value, i) => value === b[i])
            : a.length === 1 && a[0] === b;
    }
    /**
     * Resolves a relative path that starts with `.`.
     *
     * @param to - path location we are resolving
     * @param from - currentLocation.path, should start with `/`
     */
    function resolveRelativePath(to, from) {
        if (to.startsWith('/'))
            return to;
        if (!to)
            return from;
        const fromSegments = from.split('/');
        const toSegments = to.split('/');
        let position = fromSegments.length - 1;
        let toPosition;
        let segment;
        for (toPosition = 0; toPosition < toSegments.length; toPosition++) {
            segment = toSegments[toPosition];
            // can't go below zero
            if (position === 1 || segment === '.')
                continue;
            if (segment === '..')
                position--;
            // found something that is not relative path
            else
                break;
        }
        return (fromSegments.slice(0, position).join('/') +
            '/' +
            toSegments
                .slice(toPosition - (toPosition === toSegments.length ? 1 : 0))
                .join('/'));
    }

    var NavigationType;
    (function (NavigationType) {
        NavigationType["pop"] = "pop";
        NavigationType["push"] = "push";
    })(NavigationType || (NavigationType = {}));
    var NavigationDirection;
    (function (NavigationDirection) {
        NavigationDirection["back"] = "back";
        NavigationDirection["forward"] = "forward";
        NavigationDirection["unknown"] = "";
    })(NavigationDirection || (NavigationDirection = {}));
    // Generic utils
    /**
     * Normalizes a base by removing any trailing slash and reading the base tag if
     * present.
     *
     * @param base - base to normalize
     */
    function normalizeBase(base) {
        if (!base) {
            if (isBrowser) {
                // respect <base> tag
                const baseEl = document.querySelector('base');
                base = (baseEl && baseEl.getAttribute('href')) || '/';
                // strip full URL origin
                base = base.replace(/^\w+:\/\/[^\/]+/, '');
            }
            else {
                base = '/';
            }
        }
        // ensure leading slash when it was removed by the regex above avoid leading
        // slash with hash because the file could be read from the disk like file://
        // and the leading slash would cause problems
        if (base[0] !== '/' && base[0] !== '#')
            base = '/' + base;
        // remove the trailing slash so all other method can just do `base + fullPath`
        // to build an href
        return removeTrailingSlash(base);
    }
    // remove any character before the hash
    const BEFORE_HASH_RE = /^[^#]+#/;
    function createHref(base, location) {
        return base.replace(BEFORE_HASH_RE, '#') + location;
    }

    function getElementPosition(el, offset) {
        const docRect = document.documentElement.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        return {
            behavior: offset.behavior,
            left: elRect.left - docRect.left - (offset.left || 0),
            top: elRect.top - docRect.top - (offset.top || 0),
        };
    }
    const computeScrollPosition = () => ({
        left: window.pageXOffset,
        top: window.pageYOffset,
    });
    function scrollToPosition(position) {
        let scrollToOptions;
        if ('el' in position) {
            const positionEl = position.el;
            const isIdSelector = typeof positionEl === 'string' && positionEl.startsWith('#');
            const el = typeof positionEl === 'string'
                ? isIdSelector
                    ? document.getElementById(positionEl.slice(1))
                    : document.querySelector(positionEl)
                : positionEl;
            if (!el) {
                return;
            }
            scrollToOptions = getElementPosition(el, position);
        }
        else {
            scrollToOptions = position;
        }
        if ('scrollBehavior' in document.documentElement.style)
            window.scrollTo(scrollToOptions);
        else {
            window.scrollTo(scrollToOptions.left != null ? scrollToOptions.left : window.pageXOffset, scrollToOptions.top != null ? scrollToOptions.top : window.pageYOffset);
        }
    }
    function getScrollKey(path, delta) {
        const position = history.state ? history.state.position - delta : -1;
        return position + path;
    }
    const scrollPositions = new Map();
    function saveScrollPosition(key, scrollPosition) {
        scrollPositions.set(key, scrollPosition);
    }
    function getSavedScrollPosition(key) {
        const scroll = scrollPositions.get(key);
        // consume it so it's not used again
        scrollPositions.delete(key);
        return scroll;
    }
    // TODO: RFC about how to save scroll position
    /**
     * ScrollBehavior instance used by the router to compute and restore the scroll
     * position when navigating.
     */
    // export interface ScrollHandler<ScrollPositionEntry extends HistoryStateValue, ScrollPosition extends ScrollPositionEntry> {
    //   // returns a scroll position that can be saved in history
    //   compute(): ScrollPositionEntry
    //   // can take an extended ScrollPositionEntry
    //   scroll(position: ScrollPosition): void
    // }
    // export const scrollHandler: ScrollHandler<ScrollPosition> = {
    //   compute: computeScroll,
    //   scroll: scrollToPosition,
    // }

    let createBaseLocation = () => location.protocol + '//' + location.host;
    /**
     * Creates a normalized history location from a window.location object
     * @param location -
     */
    function createCurrentLocation(base, location) {
        const { pathname, search, hash } = location;
        // allows hash bases like #, /#, #/, #!, #!/, /#!/, or even /folder#end
        const hashPos = base.indexOf('#');
        if (hashPos > -1) {
            let slicePos = hash.includes(base.slice(hashPos))
                ? base.slice(hashPos).length
                : 1;
            let pathFromHash = hash.slice(slicePos);
            // prepend the starting slash to hash so the url starts with /#
            if (pathFromHash[0] !== '/')
                pathFromHash = '/' + pathFromHash;
            return stripBase(pathFromHash, '');
        }
        const path = stripBase(pathname, base);
        return path + search + hash;
    }
    function useHistoryListeners(base, historyState, currentLocation, replace) {
        let listeners = [];
        let teardowns = [];
        // TODO: should it be a stack? a Dict. Check if the popstate listener
        // can trigger twice
        let pauseState = null;
        const popStateHandler = ({ state, }) => {
            const to = createCurrentLocation(base, location);
            const from = currentLocation.value;
            const fromState = historyState.value;
            let delta = 0;
            if (state) {
                currentLocation.value = to;
                historyState.value = state;
                // ignore the popstate and reset the pauseState
                if (pauseState && pauseState === from) {
                    pauseState = null;
                    return;
                }
                delta = fromState ? state.position - fromState.position : 0;
            }
            else {
                replace(to);
            }
            // console.log({ deltaFromCurrent })
            // Here we could also revert the navigation by calling history.go(-delta)
            // this listener will have to be adapted to not trigger again and to wait for the url
            // to be updated before triggering the listeners. Some kind of validation function would also
            // need to be passed to the listeners so the navigation can be accepted
            // call all listeners
            listeners.forEach(listener => {
                listener(currentLocation.value, from, {
                    delta,
                    type: NavigationType.pop,
                    direction: delta
                        ? delta > 0
                            ? NavigationDirection.forward
                            : NavigationDirection.back
                        : NavigationDirection.unknown,
                });
            });
        };
        function pauseListeners() {
            pauseState = currentLocation.value;
        }
        function listen(callback) {
            // setup the listener and prepare teardown callbacks
            listeners.push(callback);
            const teardown = () => {
                const index = listeners.indexOf(callback);
                if (index > -1)
                    listeners.splice(index, 1);
            };
            teardowns.push(teardown);
            return teardown;
        }
        function beforeUnloadListener() {
            const { history } = window;
            if (!history.state)
                return;
            history.replaceState(assign({}, history.state, { scroll: computeScrollPosition() }), '');
        }
        function destroy() {
            for (const teardown of teardowns)
                teardown();
            teardowns = [];
            window.removeEventListener('popstate', popStateHandler);
            window.removeEventListener('beforeunload', beforeUnloadListener);
        }
        // setup the listeners and prepare teardown callbacks
        window.addEventListener('popstate', popStateHandler);
        window.addEventListener('beforeunload', beforeUnloadListener);
        return {
            pauseListeners,
            listen,
            destroy,
        };
    }
    /**
     * Creates a state object
     */
    function buildState(back, current, forward, replaced = false, computeScroll = false) {
        return {
            back,
            current,
            forward,
            replaced,
            position: window.history.length,
            scroll: computeScroll ? computeScrollPosition() : null,
        };
    }
    function useHistoryStateNavigation(base) {
        const { history, location } = window;
        // private variables
        const currentLocation = {
            value: createCurrentLocation(base, location),
        };
        const historyState = { value: history.state };
        // build current history entry as this is a fresh navigation
        if (!historyState.value) {
            changeLocation(currentLocation.value, {
                back: null,
                current: currentLocation.value,
                forward: null,
                // the length is off by one, we need to decrease it
                position: history.length - 1,
                replaced: true,
                // don't add a scroll as the user may have an anchor and we want
                // scrollBehavior to be triggered without a saved position
                scroll: null,
            }, true);
        }
        function changeLocation(to, state, replace) {
            /**
             * if a base tag is provided and we are on a normal domain, we have to
             * respect the provided `base` attribute because pushState() will use it and
             * potentially erase anything before the `#` like at
             * https://github.com/vuejs/router/issues/685 where a base of
             * `/folder/#` but a base of `/` would erase the `/folder/` section. If
             * there is no host, the `<base>` tag makes no sense and if there isn't a
             * base tag we can just use everything after the `#`.
             */
            const hashIndex = base.indexOf('#');
            const url = hashIndex > -1
                ? (location.host && document.querySelector('base')
                    ? base
                    : base.slice(hashIndex)) + to
                : createBaseLocation() + base + to;
            try {
                // BROWSER QUIRK
                // NOTE: Safari throws a SecurityError when calling this function 100 times in 30 seconds
                history[replace ? 'replaceState' : 'pushState'](state, '', url);
                historyState.value = state;
            }
            catch (err) {
                {
                    console.error(err);
                }
                // Force the navigation, this also resets the call count
                location[replace ? 'replace' : 'assign'](url);
            }
        }
        function replace(to, data) {
            const state = assign({}, history.state, buildState(historyState.value.back, 
            // keep back and forward entries but override current position
            to, historyState.value.forward, true), data, { position: historyState.value.position });
            changeLocation(to, state, true);
            currentLocation.value = to;
        }
        function push(to, data) {
            // Add to current entry the information of where we are going
            // as well as saving the current position
            const currentState = assign({}, 
            // use current history state to gracefully handle a wrong call to
            // history.replaceState
            // https://github.com/vuejs/router/issues/366
            historyState.value, history.state, {
                forward: to,
                scroll: computeScrollPosition(),
            });
            changeLocation(currentState.current, currentState, true);
            const state = assign({}, buildState(currentLocation.value, to, null), { position: currentState.position + 1 }, data);
            changeLocation(to, state, false);
            currentLocation.value = to;
        }
        return {
            location: currentLocation,
            state: historyState,
            push,
            replace,
        };
    }
    /**
     * Creates an HTML5 history. Most common history for single page applications.
     *
     * @param base -
     */
    function createWebHistory(base) {
        base = normalizeBase(base);
        const historyNavigation = useHistoryStateNavigation(base);
        const historyListeners = useHistoryListeners(base, historyNavigation.state, historyNavigation.location, historyNavigation.replace);
        function go(delta, triggerListeners = true) {
            if (!triggerListeners)
                historyListeners.pauseListeners();
            history.go(delta);
        }
        const routerHistory = assign({
            // it's overridden right after
            location: '',
            base,
            go,
            createHref: createHref.bind(null, base),
        }, historyNavigation, historyListeners);
        Object.defineProperty(routerHistory, 'location', {
            enumerable: true,
            get: () => historyNavigation.location.value,
        });
        Object.defineProperty(routerHistory, 'state', {
            enumerable: true,
            get: () => historyNavigation.state.value,
        });
        return routerHistory;
    }

    /**
     * Creates a hash history. Useful for web applications with no host (e.g.
     * `file://`) or when configuring a server to handle any URL is not possible.
     *
     * @param base - optional base to provide. Defaults to `location.pathname +
     * location.search` If there is a `<base>` tag in the `head`, its value will be
     * ignored in favor of this parameter **but note it affects all the
     * history.pushState() calls**, meaning that if you use a `<base>` tag, it's
     * `href` value **has to match this parameter** (ignoring anything after the
     * `#`).
     *
     * @example
     * ```js
     * // at https://example.com/folder
     * createWebHashHistory() // gives a url of `https://example.com/folder#`
     * createWebHashHistory('/folder/') // gives a url of `https://example.com/folder/#`
     * // if the `#` is provided in the base, it won't be added by `createWebHashHistory`
     * createWebHashHistory('/folder/#/app/') // gives a url of `https://example.com/folder/#/app/`
     * // you should avoid doing this because it changes the original url and breaks copying urls
     * createWebHashHistory('/other-folder/') // gives a url of `https://example.com/other-folder/#`
     *
     * // at file:///usr/etc/folder/index.html
     * // for locations with no `host`, the base is ignored
     * createWebHashHistory('/iAmIgnored') // gives a url of `file:///usr/etc/folder/index.html#`
     * ```
     */
    function createWebHashHistory(base) {
        // Make sure this implementation is fine in terms of encoding, specially for IE11
        // for `file://`, directly use the pathname and ignore the base
        // location.pathname contains an initial `/` even at the root: `https://example.com`
        base = location.host ? base || location.pathname + location.search : '';
        // allow the user to provide a `#` in the middle: `/base/#/app`
        if (!base.includes('#'))
            base += '#';
        return createWebHistory(base);
    }

    function isRouteLocation(route) {
        return typeof route === 'string' || (route && typeof route === 'object');
    }
    function isRouteName(name) {
        return typeof name === 'string' || typeof name === 'symbol';
    }

    /**
     * Initial route location where the router is. Can be used in navigation guards
     * to differentiate the initial navigation.
     *
     * @example
     * ```js
     * import { START_LOCATION } from 'vue-router'
     *
     * router.beforeEach((to, from) => {
     *   if (from === START_LOCATION) {
     *     // initial navigation
     *   }
     * })
     * ```
     */
    const START_LOCATION_NORMALIZED = {
        path: '/',
        name: undefined,
        params: {},
        query: {},
        hash: '',
        fullPath: '/',
        matched: [],
        meta: {},
        redirectedFrom: undefined,
    };

    const NavigationFailureSymbol = /*#__PURE__*/ PolySymbol('nf');
    /**
     * Enumeration with all possible types for navigation failures. Can be passed to
     * {@link isNavigationFailure} to check for specific failures.
     */
    var NavigationFailureType;
    (function (NavigationFailureType) {
        /**
         * An aborted navigation is a navigation that failed because a navigation
         * guard returned `false` or called `next(false)`
         */
        NavigationFailureType[NavigationFailureType["aborted"] = 4] = "aborted";
        /**
         * A cancelled navigation is a navigation that failed because a more recent
         * navigation finished started (not necessarily finished).
         */
        NavigationFailureType[NavigationFailureType["cancelled"] = 8] = "cancelled";
        /**
         * A duplicated navigation is a navigation that failed because it was
         * initiated while already being at the exact same location.
         */
        NavigationFailureType[NavigationFailureType["duplicated"] = 16] = "duplicated";
    })(NavigationFailureType || (NavigationFailureType = {}));
    function createRouterError(type, params) {
        // keep full error messages in cjs versions
        {
            return assign(new Error(), {
                type,
                [NavigationFailureSymbol]: true,
            }, params);
        }
    }
    function isNavigationFailure(error, type) {
        return (error instanceof Error &&
            NavigationFailureSymbol in error &&
            (type == null || !!(error.type & type)));
    }

    // default pattern for a param: non greedy everything but /
    const BASE_PARAM_PATTERN = '[^/]+?';
    const BASE_PATH_PARSER_OPTIONS = {
        sensitive: false,
        strict: false,
        start: true,
        end: true,
    };
    // Special Regex characters that must be escaped in static tokens
    const REGEX_CHARS_RE = /[.+*?^${}()[\]/\\]/g;
    /**
     * Creates a path parser from an array of Segments (a segment is an array of Tokens)
     *
     * @param segments - array of segments returned by tokenizePath
     * @param extraOptions - optional options for the regexp
     * @returns a PathParser
     */
    function tokensToParser(segments, extraOptions) {
        const options = assign({}, BASE_PATH_PARSER_OPTIONS, extraOptions);
        // the amount of scores is the same as the length of segments except for the root segment "/"
        const score = [];
        // the regexp as a string
        let pattern = options.start ? '^' : '';
        // extracted keys
        const keys = [];
        for (const segment of segments) {
            // the root segment needs special treatment
            const segmentScores = segment.length ? [] : [90 /* Root */];
            // allow trailing slash
            if (options.strict && !segment.length)
                pattern += '/';
            for (let tokenIndex = 0; tokenIndex < segment.length; tokenIndex++) {
                const token = segment[tokenIndex];
                // resets the score if we are inside a sub segment /:a-other-:b
                let subSegmentScore = 40 /* Segment */ +
                    (options.sensitive ? 0.25 /* BonusCaseSensitive */ : 0);
                if (token.type === 0 /* Static */) {
                    // prepend the slash if we are starting a new segment
                    if (!tokenIndex)
                        pattern += '/';
                    pattern += token.value.replace(REGEX_CHARS_RE, '\\$&');
                    subSegmentScore += 40 /* Static */;
                }
                else if (token.type === 1 /* Param */) {
                    const { value, repeatable, optional, regexp } = token;
                    keys.push({
                        name: value,
                        repeatable,
                        optional,
                    });
                    const re = regexp ? regexp : BASE_PARAM_PATTERN;
                    // the user provided a custom regexp /:id(\\d+)
                    if (re !== BASE_PARAM_PATTERN) {
                        subSegmentScore += 10 /* BonusCustomRegExp */;
                        // make sure the regexp is valid before using it
                        try {
                            new RegExp(`(${re})`);
                        }
                        catch (err) {
                            throw new Error(`Invalid custom RegExp for param "${value}" (${re}): ` +
                                err.message);
                        }
                    }
                    // when we repeat we must take care of the repeating leading slash
                    let subPattern = repeatable ? `((?:${re})(?:/(?:${re}))*)` : `(${re})`;
                    // prepend the slash if we are starting a new segment
                    if (!tokenIndex)
                        subPattern =
                            // avoid an optional / if there are more segments e.g. /:p?-static
                            // or /:p?-:p2
                            optional && segment.length < 2
                                ? `(?:/${subPattern})`
                                : '/' + subPattern;
                    if (optional)
                        subPattern += '?';
                    pattern += subPattern;
                    subSegmentScore += 20 /* Dynamic */;
                    if (optional)
                        subSegmentScore += -8 /* BonusOptional */;
                    if (repeatable)
                        subSegmentScore += -20 /* BonusRepeatable */;
                    if (re === '.*')
                        subSegmentScore += -50 /* BonusWildcard */;
                }
                segmentScores.push(subSegmentScore);
            }
            // an empty array like /home/ -> [[{home}], []]
            // if (!segment.length) pattern += '/'
            score.push(segmentScores);
        }
        // only apply the strict bonus to the last score
        if (options.strict && options.end) {
            const i = score.length - 1;
            score[i][score[i].length - 1] += 0.7000000000000001 /* BonusStrict */;
        }
        // TODO: dev only warn double trailing slash
        if (!options.strict)
            pattern += '/?';
        if (options.end)
            pattern += '$';
        // allow paths like /dynamic to only match dynamic or dynamic/... but not dynamic_something_else
        else if (options.strict)
            pattern += '(?:/|$)';
        const re = new RegExp(pattern, options.sensitive ? '' : 'i');
        function parse(path) {
            const match = path.match(re);
            const params = {};
            if (!match)
                return null;
            for (let i = 1; i < match.length; i++) {
                const value = match[i] || '';
                const key = keys[i - 1];
                params[key.name] = value && key.repeatable ? value.split('/') : value;
            }
            return params;
        }
        function stringify(params) {
            let path = '';
            // for optional parameters to allow to be empty
            let avoidDuplicatedSlash = false;
            for (const segment of segments) {
                if (!avoidDuplicatedSlash || !path.endsWith('/'))
                    path += '/';
                avoidDuplicatedSlash = false;
                for (const token of segment) {
                    if (token.type === 0 /* Static */) {
                        path += token.value;
                    }
                    else if (token.type === 1 /* Param */) {
                        const { value, repeatable, optional } = token;
                        const param = value in params ? params[value] : '';
                        if (Array.isArray(param) && !repeatable)
                            throw new Error(`Provided param "${value}" is an array but it is not repeatable (* or + modifiers)`);
                        const text = Array.isArray(param) ? param.join('/') : param;
                        if (!text) {
                            if (optional) {
                                // if we have more than one optional param like /:a?-static we
                                // don't need to care about the optional param
                                if (segment.length < 2) {
                                    // remove the last slash as we could be at the end
                                    if (path.endsWith('/'))
                                        path = path.slice(0, -1);
                                    // do not append a slash on the next iteration
                                    else
                                        avoidDuplicatedSlash = true;
                                }
                            }
                            else
                                throw new Error(`Missing required param "${value}"`);
                        }
                        path += text;
                    }
                }
            }
            return path;
        }
        return {
            re,
            score,
            keys,
            parse,
            stringify,
        };
    }
    /**
     * Compares an array of numbers as used in PathParser.score and returns a
     * number. This function can be used to `sort` an array
     *
     * @param a - first array of numbers
     * @param b - second array of numbers
     * @returns 0 if both are equal, < 0 if a should be sorted first, > 0 if b
     * should be sorted first
     */
    function compareScoreArray(a, b) {
        let i = 0;
        while (i < a.length && i < b.length) {
            const diff = b[i] - a[i];
            // only keep going if diff === 0
            if (diff)
                return diff;
            i++;
        }
        // if the last subsegment was Static, the shorter segments should be sorted first
        // otherwise sort the longest segment first
        if (a.length < b.length) {
            return a.length === 1 && a[0] === 40 /* Static */ + 40 /* Segment */
                ? -1
                : 1;
        }
        else if (a.length > b.length) {
            return b.length === 1 && b[0] === 40 /* Static */ + 40 /* Segment */
                ? 1
                : -1;
        }
        return 0;
    }
    /**
     * Compare function that can be used with `sort` to sort an array of PathParser
     *
     * @param a - first PathParser
     * @param b - second PathParser
     * @returns 0 if both are equal, < 0 if a should be sorted first, > 0 if b
     */
    function comparePathParserScore(a, b) {
        let i = 0;
        const aScore = a.score;
        const bScore = b.score;
        while (i < aScore.length && i < bScore.length) {
            const comp = compareScoreArray(aScore[i], bScore[i]);
            // do not return if both are equal
            if (comp)
                return comp;
            i++;
        }
        // if a and b share the same score entries but b has more, sort b first
        return bScore.length - aScore.length;
        // this is the ternary version
        // return aScore.length < bScore.length
        //   ? 1
        //   : aScore.length > bScore.length
        //   ? -1
        //   : 0
    }

    const ROOT_TOKEN = {
        type: 0 /* Static */,
        value: '',
    };
    const VALID_PARAM_RE = /[a-zA-Z0-9_]/;
    // After some profiling, the cache seems to be unnecessary because tokenizePath
    // (the slowest part of adding a route) is very fast
    // const tokenCache = new Map<string, Token[][]>()
    function tokenizePath(path) {
        if (!path)
            return [[]];
        if (path === '/')
            return [[ROOT_TOKEN]];
        if (!path.startsWith('/')) {
            throw new Error(`Invalid path "${path}"`);
        }
        // if (tokenCache.has(path)) return tokenCache.get(path)!
        function crash(message) {
            throw new Error(`ERR (${state})/"${buffer}": ${message}`);
        }
        let state = 0 /* Static */;
        let previousState = state;
        const tokens = [];
        // the segment will always be valid because we get into the initial state
        // with the leading /
        let segment;
        function finalizeSegment() {
            if (segment)
                tokens.push(segment);
            segment = [];
        }
        // index on the path
        let i = 0;
        // char at index
        let char;
        // buffer of the value read
        let buffer = '';
        // custom regexp for a param
        let customRe = '';
        function consumeBuffer() {
            if (!buffer)
                return;
            if (state === 0 /* Static */) {
                segment.push({
                    type: 0 /* Static */,
                    value: buffer,
                });
            }
            else if (state === 1 /* Param */ ||
                state === 2 /* ParamRegExp */ ||
                state === 3 /* ParamRegExpEnd */) {
                if (segment.length > 1 && (char === '*' || char === '+'))
                    crash(`A repeatable param (${buffer}) must be alone in its segment. eg: '/:ids+.`);
                segment.push({
                    type: 1 /* Param */,
                    value: buffer,
                    regexp: customRe,
                    repeatable: char === '*' || char === '+',
                    optional: char === '*' || char === '?',
                });
            }
            else {
                crash('Invalid state to consume buffer');
            }
            buffer = '';
        }
        function addCharToBuffer() {
            buffer += char;
        }
        while (i < path.length) {
            char = path[i++];
            if (char === '\\' && state !== 2 /* ParamRegExp */) {
                previousState = state;
                state = 4 /* EscapeNext */;
                continue;
            }
            switch (state) {
                case 0 /* Static */:
                    if (char === '/') {
                        if (buffer) {
                            consumeBuffer();
                        }
                        finalizeSegment();
                    }
                    else if (char === ':') {
                        consumeBuffer();
                        state = 1 /* Param */;
                    }
                    else {
                        addCharToBuffer();
                    }
                    break;
                case 4 /* EscapeNext */:
                    addCharToBuffer();
                    state = previousState;
                    break;
                case 1 /* Param */:
                    if (char === '(') {
                        state = 2 /* ParamRegExp */;
                    }
                    else if (VALID_PARAM_RE.test(char)) {
                        addCharToBuffer();
                    }
                    else {
                        consumeBuffer();
                        state = 0 /* Static */;
                        // go back one character if we were not modifying
                        if (char !== '*' && char !== '?' && char !== '+')
                            i--;
                    }
                    break;
                case 2 /* ParamRegExp */:
                    // TODO: is it worth handling nested regexp? like :p(?:prefix_([^/]+)_suffix)
                    // it already works by escaping the closing )
                    // https://paths.esm.dev/?p=AAMeJbiAwQEcDKbAoAAkP60PG2R6QAvgNaA6AFACM2ABuQBB#
                    // is this really something people need since you can also write
                    // /prefix_:p()_suffix
                    if (char === ')') {
                        // handle the escaped )
                        if (customRe[customRe.length - 1] == '\\')
                            customRe = customRe.slice(0, -1) + char;
                        else
                            state = 3 /* ParamRegExpEnd */;
                    }
                    else {
                        customRe += char;
                    }
                    break;
                case 3 /* ParamRegExpEnd */:
                    // same as finalizing a param
                    consumeBuffer();
                    state = 0 /* Static */;
                    // go back one character if we were not modifying
                    if (char !== '*' && char !== '?' && char !== '+')
                        i--;
                    customRe = '';
                    break;
                default:
                    crash('Unknown state');
                    break;
            }
        }
        if (state === 2 /* ParamRegExp */)
            crash(`Unfinished custom RegExp for param "${buffer}"`);
        consumeBuffer();
        finalizeSegment();
        // tokenCache.set(path, tokens)
        return tokens;
    }

    function createRouteRecordMatcher(record, parent, options) {
        const parser = tokensToParser(tokenizePath(record.path), options);
        const matcher = assign(parser, {
            record,
            parent,
            // these needs to be populated by the parent
            children: [],
            alias: [],
        });
        if (parent) {
            // both are aliases or both are not aliases
            // we don't want to mix them because the order is used when
            // passing originalRecord in Matcher.addRoute
            if (!matcher.record.aliasOf === !parent.record.aliasOf)
                parent.children.push(matcher);
        }
        return matcher;
    }

    /**
     * Creates a Router Matcher.
     *
     * @internal
     * @param routes - array of initial routes
     * @param globalOptions - global route options
     */
    function createRouterMatcher(routes, globalOptions) {
        // normalized ordered array of matchers
        const matchers = [];
        const matcherMap = new Map();
        globalOptions = mergeOptions({ strict: false, end: true, sensitive: false }, globalOptions);
        function getRecordMatcher(name) {
            return matcherMap.get(name);
        }
        function addRoute(record, parent, originalRecord) {
            // used later on to remove by name
            const isRootAdd = !originalRecord;
            const mainNormalizedRecord = normalizeRouteRecord(record);
            // we might be the child of an alias
            mainNormalizedRecord.aliasOf = originalRecord && originalRecord.record;
            const options = mergeOptions(globalOptions, record);
            // generate an array of records to correctly handle aliases
            const normalizedRecords = [
                mainNormalizedRecord,
            ];
            if ('alias' in record) {
                const aliases = typeof record.alias === 'string' ? [record.alias] : record.alias;
                for (const alias of aliases) {
                    normalizedRecords.push(assign({}, mainNormalizedRecord, {
                        // this allows us to hold a copy of the `components` option
                        // so that async components cache is hold on the original record
                        components: originalRecord
                            ? originalRecord.record.components
                            : mainNormalizedRecord.components,
                        path: alias,
                        // we might be the child of an alias
                        aliasOf: originalRecord
                            ? originalRecord.record
                            : mainNormalizedRecord,
                        // the aliases are always of the same kind as the original since they
                        // are defined on the same record
                    }));
                }
            }
            let matcher;
            let originalMatcher;
            for (const normalizedRecord of normalizedRecords) {
                const { path } = normalizedRecord;
                // Build up the path for nested routes if the child isn't an absolute
                // route. Only add the / delimiter if the child path isn't empty and if the
                // parent path doesn't have a trailing slash
                if (parent && path[0] !== '/') {
                    const parentPath = parent.record.path;
                    const connectingSlash = parentPath[parentPath.length - 1] === '/' ? '' : '/';
                    normalizedRecord.path =
                        parent.record.path + (path && connectingSlash + path);
                }
                // create the object before hand so it can be passed to children
                matcher = createRouteRecordMatcher(normalizedRecord, parent, options);
                // if we are an alias we must tell the original record that we exist
                // so we can be removed
                if (originalRecord) {
                    originalRecord.alias.push(matcher);
                }
                else {
                    // otherwise, the first record is the original and others are aliases
                    originalMatcher = originalMatcher || matcher;
                    if (originalMatcher !== matcher)
                        originalMatcher.alias.push(matcher);
                    // remove the route if named and only for the top record (avoid in nested calls)
                    // this works because the original record is the first one
                    if (isRootAdd && record.name && !isAliasRecord(matcher))
                        removeRoute(record.name);
                }
                if ('children' in mainNormalizedRecord) {
                    const children = mainNormalizedRecord.children;
                    for (let i = 0; i < children.length; i++) {
                        addRoute(children[i], matcher, originalRecord && originalRecord.children[i]);
                    }
                }
                // if there was no original record, then the first one was not an alias and all
                // other alias (if any) need to reference this record when adding children
                originalRecord = originalRecord || matcher;
                // TODO: add normalized records for more flexibility
                // if (parent && isAliasRecord(originalRecord)) {
                //   parent.children.push(originalRecord)
                // }
                insertMatcher(matcher);
            }
            return originalMatcher
                ? () => {
                    // since other matchers are aliases, they should be removed by the original matcher
                    removeRoute(originalMatcher);
                }
                : noop;
        }
        function removeRoute(matcherRef) {
            if (isRouteName(matcherRef)) {
                const matcher = matcherMap.get(matcherRef);
                if (matcher) {
                    matcherMap.delete(matcherRef);
                    matchers.splice(matchers.indexOf(matcher), 1);
                    matcher.children.forEach(removeRoute);
                    matcher.alias.forEach(removeRoute);
                }
            }
            else {
                const index = matchers.indexOf(matcherRef);
                if (index > -1) {
                    matchers.splice(index, 1);
                    if (matcherRef.record.name)
                        matcherMap.delete(matcherRef.record.name);
                    matcherRef.children.forEach(removeRoute);
                    matcherRef.alias.forEach(removeRoute);
                }
            }
        }
        function getRoutes() {
            return matchers;
        }
        function insertMatcher(matcher) {
            let i = 0;
            while (i < matchers.length &&
                comparePathParserScore(matcher, matchers[i]) >= 0 &&
                // Adding children with empty path should still appear before the parent
                // https://github.com/vuejs/router/issues/1124
                (matcher.record.path !== matchers[i].record.path ||
                    !isRecordChildOf(matcher, matchers[i])))
                i++;
            matchers.splice(i, 0, matcher);
            // only add the original record to the name map
            if (matcher.record.name && !isAliasRecord(matcher))
                matcherMap.set(matcher.record.name, matcher);
        }
        function resolve(location, currentLocation) {
            let matcher;
            let params = {};
            let path;
            let name;
            if ('name' in location && location.name) {
                matcher = matcherMap.get(location.name);
                if (!matcher)
                    throw createRouterError(1 /* MATCHER_NOT_FOUND */, {
                        location,
                    });
                name = matcher.record.name;
                params = assign(
                // paramsFromLocation is a new object
                paramsFromLocation(currentLocation.params, 
                // only keep params that exist in the resolved location
                // TODO: only keep optional params coming from a parent record
                matcher.keys.filter(k => !k.optional).map(k => k.name)), location.params);
                // throws if cannot be stringified
                path = matcher.stringify(params);
            }
            else if ('path' in location) {
                // no need to resolve the path with the matcher as it was provided
                // this also allows the user to control the encoding
                path = location.path;
                matcher = matchers.find(m => m.re.test(path));
                // matcher should have a value after the loop
                if (matcher) {
                    // TODO: dev warning of unused params if provided
                    // we know the matcher works because we tested the regexp
                    params = matcher.parse(path);
                    name = matcher.record.name;
                }
                // location is a relative path
            }
            else {
                // match by name or path of current route
                matcher = currentLocation.name
                    ? matcherMap.get(currentLocation.name)
                    : matchers.find(m => m.re.test(currentLocation.path));
                if (!matcher)
                    throw createRouterError(1 /* MATCHER_NOT_FOUND */, {
                        location,
                        currentLocation,
                    });
                name = matcher.record.name;
                // since we are navigating to the same location, we don't need to pick the
                // params like when `name` is provided
                params = assign({}, currentLocation.params, location.params);
                path = matcher.stringify(params);
            }
            const matched = [];
            let parentMatcher = matcher;
            while (parentMatcher) {
                // reversed order so parents are at the beginning
                matched.unshift(parentMatcher.record);
                parentMatcher = parentMatcher.parent;
            }
            return {
                name,
                path,
                params,
                matched,
                meta: mergeMetaFields(matched),
            };
        }
        // add initial routes
        routes.forEach(route => addRoute(route));
        return { addRoute, resolve, removeRoute, getRoutes, getRecordMatcher };
    }
    function paramsFromLocation(params, keys) {
        const newParams = {};
        for (const key of keys) {
            if (key in params)
                newParams[key] = params[key];
        }
        return newParams;
    }
    /**
     * Normalizes a RouteRecordRaw. Creates a copy
     *
     * @param record
     * @returns the normalized version
     */
    function normalizeRouteRecord(record) {
        return {
            path: record.path,
            redirect: record.redirect,
            name: record.name,
            meta: record.meta || {},
            aliasOf: undefined,
            beforeEnter: record.beforeEnter,
            props: normalizeRecordProps(record),
            children: record.children || [],
            instances: {},
            leaveGuards: new Set(),
            updateGuards: new Set(),
            enterCallbacks: {},
            components: 'components' in record
                ? record.components || {}
                : { default: record.component },
        };
    }
    /**
     * Normalize the optional `props` in a record to always be an object similar to
     * components. Also accept a boolean for components.
     * @param record
     */
    function normalizeRecordProps(record) {
        const propsObject = {};
        // props does not exist on redirect records but we can set false directly
        const props = record.props || false;
        if ('component' in record) {
            propsObject.default = props;
        }
        else {
            // NOTE: we could also allow a function to be applied to every component.
            // Would need user feedback for use cases
            for (const name in record.components)
                propsObject[name] = typeof props === 'boolean' ? props : props[name];
        }
        return propsObject;
    }
    /**
     * Checks if a record or any of its parent is an alias
     * @param record
     */
    function isAliasRecord(record) {
        while (record) {
            if (record.record.aliasOf)
                return true;
            record = record.parent;
        }
        return false;
    }
    /**
     * Merge meta fields of an array of records
     *
     * @param matched - array of matched records
     */
    function mergeMetaFields(matched) {
        return matched.reduce((meta, record) => assign(meta, record.meta), {});
    }
    function mergeOptions(defaults, partialOptions) {
        const options = {};
        for (const key in defaults) {
            options[key] = key in partialOptions ? partialOptions[key] : defaults[key];
        }
        return options;
    }
    function isRecordChildOf(record, parent) {
        return parent.children.some(child => child === record || isRecordChildOf(record, child));
    }

    /**
     * Encoding Rules ␣ = Space Path: ␣ " < > # ? { } Query: ␣ " < > # & = Hash: ␣ "
     * < > `
     *
     * On top of that, the RFC3986 (https://tools.ietf.org/html/rfc3986#section-2.2)
     * defines some extra characters to be encoded. Most browsers do not encode them
     * in encodeURI https://github.com/whatwg/url/issues/369, so it may be safer to
     * also encode `!'()*`. Leaving unencoded only ASCII alphanumeric(`a-zA-Z0-9`)
     * plus `-._~`. This extra safety should be applied to query by patching the
     * string returned by encodeURIComponent encodeURI also encodes `[\]^`. `\`
     * should be encoded to avoid ambiguity. Browsers (IE, FF, C) transform a `\`
     * into a `/` if directly typed in. The _backtick_ (`````) should also be
     * encoded everywhere because some browsers like FF encode it when directly
     * written while others don't. Safari and IE don't encode ``"<>{}``` in hash.
     */
    // const EXTRA_RESERVED_RE = /[!'()*]/g
    // const encodeReservedReplacer = (c: string) => '%' + c.charCodeAt(0).toString(16)
    const HASH_RE = /#/g; // %23
    const AMPERSAND_RE = /&/g; // %26
    const SLASH_RE = /\//g; // %2F
    const EQUAL_RE = /=/g; // %3D
    const IM_RE = /\?/g; // %3F
    const PLUS_RE = /\+/g; // %2B
    /**
     * NOTE: It's not clear to me if we should encode the + symbol in queries, it
     * seems to be less flexible than not doing so and I can't find out the legacy
     * systems requiring this for regular requests like text/html. In the standard,
     * the encoding of the plus character is only mentioned for
     * application/x-www-form-urlencoded
     * (https://url.spec.whatwg.org/#urlencoded-parsing) and most browsers seems lo
     * leave the plus character as is in queries. To be more flexible, we allow the
     * plus character on the query but it can also be manually encoded by the user.
     *
     * Resources:
     * - https://url.spec.whatwg.org/#urlencoded-parsing
     * - https://stackoverflow.com/questions/1634271/url-encoding-the-space-character-or-20
     */
    const ENC_BRACKET_OPEN_RE = /%5B/g; // [
    const ENC_BRACKET_CLOSE_RE = /%5D/g; // ]
    const ENC_CARET_RE = /%5E/g; // ^
    const ENC_BACKTICK_RE = /%60/g; // `
    const ENC_CURLY_OPEN_RE = /%7B/g; // {
    const ENC_PIPE_RE = /%7C/g; // |
    const ENC_CURLY_CLOSE_RE = /%7D/g; // }
    const ENC_SPACE_RE = /%20/g; // }
    /**
     * Encode characters that need to be encoded on the path, search and hash
     * sections of the URL.
     *
     * @internal
     * @param text - string to encode
     * @returns encoded string
     */
    function commonEncode(text) {
        return encodeURI('' + text)
            .replace(ENC_PIPE_RE, '|')
            .replace(ENC_BRACKET_OPEN_RE, '[')
            .replace(ENC_BRACKET_CLOSE_RE, ']');
    }
    /**
     * Encode characters that need to be encoded on the hash section of the URL.
     *
     * @param text - string to encode
     * @returns encoded string
     */
    function encodeHash(text) {
        return commonEncode(text)
            .replace(ENC_CURLY_OPEN_RE, '{')
            .replace(ENC_CURLY_CLOSE_RE, '}')
            .replace(ENC_CARET_RE, '^');
    }
    /**
     * Encode characters that need to be encoded query values on the query
     * section of the URL.
     *
     * @param text - string to encode
     * @returns encoded string
     */
    function encodeQueryValue(text) {
        return (commonEncode(text)
            // Encode the space as +, encode the + to differentiate it from the space
            .replace(PLUS_RE, '%2B')
            .replace(ENC_SPACE_RE, '+')
            .replace(HASH_RE, '%23')
            .replace(AMPERSAND_RE, '%26')
            .replace(ENC_BACKTICK_RE, '`')
            .replace(ENC_CURLY_OPEN_RE, '{')
            .replace(ENC_CURLY_CLOSE_RE, '}')
            .replace(ENC_CARET_RE, '^'));
    }
    /**
     * Like `encodeQueryValue` but also encodes the `=` character.
     *
     * @param text - string to encode
     */
    function encodeQueryKey(text) {
        return encodeQueryValue(text).replace(EQUAL_RE, '%3D');
    }
    /**
     * Encode characters that need to be encoded on the path section of the URL.
     *
     * @param text - string to encode
     * @returns encoded string
     */
    function encodePath(text) {
        return commonEncode(text).replace(HASH_RE, '%23').replace(IM_RE, '%3F');
    }
    /**
     * Encode characters that need to be encoded on the path section of the URL as a
     * param. This function encodes everything {@link encodePath} does plus the
     * slash (`/`) character. If `text` is `null` or `undefined`, returns an empty
     * string instead.
     *
     * @param text - string to encode
     * @returns encoded string
     */
    function encodeParam(text) {
        return text == null ? '' : encodePath(text).replace(SLASH_RE, '%2F');
    }
    /**
     * Decode text using `decodeURIComponent`. Returns the original text if it
     * fails.
     *
     * @param text - string to decode
     * @returns decoded string
     */
    function decode(text) {
        try {
            return decodeURIComponent('' + text);
        }
        catch (err) {
        }
        return '' + text;
    }

    /**
     * Transforms a queryString into a {@link LocationQuery} object. Accept both, a
     * version with the leading `?` and without Should work as URLSearchParams

     * @internal
     *
     * @param search - search string to parse
     * @returns a query object
     */
    function parseQuery(search) {
        const query = {};
        // avoid creating an object with an empty key and empty value
        // because of split('&')
        if (search === '' || search === '?')
            return query;
        const hasLeadingIM = search[0] === '?';
        const searchParams = (hasLeadingIM ? search.slice(1) : search).split('&');
        for (let i = 0; i < searchParams.length; ++i) {
            // pre decode the + into space
            const searchParam = searchParams[i].replace(PLUS_RE, ' ');
            // allow the = character
            const eqPos = searchParam.indexOf('=');
            const key = decode(eqPos < 0 ? searchParam : searchParam.slice(0, eqPos));
            const value = eqPos < 0 ? null : decode(searchParam.slice(eqPos + 1));
            if (key in query) {
                // an extra variable for ts types
                let currentValue = query[key];
                if (!Array.isArray(currentValue)) {
                    currentValue = query[key] = [currentValue];
                }
                currentValue.push(value);
            }
            else {
                query[key] = value;
            }
        }
        return query;
    }
    /**
     * Stringifies a {@link LocationQueryRaw} object. Like `URLSearchParams`, it
     * doesn't prepend a `?`
     *
     * @internal
     *
     * @param query - query object to stringify
     * @returns string version of the query without the leading `?`
     */
    function stringifyQuery(query) {
        let search = '';
        for (let key in query) {
            const value = query[key];
            key = encodeQueryKey(key);
            if (value == null) {
                // only null adds the value
                if (value !== undefined) {
                    search += (search.length ? '&' : '') + key;
                }
                continue;
            }
            // keep null values
            const values = Array.isArray(value)
                ? value.map(v => v && encodeQueryValue(v))
                : [value && encodeQueryValue(value)];
            values.forEach(value => {
                // skip undefined values in arrays as if they were not present
                // smaller code than using filter
                if (value !== undefined) {
                    // only append & with non-empty search
                    search += (search.length ? '&' : '') + key;
                    if (value != null)
                        search += '=' + value;
                }
            });
        }
        return search;
    }
    /**
     * Transforms a {@link LocationQueryRaw} into a {@link LocationQuery} by casting
     * numbers into strings, removing keys with an undefined value and replacing
     * undefined with null in arrays
     *
     * @param query - query object to normalize
     * @returns a normalized query object
     */
    function normalizeQuery(query) {
        const normalizedQuery = {};
        for (const key in query) {
            const value = query[key];
            if (value !== undefined) {
                normalizedQuery[key] = Array.isArray(value)
                    ? value.map(v => (v == null ? null : '' + v))
                    : value == null
                        ? value
                        : '' + value;
            }
        }
        return normalizedQuery;
    }

    /**
     * Create a list of callbacks that can be reset. Used to create before and after navigation guards list
     */
    function useCallbacks() {
        let handlers = [];
        function add(handler) {
            handlers.push(handler);
            return () => {
                const i = handlers.indexOf(handler);
                if (i > -1)
                    handlers.splice(i, 1);
            };
        }
        function reset() {
            handlers = [];
        }
        return {
            add,
            list: () => handlers,
            reset,
        };
    }
    function guardToPromiseFn(guard, to, from, record, name) {
        // keep a reference to the enterCallbackArray to prevent pushing callbacks if a new navigation took place
        const enterCallbackArray = record &&
            // name is defined if record is because of the function overload
            (record.enterCallbacks[name] = record.enterCallbacks[name] || []);
        return () => new Promise((resolve, reject) => {
            const next = (valid) => {
                if (valid === false)
                    reject(createRouterError(4 /* NAVIGATION_ABORTED */, {
                        from,
                        to,
                    }));
                else if (valid instanceof Error) {
                    reject(valid);
                }
                else if (isRouteLocation(valid)) {
                    reject(createRouterError(2 /* NAVIGATION_GUARD_REDIRECT */, {
                        from: to,
                        to: valid,
                    }));
                }
                else {
                    if (enterCallbackArray &&
                        // since enterCallbackArray is truthy, both record and name also are
                        record.enterCallbacks[name] === enterCallbackArray &&
                        typeof valid === 'function')
                        enterCallbackArray.push(valid);
                    resolve();
                }
            };
            // wrapping with Promise.resolve allows it to work with both async and sync guards
            const guardReturn = guard.call(record && record.instances[name], to, from, next);
            let guardCall = Promise.resolve(guardReturn);
            if (guard.length < 3)
                guardCall = guardCall.then(next);
            guardCall.catch(err => reject(err));
        });
    }
    function extractComponentsGuards(matched, guardType, to, from) {
        const guards = [];
        for (const record of matched) {
            for (const name in record.components) {
                let rawComponent = record.components[name];
                // skip update and leave guards if the route component is not mounted
                if (guardType !== 'beforeRouteEnter' && !record.instances[name])
                    continue;
                if (isRouteComponent(rawComponent)) {
                    // __vccOpts is added by vue-class-component and contain the regular options
                    const options = rawComponent.__vccOpts || rawComponent;
                    const guard = options[guardType];
                    guard && guards.push(guardToPromiseFn(guard, to, from, record, name));
                }
                else {
                    // start requesting the chunk already
                    let componentPromise = rawComponent();
                    guards.push(() => componentPromise.then(resolved => {
                        if (!resolved)
                            return Promise.reject(new Error(`Couldn't resolve component "${name}" at "${record.path}"`));
                        const resolvedComponent = isESModule(resolved)
                            ? resolved.default
                            : resolved;
                        // replace the function with the resolved component
                        record.components[name] = resolvedComponent;
                        // __vccOpts is added by vue-class-component and contain the regular options
                        const options = resolvedComponent.__vccOpts || resolvedComponent;
                        const guard = options[guardType];
                        return guard && guardToPromiseFn(guard, to, from, record, name)();
                    }));
                }
            }
        }
        return guards;
    }
    /**
     * Allows differentiating lazy components from functional components and vue-class-component
     *
     * @param component
     */
    function isRouteComponent(component) {
        return (typeof component === 'object' ||
            'displayName' in component ||
            'props' in component ||
            '__vccOpts' in component);
    }

    // TODO: we could allow currentRoute as a prop to expose `isActive` and
    // `isExactActive` behavior should go through an RFC
    function useLink(props) {
        const router = inject(routerKey);
        const currentRoute = inject(routeLocationKey);
        const route = computed(() => router.resolve(unref(props.to)));
        const activeRecordIndex = computed(() => {
            const { matched } = route.value;
            const { length } = matched;
            const routeMatched = matched[length - 1];
            const currentMatched = currentRoute.matched;
            if (!routeMatched || !currentMatched.length)
                return -1;
            const index = currentMatched.findIndex(isSameRouteRecord.bind(null, routeMatched));
            if (index > -1)
                return index;
            // possible parent record
            const parentRecordPath = getOriginalPath(matched[length - 2]);
            return (
            // we are dealing with nested routes
            length > 1 &&
                // if the parent and matched route have the same path, this link is
                // referring to the empty child. Or we currently are on a different
                // child of the same parent
                getOriginalPath(routeMatched) === parentRecordPath &&
                // avoid comparing the child with its parent
                currentMatched[currentMatched.length - 1].path !== parentRecordPath
                ? currentMatched.findIndex(isSameRouteRecord.bind(null, matched[length - 2]))
                : index);
        });
        const isActive = computed(() => activeRecordIndex.value > -1 &&
            includesParams(currentRoute.params, route.value.params));
        const isExactActive = computed(() => activeRecordIndex.value > -1 &&
            activeRecordIndex.value === currentRoute.matched.length - 1 &&
            isSameRouteLocationParams(currentRoute.params, route.value.params));
        function navigate(e = {}) {
            if (guardEvent(e)) {
                return router[unref(props.replace) ? 'replace' : 'push'](unref(props.to)
                // avoid uncaught errors are they are logged anyway
                ).catch(noop);
            }
            return Promise.resolve();
        }
        // devtools only
        if ((__VUE_PROD_DEVTOOLS__) && isBrowser) {
            const instance = getCurrentInstance();
            if (instance) {
                const linkContextDevtools = {
                    route: route.value,
                    isActive: isActive.value,
                    isExactActive: isExactActive.value,
                };
                // @ts-expect-error: this is internal
                instance.__vrl_devtools = instance.__vrl_devtools || [];
                // @ts-expect-error: this is internal
                instance.__vrl_devtools.push(linkContextDevtools);
                watchEffect(() => {
                    linkContextDevtools.route = route.value;
                    linkContextDevtools.isActive = isActive.value;
                    linkContextDevtools.isExactActive = isExactActive.value;
                }, { flush: 'post' });
            }
        }
        return {
            route,
            href: computed(() => route.value.href),
            isActive,
            isExactActive,
            navigate,
        };
    }
    const RouterLinkImpl = /*#__PURE__*/ defineComponent({
        name: 'RouterLink',
        props: {
            to: {
                type: [String, Object],
                required: true,
            },
            replace: Boolean,
            activeClass: String,
            // inactiveClass: String,
            exactActiveClass: String,
            custom: Boolean,
            ariaCurrentValue: {
                type: String,
                default: 'page',
            },
        },
        useLink,
        setup(props, { slots }) {
            const link = reactive(useLink(props));
            const { options } = inject(routerKey);
            const elClass = computed(() => ({
                [getLinkClass(props.activeClass, options.linkActiveClass, 'router-link-active')]: link.isActive,
                // [getLinkClass(
                //   props.inactiveClass,
                //   options.linkInactiveClass,
                //   'router-link-inactive'
                // )]: !link.isExactActive,
                [getLinkClass(props.exactActiveClass, options.linkExactActiveClass, 'router-link-exact-active')]: link.isExactActive,
            }));
            return () => {
                const children = slots.default && slots.default(link);
                return props.custom
                    ? children
                    : h('a', {
                        'aria-current': link.isExactActive
                            ? props.ariaCurrentValue
                            : null,
                        href: link.href,
                        // this would override user added attrs but Vue will still add
                        // the listener so we end up triggering both
                        onClick: link.navigate,
                        class: elClass.value,
                    }, children);
            };
        },
    });
    // export the public type for h/tsx inference
    // also to avoid inline import() in generated d.ts files
    /**
     * Component to render a link that triggers a navigation on click.
     */
    const RouterLink = RouterLinkImpl;
    function guardEvent(e) {
        // don't redirect with control keys
        if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
            return;
        // don't redirect when preventDefault called
        if (e.defaultPrevented)
            return;
        // don't redirect on right click
        if (e.button !== undefined && e.button !== 0)
            return;
        // don't redirect if `target="_blank"`
        // @ts-expect-error getAttribute does exist
        if (e.currentTarget && e.currentTarget.getAttribute) {
            // @ts-expect-error getAttribute exists
            const target = e.currentTarget.getAttribute('target');
            if (/\b_blank\b/i.test(target))
                return;
        }
        // this may be a Weex event which doesn't have this method
        if (e.preventDefault)
            e.preventDefault();
        return true;
    }
    function includesParams(outer, inner) {
        for (const key in inner) {
            const innerValue = inner[key];
            const outerValue = outer[key];
            if (typeof innerValue === 'string') {
                if (innerValue !== outerValue)
                    return false;
            }
            else {
                if (!Array.isArray(outerValue) ||
                    outerValue.length !== innerValue.length ||
                    innerValue.some((value, i) => value !== outerValue[i]))
                    return false;
            }
        }
        return true;
    }
    /**
     * Get the original path value of a record by following its aliasOf
     * @param record
     */
    function getOriginalPath(record) {
        return record ? (record.aliasOf ? record.aliasOf.path : record.path) : '';
    }
    /**
     * Utility class to get the active class based on defaults.
     * @param propClass
     * @param globalClass
     * @param defaultClass
     */
    const getLinkClass = (propClass, globalClass, defaultClass) => propClass != null
        ? propClass
        : globalClass != null
            ? globalClass
            : defaultClass;

    const RouterViewImpl = /*#__PURE__*/ defineComponent({
        name: 'RouterView',
        // #674 we manually inherit them
        inheritAttrs: false,
        props: {
            name: {
                type: String,
                default: 'default',
            },
            route: Object,
        },
        setup(props, { attrs, slots }) {
            const injectedRoute = inject(routerViewLocationKey);
            const routeToDisplay = computed(() => props.route || injectedRoute.value);
            const depth = inject(viewDepthKey, 0);
            const matchedRouteRef = computed(() => routeToDisplay.value.matched[depth]);
            provide(viewDepthKey, depth + 1);
            provide(matchedRouteKey, matchedRouteRef);
            provide(routerViewLocationKey, routeToDisplay);
            const viewRef = ref();
            // watch at the same time the component instance, the route record we are
            // rendering, and the name
            watch(() => [viewRef.value, matchedRouteRef.value, props.name], ([instance, to, name], [oldInstance, from, oldName]) => {
                // copy reused instances
                if (to) {
                    // this will update the instance for new instances as well as reused
                    // instances when navigating to a new route
                    to.instances[name] = instance;
                    // the component instance is reused for a different route or name so
                    // we copy any saved update or leave guards. With async setup, the
                    // mounting component will mount before the matchedRoute changes,
                    // making instance === oldInstance, so we check if guards have been
                    // added before. This works because we remove guards when
                    // unmounting/deactivating components
                    if (from && from !== to && instance && instance === oldInstance) {
                        if (!to.leaveGuards.size) {
                            to.leaveGuards = from.leaveGuards;
                        }
                        if (!to.updateGuards.size) {
                            to.updateGuards = from.updateGuards;
                        }
                    }
                }
                // trigger beforeRouteEnter next callbacks
                if (instance &&
                    to &&
                    // if there is no instance but to and from are the same this might be
                    // the first visit
                    (!from || !isSameRouteRecord(to, from) || !oldInstance)) {
                    (to.enterCallbacks[name] || []).forEach(callback => callback(instance));
                }
            }, { flush: 'post' });
            return () => {
                const route = routeToDisplay.value;
                const matchedRoute = matchedRouteRef.value;
                const ViewComponent = matchedRoute && matchedRoute.components[props.name];
                // we need the value at the time we render because when we unmount, we
                // navigated to a different location so the value is different
                const currentName = props.name;
                if (!ViewComponent) {
                    return normalizeSlot(slots.default, { Component: ViewComponent, route });
                }
                // props from route configuration
                const routePropsOption = matchedRoute.props[props.name];
                const routeProps = routePropsOption
                    ? routePropsOption === true
                        ? route.params
                        : typeof routePropsOption === 'function'
                            ? routePropsOption(route)
                            : routePropsOption
                    : null;
                const onVnodeUnmounted = vnode => {
                    // remove the instance reference to prevent leak
                    if (vnode.component.isUnmounted) {
                        matchedRoute.instances[currentName] = null;
                    }
                };
                const component = h(ViewComponent, assign({}, routeProps, attrs, {
                    onVnodeUnmounted,
                    ref: viewRef,
                }));
                if ((__VUE_PROD_DEVTOOLS__) &&
                    isBrowser &&
                    component.ref) {
                    // TODO: can display if it's an alias, its props
                    const info = {
                        depth,
                        name: matchedRoute.name,
                        path: matchedRoute.path,
                        meta: matchedRoute.meta,
                    };
                    const internalInstances = Array.isArray(component.ref)
                        ? component.ref.map(r => r.i)
                        : [component.ref.i];
                    internalInstances.forEach(instance => {
                        // @ts-expect-error
                        instance.__vrv_devtools = info;
                    });
                }
                return (
                // pass the vnode to the slot as a prop.
                // h and <component :is="..."> both accept vnodes
                normalizeSlot(slots.default, { Component: component, route }) ||
                    component);
            };
        },
    });
    function normalizeSlot(slot, data) {
        if (!slot)
            return null;
        const slotContent = slot(data);
        return slotContent.length === 1 ? slotContent[0] : slotContent;
    }
    // export the public type for h/tsx inference
    // also to avoid inline import() in generated d.ts files
    /**
     * Component to display the current route the user is at.
     */
    const RouterView = RouterViewImpl;

    function formatRouteLocation(routeLocation, tooltip) {
        const copy = assign({}, routeLocation, {
            // remove variables that can contain vue instances
            matched: routeLocation.matched.map(matched => omit(matched, ['instances', 'children', 'aliasOf'])),
        });
        return {
            _custom: {
                type: null,
                readOnly: true,
                display: routeLocation.fullPath,
                tooltip,
                value: copy,
            },
        };
    }
    function formatDisplay(display) {
        return {
            _custom: {
                display,
            },
        };
    }
    // to support multiple router instances
    let routerId = 0;
    function addDevtools(app, router, matcher) {
        // Take over router.beforeEach and afterEach
        // make sure we are not registering the devtool twice
        if (router.__hasDevtools)
            return;
        router.__hasDevtools = true;
        // increment to support multiple router instances
        const id = routerId++;
        setupDevtoolsPlugin({
            id: 'org.vuejs.router' + (id ? '.' + id : ''),
            label: 'Vue Router',
            packageName: 'vue-router',
            homepage: 'https://router.vuejs.org',
            logo: 'https://router.vuejs.org/logo.png',
            componentStateTypes: ['Routing'],
            app,
        }, api => {
            // display state added by the router
            api.on.inspectComponent((payload, ctx) => {
                if (payload.instanceData) {
                    payload.instanceData.state.push({
                        type: 'Routing',
                        key: '$route',
                        editable: false,
                        value: formatRouteLocation(router.currentRoute.value, 'Current Route'),
                    });
                }
            });
            // mark router-link as active and display tags on router views
            api.on.visitComponentTree(({ treeNode: node, componentInstance }) => {
                if (componentInstance.__vrv_devtools) {
                    const info = componentInstance.__vrv_devtools;
                    node.tags.push({
                        label: (info.name ? `${info.name.toString()}: ` : '') + info.path,
                        textColor: 0,
                        tooltip: 'This component is rendered by &lt;router-view&gt;',
                        backgroundColor: PINK_500,
                    });
                }
                // if multiple useLink are used
                if (Array.isArray(componentInstance.__vrl_devtools)) {
                    componentInstance.__devtoolsApi = api;
                    componentInstance.__vrl_devtools.forEach(devtoolsData => {
                        let backgroundColor = ORANGE_400;
                        let tooltip = '';
                        if (devtoolsData.isExactActive) {
                            backgroundColor = LIME_500;
                            tooltip = 'This is exactly active';
                        }
                        else if (devtoolsData.isActive) {
                            backgroundColor = BLUE_600;
                            tooltip = 'This link is active';
                        }
                        node.tags.push({
                            label: devtoolsData.route.path,
                            textColor: 0,
                            tooltip,
                            backgroundColor,
                        });
                    });
                }
            });
            watch(router.currentRoute, () => {
                // refresh active state
                refreshRoutesView();
                api.notifyComponentUpdate();
                api.sendInspectorTree(routerInspectorId);
                api.sendInspectorState(routerInspectorId);
            });
            const navigationsLayerId = 'router:navigations:' + id;
            api.addTimelineLayer({
                id: navigationsLayerId,
                label: `Router${id ? ' ' + id : ''} Navigations`,
                color: 0x40a8c4,
            });
            // const errorsLayerId = 'router:errors'
            // api.addTimelineLayer({
            //   id: errorsLayerId,
            //   label: 'Router Errors',
            //   color: 0xea5455,
            // })
            router.onError((error, to) => {
                api.addTimelineEvent({
                    layerId: navigationsLayerId,
                    event: {
                        title: 'Error during Navigation',
                        subtitle: to.fullPath,
                        logType: 'error',
                        time: api.now(),
                        data: { error },
                        groupId: to.meta.__navigationId,
                    },
                });
            });
            // attached to `meta` and used to group events
            let navigationId = 0;
            router.beforeEach((to, from) => {
                const data = {
                    guard: formatDisplay('beforeEach'),
                    from: formatRouteLocation(from, 'Current Location during this navigation'),
                    to: formatRouteLocation(to, 'Target location'),
                };
                // Used to group navigations together, hide from devtools
                Object.defineProperty(to.meta, '__navigationId', {
                    value: navigationId++,
                });
                api.addTimelineEvent({
                    layerId: navigationsLayerId,
                    event: {
                        time: api.now(),
                        title: 'Start of navigation',
                        subtitle: to.fullPath,
                        data,
                        groupId: to.meta.__navigationId,
                    },
                });
            });
            router.afterEach((to, from, failure) => {
                const data = {
                    guard: formatDisplay('afterEach'),
                };
                if (failure) {
                    data.failure = {
                        _custom: {
                            type: Error,
                            readOnly: true,
                            display: failure ? failure.message : '',
                            tooltip: 'Navigation Failure',
                            value: failure,
                        },
                    };
                    data.status = formatDisplay('❌');
                }
                else {
                    data.status = formatDisplay('✅');
                }
                // we set here to have the right order
                data.from = formatRouteLocation(from, 'Current Location during this navigation');
                data.to = formatRouteLocation(to, 'Target location');
                api.addTimelineEvent({
                    layerId: navigationsLayerId,
                    event: {
                        title: 'End of navigation',
                        subtitle: to.fullPath,
                        time: api.now(),
                        data,
                        logType: failure ? 'warning' : 'default',
                        groupId: to.meta.__navigationId,
                    },
                });
            });
            /**
             * Inspector of Existing routes
             */
            const routerInspectorId = 'router-inspector:' + id;
            api.addInspector({
                id: routerInspectorId,
                label: 'Routes' + (id ? ' ' + id : ''),
                icon: 'book',
                treeFilterPlaceholder: 'Search routes',
            });
            function refreshRoutesView() {
                // the routes view isn't active
                if (!activeRoutesPayload)
                    return;
                const payload = activeRoutesPayload;
                // children routes will appear as nested
                let routes = matcher.getRoutes().filter(route => !route.parent);
                // reset match state to false
                routes.forEach(resetMatchStateOnRouteRecord);
                // apply a match state if there is a payload
                if (payload.filter) {
                    routes = routes.filter(route => 
                    // save matches state based on the payload
                    isRouteMatching(route, payload.filter.toLowerCase()));
                }
                // mark active routes
                routes.forEach(route => markRouteRecordActive(route, router.currentRoute.value));
                payload.rootNodes = routes.map(formatRouteRecordForInspector);
            }
            let activeRoutesPayload;
            api.on.getInspectorTree(payload => {
                activeRoutesPayload = payload;
                if (payload.app === app && payload.inspectorId === routerInspectorId) {
                    refreshRoutesView();
                }
            });
            /**
             * Display information about the currently selected route record
             */
            api.on.getInspectorState(payload => {
                if (payload.app === app && payload.inspectorId === routerInspectorId) {
                    const routes = matcher.getRoutes();
                    const route = routes.find(route => route.record.__vd_id === payload.nodeId);
                    if (route) {
                        payload.state = {
                            options: formatRouteRecordMatcherForStateInspector(route),
                        };
                    }
                }
            });
            api.sendInspectorTree(routerInspectorId);
            api.sendInspectorState(routerInspectorId);
        });
    }
    function modifierForKey(key) {
        if (key.optional) {
            return key.repeatable ? '*' : '?';
        }
        else {
            return key.repeatable ? '+' : '';
        }
    }
    function formatRouteRecordMatcherForStateInspector(route) {
        const { record } = route;
        const fields = [
            { editable: false, key: 'path', value: record.path },
        ];
        if (record.name != null) {
            fields.push({
                editable: false,
                key: 'name',
                value: record.name,
            });
        }
        fields.push({ editable: false, key: 'regexp', value: route.re });
        if (route.keys.length) {
            fields.push({
                editable: false,
                key: 'keys',
                value: {
                    _custom: {
                        type: null,
                        readOnly: true,
                        display: route.keys
                            .map(key => `${key.name}${modifierForKey(key)}`)
                            .join(' '),
                        tooltip: 'Param keys',
                        value: route.keys,
                    },
                },
            });
        }
        if (record.redirect != null) {
            fields.push({
                editable: false,
                key: 'redirect',
                value: record.redirect,
            });
        }
        if (route.alias.length) {
            fields.push({
                editable: false,
                key: 'aliases',
                value: route.alias.map(alias => alias.record.path),
            });
        }
        fields.push({
            key: 'score',
            editable: false,
            value: {
                _custom: {
                    type: null,
                    readOnly: true,
                    display: route.score.map(score => score.join(', ')).join(' | '),
                    tooltip: 'Score used to sort routes',
                    value: route.score,
                },
            },
        });
        return fields;
    }
    /**
     * Extracted from tailwind palette
     */
    const PINK_500 = 0xec4899;
    const BLUE_600 = 0x2563eb;
    const LIME_500 = 0x84cc16;
    const CYAN_400 = 0x22d3ee;
    const ORANGE_400 = 0xfb923c;
    // const GRAY_100 = 0xf4f4f5
    const DARK = 0x666666;
    function formatRouteRecordForInspector(route) {
        const tags = [];
        const { record } = route;
        if (record.name != null) {
            tags.push({
                label: String(record.name),
                textColor: 0,
                backgroundColor: CYAN_400,
            });
        }
        if (record.aliasOf) {
            tags.push({
                label: 'alias',
                textColor: 0,
                backgroundColor: ORANGE_400,
            });
        }
        if (route.__vd_match) {
            tags.push({
                label: 'matches',
                textColor: 0,
                backgroundColor: PINK_500,
            });
        }
        if (route.__vd_exactActive) {
            tags.push({
                label: 'exact',
                textColor: 0,
                backgroundColor: LIME_500,
            });
        }
        if (route.__vd_active) {
            tags.push({
                label: 'active',
                textColor: 0,
                backgroundColor: BLUE_600,
            });
        }
        if (record.redirect) {
            tags.push({
                label: 'redirect: ' +
                    (typeof record.redirect === 'string' ? record.redirect : 'Object'),
                textColor: 0xffffff,
                backgroundColor: DARK,
            });
        }
        // add an id to be able to select it. Using the `path` is not possible because
        // empty path children would collide with their parents
        let id = record.__vd_id;
        if (id == null) {
            id = String(routeRecordId++);
            record.__vd_id = id;
        }
        return {
            id,
            label: record.path,
            tags,
            children: route.children.map(formatRouteRecordForInspector),
        };
    }
    //  incremental id for route records and inspector state
    let routeRecordId = 0;
    const EXTRACT_REGEXP_RE = /^\/(.*)\/([a-z]*)$/;
    function markRouteRecordActive(route, currentRoute) {
        // no route will be active if matched is empty
        // reset the matching state
        const isExactActive = currentRoute.matched.length &&
            isSameRouteRecord(currentRoute.matched[currentRoute.matched.length - 1], route.record);
        route.__vd_exactActive = route.__vd_active = isExactActive;
        if (!isExactActive) {
            route.__vd_active = currentRoute.matched.some(match => isSameRouteRecord(match, route.record));
        }
        route.children.forEach(childRoute => markRouteRecordActive(childRoute, currentRoute));
    }
    function resetMatchStateOnRouteRecord(route) {
        route.__vd_match = false;
        route.children.forEach(resetMatchStateOnRouteRecord);
    }
    function isRouteMatching(route, filter) {
        const found = String(route.re).match(EXTRACT_REGEXP_RE);
        route.__vd_match = false;
        if (!found || found.length < 3) {
            return false;
        }
        // use a regexp without $ at the end to match nested routes better
        const nonEndingRE = new RegExp(found[1].replace(/\$$/, ''), found[2]);
        if (nonEndingRE.test(filter)) {
            // mark children as matches
            route.children.forEach(child => isRouteMatching(child, filter));
            // exception case: `/`
            if (route.record.path !== '/' || filter === '/') {
                route.__vd_match = route.re.test(filter);
                return true;
            }
            // hide the / route
            return false;
        }
        const path = route.record.path.toLowerCase();
        const decodedPath = decode(path);
        // also allow partial matching on the path
        if (!filter.startsWith('/') &&
            (decodedPath.includes(filter) || path.includes(filter)))
            return true;
        if (decodedPath.startsWith(filter) || path.startsWith(filter))
            return true;
        if (route.record.name && String(route.record.name).includes(filter))
            return true;
        return route.children.some(child => isRouteMatching(child, filter));
    }
    function omit(obj, keys) {
        const ret = {};
        for (const key in obj) {
            if (!keys.includes(key)) {
                // @ts-expect-error
                ret[key] = obj[key];
            }
        }
        return ret;
    }

    /**
     * Creates a Router instance that can be used by a Vue app.
     *
     * @param options - {@link RouterOptions}
     */
    function createRouter(options) {
        const matcher = createRouterMatcher(options.routes, options);
        const parseQuery$1 = options.parseQuery || parseQuery;
        const stringifyQuery$1 = options.stringifyQuery || stringifyQuery;
        const routerHistory = options.history;
        const beforeGuards = useCallbacks();
        const beforeResolveGuards = useCallbacks();
        const afterGuards = useCallbacks();
        const currentRoute = shallowRef(START_LOCATION_NORMALIZED);
        let pendingLocation = START_LOCATION_NORMALIZED;
        // leave the scrollRestoration if no scrollBehavior is provided
        if (isBrowser && options.scrollBehavior && 'scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        const normalizeParams = applyToParams.bind(null, paramValue => '' + paramValue);
        const encodeParams = applyToParams.bind(null, encodeParam);
        const decodeParams = 
        // @ts-expect-error: intentionally avoid the type check
        applyToParams.bind(null, decode);
        function addRoute(parentOrRoute, route) {
            let parent;
            let record;
            if (isRouteName(parentOrRoute)) {
                parent = matcher.getRecordMatcher(parentOrRoute);
                record = route;
            }
            else {
                record = parentOrRoute;
            }
            return matcher.addRoute(record, parent);
        }
        function removeRoute(name) {
            const recordMatcher = matcher.getRecordMatcher(name);
            if (recordMatcher) {
                matcher.removeRoute(recordMatcher);
            }
        }
        function getRoutes() {
            return matcher.getRoutes().map(routeMatcher => routeMatcher.record);
        }
        function hasRoute(name) {
            return !!matcher.getRecordMatcher(name);
        }
        function resolve(rawLocation, currentLocation) {
            // const objectLocation = routerLocationAsObject(rawLocation)
            // we create a copy to modify it later
            currentLocation = assign({}, currentLocation || currentRoute.value);
            if (typeof rawLocation === 'string') {
                const locationNormalized = parseURL(parseQuery$1, rawLocation, currentLocation.path);
                const matchedRoute = matcher.resolve({ path: locationNormalized.path }, currentLocation);
                const href = routerHistory.createHref(locationNormalized.fullPath);
                // locationNormalized is always a new object
                return assign(locationNormalized, matchedRoute, {
                    params: decodeParams(matchedRoute.params),
                    hash: decode(locationNormalized.hash),
                    redirectedFrom: undefined,
                    href,
                });
            }
            let matcherLocation;
            // path could be relative in object as well
            if ('path' in rawLocation) {
                matcherLocation = assign({}, rawLocation, {
                    path: parseURL(parseQuery$1, rawLocation.path, currentLocation.path).path,
                });
            }
            else {
                // remove any nullish param
                const targetParams = assign({}, rawLocation.params);
                for (const key in targetParams) {
                    if (targetParams[key] == null) {
                        delete targetParams[key];
                    }
                }
                // pass encoded values to the matcher so it can produce encoded path and fullPath
                matcherLocation = assign({}, rawLocation, {
                    params: encodeParams(rawLocation.params),
                });
                // current location params are decoded, we need to encode them in case the
                // matcher merges the params
                currentLocation.params = encodeParams(currentLocation.params);
            }
            const matchedRoute = matcher.resolve(matcherLocation, currentLocation);
            const hash = rawLocation.hash || '';
            // decoding them) the matcher might have merged current location params so
            // we need to run the decoding again
            matchedRoute.params = normalizeParams(decodeParams(matchedRoute.params));
            const fullPath = stringifyURL(stringifyQuery$1, assign({}, rawLocation, {
                hash: encodeHash(hash),
                path: matchedRoute.path,
            }));
            const href = routerHistory.createHref(fullPath);
            return assign({
                fullPath,
                // keep the hash encoded so fullPath is effectively path + encodedQuery +
                // hash
                hash,
                query: 
                // if the user is using a custom query lib like qs, we might have
                // nested objects, so we keep the query as is, meaning it can contain
                // numbers at `$route.query`, but at the point, the user will have to
                // use their own type anyway.
                // https://github.com/vuejs/router/issues/328#issuecomment-649481567
                stringifyQuery$1 === stringifyQuery
                    ? normalizeQuery(rawLocation.query)
                    : (rawLocation.query || {}),
            }, matchedRoute, {
                redirectedFrom: undefined,
                href,
            });
        }
        function locationAsObject(to) {
            return typeof to === 'string'
                ? parseURL(parseQuery$1, to, currentRoute.value.path)
                : assign({}, to);
        }
        function checkCanceledNavigation(to, from) {
            if (pendingLocation !== to) {
                return createRouterError(8 /* NAVIGATION_CANCELLED */, {
                    from,
                    to,
                });
            }
        }
        function push(to) {
            return pushWithRedirect(to);
        }
        function replace(to) {
            return push(assign(locationAsObject(to), { replace: true }));
        }
        function handleRedirectRecord(to) {
            const lastMatched = to.matched[to.matched.length - 1];
            if (lastMatched && lastMatched.redirect) {
                const { redirect } = lastMatched;
                let newTargetLocation = typeof redirect === 'function' ? redirect(to) : redirect;
                if (typeof newTargetLocation === 'string') {
                    newTargetLocation =
                        newTargetLocation.includes('?') || newTargetLocation.includes('#')
                            ? (newTargetLocation = locationAsObject(newTargetLocation))
                            : // force empty params
                                { path: newTargetLocation };
                    // @ts-expect-error: force empty params when a string is passed to let
                    // the router parse them again
                    newTargetLocation.params = {};
                }
                return assign({
                    query: to.query,
                    hash: to.hash,
                    params: to.params,
                }, newTargetLocation);
            }
        }
        function pushWithRedirect(to, redirectedFrom) {
            const targetLocation = (pendingLocation = resolve(to));
            const from = currentRoute.value;
            const data = to.state;
            const force = to.force;
            // to could be a string where `replace` is a function
            const replace = to.replace === true;
            const shouldRedirect = handleRedirectRecord(targetLocation);
            if (shouldRedirect)
                return pushWithRedirect(assign(locationAsObject(shouldRedirect), {
                    state: data,
                    force,
                    replace,
                }), 
                // keep original redirectedFrom if it exists
                redirectedFrom || targetLocation);
            // if it was a redirect we already called `pushWithRedirect` above
            const toLocation = targetLocation;
            toLocation.redirectedFrom = redirectedFrom;
            let failure;
            if (!force && isSameRouteLocation(stringifyQuery$1, from, targetLocation)) {
                failure = createRouterError(16 /* NAVIGATION_DUPLICATED */, { to: toLocation, from });
                // trigger scroll to allow scrolling to the same anchor
                handleScroll(from, from, 
                // this is a push, the only way for it to be triggered from a
                // history.listen is with a redirect, which makes it become a push
                true, 
                // This cannot be the first navigation because the initial location
                // cannot be manually navigated to
                false);
            }
            return (failure ? Promise.resolve(failure) : navigate(toLocation, from))
                .catch((error) => isNavigationFailure(error)
                ? // navigation redirects still mark the router as ready
                    isNavigationFailure(error, 2 /* NAVIGATION_GUARD_REDIRECT */)
                        ? error
                        : markAsReady(error) // also returns the error
                : // reject any unknown error
                    triggerError(error, toLocation, from))
                .then((failure) => {
                if (failure) {
                    if (isNavigationFailure(failure, 2 /* NAVIGATION_GUARD_REDIRECT */)) {
                        return pushWithRedirect(
                        // keep options
                        assign(locationAsObject(failure.to), {
                            state: data,
                            force,
                            replace,
                        }), 
                        // preserve the original redirectedFrom if any
                        redirectedFrom || toLocation);
                    }
                }
                else {
                    // if we fail we don't finalize the navigation
                    failure = finalizeNavigation(toLocation, from, true, replace, data);
                }
                triggerAfterEach(toLocation, from, failure);
                return failure;
            });
        }
        /**
         * Helper to reject and skip all navigation guards if a new navigation happened
         * @param to
         * @param from
         */
        function checkCanceledNavigationAndReject(to, from) {
            const error = checkCanceledNavigation(to, from);
            return error ? Promise.reject(error) : Promise.resolve();
        }
        // TODO: refactor the whole before guards by internally using router.beforeEach
        function navigate(to, from) {
            let guards;
            const [leavingRecords, updatingRecords, enteringRecords] = extractChangingRecords(to, from);
            // all components here have been resolved once because we are leaving
            guards = extractComponentsGuards(leavingRecords.reverse(), 'beforeRouteLeave', to, from);
            // leavingRecords is already reversed
            for (const record of leavingRecords) {
                record.leaveGuards.forEach(guard => {
                    guards.push(guardToPromiseFn(guard, to, from));
                });
            }
            const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(null, to, from);
            guards.push(canceledNavigationCheck);
            // run the queue of per route beforeRouteLeave guards
            return (runGuardQueue(guards)
                .then(() => {
                // check global guards beforeEach
                guards = [];
                for (const guard of beforeGuards.list()) {
                    guards.push(guardToPromiseFn(guard, to, from));
                }
                guards.push(canceledNavigationCheck);
                return runGuardQueue(guards);
            })
                .then(() => {
                // check in components beforeRouteUpdate
                guards = extractComponentsGuards(updatingRecords, 'beforeRouteUpdate', to, from);
                for (const record of updatingRecords) {
                    record.updateGuards.forEach(guard => {
                        guards.push(guardToPromiseFn(guard, to, from));
                    });
                }
                guards.push(canceledNavigationCheck);
                // run the queue of per route beforeEnter guards
                return runGuardQueue(guards);
            })
                .then(() => {
                // check the route beforeEnter
                guards = [];
                for (const record of to.matched) {
                    // do not trigger beforeEnter on reused views
                    if (record.beforeEnter && !from.matched.includes(record)) {
                        if (Array.isArray(record.beforeEnter)) {
                            for (const beforeEnter of record.beforeEnter)
                                guards.push(guardToPromiseFn(beforeEnter, to, from));
                        }
                        else {
                            guards.push(guardToPromiseFn(record.beforeEnter, to, from));
                        }
                    }
                }
                guards.push(canceledNavigationCheck);
                // run the queue of per route beforeEnter guards
                return runGuardQueue(guards);
            })
                .then(() => {
                // NOTE: at this point to.matched is normalized and does not contain any () => Promise<Component>
                // clear existing enterCallbacks, these are added by extractComponentsGuards
                to.matched.forEach(record => (record.enterCallbacks = {}));
                // check in-component beforeRouteEnter
                guards = extractComponentsGuards(enteringRecords, 'beforeRouteEnter', to, from);
                guards.push(canceledNavigationCheck);
                // run the queue of per route beforeEnter guards
                return runGuardQueue(guards);
            })
                .then(() => {
                // check global guards beforeResolve
                guards = [];
                for (const guard of beforeResolveGuards.list()) {
                    guards.push(guardToPromiseFn(guard, to, from));
                }
                guards.push(canceledNavigationCheck);
                return runGuardQueue(guards);
            })
                // catch any navigation canceled
                .catch(err => isNavigationFailure(err, 8 /* NAVIGATION_CANCELLED */)
                ? err
                : Promise.reject(err)));
        }
        function triggerAfterEach(to, from, failure) {
            // navigation is confirmed, call afterGuards
            // TODO: wrap with error handlers
            for (const guard of afterGuards.list())
                guard(to, from, failure);
        }
        /**
         * - Cleans up any navigation guards
         * - Changes the url if necessary
         * - Calls the scrollBehavior
         */
        function finalizeNavigation(toLocation, from, isPush, replace, data) {
            // a more recent navigation took place
            const error = checkCanceledNavigation(toLocation, from);
            if (error)
                return error;
            // only consider as push if it's not the first navigation
            const isFirstNavigation = from === START_LOCATION_NORMALIZED;
            const state = !isBrowser ? {} : history.state;
            // change URL only if the user did a push/replace and if it's not the initial navigation because
            // it's just reflecting the url
            if (isPush) {
                // on the initial navigation, we want to reuse the scroll position from
                // history state if it exists
                if (replace || isFirstNavigation)
                    routerHistory.replace(toLocation.fullPath, assign({
                        scroll: isFirstNavigation && state && state.scroll,
                    }, data));
                else
                    routerHistory.push(toLocation.fullPath, data);
            }
            // accept current navigation
            currentRoute.value = toLocation;
            handleScroll(toLocation, from, isPush, isFirstNavigation);
            markAsReady();
        }
        let removeHistoryListener;
        // attach listener to history to trigger navigations
        function setupListeners() {
            removeHistoryListener = routerHistory.listen((to, _from, info) => {
                // cannot be a redirect route because it was in history
                const toLocation = resolve(to);
                // due to dynamic routing, and to hash history with manual navigation
                // (manually changing the url or calling history.hash = '#/somewhere'),
                // there could be a redirect record in history
                const shouldRedirect = handleRedirectRecord(toLocation);
                if (shouldRedirect) {
                    pushWithRedirect(assign(shouldRedirect, { replace: true }), toLocation).catch(noop);
                    return;
                }
                pendingLocation = toLocation;
                const from = currentRoute.value;
                // TODO: should be moved to web history?
                if (isBrowser) {
                    saveScrollPosition(getScrollKey(from.fullPath, info.delta), computeScrollPosition());
                }
                navigate(toLocation, from)
                    .catch((error) => {
                    if (isNavigationFailure(error, 4 /* NAVIGATION_ABORTED */ | 8 /* NAVIGATION_CANCELLED */)) {
                        return error;
                    }
                    if (isNavigationFailure(error, 2 /* NAVIGATION_GUARD_REDIRECT */)) {
                        // Here we could call if (info.delta) routerHistory.go(-info.delta,
                        // false) but this is bug prone as we have no way to wait the
                        // navigation to be finished before calling pushWithRedirect. Using
                        // a setTimeout of 16ms seems to work but there is not guarantee for
                        // it to work on every browser. So Instead we do not restore the
                        // history entry and trigger a new navigation as requested by the
                        // navigation guard.
                        // the error is already handled by router.push we just want to avoid
                        // logging the error
                        pushWithRedirect(error.to, toLocation
                        // avoid an uncaught rejection, let push call triggerError
                        )
                            .then(failure => {
                            // manual change in hash history #916 ending up in the URL not
                            // changing but it was changed by the manual url change, so we
                            // need to manually change it ourselves
                            if (isNavigationFailure(failure, 4 /* NAVIGATION_ABORTED */ |
                                16 /* NAVIGATION_DUPLICATED */) &&
                                !info.delta &&
                                info.type === NavigationType.pop) {
                                routerHistory.go(-1, false);
                            }
                        })
                            .catch(noop);
                        // avoid the then branch
                        return Promise.reject();
                    }
                    // do not restore history on unknown direction
                    if (info.delta)
                        routerHistory.go(-info.delta, false);
                    // unrecognized error, transfer to the global handler
                    return triggerError(error, toLocation, from);
                })
                    .then((failure) => {
                    failure =
                        failure ||
                            finalizeNavigation(
                            // after navigation, all matched components are resolved
                            toLocation, from, false);
                    // revert the navigation
                    if (failure) {
                        if (info.delta) {
                            routerHistory.go(-info.delta, false);
                        }
                        else if (info.type === NavigationType.pop &&
                            isNavigationFailure(failure, 4 /* NAVIGATION_ABORTED */ | 16 /* NAVIGATION_DUPLICATED */)) {
                            // manual change in hash history #916
                            // it's like a push but lacks the information of the direction
                            routerHistory.go(-1, false);
                        }
                    }
                    triggerAfterEach(toLocation, from, failure);
                })
                    .catch(noop);
            });
        }
        // Initialization and Errors
        let readyHandlers = useCallbacks();
        let errorHandlers = useCallbacks();
        let ready;
        /**
         * Trigger errorHandlers added via onError and throws the error as well
         *
         * @param error - error to throw
         * @param to - location we were navigating to when the error happened
         * @param from - location we were navigating from when the error happened
         * @returns the error as a rejected promise
         */
        function triggerError(error, to, from) {
            markAsReady(error);
            const list = errorHandlers.list();
            if (list.length) {
                list.forEach(handler => handler(error, to, from));
            }
            else {
                console.error(error);
            }
            return Promise.reject(error);
        }
        function isReady() {
            if (ready && currentRoute.value !== START_LOCATION_NORMALIZED)
                return Promise.resolve();
            return new Promise((resolve, reject) => {
                readyHandlers.add([resolve, reject]);
            });
        }
        function markAsReady(err) {
            if (!ready) {
                // still not ready if an error happened
                ready = !err;
                setupListeners();
                readyHandlers
                    .list()
                    .forEach(([resolve, reject]) => (err ? reject(err) : resolve()));
                readyHandlers.reset();
            }
            return err;
        }
        // Scroll behavior
        function handleScroll(to, from, isPush, isFirstNavigation) {
            const { scrollBehavior } = options;
            if (!isBrowser || !scrollBehavior)
                return Promise.resolve();
            const scrollPosition = (!isPush && getSavedScrollPosition(getScrollKey(to.fullPath, 0))) ||
                ((isFirstNavigation || !isPush) &&
                    history.state &&
                    history.state.scroll) ||
                null;
            return nextTick()
                .then(() => scrollBehavior(to, from, scrollPosition))
                .then(position => position && scrollToPosition(position))
                .catch(err => triggerError(err, to, from));
        }
        const go = (delta) => routerHistory.go(delta);
        let started;
        const installedApps = new Set();
        const router = {
            currentRoute,
            addRoute,
            removeRoute,
            hasRoute,
            getRoutes,
            resolve,
            options,
            push,
            replace,
            go,
            back: () => go(-1),
            forward: () => go(1),
            beforeEach: beforeGuards.add,
            beforeResolve: beforeResolveGuards.add,
            afterEach: afterGuards.add,
            onError: errorHandlers.add,
            isReady,
            install(app) {
                const router = this;
                app.component('RouterLink', RouterLink);
                app.component('RouterView', RouterView);
                app.config.globalProperties.$router = router;
                Object.defineProperty(app.config.globalProperties, '$route', {
                    enumerable: true,
                    get: () => unref(currentRoute),
                });
                // this initial navigation is only necessary on client, on server it doesn't
                // make sense because it will create an extra unnecessary navigation and could
                // lead to problems
                if (isBrowser &&
                    // used for the initial navigation client side to avoid pushing
                    // multiple times when the router is used in multiple apps
                    !started &&
                    currentRoute.value === START_LOCATION_NORMALIZED) {
                    // see above
                    started = true;
                    push(routerHistory.location).catch(err => {
                    });
                }
                const reactiveRoute = {};
                for (const key in START_LOCATION_NORMALIZED) {
                    // @ts-expect-error: the key matches
                    reactiveRoute[key] = computed(() => currentRoute.value[key]);
                }
                app.provide(routerKey, router);
                app.provide(routeLocationKey, reactive(reactiveRoute));
                app.provide(routerViewLocationKey, currentRoute);
                const unmountApp = app.unmount;
                installedApps.add(app);
                app.unmount = function () {
                    installedApps.delete(app);
                    // the router is not attached to an app anymore
                    if (installedApps.size < 1) {
                        // invalidate the current navigation
                        pendingLocation = START_LOCATION_NORMALIZED;
                        removeHistoryListener && removeHistoryListener();
                        currentRoute.value = START_LOCATION_NORMALIZED;
                        started = false;
                        ready = false;
                    }
                    unmountApp();
                };
                if ((__VUE_PROD_DEVTOOLS__) && isBrowser) {
                    addDevtools(app, router, matcher);
                }
            },
        };
        return router;
    }
    function runGuardQueue(guards) {
        return guards.reduce((promise, guard) => promise.then(() => guard()), Promise.resolve());
    }
    function extractChangingRecords(to, from) {
        const leavingRecords = [];
        const updatingRecords = [];
        const enteringRecords = [];
        const len = Math.max(from.matched.length, to.matched.length);
        for (let i = 0; i < len; i++) {
            const recordFrom = from.matched[i];
            if (recordFrom) {
                if (to.matched.find(record => isSameRouteRecord(record, recordFrom)))
                    updatingRecords.push(recordFrom);
                else
                    leavingRecords.push(recordFrom);
            }
            const recordTo = to.matched[i];
            if (recordTo) {
                // the type doesn't matter because we are comparing per reference
                if (!from.matched.find(record => isSameRouteRecord(record, recordTo))) {
                    enteringRecords.push(recordTo);
                }
            }
        }
        return [leavingRecords, updatingRecords, enteringRecords];
    }

    const _sfc_main = defineComponent({
      name: "Popupview"
    });
    const _hoisted_1 = { class: "popup" };
    function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
      return openBlock(), createElementBlock("div", _hoisted_1, "Hi, template-chrome-extension");
    }
    var Popup = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render], ["__file", "popup.vue"]]);

    const routes = [
      {
        path: "/",
        name: "home",
        component: Popup
      },
      {
        path: "/libs/views/popup.html",
        name: "popup",
        component: Popup
      }
    ];
    const router = createRouter({
      history: createWebHashHistory("/"),
      routes
    });

    const app = createApp(App);
    app.use(router);
    app.mount("#popup-app");

}));
