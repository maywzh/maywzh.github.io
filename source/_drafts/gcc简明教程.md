---
title: gcc简明教程
categories: Linux
comments: false
date: 2016-10-18 01:51:25
tags:
  - 编译
  - c/c++
---

gcc/g++是GNU工具包中强大的c/c++编译工具，结合make工具，可以做到自动化编译功能。

## 编译流程

分为四步，预处理、编译、汇编、链接

```mermaid
graph LR

A[预处理] --> B[编译]
B --> C[汇编]
C --> D[链接]
```

样例程序

```c
/*************************
		hello.cpp
	*************************/
	#include <IOSTREAM>
 
	static int t = 1;
	#define T 9
 
	using namespace std;
 
	typedef int Status;
 
	int main()
	{
		Status i = 1;
		cout << T * i << endl; //Test Cout
		return 0;
	}
```



### 预处理 -E

使用预处理器cpp。输出预处理后的文件，linux下以`.i`为后缀名。默认不生成文件，可以重定向到一个输出文件中。这一步主要做了这些事情：宏的替换，还有注释的消除，还有找到相关的库文件，可以理解为无关代码的清除。

如果想查看待编译文件的预处理过程，可以用下面的命令

```bash
$ g++ -E hello.c
```

这样会直接在terminal中显示预处理过程，如果`main.cxx`中包含`include`，例如`#include<iostream>`,只能看到部分预处理结果；这个只显示预处理，不生成文件。

也可以吧预处理的过程重定向到一个文件中。

```bash
$ g++ -E hello.c -o hello.i
```

查看[官方文档](<http://gcc.gnu.org/onlinedocs/cpp/Preprocessor-Output.html>)来了解更多。

### 编译 -s

编译就是指使用编译器egcs把预处理的代码编译为汇编代码。

例如吧把预处理后的文件`hello.i`编译为汇编代码文件`hello.s`。

```bash
$ g++ -S hello.i -o hello.s
```

### 汇编 -c

汇编就是指使用汇编器as把汇编代码生成目标代码，目标代码就是二进制机器码。

例如把`hello.s`生成为目标代码`hello.o`。

```bash
$ g++ -s hello.i -o hello.s
```

### 链接 -o

链接就是指把.o文件与所需的库文件链接整合形成可执行文件。 `-L`表示链接

```bash
$ g++ main.o lib1.o lib2.o -o main
$ g++ Test.o -L /usr/include/iostream
```



## 常见参数

### 调试信息 -g

编译的时候，产生调试信息。

```bash
$ g++ -g main.cxx -o main
```

### 指定语言 -x

支持c c++ assembler none，‘none’意味着恢复默认行为，即根据文件的扩展名猜测源文件的语言

```bash
$ g++ -x c++ main.cxx // 指定源代码为c++
```

### 关联信息 -M

生成文件关联信息，包含目标文件依赖的所有源代码。

```bash
$ g++ -M main.cxx
```

### 优化级别-O0 -O1 -O2 -O3

编译器的优化选项的4个级别，-O0表示没有优化,-O1为缺省值，-O3优化级别最高　　 　　

```bash
$ g++ main.cxx -o main -o2
```

