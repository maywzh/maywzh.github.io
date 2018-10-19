---
title: MySQL入门命令
date: 2015-09-11 12:16:14
tags: 
  - 数据库
  - mysql
categories: Web Development
thumbnail: https://ws4.sinaimg.cn/large/006tNbRwgy1fwe3yd5jeqj31kw0z4wh9.jpg
---

总结一下常用的简单MySQL命令。

<!--more-->

## MySQL介绍

MySQL 为关系型数据库由一个或数个表格组成

| id   | name | sex  | age  |
| ---- | ---- | ---- | ---- |
| 0    | 张三 | m    | 23   |
| 1    | 李四 | f    | 35   |
| 2    | 王五 | m    | 20   |
| ...  | ...  | ...  | ...  |

**表头(header)：**每一列的名称；
**列(col)：** 每一列用来描述表中所有数据项的某个属性；
**行(row)：**每一行用来描述某个数据项的的所有属性；
**值(value)：**行的具体信息, 每个值必须与该列的数据类型相同；

## 登录MySQL

```bash
mysql -h 127.0.0.1 -u username -p
mysql -D dbname -h hostname -u username -p
mysql> exit 
# 退出
mysql> quit # 退出
```

## 创建数据库

对于表的操作需要先进入库 use 库名；

```sql
create database testdb character set gbk; -- 创建一个名为 testdb 的数据库，数据库字符编码指定为 gbk
drop database testdb;  -- 删除 testdb
show databases;        -- 显示数据库列表。
use testdb;      -- 选择创建的数据库people
show 表名;       -- 显示samp_db下面所有的表名字
describe 表名;   -- 显示数据表的结构
delete from 表名; -- 清空表中记录
```

## 创建数据库表

使用 create table 语句可完成对表的创建, create table 的常见形式:语法：create table 表名称(列声明)；

```sql
CREATE TABLE `users` (  
`id`          int(100) unsigned NOT NULL AUTO_INCREMENT primary key,  
`password`    varchar(32) NOT NULL DEFAULT '' COMMENT '用户密码',  
`mobile`         varchar(20) NOT NULL DEFAULT '' COMMENT '手机号码',  
`create_at`      timestamp(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6),  
`update_at`      timestamp(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),  
-- 创建唯一索引，不允许重复  
UNIQUE INDEX idx_user_mobile(`mobile`))
ENGINE=InnoDB DEFAULT CHARSET=utf8 
COMMENT='用户表';
```

数据类型的属性解释

- **NULL：**数据列可包含NULL值；
- **NOT NULL：**数据列不允许包含NULL值；
- **DEFAULT：**默认值；
- **PRIMARY：**KEY 主键；
- **AUTO_INCREMENT：**自动递增，适用于整数类型；
- **UNSIGNED：**是指数值类型只能为正数；
- **CHARACTER SET name：**指定一个字符集；
- **COMMENT：**对表或者字段说明；

## CRUD - 增删查改

### SELECT 查

SELECT 语句用于从表中选取数据。
**语法：SELECT 列名称 FROM 表名称** -- 选择特定的列
**语法：SELECT \* FROM 表名称** -- 选择所有的列

```sql
-- 表abc 两个 id  表abc中不包含 字段a=b 的 查询出来，只显示id
SELECT s.id from station s WHERE id in (13,14) and user_id not in (4);
-- 从表 Persons 选取 LastName 列的数据
SELECT LastName FROM Persons 
-- 结果集中会自动去重复数据
SELECT DISTINCT Company FROM Orders
-- 表 Persons 字段 Id_P 等于 Orders 字段 Id_P 的值，
-- 结果集显示 Persons表的 LastName、FirstName字段，Orders表的OrderNo字段
SELECT p.LastName, p.FirstName, o.OrderNo FROM Persons p, Orders o WHERE p.Id_P = o.Id_P 
```

### UPDATE 改

Update 语句用于修改表中的数据。
语法：UPDATE 表名称 SET 列名称 = 新值 WHERE 列名称 = 某值

```sql
-- update语句设置字段值为另一个结果取出来的字段
-- 从user2表中查到name为Micki对应的id，修改user中此id的name字段为user1表中id=1的表项的name字段
update user 
set name = (select name from user1 where user1 .id = 1 )
where id = (select id from user2 where user2 .name='Micki')
```

### INSERT 增

INSERT INTO 语句用于向表格中插入新的行。
语法：INSERT INTO 表名称 VALUES (值1, 值2,….)
语法：INSERT INTO 表名称 (列1, 列2,…) VALUES (值1, 值2,….)

```sql
-- 向表 Persons 插入一条字段 FirstName = Andy 字段 Address = beijing
INSERT INTO Persons (FirstName, Address) VALUES ('Andy', 'beijing'); 
```

