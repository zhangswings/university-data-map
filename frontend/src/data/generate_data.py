#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成前端使用的JSON数据文件
"""

import pandas as pd
import json
import os

RAW_DATA_DIR = "../../../university_data/raw_data"
OUTPUT_DIR = "../data"

def load_and_process_data():
    df = pd.read_csv(os.path.join(RAW_DATA_DIR, "数据.tsv"), sep='\t')
    
    df = df.rename(columns={
        '状态': 'status',
        '地区': 'region',
        '学校标识码': 'code',
        '学校名称': 'name',
        '主管部门': 'department',
        '所在地': 'location',
        '办学层次': 'level',
        '备注': 'remark',
        'adminType': 'adminType',
        'categoryName': 'category',
        '英文名称': 'englishName',
        '双一流建设': 'features',
        '官网链接': 'website'
    })
    
    df = df[df['status'] == 1]
    
    return df

def generate_category_data(df):
    categories = {
        '高校类型': [
            '综合', '理工', '农林', '医药', '师范', '语言', '财经', 
            '政法', '体育', '艺术', '民族', '军事', '其他'
        ],
        '院校所属': sorted(df['region'].unique().tolist()),
        '办学层次': ['本科', '高职（专科）', '研究生'],
        '办学类型': ['公办', '民办', '中外合作办学', '内地与港澳台地区合作办学'],
        '院校特色': ['985', '211', '双一流', '教育部直属', '中央部委', '强基计划', '双高计划']
    }
    return categories

def clean_nan_values(obj):
    if isinstance(obj, dict):
        return {k: clean_nan_values(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan_values(item) for item in obj]
    elif pd.isna(obj):
        return None
    elif isinstance(obj, float) and obj == int(obj):
        return int(obj)
    else:
        return obj

def main():
    print("加载数据...")
    df = load_and_process_data()
    print(f"加载了 {len(df)} 条记录")
    
    print("生成分类数据...")
    categories = generate_category_data(df)
    
    print("转换为JSON...")
    data = df.to_dict(orient='records')
    
    data = clean_nan_values(data)
    
    output = {
        'categories': categories,
        'universities': data,
        'total': len(data)
    }
    
    output = clean_nan_values(output)
    
    output_path = os.path.join(OUTPUT_DIR, 'universities.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"数据已保存到 {output_path}")
    print(f"总记录数: {len(data)}")

if __name__ == "__main__":
    main()
