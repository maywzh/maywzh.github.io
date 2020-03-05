---
title: JavaScript的变量提升
author: maywzh
tags:
  - JavaScript
categories: 编程语言
date: 2017-07-20 03:35:00
---
JavaScript的设计不同于传统编程语言，它自成一派，有很多的奇妙特性。

今天就来聊聊变量提升。

## 变量提升是什么

ES5之前，JavaScript实际上并不存在块级作用域。JavaScript引擎对JavaScript中`var`类型变量的声明的处理方式是：

- 如果变量在函数外部声明，那么该变量会被提到全局作用域顶端
- 如果变量在函数内部声明，那么该变量会被提到函数作用域顶端
<!--more-->

### 函数外部作用域

```javascript
console.log(shape); // OUTPUT : undefined
var shape = "square";
console.log(shape); // OUTPUT : square
```

如果按照C语言的逻辑，第1行的`console.log`引用了未声明的变量，应该发生错误。但实际上却输出`undefined`，也就是说实际上这里`shape`已经被声明了，只是没有初始化赋值而已。

这就是变量提升。实际上上面的代码会被JS引擎识别为这样

```javascript
var shape;
console.log(shape); // OUTPUT : undefined
shape = "square";
console.log(shape); // OUTPUT : square
```



### 函数内部作用域

```javascript
 function getShape(condition) {
    console.log(shape);    // OUTPUT : undefined
    if (condition) {
        var shape = square;
        return shape;
    } else {
        return false;
    }
}
```

在这里，JS没有块级作用域，所以与C语言不同，在`if`语句中声明的`shape`变量会由于变量提升，而被提到`getShape`的顶端。变成下面这样

```javascript
 function getShape(condition) {
    var shape;
     console.log(shape);    // OUTPUT : undefined
    if (condition) {
        shape = square;
        return shape;
    } else {
        return false;
    }
}
```

## ES6块级作用域

ES6 引入了块级作用域，这让开发者对变量有了更多的控制，且让变量有灵活的生命周期。
块级声明在块级/词法作用域里面声明，他们在“`{}`”中被创建。

```javascript
function getShape(condition) {
  // shape doesn't exist here
  // console.log(shape); ReferenceError: shape is not defined
  if (condition) {
    let shape = square;
    // some other code
    return shape;
  } else {
    // shape doesn't exist here as well
    return false;
  }
}
```

在这里我们不用`var`而用`let`来声明我们的变量，`let`就更类似于传统编程语言中的变量声明，它具有块级作用域。

> 在同一个作用域内，如果已经使用var标识符声明了变量，同时又用let标识符声明同名变量时会抛出错误。但是，如果在let声明的变量作用域外，声明同名变量是不会报错的。（这种情况也同样适用于我们即将谈论的const声明。）

这其实可以用局部作用域来理解，`let`只在它声明的那个块级作用域有效，这与C/C++这类传统编程语言中的局部作用域的特性很类似。

```javascript
var shape = "square";
let shape = "rectangle";
```

```javascript
var shape = "square";
if (condition) {
  // doesn't throw an error
  let shape = "rectangle"; 
}
// No error
```

## const

`const`声明语法与`let`和`var`相似，生命周期与`let`相同，但你还要注意一些规则。
用`const`声明的变量将像**常量**看待，因此**它们的值在定义后是不可以修改的**。由于这样，每个`const`变量都**必须在声明的同时进行初始化**。

```javascript
const shape = "triangle";// valid 
const color; // syntax error: missing initialization
shape = "square"; // TypeError: Assignment to constant variable
```

但在声明对象时，对象的属性可以被修改。

```javascript
 const shape = {
    name: "triangle",
    sides: 3
}
shape.name = "square"; // ok 
shape.sides = 4;
shape = {
    name: hexagon,
    sides: 6
} // SyntaxError: Invalid shorthand property initializer
```

所以`const`可以防止整个绑定的修改，而不是绑定的值。



## 暂时性死区

**使用`let`或`const`声明的时候，它们并不会变量提升**，所以在它们被声明之前，使用它们会抛出`ReferenceError`错误。

在进入作用域和不能访问的这段时间，我们称为暂时性死区。
提示：“暂时性死区”不是ECMAScript规范里的正式定义，它只是在程序员中广为流行而已。



## 建议

如果你对`var`的特性十分了解，那么可以在项目中使用它，但不推荐，因为不利于维护。

`let`和`const`已经完全可以代替`var`的使用，这是更加符合程序员认知的用法。