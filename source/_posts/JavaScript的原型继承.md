---
title: JavaScript的原型继承
author: maywzh
tags:
  - JavaScript 
categories:
  - 编程语言
date: 2017-07-12 01:46:00
---
## JavaScript 继承

一般的面向对象的语言对继承的处理方式都是class-based，即基于类的继承。一般是说子类继承了父类，继承的主体是类。而类的对象之间的继承体现于类的继承中。

以Java为例

```java
public class A{} //父类A
public class B extends A {} //子类B继承了父类A
```

在JavaScript的世界中则并非如此。JS通过原型链的方式来实现继承，是基于对象的继承。下例中b对象继承了a对象的所有属性和方法。

<!--more-->

```JavaScript
function People(sex) {
    this.sex = sex;
    this.say = function () {
        console.log(this.sex);
    }
}
let a = new People("man"); //实例化a对象
let b = Object.create(a);  //b对象继承a对象，继承了a的属性和方法
console.log(b.sex); //man
b.say(); //man
```

在这里我们可以说，a对象是b对象的原型。这样的继承方法不需要类，继承在对象之间完成。



## 原型继承机制

对象进行属性查找时，优先查找自己的属性，如果没有查找到再去查找对象的原型上的属性。如果原型对象依旧没有找到，那么递归查找指导原型根部，如果依旧没有找到那么返回`undefined`。

```flow
st=>start: 对象a
op=>operation: 查找属性p
cond=>condition: 是否有属性p
sub1=>subroutine: 转到对象a的继承的原型对象
io=>inputoutput: 返回属性p
e=>end: 结束

st->op->cond
cond(yes)->io->e
cond(no)->sub1(right)->op
```

这就是原型链的思想，层层往上一级链条上查找。

ES5中，可以通过`Object.getPrototypeOf(obj)` 来获取`obj`对象的原型，在Chrome浏览器中也可以使用非标准的`obj.__proto__`。

JS中定义一个类的是通过声明一个函数来实现，这个函数也称为构造器。JS 中的构造器有一个特殊的属性(函数也是对象，所以也有属性) ———— `prototype`。此 `prototype` 用来定义通过构造器构造出来的对象的原型，构造器内部的代码用来给对象初始化。如下

```JavaScript
function People(name) {
    this.name = name;
}
console.log(People.prototype); 
//{constructor: People} People.prototype的构造器为People
People.prototype.say = function() {
    console.log(this.name);
}
People.prototype.sex = "female";
let p1 = new People("soda");
p1.constructor //People
p1.sex //female
p1.say(); //soda
```

我们可以看出`p1`对象获得了`People.prototype`的属性和方法。实际上，通过`new People()`，`p1`以`People`的`prototype`为原型来创建了一个新对象，并获得了该原型的全部属性和方法。

```JavaScript
p1 = new People() // 等价于
p1 = Object.create(People.prototype) // 用 People 的 prototype 作为原型来创建一个新对象
People.apply(p1, "soda") // 执行构造器用来初始化，构造器中的 this 指向 p1
```

`p1`的原型是`People.prototype`，`p1`是`People`构造(new)出来的。

为了让`p1.constructor`能构正确执行`p1`的构造器，一个构造器默认的 `prototype` 上已经存在 `constructor` 属性，并且指向构造器本身。

⚠️ `People.prototype`并非`People`的原型，而是`People`构造的对象的原型，即`p1`的原型。`People`本身是一个`Function`类型，你可以把它理解为一个`Function`构造出来的对象，它的原型是`Object.getPrototypeOf(People)`或`People.__proto__`。 因为 `People` 是一个函数对象，所有函数都构造自 `Function`，原型是 `Function.prototype`。`People.prototype` 是 `People` 构造出来的实例的原型，不是 `People` 的原型。

```JavaScript
People.__proto__ === Function.prototype
//true
```



## 探究constructor

```JavaScript
function Foo() {}
let foo = new Foo();
foo.constructor === Foo.prototype.constructor //true
foo.constructor === Foo // true
Foo.constructor === Object.constructor // true
Object.constructor === Function.constructor // true
Function.constructor === Function //true
```

在这个样例我们可以得知三个信息，

- **对于`foo`对象而言，`Foo`函数是其构造器，`foo`是`Foo`函数构造的对象。**

- **对于一切函数`fn`而言，`Function`是它们的构造器，`fn`是`Function`函数构造的对象，函数也是一种特殊的对象。**

- **`Function`的构造器是`Function`本身。`Function`既是对象，又是函数。**

那么我们可以推断出什么？

因为所有的函数都有同一个构造器，所以所有的函数都有同一个原型，这个原型就是`Function`类的原型`Function.prototype`

即`Object.getPrototypeOf(fn) === Function.prototype`，**所有的函数都是一个类**。



## Function的双重性

```JavaScript
Function.__proto__ === Function.prototype // true
Object.getPrototypeOf(Function) === Function.prototype // true
```

等式的左边的`Function`作为对象，求`Function`对象继承的原型

等式的右边的`Funciton`作为构造器，求`Function`类的原型

而对于一般的函数来说则不能这么比较

```JavaScript
function Flower(){}
let flower = new Flower()
flower.__proto__ === Flower.prototype  //true
Flower.__proto__ === Function.prototype //true
```

所以`Function`是一种特殊的函数，也是一种特殊的对象。

- 它的构造器是它的自身。
- 它与所有的函数继承同一个原型。
- 所有的函数都由`Function`来构造。



## Object 与 Function 

聊完`Function`再来聊聊`Object`，JavaScript原生提供`Object`对象。

```JavaScript
function Foo(){}
let foo = new Foo();
let obj = new Object();
foo.__proto__.__proto__ === Object.prototype //true
foo.__proto__.__proto__ === obj.__proto__ //true
```

可以看出，所有的对象都继承自`Object`对象。

`Object`是所有`Object`对象的构造器，而根据`Function`的有趣性质，我们可以获得下面的结果

```JavaScript
Object instanceof Function // true
Function instanceof Object // true
```

首先，我们需要弄清楚`instanceof`的原理

```JavaScript
instance instanceof People // 等价于

function instanceOf(instance, prototype) {
    var proto = Object.getPrototype(instance); // 取对象原型
    if( proto === null) return false; // 空
    if( proto === prototype) return true; // 原型匹配
    return instanceOf(proto, prototype); // 递归检查原型的原型
}

instance(instance, People.prototype);
```

JavaScript中的继承概念归根到底是原型的继承，那么`instanceof`实际上就是将`instance`的原型与构造器的`prototype`进行递归检查。

`Object`是一个构造器，一个函数，而函数也是一个对象，这个对象由`Function`这个构造器构造，所以

`Object.__proto__ === Function.prototype` 上式成立

 `Function`是一个函数，一个对象，而所有的对象都是继承于`Object`对象的原型，

`Function.__proto__ === Object.prototype` 下式成立



## 总结

- JavaScript的继承是通过原型链继承来实现的
- 所有的函数都是对象，它们的构造器是`Function`
- `Function`是自身的构造器
- 所有的对象的最终原型是`Object.prototype`，即所有的对象都继承于`Object`对象