---
title: 探秘http请求报文结构
date: 2015-11-16 18:55:07
tags:
  - http
  - 前端
categories: 计算机网络
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

常见的请求方法有有: GET, POST, PUT, DELETE, OPTIONS, HEAD。

### HTTP请求报头

包含请求的附加信息和客户端的标识信息。

常见的头部字段：

- Accept: 客户端接受什么类型的响应，包含一个或多个[MIME类型](<http://en.wikipedia.org/wiki/MIME_type> )的值
- Accept-Charset 设置接受的字符编码
- Cookie 客户端的Cookie
- Accept-Encoding 设置接受的编码格式
- Accept-Language 设置接受的语言
- Content-Type 设置请求体的MIME类型（适用POST和PUT请求）
- Authorization 设置HTTP身份验证的凭证
- User-Agent 用户代理的字符串值
- Cache-Control 设置请求响应链上所有的缓存机制必须遵守的指令
- Pragma 设置特殊实现字段，可能会对请求响应链有多种影响
- DNT 请求web应用禁用用户追踪

### HTTP请求正文

当使用POST, PUT等方法时，需要客户端向服务器传递参数。这些数据就储存在请求正文中。在请求报头中有一些与请求正文相关的信息，例如: 现在的Web应用通常采用Rest架构，请求的数据格式一般为json。这时就需要设置Content-Type: application/json。
