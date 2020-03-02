---
title: 探秘http请求报文结构
date: 2015-11-16 18:55:07
tags:
  - HTTP/HTTPS
  - Web
categories: 计算机网络
thumbnail: https://ws1.sinaimg.cn/large/006tNbRwgy1fwe5hshem2j30wc0k0gri.jpg
---

HTTP请求报文由客户端发出，在发送报文之前要先与服务器建立TCP连接，如果使用HTTPS协议还需要建立TLS/SSL加密隧道连接，HTTP请求报文是由三部分组成: **请求行**, **请求报头**和**请求正文**。

![http请求报文](https://ws2.sinaimg.cn/large/006tNc79gy1fvrvownevsj30bv0470su.jpg)

<!--more-->

### 实例

举个例子，下面是对www.google.com发出的请求报文。我们可以在Google Dev Tools中查看。

```http
GET / HTTP/1.2
accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8
accept-encoding: gzip, deflate, br
accept-language: zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-TW;q=0.6
cache-control: no-cache
cookie: OTZ=4569705_24_24__24_; _ga=GA1.1.1839148291.1537105919; HSID=AOuQZEx7qIgKNr4Gg; SSID=sdsdfgGFWWA...
dnt: 1
pragma: no-cache
upgrade-insecure-requests: 1
user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.81 Safari/537.36
```



### HTTP请求行

请求行标示请求方法、请求资源相对地址和HTTP协议版本

#### 常用的请求方法

| 请求方法 | 含义                                                         |
| -------- | ------------------------------------------------------------ |
| GET      | GET方法请求一个指定资源的表示形式. 使用GET的请求应该只被用于获取数据. |
| POST     | POST方法用于将实体提交到指定的资源，通常导致状态或服务器上的副作用的更改. |
| PUT      | PUT方法用请求有效载荷替换目标资源的所有当前表示。            |
| DELETE   | DELETE方法删除指定的资源。                                   |
| HEAD     | HEAD方法请求一个与GET请求的响应相同的响应，但没有响应体.     |
| CONNECT  | CONNECT方法建立一个到由目标资源标识的服务器的隧道。          |
| OPTIONS  | OPTIONS方法用于描述目标资源的通信选项。                      |
| TRACE    | TRACE方法沿着到目标资源的路径执行一个消息环回测试。          |
| PATCH    | PATCH方法用于对资源应用部分修改。                            |



### HTTP请求报头

包含请求的附加信息和客户端的标识信息。

#### 常用标准请求头字段：

| 字段                    | 含义                                                         | 示例                                                         |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **Accept**              | 设置接受的内容类型                                           | Accept: text/plain                                           |
| **Accept-Charset**      | 设置接受的字符编码                                           | Accept-Charset: utf-8                                        |
| **Accept-Encoding**     | 设置接受的编码格式                                           | Accept-Encoding: gzip, deflate                               |
| **Accept-Datetime**     | 设置接受的版本时间                                           | Accept-Datetime: Thu, 31 May 2007 20:35:00 GMT               |
| **Accept-Language**     | 设置接受的语言                                               | Accept-Language: en-US                                       |
| **Authorization**       | 设置HTTP身份验证的凭证                                       | Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==            |
| **Cache-Control**       | 设置请求响应链上所有的缓存机制必须遵守的指令                 | Cache-Control: no-cache                                      |
| **Connection**          | 设置当前连接和hop-by-hop协议请求字段列表的控制选项           | Connection: keep-alive<br />Connection: Upgrade              |
| **Content-Length**      | 设置请求体的字节长度                                         | Content-Length: 348                                          |
| **Content-MD5**         | 设置基于MD5算法对请求体内容进行Base64二进制编码              | Content-MD5: Q2hlY2sgSW50ZWdyaXR5IQ==                        |
| **Content-Type**        | 设置请求体的MIME类型（适用POST和PUT请求）                    | Content-Type: application/x-www-form-urlencoded              |
| **Cookie**              | 设置服务器使用Set-Cookie发送的http cookie                    | Cookie: $Version=1; Skin=new;                                |
| **Date**                | 设置消息发送的日期和时间                                     | Date: Tue, 15 Nov 1994 08:12:31 GMT                          |
| **Expect**              | 标识客户端需要的特殊浏览器行为                               | Expect: 100-continue                                         |
| **Forwarded**           | 披露客户端通过http代理连接web服务的源信息                    | Forwarded: for=192.0.2.60;proto=http;by=203.0.113.43 <br />Forwarded: for=192.0.2.43, for=198.51.100.17 |
| **From**                | 设置发送请求的用户的email地址                                | From: [user@example.com](https://link.jianshu.com/?t=mailto:user@example.com) |
| **Host**                | 设置服务器域名和TCP端口号，如果使用的是服务请求标准端口号，端口号可以省略 | Host: en.wikipedia.org:8080<br/>Host: en.wikipedia.org       |
| **If-Match**            | 设置客户端的ETag,当时客户端ETag和服务器生成的ETag一致才执行，适用于更新自从上次更新之后没有改变的资源 | If-Match: "737060cd8c284d8af7ad3082f209582d                  |
| **If-Modified-Since**   | 设置更新时间，从更新时间到服务端接受请求这段时间内如果资源没有改变，允许服务端返回304 Not Modified | If-Modified-Since: Sat, 29 Oct 1994 19:43:31 GMT             |
| **If-None-Match**       | 设置客户端ETag，如果和服务端接受请求生成的ETage相同，允许服务端返回304 Not Modified | If-None-Match: "737060cd8c284d8af7ad3082f209582d"            |
| **If-Range**            | 设置客户端ETag，如果和服务端接受请求生成的ETage相同，返回缺失的实体部分；否则返回整个新的实体 | If-Range: "737060cd8c284d8af7ad3082f209582d"                 |
| **If-Unmodified-Since** | 设置更新时间，只有从更新时间到服务端接受请求这段时间内实体没有改变，服务端才会发送响应 | If-Unmodified-Since: Sat, 29 Oct 1994 19:43:31 GMT           |
| **Max-Forwards**        | 限制代理或网关转发消息的次数                                 | Max-Forwards: 10                                             |
| **Origin**              | 标识跨域资源请求（请求服务端设置Access-Control-Allow-Origin响应字段） | Origin: `http://www.example-social-network.com`              |
| **Pragma**              | 设置特殊实现字段，可能会对请求响应链有多种影响               | Pragma: no-cache                                             |
| **Proxy-Authorization** | 为连接代理授权认证信息                                       | Proxy-Authorization: Basic QWxhZGRpbjpvcGVuIHNlc2FtZQ==      |
| **Range**               | 请求部分实体，设置请求实体的字节数范围，具体可以参见HTTP/1.1中的Byte serving | Range: bytes=500-999                                         |
| **Referer**             | 设置前一个页面的地址，并且前一个页面中的连接指向当前请求，意思就是如果当前请求是在A页面中发送的，那么referer就是A页面的url地址 | Referer: `http://en.wikipedia.org/wiki/Main_Page`            |
| **TE**                  | 设置用户代理期望接受的传输编码格式，和响应头中的Transfer-Encoding字段一样 | TE: trailers, deflate                                        |
| **Upgrade**             | 请求服务端升级协议                                           | Upgrade: HTTP/2.0, HTTPS/1.3, IRC/6.9, RTA/x11, websocket    |
| **User-Agent**          | 用户代理的字符串值                                           | User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.81 Safari/537.36 |
| **Via**                 | 通知服务器代理请求                                           | Via: 1.0 fred, 1.1 example.com (Apache/1.1)                  |
| **Warning**             | 实体可能会发生的问题的通用警告                               | Warning: 199 Miscellaneous warning                           |



#### 常用非标准请求头字段

| 字段                                      | 含义                                                         | 示例                                                         |
| ----------------------------------------- | ------------------------------------------------------------ | :----------------------------------------------------------- |
| **X-Requested-With**                      | 标识Ajax请求，大部分js框架发送请求时都会设置它为XMLHttpRequest | X-Requested-With: XMLHttpRequest                             |
| **DNT**                                   | 请求web应用禁用用户追踪                                      | DNT: 1 (Do Not Track Enabled) <br />DNT: 0 (Do Not Track Disabled) |
| **X-Forwarded-For**                       | 一个事实标准，用来标识客户端通过HTTP代理或者负载均衡器连接的web服务器的原始IP地址 | X-Forwarded-For: client1, proxy1, proxy2<br/>X-Forwarded-For: 129.78.138.66, 129.78.64.103 |
| **X-Forwarded-Host**                      | 一个事实标准，用来标识客户端在HTTP请求头中请求的原始host,因为主机名或者反向代理的端口可能与处理请求的原始服务器不同 | X-Forwarded-Host: en.wikipedia.org:8080<br/>X-Forwarded-Host: en.wikipedia.org |
| **X-Forwarded-Proto**                     | 一个事实标准，用来标识HTTP原始协议，因为反向代理或者负载均衡器和web服务器可能使用http,但是请求到反向代理使用的是https | X-Forwarded-Proto: https                                     |
| **Front-End-Https**                       | 微软应用程序和负载均衡器使用的非标准header字段               | Front-End-Https: on                                          |
| **X-Http-Method-Override**                | 请求web应用时，使用header字段中给定的方法（通常是put或者delete）覆盖请求中指定的方法（通常是post）,<br />如果用户代理或者防火墙不支持直接使用put或者delete方法发送请求时，可以使用这个字段 | X-HTTP-Method-Override: DELETE                               |
| **X-ATT-DeviceId**                        | 允许更简单的解析用户代理在AT&T设备上的MakeModel/Firmware     | X-Att-Deviceid: GT-P7320/P7320XXLPG                          |
| **X-Wap-Profile**                         | 设置描述当前连接设备的详细信息的xml文件在网络中的位置        | x-wap-profile: `http://wap.samsungmobile.com/uaprof/SGH-I777.xml` |
| **Proxy-Connection**                      | 早起HTTP版本中的一个误称，现在使用标准的connection字段       | Proxy-Connection: keep-alive                                 |
| **X-UIDH**                                | 服务端深度包检测插入的一个唯一ID标识Verizon Wireless的客户   | X-UIDH: ...                                                  |
| **X-Csrf-Token,X-CSRFToken,X-XSRF-TOKEN** | 防止跨站请求伪造                                             | X-Csrf-Token: i8XNjC4b8KVok4uw5RftR38Wgp2BFwql               |
| **X-Request-ID,X-Correlation-ID**         | 标识客户端和服务端的HTTP请求                                 | X-Request-ID: f058ebd6-02f7-4d3f-942e-904344e8cde5           |



### HTTP请求正文

当使用POST, PUT等方法时，需要客户端向服务器传递参数。这些数据就储存在请求正文中。在请求报头中有一些与请求正文相关的信息。

例如: 现在的Web应用通常采用Restful架构，请求的数据格式一般为json。这时就需要设置Content-Type: application/json。