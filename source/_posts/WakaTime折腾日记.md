---
title: WakaTime - 时间记录工具
author: maywzh
tags:
  - 生产力工具
  - 时间记录
categories: Programing Tools
date: 2018-09-28 21:06:00
thumbnail: https://raw.githubusercontent.com/maywzh/imagebed/master/img/track-time.jpg # 略缩图
---

提高自制力的一个有效的方式就是自我量化，其中一个重要的维度即是时间记录，通过对我们的工作、生活各个方面进行数据记录和分析，可以帮助我们优化自己的时间管理策略，提高生产力。
对程序员而言，我们迫切需求有一个工具能够记录我们在工作中的时间分配和利用率。对于项目管理而言，也有了解开发人员开发效率的需求。
[WakaTime](WakaTime.com)正是这样一个工具。它专为程序员和开发者而设计，通过简单配置，它就可以记录我们花在各个项目、各种工具(IDE、浏览器、编辑器等)以及具体工作内容的时间。
对比Rescuetime的大而全，Wakatime专精于记录编程和编辑的方面。推荐开发者都去试试，至少可以帮助提升自制力... :)

<!--more-->

。

![WakaTime图表](https://ws3.sinaimg.cn/large/006tNc79gy1fvpio1scoij30wz0kqtbk.jpg)

<center>△ WakaTime 仪表盘</center>

### 开始使用

首先去[WakaTime](WakaTime.com)注册一个账户。我们也可以用自己的Github账户来授权登陆WakaTime。然后我们需要给我们的IDE或者编辑器安装WakaTime时间记录插件，目前WakaTime已经基本支持主流的IDE。

![支持的IDE](https://ws2.sinaimg.cn/large/006tNc79gy1fvpix0uen4j31fn0np7a5.jpg)

### 安装IDE插件

我们以VS Code和Chrome为例，分别给IDE和浏览器安装插件。

点击左边栏Supported IDES这个选项，然后点击VS Code选项。

![VS Code 安装插件](https://ws3.sinaimg.cn/large/006tNc79gy1fvpj4qkuoaj30up0iljtw.jpg)

按照官网的提示，我们在VS Code 中下载好插件，重启VS Code

![WakaTime Tools](https://ws2.sinaimg.cn/large/006tNc79gy1fvpj1qso27j31kw09kq6d.jpg)

按`F1`，出现选项框

![WakaTime API Key for VSCode](https://ws1.sinaimg.cn/large/006tNc79gy1fvpj4lsuimj30zg0rgjvz.jpg)

选择WakaTime API Key， 此时我们需要去[WakaTime Account](https://WakaTime.com/settings/account)页面获取我们的API Key，来关联我们的账户。

![WakaTime API Key Genegrate](https://ws2.sinaimg.cn/large/006tNc79gy1fvpj77igm0j31bc044jro.jpg)

把API Key复制下来粘贴到VS Code的WakaTime API Key框，然后`Enter`。

此时VS Code的WakaTime就配置完成了。

### 数据可视化

到[WakaTime Dashboard](https://WakaTime.com/dashboard)页面查看，我们的VS Code已经开始记录了。

![demo project](https://ws1.sinaimg.cn/large/006tNc79gy1fvpjbbgdmej30j905qq3a.jpg)

(我这里是已经安装了多个IDE插件的结果)

如果VS Code打开了一个项目，例如我们打开一个tcpudp的demo。

在[WakaTime Dashboard](https://WakaTime.com/dashboard)的下面的Projects栏就会多出一个

![demo project](https://ws1.sinaimg.cn/large/006tNc79gy1fvpjfaomjbj30fe05fwei.jpg)

里面也有项目所用语言、编辑器的细节。

![demo project detail](https://ws3.sinaimg.cn/large/006tNc79gy1fvpjv6t0y4j318p0ijjtb.jpg)

[WakaTime Dashboard](https://WakaTime.com/dashboard)也有各个项目的时间轴，可以查看我们在每个项目上花的时间。

![projects waka](https://ws4.sinaimg.cn/large/006tNc79gy1fvpjl6dl1xj30hz05a74i.jpg)

### 设置目标

我们可以为每个项目设置每日要完成的目标，例如每工作日花三小时。

![Goal](https://ws3.sinaimg.cn/large/006tNc79gy1fvpjqe00vrj319z08gt9b.jpg)

可以订阅这个目标，然后系统会发送邮件给我们提醒。

### 集成到其他网站

WakaTime提供了统计结果的HTML代码，我们可以把它分享到Facebook等社交网站上，也可以直接挂在我们的博客上。

![Embed Waka](https://ws1.sinaimg.cn/large/006tNc79gy1fvpjt8ospjj30p40jt40g.jpg)

### 积分榜

我们可以把自己的数据放在Leaderboards上去排位。

![Leaderboard](https://ws3.sinaimg.cn/large/006tNc79gy1fvpjyyw6h3j31480alq51.jpg)



### API文档

可以在[WakaTime API](https://WakaTime.com/developers)里面查询WakaTime提供的API，来进行丰富的功能定制。