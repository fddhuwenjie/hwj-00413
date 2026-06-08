import { useState, useEffect, useRef, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { Package, TrendingUp, CheckCircle, Clock, BarChart3, PieChart, TrendingUp as TrendingUpIcon } from 'lucide-react';
import Layout from '../components/Layout';
import { statsService } from '../services/stats';
import type { StatsOverview, CategoryDistribution, WeeklyTrend, PopularItem } from '../types';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
}

function StatCard({ title, value, icon, gradient }: StatCardProps) {
  return (
    <div className={`${gradient} rounded-2xl p-6 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <span className="text-3xl font-bold">{value.toLocaleString()}</span>
      </div>
      <p className="text-white/80 text-sm font-medium">{title}</p>
    </div>
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState<StatsOverview>({
    totalItems: 0,
    todayNewItems: 0,
    completedExchanges: 0,
    ongoingExchanges: 0,
  });
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef<ReactECharts>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [overviewData, categoryData, trendData, popularData] = await Promise.all([
          statsService.getOverview(),
          statsService.getCategoryDistribution(),
          statsService.getWeeklyTrend(),
          statsService.getPopularItems(),
        ]);

        console.log('Dashboard Data Loaded:', {
          overview: overviewData,
          categoryCount: categoryData.length,
          trendCount: trendData.length,
          popularCount: popularData.length,
        });

        setOverview(overviewData);
        setCategoryDistribution(categoryData);
        setWeeklyTrend(trendData);
        setPopularItems(popularData.slice(0, 10));
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards: StatCardProps[] = [
    {
      title: '总物品数',
      value: overview.totalItems,
      icon: <Package className="w-6 h-6" />,
      gradient: 'bg-gradient-to-br from-blue-500 to-blue-600',
    },
    {
      title: '今日新增',
      value: overview.todayNewItems,
      icon: <TrendingUp className="w-6 h-6" />,
      gradient: 'bg-gradient-to-br from-green-500 to-emerald-600',
    },
    {
      title: '已完成交换',
      value: overview.completedExchanges,
      icon: <CheckCircle className="w-6 h-6" />,
      gradient: 'bg-gradient-to-br from-purple-500 to-violet-600',
    },
    {
      title: '进行中交换',
      value: overview.ongoingExchanges,
      icon: <Clock className="w-6 h-6" />,
      gradient: 'bg-gradient-to-br from-orange-500 to-amber-600',
    },
  ];

  const pieChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical' as const,
      right: '5%',
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        fontSize: 12,
        color: '#6B7280',
      },
    },
    series: [
      {
        name: '分类占比',
        type: 'pie' as const,
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
          position: 'center' as const,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold' as const,
            formatter: '{b}\n{d}%',
          },
        },
        labelLine: {
          show: false,
        },
        data: categoryDistribution.map((item) => ({
          value: item.count,
          name: item.category,
        })),
        color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'],
      },
    ],
  }), [categoryDistribution]);

  const lineChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
      },
      formatter: (params: any) => {
        return `${params[0].axisValue}<br/>交换量: ${params[0].value}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: weeklyTrend.map((item) => item.week),
      axisLine: {
        lineStyle: {
          color: '#E5E7EB',
        },
      },
      axisLabel: {
        color: '#6B7280',
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: '#F3F4F6',
          type: 'dashed' as const,
        },
      },
      axisLabel: {
        color: '#6B7280',
        fontSize: 11,
      },
    },
    series: [
      {
        name: '交换量',
        type: 'line' as const,
        smooth: true,
        symbol: 'circle' as const,
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#8B5CF6' },
              { offset: 1, color: '#EC4899' },
            ],
          },
        },
        itemStyle: {
          color: '#8B5CF6',
          borderColor: '#fff',
          borderWidth: 2,
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.05)' },
            ],
          },
        },
        data: weeklyTrend.map((item) => item.count),
      },
    ],
  }), [weeklyTrend]);

  const barChartOption = useMemo(() => ({
    tooltip: {
      trigger: 'axis' as const,
      axisPointer: {
        type: 'shadow' as const,
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      textStyle: {
        color: '#374151',
      },
      formatter: (params: any) => {
        return `${params[0].name}<br/>浏览量: ${params[0].value}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category' as const,
      data: popularItems.map((item) => item.title.length > 6 ? item.title.slice(0, 6) + '...' : item.title),
      axisLine: {
        lineStyle: {
          color: '#E5E7EB',
        },
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        color: '#6B7280',
        fontSize: 10,
        interval: 0,
        rotate: 30,
      },
    },
    yAxis: {
      type: 'value' as const,
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: '#F3F4F6',
          type: 'dashed' as const,
        },
      },
      axisLabel: {
        color: '#6B7280',
        fontSize: 11,
      },
    },
    series: [
      {
        name: '浏览量',
        type: 'bar' as const,
        barWidth: '50%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#06B6D4' },
              { offset: 1, color: '#3B82F6' },
            ],
          },
        },
        data: popularItems.map((item) => item.viewCount),
      },
    ],
  }), [popularItems]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">数据统计</h1>
          <p className="text-text-secondary">平台运营数据概览与分析</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, index) => (
            <StatCard
              key={index}
              title={card.title}
              value={card.value}
              icon={card.icon}
              gradient={card.gradient}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-surface rounded-card shadow-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <PieChart className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">各分类物品占比</h2>
            </div>
            <div className="h-80 w-full">
              {categoryDistribution.length > 0 ? (
                <ReactECharts
                  key={`pie-${categoryDistribution.length}-${categoryDistribution.map(c => c.count).join('-')}`}
                  option={pieChartOption}
                  notMerge={true}
                  lazyUpdate={false}
                  style={{ height: '320px', width: '100%', minHeight: '320px' }}
                  opts={{ renderer: 'canvas' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted">
                  暂无数据
                </div>
              )}
            </div>
          </div>

          <div className="bg-surface rounded-card shadow-card p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUpIcon className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">每周交换量趋势</h2>
            </div>
            <div className="h-80 w-full">
              {weeklyTrend.length > 0 ? (
                <ReactECharts
                  key={`line-${weeklyTrend.length}-${weeklyTrend.map(t => t.count).join('-')}`}
                  option={lineChartOption}
                  notMerge={true}
                  lazyUpdate={false}
                  style={{ height: '320px', width: '100%', minHeight: '320px' }}
                  opts={{ renderer: 'canvas' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-text-muted">
                  暂无数据
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-card shadow-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-cyan-600" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">热门交换物品类型 TOP10</h2>
          </div>
          <div className="h-96 w-full">
            {popularItems.length > 0 ? (
              <ReactECharts
                ref={chartRef}
                key={`bar-${popularItems.length}-${popularItems.map(p => p.viewCount).join('-')}`}
                option={barChartOption}
                notMerge={true}
                lazyUpdate={false}
                style={{ height: '384px', width: '100%', minHeight: '384px' }}
                opts={{ renderer: 'canvas' }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-text-muted">
                暂无数据
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
