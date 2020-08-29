---
title: Redis详解之——单线程高并发
categories: 数据库
comments: false
date: 2018-03-01 20:13:04
tags:
  - Redis
  - 多线程
  - 并发
thumbnail: https://i.loli.net/2020/08/28/txIJVifd9a8mlzY.png
---

redis 最基本的一个内部原理和特点，就是 redis 实际上是个单线程工作模型。如今在各大互联网公司已经大面积取代了memcached的应用。它可以承载相当大的QPS。在这里，我们通过对Redis的线程模型和并发模型对它的高性能进行分析。

<!--more-->

## Redis线程模型

redis 内部使用文件事件处理器 file event handler，这个文件事件处理器是单线程的，所以 redis 才叫做单线程的模型。它采用 IO 多路复用机制同时监听多个 socket，根据 socket 上的事件来选择对应的事件处理器进行处理。

文件事件处理器的结构包含 4 个部分：

- 多个 socket
- IO 多路复用程序
- 文件事件分派器
- 事件处理器（连接应答处理器、命令请求处理器、命令回复处理器）

多个 socket 可能会并发产生不同的操作，每个操作对应不同的文件事件，但是 IO 多路复用程序会监听多个 socket，会将 socket 产生的事件放入队列中排队，事件分派器每次从队列中取出一个事件，把该事件交给对应的事件处理器进行处理。

来看客户端与 redis 的一次通信过程：

![fv69yaxxd9](https://i.loli.net/2020/08/28/IEtOiXKdgDWRGos.png)

客户端 socket01 向 redis 的 server socket 请求建立连接，此时 server socket 会产生一个 AE_READABLE 事件，IO 多路复用程序监听到 server socket 产生的事件后，将该事件压入队列中。文件事件分派器从队列中获取该事件，交给连接应答处理器。连接应答处理器会创建一个能与客户端通信的 socket01，并将该 socket01 的 AE_READABLE 事件与命令请求处理器关联。

假设此时客户端发送了一个 set key value 请求，此时 redis 中的 socket01 会产生 AE_READABLE 事件，IO 多路复用程序将事件压入队列，此时事件分派器从队列中获取到该事件，由于前面 socket01 的 AE_READABLE 事件已经与命令请求处理器关联，因此事件分派器将事件交给命令请求处理器来处理。命令请求处理器读取 socket01 的 key value 并在自己内存中完成 key value 的设置。操作完成后，它会将 socket01 的 AE_WRITABLE 事件与命令回复处理器关联。

如果此时客户端准备好接收返回结果了，那么 redis 中的 socket01 会产生一个 AE_WRITABLE 事件，同样压入队列中，事件分派器找到相关联的命令回复处理器，由命令回复处理器对 socket01 输入本次操作的一个结果，比如 ok，之后解除 socket01 的 AE_WRITABLE 事件与命令回复处理器的关联。

这样便完成了一次通信。



### 几种I/O模型

为什么Redis要采用 I/O多路复用技术？

Redis是单线程的，所以所有的操作都是线性执行的，由于读写操作等待用户输入或输出都是阻塞的，所以I/O操作在一般情况下往往不能直接返回，这会导致某一文件的IO阻塞导致整个进程无法对其他客户提供服务，而IO多路复用就是为了解决这个问题。

#### 回顾IO多路复用

多路复用的特点是通过一种机制一个进程能同时等待IO文件描述符，内核监视这些文件描述符（套接字描述符），其中的任意一个进入读就绪状态，`select`， `poll`，`epoll`函数就可以返回。对于监视的方式，又可以分为 select， poll， epoll三种方式。

![20164149_LD8E](https://i.loli.net/2020/08/28/T1hwz5douryFOXb.png)

#### Reactor设计模式



reactor设计模式，是一种**基于事件驱动**的设计模式。Reactor框架是ACE各个框架中最基础的一个框架，其他框架都或多或少地用到了Reactor框架。在事件驱动的应用中，将一个或多个客户的服务请求分离（demultiplex）和调度（dispatch）给应用程序。在事件驱动的应用中，同步地、有序地处理同时接收的多个服务请求。reactor模式与外观模式有点像。不过，观察者模式与单个事件源关联，而反应器模式则与多个事件源关联 。当一个主体发生改变时，所有依属体都得到通知。

![aHR0cDovL2ltZy5ibG9nLmNzZG4ubmV0LzIwMTYxMTAzMTAxMzAyMzMx](https://i.loli.net/2020/08/28/piHkn5ALthX34BR.png)

> Handles ：表示操作系统管理的资源，我们可以理解为fd。
>
> Synchronous Event Demultiplexer ：同步事件分离器，阻塞等待Handles中的事件发生。
>
> Initiation Dispatcher ：初始分派器，作用为添加Event handler（事件处理器）、删除Event handler以及分派事件给Event handler。也就是说，Synchronous Event Demultiplexer负责等待新事件发生，事件发生时通知Initiation Dispatcher，然后Initiation Dispatcher调用event handler处理事件。
>
> Event Handler ：事件处理器的接口
>
> Concrete Event Handler ：事件处理器的实际实现，而且绑定了一个Handle。因为在实际情况中，我们往往不止一种事件处理器，因此这里将事件处理器接口和实现分开，与C++、Java这些高级语言中的多态类似。



文件事件处理器使用I/O多路复用模块同时监听多个FD，当accept、read、write和close文件事件产生时，文件事件处理器就会回调FD绑定的事件处理器。

虽然整个文件事件处理器在单线程上运行，但是通过I/O多路复用模块的引入，实现了同时对多个FD读写的监控，提高了网络通信模型的性能，同时也可以保证整个Redis服务的实现的简单。

#### I/O多路复用模块

