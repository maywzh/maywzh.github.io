---
title: 分布式协议之Raft算法
categories: 分布式
comments: false
thumbnail: https://i.loli.net/2020/09/09/c5jmaJvZiU4oQ2O.png
cover: https://i.loli.net/2020/09/09/c5jmaJvZiU4oQ2O.png
date: 2017-09-28 23:58:56
tags:
  - 分布式
---

Raft是一种分布式共识算法。相对于之前的Paxos协议，它的设计易于理解。它解决了即使面对故障也使多个服务器在共享状态上达成一致的问题。共享状态通常是复制日志支持的数据结构。只要大多数服务器都处于运行状态，我们就需要系统能够完全运行。

Raft通过选举集群中的一位leader来工作。leader负责接受client请求并管理将日志复制到其他服务器。数据仅在一个方向上流动：从leader流向其他服务器。

<!--more-->

Raft将共识分解为三个子问题：

- leader选举：如果现有leader失败，则需要选举一名新leader。
- 日志复制：leader需要通过复制使所有服务器的日志与其自己的服务器保持同步。
- 安全性：如果其中一台服务器已在特定索引上提交了日志条目，则其他任何服务器都无法对该索引应用其他日志条目。



## 基础

每个服务器都处于以下三种状态之一：leader，follower或candidate。

