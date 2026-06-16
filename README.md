# My Aeza Balance Bot

Простой Telegram-бот для мониторинга баланса (основного и реферального) на аккаунтах Aeza (RU и NET) через их официальный API.

## Возможности
- Просмотр текущего баланса аккаунтов.
- Inline-режим для вызова баланса в любом чате (`@bot_username ru` или `net`).
- Ограничение доступа к боту по вашему Telegram ID (чтобы никто другой не мог смотреть ваш баланс).
- Автоматический ежечасный мониторинг изменений реферального баланса с уведомлениями.

## Установка и запуск

1. Склонируйте репозиторий:
   ```bash
   git clone https://github.com/oyumly/aeza-referral-bot.git
   cd my-ref-aeza
   ```
2. Установите зависимости:
   ```bash
   npm install
   ```
3. Скопируйте `.env.example` в `.env` и заполните данные:
   ```env
   TELEGRAM_BOT_TOKEN=токен_вашего_бота_от_BotFather
   AEZA_API_KEY_RU=api_ключ_от_my.aeza.ru
   AEZA_API_KEY_NET=api_ключ_от_my.aeza.net
   ALLOWED_USER_ID=ваш_telegram_id
   ```
4. Запустите бота:
   ```bash
   npm start
   ```

*P.S. Для работы inline-режима не забудьте включить "Inline Mode" в настройках вашего бота в @BotFather.*

## Структура
- `bot.js` — логика работы Telegram-бота.
- `aeza-api.js` — взаимодействие с API Aeza.
- `config.js` — конфигурация и работа с переменными окружения.

## Благодарности
Огромное спасибо [@nesqdzy](https://t.me/nesqdzy) за указание актуальных API эндпоинтов для aeza.net и aeza.ru (ссылка на репозиторий: [aeza-api-endpoints](https://github.com/sqdzy/aeza-api-endpoints)).

## Лицензия
MIT. Проект не имеет официального отношения к компании Aeza и написан для личного использования.
