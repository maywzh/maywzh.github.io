---
title: 通过docker容器方式搭建gitlab服务
categories: DevOps
comments: false
date: 2017-02-17 16:56:07
tags:
  - Docker
thumbnail: https://i.loli.net/2020/08/23/KYfM3RleVNJ2AHz.png
cover: https://i.loli.net/2020/08/23/KYfM3RleVNJ2AHz.png
---

一直使用git来做项目版本控制，但每次新建项目都要去服务器上操作，比较麻烦，所以选用开源的gitlab就相当合适了。

gitlab的自带组件比较多，例如redis、postgresql还有自带的nginx等等，中间的坑也很多，综合考量还是选用懒方法docker容器来安装。安全、快速。

部署环境为Ubuntu 18.04 的局域网机器，由于是Docker方式部署，理论上各个环境的部署方式都是类似的。

<!--more-->

## 环境准备

### 性能要求

最好是4GB内存以上，至少要2GB内存，否则卡的你怀疑人生。

### 安装Docker

我们从阿里源安装。

安装必要的一些系统工具

```bash
$ apt-get update
$ apt-get -y install apt-transport-https ca-certificates curl software-properties-common
```

安装GPG证书

```bash
$ curl -fsSL http://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo apt-key add -
```

 写入软件源信息

```bash
$ add-apt-repository "deb [arch=amd64] http://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"
```

更新并安装 Docker-CE

```bash
$ apt-get -y update
$ apt-get -y install docker-ce
```

安装好之后，来看看Docker的版本。

```bash
$ docker version
Client:
 Version:           18.06.1-ce
 API version:       1.38
 Go version:        go1.10.3
 Git commit:        e68fc7a
 Built:             Tue Aug 21 17:24:51 2018
 OS/Arch:           linux/amd64
 Experimental:      false

Server:
 Engine:
  Version:          18.06.1-ce
  API version:      1.38 (minimum version 1.12)
  Go version:       go1.10.3
  Git commit:       e68fc7a
  Built:            Tue Aug 21 17:23:15 2018
  OS/Arch:          linux/amd64
  Experimental:     false
```

## 安装gitlab-ce

### 镜像拉取

```bash
$ docker pull gitlab-ce #大约1.5GB 耐心等待
```

### 容器创建

```bash
$ docker run -d \
--hostname gitlab.maywzh.com \ 	  # 指定容器域名,未知功能:创建镜像仓库的时候使用到
-p 8880:80 \                        	  # 将容器内80端口映射到主机8880,提供http服务
-p 8222:22 \                        	  # 将容器内22端口映射到主机8222,提供ssh服务
-p 9090:9090 \                            # 将容器内9090端口映射到主机9090,提供prometheus服务
--name gitlab \                           # 指定容器名称
--restart always \                        # 容器退出时,自动重启
-v /srv/gitlab/config:/etc/gitlab \       # 将本地/srv/gitlab/config挂载到容器内/etc/gitlab
-v /srv/gitlab/logs:/var/log/gitlab \     # 将本地/srv/gitlab/logs挂载到容器内/var/log/gitlab
-v /srv/gitlab/data:/var/opt/gitlab \     # 将本地/srv/gitlab/data挂载到容器内/var/opt/gitlab
gitlab/gitlab-ce:latest                   # 镜像名称:版本
```

查看容器运行状况

```bash
$ docker inspect gitlab --format "{{.State.Status}}"
running #表示正常
```



## 配置

我们把docker容器的gitlab配置目录挂载在本地的`/srv/gitlab/`中。所以，需要改动这里的配置文件。

先备份`gitlab.rb`

```bash
$ cd /srv/gitlab/config      
$ cp gitlab.rb gitlab.rb.default
```

### 配置文件示例

