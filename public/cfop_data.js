// ==========================================
// CFOP 119 公式数据库 (底十字, F2L, OLL, PLL)
// ==========================================

const CFOP_CROSS = {
    title: "C - 底十字 (Cross) 核心还原思路",
    concept: "底十字是 CFOP 法的第一步，目标是在底层（通常为白色面）拼出一个正确的十字，并保证十字边块的侧面颜色与四个侧面（红、蓝、橙、绿）的中心块颜色相对应。",
    steps: [
        "**1. 在底层直接做十字 (Cross at Bottom)**: 尽量不要在顶层做黄花（小花）然后再转到底部，这会浪费极多的步数。在练习时应直接在底层规划并完成十字。",
        "**2. 限制在 8 步之内解决**: 数学上已经证明，任何三阶魔方的底十字都可以在 8 步之内拼完，99% 的情况可以在 7 步内解决。如果你做十字超过 8 步，说明思路有优化的空间。",
        "**3. 利用 15 秒观察时间 (Inspection)**: 在计时开始前，利用观察时间将 4 个底十字棱块在脑海中做完整的步骤规划。高级选手可以在观察期直接推导并记住全部十字步骤，闭眼即可完成十字。",
        "**4. 配色相对位置记忆 (Color Neutrality / Relative Positions)**: 熟记白底时侧面的配色顺序（红、蓝、橙、绿，顺时针）。如果一时间无法对齐中心块，可以先把十字棱块的相对顺序做好，最后转动底层对齐中心块（D 或 D' 调整）。",
        "**5. 指法优化**: 练习十字时尽量减少手部无意义的旋转（Rotation），用手指做双重转动（如 D2, U2 用双指流利完成），保持视野开阔，为下一步 F2L 寻找角棱块组做好“看前（Look-ahead）”准备。"
    ]
};

