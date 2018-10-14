---
title: JavaScript中的async
categories: 编程语言
comments: false
date: 2017-02-19 12:08:49
tags:
  - JavaScirpt 
  - ES6
  - 异步编程
---

异步编程一直是JavaScript中的麻烦事，但在浏览器环境中，对异步的支持是必须的。JavaScript一直都有异步的解决方案。最早是回调函数，但由于连环回调会带来严重的嵌套问题，所以后来换做扁平化的Promise解决方案。

<!--more-->

## 回调函数

### 过程

调用一个函数f -> 函数f执行完毕 -> f调用回调函数c 

### 使用场合

- 资源加载：动态加载js文件后执行回调，加载iframe后执行回调，ajax操作回调，图片加载完成执行回调，AJAX等等。
- DOM事件及Node.js事件基于回调机制(Node.js回调可能会出现多层回调嵌套的问题)。
  setTimeout的延迟时间为0，这个hack经常被用到，settimeout调用的函数其实就是一个callback的体现
- 链式调用：链式调用的时候，在赋值器(setter)方法中(或者本身没有返回值的方法中)很容易实现链式调用，而取值器(getter)相对来说不好实现链式调用，因为你需要取值器返回你需要的数据而不是this指针，如果要实现链式方法，可以用回调函数来实现
- setTimeout、setInterval的函数调用得到其返回值。由于两个函数都是异步的，即：他们的调用时序和程序的主流程是相对独立的，所以没有办法在主体里面等待它们的返回值，它们被打开的时候程序也不会停下来等待，否则也就失去了setTimeout及setInterval的意义了，所以用return已经没有意义，只能使用callback。callback的意义在于将timer执行的结果通知给代理函数进行及时处理。

### 作用

传统函数以参数形式输入数据，并且使用返回语句返回值。理论上，在函数结尾处有一个return返回语句，结构上就是：一个输入点和一个输出点。这比较容易理解，函数本质上就是输入和输出之间实现过程的映射。

　　但是，当函数的实现过程非常漫长，你是选择等待函数完成处理，还是使用回调函数进行异步处理呢？这种情况下，使用回调函数变得至关重要，例如：AJAX请求。若是使用回调函数进行处理，代码就可以继续进行其他任务，而无需空等。实际开发中，经常在javascript中使用异步调用。

```javascript
function fn(url, callback){
    var httpRequest;　　　　//创建XHR
    httpRequest = window.XMLHttpRequest ? new XMLHttpRequest() :　　　
　　　　    window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP"             ) : undefined;//针对IE进行功能性检测
    
    httpRequest.onreadystatechange = function(){ // 把回调函数注册到某个事件上
      if(httpRequest.readystate === 4 
                && httpRequest.status === 200){　　//状态判断
          callback.call(httpRequest.responseXML);  
       }
    };
    httpRequest.open("GET", url);
    httpRequest.send();
}

fn("text.xml", function(){　　　　//调用函数
   console.log(this); 　　//此语句后输出
});

console.log("this will run before the above callback.");　　//此语句先输出
```

