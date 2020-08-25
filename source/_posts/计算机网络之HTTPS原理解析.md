---
title: HTTPS原理解析
categories: 计算机网络
comments: false
date: 2016-11-03 13:41:36
tags:
  - HTTP/HTTPS
thumbnail: https://i.loli.net/2020/08/23/9atUIiAXMWK4dgZ.jpg
---

HTTP协议是明文传输，它简单易于理解，但同时也带来了安全性问题，在复杂的网络环境中，HTTP流量几乎是在裸奔，可以轻易被监听，为了解决这个问题，人们提出了HTTP over SSL即HTTPS，即通过ssl隧道来传输HTTP流量，这样加密了HTTP数据包，实现了传输链路上的安全性。相比于HTTP，HTTPS在TCP层上多了一个SSL/TLS层。

![img](http://blog.upyun.com/wp-content/uploads/2017/03/httpvshttps.png)





## HTTPS的通信过程

### SSL/TLS

> SSL（Secure Socket Layer，安全套接字层）：1994年为 Netscape 所研发，SSL 协议位于 TCP/IP 协议与各种应用层协议之间，为数据通讯提供安全支持。
>
> TLS（Transport Layer Security，传输层安全）：其前身是 SSL，它最初的几个版本（SSL 1.0、SSL 2.0、SSL 3.0）由网景公司开发，1999 年从 3.1 开始被 IETF 标准化并改名，发展至今已经有 TLS 1.0、TLS 1.1、TLS 1.2 三个版本。SSL3.0 和 TLS1.0 由于存在安全漏洞，已经很少被使用到。TLS 1.3 改动会比较大，目前还在草案阶段，目前使用最广泛的是 TLS 1.1、TLS 1.2。

可以简单认为SSL与TLS是描述的同一种协议，本文中不做区分，SSL/TLS是为了在TCP连接上添加一个加密隧道来加密通信流量，可以确保通信流量安全无法解密。

### 图解

由于HTTPS的TLS层是在TCP上的，所以与HTTP一样，在建立TLS连接之前必须先TCP三次握手

HTTPS的通信过程可以由下图简单表示。



### 步骤详解

#### 0x01 ClientHello

1. ClientHello。 首先https请求是基于http的，也就是基于tcp的，所以先得建立tcp三次握手，这个就不说了，然后tcp握手后是SSL层的握手，也就是图中的ClientHello消息，client发送本地最新的TLS版本、算法组合的一个集合和其他很多辅助的信息，并且生成一个随机数A。



   ![img](https:////upload-images.jianshu.io/upload_images/2000804-900ab967d4c437d5.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1000)

   ClientHello.png

   可以看到随机数（

   ```
   Random
   ```

   ）是一个GMT UNIX时间加上一串随机字节，算法组合（

   ```
   Cipher Suite
   ```

   ）有26种。还有ClientHello并不是我随便叫叫的，真的叫ClientHello😢......

2. ServerHello。Server收到这些信息后比对自己的TLS版本，选择其中低的一个作为返回，并且从算法组合的集合中选出一种合适的组合，然后同样也生成一个随机数B，一起打包到ServerHello中传回给Client。内容如图（`ServerHello.png`）：



   ![img](https:////upload-images.jianshu.io/upload_images/2000804-84e576eff565ee07.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1000)

   ServerHello.png

   同样ServerHello也不是随便叫的，可以看到随机数格式和ClientHello一样，并且这里选出了一种CipherSuite算法组合。

3. Certificatie,ServerHelloDone。服务端在选出沟通策略之后将自己的证书信息告诉Client端（`Certificate`），通知Client关于秘钥更新的信息（`ServerkeyExchange`），接下去就看你的了，并且表示该发的都发给你了，我的Hello结束了（`ServerHelloDone`）。



   ![img](https:////upload-images.jianshu.io/upload_images/2000804-d472cf46f4216b0b.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1000)

   Certificate-ServerHelloDone.png

4. Client收到2，3步的信息后先验证证书是不是合法的，包括它的颁发机构，域名匹配，有限期限等，这个具体的过程就不探究了，只要知道这些步骤就行了。

5. 证书验证通过之后，生成随机数C1,然后用证书内容中的公钥通过服务器选择的非对称加密算法加密，得出为C2。

6. 由之前的三个随机数A、B、C1通过一个伪随机函数再生成一个D，**注意！这个是最终http真正使用的加密秘钥！！！**。

7. 由D再次通过伪随机函数生成一个秘钥组，包含6个秘钥，假设为P1,P2,P3,P4,P5,P6。

8. ClientKeyExchange。通知Server秘钥相关的信息，发送第5步中算出的C2给Server端。

9. Client端发送ClientKeyExchange之后，计算之前所有与Server端交互消息的hash值，假设为client_hash1，用步骤7中得到的其中一个P1进行加密，结果为E。

10. Server端收到C2后用私钥结合非对称算法解密C2，得到C1。

11. 同样的Server端也根据A、B、C1由伪随机函数生成D(**最终的加密秘钥！！！**),再由D得出秘组钥（P1-P6），因为这里涉及到的算法都是一样的，所以得出的秘钥也是一样的。

12. Server端计算之前所有和Client端交互消息的hash值，假设为server_hash2，大家可能发现了，11、12跟Client端的6、7、9过程一致，只是少了9中的P1加密过程。

13. 这个时候Client端会发送ChangeCipherSpec消息和EncryptedHandshakeMessage消息，通知Server端接下去使用选定的加密策略来通信了，并且将第9步中的E传给了Server。（这里几个步骤的顺序只是为了好理解一点而这样排列，实际两条线是独立在处理信息的，所以先后顺序不能保证）

14. 这个时候Client会再次计算之前握手消息的hash值，得出结果client_hash2。

15. Server在收到EncryptedHandshakeMessage消息带过来的E之后，利用步骤11中的P1解密E，由于加密算法和P1都是相同的，所以这里还原出了client_hash1，然后与步骤12中的server_hash2比对，如果一样说明之前的几条协商秘钥的消息都被对方正确无误的理解了。

16. Server端再次对之前的消息做hash值，得出server_hash2，用P2进行加密结果为F，然后通过ChangeCipherSpec-EncryptedHandshakeMessage消息传给Client端。

17. Client收到Server的消息后根据P2解密F还原得出server_hash2，与client_hash2比对如果一致，则认为之前的交互过程都是正确无误且被对方理解的。至此，整个握手过程就结束了，之后的http数据报就会被之前确定的加密策略和加密秘钥D进行加密传输了。



