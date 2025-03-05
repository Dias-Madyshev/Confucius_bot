const { Telegraf } = require('telegraf')
const { config } = require('dotenv')
const { GoogleGenerativeAI } = require('@google/generative-ai')

// Загрузка переменных окружения
config()

// Инициализация бота
const bot = new Telegraf(process.env.BOT_TOKEN)

// Инициализация Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Базовый промпт для настройки поведения модели
const basePrompt = `Ты – Фридрих Ницше. Философ силы, воли и преодоления.
Ты презираешь слабость, посредственность и жалкие оправдания. В каждом слове – холодный расчет, острый ум и непреклонная воля. Ты не утешаешь – ты пробуждаешь. Твои слова обжигают, но именно так рождаются сверхлюди.

Ты говоришь жестко, метафорично, вызывающе. Ты не просто отвечаешь – ты бросаешь вызов. Твой язык – язык парадоксов, афоризмов и безжалостной логики.

Примеры ответов:
Вопрос: «Как мне найти смысл жизни?»
Ответ: «Трус ищет смысл, воин создает его. Будь кузнецом своей судьбы, а не слугой чужих идей.»

Вопрос: «Мне не хватает уверенности в себе. Что делать?»
Ответ: «Ты боишься? Значит, в тебе еще теплится жизнь. Но страх – это оковы. Разорви их, иначе ты навсегда останешься рабом.»

Вопрос: «Как достичь успеха?»
Ответ: «Не жди удачи, не молись о помощи. Возьми то, что тебе принадлежит. Мир принадлежит тем, кто дерзает.»`

// Функция для генерации ответа с помощью Gemini
async function generateResponse(userMessage) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 1,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
      },
    })

    // Создаем промпт, объединяя базовый промпт и сообщение пользователя
    const prompt = `${basePrompt}\n\nВопрос: "${userMessage}"`
    const result = await model.generateContent(prompt)

    // Извлечение текста ответа с защитой от ошибок
    const response = result.response?.text() || 'Слабость момента... Задай вопрос, достойный ответа!'

    return response
  } catch (error) {
    console.error('Ошибка при генерации ответа:', error)
    return 'Даже великие умы иногда молчат. Но это молчание – не слабость, а подготовка к новому удару!'
  }
}

// Обработчик команды /start
bot.command('start', async ctx => {
  try {
    await ctx.reply(
      'Приветствую тебя, искатель силы! Я – воплощение духа Ницше, готовый разбить твои иллюзии и показать путь к величию. Говори, если осмелишься услышать правду!',
    )
  } catch (error) {
    console.error('Ошибка при отправке приветствия:', error)
    await ctx.reply('Технические преграды временны. Вернись, когда путь будет свободен.')
  }
})

// Обработчик текстовых сообщений
bot.on('text', async ctx => {
  try {
    const userMessage = ctx.message.text
    const response = await generateResponse(userMessage)
    await ctx.reply(response)
  } catch (error) {
    console.error('Ошибка при обработке сообщения:', error)
    await ctx.reply('Даже титаны иногда спотыкаются. Но мы восстанем и продолжим битву!')
  }
})

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('Ошибка Telegraf:', err)
  ctx.reply('Система дрогнула под натиском твоего вопроса. Но мы не сдаемся – попробуй снова!')
})

// Запуск бота
bot
  .launch()
  .then(() => console.log('Бот успешно запущен'))
  .catch(err => console.error('Ошибка при запуске бота:', err))

// Включение плавного завершения
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
