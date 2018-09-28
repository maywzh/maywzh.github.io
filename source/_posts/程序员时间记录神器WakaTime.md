---
title: 程序员时间记录神器WakaTime
author: maywzh
tags:
  - 生产力工具
categories:
  - 工具
date: 2018-09-28 21:06:00
---
> 我渴望认识自己，这是认识世界的第一步。

自我量化对于一个渴望自我提升的人十分重要。我们最值得记录的就是我们最宝贵的财富--时间。如今有许多优秀的时间记录工具，它们收集并分析我们的某一方面的数据，并可视化反馈给我们，帮助我们调整自身。

<!--more-->

对程序员而言，我们渴望有一个工具可以详细记录我们的编程时间。[WakaTime](WakaTime.com)正是这样一个神器。它专为程序员和开发者而设计，它可以记录我们花在各个项目上的时间，也可以记录花在各种工具(IDE、浏览器、编辑器等)的时间，也可以记录我们花在各种编程语言上的时间。最强大的是，这款工具还支持团队协作（收费功能）。这些时间可以通过种种精美的图标可视化展现给用户，无论对于开发者还是项目管理都是效率神器。

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

我们可以把自己的数据放在Leaderboards上去排位，当然这是可选的。如果你不想自己的隐私被暴露的话。

![Leaderboard](https://ws3.sinaimg.cn/large/006tNc79gy1fvpjyyw6h3j31480alq51.jpg)



### API文档

我们可以在[WakaTime API](https://WakaTime.com/developers)里面查询WakaTime提供的API，来进行丰富的功能定制。