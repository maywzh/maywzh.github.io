---
title: Leetcode300.最长上升子序列
categories: 刷题
comments: false
thumbnail: https://i.loli.net/2020/09/02/A7PJcl2btayUY1K.jpg
cover: https://i.loli.net/2020/09/02/A7PJcl2btayUY1K.jpg
date: 2018-01-08 01:18:14
tags:
  - DP
---

经典DP问题之一——LIS。

<!--more-->

## 描述

### [300\. 最长上升子序列](https://leetcode-cn.com/problems/longest-increasing-subsequence/)

Difficulty: 中等


给定一个无序的整数数组，找到其中最长上升子序列的长度。

示例:

```
输入: [10,9,2,5,3,7,101,18]
输出: 4 
解释: 最长的上升子序列是 [2,3,7,101]，它的长度是 4。
```

说明:

*   可能会有多种最长上升子序列的组合，你只需要输出对应的长度即可。
*   你算法的时间复杂度应该为 O(_n<sup>2</sup>_) 。

进阶: 你能将算法的时间复杂度降低到 O(_n_ log _n_) 吗?



## 思路&题解

### 经典LIS

#### 思路

对于所有的DP问题，经典四步走：

1. 定义状态

   由于一个子序列一定会以一个数结尾，于是将状态定义成：`dp[i]` 表示以 `nums[i]` 结尾的「上升子序列」的长度。注意：这个定义中 ``nums[i]` 必须被选取，且必须是这个子序列的最后一个元素。

2. 考虑状态转移方程

   遍历到 `nums[i]` 时，需要把下标 `i` 之前的所有的数都看一遍；
   只要 `nums[i]` 严格大于在它位置之前的某个数，那么 `nums[i]` 就可以接在这个数后面形成一个更长的上升子序列；
   因此，`dp[i]` 就等于下标 i 之前严格小于` nums[i]` 的状态值的最大者 +1。
   因此我们可以写出下面的状态转移方程：

   $$dp[i]=\max \limits_{0\leq j<i, nums[j]<nums[i]}dp[j]+1$$

3. 考虑初始化

   dp[i] = 1，每个字符都至少构成长度为1的子序列

4. 输出

   状态数组 dp 的最大值才是最后要输出的值。

5. 状态压缩

   遍历到一个新数的时候，之前所有的状态值都得保留，因此无法压缩。

#### 代码

```go

func Max(x, y int) int {
    if x > y {
        return x
    }
    return y
}
func lengthOfLIS(nums []int) int {
    dp := make([]int, len(nums))
    if len(nums) == 0 {
        return 0
    }
    for i:=0; i< len(nums);i++ {
        dp[i] = 1
    }
    ans := 1
    // 要注意考虑特殊情况 例如长度为0 或 1
    for i:=1; i<len(nums); i++ {
        for j:=0; j<i; j++ {
            if nums[i] > nums[j] {
                dp[i] = Max(dp[i], dp[j]+1)
                ans = Max(dp[i], ans)
            }
        }
    }
    return ans
}

