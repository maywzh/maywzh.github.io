---
title: 实现JavaScript中的Promise
categories: Programing Language
comments: false
date: 2017-07-26 12:35:04
tags:
  - JavaScript 
  - Promise
thumbnail: https://ws3.sinaimg.cn/large/006tNbRwgy1fwe3ao4il2j310e0oa75t.jpg
---

Promise类似于一个容器，里面保存着某个未来才会结束的事件（通常是一个异步操作）的结果。Promise 是一个对象，从它可以获取异步操作的消息。Promise 提供统一的 API，各种异步操作都可以用同样的方法进行处理。

<!--more-->

## “回调地狱”的解决方案

Promise是处理异步编码的一个解决方案，在Promise出现以前，异步代码的编写都是通过回调函数来处理的，虽然单层回调代码相当直观，但多次回调就显得比较复杂，被称为**回调地狱**。

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

为了解决这个问题，引入了`Promise`对象，`Promise`作为一个容器，接受一个未来会发生的事件。它有三个状态`pending`（进行中）、`fulfilled`（已成功）和`rejected`（已失败）。只有异步操作的结果，可以决定当前是哪一种状态，任何其他操作都无法改变这个状态。一旦状态改变，就不会再变，任何时候都可以得到这个结果。`Promise`对象的状态改变，只有两种可能：从`pending`变为`fulfilled`和从`pending`变为`rejected`。只要这两种情况发生，状态就凝固了，不会再变了，会一直保持这个结果，这时就称为 resolved（已定型）。如果改变已经发生了，你再对`Promise`对象添加回调函数，也会立即得到这个结果。这与事件（Event）完全不同，事件的特点是，如果你错过了它，再去监听，是得不到结果的。

