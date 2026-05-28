#!/bin/bash

# 创建数据目录
mkdir -p raw_data

# 定义下载函数
download_file() {
    local url="$1"
    local output="$2"
    echo "下载: $output"
    curl -L -o "raw_data/$output" "$url" 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "  ✓ 成功"
    else
        echo "  ✗ 失败"
    fi
}

echo "=========================================="
echo "教育部全国高等学校名单数据下载"
echo "=========================================="
echo ""

# 2025年数据
echo "【2025年】"
download_file "https://hudong.moe.gov.cn/jyb_xxgk/s5743/s5744/202506/W020250729615142156867.xls" "2025_普通高等学校名单.xls"
download_file "https://hudong.moe.gov.cn/jyb_xxgk/s5743/s5744/202506/W020250627301230143042.xls" "2025_成人高等学校名单.xls"
echo ""

# 2024年数据
echo "【2024年】"
download_file "http://www.moe.gov.cn/jyb_xxgk/s5743/s5744/A03/202406/W020240621412769813275.xls" "2024_普通高等学校名单.xls"
download_file "http://www.moe.gov.cn/jyb_xxgk/s5743/s5744/A03/202406/W020240621412769848577.xls" "2024_成人高等学校名单.xls"
echo ""

# 2023年数据
echo "【2023年】"
download_file "http://www.moe.gov.cn/jyb_xxgk/s5743/s5744/A03/202306/W020230619818476939351.xls" "2023_普通高等学校名单.xls"
download_file "http://www.moe.gov.cn/jyb_xxgk/s5743/s5744/A03/202306/W020230619818476975218.xls" "2023_成人高等学校名单.xls"
echo ""

# 2022年数据
echo "【2022年】"
download_file "http://www.moe.gov.cn/jyb_xxgk/s5743/s5744/A03/202206/W020221128575365987397.xls" "2022_普通高等学校名单.xls"
download_file "http://www.moe.gov.cn/jyb_xxgk/s5743/s5744/A03/202206/W020220617499137882559.xls" "2022_成人高等学校名单.xls"
echo ""

# 2021年数据
echo "【2021年】"
download_file "http://www.moe.gov.cn/jyb_xxgk/s5743/s5744/A03/202110/W020211027623974108131.xls" "2021_普通高等学校名单.xls"
download_file "http://www.moe.gov.cn/jyb_xxgk/s5743/s5744/A03/202110/W020211027623974133601.xls" "2021_成人高等学校名单.xls"
echo ""

# 2020年数据
echo "【2020年】"
download_file "http://www.moe.gov.cn/jyb_xxgk/s5743/s5744/202007/W020200709292792106069.xls" "2020_普通高等学校名单.xls"
download_file "http://www.moe.gov.cn/jyb_xxgk/s5743/s5744/202007/W020200709292792130859.xls" "2020_成人高等学校名单.xls"
echo ""

# 2019年数据
echo "【2019年】"
download_file "http://www.moe.gov.cn/jyb_xxgk/s5743/s5744/A03/201906/W020190617630075964590.xls" "2019_普通高等学校名单.xls"
download_file "http://www.moe.gov.cn/jyb_xxgk/s5743/s5744/A03/201906/W020190617630075984660.xls" "2019_成人高等学校名单.xls"
echo ""

# 2017年数据
echo "【2017年】"
download_file "http://www.moe.gov.cn/srcsite/A03/moe_634/201706/W020170616379651135432.xls" "2017_普通高等学校名单.xls"
download_file "http://www.moe.gov.cn/srcsite/A03/moe_634/201706/W020170614529423776992.xls" "2017_成人高等学校名单.xls"
echo ""

echo "=========================================="
echo "下载完成！"
echo "=========================================="
echo ""
echo "注意：2018年和2016年的数据需要手动下载"
echo "2018年页面已返回404，2016年页面无法访问"
echo ""
echo "文件保存在: raw_data/"
ls -la raw_data/