```

### 二分查找+贪心

#### 思路

题目中要找$O(nlogn)$的做法，考虑到二分查找的复杂度为$O(logn)$，所以可以考虑在第二层循环做文章，改成二分查找。

在这里，我们的出发点基于一个贪心的做法：结尾的数尽量小，遍历后接的数就有更大的可能性构成更长的序列。

我们可以记录长度固定的状况下，结尾最小的元素数值。

1. 定义状态

   `tail[i]`表示长度为`i+1`的所有上升子序列的结尾最小值。

   `tail[0]` 表示长度为 1 的所有上升子序列中，结尾最小的那个元素的数值，以题目中的示例为例 [10, 9, 2, 5, 3, 7, 101, 18] 中，容易发现长度为 2 的所有上升子序列中，结尾最小的是子序列 [2, 3] ，因此 tail[1] = 3
   下标和长度有一个 1 的偏差；

2. 状态转移方程

   这里可以证明`tail`严格上升。

   证明：对于任意下表$0 \leq i < j < len$，都有$tail[i]<tail[j]$

   假设对于任意$i<j$，存在`tail[i]>=tail[j]`

   对于`tail[i]`，对应一个上升子序列$[a_0,a_1,...,a_i]$，$tail[i]=a_i$

   对于`tail[j]`，对应一个上升子序列$[b_0,b_1,...,b_j]$，$tail[j]=b_j$

   由于`tail[i]>=tail[j]`，$a_i>b_j$。而在$[b_0,b_1,...,b_j]$中，$b_i<b_j$ ，则$a_i\geq b_j >b_i$，则上升子序列$[b_0,b_1,...,b_j]$是一个长度为`i+1`但结尾更小的数组，与假设矛盾，命题得证。

   根据命题，我们维护`tail`即可直接取得最长上升子序列的长度。

#### 算法

1、设置一个数组 tail，初始时为空；

注意：数组 `tail` 虽然是有序数组，但它不是问题中的「最长上升子序列」（下文还会强调），不能命名为 LIS。有序数组 tail 只是用于求解 LIS 问题的辅助数组。

2、在遍历数组 `nums` 的过程中，每来一个新数 num，如果这个数严格大于有序数组 `tail` 的最后一个元素，就把 num 放在有序数组 `tail` 的后面，否则进入第 3 点；

注意：这里的大于是「严格大于」，不包括等于的情况。

3、在有序数组`tail`中查找第 1 个等于大于 num 的那个数，试图让它变小；

如果有序数组 `tail` 中存在等于 num 的元素，什么都不做，因为以 num 结尾的最短的「上升子序列」已经存在；
如果有序数组 `tail` 中存在大于 num 的元素，找到第 1 个，让它变小，这样我们就找到了一个结尾更小的相同长度的上升子序列。
说明：我们再看一下数组 `tail[i]` 的定义：长度为 i + 1 的所有最长上升子序列的结尾的最小值。因此，在遍历的过程中，我们试图让一个大的值变小是合理的。

这一步可以认为是「贪心算法」，总是做出在当前看来最好的选择，当前「最好的选择」是：当前只让让第 1 个严格大于 `nums[i]` 的数变小，变成 `nums[i]`，这一步操作是“无后效性”的。

由于是在有序数组中的操作，因此可以使用「二分查找算法」。

4、遍历新的数 num ，先尝试上述第 2 点，第 2 点行不通则执行第 3 点，直到遍历完整个数组 nums，最终有序数组 tail 的长度，就是所求的“最长上升子序列”的长度。

第 3 步：思考初始化
`dp[0] = nums[0]`，在只有 1 个元素的情况下，它当然是长度为 1 并且结尾最小的元素。

第 4 步：思考输出
数组 `tail` 的长度，上文其实也已经说了，还是依据定义，`tail[i]` 表示长度固定为 i + 1 的所有「上升子序列」的结尾元素中最小的那个，长度最多就是数组 `tail` 的长度。

第 5 步：思考状态压缩
无法压缩。

下面看一下这个算法在示例上的的执行流程，以加深体会，我在示例的数组后面加上了 4、8、6、12，依然是先让幻灯片动起来，看思想就好了。

#### 代码

```java
public class Solution {
    public int lengthOfLIS(int[] nums) {
        int len = nums.length;
        if (len <= 1) {
            return len;
        }

        // tail 数组的定义：长度为 i + 1 的上升子序列的末尾最小是几
        int[] tail = new int[len];
        // 遍历第 1 个数，直接放在有序数组 tail 的开头
        tail[0] = nums[0];
        // end 表示有序数组 tail 的最后一个已经赋值元素的索引
        int end = 0;

        for (int i = 1; i < len; i++) {
            // 【逻辑 1】比 tail 数组实际有效的末尾的那个元素还大
            if (nums[i] > tail[end]) {
                // 直接添加在那个元素的后面，所以 end 先加 1
                end++;
                tail[end] = nums[i];
            } else {
                // 使用二分查找法，在有序数组 tail 中
                // 找到第 1 个大于等于 nums[i] 的元素，尝试让那个元素更小
                int left = 0;
                int right = end;
                while (left < right) {
                    // 选左中位数不是偶然，而是有原因的，原因请见 LeetCode 第 35 题题解
                    // int mid = left + (right - left) / 2;
                    int mid = left + ((right - left) >>> 1);
                    if (tail[mid] < nums[i]) {
                        // 中位数肯定不是要找的数，把它写在分支的前面
                        left = mid + 1;
                    } else {
                        right = mid;
                    }
                }
                // 走到这里是因为 【逻辑 1】 的反面，因此一定能找到第 1 个大于等于 nums[i] 的元素
                // 因此，无需再单独判断
                tail[left] = nums[i];
            }
            // 调试方法
            // printArray(nums[i], tail);
        }
        // 此时 end 是有序数组 tail 最后一个元素的索引
        // 题目要求返回的是长度，因此 +1 后返回
        end++;
        return end;
    }

    // 调试方法，以观察是否运行正确
    private void printArray(int num, int[] tail) {
        System.out.print("当前数字：" + num);
        System.out.print("\t当前 tail 数组：");
        int len = tail.length;
        for (int i = 0; i < len; i++) {
            if (tail[i] == 0) {
                break;
            }
            System.out.print(tail[i] + ", ");
        }
        System.out.println();
    }

    public static void main(String[] args) {
        int[] nums = new int[]{3, 5, 6, 2, 5, 4, 19, 5, 6, 7, 12};
        Solution solution = new Solution8();
        int lengthOfLIS = solution8.lengthOfLIS(nums);
        System.out.println("最长上升子序列的长度：" + lengthOfLIS);
    }
}
```