![promise](https://ws1.sinaimg.cn/large/006tNbRwgy1fw4jbmjtzaj30e807st8l.jpg)

`Promise`对象构造函数接受一个函数作为参数，该函数有两个参数，`resolve`和`reject`。这两个函数由Promise的实现库来提供。`resolve`函数的作用是，将`Promise`对象的状态从“未完成”变为“成功”（即从 pending 变为 resolved），在异步操作成功时调用，并将异步操作的结果，作为参数传递出去；`reject`函数的作用是，将`Promise`对象的状态从“未完成”变为“失败”（即从 pending 变为 rejected），在异步操作失败时调用，并将异步操作报出的错误，作为参数传递出去。

```javascript
const promise = new Promise(function(resolve, reject) {
  // ... some code

  if (/* 异步操作成功 */){
    resolve(value);
  } else {
    reject(error);
  }
});
```



## 实现一个Promise

### 基本结构

为了实现Promise，Promise对象需要一个状态指示器`state`，一个`value`代表要传递的数据，一个`reason`代表错误原因。还有`resolve`和`reject`函数作为状态转换函数。

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

### 实现执行器函数executor

Promise对象就是为了立即执行传入的executor，这个executor返回一个异步结果。

```javascript
let p = new Promise((resolve, reject) => {
    console.log('执行了');
});

//运行结果 执行了
```

实现立即执行

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

### 实现状态更新函数resolve和reject

只有`pending`状态才可以更新，`resolve`和`reject`需要实现这一点。

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

### 实现then方法和链式调用

`then`方法用于处理异步返回结果，定义在`prototype`上。`then`需要实现的是，根据不同的`Promise`状态来进行不同的“回调”操作。

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

Promise的链式调用的关键在于`then`方法返回一个`Promise`对象，这样就可以继续`then()`，规范有

1. 每个then方法都返回一个新的Promise对象（**原理的核心**）
2. 如果then方法中显示地返回了一个Promise对象就以此对象为准，返回它的结果
3. 如果then方法中返回的是一个普通值（如Number、String等）就使用此值包装成一个新的Promise对象返回。
4. 如果then方法中没有return语句，就视为返回一个用Undefined包装的Promise对象
5. 若then方法中出现异常，则调用失败态方法（reject）跳转到下一个then的onRejected
6. 如果then方法没有传入任何回调，则继续向下传递（值的传递特性）。

第三点：如果then方法中返回的是一个普通值（如Number、String等）就使用此值包装成一个新的Promise对象返回。

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

第四点，如果then方法中没有return语句，就视为返回一个用Undefined包装的Promise对象

```javascript
let p = new Promise((resolve, reject) => {
    resolve(1);
});

p.then(data => {
    //没有return语句
}).then(data => {
    console.log(data); //undefined
});
```

第六点，如果then方法没有传入任何回调，则继续向下传递，这就是Promise中值的穿透

```javascript
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

在第一个then方法之后连续调用了两个空的then方法 ，没有传入任何回调函数，也没有返回值，此时Promise会将值一直向下传递，直到接收处理它，这就是所谓的值的穿透。



### 实现异步executor支持

设想如果`executor`中包含异步过程

```javascript
let p = new Promise((resolve, reject) => {
    setTimeout(() => {
        resolve(1);
    }，500);
});

p.then(data => console.log(data)); //无输出
```

代码不输出任何结果，原因是`setTimeout`函数使得`resolve`是异步执行的，有延迟，当调用`then`方法的时候，此时此刻的状态还是等待态（pending），因此then方法即没有调用`onFulfilled`也没有调用`onRejected`。

需要做到的事`then`方法执行时，如果还在Promise处于pending状态，那么把回调函数push到一个回调队列中，状态发生改变了就依次从该队列中取出执行。用Array来实现。

```javascript
function Promise(executor) {
    var _this = this;
    this.state = 'pending';
    this.value = undefined;
    this.reason = undefined;
    this.onFulfilledFunc = [];//成功回调队列
    this.onRejectedFunc = [];//失败回调队列
    //其它代码略...
}
```

实现`then`的回调队列。

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
	//省略...
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



### 实现

搞清楚了这些点，我们就可以动手实现then方法的链式调用，一起来完善它：

```javascript
Promise.prototype.then = function (onFulfilled, onRejected) {
    var promise2 = new Promise((resolve, reject) => {
    //代码略...
    }
    return promise2;
};
```

首先，不论何种情况then都返回Promise对象，我们就实例化一个新promise2并返回。

接下来就处理根据上一个then方法的返回值来生成新Promise对象，由于这块逻辑较复杂且有很多处调用，我们抽离出一个方法来操作，这也是规范中说明的：

```javascript
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

```javascript
let promise2 = p.then(data => {
    return promise2;
});
```

运行结果：

```
TypeError: Chaining cycle detected for promise #<Promise>
```

很显然，如果返回了自己的Promise对象，状态永远为等待态（pending），再也无法成为resolved或是rejected，程序会死掉，因此首先要处理它：

```javascript
function resolvePromise(promise2, x, resolve, reject) {
    if (promise2 === x) {
        reject(new TypeError('Promise发生了循环引用'));
    }
}
```

接下来就是分各种情况处理。当`x`就是一个Promise，那么就执行它，成功即成功，失败即失败。若`x`是一个对象或是函数，再进一步处理它，否则就是一个普通值：

```javascript
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

```javascript
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

```javascript
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

```javascript
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

```javascript
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



## 测试

其实，写到此处Promise的真正源码已经写完了，但是距离100分还差一分，是什么呢？

规范中说明，Promise的then方法是异步执行的。

> onFulfilled or onRejected must not be called until the execution context stack contains only platform code.

ES6的原生Promise对象已经实现了这一点，但是我们自己的代码是同步执行，不相信可以试一下，那么如何将同步代码变成异步执行呢？可以使用setTimeout函数来模拟一下：

```javascript
setTimeout(()=>{
    //此处的代码会异步执行
},0);
```

利用此技巧，将代码then执行处的所有地方使用setTimeout变为异步即可，举个栗子：

```javascript
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

