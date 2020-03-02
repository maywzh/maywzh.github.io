---
title: 探秘socket
categories: 计算机网络
tags:
  - TCP/IP
author: maywzh
date: 2015-12-21 03:28:18
thumbnail: https://ws2.sinaimg.cn/large/006tNbRwgy1fwe62yzvimj30rs0m2tj5.jpg
---



我们经常在网络编程接触socket这个概念，简而言之，socket就是网络套接字，提供一个网络通信的接口给通信的进程，但这样讲了等于没讲，今天就来好好研究研究。

## 啥是socket

虽然socket平时还是相当常用的，每当需要做网络编程的时候都会用到它，但深究起来，似乎还真的没办法说的很清楚。计算机里边有许多概念就是这样，比较抽象，解释了跟没解释一样。在此我们用大白话描述一下，争取让”街上卖煎饼果子的大叔“都能听懂。

简单来说，**socket 是对底层网络通信的一层抽象，让程序员可以像文件那样操作网络上发送和接收的数据。**

<!--more-->

> veryone knows what a files is... It's that "photo", "document", or "music" that you use. Programs are made of files, in fact, the whole Linux operating system is just a collection of files... But, now for the weird part. Not only is that digital photo that you uploaded to your computer a file, but your monitor is a file too! You see, in Linux, everything is a file! WOW!!! How can that be? Let's try to explain it.
>
> 在linux和Unix系统中，一起都是文件。

这么说更加一脸懵逼了。我们举个例子。

A与B打电话，A、B正对应于需要通信的两个进程。A想要和B通信，那么A就需要调用通信接口发信息（拨打电话），B也调用通信接口接受信息（接电话）。电话在这里就相当于socket，是A、B语音通信的接口，而电话的原理，A、B并不关心（进程不关心网络通信实现的细节）。

假设现在你要编程网络程序，进行服务器端和客户端的通信（数据交换）。对于服务端的通信进程SPrs和客户端的通信进程CPrs来说，他们的核心功能其实就是发送、接受数据。而中间的数据缓冲、监听端口、控制IO、封装解析TCP/IP协议等工作是非常标准化而繁琐的。那么按照模块分层设计原则，这些底层的功能就应该用接口来实现。socket正是这样一个接口，它将网络连接封装为一个socket模块，对于想要通信的双方而言，只要调用socket，就好像他们在直接通话一样。

