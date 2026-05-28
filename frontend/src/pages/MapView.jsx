import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Input, Select, Grid, AutoComplete } from 'antd';
import {
  SearchOutlined,
  BankOutlined,
  EnvironmentOutlined,
  CloseCircleFilled,
  FilterOutlined,
  BarChartOutlined,
  FireOutlined,
  StarOutlined,
  LinkOutlined,
  GlobalOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';
import universityData from '../data/universities.json';
import './MapView.css';

const { useBreakpoint } = Grid;
const { Option } = Select;

const REGION_GROUPS = {
  '华北': ['北京市', '天津市', '河北省', '山西省', '内蒙古自治区'],
  '东北': ['辽宁省', '吉林省', '黑龙江省'],
  '华东': ['上海市', '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省'],
  '华中': ['河南省', '湖北省', '湖南省'],
  '华南': ['广东省', '广西壮族自治区', '海南省'],
  '西南': ['重庆市', '四川省', '贵州省', '云南省', '西藏自治区'],
  '西北': ['陕西省', '甘肃省', '青海省', '宁夏回族自治区', '新疆维吾尔自治区'],
};

const LEVEL_COLORS = {
  '985': '#ef4444',
  '211': '#f97316',
  '双一流': '#8b5cf6',
  '教育部直属': '#3b82f6',
  'default': '#60a5fa',
};

const getMarkerColor = (features) => {
  if (!features) return LEVEL_COLORS.default;
  if (features.includes('985')) return LEVEL_COLORS['985'];
  if (features.includes('211')) return LEVEL_COLORS['211'];
  if (features.includes('双一流')) return LEVEL_COLORS['双一流'];
  if (features.includes('教育部直属')) return LEVEL_COLORS['教育部直属'];
  return LEVEL_COLORS.default;
};

const getMarkerSize = (features) => {
  if (!features) return 5;
  if (features.includes('985')) return 12;
  if (features.includes('211')) return 10;
  if (features.includes('双一流')) return 9;
  if (features.includes('教育部直属')) return 8;
  return 5;
};

const MapView = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFeature, setSelectedFeature] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [cardPos, setCardPos] = useState({ x: 0, y: 0 });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const chinaJsonRef = useRef(null);
  const screens = useBreakpoint();

  const { categories, universities } = universityData;

  const filteredData = useMemo(() => {
    let result = universities.filter(u => u.lng && u.lat);

    if (searchText) {
      const s = searchText.toLowerCase();
      result = result.filter(u =>
        u.name?.toLowerCase().includes(s) ||
        u.englishName?.toLowerCase().includes(s) ||
        u.region?.toLowerCase().includes(s) ||
        u.features?.toLowerCase().includes(s)
      );
    }
    if (selectedRegion) {
      const provinces = REGION_GROUPS[selectedRegion] || [selectedRegion];
      result = result.filter(u => provinces.includes(u.region));
    }
    if (selectedLevel) {
      result = result.filter(u => u.level === selectedLevel);
    }
    if (selectedCategory) {
      result = result.filter(u => u.category === selectedCategory);
    }
    if (selectedFeature) {
      result = result.filter(u => u.features?.includes(selectedFeature));
    }
    return result;
  }, [universities, searchText, selectedRegion, selectedLevel, selectedCategory, selectedFeature]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const count985 = filteredData.filter(u => u.features?.includes('985')).length;
    const count211 = filteredData.filter(u => u.features?.includes('211')).length;
    const countDouble = filteredData.filter(u => u.features?.includes('双一流')).length;
    return { total, count985, count211, countDouble };
  }, [filteredData]);

  const regionRanking = useMemo(() => {
    const map = {};
    filteredData.forEach(u => {
      const r = u.region || '未知';
      map[r] = (map[r] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [filteredData]);

  const hotSchools = useMemo(() => {
    const hot = [
      '北京大学', '清华大学', '浙江大学', '复旦大学',
      '上海交通大学', '南京大学', '中国科学技术大学', '武汉大学',
      '华中科技大学', '中山大学', '哈尔滨工业大学', '西安交通大学',
    ];
    return universities
      .filter(u => hot.includes(u.name))
      .filter(u => {
        if (!selectedRegion) return true;
        const provinces = REGION_GROUPS[selectedRegion] || [selectedRegion];
        return provinces.includes(u.region);
      })
      .slice(0, 8);
  }, [universities, selectedRegion]);

  const flyToSchool = useCallback((school) => {
    if (!chartInstance.current || !school.lng) return;
    chartInstance.current.setOption({
      geo: {
        center: [school.lng, school.lat],
        zoom: 8,
      },
    }, true);
    setSelectedSchool(school);
  }, []);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current, null, { renderer: 'canvas' });
    chartInstance.current = chart;

    const loadMap = async () => {
      if (!chinaJsonRef.current) {
        const resp = await fetch(`${import.meta.env.BASE_URL}china.json`);
        chinaJsonRef.current = await resp.json();
        echarts.registerMap('china', chinaJsonRef.current);
      }

      const scatterData = filteredData.map(u => ({
        name: u.name,
        value: [u.lng, u.lat],
        school: u,
      }));

      chart.setOption({
        backgroundColor: 'transparent',
        animation: false,
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(255,255,255,0.96)',
          borderColor: '#e2e8f0',
          borderWidth: 1,
          padding: [10, 14],
          textStyle: { color: '#1a1a2e', fontSize: 13 },
          extraCssText: 'border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); max-width: 220px;',
          formatter: (params) => {
            if (params.seriesType !== 'scatter') return '';
            const s = params.data.school;
            const tags = s.features ? s.features.split('，').slice(0, 3).map(f =>
              `<span style="display:inline-block;padding:1px 6px;margin:0 2px;font-size:10px;border-radius:8px;background:${getMarkerColor(f)}18;color:${getMarkerColor(f)}">${f}</span>`
            ).join('') : '';
            return `<div>
              <div style="font-weight:700;font-size:14px">${s.name}</div>
              ${s.englishName ? `<div style="color:#94a3b8;font-size:11px;margin-top:2px">${s.englishName}</div>` : ''}
              ${tags ? `<div style="margin-top:6px">${tags}</div>` : ''}
              <div style="color:#64748b;font-size:11px;margin-top:4px">${s.region || ''}</div>
            </div>`;
          },
        },
        geo: {
          map: 'china',
          roam: true,
          zoom: 1.2,
          center: [104, 36],
          scaleLimit: { min: 1, max: 12 },
          itemStyle: {
            areaColor: '#f0f4f8',
            borderColor: '#cbd5e1',
            borderWidth: 0.6,
          },
          emphasis: {
            disabled: true,
          },
          label: { show: false },
        },
        series: [
          {
            type: 'scatter',
            coordinateSystem: 'geo',
            data: scatterData,
            symbol: 'circle',
            large: true,
            largeThreshold: 500,
            symbolSize: (val) => {
              const u = val[2] && val[2].school ? val[2].school : null;
              if (!u) return 5;
              return getMarkerSize(u.features);
            },
            itemStyle: {
              color: (params) => getMarkerColor(params.data.school?.features),
            },
            emphasis: {
              disabled: false,
              itemStyle: {
                shadowBlur: 0,
              },
              scale: 1.5,
            },
            zlevel: 1,
          },
        ],
      }, true);

      chart.on('click', 'series.scatter', (params) => {
        if (params.data?.school) {
          const school = params.data.school;
          setSelectedSchool(school);
          const pixel = chart.convertToPixel('geo', [school.lng, school.lat]);
          if (pixel) {
            const rect = chartRef.current.getBoundingClientRect();
            setCardPos({
              x: Math.min(pixel[0], rect.width - 300),
              y: Math.min(pixel[1], rect.height - 260),
            });
          }
        }
      });

      chart.getZr().on('click', (e) => {
        if (!e.target) {
          setSelectedSchool(null);
        }
      });
    };

    loadMap();

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      chartInstance.current = null;
    };
  }, [filteredData]);

  const searchOptions = useMemo(() => {
    if (!searchText || searchText.length < 1) return [];
    const s = searchText.toLowerCase();
    return universities
      .filter(u => u.name?.toLowerCase().includes(s) || u.englishName?.toLowerCase().includes(s))
      .slice(0, 6)
      .map(u => ({
        value: u.name,
        label: (
          <div className="map-search-option">
            <span className="map-search-name">{u.name}</span>
            <span className="map-search-meta">{u.region}</span>
          </div>
        ),
      }));
  }, [universities, searchText]);

  const clearAll = () => {
    setSearchText('');
    setSelectedRegion('');
    setSelectedLevel('');
    setSelectedCategory('');
    setSelectedFeature('');
  };

  const hasFilters = searchText || selectedRegion || selectedLevel || selectedCategory || selectedFeature;

  const getFeatureTags = (features) => {
    if (!features) return [];
    return features.split('，').map(f => f.trim()).filter(Boolean);
  };

  return (
    <div className="map-root">
      <nav className="map-nav">
        <div className="map-nav-inner">
          <div className="map-nav-brand">
            <BankOutlined className="map-nav-icon" />
            <span className="map-nav-title">中国高校地图分布</span>
          </div>
          <div className="map-nav-search">
            <AutoComplete
              style={{ width: screens.md ? 400 : 220 }}
              options={searchOptions}
              onSearch={setSearchText}
              value={searchText}
              onChange={setSearchText}
              backfill
            >
              <Input
                placeholder="搜索高校 / 城市 / 标签"
                prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                suffix={searchText ? <CloseCircleFilled onClick={() => setSearchText('')} style={{ color: '#94a3b8', cursor: 'pointer' }} /> : null}
                className="map-search-input"
              />
            </AutoComplete>
          </div>
          <div className="map-nav-actions">
            <a href={`${import.meta.env.BASE_URL}`} className="map-nav-link">列表视图</a>
          </div>
        </div>
      </nav>

      <div className="map-body">
        <aside className="map-panel-left">
          <div className="map-panel-card">
            <div className="map-panel-title">
              <FilterOutlined /> 筛选条件
            </div>

            <div className="map-filter-group">
              <div className="map-filter-label">地区</div>
              <Select
                style={{ width: '100%' }}
                placeholder="全部地区"
                allowClear
                value={selectedRegion || undefined}
                onChange={v => setSelectedRegion(v || '')}
                size="small"
              >
                {Object.keys(REGION_GROUPS).map(r => (
                  <Option key={r} value={r}>{r}</Option>
                ))}
              </Select>
            </div>

            <div className="map-filter-group">
              <div className="map-filter-label">办学层次</div>
              <Select
                style={{ width: '100%' }}
                placeholder="全部层次"
                allowClear
                value={selectedLevel || undefined}
                onChange={v => setSelectedLevel(v || '')}
                size="small"
              >
                {categories['办学层次'].map(l => (
                  <Option key={l} value={l}>{l}</Option>
                ))}
              </Select>
            </div>

            <div className="map-filter-group">
              <div className="map-filter-label">院校类型</div>
              <Select
                style={{ width: '100%' }}
                placeholder="全部类型"
                allowClear
                value={selectedCategory || undefined}
                onChange={v => setSelectedCategory(v || '')}
                size="small"
              >
                {categories['高校类型'].map(c => (
                  <Option key={c} value={c}>{c}</Option>
                ))}
              </Select>
            </div>

            <div className="map-filter-group">
              <div className="map-filter-label">院校特色</div>
              <Select
                style={{ width: '100%' }}
                placeholder="全部特色"
                allowClear
                value={selectedFeature || undefined}
                onChange={v => setSelectedFeature(v || '')}
                size="small"
              >
                {categories['院校特色'].map(f => (
                  <Option key={f} value={f}>{f}</Option>
                ))}
              </Select>
            </div>

            {hasFilters && (
              <button className="map-clear-btn" onClick={clearAll}>
                <CloseCircleFilled /> 清除全部筛选
              </button>
            )}
          </div>

          <div className="map-panel-card">
            <div className="map-panel-title">
              <BarChartOutlined /> 数据统计
            </div>
            <div className="map-stats-grid">
              <div className="map-stat-item">
                <div className="map-stat-value" style={{ color: '#3b82f6' }}>{stats.total.toLocaleString()}</div>
                <div className="map-stat-label">高校总数</div>
              </div>
              <div className="map-stat-item">
                <div className="map-stat-value" style={{ color: '#ef4444' }}>{stats.count985}</div>
                <div className="map-stat-label">985</div>
              </div>
              <div className="map-stat-item">
                <div className="map-stat-value" style={{ color: '#f97316' }}>{stats.count211}</div>
                <div className="map-stat-label">211</div>
              </div>
              <div className="map-stat-item">
                <div className="map-stat-value" style={{ color: '#8b5cf6' }}>{stats.countDouble}</div>
                <div className="map-stat-label">双一流</div>
              </div>
            </div>

            <div className="map-legend">
              <div className="map-legend-title">图例</div>
              {Object.entries(LEVEL_COLORS).filter(([k]) => k !== 'default').map(([key, color]) => (
                <div key={key} className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: color }} />
                  <span>{key}</span>
                </div>
              ))}
              <div className="map-legend-item">
                <span className="map-legend-dot" style={{ background: LEVEL_COLORS.default }} />
                <span>普通高校</span>
              </div>
            </div>
          </div>
        </aside>

        <main className="map-main">
          <div className="map-chart-container" ref={chartRef} />

          {selectedSchool && (
            <div
              className="map-school-card"
              style={{ left: cardPos.x, top: cardPos.y }}
            >
              <button className="map-card-close" onClick={() => setSelectedSchool(null)}>
                <CloseOutlined />
              </button>
              <div className="map-card-header">
                <div className="map-card-name">{selectedSchool.name}</div>
                {selectedSchool.englishName && (
                  <div className="map-card-english">{selectedSchool.englishName}</div>
                )}
              </div>
              <div className="map-card-tags">
                {selectedSchool.category && (
                  <span className="map-card-tag" style={{ background: '#eff6ff', color: '#3b82f6' }}>
                    {selectedSchool.category}
                  </span>
                )}
                {selectedSchool.level && (
                  <span className="map-card-tag" style={{
                    background: selectedSchool.level === '本科' ? '#f0fdf4' : '#fff7ed',
                    color: selectedSchool.level === '本科' ? '#16a34a' : '#ea580c',
                  }}>
                    {selectedSchool.level}
                  </span>
                )}
                {getFeatureTags(selectedSchool.features).slice(0, 3).map((tag, i) => (
                  <span
                    key={i}
                    className="map-card-tag"
                    style={{ background: `${getMarkerColor(tag)}15`, color: getMarkerColor(tag) }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="map-card-info">
                <div className="map-card-info-row">
                  <EnvironmentOutlined />
                  <span>{selectedSchool.region || selectedSchool.location || '-'}</span>
                </div>
                <div className="map-card-info-row">
                  <BankOutlined />
                  <span>{selectedSchool.department || '-'}</span>
                </div>
              </div>
              {selectedSchool.website && (
                <a
                  href={selectedSchool.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="map-card-link"
                >
                  <GlobalOutlined /> 访问官网 <LinkOutlined style={{ marginLeft: 'auto', fontSize: 11 }} />
                </a>
              )}
            </div>
          )}
        </main>

        <aside className="map-panel-right">
          <div className="map-panel-card">
            <div className="map-panel-title">
              <FireOutlined /> 地区排行
            </div>
            <div className="map-rank-list">
              {regionRanking.map(([region, count], idx) => (
                <div
                  key={region}
                  className="map-rank-item"
                  onClick={() => setSelectedRegion(
                    Object.keys(REGION_GROUPS).find(g => REGION_GROUPS[g].includes(region)) || region
                  )}
                >
                  <span className={`map-rank-num ${idx < 3 ? 'top' : ''}`}>{idx + 1}</span>
                  <span className="map-rank-name">{region}</span>
                  <span className="map-rank-count">{count} 所</span>
                </div>
              ))}
            </div>
          </div>

          <div className="map-panel-card">
            <div className="map-panel-title">
              <StarOutlined /> 热门高校
            </div>
            <div className="map-hot-list">
              {hotSchools.map(school => (
                <div
                  key={school.code}
                  className="map-hot-item"
                  onClick={() => flyToSchool(school)}
                >
                  <div className="map-hot-name">{school.name}</div>
                  <div className="map-hot-meta">
                    <span
                      className="map-hot-dot"
                      style={{ background: getMarkerColor(school.features) }}
                    />
                    <span>{school.region}</span>
                    {school.features && (
                      <span className="map-hot-tag">
                        {school.features.split('，')[0]}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MapView;
