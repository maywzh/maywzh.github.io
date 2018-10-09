---
title: JavaScript中的Promise
categories: uncategorized
comments: false
date: 2018-10-09 12:35:04
tags:
---

Promise类似于一个容器，里面保存着某个未来才会结束的事件（通常是一个异步操作）的结果。Promise 是一个对象，从它可以获取异步操作的消息。Promise 提供统一的 API，各种异步操作都可以用同样的方法进行处理。

<!--more-->

## 解决回调函数的连续调用

Promise是处理异步编码的一个解决方案，在Promise出现以前，异步代码的编写都是通过回调函数来处理的，虽然单层回调代码相当直观，但多次回调就显得比较复杂。

```javascript
const fs = require('fs');
fs.readFile('1.txt', (err,data) => {
    fs.readFile('2.txt', (err,data) => {
        fs.readFile('3.txt', (err,data) => {
            //可能还有后续代码
        });
    });
});
```

由于回调代码必须作为参数传递给调用函数，所以很容易出现这种回调穿插回调的代码，可读性不高。

同样的功能使用Promise实现

```javascript
const util = require('util');
const fs = require('fs');
const readFile = util.promisify(fs.readFile);

readFile('1.txt')
    .then(data => {
        return readFile('2.txt');
    }).then(data => {
        return readFile('3.txt');
    }).then(data => {
        //...
    });
```

把执行器函数作为Promise对象的参数，回调函数作为参数传入then。可以看到，代码是从上至下纵向发展了，更加符合人类逻辑。



## Promise代码基本结构

实例化Promise对象时传入一个函数作为执行器，有两个参数（resolve和reject）分别将结果变为成功态和失败态。我们可以写出基本结构

```javascript
function Promise(executor) {
    this.state = 'pending'; //状态
    this.value = undefined; //成功结果
    this.reason = undefined; //失败原因

    function resolve(value) {
        
    }

    function reject(reason) {

    }
}

module.exports = Promise;
```

其中state属性保存了Promise对象的状态，规范中指明，一个Promise对象只有三种状态：**等待态（pending）成功态（resolved）和失败态（rejected）**。
当一个Promise对象执行成功了要有一个结果，它使用value属性保存；也有可能由于某种原因失败了，这个失败原因放在reason属性中保存。



## 执行器函数executor

当我们自己实例化一个Promise时，其执行器函数（executor）会立即执行，这是一定的：

```javascript
let p = new Promise((resolve, reject) => {
    console.log('执行了');
});

//运行结果 执行了
```

因此，当实例化Promise时，构造函数中就要马上调用传入的executor函数执行

```javascript
function Promise(executor) {
    var _this = this;
    this.state = 'pending';
    this.value = undefined;
    this.reason = undefined;

    executor(resolve, reject); //马上执行
    
    function resolve(value) {}
    function reject(reason) {}
}
```



## 状态更新

规范中规定，当Promise对象已经由pending状态改变为了成功态（resolved）或是失败态（rejected）就不能再次更改状态了。因此我们在更新状态时要判断，如果当前状态是pending（等待态）才可更新：

```javascript
    function resolve(value) {
        //当状态为pending时再做更新
        if (_this.state === 'pending') {
            _this.value = value;//保存成功结果
            _this.state = 'resolved';
        }

    }

    function reject(reason) {
    //当状态为pending时再做更新
        if (_this.state === 'pending') {
            _this.reason = reason;//保存失败原因
            _this.state = 'rejected';
        }
    }
```

以上可以看到，在resolve和reject函数中分别加入了判断，只有当前状态是pending才可进行操作，同时将成功的结果和失败的原因都保存到对应的属性上。之后将state属性置为更新后的状态。



## then方法

每一个Promise实例都有一个then方法，它用来处理异步返回的结果，它是**定义在原型上的方法**，我们先写一个空方法做好准备：

