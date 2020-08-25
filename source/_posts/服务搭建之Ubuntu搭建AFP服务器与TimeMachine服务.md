---
title: 如何在Ubuntu上搭建TimeCapsule服务
categories: Linux
comments: false
date: 2016-03-30 14:42:35
tags:
  - Linux
thumbnail: https://i.loli.net/2020/08/23/vFzuXG6ESdpcTAq.jpg

---

一直是使用samba服务作为NAS，移动硬盘插在mac上作为TimeMachine备份盘，但这样还是太笨拙了。

为了实现无线备份，一种方法是购买Apple TimeCapsule，另一种则是利用Linux设备来搭建[Netatalk](http://netatalk.sourceforge.net/)服务器。正好又一台闲置的Ubuntu机器，于是就决定采用这种方式。

[Netatalk](http://netatalk.sourceforge.net/)是一个开源的AppleTalk通信协议的实现，可以通过在Linux系统上搭建Netatalk服务来作为macOS设备的AFP服务器、AppleTalk路由等等。结合[avahi](https://github.com/lathiat/avahi)服务，可以达到Apple原生设备的效果。

本文基于Ubuntu 18.04环境搭建，其他环境配置类似。

<!--more-->

## 硬盘挂载与配置

### 查看已连接的硬盘

```bash
$ fdisk -l   								#查看系统连接的磁盘信息
...
/dev/sdb3  649940992 976773119 326832128 155.9G Apple HFS/HFS+  
											#显示需要挂载的HFS+分区在 /dev/sdb3

```



### HFS+分区关闭journal

Mac的HFS+分区一般都默认开启journal功能，因为Linux不支持读写journaled HFS+，所以必须关闭这个功能。

可以把硬盘连接到mac操作

```bash
#关闭Journal
$ diskutil disableJournal disk0s2       #假设disk0s2为需要挂载到linux上的磁盘分区
Journaling has been disabled on disk0s2
 
#打开Journal  
$ diskutil enableJournal disk0s2
Journaling has been enabled on disk0s2
```

或者直接在linux上操作，通过下载`journalling_off.c`源码编译运行来关闭

```bash
$ cd /tmp
$ curl https://pastebin.com/raw/W8pfgHRe -o journalling_off.c
$ gcc journalling_off.c -o journalling_off
$ sudo ./journalling_off /dev/sdb3   	#根据fdisk的结果 /dev/sdb3 为对应HFS+分区
</code>sudo ./journalling_off /dev/sdb3
attributes = 0x80002100 
journal has been disabled.
```

如果网速不好，源码如下

```c
// journalling_off.c
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/mman.h>
#include <fcntl.h>
#include <byteswap.h>
 
 
 
int main(int argc, char *argv[])
{
        int fd = open(argv[1], O_RDWR);
        if(fd < 0) {
                perror("open");
                return -1;
        }
       
        unsigned char *buffer = (unsigned char *)mmap(NULL, 2048, PROT_READ|PROT_WRITE, MAP_SHARED, fd, 0);
        if(buffer == (unsigned char*)0xffffffff) {
                perror("mmap");
                return -1;
        }
       
        if((buffer[1024] != 'H') && (buffer[1025] != '+')) {
                fprintf(stderr, "%s: HFS+ signature not found -- aborting.\n", argv[0]);
                return -1;
        }
       
        unsigned long attributes = *(unsigned long *)(&buffer[1028]);
        attributes = bswap_32(attributes);
        printf("attributes = 0x%8.8lx\n", attributes);
       
        if(!(attributes & 0x00002000)) {
                printf("kHFSVolumeJournaledBit not currently set in the volume attributes field.\n");
        }
       
        attributes &= 0xffffdfff;
        attributes = bswap_32(attributes);
        *(unsigned long *)(&buffer[1028]) = attributes;
       
        buffer[1032] = '1';
        buffer[1033] = '0';
        buffer[1034] = '.';
        buffer[1035] = '0';
       
        buffer[1036] = 0;
        buffer[1037] = 0;
        buffer[1038] = 0;
        buffer[1039] = 0;
       
        printf("journal has been disabled.\n");
        return 0;
}
```

### 挂载

```bash
$ sudo mkdir /mnt/timemachine					#创建挂载点
$ sudo mount  -t hfsplus -o force,rw /dev/sdb3 /mnt/timemachine   		
												#挂载点设置为/mnt/timemachine
```



## Netatalk编译安装与配置

由于apt上的Netatalk的版本太老，所以选择编译安装。 

### 编译

安装依赖库

```bash
$ sudo apt install -y \
build-essential \
libevent-dev \
libssl-dev \
libgcrypt-dev \
libkrb5-dev \
libpam0g-dev \
libwrap0-dev \
libdb-dev \
libtdb-dev \
avahi-daemon \
libavahi-client-dev \
libacl1-dev \
libldap2-dev \
libcrack2-dev \
libdbus-1-dev \
libdbus-glib-1-dev \
libglib2.0-dev
```

安装[checkinstall](https://ubuntu.pkgs.org/18.04/ubuntu-universe-amd64/checkinstall_1.6.2-4ubuntu2_amd64.deb.html)

```bash
$ sudo apt install --yes checkinstall
```

也可以通过[下载deb包](https://ubuntu.pkgs.org/18.04/ubuntu-universe-amd64/checkinstall_1.6.2-4ubuntu2_amd64.deb.html)来安装

```bash
$ cd /tmp && curl http://archive.ubuntu.com/ubuntu/pool/universe/c/checkinstall/checkinstall_1.6.2-4ubuntu2_amd64.deb
$ sudo dpkg -i checkinstall_1.6.2-4ubuntu2_amd64.deb
```

设置环境变量

```bash
$ NETATALK_VERSION='3.1.11'
$ MAINTAINER='maywzh \<maywzh@gamil.com\>' # 这里换成 自己的名字和邮箱
```

下载netatalk源码

```bash
$ wget http://prdownloads.sourceforge.net/netatalk/netatalk-${NETATALK_VERSION}.tar.gz -P /tmp
tar -xzf /tmp/netatalk-${NETATALK_VERSION}.tar.gz -C /tmp
$ cd /tmp/netatalk-${NETATALK_VERSION}
```

编译

```bash
$ ./configure \
--with-init-style=debian-systemd \
--without-libevent \
--with-cracklib \
--enable-krbV-uam \
--with-pam-confdir=/etc/pam.d \
--with-dbus-daemon=/usr/bin/dbus-daemon \
--with-dbus-sysconf-dir=/etc/dbus-1/system.d
$ make
$ sudo checkinstall -D \
--pkgname='netatalk' \
--pkgversion="${NETATALK_VERSION}" \
--maintainer="${MAINTAINER}" \
$ make install
```

### 安装

安装依赖

```bash
$ sudo apt install -y \
avahi-daemon \
cracklib-runtime \
db-util \
db5.3-util \
libtdb1 \
libavahi-client3 \
libcrack2 \
libcups2 \
libpam-cracklib \
libdbus-glib-1-2
```

安装编译包

```bash
$ sudo dpkg -i netatalk_3.1.11-1_amd64.deb
$ sudo ldconfig
```

检查安装

```bash
$ netatalk -v
netatalk 3.1.11 - Netatalk AFP server service controller daemon

This program is free software; you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation; either version 2 of the License, or (at your option) any later
version. Please see the file COPYING for further information and details.

netatalk has been compiled with support for these features:

      Zeroconf support:	Avahi
     Spotlight support:	No

                  afpd:	/usr/local/sbin/afpd
            cnid_metad:	/usr/local/sbin/cnid_metad
              afp.conf:	/usr/local/etc/afp.conf
    netatalk lock file:	/var/lock/netatalk
```



### 配置

#### 配置文件

```bash
$ vim /usr/local/etc/afp.conf  
```

想深入了解配置请参考[官方文档](http://netatalk.sourceforge.net/3.1/htmldocs/afp.conf.5.html)。

```config
[Global]  
mimic model = AirPort               #指定在macOS的Finder显示的图标  
log level = default:warn  
log file = /var/log/afpd.log  
hosts allow = 192.168.50.0/24       #子网 允许访问的主机地址,根据需要自行修改  
hostname = M-AFP             		#主机名 随意设置
uam list = uams_dhx.so uams_dhx2.so #默认认证方式 用户名密码登录 参看官方文档  

[Homes]  
basedir regex = /home               #用户的Home目录  

[TimeMachine]  
path = /mnt/TimeMachine             #数据目录  
time machine = yes                  #yes才支持TimeMachine  
spotlight = no                      #关闭spotlight索引  
vol size limit = 155000             #限制TimeMachine存储容量，单位为MB

;[Files]  							# ;注释
;path = /mnt/files                  #设置普通afp目录

```

#### 权限设置

创建一个新用户，用于访问 AFP 服务

```bash
$ useradd afp    #创建新用户afp  
$ paaswd afp     #修改afp用户密码
```



## Avahi 配置安装

Avahi是一个开源项目，用于让mac在局域网自动发现Linux AFP服务器，具体可参看项目地址https://github.com/lathiat/avahi。
### 安装
这个简单，直接 yum 就行

```bash
$ sudo apt install avahi -y  
```

### 配置
配置文件位置在 `/etc/avahi/services/afpd.service`

```bash
$ vim /etc/avahi/services/afpd.service
```

修改为以下内容

```xml
<?xml version="1.0" standalone='no'?>   
<!DOCTYPE service-group SYSTEM "avahi-service.dtd">   
<service-group>   
<name replace-wildcards="yes">DUKE-NAS-AFP</name>  
<service>   
<type>_afpovertcp._tcp</type>   
<port>548</port>   
</service>   
<service>   
<type>_device-info._tcp</type>   
<port>0</port>   
<txt-record>model=Xserve</txt-record>   
</service>   
</service-group>  
```



## 服务启动

```bash
$ sudo systemctl start avahi-daemon  
$ sudo systemctl start netatalk  
$ sudo systemctl enable avahi-daemon  
$ sudo systemctl enable netatalk  
```

查看 netatalk 和 avahi 端口是否启动监听, afp 监听 548 端口
请注意 Linux 防火墙问题，将对应端口放行

```bash
$ netstat -tulpn
```

至此， netatalk部署完成。



## 参考

1. [Install Netatalk 3.1.11 on Ubuntu 18.04 Bionic](http://netatalk.sourceforge.net/wiki/index.php/Install_Netatalk_3.1.11_on_Ubuntu_18.04_Bionic)
2. [Zero-configuration networking](https://en.wikipedia.org/wiki/Zero-configuration_networking)