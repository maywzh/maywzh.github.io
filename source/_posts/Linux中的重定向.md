---
title: Linux中的重定向
date: 2015-01-04 17:25:01
categories: Linux
tags:
  - Linux命令
thumbnail: https://i.loli.net/2020/08/23/83MVATdal4hJLNU.png
---



## 从一个命令说起

经常能从shell脚本中看到类似这样的命令

```bash
$ cmd >/dev/null 2>&1 #cmd代表一个可以输出结果的命令
```

<!--more-->


## 重定向

在使用shell命令的时候，最常见的是键盘输入命令，终端显示处理结果。有的时候需要将shell命令的执行结果存储到文件中，或者让shell读取某个文件的内容作为输入，那么就需要使用输入输出的重定向功能。

重定向就是指把程序的输入源或者输出地址修改为我们制定的IO设备或文件。当打开shell命令是，会默认打开3个文件。每个文件都有对应的文件描述符方便我们使用。

| 类型                        | 文件描述符 | 默认情况               | 对应文件句柄位置 |
| --------------------------- | ---------- | ---------------------- | ---------------- |
| 标准输入（standard input）  | 0          | 从键盘获得输入         | /proc/slef/fd/0  |
| 标准输出（standard output） | 1          | 输出到屏幕（即控制台） | /proc/slef/fd/1  |
| 错误输出（error output）    | 2          | 输出到屏幕（即控制台） | /proc/slef/fd/2  |

在这里，根据Linux一切皆文件的思想，把输入输出设备都视为文件。

### 输出重定向

输出重定向基本的一些命令：

| 命令                | 介绍                       |
| ------------------- | -------------------------- |
| command >filename   | 把标准输出重定向到新文件中 |
| command 1>filename  | 同上                       |
| command >>filename  | 把标准输出追加到文件中     |
| command 1>>filename | 同上                       |
| command 2>filename  | 把标准错误重定向到新文件中 |
| command 2>>filename | 把标准错误追加到新文件中   |

我们使用`>`或者`>>`对输出进行重定向。符号的左边是标准输出或标准错误，右边是输出目标。`>` 会覆盖原有的文件,`>>`则是追加输出。用`1`和 `2` 可以显式指定是标准输出还是标准错误。

例:

```bash
$ ls . #当前目录只有1.txt文件
hello.txt  #内容是hello
$ cat hello.txt 1> out #此时out的内容是hello
$ cat out
hello
$ cat world.txt > out
cat: world.txt: No such file or directory #此时由于不存在world.txt，屏幕上出现标准错误输出
$ cat world.txt 2> err
$ cat err 
cat: world.txt: No such file or directory #标准错误被重定向到err文件
```



### 输入重定向

输入重定向的基本命令如下：

| 命令                | 介绍                                      |
| ------------------- | ----------------------------------------- |
| command <filename   | 以filename文件作为标准输入                |
| command 0<filename  | 同上                                      |
| command <<delimiter | 从标准输入中读入，直到遇到delimiter分隔符 |

我们使用`<`对输入做重定向，符号左边缺省默认为0。

输入重定向其实就是让文件输入代替键盘敲击。

```bash
$ cat  # cat的作用是把输入直接回显到终端里
111
111
222
222
$ cat <input #input 文件内容为 foo bar
foo bar
$ cat >output <input # 重定向输入为input文件，重定向输出为output文件。
$ cat output
foo bar 
```

## 空设备文件

/dev/null代表linux的空设备文件，所有往这个文件里面写入的内容都会丢失，俗称“黑洞”。那么执行了`>/dev/null`之后，标准输出就会不再存在，没有任何地方能够找到输出的内容。

有的时候我们并不想输出任何信息，想要抛弃标准输出，就用这种方法。



## 扩展用法

### 重定向绑定

现在来看看这条命令

```bash
>/dev/null 2>&1
```

这句话的意思其实就重定向输出到/dev/null，然后把标准错误重定向到标准输出。

另一种写法

```bash
cmd &> output.txt
cmd >& output.txt  #两个表达式等价
```

通过这两者的组合，我们把标准输出和标准错误绑定在一起抛弃掉了，即实现了不输出任何信息。



### 交换顺序的bug

能否交换这两者的顺序呢

```bash
>/dev/null 2>&1 
2>&1 >/dev/null
```

不可以！第二条的命令会把错误输出绑定到依旧是默认输出设备的屏幕上。而标准输出被丢弃。
因为linux在执行shell命令之前，就会确定好所有的输入输出位置，并且从左到右依次执行重定向的命令。



### 分开写的bug

能否把错误和输出并行输出到空设备呢？

```bash
>/dev/null 2>&1
>/dev/null 2>/dev/null
```

也不可以！

试验一下：

```bash
# ls a.txt b.txt >out 2>out
# cat out
a.txt
txt: No such file or directory #本来应该是 b.txt: No such file or directory， 出现了字符缺失
```

这里会丢失字符，为什么？因为这种写法会导致标准输出和错误输出抢占重定向到out的管道，导致冲突、覆盖等问题。而且会导致输出效率较低。



### 关于nohup

我们经常使用`nohup command &`命令形式来启动一些后台程序，比如node服务：

```bash
$ nohup node server.js &
```

为了不让一些执行信息输出到前台（控制台），我们还会加上刚才提到的`>/dev/null 2>&1`命令来丢弃所有的输出：

```bash
$ nohup node server.js >/dev/null 2>&1 &
```