socket，它现在已经是操作系统的一部分，在 linux 中是标准的系统调用，只要调用它提供的一组接口（下面会详解常用函数的使用），就能轻松地建立连接，读写数据，关闭连接，让网络操作就像文件操作一样简单。![img](https://ws1.sinaimg.cn/large/006tNc79gy1fvnj0f8s0yj30hq0dnjtj.jpg)

## 通信地址

正如想要打电话需要知道电话号码和分机号一样，在网络编程中，想要通信的双方也需要知道对方的通信地址。

在网络编程中，一个进程的地址是一个三元组（ip, port端口, protocol协议）。

ip 地址是网络层用来路由和通信的标识符，端口（port） 是传输层管理的。而 socket 是在这两层之上，所以需要这两个地址来标识。这里的协议指的是 ipv4，ipv6 或者其他协议。



## socket类型

socket类型在创建时指定，常用的有三种

- `SOCK_STREAM`：面向连接的稳定通信，底层是 TCP 协议。

- `SOCK_DGRAM`：无连接的通信，底层是 UDP 协议，需要上层的协议来保证可靠性。

- `SOCK_RAW`：更加灵活的数据控制，可指定IP头部。



## 实战

一个典型的tcp socket连接如下图

![tcpsocket](https://ws1.sinaimg.cn/large/006tNc79gy1fvnjmg8lvpj30et0c3wgr.jpg)

### 创建socket

```c
int socketid = socket(family, type, protocol);
//socketid: socket 描述符，可以看做是一个文件描述符，通过它来读/写数据

//family：整数，通信域。 
//   - AF_INET：因特网协议协议，网络地址，最常用。
//   - AF_UNIX，本地通信，文件地址

//type：通信类型
//   - SOCK_STREAM：可靠的，面向连接的服务，TCP 协议
//   - SOCK_DGRAM：不可靠，无连接的服务，UDP 协议
//   - SOCK_RAW：需要自己管理 IP 头部的数据

//protocol：协议, 一般设为 0， 表示使用默认协议
//   - IPPROTO_TCP，IPPROTO_UDP
    
```

### 关闭socket

```c
int status = close(socketid);
//返回值0 正确
//返回值-1 出错
```

关闭连接和释放端口。

### 服务端/客户端绑定（bind）地址三元组到 socket

```c
int bind(int fd, const struct sockaddr *, socklen_t);
// 还记得那句话吗，在Unix系统里，一切都是文件，socket也对应一个文件描述符fd
```

把 socket 绑定到某个地址三元组，用于 server 端监听端口。第一个参数是 socket 的描述符，第二个参数 `struct sockaddr` 是地址结构体，第三个参数是地址结构体的长度。绑定失败的话返回值为负数，否则为 -1，并且设置 `errno`。

其中最重要的就是地址结构体，它在 `netinet/in.h` 中被定义：

```c
struct sockaddr_in
{
  short   sin_family; /* must be AF_INET */
  u_short sin_port;   /* 端口号，必须要通过 htons 转换为网络格式 */
  struct  in_addr sin_addr;  /* ip 地址 */
  char    sin_zero[8]; /* Not used, must be zero */
};
```

其中， `in_addr` 也是在同一个文件夹被定义，格式为：

```c
struct in_addr
{
    uint32_t s_addr; //32位整数 本机地址
};
//可以用 INADDR_ANY 变量表示接受来自任何地址的连接，使用之前需要把地址变量初始化为全0
```

服务器端的 `s_addr` 是本机地址，`sockaddr` 是通用的 socket 地址结构，`sockaddr_in` 是网络 socket 的结构，参数有一个类型转换的过程。



### 服务端监听（listen）socket

```c
listen(sockfd, 5);
// 参数1 socket 描述符
// 参数2 最大连接数，表示发来请求但是没有被 accept 的连接数量。
// listen 函数在成功时返回 0，失败时返回 -1，并且设置错误代码。
```

`listen` 系统调用让服务端进程监听在指定的 socket 上面，函数在成功时返回 0，失败时返回 -1，并且设置错误代码。



### 客户端请求连接（connect）

客户端要连接自己的 socket 和服务器的监听socket：

```c
int connect(int socket, const struct sockaddr* address, size_t address_len);
// socket 是客户端本地创建的套接字
// address 是服务器的三元组地址
```

成功调用时，服务器端将收到请求，`accept` 连接之后，就在两者之间建立了 socket 通信的管道，之后的读写就是直接对 socket 进行操作。

### 服务端接受（accept）连接

```c
new_socket = accept(socket_desc, (struct sockaddr *)&client, (socklen_t*)&c);
```

每当接收到客户端的连接请求时，服务端调用`accept` 函数接受该连接，把客户端的 socket 地址信息保存到 `client` 变量里，新建一个 socket，返回其描述符，然后数据的读写就能通过新 socket 进行。 新 socket 的地址和服务器监听 socket 是一样的，如果不关心客户端地址信息的话，可以把第二个和第三个参数都设置为空指针 `NULL`。

有了 `client` 变量，就能得到客户端的 `ip` 和 `port` ：

```
char *client_ip = inet_ntoa(client.sin_addr);
int client_port = ntohs(client.sin_port);
```

**如果没有客户端连接，`accept` 函数将会阻塞，直到有连接过来**。

### 读/写（Write）数据

上面那么多的函数调用，只是建立了服务器端和客户端的连接，算是通信前的准备工作，两者都有了自己的 socket 描述符。 有了 socket 描述符，就可以像文件那样进行读写数据：

```c
write(socket_des, message, strlen(message));
read(socket_des, buffer, sizeof(buffer));
```

需要注意的是，`read` 函数调用是阻塞的，也就是说如果没有数据发送过来的话，该函数会一直等待，直到可以读到数据。

`read`和 `write` 返回的是实际读写的数据，这个数据最大是 buffer 的大小。如果传输的数据大于 buffer 的话，需要在程序里显式地去读取，否则会出错。

你可能会想，我一直读到返回的数据小于 `sizeof(buff)` 不就行了。嗯，这是一个解决方案，不过要判断返回值不是 0，因为返回值是 0 表示连接已经中断（需要调用 `close` 来关闭 socket），而不是没有数据发送过来。

### 其他常用函数

1. 获取 ip 地址

   很多时候，我们只知道服务器的域名，并不知道 ip 地址。`gethostbyname` 函数就能完成这个功能，`netdb.h` 文件里有它的定义，它的原型是：

   ```
   #include <netdb.h> struct hostent * gethostbyname(const char *name);
   ```

   参数 `name` 是诸如 `www.google.com` 的字符串，返回值是 `struct hostent` 结构体，用来存储得到的地址信息。

   ```
   struct hostent { char *h_name; /* Official name of host. */ char **h_aliases; /* Alias list. */ int h_addrtype; /* Host address type. */ int h_length; /* Length of address. */ char **h_addr_list; /* List of addresses from name server. */ };
   ```

   如果函数调用失败，返回空指针 `NULL`。

2. 把 long 类型的 ip 转换为字符串类型

   ```
   #include <arpa/inet.h> char *inet_ntoa(struct in_addr); int inet_aton(const char *cp, struct in_addr *inp);
   ```

   上面的函数返回可用的 in_addr 结构体，需要你手动赋值。下面的函数把转换后的结构拷贝到 inp 指向的结构体里面，然后 inp 就可以直接使用了。

3. 把字符串类型的 ip 转换为 long 类型

   ```
   #include <arpa/inet.h> in_addr_t inet_addr(const char *ip);
   ```

4. 把字符串转换成整数

   ```
   int atoi(const char *nptr);
   ```

   这个可以把从键盘输入的端口号转换成可用的整数。

5. `getpeername`：获取连在某个 socket 另一端的客户地址(ip 和 port)

   ```
   int getpeername(int sockfd, struct sockaddr *addr, socklen_t *addrlen);
   ```

   返回的信息保存在 addr 结构体里。

## Demo演示

本demo实现一个EchoServer，监听54321端口，接受客户端的信息并加上时间戳发送回去。

```c
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <sys/types.h>
#include <time.h>

#define BUFFER_SIZE 1024
#define PORT 54321
#define BACKLOG 5

int setup_sock(int port)
{
    /*
        * This function sets up a socket listening on local port.
        *
        * port: port number to listen on.
        * :return: socket file descriptor.
        */
    int listen_fd;
    struct sockaddr_in serv_addr;
    
    listen_fd = socket(AF_INET, SOCK_STREAM, 0);
    memset(&serv_addr, 0, sizeof(serv_addr));
    
    serv_addr.sin_family = AF_INET;
    serv_addr.sin_addr.s_addr = htonl(INADDR_ANY);
    serv_addr.sin_port = htons(port);
    
    bind(listen_fd, (struct sockaddr*)&serv_addr, sizeof(serv_addr));
    listen(listen_fd, BACKLOG);
    
    return listen_fd;
}


void echo_request(int conn_fd)
{
    int n;
    time_t ticks;
    char sendBuff[BUFFER_SIZE];
    char recvBuff[BUFFER_SIZE];
    
    memset(sendBuff, 0, sizeof(sendBuff));
    memset(recvBuff, 0, sizeof(recvBuff));
    
    while( (n = recv(conn_fd, recvBuff, sizeof(recvBuff), 0)) > 0)
    {
        ticks = time(NULL);
        snprintf(sendBuff, sizeof(sendBuff), "%.24s: ", ctime(&ticks));
    
        recvBuff[n] = '\0';
        printf("received:  %s", recvBuff);
        strcat(sendBuff, recvBuff);
        send(conn_fd, sendBuff, strlen(sendBuff), 0);
    }
    printf("received 0 bytes, close.\n");
    close(conn_fd);
}


int main(int argc, char *argv[])
{
    int listen_fd = 0, conn_fd = 0;
    socklen_t cli_len;
    struct sockaddr_in cli_addr;
    
    printf("start server...\n");
    memset(&cli_addr, '0', sizeof(cli_addr));
    
    listen_fd = setup_sock(PORT);
    printf("listening on 0.0.0.0 %d...\n", PORT);
    
    cli_len = sizeof(cli_addr);
    while(1)
    {
        conn_fd = accept(listen_fd, (struct sockaddr*)&cli_addr, &cli_len);
        printf("client ip: %s, port: %d\n",
                inet_ntoa(cli_addr.sin_addr),
                ntohs(cli_addr.sin_port));
    
        echo_request(conn_fd);
    }
}
```

用 telnet 测试的结果如下：

![image-20180927202444367](https://ws1.sinaimg.cn/large/006tNc79gy1fvodb0jzaij31bs0vgdj4.jpg)


## 参考资料

- [Introduction to Sockets Programming in C using TCP/IP](http://www.csd.uoc.gr/~hy556/material/tutorials/cs556-3rd-tutorial.pdf)
- [Beej’s Guide to Network Programming Using Internet Sockets](http://beej.us/guide/bgnet/)
- [socket programming in C on Linux](http://www.binarytides.com/socket-programming-c-linux-tutorial/)