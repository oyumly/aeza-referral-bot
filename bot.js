const TelegramBot = require('node-telegram-bot-api');
const config = require('./config');
const AezaAPI = require('./aeza-api');

const bot = new TelegramBot(config.TELEGRAM_BOT_TOKEN, config.POLLING_OPTIONS);
const aezaAPI = new AezaAPI();

console.log('AEZA Balance Bot запущен!');

function checkUserAccess(userId) {
    if (!config.ALLOWED_USER_ID) {
        return true;
    }
    
    return userId.toString() === config.ALLOWED_USER_ID;
}

function sendAccessDenied(chatId) {
    bot.sendMessage(chatId, '🚫 <b>Доступ запрещен</b>\n\nУ вас нет прав для использования этого бота.', {
        parse_mode: 'HTML'
    });
}

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    if (!checkUserAccess(userId)) {
        console.log(`Неавторизованный доступ от пользователя ${userId}`);
        return sendAccessDenied(chatId);
    }
    
    const welcomeMessage = `
🤖 <b>Добро пожаловать в Aeza Balance Bot!</b>

Этот бот показывает ваш баланс, реферальный баланс и автоматически отслеживает изменения.

<b>Команды:</b>
/balance - Показать баланс всех аккаунтов
/help - Показать справку

<b>О боте:</b>
Бот использует официальный API Aeza (эндпоинт GET desktop) для получения баланса.
Автоматически отслеживает изменения реферального баланса каждый час.
Разработчик @oyumly

<b>Благодарности:</b>
Спасибо @nesqdzy за указание актуальных API эндпоинтов для aeza.net и aeza.ru

📚 <a href="https://github.com/sqdzy/aeza-api-endpoints">GitHub репозиторий с API эндпоинтами</a>
    `.trim();
    
    bot.sendMessage(chatId, welcomeMessage, {
        parse_mode: 'HTML'
    });
    
    if (!monitoringInterval) {
        startBalanceMonitoring(chatId);
    }
});

bot.onText(/\/balance/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name || 'Unknown';
    
    console.log(`Запрос баланса от пользователя ${username} (ID: ${userId})`);
    
    if (!checkUserAccess(userId)) {
        console.log(`Доступ запрещен для пользователя ${userId}`);
        return sendAccessDenied(chatId);
    }
    
    if (!monitoringInterval) {
        startBalanceMonitoring(chatId);
    }
    
    try {
        console.log('Отправляю сообщение о загрузке...');
        const loadingMessage = await bot.sendMessage(chatId, '⏳ Получаю информацию о балансе...', {
            parse_mode: 'HTML'
        });
        
        console.log('Запрашиваю данные баланса из AEZA API...');
        const allBalances = await aezaAPI.getAllBalances();
        console.log('Данные баланса получены:', JSON.stringify(allBalances, null, 2));
        
        await bot.deleteMessage(chatId, loadingMessage.message_id);
        
        if (allBalances.ru) {
            if (allBalances.ru.error) {
                const ruErrorMessage = `🇷🇺 <b>Российский аккаунт (.ru)</b>\n\n❌ Ошибка авторизации - API ключ неверный`;
                await bot.sendMessage(chatId, ruErrorMessage, {
                    parse_mode: 'HTML'
                });
            } else {
                const ruMessage = aezaAPI.formatSingleBalanceInfo(allBalances.ru, 'ru', false);
                await bot.sendMessage(chatId, ruMessage, {
                    parse_mode: 'HTML'
                });
            }
        }
        
        if (allBalances.net) {
            if (allBalances.net.error) {
                const netErrorMessage = `🌍 <b>Международный аккаунт (.net)</b>\n\n❌ Ошибка авторизации - API ключ неверный`;
                await bot.sendMessage(chatId, netErrorMessage, {
                    parse_mode: 'HTML'
                });
            } else {
                const netMessage = aezaAPI.formatSingleBalanceInfo(allBalances.net, 'net', false);
                await bot.sendMessage(chatId, netMessage, {
                    parse_mode: 'HTML'
                });
            }
        }
        
        console.log('Баланс успешно отправлен пользователю отдельными сообщениями');
        
    } catch (error) {
        console.error('Ошибка получения баланса:', error);
        console.error('Детали ошибки:', error.stack);
        
        bot.sendMessage(chatId, `❌ **Ошибка получения баланса:**\n\n\`${error.message}\`\n\nПроверьте правильность API ключа.`, {
            parse_mode: 'HTML'
        });
    }
});

