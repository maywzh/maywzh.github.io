---
title: 用jsDelivr来改善网站响应速度
date: 2016-01-13 02:46:27
tags:
  - CDN
  - Web
categories: DevOps
thumbnail: https://i.loli.net/2020/08/29/cu2LtW3lp5joKHq.png
cover: https://i.loli.net/2020/08/29/cu2LtW3lp5joKHq.png
---

今天树莓派上的服务检测脚本忽然告警了，博客出现了大量资源down掉的情况，赶紧上线查看，页面都刷不出来，原来是`cdn.bootcss.com`这个CDN down掉了，我的`jquery`,`fontawesome`等JS库还有一些CSS库都引用这个CDN导致页面崩坏。坑爹呢  (；￣Д￣）

我心中顿时出现了一个解决方案，维护一个CDN列表，然后服务器上跑一个性能监测脚本，对这些CDN进行可达性和性能测试，然后在网站里去根据这个脚本动态修改依赖的CDN。

等等好像有什么问题，服务器上进行性能监测好像没啥卵用啊，我们要保证客户端可达，这个好像是CDN要做的工作啊。

难道要在客户端去跑这个脚本？ =͟͟͞͞(꒪⌓꒪*) 算了算了还是搜一个靠谱的CDN吧。

在StackOverflow搜索了一下发现有人推荐[jsDelivr](https://www.jsdelivr.com/)作为CDN。

试验了一下，发现效果相当给力。推荐一下～

<!--more-->

## What is jsDelivr 

> jsDelivr - Open Source CDN free fast and reliable

它是一个高性能的CDN，通过

## How it work

官网上有一张原理的简要介绍

![img](https://www.jsdelivr.com/img/network/infographics.png?v=d4a4024db2475bb20dc7a8166d98130a51606502)

jsDelivr通过多个CDN服务商对全球用户提供高性能的内容分发服务，其中对中国线路做了特别优化。整个大陆地区有超过600个边缘节点。默认使用[cedexis](https://www.cedexis.com/)提供的智能负载均衡服务来进行CDN选择，如果cedexis挂掉，则默认选择StackPath CDN或CloudFlare CDN。如果请求内容未命中jsDelivr的缓存，则去上游的Amazon S3对象存储服务查找资源，Amazon S3服务也会同步最终来自于npm和Github的源文件。如果Amazon S3服务down掉，jsDelivr则把请求直接转发给存储源文件的npm和github。

总之，jsDelivr有众多的边缘服务节点，对中国大陆服务友好，并有宕机备份解决方案，保证了CDN的可达性和性能。

## Performance test

我们利用[17ce](http://www.17ce.com/site)这个测速工具来测量jsDelivr的性能。



速度还是相当给力的。

## How to use

jsDelivr提供了三种CDN服务方式：npm，github和wordpress。我们着重讲讲github的方式。

github方式

```html
// load any GitHub release or commit
// note: we recommend using npm for projects that support it
https://cdn.jsdelivr.net/gh/user/repo@version/file

// load jQuery v3.2.1
https://cdn.jsdelivr.net/gh/jquery/jquery@3.2.1/dist/jquery.min.js

// use a version range instead of a specific version
https://cdn.jsdelivr.net/gh/jquery/jquery@3.2/dist/jquery.min.js
https://cdn.jsdelivr.net/gh/jquery/jquery@3/dist/jquery.min.js

// omit the version completely to get the latest one
// you should NOT use this in production
https://cdn.jsdelivr.net/gh/jquery/jquery/dist/jquery.min.js

// add ".min" to any JS/CSS file to get a minified version
// if one doesn't exist, we'll generate it for you
https://cdn.jsdelivr.net/gh/jquery/jquery@3.2.1/src/core.min.js

// add / at the end to get a directory listing
https://cdn.jsdelivr.net/gh/jquery/jquery/
```



例如我们想要`pangu`的版本号为3.3.0的`pangu.min.js`插件的CDN地址，那么我们去[pangu的github页面](https://github.com/vinta/pangu.js)，

从commits历史或releases中查找3.3.0版本，查看文件并搜索`pangu.min.js`的相对路径



其路径是`dist/browser/pangu.min.js`，根据作者名称和repo 名分别是`vinta/pangu.js`。所以引用路径是

` https://cdn.jsdelivr.net/gh/vinta/pangu.js@3.3.0/dist/browser/pangu.min.js`，我们也可以对这个地址测速。



awesome！把它放在我们项目的配置文件中即可。