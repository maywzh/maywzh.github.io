---
title: 从JWT聊聊认证
categories: 计算机网络
comments: false
date: 2017-02-10 19:16:19
tags:
  - Web
thumbnail: https://i.loli.net/2020/08/23/GYoPAlF85x23emQ.jpg
cover: https://i.loli.net/2020/08/23/GYoPAlF85x23emQ.jpg
---

**跨域认证**意指把A服务的认证状态可分享给B服务，这样单服务的Session+cookie的解决方案就不合适了。我们可以通过服务端搭建session持久化层来解决这个问题，该层由多个服务共享，这种方式对持久化层的稳定性要求较高。另一种方式是把认证数据保存在客户端。其中一种方式就是**Json Web Tokens**(JWT)。

<!--more-->

## 原理

JWT是初次认证时，服务器把认证信息生成一个Json文本，回送给用户。

```json
{
  "name": "andy",
  "authority": "admin",
  "expire": "201807010000000"
}
```

往后用户与服务端通信的时候，都要发回这个 JSON 对象。服务器根据该对象来进行用户身份确认。服务器会在生成该对象时加上签名。

## 结构

JWT 由三个部分组成。

```json
Header.Payload.Signature
头部.负载.签名
例：eyJhbGciOijIfdkKjf3mJKL.ejkajEgjkdesdIlk8HJKH9jKyh9jkh9hgty8k.4342kldffjklauyx9jh
```

它是一个很长的字符串，中间用点（`.`）分隔成三个部分。JWT 内部无换行。





### Header

Header 部分是一个 JSON 对象，描述 JWT 的元数据，通常是下面的样子。

```javascript
{
  "alg": "HS256",
  "typ": "JWT"
}
```

上面代码中，`alg`属性表示签名的算法（algorithm），默认是 HMAC SHA256（写成 HS256）；`typ`属性表示这个令牌（token）的类型（type），JWT 令牌统一写为`JWT`。

最后，将上面的 JSON 对象使用 Base64URL 算法（详见后文）转成字符串。

### Payload

Payload 部分也是一个 JSON 对象，用来存放实际需要传递的数据。JWT 规定了7个官方字段，供选用。

- iss (issuer)：签发人
- exp (expiration time)：过期时间
- sub (subject)：主题
- aud (audience)：受众
- nbf (Not Before)：生效时间
- iat (Issued At)：签发时间
- jti (JWT ID)：编号

也可以自定义字段

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "admin": true
}
```

这个 JSON 对象也要使用 Base64URL 算法转成字符串。

### Signature

为了防止用户篡改token，需要签名字段Signature。

把服务器的密钥secret作为参数传递到签名算法里面，按照如下公式进行加密。

```javascript
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  secret)
```

算出签名以后，把 Header、Payload、Signature 三个部分拼成一个字符串，每个部分之间用"点"（`.`）分隔，就可以返回给用户。



## 使用方式

客户端收到服务器返回的 JWT，可以存放在Cookie中，也可以存放在http请求的Authorization头部字段中，这样可以跨域认证。

```http
GET / HTTP/1.2
...
Authorization: Bearer <token>
...
```

也可以放在 POST 请求的数据体里面。

## 

## 特点

（1）JWT 默认是不加密，但也是可以加密的。生成原始 Token 以后，可以用密钥再加密一次。

（2）JWT 不加密的情况下，不能将秘密数据写入 JWT。

（3）JWT 不仅可以用于认证，也可以用于交换信息。有效使用 JWT，可以降低服务器查询数据库的次数。

（4）JWT 的最大缺点是，由于服务器不保存 session 状态，因此无法在使用过程中废止某个 token，或者更改 token 的权限。也就是说，一旦 JWT 签发了，在到期之前就会始终有效，除非服务器部署额外的逻辑。

（5）JWT 本身包含了认证信息，一旦泄露，任何人都可以获得该令牌的所有权限。为了减少盗用，JWT 的有效期应该设置得比较短。对于一些比较重要的权限，使用时应该再次对用户进行认证。

（6）为了减少盗用，JWT 不应该使用 HTTP 协议明码传输，要使用 HTTPS 协议传输。