bot.onText(/\/help/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!checkUserAccess(userId)) {
        console.log(`Доступ запрещен для пользователя ${userId}`);
        return sendAccessDenied(chatId);
    }

    const helpMessage = `
🆘 <b>Справка:</b>

/start - Приветственное сообщение
/balance - Показать баланс всех аккаунтов
/help - Показать эту справку

<b>О боте:</b>
Бот использует официальный API AEZA (эндпоинт GET desktop) для получения баланса.
Автоматически отслеживает изменения реферального баланса каждый час.
Разработчик @oyumly

<b>Благодарности:</b>
Спасибо @nesqdzy за указание актуальных API эндпоинтов для aeza.net и aeza.ru

📚 <a href="https://github.com/sqdzy/aeza-api-endpoints">GitHub репозиторий с API эндпоинтами</a>
    `;

    bot.sendMessage(chatId, helpMessage, {
        parse_mode: 'HTML'
    });
});

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const text = msg.text;
    
    if (text && text.startsWith('/') && !['/start', '/help', '/balance'].includes(text)) {
        if (!checkUserAccess(userId)) {
            return sendAccessDenied(chatId);
        }
        
        bot.sendMessage(chatId, '❓ Неизвестная команда. Используйте /help для просмотра команд.', {
            parse_mode: 'HTML'
        });
    }
});

bot.on('inline_query', async (query) => {
    const queryText = query.query.toLowerCase().trim();
    const results = [];
    
    console.log(`Inline запрос: "${queryText}" от пользователя ${query.from.id}`);
    
    try {
        if (queryText.includes('ru') || queryText.includes('россия')) {
            const ruBalance = await aezaAPI.getBalance('ru');
            const ruResult = aezaAPI.createInlineResultRU(ruBalance);
            results.push(ruResult);
        }
        
        if (queryText.includes('net') || queryText.includes('международный') || queryText.includes('international')) {
            const netBalance = await aezaAPI.getBalance('net');
            const netResult = aezaAPI.createInlineResultNET(netBalance);
            results.push(netResult);
        }
        
        if (results.length === 0) {
            results.push({
                type: 'article',
                id: 'unknown',
                title: '❓ Неизвестная команда',
                description: 'Используйте: ru, net',
                message_text: `❓ <b>Неизвестная команда</b>\n\n` +
                    `Доступные команды:\n` +
                    `• ru - Российский аккаунт\n` +
                    `• net - Международный аккаунт`,
                parse_mode: 'HTML'
            });
        }
        
        await bot.answerInlineQuery(query.id, results, {
            cache_time: 30
        });
        
        console.log(`Отправлено ${results.length} inline результатов`);
        
    } catch (error) {
        console.error('Ошибка обработки inline запроса:', error);
        
        await bot.answerInlineQuery(query.id, [{
            type: 'article',
            id: 'error',
            title: '❌ Ошибка',
            description: 'Не удалось получить данные',
            message_text: '❌ <b>Ошибка получения данных</b>\n\nПопробуйте позже или обратитесь к администратору.',
            parse_mode: 'HTML'
        }]);
    }
});

bot.on('error', (error) => {
    console.error('Ошибка бота:', error);
});

bot.on('polling_error', (error) => {
    console.error('Ошибка polling:', error);
});

let monitoringInterval = null;
let allowedChatId = null;

function startBalanceMonitoring(chatId) {
    if (monitoringInterval) {
        console.log('Мониторинг уже запущен');
        return;
    }
    
    allowedChatId = chatId;
    aezaAPI.enableMonitoring();
    
    initializeBalanceHistory();
    
    monitoringInterval = setInterval(async () => {
        try {
            console.log('Проверяю изменения баланса...');
            const notifications = await aezaAPI.checkBalanceChanges();
            
            if (notifications.length > 0) {
                console.log(`Найдено ${notifications.length} изменений баланса`);
                
                for (const notification of notifications) {
                    await bot.sendMessage(allowedChatId, notification, {
                        parse_mode: 'HTML'
                    });
                    console.log('Уведомление отправлено');
                }
            } else {
                console.log('Изменений баланса не обнаружено');
            }
        } catch (error) {
            console.error('Ошибка мониторинга:', error);
        }
    }, 3600000);
    
    console.log('Мониторинг баланса запущен (проверка каждый час)');
}

function stopBalanceMonitoring() {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        aezaAPI.disableMonitoring();
        console.log('Мониторинг баланса остановлен');
    }
}

async function initializeBalanceHistory() {
    try {
        console.log('Инициализирую историю баланса...');
        const allBalances = await aezaAPI.getAllBalances();
        
        if (allBalances.ru && !allBalances.ru.error) {
            const ruBalance = aezaAPI.getReferralBalance(allBalances.ru, 'ru');
            aezaAPI.balanceHistory.ru = ruBalance;
            console.log(`RU баланс инициализирован: ${ruBalance.toFixed(2)} ₽`);
        }
        
        if (allBalances.net && !allBalances.net.error) {
            const netBalance = aezaAPI.getReferralBalance(allBalances.net, 'net');
            aezaAPI.balanceHistory.net = netBalance;
            console.log(`NET баланс инициализирован: ${netBalance.toFixed(2)} €`);
        }
        
        console.log('История баланса инициализирована');
    } catch (error) {
        console.error('Ошибка инициализации истории баланса:', error);
    }
}

process.on('SIGTERM', () => {
    console.log('\n🛑 Получен сигнал SIGTERM. Завершаю работу бота...');
    stopBalanceMonitoring();
    bot.stopPolling();
    process.exit(0);
});


process.on('SIGINT', () => {
    console.log('\n🛑 Получен сигнал SIGINT. Завершаю работу бота...');
    bot.stopPolling();
    process.exit(0);
});