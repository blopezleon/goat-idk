/**
 * FluentForm - Chart Components
 * This module provides chart and data visualization components
 * using Chart.js for the FluentForm application
 */

// Create global namespace for FluentForm
window.FluentForm = window.FluentForm || {};
window.FluentForm.Charts = {};

/**
 * Initialize Chart.js library if not already loaded
 * @returns {Promise} - Resolves when Chart.js is ready
 */
FluentForm.Charts.init = async function() {
    // Check if Chart.js is already loaded
    if (typeof Chart === 'undefined') {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    return Promise.resolve();
};

/**
 * Creates a progress line chart for tracking phoneme improvements
 * @param {string} canvasId - The ID of the canvas element
 * @param {object} data - The data for the chart
 * @param {object} options - Additional options for the chart
 */
FluentForm.Charts.createProgressChart = async function(canvasId, data, options = {}) {
    await FluentForm.Charts.init();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with ID ${canvasId} not found`);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Default data structure if not provided
    const chartData = data || {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
            {
                label: 'Overall Score',
                data: [65, 68, 72, 75],
                borderColor: '#0078d4',
                backgroundColor: 'rgba(0, 120, 212, 0.1)',
                tension: 0.4,
                fill: true
            }
        ]
    };
    
    // Merge default options with provided options
    const chartOptions = Object.assign({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y + '%';
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                min: 40,
                max: 100,
                ticks: {
                    callback: function(value) {
                        return value + '%';
                    }
                }
            }
        }
    }, options);
    
    // Create the chart
    const chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: chartOptions
    });
    
    return chart;
};

/**
 * Creates a radar chart for showing phoneme proficiency across categories
 * @param {string} canvasId - The ID of the canvas element
 * @param {object} data - The data for the chart
 * @param {object} options - Additional options for the chart
 */
FluentForm.Charts.createPhonemeRadarChart = async function(canvasId, data, options = {}) {
    await FluentForm.Charts.init();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with ID ${canvasId} not found`);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Default data structure if not provided
    const chartData = data || {
        labels: ['R Sounds', 'S Sounds', 'L Sounds', 'Th Sounds', 'Ch Sounds', 'Sh Sounds'],
        datasets: [
            {
                label: 'Your Proficiency',
                data: [65, 82, 75, 60, 85, 70],
                backgroundColor: 'rgba(0, 120, 212, 0.2)',
                borderColor: 'rgba(0, 120, 212, 1)',
                pointBackgroundColor: 'rgba(0, 120, 212, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(0, 120, 212, 1)'
            },
            {
                label: 'Average User',
                data: [70, 75, 80, 65, 80, 75],
                backgroundColor: 'rgba(45, 170, 45, 0.2)',
                borderColor: 'rgba(45, 170, 45, 1)',
                pointBackgroundColor: 'rgba(45, 170, 45, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(45, 170, 45, 1)'
            }
        ]
    };
    
    // Merge default options with provided options
    const chartOptions = Object.assign({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.r !== null) {
                            label += context.parsed.r + '%';
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            r: {
                min: 0,
                max: 100,
                ticks: {
                    stepSize: 20,
                    callback: function(value) {
                        return value + '%';
                    }
                },
                pointLabels: {
                    font: {
                        size: 14
                    }
                }
            }
        }
    }, options);
    
    // Create the chart
    const chart = new Chart(ctx, {
        type: 'radar',
        data: chartData,
        options: chartOptions
    });
    
    return chart;
};

/**
 * Creates a doughnut chart for showing phoneme distribution
 * @param {string} canvasId - The ID of the canvas element
 * @param {object} data - The data for the chart
 * @param {object} options - Additional options for the chart
 */
FluentForm.Charts.createPhonemeDoughnutChart = async function(canvasId, data, options = {}) {
    await FluentForm.Charts.init();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with ID ${canvasId} not found`);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Default data structure if not provided
    const chartData = data || {
        labels: ['Excellent (90%+)', 'Good (75-89%)', 'Average (60-74%)', 'Needs Work (40-59%)', 'Poor (<40%)'],
        datasets: [
            {
                data: [10, 15, 5, 3, 2],
                backgroundColor: [
                    '#107c10', // Excellent
                    '#2eb8b8', // Good
                    '#ffaa44', // Average
                    '#ff8c00', // Needs Work
                    '#d13438'  // Poor
                ],
                borderWidth: 1
            }
        ]
    };
    
    // Merge default options with provided options
    const chartOptions = Object.assign({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right',
                labels: {
                    padding: 20,
                    boxWidth: 12,
                    font: {
                        size: 14
                    }
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} phonemes (${percentage}%)`;
                    }
                }
            }
        }
    }, options);
    
    // Create the chart
    const chart = new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: chartOptions
    });
    
    return chart;
};

/**
 * Creates a horizontal bar chart for showing phoneme improvement opportunities
 * @param {string} canvasId - The ID of the canvas element
 * @param {object} data - The data for the chart
 * @param {object} options - Additional options for the chart
 */
