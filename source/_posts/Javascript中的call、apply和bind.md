---
title: JavaScript中的call、apply和bind
author: maywzh
tags:
  - JavaScript 
categories:
  - 编程语言
date: 2016-10-17 18:35:00
---
## apply & call
 
> 在 JavaScript 中，call 和 apply 都是为了改变某个函数运行时的上下文（context）而存在的 

**在JavaScript中，一切都是对象**，包括函数。函数存在「定义时上下文」和「运行时上下文」以及「上下文是可以改变的」这样的概念。

<!--more-->

例：

```JavaScript
function people() {}
 
people.prototype = {
    name: "ming",
    say: function() {
        console.log("My name is " + this.name);
    }
}
 
var a = new people;
a.say();    //My name is ming
```

此时我们有一个对象`b={name:"su"}`，不想重新定义`say`方法， 那么可以通过`call`或者`apply`方法。

```JavaScript
b={
	name:"su"
}
a.say.call(b); //My name is su
a.say.apply(b); //My name is su
```

可以看出`call`和`apply`都是为了动态改变`this`而出现的。当一个`object`没有某个方法，可以借助call或apply用其他对象的方法来操作。

### apply和call的区别

对于 `apply`、`call` 二者而言，作用完全一样，只是接受参数的方式不太一样。

```JavaScript
var func = function(arg1, arg2) {
     
};
func.call(this, arg1, arg2);
func.apply(this, [arg1, arg2])
```

`call` 需要把参数按顺序传递进去，而 `apply` 则是把参数放在数组里。　

明确知道参数数量时用 `call` 。而不确定的时候用 `apply`，然后把参数 `push` 进数组传递进去。当参数数量不确定时，函数内部也可以通过 `arguments` 这个伪数组来遍历所有的参数。

- **数组追加**

  ```JavaScript
  var array1 = [12 , "foo" , {name "Joe"} , -2458]; 
  var array2 = ["Doe" , 555 , 100]; 
  Array.prototype.push.apply(array1, array2); 
  /* array1 值为  [12 , "foo" , {name "Joe"} , -2458 , "Doe" , 555 , 100] */
  ```


- **获取数组最大最小值**

  ```JavaScript
  var  numbers = [5, 458 , 120 , -215 ]; 
  var maxInNumbers = Math.max.apply(Math, numbers),   //458
      maxInNumbers = Math.max.call(Math,5, 458 , 120 , -215); //458
  ```

  `number` 本身没有 `max` 方法，但是 `Math` 有，我们就可以借助 `call` 或者 `apply` 使用其方法。

- **验证是否是数组**

  ```JavaScript
  functionisArray(obj){ 
      return Object.prototype.toString.call(obj) === '[object Array]' ;
  }
  ```


- **类（伪）数组使用数组方法**

  ```JavaScript
  var domNodes = Array.prototype.slice.call(document.getElementsByTagName("*"));
  ```

  JavaScript中存在一种名为伪数组的对象结构。比较特别的是 `arguments` 对象，还有像调用 `getElementsByTagName` , `document.childNodes` 之类的，它们返回NodeList对象都属于伪数组。不能应用 `Array`下的 `push` , `pop` 等方法。

  但是我们能通过 `Array.prototype.slice.call `转换为真正的数组的带有 `length` 属性的对象，这样 domNodes 就可以应用 `Array` 下的所有方法了。

### 实例

- 用`log`来代理`console.log`

  由于传入参数不确定，所以普通的方法对于多个参数是失效的。

  ```JavaScript
  function log(msg)　{
    console.log(msg);
  }
  log(1);    //1
  log(1,2);    //1
  ```

  此时`arguments`就派上用场了，可以把`arguments`传入`apply`方法中。

  ```JavaScript
  function log(){
    console.log.apply(console, arguments);
  };
  log(1);    //1
  log(1,2);    //1 2
  ```



## bind

与`call`、`apply`一样，`bind` 也可以改变函数体内` this `的指向。

> bind()方法会创建一个新函数，称为绑定函数，当调用这个绑定函数时，绑定函数会以创建它时传入 bind()方法的第一个参数作为 this，传入 bind() 方法的第二个以及以后的参数加上绑定函数运行时本身的参数按照顺序作为原函数的参数来调用原函数。

```JavaScript
var foo = {
    bar : 1,
    eventBind: function(){
        var _this = this;
        $('.someClass').on('click',function(event) {
            /* Act on the event */
            console.log(_this.bar);     //1
        });
    }
}
```

由于 JavaScript 特有的机制，上下文环境在 `eventBind:function(){ }` 过渡到 `$('.someClass').on('click',function(event) { })` 发生了改变，上述使用变量保存 `this` 这些方式都是有用的，也没有什么问题。当然使用 `bind()` 可以更加优雅的解决这个问题：

```JavaScript
var foo = {
    bar : 1,
    eventBind: function(){
        $('.someClass').on('click',function(event) {
            /* Act on the event */
            console.log(this.bar);      //1
        }.bind(this));
    }
}
```

在上述代码里，`bind()` 创建了一个函数，当这个`click`事件绑定在被调用的时候，它的 `this` 关键词会被设置成被传入的值（这里指调用`bind()`时传入的参数）。因此，这里我们传入想要的上下文 `this`(其实就是 foo )，到 `bind()` 函数中。然后，当回调函数被执行的时候， `this` 便指向 `foo` 对象。再来一个简单的栗子：

```JavaScript
var bar = function(){
	console.log(this.x);
}
var foo = {
	x:3
}
bar(); // undefined
var func = bar.bind(foo);
func(); // 3
```

这里我们创建了一个新的函数 `func`，当使用 `bind()` 创建一个绑定函数之后，它被执行的时候，它的 `this` 会被设置成 `foo` ， 而不是像我们调用 `bar()` 时的全局作用域。



如果`bind`多次会如何？

```JavaScript
var bar = function(){
    console.log(this.x);
}
var foo = {
    x:3
}
var sed = {
    x:4
}
var func = bar.bind(foo).bind(sed);
func(); //3
 
var fiv = {
    x:5
}
var func = bar.bind(foo).bind(sed).bind(fiv);
func(); // 3
```

仍旧输出3。原因在于bind()相当使用函数在内部包了一个`call/apply`，往后 `bind()` 相当于再包住第一次 `bind()` ,故第二次以后的 `bind` 是无法生效的。

## apply、call、bind比较

```JavaScript
var obj = {
    x: 81,
};
 
var foo = {
    getX: function() {
        return this.x;
    }
}
 
console.log(foo.getX.bind(obj)());  //81
console.log(foo.getX.call(obj));    //81
console.log(foo.getX.apply(obj));   //81
```

三个都可以改变上下文环境，但`bind`并非立刻执行(需要调用)，而`call`和`apply`都是立即执行。