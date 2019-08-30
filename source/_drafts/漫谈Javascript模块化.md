---
title: 漫谈Javascript模块化
categories: Programing Language
comments: false
date: 2017-01-27 01:58:18
tags:
  - JavaScript 
thumbnail: https://ws2.sinaimg.cn/large/006tNbRwgy1fwe39d6qiaj31kw0zuwh0.jpg
---

js代码2009年HTML5兴起后，前端代码的行数已经呈现井喷式发展，随着代码量的增加，模块的缺失的缺点日益凸显，Javascript社区做了很多探索。如今JavaScript模块化编程的概念已经普及开来，一提起模块化，大家想到的可能是AMD，CMD，requirejs或seajs。其实还有很多其他的概念。本文将会陈述下JavaScript模块的前世今生。

<!--more-->

## 模块

> 模块,又称构件,是能够单独命名并独立地完成一定功能的程序语句的集合（即程序代码和数据结构的集合体）

一个独立的模块需要能够独立完成一个功能，可以引用依赖和被依赖。例如C语言中的库和头文件，Java中的包，等等。

## 原始写法

一个函数实际上就是一个模块

```javascript
//最简单的函数，可以称作一个模块
function add(x, y) {
	return x + y;
}
```

一个更合理的模拟模块方式

```javascript
(function (mod, $, _) {
	mod.add = ***;
	mod.sub = ***;
}((window.mod = window.mod || {}), jQuery, Underscore));
```

这依旧不完美，因为这个模块必须要先依赖jQuery库。理想的情况是，模块的依赖顺序是随意的，我们可以随机顺序指定依赖而不用担心定义先后的问题。



## CMD(Common Module Definition)

说道[CMD](https://github.com/cmdjs/specification)就不能不提[commonjs](http://wiki.commonjs.org/wiki/CommonJS)，提到commonjs就不能不提[node](http://nodejs.org/)。

CMD规范参照commonjs中的方式，定义模块的方式如下:

```javascript
define(function(require, exports, module) {
  // The module code goes here
});
```

一个文件就是一个模块，文件名就是模块的名字，使用模块的方法也和commonjs中一致，只需require就好了，模块名字可省略后缀。

```javascript
//使用event.js模块
var ec = require('event');
```

CMD的典型实现就是[seajs](http://seajs.org/)，应用的很广泛。



## AMD(Asynchronous Module Definition)

[AMD](https://github.com/amdjs/amdjs-api/wiki/AMD-(%E4%B8%AD%E6%96%87%E7%89%88))是异步模块定义，特别适合在浏览器端使用，其规范和CMD是很像的，AMD规范中定义模块的方式如下：

```javascript
define(id?, dependencies?, factory);
```

同CMD一样，一个文件即一个模块，模块的使用方法如下：

```javascript
define(["beta"], function (beta) {
	bata.***//调用模块
});
```

AMD主张依赖注入，这点和CMD不同（以来查找）。

AMD也支持已CMD的方式来使用依赖。

AMD的典型实现有[requireJS](http://requirejs.org/)，[modJS](https://github.com/fex-team/mod)和[lodJS](https://github.com/yanhaijing/lodjs)。



## ES6

[ES6](http://yanhaijing.com/es5/)带来了语言层面的模块化支持，规范方面见[这里](https://people.mozilla.org/~jorendorff/es6-draft.html#sec-module-namespace-exotic-objects)，文档方面见[这里](http://es6.ruanyifeng.com/#docs/class)。=



## UMD

[UMD](https://github.com/umdjs/umd)的全称是Universal Module Definition。和它名字的意思一样，这种规范基本上可以在任何一个模块环境中工作。

一段典型的UMD代码如下所示：

```javascript
(function (root, factory) {
    var Data = factory(root);
    if ( typeof define === 'function' && define.amd) {
        // AMD
        define('data', function() {
            return Data;
        });
    } else if ( typeof exports === 'object') {
        // Node.js
        module.exports = Data;
    } else {
        // Browser globals
        var _Data = root.Data;
        
        Data.noConflict = function () {
            if (root.Data === Data) {
                root.Data = _Data;
            }
            
            return Data;
        };
        root.Data = Data;
    }
}(this, function (root) {
	var Data = ...
	//自己的代码
	return Data;
}));
```

这是出自[data.js](https://github.com/yanhaijing/data.js)中的一部分代码，其原理就是做个判断，不同的环境进行不同的处理。



## 总结

模块化的探索，使前端工程化成为了可能，可以说没有模块，工程化更无从弹起，