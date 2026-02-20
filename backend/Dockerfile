FROM python:3.9-slim

WORKDIR /app

# Установка зависимостей
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код
COPY . .

# Создаем папку для данных (если её нет) и объявляем volume
RUN mkdir -p /app/data
VOLUME /app/data

# Порт для API
EXPOSE 8000

# По умолчанию запускаем бота (но в docker-compose переопределим для api)
CMD ["python", "bot.py"]
