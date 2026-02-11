#!/bin/bash

APP_NAME="stable-gift-backend"

# 查找 PID
PID=$(ps -ef | grep "./$APP_NAME" | grep -v grep | awk '{print $2}')

if [ -z "$PID" ]; then
    echo "⚠️  $APP_NAME is not running."
    exit 0
fi

echo "🛑 Stopping $APP_NAME (PID: $PID)..."
kill $PID

# 等待进程结束
for i in {1..5}; do
    if ! ps -p $PID > /dev/null; then
        echo "✅ Stopped successfully."
        exit 0
    fi
    sleep 1
done

# 如果还在运行，强制关闭
echo "⚠️  Process did not stop gracefully, force killing..."
kill -9 $PID
echo "✅ Force killed."
