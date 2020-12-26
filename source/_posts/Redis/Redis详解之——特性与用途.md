---
title: Redis详解之——特性与用途
categories: 数据库
comments: false
date: 2018-03-04 19:13:49
tags:
  - Redis
thumbnail: https://i.loli.net/2020/12/26/VnDYPXRI9mKNBA7.png
cover: https://i.loli.net/2020/12/26/VnDYPXRI9mKNBA7.png
---

`Redis` 是一个使用 `ANSI C` 编写的开源、支持 **网络**、基于 **内存**、**单线程模型**、**可选持久性** 的 **键值对存储数据库**。Redis是一个K-V的非关系型数据库（NoSQL），常见的NoSQL数据库有：K-V数据库如Redis、Memcached，列式数据库如大数据组件HBase，文档数据库如mongoDB。Redis应用广泛，尤其是被作为缓存使用。

<!--more-->

## 特性

1. **速度快**，最快可达到 `10w QPS`（基于 **内存**，`C` 语言，**单线程** 架构）；
2. 基于 **键值对** (`key/value`) 的数据结构服务器。全称 `Remote Dictionary Server`。包括 `string`(**字符串**)、`hash`(**哈希**)、`list`(**列表**)、`set`(**集合**)、`zset`(**有序集合**)、`bitmap`(**位图**)。同时在 **字符串** 的基础上演变出 **位图**（`BitMaps`）和 `HyperLogLog` 两种数据结构。`3.2` 版本中加入 `GEO`（**地理信息位置**）。
3. 丰富的功能。例如：**键过期**（缓存），**发布订阅**（消息队列）， `Lua` 脚本（自己实现 `Redis` 命令），**事务**，**流水线**（`Pipeline`，用于减少网络开销）。
4. 简单稳定。无外部库依赖，单线程模型。
5. 客户端语言多。
6. **持久化**（支持两种 **持久化** 方式 `RDB` 和 `AOF`）。
7. **主从复制**（分布式的基础）。
8. **高可用**（`Redis Sentinel`），**分布式**（`Redis Cluster`）和 **水平扩容**。



## 应用场景

### 缓存

合理的使用 **缓存** 能够明显加快访问的速度，同时降低数据源的压力。这也是 `Redis` 最常用的功能。`Redis` 提供了 **键值过期时间**（`EXPIRE key seconds`）设置，并且也提供了灵活控制 **最大内存** 和 **内存溢出** 后的 **淘汰策略**。

#### 缓存穿透

缓存穿透是指查询一个一定不存在的数据，由于缓存是不命中时被动写的，并且出于容错考虑，如果从存储层查不到数据则不写入缓存，这将导致这个不存在的数据每次请求都要到存储层去查询，失去了缓存的意义。在流量大时，可能DB就挂掉了，要是有人利用不存在的key频繁攻击我们的应用，这就是漏洞。

有很多种方法可以有效地解决缓存穿透问题，最常见的则是采用布隆过滤器，将所有可能存在的数据哈希到一个足够大的bitmap中，一个一定不存在的数据会被 这个bitmap拦截掉，从而避免了对底层存储系统的查询压力。另外也有一个更为简单粗暴的方法（我们采用的就是这种），如果一个查询返回的数据为空（不管是数 据不存在，还是系统故障），我们仍然把这个空结果进行缓存，但它的过期时间会很短，最长不超过五分钟。



#### 缓存雪崩

缓存雪崩是指在我们设置缓存时采用了相同的过期时间，导致缓存在某一时刻同时失效，请求全部转发到DB，DB瞬时压力过重雪崩。

缓存失效时的雪崩效应对底层系统的冲击非常可怕。大多数系统设计者考虑用加锁或者队列的方式保证缓存的单线 程（进程）写，从而避免失效时大量的并发请求落到底层存储系统上。这里分享一个简单方案就时讲缓存失效时间分散开，比如我们可以在原有的失效时间基础上增加一个随机值，比如1-5分钟随机，这样每一个缓存的过期时间的重复率就会降低，就很难引发集体失效的事件。



