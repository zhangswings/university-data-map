#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
教育部全国高等学校名单数据清洗与分类汇总处理脚本
"""

import pandas as pd
import os
import glob
from collections import defaultdict
import csv
import io

RAW_DATA_DIR = "raw_data"
OUTPUT_DIR = "processed_data"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def read_xls_file(filepath):
    try:
        df_raw = pd.read_excel(filepath, engine='xlrd', header=None)
        
        header_row = None
        for i, row in df_raw.iterrows():
            row_str = ' '.join([str(x) for x in row.values if pd.notna(x)])
            if '学校名称' in row_str and '主管部门' in row_str:
                header_row = i
                break
        
        if header_row is None:
            print(f"  警告: 未找到表头行，尝试使用第一行作为表头")
            header_row = 0
        
        df = pd.read_excel(filepath, engine='xlrd', header=header_row)
        
        df = df.dropna(how='all')
        
        return df
    except Exception as e:
        print(f"  读取失败: {e}")
        return None

def clean_data(df, year, school_type):
    if df is None or df.empty:
        return None
    
    original_count = len(df)
    
    df = df.dropna(how='all')
    
    df.columns = [str(c).strip() for c in df.columns]
    
    col_mapping = {}
    for col in df.columns:
        col_lower = col.lower()
        if '学校名称' in col or '校名' in col:
            col_mapping[col] = '学校名称'
        elif '主管部门' in col or '主管' in col:
            col_mapping[col] = '主管部门'
        elif '所在地' in col or '地区' in col or '省市' in col:
            col_mapping[col] = '所在地'
        elif '办学层次' in col or '层次' in col:
            col_mapping[col] = '办学层次'
        elif '学校标识码' in col or '标识码' in col:
            col_mapping[col] = '学校标识码'
        elif '备注' in col:
            col_mapping[col] = '备注'
    
    if col_mapping:
        df = df.rename(columns=col_mapping)
    
    df = df.dropna(subset=['学校名称'])
    df = df[df['学校名称'].str.strip() != '']
    
    df['学校名称'] = df['学校名称'].str.strip()
    df['学校名称'] = df['学校名称'].str.replace('\n', ' ').str.replace('\r', ' ')
    
    if '主管部门' in df.columns:
        df['主管部门'] = df['主管部门'].fillna('').str.strip()
        df['主管部门'] = df['主管部门'].str.replace('\n', ' ').str.replace('\r', ' ')
        df['主管部门'] = df['主管部门'].replace('', '未知')
    else:
        df['主管部门'] = '未知'
    
    if '所在地' in df.columns:
        df['所在地'] = df['所在地'].fillna('').str.strip()
        df['所在地'] = df['所在地'].str.replace('\n', ' ').str.replace('\r', ' ')
        df['所在地'] = df['所在地'].replace('', '未知')
    else:
        df['所在地'] = '未知'
    
    if '办学层次' in df.columns:
        df['办学层次'] = df['办学层次'].fillna('').str.strip()
        df['办学层次'] = df['办学层次'].str.replace('\n', ' ').str.replace('\r', ' ')
        df['办学层次'] = df['办学层次'].replace('', '未知')
    else:
        df['办学层次'] = '成人高等教育'
    
    province_mapping = {
        '北京': '北京市', '天津': '天津市', '河北': '河北省', '山西': '山西省',
        '内蒙古': '内蒙古自治区', '辽宁': '辽宁省', '吉林': '吉林省', '黑龙江': '黑龙江省',
        '上海': '上海市', '江苏': '江苏省', '浙江': '浙江省', '安徽': '安徽省',
        '福建': '福建省', '江西': '江西省', '山东': '山东省', '河南': '河南省',
        '湖北': '湖北省', '湖南': '湖南省', '广东': '广东省', '广西': '广西壮族自治区',
        '海南': '海南省', '重庆': '重庆市', '四川': '四川省', '贵州': '贵州省',
        '云南': '云南省', '西藏': '西藏自治区', '陕西': '陕西省', '甘肃': '甘肃省',
        '青海': '青海省', '宁夏': '宁夏回族自治区', '新疆': '新疆维吾尔自治区'
    }
    
    def normalize_province(loc):
        if pd.isna(loc) or loc == '':
            return '未知'
        loc = str(loc).strip()
        for key, value in province_mapping.items():
            if key in loc:
                return value
        return loc
    
    df['所在省份'] = df['所在地'].apply(normalize_province)
    
    def classify_school_type(level):
        if pd.isna(level) or level == '':
            return '未知'
        level = str(level).strip()
        if '本科' in level:
            return '本科'
        elif '专科' in level or '高职' in level:
            return '高职（专科）'
        elif '研究生' in level:
            return '研究生'
        else:
            return level
    
    df['学校性质'] = df['办学层次'].apply(classify_school_type)
    
    df['年份'] = year
    df['学校类型'] = school_type
    
    cleaned_count = len(df)
    print(f"  原始记录: {original_count}, 清洗后: {cleaned_count}, 移除: {original_count - cleaned_count}")
    
    return df

def process_all_files():
    all_data = []
    
    xls_files = glob.glob(os.path.join(RAW_DATA_DIR, "*_普通高等学校名单.xls"))
    xls_files += glob.glob(os.path.join(RAW_DATA_DIR, "*_成人高等学校名单.xls"))
    
    for filepath in sorted(xls_files):
        filename = os.path.basename(filepath)
        parts = filename.replace('.xls', '').split('_')
        year = parts[0]
        school_type = '普通高等学校' if '普通' in filename else '成人高等学校'
        
        print(f"\n处理: {filename}")
        df = read_xls_file(filepath)
        if df is not None:
            cleaned_df = clean_data(df, year, school_type)
            if cleaned_df is not None and not cleaned_df.empty:
                all_data.append(cleaned_df)
    
    if all_data:
        combined_df = pd.concat(all_data, ignore_index=True)
        print(f"\n总计合并记录: {len(combined_df)}")
        return combined_df
    return pd.DataFrame()

def create_summary(df):
    summary_data = []
    
    for department in sorted(df['主管部门'].unique()):
        dept_df = df[df['主管部门'] == department]
        dept_count = len(dept_df)
        
        for province in sorted(dept_df['所在省份'].unique()):
            prov_df = dept_df[dept_df['所在省份'] == province]
            prov_count = len(prov_df)
            
            for school_type in sorted(prov_df['学校性质'].unique()):
                type_df = prov_df[prov_df['学校性质'] == school_type]
                type_count = len(type_df)
                
                years = sorted(type_df['年份'].unique())
                
                summary_data.append({
                    '主管部门': department,
                    '所在省份': province,
                    '学校性质': school_type,
                    '学校数量': type_count,
                    '包含年份': ', '.join(str(y) for y in years),
                    '包含类型': ', '.join(sorted(type_df['学校类型'].unique()))
                })
        
        summary_data.append({
            '主管部门': department,
            '所在省份': '【小计】',
            '学校性质': '',
            '学校数量': prov_count,
            '包含年份': '',
            '包含类型': ''
        })
    
    total_count = len(df)
    summary_data.append({
        '主管部门': '【总计】',
        '所在省份': '',
        '学校性质': '',
        '学校数量': total_count,
        '包含年份': '',
        '包含类型': ''
    })
    
    return pd.DataFrame(summary_data)

def create_detailed_summary(df):
    summary_data = []
    
    for department in sorted(df['主管部门'].unique()):
        dept_df = df[df['主管部门'] == department]
        
        for province in sorted(dept_df['所在省份'].unique()):
            prov_df = dept_df[dept_df['所在省份'] == province]
            
            for school_type in sorted(prov_df['学校性质'].unique()):
                type_df = prov_df[prov_df['学校性质'] == school_type]
                
                type_counts = type_df['学校类型'].value_counts().to_dict()
                
                summary_data.append({
                    '主管部门': department,
                    '所在省份': province,
                    '学校性质': school_type,
                    '学校数量': len(type_df),
                    '普通高等学校数': type_counts.get('普通高等学校', 0),
                    '成人高等学校数': type_counts.get('成人高等学校', 0),
                    '年份范围': f"{type_df['年份'].min()}-{type_df['年份'].max()}" if len(type_df['年份'].unique()) > 1 else str(type_df['年份'].iloc[0])
                })
    
    return pd.DataFrame(summary_data)

def save_csv_with_bom(df, filepath):
    with open(filepath, 'w', encoding='utf-8-sig', newline='') as f:
        df.to_csv(f, index=False, quoting=csv.QUOTE_ALL)
    
    print(f"已保存: {filepath} ({len(df)} 行)")

def validate_data(df, summary_df):
    print("\n" + "="*60)
    print("数据校验")
    print("="*60)
    
    total_row = summary_df[summary_df['主管部门'] == '【总计】']
    if total_row.empty:
        print("✗ 校验失败: 未找到总计行")
        return False
    
    total_in_summary = total_row['学校数量'].sum()
    actual_total = len(df)
    
    print(f"原始数据总记录数: {actual_total}")
    print(f"汇总表总计数: {total_in_summary}")
    
    if total_in_summary == actual_total:
        print("✓ 校验通过: 总数匹配")
    else:
        print(f"✗ 校验失败: 差异 {abs(total_in_summary - actual_total)}")
        return False
    
    dept_summary = summary_df[(summary_df['所在省份'] == '【小计】') & (summary_df['主管部门'] != '【总计】')]
    
    dept_actual = df.groupby('主管部门').size()
    
    for _, row in dept_summary.iterrows():
        dept = row['主管部门']
        summary_count = row['学校数量']
        actual_count = dept_actual.get(dept, 0)
        
        if summary_count != actual_count:
            print(f"⚠ {dept} 数量有差异: 汇总={summary_count}, 实际={actual_count}")
    
    print("✓ 分类校验完成")
    return True

def main():
    print("="*60)
    print("教育部全国高等学校名单数据清洗与分类汇总")
    print("="*60)
    
    print("\n第一阶段: 数据清洗")
    print("-"*60)
    combined_df = process_all_files()
    
    if combined_df.empty:
        print("错误: 没有找到可处理的数据文件")
        return
    
    print("\n第二阶段: 生成汇总统计")
    print("-"*60)
    summary_df = create_summary(combined_df)
    detailed_df = create_detailed_summary(combined_df)
    
    print("\n第三阶段: 数据校验")
    print("-"*60)
    if not validate_data(combined_df, summary_df):
        print("数据校验失败，终止处理")
        return
    
    print("\n第四阶段: 导出CSV文件")
    print("-"*60)
    
    combined_df = combined_df[['年份', '学校标识码', '学校名称', '主管部门', '所在地', '所在省份', '办学层次', '学校性质', '学校类型', '备注']]
    save_csv_with_bom(combined_df, os.path.join(OUTPUT_DIR, "全国高等学校明细数据.csv"))
    save_csv_with_bom(summary_df, os.path.join(OUTPUT_DIR, "全国高等学校分类汇总.csv"))
    save_csv_with_bom(detailed_df, os.path.join(OUTPUT_DIR, "全国高等学校详细统计.csv"))
    
    print("\n" + "="*60)
    print("处理完成!")
    print("="*60)
    print(f"\n输出目录: {OUTPUT_DIR}/")
    print("  1. 全国高等学校明细数据.csv - 全部清洗后的明细数据")
    print("  2. 全国高等学校分类汇总.csv - 按主管部门→省份→性质分类汇总")
    print("  3. 全国高等学校详细统计.csv - 包含各类型学校数量的详细统计")
    
    print("\n数据概览:")
    print(f"  总记录数: {len(combined_df)}")
    print(f"  年份范围: {combined_df['年份'].min()} - {combined_df['年份'].max()}")
    print(f"  主管部门数: {combined_df['主管部门'].nunique()}")
    print(f"  省份数: {combined_df['所在省份'].nunique()}")
    print(f"  学校性质: {', '.join(combined_df['学校性质'].unique())}")

if __name__ == "__main__":
    main()
