---
title: Leetcode1115-交替打印FooBar题解
categories: 刷题
comments: false
thumbnail: 'https://i.loli.net/2020/09/02/A7PJcl2btayUY1K.jpg'
cover: 'https://i.loli.net/2020/09/02/A7PJcl2btayUY1K.jpg'
date: 2018-09-02 14:28:42
tags:
  - 多线程
  - 并发编程
---

借助这题复习一下Java并发类和工具。

## 题目描述

两个不同的线程将会共用一个 FooBar 实例。其中一个线程将会调用 foo() 方法，另一个线程将会调用 bar() 方法。

请设计修改程序，以确保 "foobar" 被输出 n 次。

<!--more-->

我们提供一个类：

```java
class FooBar {
    private int n;

    public FooBar(int n) {
        this.n = n;
    }

    public void foo(Runnable printFoo) throws InterruptedException {
        
        for (int i = 0; i < n; i++) {
            
        	// printFoo.run() outputs "foo". Do not change or remove this line.
        	printFoo.run();
        }
    }

    public void bar(Runnable printBar) throws InterruptedException {
        
        for (int i = 0; i < n; i++) {
            
            // printBar.run() outputs "bar". Do not change or remove this line.
        	printBar.run();
        }
    }
} 
```

- 示例 1:

  输入: n = 1
  输出: "foobar"
  解释: 这里有两个线程被异步启动。其中一个调用 foo() 方法, 另一个调用 bar() 方法，"foobar" 将被输出一次。

- 示例 2:

  输入: n = 2
  输出: "foobarfoobar"
  解释: "foobar" 将被输出两次。



## 思路

这题考的是线程同步，那么显而易见，信号量、互斥锁、共享内存这些方案都是可行的。

## 题解

### 信号量Semaphore

Semaphore翻译成字面意思为 信号量，Semaphore可以控同时访问的线程个数，通过 acquire() 获取一个许可，如果没有就等待，而 release() 释放一个许可。

Semaphore类位于java.util.concurrent包下，它提供了2个构造器：

```java
public Semaphore(int permits) {          //参数permits表示许可数目，即同时可以允许多少线程进行访问
    sync = new NonfairSync(permits);
}
public Semaphore(int permits, boolean fair) {    //这个多了一个参数fair表示是否是公平的，即等待时间越久的越先获取许可
    sync = (fair)? new FairSync(permits) : new NonfairSync(permits);
}
```

下面说一下Semaphore类中比较重要的几个方法，首先是acquire()、release()方法：

```java
public void acquire() throws InterruptedException {  }     //获取一个许可
public void acquire(int permits) throws InterruptedException { }    //获取permits个许可
public void release() { }          //释放一个许可
public void release(int permits) { }    //释放permits个许可
```

　　acquire()用来获取一个许可，若无许可能够获得，则会一直等待，直到获得许可。

　　release()用来释放许可。注意，在释放许可之前，必须先获获得许可。

　　这4个方法都会被阻塞，如果想立即得到执行结果，可以使用下面几个方法：

```java
public boolean tryAcquire() { };    
//尝试获取一个许可，若获取成功，则立即返回true，若获取失败，则立即返回false
public boolean tryAcquire(long timeout, TimeUnit unit) throws InterruptedException { };  
//尝试获取一个许可，若在指定的时间内获取成功，则立即返回true，否则则立即返回false
public boolean tryAcquire(int permits) { }; 
//尝试获取permits个许可，若获取成功，则立即返回true，若获取失败，则立即返回false
public boolean tryAcquire(int permits, long timeout, TimeUnit unit) throws InterruptedException { }; //尝试获取permits个许可，若在指定的时间内获取成功，则立即返回true，否则则立即返回false
```

 　另外还可以通过availablePermits()方法得到可用的许可数目。

```java

```