```javascript
Promise.prototype.then = function (onFulfilled, onRejected) {
};
```

当Promise的状态发生了改变，不论是成功或是失败都会调用then方法，所以，then方法的实现也很简单，根据state状态来调用不同的回调函数即可，onFulfilled 和 onRejected 都是可选参数，也就是说可以传也可以不传。传入的回调函数也不是一个函数类型，因此需要判断一下回调函数的类型，如果明确是个函数再执行它。：

```javascript
Promise.prototype.then = function (onFulfilled, onRejected) {
    if (this.state === 'resolved') {
        //判断参数类型，是函数执行之
        if (typeof onFulfilled === 'function') {
            onFulfilled(this.value);
        }

    }
    if (this.state === 'rejected') {
        if (typeof onRejected === 'function') {
            onRejected(this.reason);
        }
    }
};
```



## 让Promise支持异步

代码写到这里似乎基本功能都实现了，可是还有一个很大的问题，目前此Promise还不支持异步代码，如果Promise中封装的是异步操作，then方法无能为力：

```javascript
let p = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve(1);
    }，500);
});

p.then(data => console.log(data)); //没有任何结果
```

运行以上代码发现没有任何结果，本意是等500毫秒后执行then方法，哪里有问题呢？原因是setTimeout函数使得resolve是异步执行的，有延迟，当调用then方法的时候，此时此刻的状态还是等待态（pending），因此then方法即没有调用onFulfilled也没有调用onRejected。

这个问题如何解决？我们可以参照发布订阅模式，在执行then方法时如果还在等待态（pending），就把回调函数临时寄存到一个数组里，当状态发生改变时依次从数组中取出执行就好了，清楚这个思路我们实现它，首先在类上新增两个Array类型的数组，用于存放回调函数：

```javascript
function Promise(executor) {
    var _this = this;
    this.state = 'pending';
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledFunc = [];//保存成功回调
    this.onRejectedFunc = [];//保存失败回调
    //其它代码略...
}
```

这样当then方法执行时，若状态还在等待态（pending），将回调函数依次放入数组中：

```javascript
Promise.prototype.then = function (onFulfilled, onRejected) {
    //等待态，此时异步代码还没有走完
    if (this.state === 'pending') {
        if (typeof onFulfilled === 'function') {
            this.onFulfilledFunc.push(onFulfilled);//保存回调
        }
        if (typeof onRejected === 'function') {
            this.onRejectedFunc.push(onRejected);//保存回调
        }
    }
    //其它代码略...
};
```

寄存好了回调，接下来就是当状态改变时执行就好了：

```javascript
    function resolve(value) {
        if (_this.state === 'pending') {
            _this.value = value;
            //依次执行成功回调
            _this.onFulfilledFunc.forEach(fn => fn(value));
            _this.state = 'resolved';
        }

    }

    function reject(reason) {
        if (_this.state === 'pending') {
            _this.reason = reason;
            //依次执行失败回调
            _this.onRejectedFunc.forEach(fn => fn(reason));
            _this.state = 'rejected';
        }
    }
```

至此，Promise已经支持了异步操作，setTimeout延迟后也可正确执行then方法返回结果。

## 链式调用

Promise处理异步代码最强大的地方就是支持链式调用，这块也是最复杂的，我们先梳理一下规范中是怎么定义的：

1. 每个then方法都返回一个新的Promise对象（**原理的核心**）
2. 如果then方法中显示地返回了一个Promise对象就以此对象为准，返回它的结果
3. 如果then方法中返回的是一个普通值（如Number、String等）就使用此值包装成一个新的Promise对象返回。
4. 如果then方法中没有return语句，就视为返回一个用Undefined包装的Promise对象
5. 若then方法中出现异常，则调用失败态方法（reject）跳转到下一个then的onRejected
6. 如果then方法没有传入任何回调，则继续向下传递（值的传递特性）。

规范中说的很抽像，我们可以把不好理解的点使用代码演示一下。

