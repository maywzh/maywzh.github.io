---
title: macOS的实用命令
author: maywzh
tags:
  - macOS命令
categories: macOS
date: 2016-01-05 14:29:00
thumbnail: https://ws3.sinaimg.cn/large/006tNbRwgy1fwe30e46xhj30zk0k0gnf.jpg
---
基于Unix的OSX提供了强大的CLI系统，相对于linux，OSX给我们提供了一些额外的实用命令行命令。把这段时间试过的有趣的macOS CLI命令总结在这里。

<!--more-->

&nbsp;
## open - 打开文件、目录或执行程序

`open`其实等同于我们在GUI下面执行双击命令

```bash
open /Applications/Dictionary.app #Dictionary应用 
open ~/Movies #开当前用户Movies目录

touch ~/1.txt #创建1.txt
open -e ~/1.txt #打开1.txt并用TextEdit编辑
```

我们也可以直接把文件夹拖入Terminal就会在命令行直接出现该文件夹路径。


&nbsp;
## say - 文字转语音

`say`是命令行上的VoiceOver：

```
$ say "Never trust a computer you can't lift."
```

用`-f`选项朗读特定文本文件，`-o`选项将朗读结果存为音频文件而不是播放：

```
$ say -f mynovel.txt -o myaudiobook.aiff
```

`say`命令也可以用于在脚本中播放警告或提示可以在系统设置（System Preferences）的字典和语音（Dictation & Speech）选项中调整系统的语音选项甚至是语音的语言。


&nbsp;
## screencapture - 截图

`screencapture`实际上就是命令行上的Grab.app。

全屏幕截图，并保存为image.png，作为新邮件的附件：

``` bash
$ screencapture -C -M image.png 
```

鼠标选择抓取范围并复制到剪贴板：

```bash
$ screencapture -c -W
```

延迟10秒截屏，用preview.app打开

```bash
$ screencapture -T 10 -P image.png
```

鼠标选择抓取范围保存到image.pdf文件

```bash
$ screencapture -s -t pdf image.pdf
```

更多用法可以参阅`screencapture --help`。


&nbsp;
## pbcopy/pbpaste - 直接与系统剪贴板交互

在命令行拷贝到系统剪贴板一般是用鼠标选中需要的部分然后<kbd>⌘</kbd>+<kbd>c</kbd>，反之从系统剪贴板粘贴到命令行则是<kbd>⌘</kbd>+<kbd>v</kbd>。但这样效率并不高，macOS提供了`pbcopy`和`pbpaste`工具来进行命令行和系统剪贴板的交互。

利用管道符来传递待拷贝内容到pbcopy命令

```bash
$ ls ~ | pbcopy #把ls ~ 的结果拷贝到系统剪贴板 
```

也可以利用重定向符号来传递内容

```bash
$ pbcopy < blogpost.txt
```

我们也可以多个命令组合起来实现一个复杂的操作，如访问Google拷贝其徽标

```bash
$ curl http://www.google.com/doodles\#oodles/archive | grep -A5 'latest-doodle on' | grep 'img src' | sed s/.*'<img src="\/\/'/''/ | sed s/'" alt=".*'/''/ | pbcopy
```

利用管道语法可以选取要拷贝的内容，我们也可以利用pbcopy和pbpaste来实现自动化工作流，例如抓取[Github的api](api.github.com)到本地的文件

```bash
$ curl https://api.github.com | pbcopy && pbpaste >> ~/api.json
```


&nbsp;
## mdfind - 命令行上的Spotlight

类似于Spotlight，`mdfind`可以实现自定义查找，例如文件内容匹配和元数据查找。

`mdfind`还提供更多的搜索选项。例如`-onlyin`选项可以约束搜索范围为一个目录：

```bash
$ mdfind -onlyin ~/Documents essay
```

`mdfind`的索引数据库在后台自动更新。


&nbsp;
## launchctl - macOS启动脚本

`launchctl`管理OS X的启动脚本和定时服务。类似于linux的cron。

显示当前的启动脚本

```bash
$ launchctl list
```

开机自启动apache服务器：

```bash
$ sudo launchctl load -w /System/Library/LaunchDaemons/org.apache.httpd.plist
```

停止正在运行的apache服务

```bash
$ sudo launchctl unload /System/Library/LaunchDaemons/org.apache.httpd.plist 
```

停止并取消开机启动的apache服务

```bash
$ sudo launchctl unload -w /System/Library/LaunchDaemons/org.apache.httpd.plist 
```

Launchd脚本存储位置：

```bash
~/Library/LaunchAgents    
/Library/LaunchAgents          
/Library/LaunchDaemons
/System/Library/LaunchAgents
/System/Library/LaunchDaemons
```

启动脚本的格式可以参考[这篇blog](http://paul.annesley.cc/2012/09/mac-os-x-launchd-is-cool/)，或苹果开发者中心的[文章](https://developer.apple.com/library/mac/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html)。也可以使用[Lingon](http://www.peterborgapps.com/lingon/)应用来完全取代命令行。







