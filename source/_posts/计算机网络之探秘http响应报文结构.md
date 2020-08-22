---
title: 探秘http响应报文结构
date: 2015-11-16 15:52:39
tags:
  - HTTP/HTTPS
  - Web
categories: 计算机网络


---

HTTP响应报文通过通信双方建立的TCP连接传送，传送完成后根据HTTP协议中的Connection字段确定是否要继续保持TCP连接。HTTP 响应报文由状态行、响应头部 和 响应包体 3 个部分组成，如下图所示：





<!--more-->

### 实例

以访问www.baidu.com为例，我们可以<kbd>⌥</kbd> +<kbd>⌘</kbd> +<kbd>j</kbd>打开Chrome Dev Tools来看一个实例。

、



展开Response Headers选项，我们得到了响应报文。

```http
HTTP/1.1 200 OK
Bdpagetype: 2
Bdqid: 0xb8a2e3a70000a2ab
Cache-Control: private
Connection: Keep-Alive
Content-Encoding: gzip
Content-Type: text/html;charset=utf-8
Date: Mon, 01 Oct 2018 08:11:18 GMT
Expires: Mon, 01 Oct 2018 08:11:17 GMT
Server: BWS/1.1
Set-Cookie: BDSVRTM=171; path=/
Set-Cookie: BD_HOME=1; path=/
Set-Cookie: H_PS_PSSID=xxxxxxxx; path=/; domain=.baidu.com
Strict-Transport-Security: max-age=172800
X-Ua-Compatible: IE=Edge,chrome=1
Transfer-Encoding: chunked

<!DOCTYPE html>
<html>
...
</html>
```

从上而下分别是有三个部分：状态行，响应头部和响应包体。

### HTTP响应状态行

状态行由协议版本 响应码 和响应描述组成

#### 响应码

根据客户端的HTTP请求，会产生不同的HTTP响应状态，这些状态用状态码来表示。

按照分类，响应大概分为以下几大类：

| 状态码 | 响应类别                         | 原因短语                         |
| ------ | -------------------------------- | -------------------------------- |
| 1XX    | 信息性状态码（Informational）    | 服务器正在处理请求               |
| 2XX    | 成功状态码（Success）            | 请求已正常处理完毕               |
| 3XX    | 重定向状态码（Redirection）      | 需要进行额外操作以完成请求       |
| 4XX    | 客户端错误状态码（Client Error） | 客户端原因导致服务器无法处理请求 |
| 5XX    | 服务器错误状态码（Server Error） | 服务器原因导致处理请求出错       |

常用的状态码有200，204，207，301，302，303，304，307，400，401，403，404，500，503这些

- 200 OK 表示请求被服务器正常处理
- 204 No Content 表示请求已成功处理，但是没有内容返回
- 206 Partial Content 表示服务器已经完成了部分GET请求
- 301 Moved Permanently 永久重定向，表示请求的资源已经永久的搬到了其他位置
- 302 Found 临时重定向，表示请求的资源临时搬到了其他位置
- 303 See Other 表示请求资源存在另一个URI，应使用GET定向获取请求资源
- 304 Not Modified 表示客户端发送附带条件的请求（GET方法请求报文中的IF…）时，条件不满足
- 307 Temporary Redirect 临时重定向，和302有着相同含义
- 400 Bad Request 表示请求报文存在语法错误或参数错误，服务器不理解
- 401 Unauthorized 表示发送的请求需要有HTTP认证信息或者是认证失败了
- 403 Forbidden 表示对请求资源的访问被服务器拒绝了
- 404 Not Found 表示服务器找不到请求的资源
- 500 Internal Server Error 表示服务器执行请求的时候出错了
- 503 Service Unavailable 表示服务器超负载或正停机维护，无法处理请求





### HTTP响应头部

响应头部由若干响应头部字段组成，这些字段类似于键值对形式，每个字段占据一行。

#### 常用标准响应头字段

