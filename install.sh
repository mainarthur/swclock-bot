echo "Установка зависимостей..."
npm i
mkdir "data"
touch ".env"
echo "Введите токен бота:"
read BOT_TOKEN
echo "Введите токен для логбота(можно токен самого бота):"
read LOG_BOT_TOKEN
echo "Введите айди админа:"
read ADMIN_ID
echo "Введите айди чата для логов (можно айди админа):"
read LOG_CHAT_ID

echo "BOT_TOKEN=$BOT_TOKEN" >> ".env"
echo "LOG_BOT_TOKEN=$LOG_BOT_TOKEN" >> ".env"
echo "ADMIN_ID=$ADMIN_ID" >> ".env"
echo "LOG_CHAT_ID=$LOG_CHAT_ID" >> ".env"

echo "Установка конфигураций завершена"
echo "Чтобы запустить бота выполните node index.js"