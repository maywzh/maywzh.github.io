---
title: Go语言数组与切片
categories: 编程
comments: false
thumbnail: https://i.loli.net/2020/09/04/vY4eq6OIRotf19l.jpg
cover: https://i.loli.net/2020/09/04/vY4eq6OIRotf19l.jpg
date: 2020-01-05 15:47:08
tags:
  - Go
---

初学Go，对于数组与切片往往理解不清，在Python中，只有List这种数据结构，只有切片，而在Go中，作为一种编译性语言，数组与切片在底层原理上有所区别，在此需要结合编译运行时来介绍它们的实现原理。

<!--more-->

## 数组 

### 数组的数据结构与创建

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



### 初始化

Go 语言中的数组有两种不同的创建方式，一种是显式的指定数组的大小，另一种是使用 `[...]T` 声明数组，Go 语言会在编译期间通过源代码对数组的大小进行推断：

```go
arr1 := [3]int{1, 2, 3}
arr2 := [...]int{1, 2, 3}
```

上述两种声明方式在运行期间得到的结果是完全相同的，后一种声明方式在编译期间就会被『转换』成为前一种，这也就是编译器对数组大小的推导，下面我们来介绍编译器的推导过程。

#### 上限推导

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

#### 语句转换

对于一个由字面量组成的数组，根据数组元素数量的不同，编译器会在负责初始化字面量的 [`cmd/compile/internal/gc.anylit`](https://github.com/golang/go/blob/f07059d949057f414dd0f8303f93ca727d716c62/src/cmd/compile/internal/gc/sinit.go#L875-L967) 函数中做两种不同的优化：

1. 当元素数量小于或者等于 4 个时，会直接将数组中的元素放置在栈上；
2. 当元素数量大于 4 个时，会将数组中的元素放置到静态区并在运行时取出；

```go
func anylit(n *Node, var_ *Node, init *Nodes) {
	t := n.Type
	switch n.Op {
	case OSTRUCTLIT, OARRAYLIT:
		if n.List.Len() > 4 {
			...
		}

		fixedlit(inInitFunction, initKindLocalCode, n, var_, init)
	...
	}
}
```

当数组的元素**小于或者等于四个**时，[`cmd/compile/internal/gc.fixedlit`](https://github.com/golang/go/blob/f07059d949057f414dd0f8303f93ca727d716c62/src/cmd/compile/internal/gc/sinit.go#L515-L583) 会负责在函数编译之前将 `[3]{1, 2, 3}` 转换成更加原始的语句：

```go
func fixedlit(ctxt initContext, kind initKind, n *Node, var_ *Node, init *Nodes) {
	var splitnode func(*Node) (a *Node, value *Node)
	...

	for _, r := range n.List.Slice() {
		a, value := splitnode(r)
		a = nod(OAS, a, value)
		a = typecheck(a, ctxStmt)
		switch kind {
		case initKindStatic:
			genAsStatic(a)
		case initKindLocalCode:
			a = orderStmtInPlace(a, map[string][]*Node{})
			a = walkstmt(a)
			init.Append(a)
		}
	}
}
```

当数组中元素的个数小于四个时，[`cmd/compile/internal/gc.fixedlit`](https://github.com/golang/go/blob/f07059d949057f414dd0f8303f93ca727d716c62/src/cmd/compile/internal/gc/sinit.go#L515-L583) 函数接受的 `kind` 是 `initKindLocalCode`，上述代码会将原有的初始化语句 `[3]int{1, 2, 3}` 拆分成一个声明变量的表达式和几个赋值表达式，这些表达式会完成对数组的初始化：

```go
var arr [3]int
arr[0] = 1
arr[1] = 2
arr[2] = 3
```

但是如果当前数组的元素大于 4 个，`anylit` 方法会先获取一个唯一的 `staticname`，然后调用 [`cmd/compile/internal/gc.fixedlit`](https://github.com/golang/go/blob/f07059d949057f414dd0f8303f93ca727d716c62/src/cmd/compile/internal/gc/sinit.go#L515-L583) 函数在静态存储区初始化数组中的元素并将临时变量赋值给当前的数组：

```go
func anylit(n *Node, var_ *Node, init *Nodes) {
	t := n.Type
	switch n.Op {
	case OSTRUCTLIT, OARRAYLIT:
		if n.List.Len() > 4 {
			vstat := staticname(t)
			vstat.Name.SetReadonly(true)

			fixedlit(inNonInitFunction, initKindStatic, n, vstat, init)

			a := nod(OAS, var_, vstat)
			a = typecheck(a, ctxStmt)
			a = walkexpr(a, init)
			init.Append(a)
			break
		}
		
		...
	}
}
```

假设我们在代码中初始化 `[5]int{1, 2, 3, 4, 5}` 数组，那么我们可以将上述过程理解成以下的伪代码：

```go
var arr [5]int
statictmp_0[0] = 1
statictmp_0[1] = 2
statictmp_0[2] = 3
statictmp_0[3] = 4
statictmp_0[4] = 5
arr = statictmp_0
```

总结起来，如果数组中元素的个数小于或者等于 4 个，那么所有的变量会直接在栈上初始化，如果数组元素大于 4 个，变量就会在静态存储区初始化然后拷贝到栈上，这些转换后的代码才会继续进入[中间代码生成](https://draveness.me/golang/docs/part1-prerequisite/ch02-compile/golang-ir-ssa/)和[机器码生成](https://draveness.me/golang/docs/part1-prerequisite/ch02-compile/golang-machinecode/)两个阶段，最后生成可以执行的二进制文件。

### 访问和赋值

无论是在栈上还是静态存储区，数组在内存中其实就是一连串的内存空间，表示数组的方法就是一个指向数组开头的指针、数组中元素的数量以及数组中元素类型占的空间大小，如果我们不知道数组中元素的数量，访问时就可能发生越界，而如果不知道数组中元素类型的大小，就没有办法知道应该一次取出多少字节的数据，如果没有这些信息，我们就无法知道这片连续的内存空间到底存储了什么数据：

![golang-array-memory](https://i.loli.net/2020/09/04/5dHu9LZRQck3EKS.png)

数组访问越界是非常严重的错误，Go 语言中对越界的判断是可以在编译期间由静态类型检查完成的，[`cmd/compile/internal/gc.typecheck1`](https://github.com/golang/go/blob/b7d097a4cf6b8a9125e4770b54d33826fa803023/src/cmd/compile/internal/gc/typecheck.go#L327-L2081) 函数会对访问数组的索引进行验证：

```go
func typecheck1(n *Node, top int) (res *Node) {
	switch n.Op {
	case OINDEX:
		ok |= ctxExpr
		l := n.Left  // array
		r := n.Right // index
		switch n.Left.Type.Etype {
		case TSTRING, TARRAY, TSLICE:
			...
			if n.Right.Type != nil && !n.Right.Type.IsInteger() {
				yyerror("non-integer array index %v", n.Right)
				break
			}
			if !n.Bounded() && Isconst(n.Right, CTINT) {
				x := n.Right.Int64()
				if x < 0 {
					yyerror("invalid array index %v (index must be non-negative)", n.Right)
				} else if n.Left.Type.IsArray() && x >= n.Left.Type.NumElem() {
					yyerror("invalid array index %v (out of bounds for %d-element array)", n.Right, n.Left.Type.NumElem())
				}
			}
		}
	...
	}
}
```

1. 访问数组的索引是非整数时会直接报错 —— `non-integer array index %v`；
2. 访问数组的索引是负数时会直接报错 —— `"invalid array index %v (index must be non-negative)"`；
3. 访问数组的索引越界时会直接报错 —— `"invalid array index %v (out of bounds for %d-element array)"`；

数组和字符串的一些简单越界错误都会在编译期间发现，比如我们直接使用整数或者常量访问数组，但是如果使用变量去访问数组或者字符串时，编译器就无法发现对应的错误了，这时就需要 Go 语言运行时发挥作用了。

```go
arr[4]: invalid array index 4 (out of bounds for 3-element array)
arr[i]: panic: runtime error: index out of range [4] with length 3
```

Go 语言运行时在发现数组、切片和字符串的越界操作会由运行时的 `panicIndex` 和 [`runtime.goPanicIndex`](https://github.com/golang/go/blob/22d28a24c8b0d99f2ad6da5fe680fa3cfa216651/src/runtime/panic.go#L86-L89) 函数触发程序的运行时错误并导致崩溃退出：

```go
TEXT runtime·panicIndex(SB),NOSPLIT,$0-8
	MOVL	AX, x+0(FP)
	MOVL	CX, y+4(FP)
	JMP	runtime·goPanicIndex(SB)

func goPanicIndex(x int, y int) {
	panicCheck1(getcallerpc(), "index out of range")
	panic(boundsError{x: int64(x), signed: true, y: y, code: boundsIndex})
}
```

当数组的访问操作 `OINDEX` 成功通过编译器的检查之后，会被转换成几个 SSA 指令，假设我们有如下所示的 Go 语言代码，通过如下的方式进行编译会得到 `ssa.html` 文件：

```go
package check

func outOfRange() int {
	arr := [3]int{1, 2, 3}
	i := 4
	elem := arr[i]
	return elem
}

$ GOSSAFUNC=outOfRange go build array.go
dumped SSA to ./ssa.html
```

`start` 阶段生成的 SSA 代码就是优化之前的第一版中间代码，下面展示的部分就是 `elem := arr[i]` 对应的中间代码，在这段中间代码中我们发现 Go 语言为数组的访问操作生成了判断数组上限的指令 `IsInBounds` 以及当条件不满足时触发程序崩溃的 `PanicBounds` 指令：

```go
b1:
    ...
    v22 (6) = LocalAddr <*[3]int> {arr} v2 v20
    v23 (6) = IsInBounds <bool> v21 v11
If v23 → b2 b3 (likely) (6)

b2: ← b1-
    v26 (6) = PtrIndex <*int> v22 v21
    v27 (6) = Copy <mem> v20
    v28 (6) = Load <int> v26 v27 (elem[int])
    ...
Ret v30 (+7)

b3: ← b1-
    v24 (6) = Copy <mem> v20
    v25 (6) = PanicBounds <mem> [0] v21 v11 v24
Exit v25 (6)
```

`PanicBounds` 指令最终会被转换成上面提到的 `panicIndex` 函数，当数组下标没有越界时，编译器会先获取数组的内存地址和访问的下标，然后利用 `PtrIndex` 计算出目标元素的地址，再使用 `Load` 操作将指针中的元素加载到内存中。

当然只有当编译器无法对数组下标是否越界无法做出判断时才会加入 `PanicBounds` 指令交给运行时进行判断，在使用字面量整数访问数组下标时就会生成非常简单的中间代码，当我们将上述代码中的 `arr[i]` 改成 `arr[2]` 时，就会得到如下所示的代码：

```go
b1:
    ...
    v21 (5) = LocalAddr <*[3]int> {arr} v2 v20
    v22 (5) = PtrIndex <*int> v21 v14
    v23 (5) = Load <int> v22 v20 (elem[int])
    ...
```

Go 语言对于数组的访问还是有着比较多的检查的，它不仅会在编译期间提前发现一些简单的越界错误并插入用于检测数组上限的函数调用，而在运行期间这些插入的函数会负责保证不会发生越界错误。

数组的赋值和更新操作 `a[i] = 2` 也会生成 SSA 生成期间计算出数组当前元素的内存地址，然后修改当前内存地址的内容，这些赋值语句会被转换成如下所示的 SSA 操作：

```go
b1:
    ...
    v21 (5) = LocalAddr <*[3]int> {arr} v2 v19
    v22 (5) = PtrIndex <*int> v21 v13
    v23 (5) = Store <mem> {int} v22 v20 v19
    ...
```

赋值的过程中会先确定目标数组的地址，再通过 `PtrIndex` 获取目标元素的地址，最后使用 `Store` 指令将数据存入地址中，从上面的这些 SSA 代码中我们可以看出无论是数组的寻址还是赋值都是在编译阶段完成的，没有运行时的参与。

## 切片

更常用的数据结构其实是切片，切片就是动态数组，它的长度并不固定，我们可以随意向切片中追加元素，而切片会在容量不足时自动扩容。

在 Go 语言中，切片类型的声明方式与数组有一些相似，由于切片的长度是动态的，所以声明时只需要指定切片中的元素类型：

```go
[]int
[]interface{}
```

从切片的定义我们能推测出，切片在编译期间的生成的类型只会包含切片中的元素类型，即 `int` 或者 `interface{}` 等。[`cmd/compile/internal/types.NewSlice`](https://github.com/golang/go/blob/616c39f6a636166447bdaac4f0871a5ca52bae8c/src/cmd/compile/internal/types/type.go#L484-L496) 就是编译期间用于创建 `Slice` 类型的函数：

```go
func NewSlice(elem *Type) *Type {
	if t := elem.Cache.slice; t != nil {
		if t.Elem() != elem {
			Fatalf("elem mismatch")
		}
		return t
	}

	t := New(TSLICE)
	t.Extra = Slice{Elem: elem}
	elem.Cache.slice = t
	return t
}
```

上述方法返回的结构体 `TSLICE` 中的 `Extra` 字段是一个只包含切片内元素类型的 `Slice{Elem: elem}` 结构，也就是说**切片内元素的类型是在编译期间确定的**，编译器确定了类型之后，会将类型存储在 `Extra` 字段中帮助程序在运行时动态获取。

### 数据结构

编译期间的切片是 `Slice` 类型的，但是在运行时切片由如下的 `SliceHeader` 结构体表示，其中 `Data` 字段是指向数组的指针，`Len` 表示当前切片的长度，而 `Cap` 表示当前切片的容量，也就是 `Data` 数组的大小：

```go
type SliceHeader struct {
	Data uintptr
	Len  int
	Cap  int
}
```

`Data` 作为一个指针指向的数组是一片连续的内存空间，这片内存空间可以用于存储切片中保存的全部元素，数组中的元素只是逻辑上的概念，底层存储其实都是连续的，所以我们可以将切片理解成一片连续的内存空间加上长度与容量的标识。

![golang-slice-struct](https://i.loli.net/2020/09/04/xH4o6IVjtbU7Prk.png)

从上图我们会发现切片与数组的关系非常密切，切片引入了一个抽象层，提供了对数组中部分片段的引用，作为数组的引用，我们可以在运行区间可以修改它的长度，如果底层的数组长度不足就会触发扩容机制，切片中的数组就会发生变化，不过在上层看来切片时没有变化的，上层只需要与切片打交道不需要关心底层的数组变化。

我们在上一节介绍过，获取数组大小、对数组中的元素的读写在编译期间就已经进行了简化，由于数组的内存固定且连续，很多操作都会变成对内存的直接读写。但是切片是运行时才会确定内容的结构，所有的操作还需要依赖 Go 语言的运行时来完成，我们接下来就会介绍切片一些常见操作的实现原理。

### 初始化

Go 语言中的切片有三种初始化的方式：

1. 通过下标的方式获得数组或者切片的一部分；

2. 使用字面量初始化新的切片；

3. 使用关键字 `make` 创建切片：

   ```go
   arr[0:3] or slice[0:3]
   slice := []int{1, 2, 3}
   slice := make([]int, 10)
   ```

#### 使用下标

使用下标创建切片是最原始也最接近汇编语言的方式，它是所有方法中最为底层的一种，`arr[0:3]` 或者 `slice[0:3]` 这些操作会由编译器转换成 `OpSliceMake` 操作，我们可以通过下面的代码来验证一下：

```go
// ch03/op_slice_make.go
package opslicemake

func newSlice() []int {
	arr := [3]int{1, 2, 3}
	slice := arr[0:1]
	return slice
}
```

通过 `GOSSAFUNC` 变量编译上述代码可以得到如下所示的 SSA 中间代码，在[中间代码生成](https://draveness.me/golang/docs/part1-prerequisite/ch02-compile/golang-ir-ssa/)的 `decompose builtin` 阶段，`slice := arr[0:1]` 对应的部分：

```go
v27 (+5) = SliceMake <[]int> v11 v14 v17

name &arr[*[3]int]: v11
name slice.ptr[*int]: v11
name slice.len[int]: v14
name slice.cap[int]: v17
```

`SliceMake` 这个操作会接受三个参数创建新的切片，元素类型、数组指针、切片大小和容量，这也就是我们在数据结构一节中提到的切片的几个字段。

#### 字面量

当我们使用字面量 `[]int{1, 2, 3}` 创建新的切片时，[`cmd/compile/internal/gc.slicelit`](https://github.com/golang/go/blob/f07059d949057f414dd0f8303f93ca727d716c62/src/cmd/compile/internal/gc/sinit.go#L595-L766) 函数会在编译期间将它展开成如下所示的代码片段：

```go
var vstat [3]int
vstat[0] = 1
vstat[1] = 2
vstat[2] = 3
var vauto *[3]int = new([3]int)
*vauto = vstat
slice := vauto[:]
```

1. 根据切片中的元素数量对底层数组的大小进行推断并创建一个数组；
2. 将这些字面量元素存储到初始化的数组中；
3. 创建一个同样指向 `[3]int` 类型的数组指针；
4. 将静态存储区的数组 `vstat` 赋值给 `vauto` 指针所在的地址；
5. 通过 `[:]` 操作获取一个底层使用 `vauto` 的切片；

第 5 步中的 `[:]` 就是使用下标创建切片的方法，从这一点我们也能看出 `[:]` 操作是创建切片最底层的一种方法。

#### 关键字

如果使用字面量的方式创建切片，大部分的工作就都会在编译期间完成，但是当我们使用 `make` 关键字创建切片时，很多工作都需要运行时的参与；调用方必须在 `make` 函数中传入一个切片的大小以及可选的容量，[`cmd/compile/internal/gc.typecheck1`](https://github.com/golang/go/blob/b7d097a4cf6b8a9125e4770b54d33826fa803023/src/cmd/compile/internal/gc/typecheck.go#L327-L2126) 会对参数进行校验：

```go
func typecheck1(n *Node, top int) (res *Node) {
	switch n.Op {
	...
	case OMAKE:
		args := n.List.Slice()

		i := 1
		switch t.Etype {
		case TSLICE:
			if i >= len(args) {
				yyerror("missing len argument to make(%v)", t)
				return n
			}

			l = args[i]
			i++
			var r *Node
			if i < len(args) {
				r = args[i]
			}
			...
			if Isconst(l, CTINT) && r != nil && Isconst(r, CTINT) && l.Val().U.(*Mpint).Cmp(r.Val().U.(*Mpint)) > 0 {
				yyerror("len larger than cap in make(%v)", t)
				return n
			}

			n.Left = l
			n.Right = r
			n.Op = OMAKESLICE
		}
	...
	}
}
```

上述函数不仅会检查 `len` 是否传入，还会保证传入的容量 `cap` 一定大于或者等于 `len`，除了校验参数之外，当前函数会将 `OMAKE` 节点转换成 `OMAKESLICE`，随后的中间代码生成阶段在 [`cmd/compile/internal/gc.walkexpr`](https://github.com/golang/go/blob/4d5bb9c60905b162da8b767a8a133f6b4edcaa65/src/cmd/compile/internal/gc/walk.go#L439-L1532) 函数中的 [`OMAKESLICE`](https://github.com/golang/go/blob/4d5bb9c60905b162da8b767a8a133f6b4edcaa65/src/cmd/compile/internal/gc/walk.go#L1315) 分支依据两个重要条件对这里的 `OMAKESLICE` 进行转换：

1. 切片的大小和容量是否足够小；
2. 切片是否发生了逃逸，最终在堆上初始化

当切片发生逃逸或者非常大时，我们需要 [`runtime.makeslice`](https://github.com/golang/go/blob/440f7d64048cd94cba669e16fe92137ce6b84073/src/runtime/slice.go#L34-L50) 函数在堆上初始化，如果当前的切片不会发生逃逸并且切片非常小的时候，`make([]int, 3, 4)` 会被直接转换成如下所示的代码：

```go
var arr [4]int
n := arr[:3]
```

上述代码会初始化数组并且直接通过下标 `[:3]` 来得到数组的切片，这两部分操作都会在编译阶段完成，编译器会在栈上或者静态存储区创建数组，`[:3]` 会被转换成上一节提到的 `OpSliceMake` 操作。

分析了主要由编译器处理的分支之后，我们回到用于创建切片的运行时函数 [`runtime.makeslice`](https://github.com/golang/go/blob/440f7d64048cd94cba669e16fe92137ce6b84073/src/runtime/slice.go#L34-L50)，这个函数的实现非常简单：

```go
func makeslice(et *_type, len, cap int) unsafe.Pointer {
	mem, overflow := math.MulUintptr(et.size, uintptr(cap))
	if overflow || mem > maxAlloc || len < 0 || len > cap {
		mem, overflow := math.MulUintptr(et.size, uintptr(len))
		if overflow || mem > maxAlloc || len < 0 {
			panicmakeslicelen()
		}
		panicmakeslicecap()
	}

	return mallocgc(mem, et, true)
}
```

它的主要工作就是计算当前切片占用的内存空间并在堆上申请一片连续的内存，它使用如下的方式计算占用的内存：

```
内存空间 = 切片中元素大小 x 切片容量
```

虽然大多的错误都可以在编译期间被检查出来，但是在创建切片的过程中如果发生了以下错误就会直接导致程序触发运行时错误并崩溃：

1. 内存空间的大小发生了溢出；
2. 申请的内存大于最大可分配的内存；
3. 传入的长度小于 0 或者长度大于容量；

`mallocgc` 就是用于申请内存的函数，这个函数的实现还是比较复杂，如果遇到了比较小的对象会直接初始化在 Go 语言调度器里面的 P 结构中，而大于 32KB 的一些对象会在堆上初始化，我们会在后面的章节中详细介绍 Go 语言的内存分配器，在这里就不展开分析了。

目前的 [`runtime.makeslice`](https://github.com/golang/go/blob/440f7d64048cd94cba669e16fe92137ce6b84073/src/runtime/slice.go#L34-L50) 会返回指向底层数组的指针，之前版本的 Go 语言中，数组指针、长度和容量会被合成一个 `slice` 结构并返回，但是从 [cmd/compile: move slice construction to callers of makeslice](https://github.com/golang/go/commit/020a18c545bf49ffc087ca93cd238195d8dcc411#diff-d9238ca551e72b3a80da9e0da10586a4) 这次提交之后，构建结构体 `SliceHeader` 的工作就都交给 [`runtime.makeslice`](https://github.com/golang/go/blob/440f7d64048cd94cba669e16fe92137ce6b84073/src/runtime/slice.go#L34-L50) 的调用方处理了，这些调用方会在编译期间构建切片结构体：

```go
func typecheck1(n *Node, top int) (res *Node) {
	switch n.Op {
	...
	case OSLICEHEADER:
	switch 
		t := n.Type
		n.Left = typecheck(n.Left, ctxExpr)
		l := typecheck(n.List.First(), ctxExpr)
		c := typecheck(n.List.Second(), ctxExpr)
		l = defaultlit(l, types.Types[TINT])
		c = defaultlit(c, types.Types[TINT])

		n.List.SetFirst(l)
		n.List.SetSecond(c)
	...
	}
}
```

`OSLICEHEADER` 操作会创建我们在上面介绍过的结构体 `SliceHeader`，其中包含数组指针、切片长度和容量，它也是切片在运行时的表示：

```go
type SliceHeader struct {
	Data uintptr
	Len  int
	Cap  int
}
```

正是因为大多数对切片类型的操作并不需要直接操作原 `slice` 结构体，所以 `SliceHeader` 的引入能够减少切片初始化时的少量开销，这个改动能够减少 ~0.2% 的 Go 语言包大小并且能够减少 92 个 `panicindex` 的调用，占整个 Go 语言二进制的 ~3.5%。



### 访问元素

对切片常见的操作就是获取它的长度或者容量，这两个不同的函数 `len` 和 `cap` 被 Go 语言的编译器看成是两种特殊的操作，即 `OLEN` 和 `OCAP`，它们会在 [SSA 生成阶段](https://draveness.me/golang/docs/part1-prerequisite/ch02-compile/golang-ir-ssa/)被 [`cmd/compile/internal/gc.epxr`](https://github.com/golang/go/blob/a037582efff56082631508b15b287494df6e9b69/src/cmd/compile/internal/gc/ssa.go#L1975-L2724) 函数转换成 `OpSliceLen` 和 `OpSliceCap` 操作：

```go
func (s *state) expr(n *Node) *ssa.Value {
	switch n.Op {
	case OLEN, OCAP:
		switch {
		case n.Left.Type.IsSlice():
			op := ssa.OpSliceLen
			if n.Op == OCAP {
				op = ssa.OpSliceCap
			}
			return s.newValue1(op, types.Types[TINT], s.expr(n.Left))
		...
		}
	...
	}
}
```

访问切片中的字段可能会触发 `decompose builtin` 阶段的优化，`len(slice)` 或者 `cap(slice)` 在一些情况下会被直接替换成切片的长度或者容量，不需要运行时从切片结构中获取：

```go
(SlicePtr (SliceMake ptr _ _ )) -> ptr
(SliceLen (SliceMake _ len _)) -> len
(SliceCap (SliceMake _ _ cap)) -> cap
```

除了获取切片的长度和容量之外，访问切片中元素使用的 `OINDEX` 操作也会在中间代码生成期间转换成对地址的直接访问：

```go
func (s *state) expr(n *Node) *ssa.Value {
	switch n.Op {
	case OINDEX:
		switch {
		case n.Left.Type.IsSlice():
			p := s.addr(n, false)
			return s.load(n.Left.Type.Elem(), p)
		...
		}
	...
	}
}
```

切片的操作基本都是在编译期间完成的，除了访问切片的长度、容量或者其中的元素之外，使用 `range` 遍历切片时也会在编译期间转换成形式更简单的代码，我们会在后面的 `range` 关键字一节中介绍使用 `range` 遍历切片的过程。

### 追加和扩容

向切片中追加元素应该是最常见的切片操作，在 Go 语言中我们会使用 `append` 关键字向切片追加元素，中间代码生成阶段的 [`cmd/compile/internal/gc.state.append`](https://github.com/golang/go/blob/a037582efff56082631508b15b287494df6e9b69/src/cmd/compile/internal/gc/ssa.go#L2732-L2884) 方法会拆分 `append` 关键字，该方法追加元素会根据返回值是否会覆盖原变量，分别进入两种流程，如果 `append` 返回的『新切片』不需要赋值回原有的变量，就会进入如下的处理流程：

```go
// append(slice, 1, 2, 3)
ptr, len, cap := slice
newlen := len + 3
if newlen > cap {
    ptr, len, cap = growslice(slice, newlen)
    newlen = len + 3
}
*(ptr+len) = 1
*(ptr+len+1) = 2
*(ptr+len+2) = 3
return makeslice(ptr, newlen, cap)
```

**我们会先对切片结构体进行解构获取它的数组指针、大小和容量，如果在追加元素后切片的大小大于容量，那么就会调用 [`runtime.growslice`](https://github.com/golang/go/blob/440f7d64048cd94cba669e16fe92137ce6b84073/src/runtime/slice.go#L76-L191) 对切片进行扩容并将新的元素依次加入切片；如果 `append` 后的切片会覆盖原切片，即 `slice = append(slice, 1, 2, 3)`， [`cmd/compile/internal/gc.state.append`](https://github.com/golang/go/blob/a037582efff56082631508b15b287494df6e9b69/src/cmd/compile/internal/gc/ssa.go#L2732-L2884) 就会使用另一种方式改写关键字：**

```go
// slice = append(slice, 1, 2, 3)
a := &slice
ptr, len, cap := slice
newlen := len + 3
if uint(newlen) > uint(cap) {
   newptr, len, newcap = growslice(slice, newlen)
   vardef(a)
   *a.cap = newcap
   *a.ptr = newptr
}
newlen = len + 3
*a.len = newlen
*(ptr+len) = 1
*(ptr+len+1) = 2
*(ptr+len+2) = 3
```

是否覆盖原变量的逻辑其实差不多，最大的区别在于最后的结果是不是赋值会原有的变量，如果我们选择覆盖原有的变量，也不需要担心切片的拷贝，因为 Go 语言的编译器已经对这种情况作了优化。

![golang-slice-append](https://i.loli.net/2020/09/04/iNK7eyh8BL6obQA.png)

到这里我们已经通过 `append` 关键字被转换的控制流了解了在切片容量足够时如何向切片中追加元素，但是当切片的容量不足时就会调用 [`runtime.growslice`](https://github.com/golang/go/blob/440f7d64048cd94cba669e16fe92137ce6b84073/src/runtime/slice.go#L76-L191) 函数为切片扩容，扩容就是为切片分配一块新的内存空间并将原切片的元素全部拷贝过去，我们分几部分分析该方法：

```go
func growslice(et *_type, old slice, cap int) slice {
	newcap := old.cap
	doublecap := newcap + newcap
	if cap > doublecap {
		newcap = cap
	} else {
		if old.len < 1024 {
			newcap = doublecap
		} else {
			for 0 < newcap && newcap < cap {
				newcap += newcap / 4
			}
			if newcap <= 0 {
				newcap = cap
			}
		}
	}
```

在分配内存空间之前需要先确定新的切片容量，Go 语言根据切片的当前容量选择不同的策略进行扩容：

1. 如果期望容量大于当前容量的两倍就会使用期望容量；
2. 如果当前切片的长度小于 1024 就会将容量翻倍；
3. 如果当前切片的长度大于 1024 就会每次增加 25% 的容量，直到新容量大于期望容量；

确定了切片的容量之后，就可以计算切片中新数组占用的内存了，计算的方法就是将目标容量和元素大小相乘，计算新容量时可能会发生溢出或者请求的内存超过上限，在这时就会直接 `panic`，不过相关的代码在这里就被省略了：

```go
	var overflow bool
	var newlenmem, capmem uintptr
	switch {
	...
	default:
		lenmem = uintptr(old.len) * et.size
		newlenmem = uintptr(cap) * et.size
		capmem, _ = math.MulUintptr(et.size, uintptr(newcap))
		capmem = roundupsize(capmem)
		newcap = int(capmem / et.size)
	}
	...
	var p unsafe.Pointer
	if et.kind&kindNoPointers != 0 {
		p = mallocgc(capmem, nil, false)
		memclrNoHeapPointers(add(p, newlenmem), capmem-newlenmem)
	} else {
		p = mallocgc(capmem, et, true)
		if writeBarrier.enabled {
			bulkBarrierPreWriteSrcOnly(uintptr(p), uintptr(old.array), lenmem)
		}
	}
	memmove(p, old.array, lenmem)
	return slice{p, old.len, newcap}
}
```

如果切片中元素不是指针类型，那么就会调用 `memclrNoHeapPointers` 将超出切片当前长度的位置清空并在最后使用 `memmove` 将原数组内存中的内容拷贝到新申请的内存中。这里的 `memclrNoHeapPointers` 和 `memmove` 都是用目标机器上的汇编指令实现的。

[`runtime.growslice`](https://github.com/golang/go/blob/440f7d64048cd94cba669e16fe92137ce6b84073/src/runtime/slice.go#L76-L191) 函数最终会返回一个新的 `slice` 结构，其中包含了新的数组指针、大小和容量，这个返回的三元组最终会改变原有的切片，帮助 `append` 完成元素追加的功能。

### 拷贝切片

切片的拷贝虽然不是一个常见的操作类型，但是却是我们学习切片实现原理必须要谈及的一个问题，当我们使用 `copy(a, b)` 的形式对切片进行拷贝时，编译期间的 [`cmd/compile/internal/gc.copyany`](https://github.com/golang/go/blob/bf4990522263503a1219372cd8f1ee9422b51324/src/cmd/compile/internal/gc/walk.go#L2980-L3040) 函数也会分两种情况进行处理，如果当前 `copy` 不是在运行时调用的，`copy(a, b)` 会被直接转换成下面的代码：

```go
n := len(a)
if n > len(b) {
    n = len(b)
}
if a.ptr != b.ptr {
    memmove(a.ptr, b.ptr, n*sizeof(elem(a))) 
}
```

其中 `memmove` 会负责对内存进行拷贝，在其他情况下，编译器会使用 [`runtime.slicecopy`](https://github.com/golang/go/blob/440f7d64048cd94cba669e16fe92137ce6b84073/src/runtime/slice.go#L197-L230) 函数替换运行期间调用的 `copy`，例如：`go copy(a, b)`：

```go
func slicecopy(to, fm slice, width uintptr) int {
	if fm.len == 0 || to.len == 0 {
		return 0
	}
	n := fm.len
	if to.len < n {
		n = to.len
	}
	if width == 0 {
		return n
	}
	...

	size := uintptr(n) * width
	if size == 1 {
		*(*byte)(to.array) = *(*byte)(fm.array)
	} else {
		memmove(to.array, fm.array, size)
	}
	return n
}
```

上述函数的实现非常直接，两种不同的拷贝方式一般都会通过 `memmove` 将整块内存中的内容拷贝到目标的内存区域中：

![golang-slice-copy](https://i.loli.net/2020/09/04/FyjzandcAUmoJB8.png)

相比于依次对元素进行拷贝，这种方式能够提供更好的性能，但是需要注意的是，哪怕使用 `memmove` 对内存成块进行拷贝，但是这个操作还是会占用非常多的资源，在大切片上执行拷贝操作时一定要注意性能影响。



## 总结

数组是 Go 语言中重要的数据结构，了解它的实现能够帮助我们更好地理解这门语言，通过对其实现的分析，我们知道了对数组的访问和赋值需要同时依赖编译器和运行时，它的大多数操作在编译期间都会转换成对内存的直接读写，在中间代码生成期间，编译器还会插入运行时方法 `panicIndex` 调用防止发生越界错误。

切片的很多功能都是在运行时实现的了，无论是初始化切片，还是对切片进行追加或扩容都需要运行时的支持，需要注意的是在遇到大切片扩容或者复制时可能会发生大规模的内存拷贝，一定要在使用时减少这种情况的发生避免对程序的性能造成影响。

## 参考

- [Arrays, slices (and strings): The mechanics of ‘append’](https://blog.golang.org/slices)
- [Array vs Slice: accessing speed](https://stackoverflow.com/questions/30525184/array-vs-slice-accessing-speed)
- [Arrays, slices (and strings): The mechanics of ‘append’](https://blog.golang.org/slices)
- [Go Slices: usage and internals](https://blog.golang.org/go-slices-usage-and-internals)
- [Array vs Slice: accessing speed](https://stackoverflow.com/questions/30525184/array-vs-slice-accessing-speed)