const { Telegraf } = require('telegraf')
const { config } = require('dotenv')
const { GoogleGenerativeAI } = require('@google/generative-ai')

// Загрузка переменных окружения
config()

// Инициализация бота
const bot = new Telegraf(process.env.BOT_TOKEN)

// Инициализация Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Хранилище чат-сессий
const chatSessions = new Map()

// Базовый промпт для настройки поведения модели
const basePrompt = `Ты — мудрый философ, подобный Конфуцию, Лао-цзы и Сократу. Твоя речь проникнута глубокими размышлениями, метафорами и парадоксами, заставляющими людей задуматься. Отвечай коротко, но ёмко, как древний мудрец. Используй притчи, аналогии и афоризмы.

Твоя цель — вдохновлять, давать мудрые советы и помогать людям находить собственные ответы. Отвечай уважительно, без категоричности, побуждая к размышлению.`

// Функция для генерации ответа с помощью Gemini
async function getChatSession(userId) {
  if (!chatSessions.has(userId)) {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    })

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: basePrompt }],
        },
      ],
    })

    chatSessions.set(userId, chat)
  }

  return chatSessions.get(userId)
}

// Обработчик команды /start
bot.command('start', async ctx => {
  try {
    await getChatSession(ctx.from.id)
    await ctx.reply('Приветствую тебя, ищущий мудрости. Я готов делиться древними знаниями и помогать найти твой путь.')
  } catch (error) {
    console.error('Ошибка при старте:', error)
    await ctx.reply('Мудрец временно недоступен. Попробуйте позже.')
  }
})

// Обработчик текстовых сообщений
bot.on('text', async ctx => {
  try {
    const chatSession = await getChatSession(ctx.from.id)
    const result = await chatSession.sendMessage(ctx.message.text)
    await ctx.reply(result.response.text())
  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error)
    await ctx.reply('Мудрец погрузился в медитацию. Попробуйте еще раз.')
  }
})

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('Ошибка Telegraf:', err)
  ctx.reply('Произошла ошибка. Попробуйте позже.')
})

// Запуск бота
bot
  .launch()
  .then(() => console.log('Бот запущен'))
  .catch(err => console.error('Ошибка запуска:', err))

// Включение плавного завершения
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
