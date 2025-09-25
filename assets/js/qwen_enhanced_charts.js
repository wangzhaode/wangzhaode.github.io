// 增强的Qwen模型性能数据
const enhancedPerformanceData = {
    // MMLU基准测试分数
    mmlu: [
        { version: 'Qwen-1.8B', params: 1.8, score: 52.3, release: '2023-08' },
        { version: 'Qwen-7B', params: 7, score: 58.2, release: '2023-08' },
        { version: 'Qwen-14B', params: 14, score: 63.4, release: '2023-09' },
        { version: 'Qwen-72B', params: 72, score: 70.5, release: '2023-11' },
        { version: 'Qwen1.5-0.5B', params: 0.5, score: 46.8, release: '2024-04' },
        { version: 'Qwen1.5-1.8B', params: 1.8, score: 56.1, release: '2024-04' },
        { version: 'Qwen1.5-4B', params: 4, score: 62.5, release: '2024-04' },
        { version: 'Qwen1.5-7B', params: 7, score: 67.6, release: '2024-04' },
        { version: 'Qwen1.5-14B', params: 14, score: 72.1, release: '2024-04' },
        { version: 'Qwen1.5-72B', params: 72, score: 77.4, release: '2024-04' },
        { version: 'Qwen2-0.5B', params: 0.5, score: 45.4, release: '2024-06' },
        { version: 'Qwen2-1.5B', params: 1.5, score: 52.4, release: '2024-06' },
        { version: 'Qwen2-7B', params: 7, score: 70.5, release: '2024-06' },
        { version: 'Qwen2-72B', params: 72, score: 84.2, release: '2024-06' },
        { version: 'Qwen2.5-0.5B', params: 0.5, score: 51.2, release: '2024-09' },
        { version: 'Qwen2.5-1.5B', params: 1.5, score: 62.3, release: '2024-09' },
        { version: 'Qwen2.5-7B', params: 7, score: 75.3, release: '2024-09' },
        { version: 'Qwen2.5-14B', params: 14, score: 79.7, release: '2024-09' },
        { version: 'Qwen2.5-32B', params: 32, score: 83.3, release: '2024-09' },
        { version: 'Qwen2.5-72B', params: 72, score: 86.1, release: '2024-09' },
        { version: 'Qwen3-4B', params: 4, score: 74.2, release: '2025-07' },
        { version: 'Qwen3-8B', params: 8, score: 80.1, release: '2025-07' },
        { version: 'Qwen3-32B', params: 32, score: 87.2, release: '2025-07' },
        { version: 'Qwen3-72B', params: 72, score: 89.1, release: '2025-07' },
        { version: 'Qwen3-235B', params: 235, score: 92.8, release: '2025-07' }
    ],

    // GSM8K数学推理
    gsm8k: [
        { version: 'Qwen-72B', params: 72, score: 76.4 },
        { version: 'Qwen1.5-72B', params: 72, score: 81.2 },
        { version: 'Qwen2-72B', params: 72, score: 85.7 },
        { version: 'Qwen2.5-72B', params: 72, score: 89.3 },
        { version: 'Qwen3-72B', params: 72, score: 93.2 }
    ],

    // HumanEval代码生成
    humaneval: [
        { version: 'Qwen-72B', params: 72, score: 42.1 },
        { version: 'Qwen1.5-72B', params: 72, score: 54.6 },
        { version: 'Qwen2-72B', params: 72, score: 63.2 },
        { version: 'Qwen2.5-72B', params: 72, score: 72.8 },
        { version: 'Qwen3-72B', params: 72, score: 81.4 }
    ],

    // ARC科学问答
    arc: [
        { version: 'Qwen-72B', params: 72, score: 68.3 },
        { version: 'Qwen1.5-72B', params: 72, score: 73.5 },
        { version: 'Qwen2-72B', params: 72, score: 79.8 },
        { version: 'Qwen2.5-72B', params: 72, score: 84.2 },
        { version: 'Qwen3-72B', params: 72, score: 88.7 }
    ],

    // 模型能力维度
    capabilities: [
        {
            version: 'Qwen1',
            contextLength: '8K',
            reasoning: '基础',
            multilingual: '100+',
            instructionFollowing: '基础'
        },
        {
            version: 'Qwen1.5',
            contextLength: '32K',
            reasoning: '增强',
            multilingual: '100+',
            instructionFollowing: '改进'
        },
        {
            version: 'Qwen2',
            contextLength: '128K',
            reasoning: '显著增强',
            multilingual: '100+',
            instructionFollowing: '良好'
        },
        {
            version: 'Qwen2.5',
            contextLength: '128K',
            reasoning: '优秀',
            multilingual: '100+',
            instructionFollowing: '优秀'
        },
        {
            version: 'Qwen3',
            contextLength: '128K+',
            reasoning: '卓越',
            multilingual: '100+',
            instructionFollowing: '卓越'
        }
    ]
};

// 渲染增强的基准测试图表
function renderEnhancedBenchmarkCharts() {
    // 只渲染MMLU分数图表 - 按版本分组
    renderMMLUByVersionChart();
}