const CFOP_F2L = [
    // 1-4: 基本插入
    { id: "F2L 1", category: "基本插入", name: "右侧基本插入", formula: "R U R'" },
    { id: "F2L 2", category: "基本插入", name: "左侧基本插入", formula: "L' U' L" },
    { id: "F2L 3", category: "基本插入", name: "右后插入", formula: "R' U' R" },
    { id: "F2L 4", category: "基本插入", name: "左后插入", formula: "L U L'" },
    // 5-8: 角在底，棱在顶
    { id: "F2L 5", category: "角在底，棱在顶", name: "角白朝右，棱在上", formula: "U' R U R' U R U R'" },
    { id: "F2L 6", category: "角在底，棱在顶", name: "角白朝前，棱在上", formula: "U L' U' L U' L' U' L" },
    { id: "F2L 7", category: "角在底，棱在顶", name: "角白朝右，棱在正确位反转", formula: "R U R' U' R U2 R' U' R U R'" },
    { id: "F2L 8", category: "角在底，棱在顶", name: "角白朝前，棱在正确位反转", formula: "L' U' L U L' U2 L U L' U' L" },
    // 9-14: 棱在底，角在顶
    { id: "F2L 9", category: "棱在底，角在顶", name: "棱在底，角在上且白朝右", formula: "U R U' R' U' f R' f'" },
    { id: "F2L 10", category: "棱在底，角在顶", name: "棱在底，角在上且白朝前", formula: "U' L' U L U f' L f" },
    { id: "F2L 11", category: "棱在底，角在顶", name: "棱在底，角在上且白朝上", formula: "R U' R' U R U' R'" },
    { id: "F2L 12", category: "棱在底，角在顶", name: "棱反转在底，角在上白朝右", formula: "R U R' U' R U R' U' R U R'" },
    { id: "F2L 13", category: "棱在底，角在顶", name: "棱反转在底，角在上白朝前", formula: "L' U' L U L' U' L U L' U' L" },
    { id: "F2L 14", category: "棱在底，角在顶", name: "棱反转在底，角在上白朝上", formula: "R U R' U' R U2 R' U' R U R'" },
    // 15-30: 角和棱都在顶层
    { id: "F2L 15", category: "角和棱都在顶层", name: "角白朝右，侧面颜色不同", formula: "R U' R'" },
    { id: "F2L 16", category: "角和棱都在顶层", name: "角白朝前，侧面颜色不同", formula: "L' U L" },
    { id: "F2L 17", category: "角和棱都在顶层", name: "角白朝右，侧面颜色相同", formula: "U' R U2 R' U2 R U' R'" },
    { id: "F2L 18", category: "角和棱都在顶层", name: "角白朝前，侧面颜色相同", formula: "U L' U2 L U2 L' U L" },
    { id: "F2L 19", category: "角和棱都在顶层", name: "角白朝上，侧面颜色与棱相连", formula: "U R U2' R' U R U' R'" },
    { id: "F2L 20", category: "角和棱都在顶层", name: "角白朝上，侧面颜色与棱独立", formula: "U' L' U2 L U' L' U L" },
    { id: "F2L 21", category: "角和棱都在顶层", name: "角白朝右，棱反向分开", formula: "U R U' R' U2 R U' R'" },
    { id: "F2L 22", category: "角和棱都在顶层", name: "角白朝前，棱反向分开", formula: "U' L' U L U2 L' U L" },
    { id: "F2L 23", category: "角和棱都在顶层", name: "角白朝右，棱同向分开", formula: "R U R' U2 R U' R'" },
    { id: "F2L 24", category: "角和棱都在顶层", name: "角白朝前，棱同向分开", formula: "L' U' L U2 L' U L" },
    { id: "F2L 25", category: "角和棱都在顶层", name: "角白朝右，角棱已连接且颜色错开", formula: "R U' R' U2 R U R'" },
    { id: "F2L 26", category: "角和棱都在顶层", name: "角白朝前，角棱已连接且颜色错开", formula: "L' U L U2 L' U' L" },
    { id: "F2L 27", category: "角和棱都在顶层", name: "角白朝右，角棱已连接且颜色一致", formula: "U' R U R' U2 R U' R'" },
    { id: "F2L 28", category: "角和棱都在顶层", name: "角白朝前，角棱已连接且颜色一致", formula: "U L' U' L U2 L' U L" },
    { id: "F2L 29", category: "角和棱都在顶层", name: "角白朝上，顶色相同但分开", formula: "R U2 R' U' R U R'" },
    { id: "F2L 30", category: "角和棱都在顶层", name: "角白朝上，顶色不同但分开", formula: "L' U2 L U L' U' L" },
    // 31-41: 双块都在槽内
    { id: "F2L 31", category: "双块都在槽内", name: "角和棱都在槽内且正确对齐", formula: "R U' R' U R U2 R' U R U' R'" },
    { id: "F2L 32", category: "双块都在槽内", name: "角和棱在槽内但方向反转", formula: "R U R' U' R U' R' U2 R U' R'" },
    { id: "F2L 33", category: "双块都在槽内", name: "角位置对，棱反向并在槽内", formula: "R U' R' U f R' f' R U R'" },
    { id: "F2L 34", category: "双块都在槽内", name: "角反向，棱在槽内", formula: "R U R' U' f R' f' U R U' R'" },
    { id: "F2L 35", category: "双块都在槽内", name: "角在槽内，棱在顶层分开", formula: "R U' R' U R U R' U' R U' R'" },
    { id: "F2L 36", category: "双块都在槽内", name: "角在槽内，棱在顶层已对齐", formula: "R' F R F' R U R'" },
    { id: "F2L 37", category: "双块都在槽内", name: "角在槽内白朝前，棱在顶层已对齐", formula: "R U' R' U2 R U' R' U R U R'" },
    { id: "F2L 38", category: "双块都在槽内", name: "角在槽内白朝前，棱在顶层反转", formula: "L' U L U2 L' U L U' L' U' L" },
    { id: "F2L 39", category: "双块都在槽内", name: "角和棱均在槽内但方向全错", formula: "R U R' U' f R' f' R U' R' U R U R'" },
    { id: "F2L 40", category: "双块都在槽内", name: "角和棱在错位槽中，白朝右", formula: "R U' R' U' R U R' U2 R U' R'" },
    { id: "F2L 41", category: "双块都在槽内", name: "角和棱在错位槽中，白朝前", formula: "L' U L U L' U' L U2 L' U L" }
];

