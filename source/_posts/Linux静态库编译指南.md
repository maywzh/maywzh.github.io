---
title: Linux静态库编译指南
categories: DevOps
comments: false
date: 2015-01-17 20:45:50
tags:
  - Linux
  - 编译
thumbnail: https://i.loli.net/2020/08/23/WHZJu3MPeTFagwK.png
---

Linux上的静态库，其实是目标文件的归档文件。
在Linux上创建静态库的步骤如下：

1. 写源文件，通过 `gcc -c xxx.c` 生成目标文件。
2. 用 `ar` 归档目标文件，生成静态库。
3. 配合静态库，写一个使用静态库中函数的头文件。
4. 使用静态库时，在源码中包含对应的头文件，链接时记得链接自己的库。

## 源文件

print.c 和 math.c

```c
//print.c
#include <stdio.h>

void cout(const char * message)
{
    fprintf(stdout, "%s\n", message);
}
```

```c
//math.c
int add(int a, int b)
{
    return a + b;
}

int subtract(int a, int b)
{
    return a - b;
}
```

生成目标文件

```bash
$ gcc -c print.c math.c
$ ls
math.c  math.o  print.c print.o
```



## 归档

使用`ar`归档

```bash
$ ar crv libmylib.a my_print.o my_math.o
a - print.o
a - math.o
```

上述命令中 crv 是 ar的命令选项：

- c 如果需要生成新的库文件，不要警告
- r 代替库中现有的文件或者插入新的文件
- v 输出详细信息

通过 `ar t libmylib.a` 可以查看 `libmylib.a` 中包含的目标文件。

我们要生成的库的文件名必须形如 `libxxx.a` ，这样我们在链接这个库时，就可以用 `-lxxx`。
反过来讲，当我们告诉编译器 `-lxxx`时，编译器就会在指定的目录中搜索 `libxxx.a` 或是 `libxxx.so`。



## 头文件

头文件定义了 libmylib.a 的接口，也就是告诉用户怎么使用 libmylib.a。

```c
//my_lib.h
#ifndef __MY_LIB_H__
#define __MY_LIB_H__

int add(int a, int b);
int subtract(int a, int b);

void cout(const char *);
#endif
```



## 测试

在同一目录下建立test.c

```c
#include "my_lib.h"

int main(int argc, char *argv[])
{
    int c = add(15, -21);
    cout("I am a func from mylib ...");
    return 0;
}
```

编译

```bash
$ gcc test.c -L. -lmylib -o test # 在.目录搜索libmylib.a或libmylib.so文件
```

上面的命令中 `-L.` 告诉 gcc 搜索链接库时包含当前路径， `-lmylib` 告诉 gcc 生成可执行程序时要链接 `libmylib.a`。

运行

```bash
$ ./test
I am a func from mylib ...
```



## 自动化编译

利用make来进行自动化编译

```makefile
.PHONY: build test clean

build: libmylib.a

libmylib.a: math.o print.o
	ar crv $@ math.o print.o

math.o: math.c
	gcc -c math.c

print.o: print.c
	gcc -c print.c

test: test.c
	gcc test.c -L. -lmylib -o test
clean: 
	rm -f *.o *.so *.a test
```

`make build` 将会构建 libmylib.a， 

`make test` 将会生成链接 libmylib.a 的程序,

`make clean` 将清理所有的编译中间文件和目标文件



## 附录

例程见[Github](https://github.com/maywzh/Lab_stlib_compiler)

相关博文 [Linux动态库编译指南](/Linux动态库编译指南/)


