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

const PROVINCE_CENTER = {
  '北京市': [116.4, 39.9],
  '天津市': [117.2, 39.1],
  '河北省': [114.5, 38.0],
  '山西省': [112.5, 37.9],
  '内蒙古自治区': [111.7, 40.8],
  '辽宁省': [123.4, 41.8],
  '吉林省': [126.6, 43.9],
  '黑龙江省': [126.6, 45.8],
  '上海市': [121.5, 31.2],
  '江苏省': [118.8, 32.1],
  '浙江省': [120.2, 30.3],
  '安徽省': [117.3, 31.8],
  '福建省': [119.3, 26.1],
  '江西省': [115.9, 28.7],
  '山东省': [117.0, 36.7],
  '河南省': [113.7, 34.8],
  '湖北省': [114.3, 30.6],
  '湖南省': [112.9, 28.2],
  '广东省': [113.3, 23.1],
  '广西壮族自治区': [108.3, 22.8],
  '海南省': [110.3, 20.0],
  '重庆市': [106.5, 29.6],
  '四川省': [104.1, 30.6],
  '贵州省': [106.7, 26.6],
  '云南省': [102.7, 25.0],
  '西藏自治区': [91.1, 29.7],
  '陕西省': [108.9, 34.3],
  '甘肃省': [103.8, 36.1],
  '青海省': [101.8, 36.6],
  '宁夏回族自治区': [106.3, 38.5],
  '新疆维吾尔自治区': [87.6, 43.8],
  '台湾省': [121.5, 25.0],
  '香港特别行政区': [114.2, 22.3],
  '澳门特别行政区': [113.5, 22.2],
};

const PROVINCE_ZOOM = {
  '北京市': 7,
  '天津市': 7,
  '上海市': 7,
  '香港特别行政区': 8,
  '澳门特别行政区': 9,
};

