---
title: macOS隐藏Dock正在运行的图标
categories: macOS
comments: false
date: 2018-11-09 18:54:22
tags:
  - macOS技巧
---

打开Finder，左侧选择应用程序，右键点击你想要隐藏的软件，显示包内容-Contents，编辑 Info.plist文件，在<dict></dict>之间加入以下参数：

<key>LSUIElement</key>

 <string>1</string>

1、打开Finder，左侧选择应用程序，右键点击你想要隐藏的软件，显示包内容-Contents



2、编辑 Info.plist文件，在<dict></dict>之间输入参数



3、效果





4、不想隐藏了，直接删除那段参数重启就可以了