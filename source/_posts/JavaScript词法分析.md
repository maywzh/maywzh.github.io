---
title: JavaScript词法分析
categories: 编程语言
tags:
  - JavaScript 
date: 2017-01-23 08:00:00
---

JavaScript引擎在代码执行前会进行词法分析，词法分析主要有三个步骤：

分析参数 -> 分析变量的声明 -> 分析函数声明



## 词法分析过程

JavaScript函数在运行的瞬间，会生成一个活动对象AO（Active Object），举个例子

```javascript
function f1(name){
	var name = 'mary';
    console.log(name);
    function name(){}
    console.log(name);
}
f1("abc");
```

**第一步：分析参数：**

1. 函数接收形式参数，添加到AO的属性，并且这个时候值为`undefined`,即`AO.name=undefined`
2. 接收实参`"abc"`，添加到AO的属性，覆盖之前的`undefined`，即`AO.name='abc'`

**第二步：分析变量声明：**如`var name;`或`var name='mary'`;

1. 如果上一步分析参数中AO还没有name属性，则添加AO属性为`undefined`，即`AO.name=undefined`
2. 如果AO上面已经有name属性了，则不作任何修改，此时`AO.name==='mary'`

**第三步：分析函数的声明：**

如果有`function name(){}`把函数赋给`AO.name` ,覆盖上一步分析的值

## 实例

分析下面这个栗子：

```javascript
var a = 10;
function test(a){
	console.log(a);           //function a (){}
    var a = 20;
    console.log(a);            //20
    function a (){}
    console.log(a);            //20
}
test(100);
```

第一步，分析函数参数：

```pseudocode
AO.a = undefined // 形式参数
AO.a = 100 //接收实参
```

第二步，分析局部变量：

```pseudocode
第4行代码有var a,但是此时已有AO.a = 100,所以不做任何修改，即AO.a = 100
```

第三步，分析函数声明：

```pseudocode
第6行代码有函数a,则将function a(){}赋给AO.a,即AO.a = function a(){}
```

执行代码时：

```pseudocode
第3行代码运行时拿到的a时词法分析后的AO.a，即AO.a = function a(){}；
第4行代码：将20赋值给a,此时a=20;
第5行代码运行时a已经被赋值为20,结果20；
第6行代码是一个函数表达式，所以不做任何操作；
第7行代码运行时仍是20；
```

ps:

```javascript
1.var a = 10;
2.function test(a){
3.    var a;               //证明词法分析第二步。
4.    alert(a);           //100
5.    a = 20;
6.    alert(a);           //20
7.}
7.test(100);
```

ps:

```javascript
var a = 10;
function test(a){
    alert(a);         //100
    var a = 20;
    alert(a);         //20
    a = function(){}        //是赋值，只有在执行时才有效
    alert(a);         //function(){}
}
test(100);
```

ps:(执行结果同上)

```javascript
var a = 10;
function test(a){
    alert(a);                //100
    var a = 20;
    alert(a);                //20
    var a = function(){}        //是赋值，只有在执行时才有效
    alert(a);                //function(){}
}
test(100);
```

**补充说明：函数声明与函数表达式**

```javascript
//函数声明
function a(){
}
//函数表达式
var b = function(){
}
```

a和b在词法分析时，区别：

```pseudocode
a在词法分析时，就发挥作用；
b只有在执行阶段，才发挥作用。
```



## 词法作用域

词法作用域的意思是，作用域为在定义时(词法分析时)就确定下来的，而并非在执行时确定。即在函数未执行前，函数执行的顺序已经被确定，而不是类似JAVA一样，是在执行前根本不知道执行顺序。