---
title: tcpdump抓包mysql验证三次握手
categories: 计算机网络
comments: false
date: 2016-01-16 01:58:29
tags:
  - TCP/IP
  - mysql
  - Linux命令
---

`TCP`的三次握手、4次挥手是老生常谈的东西，那么具体的包数据传输过程你是否真正的试过呢？我们今天就通过具体的`mysql`建联实践来看看是怎么传递数据包的。

<!--more-->

## 网络嗅探器和`tcpdump`

在共享式的网络中，数据的传输是怎么完成的呢？又是怎么找到对应的机器来进行数据交互的呢？

一般来说，在网络中，信息报会广播到网络中所有主机的网络接口，主机的网络设备通过IP和MAC地址等信息判断该信息包是否应该接收，通过抛弃与自己无关的数据包，这样就达到互联网中我们与指定机器通信的目的。

但是在众多的黑客技术中，嗅探器`（sniffer）`是一种很常见的技术，它使主机的网络设备接收所有到达的信息包，从而达到网络监听的目的。在共享式的局域网中，嗅探器可以对该网络中的流量一览无余。除了黑客，网络管理员也应该学会使用嗅探器来随时掌握网络的使用情况，在网络性能急剧下降时，找到网络阻塞和问题的根源。

具体的嗅探器工具在`Windows`平台上有`netxray`和`sniffer pro`软件，在`Linux`平台上有`tcpdump`。我们今天要介绍的就是`tcpdump sniffer`嗅探器工具。

## 安装`tcpdump`

`tcpdump`是`Linux`平台一个以命令行方式运行的网络流量检测工具，它能截获网卡上收到的数据包，并通过一定的配置来完成对内容的解析和分析。

检测系统中是否已经安装了`tcpdump`的方法非常简单，就是直接执行：

```bash
$ tcpdump
# 如果没有安装
tcpdump: no suitable device found
# 如果已经安装，则当有网络请求时会出现许多的这种网络解析数据
21:44:14.109590 IP client.host > server.host: Flags [P.], seq 1031520:1031984, ack 1393, win 95, options [nop,nop,TS val 2242702304 ecr 3381086780], length 464
```

