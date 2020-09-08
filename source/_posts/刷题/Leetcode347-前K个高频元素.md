---
title: Leetcode347.前K个高频元素
categories: 刷题
comments: false
thumbnail: https://i.loli.net/2020/09/02/A7PJcl2btayUY1K.jpg
cover: https://i.loli.net/2020/09/02/A7PJcl2btayUY1K.jpg
date: 2018-01-08 02:11:29
tags:
  - 堆
  - 哈希表
  - 算法
---



<!--more-->

## 描述

### [347\. 前 K 个高频元素](https://leetcode-cn.com/problems/top-k-frequent-elements/)

Difficulty: **中等**


给定一个非空的整数数组，返回其中出现频率前 **k**高的元素。

**示例 1:**

```
输入: nums = [1,1,1,2,2,3], k = 2
输出: [1,2]
```

**示例 2:**

```
输入: nums = [1], k = 1
输出: [1]
```

**提示：**

*   你可以假设给定的 k 总是合理的，且$1\leq k\leq m$, m为数组中不相同的元素的个数。
*   你的算法的时间复杂度**必须**优于 $O(nlogn)$ , n是数组的大小。
*   题目数据保证答案唯一，换句话说，数组中前 k 个高频元素的集合是唯一的。
*   你可以按任意顺序返回答案。

## 题解

### 思路

遍历数组，记录每个数字出现的次数，保存在哈希表中，这样的时间复杂度为$O(n)$。

我们只需要找出这个哈希表中值最大的k个。

在这里我们可以用堆来排序。建立一个小顶堆，遍历出现次数数组。

- 堆元素个数小于k，入堆
- 堆元素等于k，检查堆顶与当前出现次数的大小，堆顶更大，则至少有k个数字出现次数比当前值大，舍弃当前值，否则弹出堆顶，插入当前值到堆。

遍历完成后，堆中元素纪委出现次数数组前k大的值。

遍历数组，用哈希表的记录时间为$O(n)$，遍历出现次数数组，建立大小为k的堆，每次堆操作为时间复杂度为$O(logk)$，n次操作为$O(nlogk)$，总时间复杂度为$O(n)+O(nlogk)=O(n)$

### 代码

```go
func topKFrequent(nums []int, k int) []int {
    occurrences := map[int]int{}
    for _, num := range nums {
        occurrences[num]++
    }
    h := &IHeap{}
    heap.Init(h)
    for key, value := range occurrences {
        heap.Push(h, [2]int{key, value})
        if h.Len() > k {
            heap.Pop(h)
        }
    }
    ret := make([]int, k)
    for i := 0; i < k; i++ {
        ret[k - i - 1] = heap.Pop(h).([2]int)[0]
    }
    return ret
}

type IHeap [][2]int

func (h IHeap) Len() int           { return len(h) }
func (h IHeap) Less(i, j int) bool { return h[i][1] < h[j][1] }
func (h IHeap) Swap(i, j int)      { h[i], h[j] = h[j], h[i] }

func (h *IHeap) Push(x interface{}) {
    *h = append(*h, x.([2]int))
}
```