```nginx
### gitlab.rb 把以下内容加在原gitlab.rb的最下面 有些配置项需要视情况改动
## 域名设置 这个影响 git clone 的地址
external_url http://github.maywzh.com
## gitlab镜像自带nginx配置
nginx['enable'] = true
nginx['client_max_body_size'] = '250m'
nginx['redirect_http_to_https'] = false
nginx['listen_addresses'] = ['0.0.0.0', '[::]']
nginx['listen_port'] = 80
nginx['listen_https'] = false
nginx['custom_gitlab_server_config'] = "location ^~ /foo-namespace/bar-project/raw/ {\n deny all;\n}\n"
nginx['custom_nginx_config'] = "include /etc/nginx/conf.d/*.conf;"
nginx['proxy_read_timeout'] = 3600
nginx['proxy_connect_timeout'] = 300
nginx['proxy_set_headers'] = {
 "Host" => "$http_host_with_default",
 "X-Real-IP" => "$remote_addr",
 "X-Forwarded-For" => "$proxy_add_x_forwarded_for",
 "Upgrade" => "$http_upgrade",
 "Connection" => "$connection_upgrade"
}
nginx['proxy_cache_path'] = 'proxy_cache keys_zone=gitlab:10m max_size=1g levels=1:2'
nginx['proxy_cache'] = 'gitlab'
nginx['http2_enabled'] = false
# nginx['real_ip_trusted_addresses'] = ['172.16.0.0/16'] #需要改动
nginx['real_ip_header'] = 'X-Real-IP'
nginx['real_ip_recursive'] = on
nginx['custom_error_pages'] = {
  '404' => {
    'title' => 'Example title',
    'header' => 'Example header',
    'message' => 'Example message'
  }
}
nginx['dir'] = "/var/opt/gitlab/nginx"
nginx['log_directory'] = "/var/log/gitlab/nginx"
nginx['worker_processes'] = 4
nginx['worker_connections'] = 10240
nginx['log_format'] = '$remote_addr - $remote_user [$time_local] "$request" $status $body_bytes_sent "$http_referer" "$http_user_agent"'
nginx['sendfile'] = 'on'
nginx['tcp_nopush'] = 'on'
nginx['tcp_nodelay'] = 'on'
nginx['gzip'] = "on"
nginx['gzip_http_version'] = "1.0"
nginx['gzip_comp_level'] = "2"
nginx['gzip_proxied'] = "any"
nginx['gzip_types'] = [ "text/plain", "text/css", "application/x-javascript", "text/xml", "application/xml", "application/xml+rss", "text/javascript", "application/json" ]
nginx['keepalive_timeout'] = 65
nginx['cache_max_size'] = '5000m'
nginx['server_names_hash_bucket_size'] = 64
nginx['status'] = {
 "enable" => false,
}
## 邮件服务 以qq邮箱为例 需要改动
gitlab_rails['time_zone'] = 'Asia/Shanghai'
gitlab_rails['smtp_enable'] = true
gitlab_rails['smtp_address'] = "smtp.qq.com"
gitlab_rails['smtp_port'] = 465
gitlab_rails['smtp_user_name'] = "xxxxxx@qq.com"
gitlab_rails['smtp_password'] = "xxxxxxx" #qq邮箱的独立密码
gitlab_rails['smtp_domain'] = "smtp.qq.com"
gitlab_rails['smtp_authentication'] = :plain
gitlab_rails['smtp_enable_starttls_auto'] = true
gitlab_rails['gitlab_email_from'] = "xxxxxx@qq.com"
user['git_user_email'] = "xxxxxx@qq.com"
user['git_user_name'] = "gitlab"

## gitlab自带Postgresql配置
postgresql['enable'] = true
postgresql['ssl'] = 'off'

## gitlab自带Redis配置
gitlab_rails['redis_host'] = "127.0.0.1"
gitlab_rails['redis_port'] = 6379
gitlab_rails['redis_password'] = '0340fg2340jk342302342l' #需要改动
gitlab_rails['redis_database'] = 0
redis['enable'] = true
redis['username'] = "gitlab-redis"
redis['maxclients'] = "10000"
redis['maxmemory'] = "1gb"
redis['maxmemory_policy'] = "allkeys-lru"
redis['maxmemory_samples'] = "5"
redis['tcp_timeout'] = "60"
redis['tcp_keepalive'] = "300"
redis['port'] = 6379
redis['password'] = '0340fg2340jk342302342l' #需要改动

## gitlab备份路径
gitlab_rails['manage_backup_path'] = true
gitlab_rails['backup_path'] = "/var/opt/gitlab/backups"

## 监控Prometheus配置
prometheus['enable'] = true
prometheus['monitor_kubernetes'] = false
prometheus['username'] = 'gitlab-prometheus'
prometheus['uid'] = nil
prometheus['gid'] = nil
prometheus['shell'] = '/bin/sh'
prometheus['home'] = '/var/opt/gitlab/prometheus'
prometheus['log_directory'] = '/var/log/gitlab/prometheus'
prometheus['scrape_interval'] = 15
prometheus['scrape_timeout'] = 15
prometheus['chunk_encoding_version'] = 2
prometheus['listen_address'] = '0.0.0.0:9090'
prometheus_monitoring['enable'] = true
node_exporter['enable'] = true
redis_exporter['enable'] = true
redis_exporter['log_directory'] = '/var/log/gitlab/redis-exporter'
redis_exporter['flags'] = {
  'redis.addr' => "127.0.0.1:6379",
  'redis.password' => '0340fg2340jk342302342l' #需要改动
}
postgres_exporter['enable'] = true
gitlab_monitor['enable'] = true                                
```

修改好配置文件后，重载配置

```bash
$ docker exec -t gitlab gitlab-ctl reconfigure
$ docker exec -t gitlab gitlab-ctl restart
```

### nginx反向代理

由于容器内部的http服务端口是8880，为了能够直接输入域名来访问，需要设置nginx反向代理代理容器内部的nginx服务。

```bash
$ sudo vim /etc/nginx/conf.d/gitlab.conf
```

修改`/etc/nginx/conf.d/gitlab.conf `

```nginx
server
{ 
    listen 80;
    server_name gitlab.maywzh.com;

    location /
    {
        proxy_redirect off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_pass http://localhost:8880;
    }
}
```
修改`/etc/nginx/nginx.conf     `

```nginx
...
http{
    ...
    include /etc/nginx/conf.d/gitlab.conf;
    ...
}
...
```
重启nginx
```bash
$ systemctl restart nginx.service
```

这样就部署完成了～