const CFOP_OLL = [
    // 点字形 (OLL 1 - 8)
    { id: "OLL 1", category: "点字形", name: "纯点一式 (十字未好，角均未朝上)", formula: "R U2 R2' F R F' U2 R' F R F'" },
    { id: "OLL 2", category: "点字形", name: "点字二式 (带一角朝上)", formula: "F R U R' U' F' f R U R' U' f'" },
    { id: "OLL 3", category: "点字形", name: "点字三式 (直角L形加点)", formula: "f R U R' U' f' U' F R U R' U' F'" },
    { id: "OLL 4", category: "点字形", name: "点字四式 (对称L形加点)", formula: "f R U R' U' f' U F R U R' U' F'" },
    { id: "OLL 5", category: "点字形", name: "拐角一式", formula: "r' U2 R U R' U r" },
    { id: "OLL 6", category: "点字形", name: "拐角二式", formula: "r U2 R' U' R U' r'" },
    { id: "OLL 7", category: "点字形", name: "点形七式", formula: "r U R' U R U2 r'" },
    { id: "OLL 8", category: "点字形", name: "点形八式", formula: "r' U' R U' R' U2 r" },
    
    // 线条形 (OLL 9 - 16)
    { id: "OLL 9", category: "线条形", name: "一字一式 (顶部一横线，角全错)", formula: "R U R' U' R' F R2 U R' U' F'" },
    { id: "OLL 10", category: "线条形", name: "一字二式 (顶部一横线，两角好)", formula: "R U R' U R' F R F' R U2 R'" },
    { id: "OLL 11", category: "线条形", name: "一字三式", formula: "r U R' U R U' R' U R U2' r'" },
    { id: "OLL 12", category: "线条形", name: "一字四式 (M式)", formula: "M' U' M U2' M' U' M" },
    { id: "OLL 13", category: "线条形", name: "一字五式", formula: "F U R U' R2' F' R U R U' R'" },
    { id: "OLL 14", category: "线条形", name: "一字六式", formula: "R' F R U R' F' R y' R2' U' R U R2" },
    { id: "OLL 15", category: "线条形", name: "一字七式", formula: "r' U' r R' U' R U r' U r" },
    { id: "OLL 16", category: "线条形", name: "一字八式", formula: "r U r' R U R' U' r U' r'" },

    // C形与L形 (OLL 17 - 30)
    { id: "OLL 17", category: "C形与L形", name: "C字一式 (顶部呈C形，两角好)", formula: "R U R' U R' F R F' U2 R' F R F'" },
    { id: "OLL 18", category: "C形与L形", name: "C字二式 (顶部呈C形，角全错)", formula: "F R U R' U' F' U F R U R' U' F'" },
    { id: "OLL 19", category: "C形与L形", name: "L字一式", formula: "M' U2 M U2 M' U M U2 M' U2 M" },
    { id: "OLL 20", category: "C形与L形", name: "L字二式", formula: "r U R' U' M2' U R U' r'" },
    { id: "OLL 21", category: "C形与L形", name: "十字一式 (两对大角反转)", formula: "R U2 R' U' R U R' U' R U' R'" },
    { id: "OLL 22", category: "C形与L形", name: "十字二式 (两角同向反转)", formula: "R U2' R2' U' R2 U' R2' U2' R" },
    { id: "OLL 23", category: "C形与L形", name: "十字三式 (坦克一式)", formula: "R2 D' R U2 R' D R U2 R" },
    { id: "OLL 24", category: "C形与L形", name: "十字四式 (连体车一式)", formula: "r U R' U' r' F R F'" },
    { id: "OLL 25", category: "C形与L形", name: "十字五式 (领结一式)", formula: "F' r U R' U' r' F R" },
    { id: "OLL 26", category: "C形与L形", name: "小鱼二式 (Anti-Sune)", formula: "R U2 R' U' R U' R'" },
    { id: "OLL 27", category: "C形与L形", name: "小鱼一式 (Sune)", formula: "R U R' U R U2 R'" },
    { id: "OLL 28", category: "C形与L形", name: "L字九式", formula: "r U R' U' r' R U R' U' R U R' U' R U R' U'" },
    { id: "OLL 29", category: "C形与L形", name: "L字十式", formula: "M U R U R' U' M' R' F R F'" },
    { id: "OLL 30", category: "C形与L形", name: "L字十一式", formula: "M U R U R' U' M' U2 R' F R F'" },

    // P形与T形 (OLL 31 - 42)
    { id: "OLL 31", category: "P形与T形", name: "P字一式 (朝右小P)", formula: "S R U R' U' R' F R f'" },
    { id: "OLL 32", category: "P形与T形", name: "P字二式 (朝左小P)", formula: "R U B' U' R' U R B R'" },
    { id: "OLL 33", category: "P形与T形", name: "T字一式 (顶部T形，侧面两黄)", formula: "R U R' U' R' F R F'" },
    { id: "OLL 34", category: "P形与T形", name: "T字二式 (顶部T形，侧面无对黄)", formula: "R U R' U' B' R' F R F' B" },
    { id: "OLL 35", category: "P形与T形", name: "P字五式", formula: "R U2 R2' F R F' R U2 R'" },
    { id: "OLL 36", category: "P形与T形", name: "P字六式", formula: "L' U' L U L F' L' F" },
    { id: "OLL 37", category: "P形与T形", name: "F字一式", formula: "F R' F' R U R U' R'" },
    { id: "OLL 38", category: "P形与T形", name: "F字二式", formula: "R U R' U R U' R' U' R' F R F'" },
    { id: "OLL 39", category: "P形与T形", name: "大闪电一式", formula: "L F' L' U' L U F U' L'" },
    { id: "OLL 40", category: "P形与T形", name: "大闪电二式", formula: "R' F R U R' U' F' U R" },
    { id: "OLL 41", category: "P形与T形", name: "W字一式", formula: "R U R' U R U2 R' F R U R' U' F'" },
    { id: "OLL 42", category: "P形与T形", name: "W字二式", formula: "R' U' R U' R' U2 R F R U R' U' F'" },

    // 鱼形与风筝 (OLL 43 - 57)
    { id: "OLL 43", category: "鱼形与风筝", name: "小拐角三式", formula: "F' U' L' U L F" },
    { id: "OLL 44", category: "鱼形与风筝", name: "小拐角四式", formula: "F R U R' U' F'" },
    { id: "OLL 45", category: "鱼形与风筝", name: "风筝一式 (顶部田字旁有一横)", formula: "F R U R' U' F' U F R U R' U' F'" },
    { id: "OLL 46", category: "鱼形与风筝", name: "风筝二式", formula: "R' U' F R U R' U' F' R" },
    { id: "OLL 47", category: "鱼形与风筝", name: "小闪电三式", formula: "F' L' U' L U L' U' L U F" },
    { id: "OLL 48", category: "鱼形与风筝", name: "小闪电四式", formula: "F R U R' U' R U R' U' F'" },
    { id: "OLL 49", category: "鱼形与风筝", name: "双角反转一式", formula: "r U' r' U' r U r' y' R' U R" },
    { id: "OLL 50", category: "鱼形与风筝", name: "双角反转二式", formula: "r' U r U r' U' r y R U' R'" },
    { id: "OLL 51", category: "鱼形与风筝", name: "大十字一式", formula: "f R U R' U' f'" },
    { id: "OLL 52", category: "鱼形与风筝", name: "大十字二式", formula: "R' U' R' F R F' U R" },
    { id: "OLL 53", category: "鱼形与风筝", name: "小鱼三式", formula: "r' U' R U' R' U R U' R' U2 r" },
    { id: "OLL 54", category: "鱼形与风筝", name: "小鱼四式", formula: "r U R' U R U' R' U R U2' r'" },
    { id: "OLL 55", category: "鱼形与风筝", name: "点形十一式", formula: "R U2 R2' U' R U' R' U2 F R F'" },
    { id: "OLL 56", category: "鱼形与风筝", name: "大闪电三式", formula: "r U r' U R U' R' U R U' R' r U' r'" },
    { id: "OLL 57", category: "鱼形与风筝", name: "大闪电四式", formula: "R U R' U' M' U R U' r'" }
];

