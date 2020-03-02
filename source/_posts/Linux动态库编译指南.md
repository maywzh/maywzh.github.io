---
title: Linux动态库编译指南
categories: Linux
comments: false
date: 2015-06-18 20:07:31
tags:
  - Linux编程
  - 编译
thumbnail: https://ws1.sinaimg.cn/large/006tNbRwgy1fwe4b4kbd2j30rs0ij7a1.jpg
---

Linux下动态库文件的文件名形如 `libxxx.so`，其中so是 Shared Object 的缩写，即可以共享的目标文件。

在链接动态库生成可执行文件时，并不会把动态库的代码复制到执行文件中，而是在执行文件中记录对动态库的引用。

程序执行时，再去加载动态库文件。如果动态库已经加载，则不必重复加载，从而能节省内存空间。

Linux下生成和使用动态库的步骤如下：

1. 编写源文件。
2. 将一个或几个源文件编译链接，生成共享库。
3. 通过 `-L<path> -lxxx` 的gcc选项链接生成的libxxx.so。
4. 把libxxx.so放入链接库的标准路径，或指定 `LD_LIBRARY_PATH`，才能运行链接了libxxx.so的程序。

<!--more-->

## 源文件

样例 

```c
//max.c
int max(int n1, int n2, int n3)
{
    int max_num = n1;
    max_num = max_num < n2? n2: max_num;
    max_num = max_num < n3? n3: max_num;
    return max_num;
}
```



## 共享库

编译生成共享库：

```bash
$ gcc -fPIC -shared -o libmax.so max.c
```

 `-fPIC`是编译选项，PIC是 Position Independent Code 的缩写，表示要生成位置无关的代码，这是动态库需要的特性； 

`-shared`是链接选项，告诉gcc生成动态库而不是可执行文件。



## 编写头文件

为了让用户知道我们的动态库中有哪些接口可用，我们需要编写对应的头文件。

```c
//max.h
#ifndef __MAX_H__
#define __MAX_H__

int max(int n1, int n2, int n3);

#endif
```

## 测试

编写一个测试程序test.c引用编译好的libmax.so

```c
//test.c
#include <stdio.h>
#include "max.h"

int main(int argc, char *argv[])
{
    int a = 10, b = -2, c = 100;
    printf("max among 10, -2 and 100 is %d.\n", max(a, b, c));
    return 0;
}
```

编译命令
```bash
$ gcc test.c -L. -lmax -o test
```

`-lmax`表示要链接`libmax.so`

`-L.`表示搜索要链接的库文件时包含当前路径



## 运行

```bash
$ ./test
max among 10, -2 and 100 is 100.
```



## 自动化编译

利用make来进行自动化编译

```makefile
.PHONY: build test clean

build: libmax.so

libmax.so: max.o
	gcc -o $@  -shared $<

max.o: max.c
	gcc -c -fPIC $<

test: test.c libmax.so
	gcc test.c -L. -lmax -o test
	
clean:
	rm -f *.o *.so a.out
```

用法
```bash
$ make build # 编译动态库 libmax.so
$ make test # 生成test可执行程序
$ make clean # 清理编译和测试结果
```



## 附录

例程见我的[Github](https://github.com/maywzh/Lab_dylibcompiler)

相关博文 [Linux静态库编译指南](/Linux静态库编译指南/)。