最新的`tcpdump`源码下载地址：[http://www.tcpdump.org](http://www.tcpdump.org/) （tcpdump官网）

> `tcpdump`的运行需要`pcap`的支持，请同时下载这两个内容并安装，一般最新版本的两者是互相兼容的。

笔者本次下载的是最新的版本，直接在命令行里使用wget下载即可：

```bash
# 下载tcpdump文件
$ wget www.tcpdump.org/release/tcpdump-4.9.2.tar.gz

# 下载pcap文件
$ wget www.tcpdump.org/release/libpcap-1.9.0.tar.gz

# 安装libpcap，make install的时候可能需要root权限
$ tar -zxvf libpcap-1.9.0.tar.gz
$ cd libpcap-1.9.0.tar.gz
$ ./configure
$ make
$ make install

# 安装tcpdump的过程
$ tar -zxvf tcpdump-4.9.2
$ cd tcpdump-4.9.2
$ ./configure
$ make
$ make install
```

安装完成后跟上面一样输入`tcpdump`判断是否成功安装了：

```bash
$ tcpdump
```

## `tcpdump`的命令行参数和过滤规则

`tcpdump`是个命令行方式的网络嗅探器，如果不使用任何参数，会持续捕获所有的网络请求内容，无法有效分析，可以针对自己的需求使用合适的参数。

```bash
# 查看所有的参数内容
$ tcpdump --help
tcpdump version 4.9.2
libpcap version 1.9.0-PRE-GIT (with TPACKET_V2)
OpenSSL 1.0.0-fips 29 Mar 2010
Usage: tcpdump [-aAbdDefhHIJKlLnNOpqStuUvxX#] [ -B size ] [ -c count ]
                [ -C file_size ] [ -E algo:secret ] [ -F file ] [ -G seconds ]
                [ -i interface ] [ -j tstamptype ] [ -M secret ] [ --number ]
                [ -Q in|out|inout ]
                [ -r file ] [ -s snaplen ] [ --time-stamp-precision precision ]
                [ --immediate-mode ] [ -T type ] [ --version ] [ -V file ]
                [ -w file ] [ -W filecount ] [ -y datalinktype ] [ -z postrotate-command ]
                [ -Z user ] [ expression ]
```

常用的参数含义：

- `-a` 将网络地址转变为易识别的主机名（默认）
- `-n` 不将网络地址转变为易识别的主机名，即直接显示IP地址，可以省略DNS查询
- `-nn` 不进行端口名称的转换
- `-t` 不显示时间戳
- `-tttt` 输出由date处理后的时间戳
- `-c` 捕获指定数量的数据包后退出
- `-e` 显示数据链路层的头部信息，即MAC地址信息：`00:8c:fa:f3:e3:04 (oui Unknown) > 00:e0:ec:3e:8d:39 (oui Unknown), ethertype IPv4 (0x0800), length 71`
- `-f` 将目标的internet地址以IP形式展示
- `-i` 监听指定的网络接口
- `-S` 将tcp的序号以绝对值形式输出，而不是相对值
- `-r` 从指定文档中读取数据包
- `-w` 不分析和输出，将截获的数据包写入指定文档
- `-T` 将截获的数据包按指定类型报文解析，如：`cnfp/rpc/rtp/snmp/vat/wb`
- `-F` 从指定文档读取过滤规则，忽略命令行的其他参数指定的过滤规则
- `-v` 输出较详细的信息，如IP包的TTL和协议类型
- `-vv` 输出详细的信息
- `-l` 将标准输出转变为行缓冲方式
- `-d` 将上次捕获的信息包以汇编格式显示
- `-dd` 将上次捕获的信息包以C语言格式显示
- `-ddd` 将上次捕获的信息包以十进制格式显示

除了参数之外，更重要的是过滤表达式，包含三个类型关键字：

- `host: 10.10.13.15` 监听的主机
- `net: 10.10.0.0` 监听的网络
- `port: 21` 监听的端口

四个截获方向关键字：

- `dst: 10.10.13.15` 目标主机
- `src: 10.10.0.0` 源网络
- `dst and src`
- `dst or src`（缺省值）

多个协议关键字：`ether/fddi/tr/ip/ip6/rarp/decnet/tcp/udp`。

还支持组合表达式：`not/!/and/&&/or/||`。

举几个常用的例子：

```bash
# 只捕获指定IP的数据包
$ tcpdump host 10.10.13.15
# 捕获两个IP的数据包
$ tcpdump host 1010.13.15 and \(10.10.13.47\)
# 捕获指定端口和协议的数据包
$ tcpdump tcp port 21 and host 10.10.13.15
```

## 实例测试

> 这个实例是A机器`（client）`向B机器`（server）`发起`mysql`实例连接，并立刻`exit`的场景。

步骤：

1. A机器启动嗅探器：` tcpdump host 10.92.143.15 -tttt -S -nn`
2. A机器执行`mysql -u root -h 10.92.143.15 -p`
3. A机器数据库连接成功后，立刻`exit;`退出`mysql`实例连接

报文：

```bash
# 三次握手，其中S代表Syn，.代表Ack，S.代表Syn, Ack
2018-08-19 22:52:42.768100 IP 10.119.124.24.45298 > 10.92.143.15.3306: Flags [S], seq 864854527, win 14600, options [mss 1460,sackOK,TS val 2246810963 ecr 0,nop,wscale 8], length 0
2018-08-19 22:52:42.810055 IP 10.92.143.15.3306 > 10.119.124.24.45298: Flags [S.], seq 4288771247, ack 864854528, win 14480, options [mss 1460,sackOK,TS val 2062159250 ecr 2246810963,nop,wscale 8], length 0
2018-08-19 22:52:42.810065 IP 10.119.124.24.45298 > 10.92.143.15.3306: Flags [.], ack 4288771248, win 58, options [nop,nop,TS val 2246811005 ecr 2062159250], length 0
# 登录校验，传输用户名和密码验证阶段，其中P代表Push，传输数据需要。这里包含登录验证和版本信息等元数据的交换
2018-08-19 22:52:42.852102 IP 10.92.143.15.3306 > 10.119.124.24.45298: Flags [P.], seq 4288771248:4288771308, ack 864854528, win 57, options [nop,nop,TS val 2062159292 ecr 2246811005], length 60
2018-08-19 22:52:42.852118 IP 10.119.124.24.45298 > 10.92.143.15.3306: Flags [.], ack 4288771308, win 58, options [nop,nop,TS val 2246811047 ecr 2062159292], length 0
2018-08-19 22:52:42.853251 IP 10.119.124.24.45298 > 10.92.143.15.3306: Flags [P.], seq 864854528:864854590, ack 4288771308, win 58, options [nop,nop,TS val 2246811048 ecr 2062159292], length 62
2018-08-19 22:52:42.895198 IP 10.92.143.15.3306 > 10.119.124.24.45298: Flags [.], ack 864854590, win 57, options [nop,nop,TS val 2062159335 ecr 2246811048], length 0
2018-08-19 22:52:42.895256 IP 10.92.143.15.3306 > 10.119.124.24.45298: Flags [P.], seq 4288771308:4288771319, ack 864854590, win 57, options [nop,nop,TS val 2062159335 ecr 2246811048], length 11
2018-08-19 22:52:42.895264 IP 10.119.124.24.45298 > 10.92.143.15.3306: Flags [.], ack 4288771319, win 58, options [nop,nop,TS val 2246811090 ecr 2062159335], length 0
2018-08-19 22:52:42.895312 IP 10.119.124.24.45298 > 10.92.143.15.3306: Flags [P.], seq 864854590:864854627, ack 4288771319, win 58, options [nop,nop,TS val 2246811090 ecr 2062159335], length 37
2018-08-19 22:52:42.937268 IP 10.92.143.15.3306 > 10.119.124.24.45298: Flags [.], ack 864854627, win 57, options [nop,nop,TS val 2062159377 ecr 2246811090], length 0
2018-08-19 22:52:42.937405 IP 10.92.143.15.3306 > 10.119.124.24.45298: Flags [P.], seq 4288771319:4288771409, ack 864854627, win 57, options [nop,nop,TS val 2062159377 ecr 2246811090], length 90
2018-08-19 22:52:42.937414 IP 10.119.124.24.45298 > 10.92.143.15.3306: Flags [.], ack 4288771409, win 58, options [nop,nop,TS val 2246811132 ecr 2062159377], length 0
# 发送exit；正好5个字符
2018-08-19 22:52:44.366633 IP 10.119.124.24.45298 > 10.92.143.15.3306: Flags [P.], seq 864854627:864854632, ack 4288771409, win 58, options [nop,nop,TS val 2246812561 ecr 2062159377], length 5
# 四次挥手，其中F代表FIN，完成数据发送
2018-08-19 22:52:44.366649 IP 10.119.124.24.45298 > 10.92.143.15.3306: Flags [F.], seq 864854632, ack 4288771409, win 58, options [nop,nop,TS val 2246812561 ecr 2062159377], length 0
## 这个是exit的答复
2018-08-19 22:52:44.408575 IP 10.92.143.15.3306 > 10.119.124.24.45298: Flags [.], ack 864854632, win 57, options [nop,nop,TS val 2062160848 ecr 2246812561], length 0
2018-08-19 22:52:44.408618 IP 10.92.143.15.3306 > 10.119.124.24.45298: Flags [.], ack 864854633, win 57, options [nop,nop,TS val 2062160848 ecr 2246812561], length 0
2018-08-19 22:52:44.408652 IP 10.92.143.15.3306 > 10.119.124.24.45298: Flags [F.], seq 4288771409, ack 864854633, win 57, options [nop,nop,TS val 2062160848 ecr 2246812561], length 0
2018-08-19 22:52:44.408657 IP 10.119.124.24.45298 > 10.92.143.15.3306: Flags [.], ack 4288771410, win 58, options [nop,nop,TS val 2246812603 ecr 2062160848], length 0
```

> 具体的`mysql`通信内容可以查看这篇文章：[https://jin-yang.github.io/po...](https://jin-yang.github.io/post/mysql-protocol.html)