其中第3项，如果返回是个普通值就使用它包装成Promise，我们用代码来演示：

```javascript
let p =new Promise((resolve,reject)=>{
    resolve(1);
});

p.then(data=>{
    return 2; //返回一个普通值
}).then(data=>{
    console.log(data); //输出2
});
```

可见，当then返回了一个普通的值时，下一个then的成功态回调中即可取到上一个then的返回结果，说明了上一个then正是使用2来包装成的Promise，这符合规范中说的。

第4项，如果then方法中没有return语句，就视为返回一个用Undefined包装的Promise对象

```
let p = new Promise((resolve, reject) => {
    resolve(1);
});

p.then(data => {
    //没有return语句
}).then(data => {
    console.log(data); //undefined
});
```

可以看到，当没有返回任何值时不会报错，没有任何语句时实际上就是`return undefined;`即将undefined包装成Promise对象传给下一个then的成功态。

第6项，如果then方法没有传入任何回调，则继续向下传递，这是什么意思呢？这就是Promise中值的穿透，还是用代码演示一下：

```
let p = new Promise((resolve, reject) => {
    resolve(1);
});

p.then(data => 2)
.then()
.then()
.then(data => {
    console.log(data); //2
});
```

以上代码，在第一个then方法之后连续调用了两个空的then方法 ，没有传入任何回调函数，也没有返回值，此时Promise会将值一直向下传递，直到你接收处理它，这就是所谓的值的穿透。

现在可以明白链式调用的原理，不论是何种情况then方法都会返回一个Promise对象，这样才会有下个then方法。

搞清楚了这些点，我们就可以动手实现then方法的链式调用，一起来完善它：

```
Promise.prototype.then = function (onFulfilled, onRejected) {
    var promise2 = new Promise((resolve, reject) => {
    //代码略...
    }
    return promise2;
};
```

首先，不论何种情况then都返回Promise对象，我们就实例化一个新promise2并返回。

接下来就处理根据上一个then方法的返回值来生成新Promise对象，由于这块逻辑较复杂且有很多处调用，我们抽离出一个方法来操作，这也是规范中说明的：

```
/**
 * 解析then返回值与新Promise对象
 * @param {Object} promise2 新的Promise对象 
 * @param {*} x 上一个then的返回值
 * @param {Function} resolve promise2的resolve
 * @param {Function} reject promise2的reject
 */
function resolvePromise(promise2, x, resolve, reject) {
    //...
}
```

`resolvePromise`方法用来封装链式调用产生的结果，下面我们分别一个个情况的写出它的逻辑，首先规范中说明，如果`promise2`和 `x` 指向同一对象，就使用TypeError作为原因转为失败。原文如下：

> If promise and x refer to the same object, reject promise with a TypeError as the reason.

这是什么意思？其实就是循环引用，当then的返回值与新生成的Promise对象为同一个（引用地址相同），则会抛出TypeError错误：

```
let promise2 = p.then(data => {
    return promise2;
});
```

运行结果：

```
TypeError: Chaining cycle detected for promise #<Promise>
```

很显然，如果返回了自己的Promise对象，状态永远为等待态（pending），再也无法成为resolved或是rejected，程序会死掉，因此首先要处理它：

```
function resolvePromise(promise2, x, resolve, reject) {
    if (promise2 === x) {
        reject(new TypeError('Promise发生了循环引用'));
    }
}
```

接下来就是分各种情况处理。当`x`就是一个Promise，那么就执行它，成功即成功，失败即失败。若`x`是一个对象或是函数，再进一步处理它，否则就是一个普通值：

```
function resolvePromise(promise2, x, resolve, reject) {
    if (promise2 === x) {
        reject(new TypeError('Promise发生了循环引用'));
    }

    if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
        //可能是个对象或是函数
    } else {
        //否则是个普通值
        resolve(x);
    }
}
```