| 字段名                          | 含义                                                         | 示例                                                         |
| ------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **Access-Control-Allow-Origin** | 指定哪些站点可以参与跨站资源共享                             | Access-Control-Allow-Origin: *                               |
| **Accept-Patch**                | 指定服务器支持的补丁文档格式，适用于http的patch方法          | Accept-Patch: text/example;charset=utf-8                     |
| **Accept-Ranges**               | 服务器通过byte serving支持的部分内容范围类型                 | Accept-Ranges: bytes                                         |
| **Age**                         | 对象在代理缓存中暂存的秒数                                   | Age: 1200                                                    |
| **Allow**                       | 设置特定资源的有效行为，适用方法不被允许的http 405错误       | Allow: GET, HEAD                                             |
| **Alt-Svc**                     | 服务器使用"Alt-Svc"（Alternative Servicesde的缩写）头标识资源可以通过不同的网络位置或者不同的网络协议获取 | Alt-Svc: h2="http2.example.com:443"; ma=7200                 |
| **Cache-Control**               | 告诉服务端到客户端所有的缓存机制是否可以缓存这个对象，单位是秒 | Cache-Control: max-age=3600                                  |
| **Connection**                  | 设置当前连接和hop-by-hop协议请求字段列表的控制选项           | Connection: close                                            |
| **Content-Disposition**         | 告诉客户端弹出一个文件下载框，并且可以指定下载文件名         | Content-Disposition: attachment; filename="fname.ext"        |
| **Content-Encoding**            | 设置数据使用的编码类型                                       | Content-Encoding: gzip                                       |
| **Content-Language**            | 为封闭内容设置自然语言或者目标用户语言                       | Content-Language: en                                         |
| **Content-Length**              | 响应体的字节长度                                             | Content-Length: 348                                          |
| **Content-Location**            | 设置返回数据的另一个位置                                     | Content-Location: /index.htm                                 |
| **Content-MD5**                 | 设置基于MD5算法对响应体内容进行Base64二进制编码              | Content-MD5: Q2hlY2sgSW50ZWdyaXR5IQ==                        |
| **Content-Range**               | 标识响应体内容属于完整消息体中的那一部分                     | Content-Range: bytes 21010-47021/47022                       |
| **Content-Type**                | 设置响应体的MIME类型                                         | Content-Type: text/html; charset=utf-8                       |
| **Date**                        | 设置消息发送的日期和时间                                     | Date: Tue, 15 Nov 1996 08:12:31 GMT                          |
| **ETag**                        | 特定版本资源的标识符，通常是消息摘要                         | ETag: "737060cd8c284d8af7ad3082f209582d"                     |
| **Expires**                     | 设置响应体的过期时间                                         | Expires: Thu, 01 Dec 1996 16:00:00 GMT                       |
| **Last-Modified**               | 设置请求对象最后一次的修改日期                               | Last-Modified: Tue, 15 Nov 1994 12:45:26 GMT                 |
| **Link**                        | 设置与其他资源的类型关系                                     | Link: </feed>; rel="alternate"                               |
| **Location**                    | 在重定向中或者创建新资源时使用                               | Location: `http://www.w3.org/pub/WWW/People.html`            |
| **P3P**                         | 以P3P:CP="your_compact_policy"的格式设置支持P3P(Platform for Privacy Preferences Project)策略，<br />大部分浏览器没有完全支持P3P策略，许多站点设置假的策略内容欺骗支持P3P策略的浏览器以获取第三方cookie的授权 | P3P: CP="This is not a P3P policy! See `http://www.google.com/support/accounts/bin/answer.py?hl=en&answer=151657` for more info." |
| **Pragma**                      | 设置特殊实现字段，可能会对请求响应链有多种影响               | Pragma: no-cache                                             |
| **Proxy-Authenticate**          | 设置访问代理的请求权限                                       | Proxy-Authenticate: Basic                                    |
| **Public-Key-Pins**             | 设置站点的授权TLS证书                                        | Public-Key-Pins: max-age=2592000; pin-sha256="E9CZ9INDbd+2eRQozYqqbQ2yXLVKB9+xcprMF+44U1g="; |
| **Refresh**                     | 重定向或者新资源创建时使用，在页面的头部有个扩展可以实现相似的功能，并且大部分浏览器都支持<br /><meta http-equiv="refresh" content="5; url=http://example.com/"> | Refresh: 5; url=`http://www.w3.org/pub/WWW/People.html`      |
| **Retry-After**                 | 如果实体暂时不可用，可以设置这个值让客户端重试，可以使用时间段（单位是秒）或者HTTP时间 | Retry-After: 120<br /> Retry-After: Fri, 07 Nov 2014 23:59:59 GMT |
| **Server**                      | 服务器名称                                                   | Server: nginx/1.14.0 (Ubuntu)                                |
| **Set-Cookie**                  | 设置HTTP Cookie                                              | Set-Cookie: UserID=Andy; Max-Age=3600; Version=1             |
| **Status**                      | 设置HTTP响应状态                                             | Status: 200 OK                                               |
| **Strict-Transport-Security**   | 一种HSTS策略通知HTTP客户端缓存HTTPS策略多长时间以及是否应用到子域 | Strict-Transport-Security: max-age=16070400; includeSubDomains |
| **Trailer**                     | 标识给定的header字段将展示在后续的chunked编码的消息中        | Trailer: Max-Forwards                                        |
| **TSV**                         | 在响应中设置给DNT(do-not-track),可能的取值                   | TSV: N                                                       |
| **Upgrade**                     | 请求客户端升级协议                                           | Upgrade: HTTP/2.0, HTTPS/1.3, IRC/6.9, RTA/x11, websocket    |
| **Vary**                        | 通知下级代理如何匹配未来的请求头已让其决定缓存的响应是否可用而不是重新从源主机请求新的 | Vary: Accept-Language                                        |
| **Warning**                     | 实体可能会发生的问题的通用警告                               | Warning: 199 Miscellaneous warning                           |
| **WWW-Authenticate**            | 标识访问请求实体的身份验证方案                               | WWW-Authenticate: Basic                                      |
| **X-Frame-Options**             | 点击劫持保护：<br />deny 不渲染<br />sameorigin **如果源不匹配不渲染**<br />allow-from 允许指定位置访问<br />allowall 不标准，允许任意位置访问 | X-Frame-Options: deny                                        |

