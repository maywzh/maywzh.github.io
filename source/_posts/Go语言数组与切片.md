---
title: Go语言数组与切片
categories: 编程
comments: false
thumbnail: https://i.loli.net/2020/09/04/vY4eq6OIRotf19l.jpg
cover: https://i.loli.net/2020/09/04/vY4eq6OIRotf19l.jpg
date: 2019-01-05 15:47:08
tags:
  - Go
---

初学Go，对于数组与切片往往理解不清，在Python中，只有List这种数据结构，只有切片，而在Go中，作为一种编译性语言，数组与切片在底层原理上有所区别，在此需要结合编译运行时来介绍它们的实现原理。

<!--more-->

## 数组的数据结构与创建

数组是由相同类型元素的集合组成的数据结构，**计算机会为数组分配一块连续的内存来保存其中的元素**，我们可以利用数组中元素的索引快速访问元素对应的存储地址，常见的数组大多都是一维的线性数组，而多维数组在数值和图形计算领域却有比较常见的应用。

![2019-02-20-3D-array](https://i.loli.net/2020/09/04/QoATkRlvJutEDmx.jpg)

数组作为一种基本的数据类型，我们通常都会从两个维度描述数组，我们首先需要描述数组中存储的元素类型，还需要描述数组最大能够存储的元素个数，在 Go 语言中我们往往会使用如下所示的方式来表示数组类型：

```go
[10]int
[200]interface{}
```

与很多语言不同，Go 语言中数组在初始化之后大小就无法改变，存储元素类型相同、但是大小不同的数组类型在 Go 语言看来也是完全不同的，只有两个条件都相同才是同一个类型。

```go
func NewArray(elem *Type, bound int64) *Type {
	if bound < 0 {
		Fatalf("NewArray: invalid bound %v", bound)
	}
	t := New(TARRAY)
	t.Extra = &Array{Elem: elem, Bound: bound}
	t.SetNotInHeap(elem.NotInHeap())
	return t
}
```

编译期间的数组类型是由上述的 [`cmd/compile/internal/types.NewArray`](https://github.com/golang/go/blob/616c39f6a636166447bdaac4f0871a5ca52bae8c/src/cmd/compile/internal/types/type.go#L473-L481) 函数生成的，类型 `Array` 包含两个字段，一个是元素类型 `Elem`，另一个是数组的大小 `Bound`，这两个字段共同构成了数组类型，而当前数组是否应该在堆栈中初始化也在编译期就确定了。



## 初始化

Go 语言中的数组有两种不同的创建方式，一种是显式的指定数组的大小，另一种是使用 `[...]T` 声明数组，Go 语言会在编译期间通过源代码对数组的大小进行推断：

```go
arr1 := [3]int{1, 2, 3}
arr2 := [...]int{1, 2, 3}
```

上述两种声明方式在运行期间得到的结果是完全相同的，后一种声明方式在编译期间就会被『转换』成为前一种，这也就是编译器对数组大小的推导，下面我们来介绍编译器的推导过程。

### 上限推导

两种不同的声明方式会导致编译器做出完全不同的处理，如果我们使用第一种方式 `[10]T`，那么变量的类型在编译进行到类型检查阶段段就会被提取出来，随后会使用 [`cmd/compile/internal/types.NewArray`](https://github.com/golang/go/blob/616c39f6a636166447bdaac4f0871a5ca52bae8c/src/cmd/compile/internal/types/type.go#L473-L481) 函数创建包含数组大小的 `Array` 类型。

当我们使用 `[...]T` 的方式声明数组时，虽然在这一步也会创建一个 `Array` 类型 `Array{Elem: elem, Bound: -1}`，但是其中的数组大小上限会是 `-1`，这里的 `-1` 只是一个占位符，编译器会在后面的 [`cmd/compile/internal/gc.typecheckcomplit`](https://github.com/golang/go/blob/b7d097a4cf6b8a9125e4770b54d33826fa803023/src/cmd/compile/internal/gc/typecheck.go#L2755-L2961) 函数中对该数组的大小进行推导：

```go
func typecheckcomplit(n *Node) (res *Node) {
	...

	switch t.Etype {
	case TARRAY, TSLICE:
		var length, i int64
		nl := n.List.Slice()
		for i2, l := range nl {
			i++
			if i > length {
				length = i
			}
		}

		if t.IsDDDArray() {
			t.SetNumElem(length)
		}
	}
}
```

这个删减后的 [`cmd/compile/internal/gc.typecheckcomplit`](https://github.com/golang/go/blob/b7d097a4cf6b8a9125e4770b54d33826fa803023/src/cmd/compile/internal/gc/typecheck.go#L2755-L2961) 函数通过遍历元素的方式来计算数组中元素的数量。上述代码中的 `DDDArray` 指的就是使用 `[...]T` 声明的数组，因为声明这种数组时需要使用三个点（Dot），所以在编译器中就被称作 `DDDArray`。

所以我们可以看出 `[...]T{1, 2, 3}` 和 `[3]T{1, 2, 3}` 在运行时是完全等价的，`[...]T` 这种初始化方式也只是 Go 语言为我们提供的一种语法糖，当我们不想计算数组中的元素个数时就可以通过这种方法较少一些工作。