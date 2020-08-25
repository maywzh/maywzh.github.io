---
title: Mysql访问拒绝解决
categories: 数据库
comments: false
date: 2015-11-01 18:12:43
tags:
  - mysql
  - bugfix
---

## 问题产生

今天用命令行登陆mysql时出现了Error。

```bash
mysql -uroot -p
ERROR 16958(28000): Access denied for user 'root'@'localhost'
```

起初我以为是root密码错了，于是就去mysql官方文档查了下改密码的方法

关闭mysql进程然后再建立一个改密码的sql文件

```bash
$ systemctl stop mysql.service

$ cd /tmp && vim init.sql #xxxxxx代表要修改的密码
alter user 'root'@'localhost' identified by 'xxxxxx'; 
```

安全模式启动mysql

```bash
$ mysqld_safe --defaults-file=/etc/mysql/my.cnf --init-file=/tmp/init.sql &
```

然后重启mysql

```bash
$ systemctl restart mysql.service
```

这样把密码改为了`xxxxxx`



然后我再去登陆

```bash
mysql -uroot -p
ERROR 16958(28000): Access denied for user 'root'@'localhost'
```

=͟͟͞͞(꒪⌓꒪*)

并不是密码错误的锅

## 问题关键

求助了强大的google和stackoverflow，终于找到了问题。

> The reason is that recent Ubuntu installation (maybe others also), mysql is using by default the [UNIX auth_socket plugin](https://dev.mysql.com/doc/mysql-security-excerpt/5.5/en/socket-authentication-plugin.html).
>
> Basically means that: *db_users using it, will be "auth" by \**the system user credentias.

user表中的用户的plugin默认会设置为auth_socket，这样的话，认证会由系统用户证书来进行。

```bash
$ sudo mysql -u root # I had to use "sudo" since is new installation

mysql> USE mysql;
mysql> SELECT User, Host, plugin FROM mysql.user;

+------------------+-----------------------+
| User             | plugin                |
+------------------+-----------------------+
| root             | auth_socket           |
| mysql.sys        | mysql_native_password |
| debian-sys-maint | mysql_native_password |
+------------------+-----------------------+
```

## 解决方案

有两种解决方案，但都需要登陆进mysql，所以需要重启mysql开启`--skip-grant-tables`参数，来跳过权限表的加载

```bash
$ systemctl stop mysql.service
$ mysqld_safe --defaults-file=/etc/mysql/my.cnf --skip-grant-tables  --skip-networking &
$ sudo mysql  #这样就可以免登录直接进入mysql交互界面

mysql>
```



### 方法1 

把mysql的root用户的plugin字段设置为`mysql_native_password`

```bash
mysql> USE mysql;
mysql> UPDATE user SET plugin='mysql_native_password' WHERE User='root';
mysql> FLUSH PRIVILEGES;
mysql> exit;

$ systemctl restart mysql.service
```

### 方法2

新建一个root用户

```bash
mysql> USE mysql;
mysql> CREATE USER 'YOUR_SYSTEM_USER'@'localhost' IDENTIFIED BY 'xxxxxx';
mysql> GRANT ALL PRIVILEGES ON *.* TO 'root2'@'localhost';
mysql> UPDATE user SET plugin='auth_socket' WHERE User='root2';
mysql> FLUSH PRIVILEGES;
mysql> exit;

$ service mysql restart
$ mysql -u root2 -pxxxxxx #用root2来登陆
```