#### 缓存击穿

对于一些设置了过期时间的key，如果这些key可能会在某些时间点被超高并发地访问，是一种非常“热点”的数据。这个时候，需要考虑一个问题：缓存被“击穿”的问题，这个和缓存雪崩的区别在于这里针对某一key缓存，前者则是很多key。缓存在某个时间点过期的时候，恰好在这个时间点对这个Key有大量的并发请求过来，这些请求发现缓存过期一般都会从后端DB加载数据并回设到缓存，这个时候大并发的请求可能会瞬间把后端DB压垮。

##### 解决方案

1. 互斥锁

   业界比较常用的做法，是使用mutex。简单地来说，就是在缓存失效的时候（判断拿出来的值为空），不是立即去load db，而是先使用缓存工具的某些带成功操作返回值的操作（比如Redis的SETNX或者Memcache的ADD）去set一个mutex key，当操作返回成功时，再进行load db的操作并回设缓存；否则，就重试整个get缓存的方法。SETNX，是「SET if Not eXists」的缩写，也就是只有不存在的时候才设置，可以利用它来实现锁的效果。所以这里给出代码参考：

   ``` java
   //Redis
   public String get(key) {
         String value = redis.get(key);
         if (value == null) { //代表缓存值过期
             //设置3min的超时，防止del操作失败的时候，下次缓存过期一直不能load db
   		  if (redis.setnx(key_mutex, 1, 3 * 60) == 1) {  //代表设置成功
                  value = db.get(key);
                         redis.set(key, value, expire_secs);
                         redis.del(key_mutex);
                 } else {  //这个时候代表同时候的其他线程已经load db并回设到缓存了，这时候重试获取缓存值即可
                         sleep(50);
                         get(key);  //重试
                 }
             } else {
                 return value;      
             }
    }
   
   //Memcache
   if (memcache.get(key) == null) {  
       // 3 min timeout to avoid mutex holder crash  
       if (memcache.add(key_mutex, 3 * 60 * 1000) == true) {  
           value = db.get(key);  
           memcache.set(key, value);  
           memcache.delete(key_mutex);  
       } else {  
           sleep(50);  
           retry();  
       }  
   }
   
   ```

2. 提前使用互斥锁

   在value内部设置1个超时值(timeout1), timeout1比实际的memcache timeout(timeout2)小。当从cache读取到timeout1发现它已经过期时候，马上延长timeout1并重新设置到cache。然后再从数据库加载数据并设置到cache中。伪代码如下：

   ```java
   
   v = memcache.get(key);  
   if (v == null) {  
       if (memcache.add(key_mutex, 3 * 60 * 1000) == true) {  
           value = db.get(key);  
           memcache.set(key, value);  
           memcache.delete(key_mutex);  
       } else {  
           sleep(50);  
           retry();  
       }  
   } else {  
       if (v.timeout <= now()) {  
           if (memcache.add(key_mutex, 3 * 60 * 1000) == true) {  
               // extend the timeout for other threads  
               v.timeout += 3 * 60 * 1000;  
               memcache.set(key, v, KEY_TIMEOUT * 2);  
     
               // load the latest value from db  
               v = db.get(key);  
               v.timeout = KEY_TIMEOUT;  
               memcache.set(key, value, KEY_TIMEOUT * 2);  
               memcache.delete(key_mutex);  
           } else {  
               sleep(50);  
               retry();  
           }  
       }  
   }
   ```

