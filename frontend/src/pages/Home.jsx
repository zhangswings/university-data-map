import { useState, useMemo, useCallback } from 'react';
import {
  Input,
  Row,
  Col,
  Space,
  Select,
  Table,
  Button,
  AutoComplete,
  Tooltip,
  Drawer,
  Segmented,
  Empty,
  Grid,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  BankOutlined,
  AppstoreOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  UnorderedListOutlined,
  AppstoreAddOutlined,
  ClearOutlined,
  DownOutlined,
  UpOutlined,
  GlobalOutlined,
  ReadOutlined,
  CloseCircleFilled,
  ArrowRightOutlined,
} from '@ant-design/icons';
import universityData from '../data/universities.json';
import './Home.css';

const { useBreakpoint } = Grid;
const { Option } = Select;

const FEATURE_COLOR_MAP = {
  '985': { color: '#ff4d4f', bg: '#fff1f0' },
  '211': { color: '#fa8c16', bg: '#fff7e6' },
  '双一流': { color: '#722ed1', bg: '#f9f0ff' },
  '教育部直属': { color: '#1890ff', bg: '#e6f7ff' },
  '中央部委': { color: '#13c2c2', bg: '#e6fffb' },
  '强基计划': { color: '#eb2f96', bg: '#fff0f6' },
  '双高计划': { color: '#52c41a', bg: '#f6ffed' },
};

const CATEGORY_COLOR_MAP = {
  '综合': { color: '#1890ff', bg: '#e6f7ff' },
  '理工': { color: '#13c2c2', bg: '#e6fffb' },
  '师范': { color: '#fa8c16', bg: '#fff7e6' },
  '医药': { color: '#f5222d', bg: '#fff1f0' },
  '农林': { color: '#52c41a', bg: '#f6ffed' },
  '财经': { color: '#faad14', bg: '#fffbe6' },
  '政法': { color: '#2f54eb', bg: '#f0f5ff' },
  '语言': { color: '#13c2c2', bg: '#e6fffb' },
  '体育': { color: '#fa541c', bg: '#fff2e8' },
  '艺术': { color: '#eb2f96', bg: '#fff0f6' },
  '民族': { color: '#722ed1', bg: '#f9f0ff' },
  '军事': { color: '#595959', bg: '#fafafa' },
};

const getFeatureStyle = (feature) => {
  for (const [key, style] of Object.entries(FEATURE_COLOR_MAP)) {
    if (feature?.includes(key)) return style;
  }
  return { color: '#8c8c8c', bg: '#f5f5f5' };
};

const getCategoryStyle = (category) => {
  return CATEGORY_COLOR_MAP[category] || { color: '#8c8c8c', bg: '#f5f5f5' };
};