#### 常用非标准响应头字段

| 字段名                            | 含义                                                         | 示例                                                         |
| --------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| **X-XSS-Protection**              | 过滤跨站脚本                                                 | X-XSS-Protection: 1; mode=block                              |
| **Content-Security-Policy**       | 定义内容安全策略                                             |                                                              |
| **X-Content-Security-Policy**     | 定义内容安全策略                                             |                                                              |
| **X-WebKit-CSP**                  | 定义内容安全策略                                             | X-WebKit-CSP: default-src 'self'                             |
| **X-Content-Type-Options**        | 唯一的取值是"",阻止IE在响应中嗅探定义的内容格式以外的其他MIME格式 | X-Content-Type-Options: nosniff                              |
| **X-Powered-By**                  | 指定支持web应用的技术                                        | X-Powered-By: PHP/5.4.0                                      |
| **X-UA-Compatible**               | 推荐首选的渲染引擎来展示内容，通常向后兼容，也用于激活IE中内嵌chrome框架插件<br /><meta http-equiv="X-UA-Compatible" content="chrome=1" /> | X-UA-Compatible: IE=EmulateIE7<br/> X-UA-Compatible: IE=edge
 X-UA-Compatible: Chrome=1 |
| **X-Content-Duration**            | 提供音视频的持续时间，单位是秒，只有Gecko内核浏览器支持      | X-Content-Duration: 42.666                                   |
| **Upgrade-Insecure-Requests**     | 标识服务器是否可以处理HTTPS协议                              | Upgrade-Insecure-Requests: 1                                 |
| **X-Request-ID,X-Correlation-ID** | 标识一个客户端和服务端的请求                                 | X-Request-ID: f058ebd6-02f7-4d3f-942e-904344e8cde5           |

### HTTP 响应包体

响应包体包含HTTP响应所返回的数据，其数据类型由响应头部中的[Content-Type字段](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Content-Type)指定。

例如响应一个js资源

```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
cache-control: no-cache
Content-Security-Policy: script-src 'self' blob: filesystem: chrome-extension-resource:; object-src 'self' blob: filesystem:;
Content-Type: text/javascript
ETag: "xx+STUs6bw="

define(["core/Logger"],function(t){var i,n={settings:[300,60,10],NOTIFICATION_TTL:5e3,initAPI:function(t){i=t,i.mixin("Notification",{get:this.get.bind(this),saveSettings:this.saveSettings.bind(this)})},init:function(t){this.loadSettings(),"function"==typeof t&&t()},get:function(){return this.settings},show:function(t){var n="",e="",o=0,s=this;"nuclear"===t?(o=i.NuclearOption.getSecondsUntilActive(),n="common/img/eye_48x48_nuclear.png",e=i.Chrome.Translation.get("nuclearNotification")||"The Nuclear Option will start blocking sites in"):"block"===t&&(o=i.StayFocusd.getTotalSecondsRemaining(),n="common/img/eye_48x48_red.png",e=i.Chrome.Translation.get("blockNotification")||"StayFocusd will start blocking your Blocked Sites in"),e+=o>60?" "+i.Date.secondsToMinsAndSecs(o):" "+o+" seconds";var c={type:"basic",title:"StayFocusd",iconUrl:n,message:e};i.Chrome.Notification.create("",c,function(t){setTimeout(function(){i.Chrome.Notification.clear(t,function(){})},s.NOTIFICATION_TTL)})},isset:function(t){return this.settings.inArray(t)},saveSettings:function(t){this.settings=t,i.Settings.set({notificationSettings:t})},loadSettings:function(){var t=i.Settings.get("notificationSettings");t&&(this.settings=t)}};return n});
```



### 总结

HTTP响应报文的控制信息保存在HTTP响应状态行和响应头部，数据则被保存在包体中。