// 按版本分组渲染MMLU图表
function renderMMLUByVersionChart() {
    const ctx = document.getElementById('mmlu-chart').getContext('2d');

    // 按版本分组数据
    const versionGroups = {
        'Qwen': [],
        'Qwen1.5': [],
        'Qwen2': [],
        'Qwen2.5': [],
        'Qwen3': []
    };

    enhancedPerformanceData.mmlu.forEach(item => {
        if (item.version.startsWith('Qwen3')) {
            versionGroups['Qwen3'].push(item);
        } else if (item.version.startsWith('Qwen2.5')) {
            versionGroups['Qwen2.5'].push(item);
        } else if (item.version.startsWith('Qwen2')) {
            versionGroups['Qwen2'].push(item);
        } else if (item.version.startsWith('Qwen1.5')) {
            versionGroups['Qwen1.5'].push(item);
        } else {
            versionGroups['Qwen'].push(item);
        }
    });

    // 为每个版本系列创建数据集
    const datasets = Object.keys(versionGroups).map((version, index) => {
        // 对每个版本系列的数据按参数量排序
        const sortedData = versionGroups[version].sort((a, b) => a.params - b.params);

        const colors = [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
        ];

        return {
            label: version,
            data: sortedData.map(item => ({x: item.params, y: item.score})),
            backgroundColor: colors[index],
            borderColor: colors[index].replace('0.7', '1'),
            borderWidth: 1,
            pointRadius: 6,
            pointHoverRadius: 8,
            // 添加连线
            showLine: true,
            lineTension: 0.3
        };
    });

    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Qwen模型发展(MMLU分数)',
                    font: { size: 16 },
                    color: '#333'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const item = versionGroups[context.dataset.label][context.dataIndex];
                            return `${item.version}: ${item.score}% (参数量: ${item.params}B)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: '模型大小 (Billion parameters)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'MMLU Score (%)'
                    }
                }
            }
        }
    });
}

// 渲染多维度性能对比图
function renderMultiDimensionChart() {
    const ctx = document.getElementById('multidim-chart').getContext('2d');

    // 获取各版本的最新模型进行对比
    const latestModels = [
        enhancedPerformanceData.gsm8k[0],
        enhancedPerformanceData.humaneval[0],
        enhancedPerformanceData.arc[0]
    ];

    const versions = ['Qwen', 'Qwen1.5', 'Qwen2', 'Qwen2.5', 'Qwen3'];

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['GSM8K (数学推理)', 'HumanEval (代码生成)', 'ARC (科学问答)'],
            datasets: versions.map((version, index) => {
                const colors = [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)'
                ];

                // 获取对应版本的数据
                let data = [];
                if (version === 'Qwen') {
                    data = [76.4, 42.1, 68.3];
                } else if (version === 'Qwen1.5') {
                    data = [81.2, 54.6, 73.5];
                } else if (version === 'Qwen2') {
                    data = [85.7, 63.2, 79.8];
                } else if (version === 'Qwen2.5') {
                    data = [89.3, 72.8, 84.2];
                } else if (version === 'Qwen3') {
                    data = [93.2, 81.4, 88.7];
                }

                return {
                    label: version,
                    data: data,
                    backgroundColor: colors[index],
                    borderColor: colors[index].replace('0.7', '1'),
                    borderWidth: 1
                };
            })
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Qwen模型在不同基准测试中的性能对比',
                    font: { size: 16 },
                    color: '#333'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '分数 (%)'
                    }
                }
            }
        }
    });
}

// 渲染能力发展时间线
function renderCapabilityTimeline() {
    const ctx = document.getElementById('capability-chart').getContext('2d');

    const capabilities = enhancedPerformanceData.capabilities;

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['上下文长度', '推理能力', '多语言支持', '指令遵循'],
            datasets: capabilities.map((cap, index) => {
                const colors = [
                    'rgba(255, 99, 132, 0.2)',
                    'rgba(54, 162, 235, 0.2)',
                    'rgba(255, 206, 86, 0.2)',
                    'rgba(75, 192, 192, 0.2)',
                    'rgba(153, 102, 255, 0.2)'
                ];

                const borderColors = [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)',
                    'rgba(75, 192, 192, 1)',
                    'rgba(153, 102, 255, 1)'
                ];

                // 将能力描述转换为数值
                const reasoningValues = {
                    '基础': 1,
                    '增强': 2,
                    '显著增强': 3,
                    '优秀': 4,
                    '卓越': 5
                };

                const instructionValues = {
                    '基础': 1,
                    '改进': 2,
                    '良好': 3,
                    '优秀': 4,
                    '卓越': 5
                };

                // 简化上下文长度为数值
                const contextValues = {
                    '8K': 1,
                    '32K': 2,
                    '128K': 3,
                    '128K+': 4
                };

                return {
                    label: cap.version,
                    data: [
                        contextValues[cap.contextLength] || 1,
                        reasoningValues[cap.reasoning] || 1,
                        5, // 多语言支持都为最高
                        instructionValues[cap.instructionFollowing] || 1
                    ],
                    backgroundColor: colors[index],
                    borderColor: borderColors[index],
                    borderWidth: 2,
                    pointBackgroundColor: borderColors[index],
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: borderColors[index]
                };
            })
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Qwen模型能力发展雷达图',
                    font: { size: 16 },
                    color: '#333'
                }
            },
            scales: {
                r: {
                    angleLines: {
                        display: true
                    },
                    suggestedMin: 0,
                    suggestedMax: 5
                }
            }
        }
    });
}