const Home = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    region: '',
    level: '',
    adminType: '',
    features: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('list');
  const [sortField, setSortField] = useState('name');
  const [showSecondaryFilters, setShowSecondaryFilters] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const pageSize = 20;
  const screens = useBreakpoint();

  const { categories, universities } = universityData;

  const filteredData = useMemo(() => {
    let result = [...universities];

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      result = result.filter(
        (uni) =>
          uni.name?.toLowerCase().includes(searchLower) ||
          uni.englishName?.toLowerCase().includes(searchLower) ||
          uni.region?.toLowerCase().includes(searchLower) ||
          uni.features?.toLowerCase().includes(searchLower)
      );
    }

    if (selectedFilters.category) {
      result = result.filter((uni) => uni.category === selectedFilters.category);
    }
    if (selectedFilters.region) {
      result = result.filter((uni) => uni.region === selectedFilters.region);
    }
    if (selectedFilters.level) {
      result = result.filter((uni) => uni.level === selectedFilters.level);
    }
    if (selectedFilters.adminType) {
      result = result.filter((uni) => uni.adminType === selectedFilters.adminType);
    }
    if (selectedFilters.features.length > 0) {
      result = result.filter((uni) =>
        selectedFilters.features.some((feat) => uni.features?.includes(feat))
      );
    }

    if (sortField === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (sortField === 'region') {
      result.sort((a, b) => (a.region || '').localeCompare(b.region || ''));
    }

    return result;
  }, [universities, searchText, selectedFilters, sortField]);

  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const handleFilterChange = useCallback((filterType, value) => {
    setSelectedFilters((prev) => ({ ...prev, [filterType]: value }));
    setCurrentPage(1);
  }, []);

  const handleFeatureToggle = useCallback((feature) => {
    setSelectedFilters((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
    setCurrentPage(1);
  }, []);

  const clearAll = useCallback(() => {
    setSelectedFilters({ category: '', region: '', level: '', adminType: '', features: [] });
    setSearchText('');
    setCurrentPage(1);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedFilters.category) count++;
    if (selectedFilters.region) count++;
    if (selectedFilters.level) count++;
    if (selectedFilters.adminType) count++;
    count += selectedFilters.features.length;
    return count;
  }, [selectedFilters]);

  const activeFilterTags = useMemo(() => {
    const tags = [];
    if (selectedFilters.category) tags.push({ key: 'category', label: selectedFilters.category, type: '院校类型' });
    if (selectedFilters.region) tags.push({ key: 'region', label: selectedFilters.region, type: '所属地区' });
    if (selectedFilters.level) tags.push({ key: 'level', label: selectedFilters.level, type: '办学层次' });
    if (selectedFilters.adminType) tags.push({ key: 'adminType', label: selectedFilters.adminType, type: '办学类型' });
    selectedFilters.features.forEach((f) => tags.push({ key: 'feature', label: f, type: '院校特色', isFeature: true }));
    return tags;
  }, [selectedFilters]);

  const removeFilterTag = useCallback((tag) => {
    if (tag.isFeature) {
      handleFeatureToggle(tag.label);
    } else {
      handleFilterChange(tag.key, '');
    }
  }, [handleFeatureToggle, handleFilterChange]);

  const handleOpenDetail = useCallback((record) => {
    setSelectedSchool(record);
    setDrawerOpen(true);
  }, []);

  const getFeatureTags = (features) => {
    if (!features) return [];
    return features.split('，').map((f) => f.trim()).filter(Boolean);
  };

  const searchOptions = useMemo(() => {
    if (!searchText || searchText.length < 1) return [];
    const searchLower = searchText.toLowerCase();
    return universities
      .filter(
        (uni) =>
          uni.name?.toLowerCase().includes(searchLower) ||
          uni.englishName?.toLowerCase().includes(searchLower)
      )
      .slice(0, 8)
      .map((uni) => ({
        value: uni.name,
        label: (
          <div className="search-option-item">
            <div className="search-option-name">{uni.name}</div>
            <div className="search-option-meta">
              {uni.englishName && <span>{uni.englishName}</span>}
              <span>{uni.region}</span>
              {uni.category && <span>{uni.category}</span>}
            </div>
          </div>
        ),
      }));
  }, [universities, searchText]);

  const listColumns = [
    {
      title: '学校名称',
      dataIndex: 'name',
      key: 'name',
      width: 260,
      render: (text, record) => (
        <div className="cell-school-name" onClick={() => handleOpenDetail(record)}>
          <div className="school-name-primary">{text}</div>
          {record.englishName && (
            <div className="school-name-secondary">{record.englishName}</div>
          )}
        </div>
      ),
    },
    {
      title: '院校类型',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (text) => {
        const style = getCategoryStyle(text);
        return (
          <span className="pill-tag" style={{ color: style.color, background: style.bg }}>
            {text || '未知'}
          </span>
        );
      },
    },
    {
      title: '所属地区',
      dataIndex: 'region',
      key: 'region',
      width: 110,
      render: (text) => (
        <span className="region-cell">
          <EnvironmentOutlined /> {text}
        </span>
      ),
    },
    {
      title: '办学层次',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      render: (text) => {
        const isBenke = text === '本科';
        return (
          <span
            className="pill-tag"
            style={{
              color: isBenke ? '#52c41a' : '#fa8c16',
              background: isBenke ? '#f6ffed' : '#fff7e6',
            }}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: '院校特色',
      dataIndex: 'features',
      key: 'features',
      width: 240,
      render: (text) => {
        const tags = getFeatureTags(text);
        if (!tags.length) return <span className="text-muted">-</span>;
        return (
          <Space size={4} wrap>
            {tags.map((tag, i) => {
              const style = getFeatureStyle(tag);
              return (
                <span
                  key={i}
                  className="pill-tag"
                  style={{ color: style.color, background: style.bg }}
                >
                  {tag}
                </span>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: '主管部门',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      ellipsis: true,
    },
    {
      title: '官网',
      dataIndex: 'website',
      key: 'website',
      width: 60,
      align: 'center',
      render: (text) =>
        text ? (
          <Tooltip title={text}>
            <a
              href={text}
              target="_blank"
              rel="noopener noreferrer"
              className="website-link"
              onClick={(e) => e.stopPropagation()}
            >
              <LinkOutlined />
            </a>
          </Tooltip>
        ) : (
          <span className="text-muted">-</span>
        ),
    },
  ];

  const renderCardView = () => {
    if (!pagedData.length) return <Empty description="暂无匹配的高校数据" />;
    return (
      <Row gutter={[16, 16]}>
        {pagedData.map((uni) => {
          const featureTags = getFeatureTags(uni.features);
          const catStyle = getCategoryStyle(uni.category);
          return (
            <Col xs={24} sm={12} lg={8} xl={6} key={uni.code}>
              <div className="school-card" onClick={() => handleOpenDetail(uni)}>
                <div className="school-card-header">
                  <div className="school-card-name">{uni.name}</div>
                  {uni.englishName && (
                    <div className="school-card-english">{uni.englishName}</div>
                  )}
                </div>
                <div className="school-card-body">
                  <div className="school-card-meta">
                    <span
                      className="pill-tag"
                      style={{ color: catStyle.color, background: catStyle.bg }}
                    >
                      {uni.category || '未知'}
                    </span>
                    <span className="school-card-region">
                      <EnvironmentOutlined /> {uni.region}
                    </span>
                  </div>
                  {featureTags.length > 0 && (
                    <div className="school-card-features">
                      {featureTags.slice(0, 3).map((tag, i) => {
                        const style = getFeatureStyle(tag);
                        return (
                          <span
                            key={i}
                            className="pill-tag pill-tag-sm"
                            style={{ color: style.color, background: style.bg }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                      {featureTags.length > 3 && (
                        <span className="pill-tag pill-tag-sm pill-tag-more">
                          +{featureTags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="school-card-footer">
                  <span className="school-card-dept">{uni.department || '-'}</span>
                  {uni.website && (
                    <a
                      href={uni.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="website-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LinkOutlined /> 官网
                    </a>
                  )}
                </div>
              </div>
            </Col>
          );
        })}
      </Row>
    );
  };

  const stats = useMemo(
    () => ({
      total: universities.length,
      filtered: filteredData.length,
      categories: [...new Set(universities.map((u) => u.category))].filter(Boolean).length,
      regions: [...new Set(universities.map((u) => u.region))].filter(Boolean).length,
    }),
    [universities, filteredData]
  );

  const filterPanelContent = (
    <div className="filter-panel">
      <div className="filter-primary-row">
        <div className="filter-item">
          <div className="filter-label">院校类型</div>
          <Select
            style={{ width: '100%' }}
            placeholder="全部类型"
            allowClear
            value={selectedFilters.category || undefined}
            onChange={(v) => handleFilterChange('category', v || '')}
            size={screens.md ? 'middle' : 'small'}
          >
            {categories['高校类型'].map((cat) => (
              <Option key={cat} value={cat}>
                {cat}
              </Option>
            ))}
          </Select>
        </div>
        <div className="filter-item">
          <div className="filter-label">所属地区</div>
          <Select
            style={{ width: '100%' }}
            placeholder="全部地区"
            allowClear
            showSearch
            value={selectedFilters.region || undefined}
            onChange={(v) => handleFilterChange('region', v || '')}
            size={screens.md ? 'middle' : 'small'}
          >
            {categories['院校所属'].map((r) => (
              <Option key={r} value={r}>
                {r}
              </Option>
            ))}
          </Select>
        </div>
        <div className="filter-item">
          <div className="filter-label">办学层次</div>
          <Select
            style={{ width: '100%' }}
            placeholder="全部层次"
            allowClear
            value={selectedFilters.level || undefined}
            onChange={(v) => handleFilterChange('level', v || '')}
            size={screens.md ? 'middle' : 'small'}
          >
            {categories['办学层次'].map((l) => (
              <Option key={l} value={l}>
                {l}
              </Option>
            ))}
          </Select>
        </div>
        <div className="filter-item">
          <div className="filter-label">办学类型</div>
          <Select
            style={{ width: '100%' }}
            placeholder="全部类型"
            allowClear
            value={selectedFilters.adminType || undefined}
            onChange={(v) => handleFilterChange('adminType', v || '')}
            size={screens.md ? 'middle' : 'small'}
          >
            {categories['办学类型'].map((t) => (
              <Option key={t} value={t}>
                {t}
              </Option>
            ))}
          </Select>
        </div>
      </div>

      <div className="filter-secondary">
        <div
          className="filter-secondary-toggle"
          onClick={() => setShowSecondaryFilters(!showSecondaryFilters)}
        >
          <span>
            <TagOutlined /> 院校特色筛选
            {selectedFilters.features.length > 0 && (
              <span className="feature-count">{selectedFilters.features.length}</span>
            )}
          </span>
          {showSecondaryFilters ? <UpOutlined /> : <DownOutlined />}
        </div>
        {showSecondaryFilters && (
          <div className="feature-tags-row">
            {categories['院校特色'].map((feature) => {
              const isActive = selectedFilters.features.includes(feature);
              const style = isActive ? getFeatureStyle(feature) : null;
              return (
                <span
                  key={feature}
                  className={`feature-chip ${isActive ? 'active' : ''}`}
                  onClick={() => handleFeatureToggle(feature)}
                  style={
                    isActive
                      ? { color: style.color, background: style.bg, borderColor: style.color }
                      : undefined
                  }
                >
                  {feature}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="app-root">
      <nav className="top-nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <BankOutlined className="nav-icon" />
            <span className="nav-title">高校数据平台</span>
          </div>
          <div className="nav-meta">数据来源：教育部 2025</div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-inner">
          <h1 className="hero-title">中国高校信息查询</h1>
          <p className="hero-subtitle">覆盖全国 2,868 所普通高等学校 · 多维度筛选 · 实时查询</p>
          <div className="hero-search">
            <AutoComplete
              style={{ width: '100%' }}
              options={searchOptions}
              onSearch={setSearchText}
              value={searchText}
              onChange={setSearchText}
              backfill
            >
              <Input
                size="large"
                placeholder="搜索高校名称 / 英文名称 / 城市 / 高校标签"
                prefix={<SearchOutlined className="search-prefix-icon" />}
                suffix={
                  searchText ? (
                    <CloseCircleFilled
                      className="search-clear-icon"
                      onClick={() => setSearchText('')}
                    />
                  ) : null
                }
                className="hero-input"
              />
            </AutoComplete>
          </div>
        </div>
      </section>

      <main className="main-content">
        <div className="content-container">
          <Row gutter={16} className="stats-row">
            {[
              {
                title: '高校总数',
                value: stats.total,
                suffix: '所',
                icon: <BankOutlined />,
                desc: '覆盖全国普通高等学校',
                color: '#1890ff',
              },
              {
                title: '筛选结果',
                value: stats.filtered,
                suffix: '所',
                icon: <FilterOutlined />,
                desc: activeFilterCount > 0 ? `已应用 ${activeFilterCount} 个筛选条件` : '当前显示全部数据',
                color: '#52c41a',
                highlight: activeFilterCount > 0,
              },
              {
                title: '院校类型',
                value: stats.categories,
                suffix: '种',
                icon: <AppstoreOutlined />,
                desc: '涵盖综合、理工、医药等',
                color: '#722ed1',
              },
              {
                title: '覆盖地区',
                value: stats.regions,
                suffix: '个省市',
                icon: <EnvironmentOutlined />,
                desc: '遍布全国各省市自治区',
                color: '#fa8c16',
              },
            ].map((item, idx) => (
              <Col xs={12} md={6} key={idx}>
                <div className={`stat-card ${item.highlight ? 'stat-card-highlight' : ''}`}>
                  <div className="stat-card-icon" style={{ color: item.color }}>
                    {item.icon}
                  </div>
                  <div className="stat-card-content">
                    <div className="stat-card-label">{item.title}</div>
                    <div className="stat-card-value" style={{ color: item.color }}>
                      {item.value.toLocaleString()}
                      <span className="stat-card-suffix">{item.suffix}</span>
                    </div>
                    <div className="stat-card-desc">{item.desc}</div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          <div className="filter-section">
            {filterPanelContent}

            {activeFilterTags.length > 0 && (
              <div className="active-tags-bar">
                <span className="active-tags-label">已选条件：</span>
                <Space size={6} wrap>
                  {activeFilterTags.map((tag, i) => (
                    <span key={i} className="active-tag-chip">
                      <span className="active-tag-type">{tag.type}</span>
                      <span className="active-tag-value">{tag.label}</span>
                      <CloseCircleFilled
                        className="active-tag-close"
                        onClick={() => removeFilterTag(tag)}
                      />
                    </span>
                  ))}
                  <Button type="link" size="small" icon={<ClearOutlined />} onClick={clearAll}>
                    清除全部
                  </Button>
                </Space>
              </div>
            )}
          </div>

          <div className="results-section">
            <div className="results-header">
              <div className="results-header-left">
                <span className="results-count">
                  共找到 <strong>{filteredData.length.toLocaleString()}</strong> 所高校
                </span>
              </div>
              <div className="results-header-right">
                <Select
                  value={sortField}
                  onChange={setSortField}
                  size="small"
                  className="sort-select"
                >
                  <Option value="name">按名称排序</Option>
                  <Option value="region">按地区排序</Option>
                </Select>
                <Segmented
                  value={viewMode}
                  onChange={setViewMode}
                  size="small"
                  options={[
                    {
                      value: 'list',
                      icon: <UnorderedListOutlined />,
                    },
                    {
                      value: 'card',
                      icon: <AppstoreAddOutlined />,
                    },
                  ]}
                />
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="results-table-wrap">
                <Table
                  columns={listColumns}
                  dataSource={filteredData}
                  rowKey="code"
                  pagination={{
                    current: currentPage,
                    pageSize,
                    total: filteredData.length,
                    showSizeChanger: false,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条`,
                    onChange: setCurrentPage,
                    size: 'default',
                  }}
                  onRow={(record) => ({
                    onClick: () => handleOpenDetail(record),
                    style: { cursor: 'pointer' },
                  })}
                  size="middle"
                />
              </div>
            ) : (
              <div className="results-card-wrap">
                {renderCardView()}
                {filteredData.length > pageSize && (
                  <div className="card-pagination">
                    <Table
                      pagination={{
                        current: currentPage,
                        pageSize,
                        total: filteredData.length,
                        showSizeChanger: false,
                        showQuickJumper: true,
                        showTotal: (total) => `共 ${total} 条`,
                        onChange: setCurrentPage,
                        size: 'default',
                      }}
                      dataSource={[]}
                      columns={[]}
                      size="small"
                      className="hidden-table"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="app-footer">
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

      <Drawer
        title={null}
        placement="right"
        size={screens.md ? 'default' : 'large'}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        className="detail-drawer"
        destroyOnClose
      >
        {selectedSchool && (
          <div className="drawer-content">
            <div className="drawer-header">
              <div className="drawer-school-name">{selectedSchool.name}</div>
              {selectedSchool.englishName && (
                <div className="drawer-school-english">{selectedSchool.englishName}</div>
              )}
              <div className="drawer-tags">
                {selectedSchool.category && (
                  <span
                    className="pill-tag"
                    style={{
                      color: getCategoryStyle(selectedSchool.category).color,
                      background: getCategoryStyle(selectedSchool.category).bg,
                    }}
                  >
                    {selectedSchool.category}
                  </span>
                )}
                {selectedSchool.level && (
                  <span
                    className="pill-tag"
                    style={{
                      color: selectedSchool.level === '本科' ? '#52c41a' : '#fa8c16',
                      background: selectedSchool.level === '本科' ? '#f6ffed' : '#fff7e6',
                    }}
                  >
                    {selectedSchool.level}
                  </span>
                )}
                {getFeatureTags(selectedSchool.features).map((tag, i) => {
                  const style = getFeatureStyle(tag);
                  return (
                    <span
                      key={i}
                      className="pill-tag"
                      style={{ color: style.color, background: style.bg }}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="drawer-section">
              <div className="drawer-section-title">
                <BankOutlined /> 基本信息
              </div>
              <div className="drawer-info-grid">
                <div className="drawer-info-item">
                  <span className="drawer-info-label">主管部门</span>
                  <span className="drawer-info-value">{selectedSchool.department || '-'}</span>
                </div>
                <div className="drawer-info-item">
                  <span className="drawer-info-label">所在地区</span>
                  <span className="drawer-info-value">
                    <EnvironmentOutlined /> {selectedSchool.region || selectedSchool.location || '-'}
                  </span>
                </div>
                <div className="drawer-info-item">
                  <span className="drawer-info-label">办学类型</span>
                  <span className="drawer-info-value">{selectedSchool.adminType || '-'}</span>
                </div>
                <div className="drawer-info-item">
                  <span className="drawer-info-label">学校代码</span>
                  <span className="drawer-info-value">{selectedSchool.code || '-'}</span>
                </div>
              </div>
            </div>

            <div className="drawer-section">
              <div className="drawer-section-title">
                <ReadOutlined /> 学校简介
              </div>
              <p className="drawer-desc">
                {selectedSchool.name}是一所位于{selectedSchool.region || selectedSchool.location}
                的{selectedSchool.category || ''}类{selectedSchool.level || '高等'}院校，
                主管部门为{selectedSchool.department || '未知'}。
                {selectedSchool.features ? `该校为${selectedSchool.features}高校。` : ''}
              </p>
            </div>

            {selectedSchool.website && (
              <div className="drawer-section">
                <div className="drawer-section-title">
                  <GlobalOutlined /> 官方链接
                </div>
                <a
                  href={selectedSchool.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="drawer-link"
                >
                  <LinkOutlined /> {selectedSchool.website}
                  <ArrowRightOutlined className="drawer-link-arrow" />
                </a>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

const TagOutlined = () => (
  <svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024">
    <path d="M938.4 224.3L610.5 551.7c-1.5 1.5-3.4 2.3-5.4 2.3s-3.9-.8-5.4-2.3L483.3 435.3c-1.5-1.5-3.4-2.3-5.4-2.3-2 0-3.9.8-5.4 2.3L356.1 551.7c-1.5 1.5-3.4 2.3-5.4 2.3-2 0-3.9-.8-5.4-2.3L129.5 435.9c-3-3-7.1-4.7-11.3-4.7H72c-4.4 0-8-3.6-8-8v-46.2c0-4.4 3.6-8 8-8h46.2c4.2 0 8.3-1.7 11.3-4.7L345.3 148.5c3-3 4.7-7.1 4.7-11.3V91c0-4.4 3.6-8 8-8h46.2c4.4 0 8 3.6 8 8v46.2c0 4.2 1.7 8.3 4.7 11.3L632.7 364.3c3 3 7.1 4.7 11.3 4.7 4.2 0 8.3-1.7 11.3-4.7l116.4-116.4c3-3 4.7-7.1 4.7-11.3V190c0-4.4 3.6-8 8-8H838c4.4 0 8 3.6 8 8v46.2c0 4.2-1.7 8.3-4.7 11.3l-32.9 32.8z" />
  </svg>
);

export default Home;