### DELETE 删

DELETE 语句用于删除表中的行。
语法：DELETE FROM 表名称 WHERE 列名称 = 值

```sql
-- 在不删除table_name表的情况下删除所有的行，清空表。
DELETE FROM table_name
-- 或者
DELETE * FROM table_name
-- 删除 Person表字段 FirstName = 'Andy' 
DELETE FROM Person WHERE FirstName = 'Andy' 
```



## 列处理

### COUNT

COUNT 统计符合要求的表项数(行数)
语法：SELECT COUNT(“字段名”) FROM “表格名”;

```sql
-- 表 stores 中 store_name 栏不是NULL的表项总数
SELECT COUNT (Store_Name) FROM stores WHERE store_name IS NOT NULL; 
-- 获取 Persons 表的总数
SELECT COUNT(1) AS totals FROM Persons;
-- 获取表 station 字段 user_id 相同的总数
SELECT user_id, COUNT(*) AS totals FROM station GROUP BY user_id;
```

### MAX

MAX 函数返回一列中的最大值。NULL 值不包括在计算中。
语法：SELECT MAX(“字段名”) FROM “表格名”

```sql
-- 列出表 orders 字段 OrderPrice 列最大值，
-- 结果集列不显示 OrderPrice 显示 LargestOrderPrice
SELECT MAX(OrderPrice) AS LargestOrderPrice FROM orders
```

### SUM

SUM 用于计算某一列的和。

```sql
-- 计算 OrderPrice 
SELECT SUM(OrderPrice) AS totalprice FROM Orders
```



## WHERE - 条件限定

WHERE 子句用于规定选择的标准。
语法：SELECT 列名称 FROM 表名称 WHERE 列 运算符 值

```sql
-- 从表 Persons 中选出 Year 字段大于 1965 的数据
SELECT * FROM Persons WHERE Year>1965
```

### AND 和 OR

AND – 与； OR – 或；

### NOT 

NOT – 用于逻辑运算语句前

```sql
SELECT vend_id, prod_name FROM Products WHERE NOT vend_id = 'DLL01' ORDER BY prod_name;
```

### IN

IN – 在集合中

```sql
-- 从表 Persons 选取 字段 LastName 等于 Amy、Beck
SELECT * FROM Persons WHERE LastName IN ('Amy','Beck')
```

## AS - 别名

as – 别名

```sql
-- 查找并设置把Employee表格别名为 emp
SELECT * FROM Employee AS emp
-- 命名一个表之后，可以在下面用 emp 代替 Employee.
-- 例如 
SELECT * FROM emp. SELECT MAX(OrderPrice) AS LargestOrderPrice FROM Orders
-- 列出表 Orders 字段 OrderPrice 列最大值，
-- 结果集列不显示 OrderPrice 显示 LargestOrderPrice 
-- 显示表 users_profile 中的 name 列
SELECT t.name from (SELECT * from users_profile a) AS t; 
-- 表 user_accounts 命名别名 ua，表 users_profile 命名别名 up
-- 满足条件 表 user_accounts 字段 id 等于 表 users_profile 字段 user_id-- 结果集只显示mobile、name两列
SELECT ua.mobile,up.name FROM user_accounts as ua INNER JOIN users_profile as up ON ua.id = up.user_id;
```



## ORDER BY - 结果排序

ORDER BY – 语句用于根据指定的列对结果集进行排序。
DESC – 按照降序排序。
ASC – 按照升序排序（缺省默认）。

```sql
-- Company在表Orders中为字母，则会以字母顺序显示公司名称
SELECT Company, OrderNumber FROM Orders ORDER BY Company 
-- 后面跟上 DESC 则为降序显示
SELECT Company, OrderNumber FROM Orders ORDER BY Company DESC 
-- Company以降序显示公司名称，并OrderNumber以顺序显示
SELECT Company, OrderNumber FROM Orders ORDER BY Company DESC, OrderNumber ASC
```

## GROUP BY - 结果分组

用于结果基于某一个属性聚合

```sql
-- 获取表 station 字段 user_id 相同的总数
SELECT user_id, COUNT(*) AS totals FROM station GROUP BY user_id;
```

## JOIN - 联合查询

用于根据两个或多个表中的列之间的关系，从这些表中查询数据。
JOIN：如果表中有至少一个匹配，则返回行
INNER JOIN：两表都必须匹配，返回两表的行。
LEFT JOIN：即使右表中没有匹配，也从左表返回所有的行
RIGHT JOIN：即使左表中没有匹配，也从右表返回所有的行
FULL JOIN：只要其中一个表中存在匹配，就返回行