此时规范中说明，若是个对象，则尝试将对象上的then方法取出来，此时如果报错，那就将promise2转为失败态。原文：

> If retrieving the property x.then results in a thrown exception e, reject promise with e as the reason.

```
function resolvePromise(promise2, x, resolve, reject) {
    //代码略...
    if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
        //可能是个对象或是函数
        try {
            let then = x.then;//取出then方法引用
        } catch (e) {
            reject(e);
        }
        
    } else {
        //否则是个普通值
        resolve(x);
    }
}
```

多说几句，为什么取对象上的属性有报错的可能？Promise有很多实现（bluebird，Q等），Promises/A+只是一个规范，大家都按此规范来实现Promise才有可能通用，因此所有出错的可能都要考虑到，假设另一个人实现的Promise对象使用`Object.defineProperty()`恶意的在取值时抛错，我们可以防止代码出现Bug。

此时，如果对象中有then，且then是函数类型，就可以认为是一个Promise对象，之后，使用`x`作为this来调用then方法。

> If then is a function, call it with x as this

```
//其他代码略...
if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    //可能是个对象或是函数
    try {
        let then = x.then; 
        if (typeof then === 'function') {
            //then是function，那么执行Promise
            then.call(x, (y) => {
                resolve(y);
            }, (r) => {
                reject(r);
            });
        } else {
            resolve(x);
        }
    } catch (e) {
        reject(e);
    }

} else {
    //否则是个普通值
    resolve(x);
}
```

这样链式写法就基本完成了。但是还有一种极端的情况，如果Promise对象转为成功态或是失败时传入的还是一个Promise对象，此时应该继续执行，直到最后的Promise执行完。

```
p.then(data => {
    return new Promise((resolve,reject)=>{
        //resolve传入的还是Promise
        resolve(new Promise((resolve,reject)=>{
            resolve(2);
        }));
    });
})
```

此时就要使用递归操作了。

规范中原文如下：

> If a promise is resolved with a thenable that participates in a circular thenable chain, such that the recursive nature of [[Resolve]](promise, thenable) eventually causes [[Resolve]](promise, thenable) to be called again, following the above algorithm will lead to infinite recursion. Implementations are encouraged, but not required, to detect such recursion and reject promise with an informative TypeError as the reason.

很简单，把调用resolve改写成递归执行resolvePromise方法即可，这样直到解析Promise成一个普通值才会终止，即完成此规范：

```
//其他代码略...
if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
    //可能是个对象或是函数
    try {
        let then = x.then; 
        if (typeof then === 'function') {
            let y = then.call(x, (y) => {
                //递归调用，传入y若是Promise对象，继续循环
                resolvePromise(promise2, y, resolve, reject);
            }, (r) => {
                reject(r);
            });
        } else {
            resolve(x);
        }
    } catch (e) {
        reject(e);
    }

} else {
    //是个普通值，最终结束递归
    resolve(x);
}
```

到此，链式调用的代码已全部完毕。在相应的地方调用`resolvePromise`方法即可。



## 异步执行和测试

其实，写到此处Promise的真正源码已经写完了，但是距离100分还差一分，是什么呢？

规范中说明，Promise的then方法是异步执行的。

> onFulfilled or onRejected must not be called until the execution context stack contains only platform code.

ES6的原生Promise对象已经实现了这一点，但是我们自己的代码是同步执行，不相信可以试一下，那么如何将同步代码变成异步执行呢？可以使用setTimeout函数来模拟一下：

```
setTimeout(()=>{
    //此处的代码会异步执行
},0);
```

利用此技巧，将代码then执行处的所有地方使用setTimeout变为异步即可，举个栗子：

```
setTimeout(() => {
    try {
        let x = onFulfilled(value);
        resolvePromise(promise2, x, resolve, reject);
    } catch (e) {
        reject(e);
    }
},0);
```



可以利用promises-aplus-tests来测试代码

