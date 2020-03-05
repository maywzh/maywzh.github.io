---
title: JavaScript中的this
author: maywzh
tags:
  - JavaScript
categories: 编程
date: 2016-10-30 13:36:00
---
我们由一段代码开始本文的主题。

```javascript
var obj = {
  foo: function () { 
      console.log(this.bar) 
  },
  bar: 1
};

var foo = obj.foo;
var bar = 2;
foo === obj.foo //true
obj.foo() // 1
foo() // 2
```

可以看到，`foo`和`obj.foo`实际上是严格相等的，它们是指向同一个代码段。由于**上下文环境**不同，所以他们运行的结果也不一样。`obj.foo`的上下文环境就是`this`指向的`obj`，而`foo`的上下文环境是全局环境。

<!--more-->

##  JavaScript的内存数据结构

我们需要深入到JavaScript的内存数据结构去寻找答案。

```javascript
let obj = { foo:1 };
```

我们把一个对象`{ foo:1 }`赋值给对象`obj`。这个过程实际上是JavaScript引擎在内存中生成一个`{ foo:1 }`然后再把这个对象的内存地址赋值给`obj`。

![分配内存5](https://ws1.sinaimg.cn/large/006tNc79gy1fvqbhkag2gj30ws0h0dgu.jpg)

这其实就跟C语言中的指针概念相似，先分配一块内存，初始化后，把内存的地址赋给一个指针。`obj`起的就是一个指针的作用，它保存一个地址，JavaScript引擎读取它时是直接从`obj`中取内存地址，然后再去改地址取原始对象。

原始对象以字典结构存储。对象的每一个属性也都对应一个属性描述对象。`value`保存的是属性的值。

![对象属性](https://ws1.sinaimg.cn/large/006tNc79gy1fvqbs40q14j30za0gm0tp.jpg)

## 函数的内存结构

如果属性是一个函数，内存中的数据结构是怎样的？

```javascript
var obj = { bar: function () {} };
```

这个时候函数其实就是属性的值，函数在计算机中实际上就是一段代码段，它占据着一段内存。此时属性的值并不是直接保存这段代码段，而是保存它对应的内存地址，属性是指向这个函数的指针。

![内存结构](https://ws2.sinaimg.cn/large/006tNc79gy1fvqc1p3edtj312u0gmmyr.jpg)

那么运行`bar=obj.bar`会发生什么呢？只是把`bar`这个变量也指向了`obj.bar`指向的函数所占据的内存的地址。

![全局bar指向同一个地址](https://ws1.sinaimg.cn/large/006tNc79gy1fvqcapxkxrj31380pcwh1.jpg)

所以我们知道了，函数只是一个内存中存储的代码段（执行逻辑），它可以在不同的上下文(运行环境)中执行。

## 环境变量

函数如何获得上下文(context)呢？`this`正是起这个作用。

```javascript
var f = function () {
  console.log(this.x);
} //该代码段被保存于一个内存区域A

var x = 1;
var obj = {
  f: f, //指向A
  x: 2,
};

// this指代当前上下文 即全局环境
f() // this.x==(global).x==1

// this指代obj
obj.f() // this.x==obj.x==2
```

执行函数的时候会检查调用函数的指针的上下文，而函数中的`this`指代的正是这个函数指针所在的上下文。