FluentForm.Charts.createImprovementOpportunitiesChart = async function(canvasId, data, options = {}) {
    await FluentForm.Charts.init();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with ID ${canvasId} not found`);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Default data structure if not provided
    const chartData = data || {
        labels: ['r', 'th', 'sh', 's', 'l'],
        datasets: [
            {
                axis: 'y',
                label: 'Current Score',
                data: [62, 68, 70, 75, 78],
                backgroundColor: [
                    '#ff8c00', // r - Needs Work
                    '#ffaa44', // th - Average
                    '#ffaa44', // sh - Average
                    '#2eb8b8', // s - Good
                    '#2eb8b8'  // l - Good
                ],
                borderWidth: 1
            }
        ]
    };
    
    // Merge default options with provided options
    const chartOptions = Object.assign({
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `Score: ${context.parsed.x}%`;
                    }
                }
            }
        },
        scales: {
            x: {
                beginAtZero: true,
                max: 100,
                ticks: {
                    callback: function(value) {
                        return value + '%';
                    }
                }
            }
        }
    }, options);
    
    // Create the chart
    const chart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: chartOptions
    });
    
    return chart;
};

/**
 * Creates a heatmap-like chart for weekly practice activity
 * @param {string} canvasId - The ID of the canvas element
 * @param {object} data - The data for the chart
 * @param {object} options - Additional options for the chart
 */
FluentForm.Charts.createPracticeHeatmap = async function(canvasId, data, options = {}) {
    await FluentForm.Charts.init();
    
    // We need to load Chart.js Heatmap plugin
    if (typeof Chart.controllers.matrix === 'undefined') {
        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chartjs-chart-matrix';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with ID ${canvasId} not found`);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Generate default data if not provided
    if (!data) {
        // Generate last 15 weeks of dummy data
        const weeks = 15;
        const days = 7;
        const values = [];
        
        for (let w = 0; w < weeks; w++) {
            for (let d = 0; d < days; d++) {
                // Random value between 0-3 for practice sessions per day
                const count = Math.floor(Math.random() * 4);
                values.push({
                    x: d,
                    y: w,
                    v: count
                });
            }
        }
        
        data = {
            datasets: [{
                data: values,
                backgroundColor(context) {
                    const value = context.dataset.data[context.dataIndex].v;
                    const alpha = (value === 0) ? 0.1 : (0.2 + (value * 0.15));
                    return `rgba(0, 120, 212, ${alpha})`;
                },
                borderColor: 'white',
                borderWidth: 2,
                width: ({ chart }) => (chart.chartArea.width / 8) - 1,
                height: ({ chart }) => (chart.chartArea.height / 16) - 1
            }]
        };
    }
    
    // Merge default options with provided options
    const chartOptions = Object.assign({
        plugins: {
            tooltip: {
                callbacks: {
                    title() {
                        return '';
                    },
                    label(context) {
                        const v = context.dataset.data[context.dataIndex];
                        const sessions = v.v === 1 ? 'session' : 'sessions';
                        const dayIndex = v.x;
                        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                        return `${days[dayIndex]}: ${v.v} practice ${sessions}`;
                    }
                }
            },
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                type: 'time',
                offset: true,
                time: {
                    unit: 'week',
                    round: 'week',
                    isoWeekday: 1,
                    displayFormats: {
                        week: 'MMM dd'
                    }
                },
                reverse: true,
                ticks: {
                    maxRotation: 0,
                    autoSkip: true,
                    padding: 1
                },
                grid: {
                    display: false,
                    drawBorder: false
                }
            },
            x: {
                type: 'category',
                labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                offset: true,
                ticks: {
                    padding: 1
                },
                grid: {
                    display: false,
                    drawBorder: false
                }
            }
        }
    }, options);
    
    // Create the chart
    const chart = new Chart(ctx, {
        type: 'matrix',
        data: data,
        options: chartOptions
    });
    
    return chart;
};

/**
 * Creates a streamgraph for showing time spent on different phonemes
 * @param {string} canvasId - The ID of the canvas element
 * @param {object} data - The data for the chart
 * @param {object} options - Additional options for the chart
 */
FluentForm.Charts.createPracticeStreamGraph = async function(canvasId, data, options = {}) {
    await FluentForm.Charts.init();
    
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with ID ${canvasId} not found`);
        return;
    }
    
    const ctx = canvas.getContext('2d');
    
    // Default data structure if not provided
    const chartData = data || {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [
            {
                label: 'r sounds',
                data: [20, 25, 15, 10],
                backgroundColor: 'rgba(255, 99, 132, 0.7)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
                fill: true
            },
            {
                label: 'th sounds',
                data: [10, 15, 20, 15],
                backgroundColor: 'rgba(54, 162, 235, 0.7)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                fill: true
            },
            {
                label: 'sh sounds',
                data: [5, 10, 15, 20],
                backgroundColor: 'rgba(255, 206, 86, 0.7)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1,
                fill: true
            }
        ]
    };
    
    // Merge default options with provided options
    const chartOptions = Object.assign({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y + ' minutes';
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Time Period'
                }
            },
            y: {
                stacked: true,
                title: {
                    display: true,
                    text: 'Minutes Practiced'
                }
            }
        }
    }, options);
    
    // Create the chart
    const chart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: chartOptions
    });
    
    return chart;
}; 