```sql
SELECT Persons.LastName, Persons.FirstName, Orders.OrderNo 
FROM PersonsINNER JOIN OrdersON Persons.Id_P = Orders.Id_PORDER BY Persons.LastName;
```

## INDEX - 索引

### 普通索引(INDEX)

语法：ALTER TABLE 表名字 ADD INDEX 索引名字 ( 字段名字 )

```sql
-- –直接创建索引
CREATE INDEX index_user ON user(title)
-- –修改表结构的方式添加索引
ALTER TABLE table_name ADD INDEX index_name ON (column(length))
-- 给 user 表中的 name字段 添加普通索引(INDEX)
ALTER TABLE `table` ADD INDEX index_name (name)
-- –创建表的时候同时创建索引
CREATE TABLE `table` (    
    `id` int(11) NOT NULL AUTO_INCREMENT ,    
    `title` char(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,    
    `content` text CHARACTER SET utf8 COLLATE utf8_general_ci NULL ,    
    `time` int(10) NULL DEFAULT NULL ,    
    PRIMARY KEY (`id`),    
    INDEX index_name (title(length)))
 -- –删除索引
 DROP INDEX index_name ON table
```

### 主键索引(PRIMARY key)

语法：ALTER TABLE 表名字 ADD PRIMARY KEY (字段名字)

```sql
-- 给 user 表中的 id字段 添加主键索引(PRIMARY key)
ALTER TABLE `user` ADD PRIMARY key (id);
```

### 唯一索引(UNIQUE)

语法：ALTER TABLE 表名字 ADD UNIQUE (字段名字)

```sql
-- 给 user 表中的 creattime 字段添加唯一索引(UNIQUE)
ALTER TABLE `user` ADD UNIQUE (creattime);
```

### 全文索引(FULLTEXT)

语法：ALTER TABLE 表名字 ADD FULLTEXT (字段名字)

```sql
-- 给 user 表中的 description 字段添加全文索引(FULLTEXT)
ALTER TABLE `user` ADD FULLTEXT (description);
```

### 添加多列索引

语法：ALTER TABLE table_name ADD INDEX index_name ( column1, column2, column3)

```sql
-- 给 user 表中的 name、city、age 字段添加名字为name_city_age的普通索引(INDEX)
ALTER TABLE user ADD INDEX name_city_age (name(10),city,age); 
```

### 建立索引的时机

在WHERE和JOIN中出现的列需要建立索引：
MySQL只对<，<=，=，>，>=，BETWEEN，IN使用索引
某些时候的LIKE也会使用索引。
在LIKE以通配符%和_开头作查询时，MySQL不会使用索引

```sql
-- 此时就需要对city和age建立索引，
-- 由于mytable表的userame也出现在了JOIN子句中，也有对它建立索引的必要。
SELECT t.Name  FROM mytable t LEFT JOIN mytable m ON t.Name=m.username WHERE m.age=20 AND m.city='上海'; SELECT * FROM mytable WHERE username like'admin%'; 
-- 而下句就不会使用：
SELECT * FROM mytable WHEREt Name like'%admin'; -- 因此，在使用LIKE时应注意以上的区别。
```

## 使用注意

- 索引不会包含有NULL值的列
- 使用短索引
- 不要在列上进行运算 索引会失效

## 表结构修改

### 添加列

语法：alter table 表名 add 列名 列数据类型 [after 插入位置];
示例：

```sql
-- 在表students的最后追加列 address: 
ALTER TABLE students ADD address CHAR(60);
-- 在名为 age 的列后插入列 birthday: 
ALTER TABLE students ADD birthday DATE after age;
```

### 修改列

语法：alter table 表名 change 列名称 列新名称 新数据类型;

```sql
-- 将表 tel 列改名为 telphone: 
ALTER TABLE students CHANGE tel telphone CHAR(13) default "-";
-- 将 name 列的数据类型改为 char(16): 
ALTER TABLE students CHANGE name name CHAR(16) NOT NULL;
```

### 删除列

语法：alter table 表名 drop 列名称;

```sql
-- 删除表students中的 birthday 列: 
ALTER TABLE students DROP birthday;
```

### 重命名表

语法：alter table 表名 rename 新表名;

```sql
-- 重命名 students 表为 workmates: 
ALTER TABLE students RENAME workmates;
```

### 清空表数据

语法：delete from 表名;

```sql
-- 清空表为 workmates 里面的数据，不删除表。 
DELETE FROM workmates;
```

### 删除整张表

语法：drop table 表名;

```sql
-- 删除 workmates 表: 
DROP TABLE workmates;
```

## 删除整个数据库

语法：drop database 数据库名;

```sql
-- 删除 samp_db 数据库: 
DROP DATEBASE samp_db;
```