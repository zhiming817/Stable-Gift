#!/bin/bash

# 程序名称 (请确保上传到服务器的二进制文件名为此名称，或者修改此处)
APP_NAME="stable-gift-backend"
LOG_FILE="server.log"

# 检查当前目录下是否存在二进制文件
if [ ! -f "./$APP_NAME" ]; then
    echo "Error: Binary file './$APP_NAME' not found!"
    echo "Please make sure you are in the correct directory and the binary exists."
    exit 1
fi

# 检查程序是否已经在运行
PID=$(ps -ef | grep "./$APP_NAME" | grep -v grep | awk '{print $2}')

if [ -n "$PID" ]; then
    echo "⚠️  $APP_NAME is already running with PID: $PID"
    echo "Use ./stop.sh to stop it first."
    exit 1
fi

# 添加执行权限
chmod +x ./$APP_NAME

# 后台启动
echo "🚀 Starting $APP_NAME..."
nohup ./$APP_NAME > $LOG_FILE 2>&1 &

# 等待一秒检查状态
sleep 1
NEW_PID=$(ps -ef | grep "./$APP_NAME" | grep -v grep | awk '{print $2}')

if [ -n "$NEW_PID" ]; then
    echo "✅ $APP_NAME started successfully!"
    echo "   PID: $NEW_PID"
    echo "   Logs: tail -f $LOG_FILE"
else
    echo "❌ Failed to start $APP_NAME."
    echo "   Check $LOG_FILE for details."
fi