![oN6xZLkKQrVnaWWlp7I8w9aep2NNgMz5fR9D](https://i.loli.net/2020/09/09/xoBVRrGPyQzFDAY.png)



> 在正常操作中，只有一个leader，其他所有服务器都是follower。follower是被动的：他们自己不发出请求，而只是响应leader和candidate的请求。leader处理所有客户请求（如果客户联系follower，则follower将其重定向到leader）。第三种状态，candidate，用于选举新leader。

Raft将时间分为任意长度，每个长度以选举开始。如果candidate赢得选举，则在剩余任期中仍将是leader。如果表决分裂，则该任期在没有leader的情况下结束。

**term号**单调增加。每个服务器存储当前的term编号，该编号也在每次通信中交换。



> ..如果一台服务器的当前期限小于另一台服务器，则它将其当前期限更新为较大的值。如果candidate或leader发现其任期已过时，它将立即恢复为follower状态。如果服务器收到带有过期条款编号的请求，则该服务器将拒绝该请求。




Raft利用两个远程过程调用（RPC）来执行其基本操作。

candidate在选举期间使用RequestVotes
leader将AppendEntries用于复制日志条目，并用作检测信号（检查服务器是否已启动的信号-它不包含任何日志条目）



## leader选举

leader定期向其follower发送心跳，以保持权威。当follower在等待leader的心跳后超时时，将触发leader选举。该follower转换为candidate状态并增加其任期编号。在为自己投票之后，它与集群中的其他进程并行地发出RequestVotes RPC。可能有以下三种结果：

1. candidate从大多数服务器中获得选票并成为leader。然后，它将心跳消息发送给集群中的其他人以建立权限。
2. 如果其他candidate收到AppendEntries RPC，他们将检查term号。如果term号大于自己的term号，则他们接受服务器作为leader并返回到follower状态。如果term号数量较小，则他们拒绝RPC，并且仍然是candidate。
3. candidate既不输也不赢。如果同时有多个服务器成为candidate服务器，则可以在没有明显多数的情况下进行表决。在这种情况下，其中一名candidate超时后便会开始新的选举。

> Raft使用随机的选举超时来确保分割票很少发生，并且可以快速解决。为了避免一票分裂，首先从固定间隔（例如150-300毫秒）中随机选择选举超时。这样会分散服务器，因此在大多数情况下，只有一台服务器会超时；它会赢得选举并在其他任何服务器超时之前发送心跳信号。使用相同的机制来处理拆分投票。每位candidate在选举开始时都会重新启动其随机选举超时时间，并等待该超时时间过去后才开始下一次选举；这减少了在新选举中再次进行分裂表决的可能性。



## 日志复制


client请求现在假定为仅写。每个请求都包含一个命令，该命令理想地由所有服务器的复制状态机执行。leader收到客户请求后，会将其作为新条目添加到自己的日志中。日志中的每个条目：

- 包含client指定的命令
- 有一个索引来标识日志中条目的位置（索引从1开始）
- 有一个term号可以从逻辑上识别条目的写入时

它需要将条目复制到所有follower节点，以保持日志一致。leader将AppendEntries RPC并行发布到所有其他服务器。leader将重试此操作，直到所有follower安全地复制新条目为止。

当条目由创建它的leader复制到大多数服务器时，就被视为已提交。所有以前的条目，包括由早期leader创建的条目，也都视为已提交。负责人一旦提交就执行该条目，并将结果返回给client。

leader在其日志中维护它知道要提交的最高索引，并将其与AppendEntries RPC一起发送给其follower。一旦follower发现条目已提交，它将按顺序将条目应用于其状态机。

Raft 维护以下属性，它们共同构成了日志匹配属性。
- 如果不同日志中的两个条目具有相同的索引和term，那么它们存储的是同一个命令。
- 如果不同日志中的两个条目具有相同的索引和term，那么在前面的所有条目中，日志是相同的。

当发送AppendEntries RPC时，leader包括紧接在新条目之前的条目的term号和索引。如果follower在自己的日志中找不到与该条目匹配的条目，它就会拒绝附加新条目的请求。

这种一致性检查可以让leader得出这样的结论：每当AppendEntries从follower成功返回时，它们的日志都是相同的，直到RPC中包含的索引。

但是在面对leader崩溃的情况下，leader和follower的日志可能会变得不一致。

>  在Raft中，leader通过强制follower的日志复制自己的日志来处理不一致的情况。这意味着，follower日志中的冲突条目将被leader日志中的条目覆盖。
>

leader试图找到其日志与follower日志相匹配的最后一个索引，删除多余的条目（如果有），并添加新的条目。

> leader为每个follower维护一个nextIndex，它是leader将发送给该follower的下一个日志条目的索引。当leader第一次上电时，它将所有的 nextIndex 值初始化为其日志中最后一条后的索引。

每当AppendRPC返回一个follower失败时，leader就会递减nextIndex，并发出另一个AppendEntries RPC。最终，nextIndex会达到一个值，在这个值上，日志会趋于一致。当这种情况发生时，AppendEntries将会成功，它可以从leader的日志中删除无关的条目（如果有的话），并添加新的条目（如果有的话）。因此，从一个follower成功的AppendEntries可以保证leader的日志与它一致。

> 通过这种机制，leader在上电时不需要采取任何特殊的操作来恢复日志一致性。它只需开始正常的操作，日志就会自动收敛，以应对Append-Entries一致性检查的失败。leader从不覆盖或删除自己日志中的条目。



## 安全性

Raft确保一个term的leader在其日志中承诺了以前所有term的条目。
Raft确保一个term的leader在其日志中已经提交了以前所有term的条目。这是为了确保所有的日志是一致的，并且状态机执行相同的命令集。

在leader选举期间，RequestVote RPC包含了candidate的日志信息。如果投票者发现它的日志比candidate的更新，它就不会投给它。

Raft 通过比较两个日志中最后条目的索引和term来确定哪个日志更及时。如果日志的最后条目有不同的term，那么term较晚的日志更及时。如果两个日志的最后条目有相同的term，那么哪个日志更长，哪个日志就更最新。



## 集群成员

为了使配置变更机制安全，在过渡期间必须没有任何一点可以让两个leader在同一term内当选。不幸的是，任何服务器直接从旧配置切换到新配置的方法都是不安全的。
Raft使用了一个两阶段的方法来改变集群成员。首先，它切换到一个称为联合共识的中间配置。然后，一旦这一点被满足，它就会切换到新的配置。

联合共识允许各个服务器在不同的时间在配置之间转换，而不影响安全。此外，联合共识还允许集群在整个配置变化过程中继续服务于client请求。
联合共识将新旧配置结合起来，具体如下。

- 日志条目被复制到两个配置中的所有服务器上。
- 任何新旧服务器都可以成为leader。
- 协议要求新老组合分别获得多数票。

当leader收到配置变更消息时，它会存储并复制加入共识`C<old，new>`的条目。服务器总是使用其日志中的最新配置来做决策，即使它没有被提交。当联合共识被提交时，只有日志中含有`C<old，new>`的服务器才能成为leader。

现在，leader可以安全地创建一个描述`C<new>`的日志条目，并将其复制到集群中。同样，这个配置一旦被看到，就会在每个服务器上生效。当新配置在`C<new>`的规则下提交后，旧配置就无关紧要了，不在新配置中的服务器可以被关闭。



## 图解

见[Raft协议图解](http://thesecretlivesofdata.com/raft/)

