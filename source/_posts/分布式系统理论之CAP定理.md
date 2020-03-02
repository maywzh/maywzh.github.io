---
title: 分布式系统理论之CAP定理
categories: 计算机网络
date: 2017-09-20 16:12:25
tags: 
  - 分布式计算
thumbnail: https://ws2.sinaimg.cn/large/006tNbRwgy1fwe3cgrrvoj30l60cwabe.jpg
---

什么是CAP定理

> CAP由[Eric Brewer](https://en.wikipedia.org/wiki/Eric_Brewer_(scientist))在2000年PODC会议上提出，是Eric Brewer在Inktomi期间研发搜索引擎、分布式web缓存时得出的关于数据一致性(consistency)、服务可用性(availability)、分区容错性(partition-tolerance)的猜想：
>
> It is impossible for a web service to provide the three following guarantees : Consistency, Availability and Partition-tolerance.

C 代表 Consistency 一致性， A 代表 Availability 可用性， P 代表 partition-tolerance 分区容错性。

- **数据一致性**(consistency)：如果系统对一个写操作返回成功，那么之后的读请求都必须读到这个新数据；如果返回失败，那么所有读操作都不能读到这个数据，对调用者而言数据具有强一致性(strong consistency) (又叫原子性 atomic、线性一致性 linearizable consistency)
- **服务可用性**(availability)：所有读写请求在一定时间内得到响应，可终止、不会一直等待
- **分区容错性**(partition-tolerance)：在网络分区的情况下，被分隔的节点仍能正常对外服务

在某时刻如果满足AP，分隔的节点同时对外服务但不能相互通信，将导致状态不一致，即不能满足C；如果满足CP，网络分区的情况下为达成C，请求只能一直等待，即不满足A；如果要满足CA，在一定时间内要达到节点状态一致，要求不能出现网络分区，则不能满足P。即C、A、P三者最多只能满足其中两个。