3. 永远不过期

   这里的“永远不过期”包含两层意思：

   > (1) 从redis上看，确实没有设置过期时间，这就保证了，不会出现热点key过期问题，也就是“物理”不过期。
   >
   > (2) 从功能上看，如果不过期，那不就成静态的了吗？所以我们把过期时间存在key对应的value里，如果发现要过期了，通过一个后台的异步线程进行缓存的构建，也就是“逻辑”过期

   ​    从实战看，这种方法对于性能非常友好，唯一不足的就是构建缓存时候，其余线程(非构建缓存的线程)可能访问的是老数据，但是对于一般的互联网功能来说这个还是可以忍受。

   ```java
   
   String get(final String key) {  
           V v = redis.get(key);  
           String value = v.getValue();  
           long timeout = v.getTimeout();  
           if (v.timeout <= System.currentTimeMillis()) {  
               // 异步更新后台异常执行  
               threadPool.execute(new Runnable() {  
                   public void run() {  
                       String keyMutex = "mutex:" + key;  
                       if (redis.setnx(keyMutex, "1")) {  
                           // 3 min timeout to avoid mutex holder crash  
                           redis.expire(keyMutex, 3 * 60);  
                           String dbValue = db.get(key);  
                           redis.set(key, dbValue);  
                           redis.delete(keyMutex);  
                       }  
                   }  
               });  
           }  
           return value;  
   
   ```

   



4. 资源保护

   采用netflix的hystrix，可以做资源的隔离保护主线程池，如果把这个应用到缓存的构建也未尝不可。

   四种解决方案：没有最佳只有最合适

   

   | 解决方案                      | 优点                                                   | 缺点                                                         |
   | ----------------------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
   | 简单分布式互斥锁（mutex key） | 1. 思路简单2. 保证一致性                               | 1. 代码复杂度增大2. 存在死锁的风险3. 存在线程池阻塞的风险    |
   | “提前”使用互斥锁              | 1. 保证一致性                                          | 同上                                                         |
   | 不过期(本文)                  | 1. 异步构建缓存，不会阻塞线程池                        | 1. 不保证一致性。2. 代码复杂度增大(每个value都要维护一个timekey)。3. 占用一定的内存空间(每个value都要维护一个timekey)。 |
   | 资源隔离组件hystrix(本文)     | 1. hystrix技术成熟，有效保证后端。2. hystrix监控强大。 | 1. 部分访问存在降级策略。                                    |

#### 过期策略

大部分场景`不适合缓存一致存在`，首先，你的sql数据库的内容可能很多就不说了，另外，返回给你的对象如果是完整的pojo对象还好，但是如果是使用不同参数各种关联查询出来的结果那么redis中会储存太多冷数据。占用资源而得不到销毁。我们学过`操作系统`也知道在计算机的`缓存实现`中有）先进先出的算法（**FIFO**）；最近最少使用算法（**LRU**）；最佳淘汰算法（**OPT**）；最少访问页面算法（**LFR**）等磁盘调度算法。对于web开发也可以借鉴。根据时间来的FIFO是最好实现的。因为redis在`全局key`支持过期策略。

而开发中可能还会遇到`其他问题`。比如过期时间的选择上，如果过久会导致数据聚集。而过少可能导致频繁查询数据库甚至可能会导致缓存雪崩等问题。

所以，过期策略一定要设置。并且对于`关键key`一定要`小心谨慎设计`。

### 排行榜

每个网站都有自己的排行榜，例如按照 **热度排名** 的排行榜，**发布时间** 的排行榜，**答题排行榜** 等等。`Redis` 提供了 **列表**（`list`）和 **有序集合**（`zset`）数据结构，合理的使用这些数据结构，可以很方便的构建各种排行榜系统。



### 计数器

**计数器** 在网站应用中非常重要。例如：**点赞数**加 `1`，**浏览数** 加 `1`。还有常用的 **限流操作**，限制每个用户每秒 **访问系统的次数** 等等。`Redis` 支持 **计数功能**（`INCR key`），而且计数的 **性能** 也非常好，计数的同时也可以设置 **超时时间**，这样就可以 **实现限流**。



### 社交网络

赞/踩，粉丝，共同好友/喜好，推送，下拉刷新等是社交网站必备的功能。由于社交网站 **访问量通常比较大**，而且 **传统的数据库** 不太适合保存这类数据，`Redis` 提供的 **数据结构** 可以相对比较容易实现这些功能。



### 消息队列

`Redis` 提供的 **发布订阅**（`PUB/SUB`）和 **阻塞队列** 的功能，虽然和专业的消息队列比，还 **不够强大**，但对于一般的消息队列功能基本满足。



