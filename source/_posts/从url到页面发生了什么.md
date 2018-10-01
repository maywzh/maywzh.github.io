---
title: 从url到页面发生了什么
date: 2018-06-14 17:46:51
tags:
  - dns
  - Web架构
categories: 前端
---

## 访问过程

我们在浏览器地址栏中输入google.com这个地址，然后浏览器经过短暂加载后给我们呈现了Google的搜索页面。

![image-google](https://ws3.sinaimg.cn/large/006tNc79gy1fvrpt45bfsj30hi08774m.jpg)

这中间的步骤有哪些呢？

<!--more-->

1. 首先是域名解析 google.com 转换为这个网站服务器的IP，这其中或许还包含有CDN加速、负载均衡，分布式服务等技术。

2. 获取到服务器IP之后，我们的浏览器会通过TCP三次握手与服务器建立TCP连接。

   - 如果网站是HTTPS，还会经过TLS/SSL的握手步骤与服务器建立TLS/SSL连接。

3. 建立TCP连接之后，浏览器作为客户端发送HTTP请求(request)报文到目的IP地址即Web服务器IP。
4. 有的时候获取的IP是反向代理的服务器IP，这些服务器接受客户端请求，并把请求转发给真实服务器IP。

5. 接下来是服务器的工作过程：

   - 服务器上Google.com服务进程监听服务端口，收到客户端的HTTP请求报文，这个报文被服务器上安装的Web服务器(Web Server)如apache、nginx、LigHTTPd、IIS所监听到。
   - Web Server解析HTTP请求报文，根据路由配置去访问特定位置的资源或委托给服务器上的处理请求的程序进行处理，如CGI脚本、JSP、ASP、servlets、node.js等。
   - Web App把响应数据交给Web Server，Web Server按照HTTP响应报文格式封装数据为HTTP响应(response)报文，并把报文通过TCP连接链路回送给客户端。

6. 客户端浏览器接受到HTTP响应报文，从数据部分提取出html代码，通过加载、解析、渲染的过程，来在屏幕上绘制出页面。




## URL 格式探秘

URL(Uniform Resource Locator, 统一资源定位符)，互联网设计为一个大的文件系统，就像是我们电脑中每个文件都有对应的文件地址，互联网上的资源地址就是URL。其格式为

> protocol://<hostname>:<port>/<route>/<filename>

- 协议(protocol)常见的有HTTP，HTTPS，ftp，telnet，file等几种。这些协议都属于应用协议，位于协议层的应用层，它们基于传输层的协议而工作，例如HTTP基于TCP，HTTPS基于TLS/SSL，TLS/SSL也是基于TCP传输协议。

- 主机名(hostname)代表一个提供服务的服务器IP，它可以是IP或者可以解析为IP的网址。

- 端口号(port)代表服务器的一个服务进程，这个进程监听这个端口上的TCP或UDP数据报。一台主机往往提供多个服务，例如既提供Web服务也提供FTP服务，那么端口就可以告诉web服务器所在主机把请求交给哪一个服务。各个协议都有默认（缺省）的端口。

- 路径(route)代表一个服务下的资源的路径，例如`https://myblog.com/blog/2017/index.html`中的/`blog/2017`代表2017年的所有博客，返回的资源取决于后端服务器的实现。

- 文件名(filename)代表某个特定的资源，例如`https://myblog.com/blog/2017/index.html`的`index.html`代表这个特定的页面。

## IP地址

就像每栋房子都有地址，IP代表一个计算机或者局域网在互联网上的地址。IP协议如今已有IPv4和IPv6，目前依旧是IPv4占据主流，但IPv6是未来的趋势。IPv4协议中，存在公网地址不足的问题，所以人们发明了NAT技术把一个局域网地址映射为一个公网地址(局域网网关地址)。局域网内的主机要提供互联网服务必须利用端口映射把该主机上的服务端口映射到局域网网关的端口。

但IP地址不易辨识，所以人们用网站域名来作为IP地址的别名，从IP地址到域名或从域名到IP地址的映射过程称为DNS解析。



## DNS解析

### DNS解析过程

在浏览器地址栏输入url之后，电脑会发出一个DNS解析请求到本地DNS服务器。然后按照以下步骤依次查找：

1. 查找浏览器缓存

   浏览器检查缓存是否有未过期的该域名解析过的IP地址，如果有，那么解析过程成功结束。

![image-浏览器dns缓存](https://ws1.sinaimg.cn/large/006tNc79gy1fvrtgzyqoej30lx05x0u4.jpg)

<center>▲ chrome的浏览器缓存示例</center>

2. 查找操作系统缓存

   如果浏览器dns缓存不存在或已过期，那么浏览器会从hosts文件中查找，查找是否有对应的域名dns配置项。

3. 查找路由器缓存

   如果系统缓存也没有，那么去路由器的dns缓存中查找。

4. 网络接入服务商(ISP)DNS缓存

   ISP都会提供DNS缓存服务器。我们也可以在网络配置中配置特定的DNS服务器。



   ![image-本地网络设置](https://ws3.sinaimg.cn/large/006tNc79gy1fvrtc3x58pj310w0uytb3.jpg)

   如果是局域网内的主机，这个本地DNS服务器一般是局域网的网关。网关会把DNS解析请求转发给ISP DNS服务器。

5. 递归查询

   经历了如上步骤都找不到DNS服务器的话，那么就会直接访问互联网的DNS服务器进行递归查询。

   ![5308475-递归查询](https://ws2.sinaimg.cn/large/006tNc79gy1fvrts63y0rg30x00ld0tt.gif)

   假设解析`www.google.com`这个域名，本地dns服务器把dns解析请求转发给互联网的根域名服务器，如果根域名服务器不存在该域名记录，则根据顶级域com向com顶级域dns服务器发送dns请求，如果还没有则根据二级域google.com服务器查询，知道最终得到该域名的IP地址，并把它缓存到本地。

   所以网址的dns解析过程是一个由右向左的解析过程：

   `. --> .com --> google.com --> www.google.com`


### DNS负载均衡

我们也可以在命令行通过nslookup命令来对某个域名进行dns解析获得它的IP地址：

```bash
$ nslookup google.com

Non-authoritative answer:
Name:	baidu.com
Address: 220.181.57.216
Name:	baidu.com
Address: 123.125.115.110
```

可以发现baidu.com这个域名有两个IP地址。这是采用了DNS负载均衡技术。

由于单台服务器的性能有限，现代的大型网络服务往往都是集群服务器提供服务，而这些服务器集群往往有多个IP地址，而DNS可以根据根据每台服务器的负载量，该机器离用户地理位置的距离等来返回一个合适的服务器的IP给用户，这就是DNS的负载均衡也称为DNS重定向。CDN正是采用了这种技术。



## TCP连接

Web服务都是基于HTTP/HTTPS协议提供的，而HTTP/HTTPS协议又是基于传输层的TCP协议的。所以进行HTTP通信前，必须先建立TCP连接，TCP连接是通过三次握手来建立的，通过四次挥手来断开。这里不详细赘述。

### HTTP协议

#### HTTP的无连接

**HTTP协议是无连接的协议**，无连接的意思就是指每次连接只处理一个请求。服务器处理完客户请求，收到应答之后，即断开TCP连接。这种设计是因为客户端与服务端的交换数据时间间隔较大，而且两次传送的数据关联性较低，为了节省TCP连接信道所占据的资源，HTTP协议被设计为**请求时建连接、请求完释放连接，以尽快将资源释放出来服务其他客户端**。但是对于某些情景，例如网页中含有大量引用资源，每次访问引用资源都需要建立一次TCP连接就显得十分低效（TCP的三次握手和四次挥手性能消耗十分严重）。

为了实现持续TCP连接，HTTP协议引入了Keep-Alive字段。**Keep-Alive 功能使客户端到服务器端的连接持续有效，当出现对服务器的后继请求时，Keep-Alive 可以保持客户端与服务端的持续TCP连接**。对于静态网站，这个功能十分有用，但对于动态网站来说，过多的连接会耗尽服务器的连接池，持续占用资源影响性能。所以要谨慎使用Keep-Alive功能。

#### HTTP的无状态

**HTTP协议是无状态的协议**，这是指协议对于事务处理没有记忆能力，服务器不知道客户端中的状态，即我们与服务器的每一次请求响应过程，服务器都不会记录任何信息。每个请求都是独立的。

例如：电商网站中，我们向购物车放一个商品。如果我们没有登陆，那么服务器无法记录购物车里的商品清单，因为它无法分辨究竟是哪个用户的购物车。

为了解决这个问题，HTTP使用了Cookie和Session两种保持HTTP连接状态的技术，我们常见的登陆操作常见的做法就是在本地生成一个状态cookie，然后cookie中保存sessionid，我们每次发送http请求时，服务器读取cookie中的sessionid，在服务端查找持久化的session信息，判断用户的登陆状态，并读取对应的业务信息。

### HTTPS协议

HTTP协议完全是明文传输，直接把明文的HTTP报文通过TCP连接传送到对方，这其中有相当的信息泄漏的风险。为了解决这个问题，网景公司提出了一种新协议HTTPS，即基于SSL协议的HTTP，这是把HTTP报文放在加密的SSL信道中进行通信。SSL后来被标准化为TLS协议，一般称之为TLS/SSL。

HTTPS与HTTP协议不同之处在于，建立TCP连接之后，HTTPS协议还需要再经过[TLS/SSL握手过程](http://www.ruanyifeng.com/blog/2014/09/illustration-ssl.html)，来建立TLS/SSL通道，然后才进行HTTP通信。这也带来了一定的性能损耗。



## 客户端构造HTTP请求报文

获取了目的IP，建立了TCP连接之后，客户端构建HTTP请求报文，通过TCP协议发送到服务器指定端口(HTTP协议默认端口80/8080, HTTPS协议默认端口443)。



## 服务端接受HTTP请求

从这里开始就是服务端的工作了。Web Server监听TCP端口，当端口接收到`HTTPRequest`报文，就对报文进行解析，并封装称为`HTTPRequest`对象，供上层使用。

根据访问的资源，大致可分为静态资源和动态资源，静态资源就是指目录中某个位置中预先生成好的文件，例如myblog/index.html，动态资源则是指会根据请求数据动态生成的页面，例如根据用户权限不同展示的数据统计表。

Web Server从HTTP请求中获取参数后，如果是静态资源，则读取该资源文件，根据HTTP响应报文格式产生HTTP响应，回送给客户端。如果是动态资源，则进行一系列的处理，产生HTTP响应报文。

例如目前主流的后端Web框架是MVC模式。

![image-20180930224832000](https://ws2.sinaimg.cn/large/006tNc79gy1fvrybhq9yij31cg0ygtdh.jpg)

MVC框架首先根据`HTTPRequest`对象的参数、内容，先根据路由配置去选择对应的Controller，Controller根据参数进行业务处理，中间可能会进行读写数据库等操作，然后渲染一个数据模型Model，数据模型用来渲染模版页，这里的工作由模版引擎来完成，最终生成HTTP响应。

假设`myblog.com/blogs/1/edit`是修改`myblog.com`的第一篇博客的接口，那么Router首先对`blogs/1/edit`进行路由匹配，匹配到的`controller`是`edit`，那么调用`edit`这个方法，该方法从`HTTP Request`对象的正文获得了修改后的博文，于是调用数据库引擎，对数据库内的对应博文进行修改。然后返回一个新的博文的json数据，该数据即是数据模型`Model`，然后调用模版引擎，把`Model`渲染到模版页，生成html页面，然后根据html页面产生`HTTPResponse`对象。



## 服务端发出HTTP响应

Web服务器根据`HTTPResponse`对象来产生HTTP响应报文，通过TCP连接回送该报文。然后根据HTTP中的Keep-Alive字段的值确定是否要在响应发送完成后关闭TCP连接。


## 客户端接受HTTP响应报文

浏览器从HTTP响应报文中的数据段提取出html、css、js文件，然后浏览器对这些资源进行渲染，把渲染出来的网页绘制在屏幕上。

浏览器从上而下解析HTML文件，如果解析过程中遇到外部资源，如图像、JS、CSS文件等，则会重复以上HTTP通信过程。这个对外部资源的请求是异步的，所以不会影响资源解析。当解析到JS文件时，HTML文档则会挂起渲染过程，等待JS文件加载完毕和执行完毕。因此JS会阻塞后续资源的下载。JS代码执行前必须保证所有的CSS文件加载完毕。

浏览器解析HTML文件构造DOM树，解析CSS文件构造渲染树，渲染树构建完成后，则开始根据渲染树绘制页面到屏幕上。

