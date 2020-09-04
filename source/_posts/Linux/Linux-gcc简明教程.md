---
title: Linux GNU-gcc简明教程
categories: DevOps
comments: false
date: 2015-10-18 01:51:25
tags:
  - Linux
thumbnail: https://i.loli.net/2020/08/23/Gexg6rV8BuyiTPv.jpg
cover: https://i.loli.net/2020/08/23/Gexg6rV8BuyiTPv.jpg
---

gcc/g++是GNU工具包中强大的c/c++编译工具，结合make工具，可以做到自动化编译功能。

一般来说，编译c语言使用gcc，编译c++语言使用g++，两者的命令几乎相同。

<!--more-->

## 编译流程

分为四步，预处理、编译、汇编、链接


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

### 指定输出文件 -o

表示指定输出的文件,o为小写

```bash
$ g++ [-选项] inputfile -o outputfile
```



### 预处理 -E

使用预处理器cpp。输出预处理后的文件，linux下以`.i`为后缀名。默认不生成文件，可以重定向到一个输出文件中。这一步主要做了这些事情：宏的替换，还有注释的消除，还有找到相关的库文件，可以理解为无关代码的清除。

如果想查看待编译文件的预处理过程，可以用下面的命令

```bash
$ g++ -E hello.cpp
```

这样会直接在terminal中显示预处理过程，如果`main.cxx`中包含`include`，例如`#include<iostream>`,只能看到部分预处理结果；这个只显示预处理，不生成文件。

也可以吧预处理的过程重定向到一个文件中。

```bash
$ g++ -E hello.cpp -o hello.i
```

查看[官方文档](<http://gcc.gnu.org/onlinedocs/cpp/Preprocessor-Output.html>)来了解更多。

### 编译 -S

编译就是指使用编译器egcs把预处理的代码编译为汇编代码。

例如吧把预处理后的文件`hello.i`编译为汇编代码文件`hello.s`。

```bash
$ g++ -S hello.i -o hello.s
```

### 汇编 -c

汇编就是指使用汇编器as把汇编代码生成目标代码，目标代码就是二进制机器码。

例如把`hello.s`生成为目标代码`hello.o`。

```bash
$ g++ -c hello.s -o hello.o
```

### 链接 -O

链接就是指把`.o`文件与所需的库文件链接整合形成可执行文件。 `-L`表示链接。

注意此处的`-O`为大写不同于指定输出文件的`-o`小写

```bash
$ g++ -O hello.o lib1.a lib2.a -o main
$ g++ hello.o -L /usr/include/iostream
```



## 常见参数
### 警告相关
```bash
$ g++ -pedantic main.cpp -o illcode # 显示不符合ANSI/ISO C 语言标准的警告信息
$ g++ -Wall main.cpp -o illcode #产生尽可能多的警告信息
$ g++ -Werror main.cpp -o illcode # 将所有的警告当成错误进行处理
```

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

### 查看编译过程 -v

```bash
$ g++ main.cxx -v -o main
```


## 进阶

### 宏

可以使用-Dname 选项来定义一个宏，或者-Dname=value 定义一个值value的宏。如果该值包含空格，则应包含在双引号中。

### 库

库是一个预编译的对象文件的集合，可以通过链接器链接到程序中。 
有两种类型的外部库：静态库和动态库。 

Windows系统的静态库文件扩展名为`*.lib`，动态库文件扩展名为`*.dll`

Unix类系统的静态库文件扩展名为`*.a`，动态库文件扩展名为`*.so`

当程序与静态库链接时，程序中使用的外部函数的机器代码将被复制到可执行文件中。一个静态库可以通过存档程序”ar.exe”创建。 
当程序与一个动态库链接时，在可执行文件中创建了一个表。在可执行文件开始运行之前，操作系统加载所需的外部函数 `- a` 的机器代码，这被称为**动态链接**的过程。因为一个库的一个副本可以在多个程序之间共享，所以动态链接使可执行文件更小，并**节省磁盘空间**。此外，大多数操作系统允许在内存中的共享库的一个副本被所有的运行程序使用，因此，也**节省内存**。动态库的代码可以升级而**无需重新编译**程序。 
动态链接库的优点非常多，GCC默认是链接动态库的。 

### 搜索头文件和库
编译程序时，编译器需要头文件来编译源代码；链接器需要库来解析来自其他对象文件或库的外部引用。需要合适的设置来告诉编译器和链接器头文件和库的位置。

每一个在源文件里使用的头文件(`#include <头文件名字>`)，编译器搜索`include-paths` 来找头文件。`include-paths`是通过 `-Idir` 选项指定，或者是环境变量 `CPATH`指定。由于头文件的文件名是已知的，所以只需要路径名就可以。 

链接器 搜索 `library-paths` ，将程序链接到可执行文件所需的库。`library-paths`是通过 `-Ldir` 选项指定（或环境变量`LIBRARY_PATH`。

此外还必须指定库名称，这里和编译器找头文件不同，头文件在源代码就有声明，所以不需要额外再去指定，而库需要使用 `-l` 选项来告诉链接器。

## 工具

### file工具
file工具可以用来显示目标文件和可执行文件的类型

```bash
$ g++ -c hello.cpp
$ g++ -o hello hello.o
$ file hello.o
hello.o: ELF 64-bit LSB  relocatable, x86-64, version 1 (SYSV), not stripped
```




### nm工具
nm工具用于列出目标文件的符号表， 
常用来检查一个特定的函数是否被定义在一个对象文件中。

```bash
$ nm hello.o
0000000000000000 T _main
```



### ldd 工具
ldd可以确定程序依赖的动态链接库有哪些。用于可执行文件，并显示它所依赖的共享库的列表。

```bash
$ ldd hello
/media/study/mycode/GCC_test$ ldd hello
linux-vdso.so.1 =>  (0x00007ffe6653a000)
libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007fd06d171000)
/lib64/ld-linux-x86-64.so.2 (0x00007fd06d536000)
```