const CFOP_PLL = [
    // 棱块移动 (4个)
    { id: "Ua Perm", category: "仅棱块移动", name: "三棱逆时针换 (Ua)", formula: "R U' R U R U R U' R' U' R2" },
    { id: "Ub Perm", category: "仅棱块移动", name: "三棱顺时针换 (Ub)", formula: "R2 U R U R' U' R' U' R' U R'" },
    { id: "H Perm", category: "仅棱块移动", name: "四棱两两对角互换 (H)", formula: "M2' U M2' U2 M2' U M2'" },
    { id: "Z Perm", category: "仅棱块移动", name: "四棱两两相邻互换 (Z)", formula: "M' U M2' U M2' U M' U2' M2'" },

    // 角块移动 (3个)
    { id: "Aa Perm", category: "仅角块移动", name: "三角顺时针换 (Aa)", formula: "x R' U R' D2 R U' R' D2 R2 x'" },
    { id: "Ab Perm", category: "仅角块移动", name: "三角逆时针换 (Ab)", formula: "x R2 D2 R U R' D2 R U' R x'" },
    { id: "E Perm", category: "仅角块移动", name: "四角两两对角互换 (E)", formula: "x' R U' R' D R U R' D' R U R' D R U' R' D' x" },

    // 角块和棱块同时移动 (14个)
    { id: "T Perm", category: "角棱同时移动", name: "对角换 (T)", formula: "R U R' U' R' F R2 U' R' U' R U R' F'" },
    { id: "Y Perm", category: "角棱同时移动", name: "对角换 (Y)", formula: "F R U' R' U' R U R' F' R U R' U' R' F R F'" },
    { id: "F Perm", category: "角棱同时移动", name: "邻角换 (F)", formula: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R" },
    { id: "Ja Perm", category: "角棱同时移动", name: "邻角换 (Ja)", formula: "x R2 F R F' R U2' r' U r U2' x'" },
    { id: "Jb Perm", category: "角棱同时移动", name: "邻角换 (Jb)", formula: "R U R' F' R U R' U' R' F R2 U' R'" },
    { id: "Ra Perm", category: "角棱同时移动", name: "邻角换 (Ra)", formula: "L U2 L' U2 L F' L' U' L U L F L2" },
    { id: "Rb Perm", category: "角棱同时移动", name: "邻角换 (Rb)", formula: "R' U2 R U2 R' F R U R' U' R' F' R2" },
    { id: "V Perm", category: "角棱同时移动", name: "对角换 (V)", formula: "R' U R' d' R' F' R2 U' R' U R' F R F" },
    { id: "Na Perm", category: "角棱同时移动", name: "对角换 (Na)", formula: "R U R' U R U R' F' R U R' U' R' F R2 U' R'2 U2 R U2' R'" },
    { id: "Nb Perm", category: "角棱同时移动", name: "对角换 (Nb)", formula: "R' U L' U2 R U' L R' U L' U2 R U' L" },
    { id: "Ga Perm", category: "角棱同时移动", name: "双顺旋转换 (Ga)", formula: "R2 U R' U R' U' R U2 R' U' R U' R2" },
    { id: "Gb Perm", category: "角棱同时移动", name: "双逆旋转换 (Gb)", formula: "F' U' L' U L F R U R' U' R U' R'" },
    { id: "Gc Perm", category: "角棱同时移动", name: "双顺旋转换 (Gc)", formula: "R2 U' R U' R U R' U R2 D' U R U' R' D" },
    { id: "Gd Perm", category: "角棱同时移动", name: "双逆旋转换 (Gd)", formula: "R U R' U' D R2 U' R U' R' U R' U R2 D'" }
];

// 暴露至 window 对象
window.CFOP_CROSS = CFOP_CROSS;
window.CFOP_F2L = CFOP_F2L;
window.CFOP_OLL = CFOP_OLL;
window.CFOP_PLL = CFOP_PLL;