const MapView = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFeature, setSelectedFeature] = useState('');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [cardPos, setCardPos] = useState({ x: 0, y: 0 });
  const [currentProvince, setCurrentProvince] = useState('');
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

  const provinceData = useMemo(() => {
    const map = {};
    filteredData.forEach(u => {
      const r = u.region || '未知';
      map[r] = (map[r] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

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
    setTimeout(() => {
      if (chartInstance.current) {
        chartInstance.current.setOption({
          geo: {
            center: [school.lng, school.lat],
            zoom: 6,
          },
        }, true);
      }
    }, 50);
    setSelectedSchool(school);
    setCurrentProvince('');
  }, []);

  const flyToProvinceRef = useRef(null);
  flyToProvinceRef.current = (provinceName) => {
    if (!chartInstance.current) return;
    const center = PROVINCE_CENTER[provinceName];
    if (!center) return;
    const zoom = PROVINCE_ZOOM[provinceName] || 5;
    setCurrentProvince(provinceName);
    setSelectedSchool(null);
    setTimeout(() => {
      if (chartInstance.current) {
        chartInstance.current.setOption({
          geo: { center, zoom },
        }, true);
      }
    }, 50);
  };

  useEffect(() => {
    if (!chartRef.current) return;

    let disposed = false;
    const chart = echarts.init(chartRef.current, null, { renderer: 'canvas' });
    chartInstance.current = chart;

    const loadMap = async () => {
      if (!chinaJsonRef.current) {
        const resp = await fetch(`${import.meta.env.BASE_URL}china.json`);
        chinaJsonRef.current = await resp.json();
        echarts.registerMap('china', chinaJsonRef.current);
      }

      if (disposed) return;

      const maxCount = Math.max(...provinceData.map(d => d.value), 1);

      const getColorByCount = (count) => {
        if (!count || count === 0) return '#e8eef6';
        const ratio = count / maxCount;
        const colors = ['#e0edff', '#bdd0ff', '#8bb3ff', '#5a96ff', '#3b82f6', '#2563eb', '#1d4ed8'];
        const idx = Math.min(Math.floor(ratio * colors.length), colors.length - 1);
        return colors[idx];
      };

      const regionColors = {};
      provinceData.forEach(d => {
        regionColors[d.name] = getColorByCount(d.value);
      });

      const scatterData = filteredData.map(u => ({
        name: u.name,
        value: [u.lng, u.lat],
        school: u,
      }));

      const chinaFeatures = chinaJsonRef.current.features || [];
      const regions = chinaFeatures.map(f => {
        const name = f.properties?.name;
        return {
          name,
          itemStyle: {
            areaColor: regionColors[name] || '#e8eef6',
            borderColor: '#c8d4e4',
            borderWidth: 0.6,
          },
        };
      });

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
          extraCssText: 'border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); max-width: 260px;',
          formatter: (params) => {
            if (params.seriesType === 'scatter') {
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
            }
            if (params.componentType === 'geo' || params.seriesType === 'map') {
              const provName = params.name;
              const count = provinceData.find(d => d.name === provName)?.value || 0;
              return `<div>
                <div style="font-weight:700;font-size:15px">${provName}</div>
                <div style="color:#3b82f6;font-size:20px;font-weight:700;margin-top:4px">${count}<span style="font-size:12px;color:#94a3b8;font-weight:400;margin-left:4px">所高校</span></div>
                <div style="color:#94a3b8;font-size:11px;margin-top:6px">点击查看省份详情</div>
              </div>`;
            }
            return '';
          },
        },
        visualMap: {
          type: 'continuous',
          min: 0,
          max: maxCount,
          left: 20,
          bottom: 30,
          text: ['多', '少'],
          textStyle: { color: '#64748b', fontSize: 11 },
          inRange: {
            color: ['#e0edff', '#bdd0ff', '#8bb3ff', '#5a96ff', '#3b82f6', '#2563eb', '#1d4ed8'],
          },
          calculable: false,
          show: true,
          itemWidth: 12,
          itemHeight: 100,
          seriesIndex: 0,
        },
        geo: {
          map: 'china',
          roam: true,
          zoom: 1.2,
          center: [104, 36],
          scaleLimit: { min: 0.8, max: 10 },
          regions,
          emphasis: {
            itemStyle: {
              areaColor: '#bdd0ff',
              borderColor: '#3b82f6',
              borderWidth: 1.5,
            },
            label: {
              show: true,
              color: '#1a1a2e',
              fontSize: 12,
              fontWeight: 600,
            },
          },
          label: { show: false },
        },
        series: [
          {
            type: 'map',
            map: 'china',
            geoIndex: 0,
            data: provinceData,
          },
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

      chart.on('click', 'geo', (params) => {
        if (params.name) {
          flyToProvinceRef.current(params.name);
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
      disposed = true;
      window.removeEventListener('resize', handleResize);
      chart.dispose();
      chartInstance.current = null;
    };
  }, [filteredData, provinceData]);

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

  const resetToNational = () => {
    setSearchText('');
    setSelectedRegion('');
    setSelectedLevel('');
    setSelectedCategory('');
    setSelectedFeature('');
    setSelectedSchool(null);
    setCurrentProvince('');
    setTimeout(() => {
      if (chartInstance.current) {
        chartInstance.current.setOption({
          geo: { center: [104, 36], zoom: 1.2 },
        }, true);
      }
    }, 50);
  };

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
            {currentProvince && (
              <button className="map-nav-back" onClick={() => { setCurrentProvince(''); setSelectedSchool(null); setTimeout(() => { if (chartInstance.current) chartInstance.current.setOption({ geo: { center: [104, 36], zoom: 1.2 } }, true); }, 50); }}>
                ← 返回全国
              </button>
            )}
            <button className="map-nav-btn" onClick={resetToNational}>
              <GlobalOutlined /> 全国视图
            </button>
            <a href={`${import.meta.env.BASE_URL}`} className="map-nav-link">列表视图</a>
          </div>
        </div>
      </nav>

      {currentProvince && (
        <div className="map-province-bar">
          <EnvironmentOutlined style={{ color: '#3b82f6' }} />
          <span className="map-province-name">{currentProvince}</span>
          <span className="map-province-count">
            {provinceData.find(d => d.name === currentProvince)?.value || 0} 所高校
          </span>
        </div>
      )}

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
              <div className="map-legend-title">学校特色图例</div>
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
                  onClick={() => {
                    setSelectedRegion(
                      Object.keys(REGION_GROUPS).find(g => REGION_GROUPS[g].includes(region)) || region
                    );
                    flyToProvinceRef.current(region);
                  }}
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

      <footer className="map-footer">
        <div className="footer-inner">
          <span>中国高校信息查询系统</span>
          <span className="footer-divider">|</span>
          <span>数据来源：<a href="https://www.moe.gov.cn/" target="_blank" rel="noopener noreferrer" className="footer-link">教育部全国高等学校名单</a></span>
          <span className="footer-divider">|</span>
          <span>更新时间：2025 年</span>
        </div>
        <div className="footer-note">本系统仅供参考，实际信息以各高校官方发布为准</div>
        <div className="footer-donate">
          <div className="donate-wrapper">
            <span className="donate-link">
              ☕ 如果这个项目对你有帮助，欢迎请作者喝杯咖啡
            </span>
            <div className="donate-qrcode">
              <img src={`${import.meta.env.BASE_URL}wechat-pay.jpg`} alt="微信赞赏码" />
              <div className="donate-qrcode-tip">微信扫一扫</div>
            </div>
          </div>
        </div>
        <div className="footer-github">
          <a href="https://github.com/zhangswings/university-data-map" target="_blank" rel="noopener noreferrer" className="github-link">
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor" style={{ marginRight: 6 }}>
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
};

export default MapView;
