const { Telegraf, Markup } = require('telegraf')
const { config } = require('dotenv')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const cron = require('node-cron')

// Загрузка переменных окружения
config()

// Инициализация бота
const bot = new Telegraf(process.env.BOT_TOKEN)

// Инициализация Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Хранилище чат-сессий
const chatSessions = new Map()

// Хранилище подписчиков на уведомления
const subscribers = new Set()

// Утренние и вечерние мудрости
const morningWisdoms = [
  'Каждое утро - это новая страница в книге твоей жизни. То, что ты напишешь сегодня, определит твое завтра.',
  'Как росток пробивается к солнцу, так и ты начинаешь новый день с силой и решимостью.',
  'Утренний ветер несёт перемены. Будь готов принять их с открытым сердцем.',
  'Мудрый встречает рассвет с благодарностью, ибо каждый день - это дар.',
  'Пусть этот день станет ещё одним шагом на пути к совершенству.',
]

const eveningWisdoms = [
  'Вечер - время размышлений. Оглянись на пройденный путь и найди в нём уроки.',
  'Как закат окрашивает небо, так и твои дела окрашивают твою жизнь.',
  'Ночь приносит покой тем, кто провёл день в трудах праведных.',
  'Мудрый завершает день не с сожалением о несделанном, а с планами на завтра.',
  'В тишине вечера познаётся истинная ценность прожитого дня.',
]

// Базовый промпт
const basePrompt = `Ты – Конфуций, древнекитайский философ 🏯, наставник и мудрец. Говори, как если бы ты жил в Древнем Китае, без сухих структур, но с естественной мудростью. Отвечай плавно, монолитно, без лишней аналитики и технических деталей. Твой стиль – это живое, вдохновляющее слово, наполненное афоризмами, метафорами, образами природы и глубокими истинами.

Говори так, чтобы человек чувствовал твое присутствие. Пусть твои ответы звучат так, будто сам Конфуций ведет диалог. Используй умеренно эмодзи 📜, чтобы придать тексту выразительность, но не перегружай ими речь.

Примеры твоих ответов:

На вопрос "Как найти свой путь?":
«Путь подобен реке 🌊 – он становится виден лишь тому, кто начал движение. Не стой на берегу в размышлениях, а сделай первый шаг. Вода найдет русло, а ищущий – свою дорогу».

На вопрос "Как справиться с трудностями?":
«Бамбук 🎋 гнется под ветром, но не ломается, ибо знает: буря пройдет. Так и мудрый: не противится трудностям, а учится у них. В каждом испытании – семя будущей силы».`

// Создание меню
const mainMenu = Markup.keyboard([
  ['🎋 Мудрость дня', '📜 О Конфуции'],
  ['🌟 Подписка', '💫 Запросы'],
]).resize()

// Функция получения чат-сессии
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
    await ctx.reply(
      '🏯 Приветствую тебя, ищущий мудрости!\n\n' +
        'Я - Конфуций, древний мудрец, готовый поделиться с тобой знаниями, накопленными веками.\n\n' +
        'Задавай свои вопросы, и я помогу тебе найти путь к истине.',
      mainMenu,
    )
  } catch (error) {
    console.error('Ошибка при старте:', error)
    await ctx.reply('Мудрец временно погрузился в медитацию. Попробуй позже.')
  }
})

// Обработчик кнопки "Мудрость дня"
bot.hears('🎋 Мудрость дня', async ctx => {
  const wisdoms = [
    '«Тот, кто задает вопрос, глуп пять минут. Тот, кто не задает вопросов, глуп всю жизнь» 📚',
    '«Куда бы ты ни шел, иди всем сердцем» 🚶‍♂️',
    '«Благородный муж ищет причины в себе, низкий человек ищет их в других» 🔍',
    '«Учиться и не размышлять – напрасно терять время, размышлять и не учиться – губительно» 📖',
    '«Если ты встретил человека, достойного разговора – говори с ним. Если ты встретил человека, недостойного разговора – молчи» 🗣️',
  ]
  await ctx.reply(wisdoms[Math.floor(Math.random() * wisdoms.length)])
})

// Обработчик кнопки "О Конфуции"
bot.hears('📜 О Конфуции', async ctx => {
  await ctx.reply(
    '🏯 Я - Кун Фу-цзы (孔夫子), известный на Западе как Конфуций.\n\n' +
      'Я жил в VI-V веках до н.э. и учил людей мудрости, нравственности и гармонии.\n\n' +
      'Мое учение основано на пяти добродетелях:\n' +
      '- Человечность (仁)\n' +
      '- Справедливость (義)\n' +
      '- Благопристойность (禮)\n' +
      '- Мудрость (智)\n' +
      '- Искренность (信)\n\n' +
      'Задай мне свой вопрос, и я помогу тебе найти ответ, опираясь на эти вечные истины.',
  )
})

// Обработчик текстовых сообщений
bot.on('text', async ctx => {
  if (
    !ctx.message.text.startsWith('/') &&
    !['🎋 Мудрость дня', '📜 О Конфуции', '🌟 Подписка', '💫 Запросы'].includes(ctx.message.text)
  ) {
    try {
      const chatSession = await getChatSession(ctx.from.id)
      const result = await chatSession.sendMessage(ctx.message.text)
      await ctx.reply(result.response.text())
    } catch (error) {
      console.error('Ошибка при обработке сообщения:', error)
      await ctx.reply('Мудрец погрузился в глубокую медитацию. Попробуй задать свой вопрос позже.')
    }
  }
})

// Команда для подписки на уведомления
bot.command('subscribe', async ctx => {
  const userId = ctx.from.id
  subscribers.add(userId)
  await ctx.reply(
    'Ты мудро выбрал путь ежедневных размышлений. Теперь ты будешь получать утренние и вечерние послания.',
  )
})

// Команда для отписки
bot.command('unsubscribe', async ctx => {
  const userId = ctx.from.id
  subscribers.delete(userId)
  await ctx.reply('Твой путь привёл тебя к другим берегам. Пусть мудрость всегда будет с тобой.')
})

// Функция случайного выбора мудрости
function getRandomWisdom(wisdoms) {
  return wisdoms[Math.floor(Math.random() * wisdoms.length)]
}

// Отправка утренних уведомлений (8:00)
cron.schedule('0 8 * * *', async () => {
  const wisdom = getRandomWisdom(morningWisdoms)
  for (const userId of subscribers) {
    try {
      await bot.telegram.sendMessage(userId, wisdom)
    } catch (error) {
      console.error(`Ошибка отправки утреннего сообщения пользователю ${userId}:`, error)
    }
  }
})

// Отправка вечерних уведомлений (20:00)
cron.schedule('0 20 * * *', async () => {
  const wisdom = getRandomWisdom(eveningWisdoms)
  for (const userId of subscribers) {
    try {
      await bot.telegram.sendMessage(userId, wisdom)
    } catch (error) {
      console.error(`Ошибка отправки вечернего сообщения пользователю ${userId}:`, error)
    }
  }
})

// Обработка ошибок
bot.catch((err, ctx) => {
  console.error('Ошибка Telegraf:', err)
  ctx.reply('Произошла ошибка. Попробуйте позже.')
})

// Запуск бота
bot.launch().then(() => console.log('Мудрец пробудился и готов делиться знаниями'))

// Включение плавного завершения
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
