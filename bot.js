const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Конфигурация
const CONFIG = {
    AUTO_ROLE_ID: process.env.AUTO_ROLE_ID || 'ID_РОЛИ_ДЛЯ_АВТОВЫДАЧИ',
    WELCOME_CHANNEL_ID: process.env.WELCOME_CHANNEL_ID || 'ID_КАНАЛА_ПРИВЕТСТВИЯ',
    LOGS_CHANNEL_ID: process.env.LOGS_CHANNEL_ID || 'ID_КАНАЛА_ЛОГОВ',
    APPLICATION_CHANNEL_ID: process.env.APPLICATION_CHANNEL_ID || 'ID_КАНАЛА_ЗАЯВОК',
    REVIEW_CHANNEL_ID: process.env.REVIEW_CHANNEL_ID || 'ID_КАНАЛА_РАССМОТРЕНИЯ',
    FOUNDER_ROLE_ID: process.env.FOUNDER_ROLE_ID || 'ID_РОЛИ_ОСНОВАТЕЛЯ',
    DEP_LEADER_ROLE_ID: process.env.DEP_LEADER_ROLE_ID || 'ID_РОЛИ_ДЕП_ЛИДЕРА',
    ASSISTANT_ROLE_ID: process.env.ASSISTANT_ROLE_ID || 'ID_РОЛИ_АССИСТЕНТА'
};

// Проверка прав доступа
function hasPermission(member) {
    return member.roles.cache.has(CONFIG.FOUNDER_ROLE_ID);
}

function hasReviewPermission(member) {
    return member.roles.cache.has(CONFIG.FOUNDER_ROLE_ID) ||
           member.roles.cache.has(CONFIG.DEP_LEADER_ROLE_ID) ||
           member.roles.cache.has(CONFIG.ASSISTANT_ROLE_ID);
}

// Создание embed в строгом стиле
function createStrictEmbed(title, description, footer = null) {
    const embed = new EmbedBuilder()
        .setColor('#000000')
        .setTitle(`━━━━━━━━━━━━━━━━━━━━━━\n${title}\n━━━━━━━━━━━━━━━━━━━━━━`)
        .setDescription(description)
        .setTimestamp();
    
    if (footer) {
        embed.setFooter({ text: footer });
    }
    
    return embed;
}

// Отправка лога
async function sendLog(client, title, description) {
    try {
        const logChannel = client.channels.cache.get(CONFIG.LOGS_CHANNEL_ID);
        if (logChannel) {
            const logEmbed = createStrictEmbed(
                `📋 ${title}`,
                description,
                'Система логирования Forever'
            );
            await logChannel.send({ embeds: [logEmbed] });
        }
    } catch (error) {
        console.error('Ошибка отправки лога:', error);
    }
}

// Событие готовности бота
client.once('ready', () => {
    console.log(`✅ Бот ${client.user.tag} запущен!`);
    client.user.setActivity('Forever Family', { type: 'WATCHING' });
    client.user.setStatus('dnd');
    
    sendLog(client, 'СИСТЕМА ЗАПУЩЕНА', '```\n⚡ Бот успешно запущен и готов к работе\n```');
});

// Автовыдача роли при входе
client.on('guildMemberAdd', async (member) => {
    try {
        // Выдача роли
        const role = member.guild.roles.cache.get(CONFIG.AUTO_ROLE_ID);
        if (role) {
            await member.roles.add(role);
        }
        
        // Приветствие
        const welcomeChannel = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
        if (welcomeChannel) {
            const welcomeEmbed = createStrictEmbed(
                '🎭 НОВЫЙ УЧАСТНИК',
                `\`\`\`\n┌─────────────────────────┐\n│  ДОБРО ПОЖАЛОВАТЬ       │\n└─────────────────────────┘\n\`\`\`\n` +
                `**Участник:** ${member.user.tag}\n` +
                `**ID:** \`${member.user.id}\`\n` +
                `**Дата входа:** <t:${Math.floor(Date.now() / 1000)}:F>\n\n` +
                `\`\`\`\nДобро пожаловать в семью Forever!\n\`\`\``,
                'Forever Family'
            );
            await welcomeChannel.send({ embeds: [welcomeEmbed] });
        }
        
        // Лог
        await sendLog(
            client,
            'НОВЫЙ УЧАСТНИК',
            `\`\`\`\n` +
            `Пользователь: ${member.user.tag}\n` +
            `ID: ${member.user.id}\n` +
            `Роль выдана: ${role ? 'Да' : 'Нет'}\n` +
            `\`\`\``
        );
    } catch (error) {
        console.error('Ошибка при добавлении участника:', error);
    }
});

// Обработка взаимодействий
client.on('interactionCreate', async (interaction) => {
    if (interaction.isChatInputCommand()) {
        const { commandName } = interaction;
        
        // Команда /text
        if (commandName === 'text') {
            if (!hasPermission(interaction.member)) {
                return interaction.reply({ 
                    content: '```\n❌ ДОСТУП ЗАПРЕЩЕН\nТребуется роль: Основатель\n```', 
                    ephemeral: true 
                });
            }
            
            const text = interaction.options.getString('текст');
            const channel = interaction.options.getChannel('канал') || interaction.channel;
            
            const embed = createStrictEmbed(
                '📢 СООБЩЕНИЕ ОТ АДМИНИСТРАЦИИ',
                `\`\`\`\n${text}\n\`\`\``,
                'Forever Family'
            );
            
            await channel.send({ embeds: [embed] });
            await interaction.reply({ content: '```\n✅ Сообщение отправлено\n```', ephemeral: true });
            
            await sendLog(
                client,
                'КОМАНДА /TEXT',
                `\`\`\`\n` +
                `Отправитель: ${interaction.user.tag}\n` +
                `Канал: #${channel.name}\n` +
                `Текст: ${text}\n` +
                `\`\`\``
            );
        }
        
        // Команда /info
        if (commandName === 'info') {
            const infoEmbed = createStrictEmbed(
                '⚙️ ИНФОРМАЦИЯ О БОТЕ',
                `\`\`\`\n` +
                `┌──────────────────────────┐\n` +
                `│  FOREVER FAMILY BOT      │\n` +
                `└──────────────────────────┘\n` +
                `\`\`\`\n\n` +
                `**Версия:** \`1.0.0\`\n` +
                `**Разработчик:** Forever Team\n` +
                `**Серверов:** \`${client.guilds.cache.size}\`\n` +
                `**Пользователей:** \`${client.users.cache.size}\`\n` +
                `**Пинг:** \`${client.ws.ping}ms\`\n\n` +
                `\`\`\`\nФУНКЦИОНАЛ:\n\`\`\`\n` +
                `▫️ Автовыдача ролей\n` +
                `▫️ Приветствие участников\n` +
                `▫️ Система заявок\n` +
                `▫️ Логирование событий\n` +
                `▫️ Управление текстом\n\n` +
                `\`\`\`\nКОМАНДЫ:\n\`\`\`\n` +
                `\`/text\` - Отправка текста от бота\n` +
                `\`/info\` - Информация о боте\n` +
                `\`/application\` - Создать заявку в семью`,
                'Forever Family Bot'
            );
            
            await interaction.reply({ embeds: [infoEmbed] });
        }
        
        // Команда /application
        if (commandName === 'application') {
            const modal = new ModalBuilder()
                .setCustomId('applicationModal')
                .setTitle('━━━ ЗАЯВКА В FOREVER ━━━');
            
            const nameInput = new TextInputBuilder()
                .setCustomId('name')
                .setLabel('Имя Фамилия')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Введите ваше имя и фамилию')
                .setRequired(true);
            
            const experienceInput = new TextInputBuilder()
                .setCustomId('experience')
                .setLabel('Сколько лет играете?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Например: 2 года')
                .setRequired(true);
            
            const positionsInput = new TextInputBuilder()
                .setCustomId('positions')
                .setLabel('Ваши должности')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Перечислите ваши должности')
                .setRequired(true);
            
            const ageInput = new TextInputBuilder()
                .setCustomId('age')
                .setLabel('Сколько вам лет?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Введите ваш возраст')
                .setRequired(true);
            
            const callInput = new TextInputBuilder()
                .setCustomId('call')
                .setLabel('Готовы пройти обзвон для вступления?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Да/Нет')
                .setRequired(true);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(experienceInput),
                new ActionRowBuilder().addComponents(positionsInput),
                new ActionRowBuilder().addComponents(ageInput),
                new ActionRowBuilder().addComponents(callInput)
            );
            
            await interaction.showModal(modal);
        }
        
        // Команда /setup_application_button
        if (commandName === 'setup_application_button') {
            if (!hasPermission(interaction.member)) {
                return interaction.reply({ 
                    content: '```\n❌ ДОСТУП ЗАПРЕЩЕН\nТребуется роль: Основатель\n```', 
                    ephemeral: true 
                });
            }
            
            const applicationEmbed = createStrictEmbed(
                '📋 ПОДАЧА ЗАЯВКИ В СЕМЬЮ',
                `\`\`\`\n` +
                `┌─────────────────────────┐\n` +
                `│  Forever Federation     │\n` +
                `└─────────────────────────┘\n` +
                `\`\`\`\n\n` +
                `**Добро пожаловать в систему подачи заявок!**\n\n` +
                `Нажмите кнопку ниже, чтобы подать заявку на вступление в семью Forever.\n\n` +
                `\`\`\`\nВАЖНО:\n\`\`\`\n` +
                `▫️ Заполняйте все поля честно\n` +
                `▫️ Указывайте реальную информацию\n` +
                `▫️ Будьте готовы к обзвону\n` +
                `▫️ Рассмотрение может занять время\n\n` +
                `\`\`\`\nУдачи!\n\`\`\``,
                'Forever Family'
            );
            
            const applicationButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('open_application')
                        .setLabel('📝 ПОДАТЬ ЗАЯВКУ')
                        .setStyle(ButtonStyle.Secondary)
                );
            
            await interaction.channel.send({ 
                embeds: [applicationEmbed], 
                components: [applicationButton] 
            });
            
            await interaction.reply({ 
                content: '```\n✅ Кнопка подачи заявки создана!\n```', 
                ephemeral: true 
            });
            
            await sendLog(
                client,
                'КНОПКА ЗАЯВКИ СОЗДАНА',
                `\`\`\`\n` +
                `Создал: ${interaction.user.tag}\n` +
                `Канал: #${interaction.channel.name}\n` +
                `\`\`\``
            );
        }
    }
    
    // Обработка модального окна
    if (interaction.isModalSubmit()) {
        if (interaction.customId === 'applicationModal') {
            const name = interaction.fields.getTextInputValue('name');
            const experience = interaction.fields.getTextInputValue('experience');
            const positions = interaction.fields.getTextInputValue('positions');
            const age = interaction.fields.getTextInputValue('age');
            const call = interaction.fields.getTextInputValue('call');
            
            const applicationEmbed = createStrictEmbed(
                '📋 НОВАЯ ЗАЯВКА В СЕМЬЮ',
                `\`\`\`\n` +
                `┌─────────────────────────┐\n` +
                `│  АНКЕТА КАНДИДАТА       │\n` +
                `└─────────────────────────┘\n` +
                `\`\`\`\n\n` +
                `**┃ Имя Фамилия:**\n\`${name}\`\n\n` +
                `**┃ Опыт игры:**\n\`${experience}\`\n\n` +
                `**┃ Должности:**\n\`${positions}\`\n\n` +
                `**┃ Возраст:**\n\`${age}\`\n\n` +
                `**┃ Готовность к обзвону:**\n\`${call}\`\n\n` +
                `\`\`\`\n───────────────────────\n\`\`\`\n` +
                `**Подал:** ${interaction.user.tag}\n` +
                `**ID:** \`${interaction.user.id}\`\n` +
                `**Дата:** <t:${Math.floor(Date.now() / 1000)}:F>`,
                'Forever Family'
            );
            
            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`review_${interaction.user.id}`)
                        .setLabel('Рассмотреть')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('👁️'),
                    new ButtonBuilder()
                        .setCustomId(`accept_${interaction.user.id}`)
                        .setLabel('Принять')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('✅'),
                    new ButtonBuilder()
                        .setCustomId(`reject_${interaction.user.id}`)
                        .setLabel('Отклонить')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('❌')
                );
            
            const reviewChannel = interaction.guild.channels.cache.get(CONFIG.REVIEW_CHANNEL_ID);
            if (reviewChannel) {
                await reviewChannel.send({ embeds: [applicationEmbed], components: [buttons] });
            }
            
            await interaction.reply({ 
                content: '```\n✅ ЗАЯВКА ОТПРАВЛЕНА\nВаша заявка находится на рассмотрении\n```', 
                ephemeral: true 
            });
            
            await sendLog(
                client,
                'НОВАЯ ЗАЯВКА',
                `\`\`\`\n` +
                `Кандидат: ${interaction.user.tag}\n` +
                `Имя: ${name}\n` +
                `Возраст: ${age}\n` +
                `\`\`\``
            );
        }
    }
    
    // Обработка кнопок
    if (interaction.isButton()) {
        const [action, userId] = interaction.customId.split('_');
        
        // Обработка кнопки "Подать заявку"
        if (interaction.customId === 'open_application') {
            const modal = new ModalBuilder()
                .setCustomId('applicationModal')
                .setTitle('━━━ ЗАЯВКА В FOREVER ━━━');
            
            const nameInput = new TextInputBuilder()
                .setCustomId('name')
                .setLabel('Имя Фамилия')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Введите ваше имя и фамилию')
                .setRequired(true);
            
            const experienceInput = new TextInputBuilder()
                .setCustomId('experience')
                .setLabel('Сколько лет играете?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Например: 2 года')
                .setRequired(true);
            
            const positionsInput = new TextInputBuilder()
                .setCustomId('positions')
                .setLabel('Ваши должности')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Перечислите ваши должности')
                .setRequired(true);
            
            const ageInput = new TextInputBuilder()
                .setCustomId('age')
                .setLabel('Сколько вам лет?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Введите ваш возраст')
                .setRequired(true);
            
            const callInput = new TextInputBuilder()
                .setCustomId('call')
                .setLabel('Готовы пройти обзвон для вступления?')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('Да/Нет')
                .setRequired(true);
            
            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(experienceInput),
                new ActionRowBuilder().addComponents(positionsInput),
                new ActionRowBuilder().addComponents(ageInput),
                new ActionRowBuilder().addComponents(callInput)
            );
            
            return await interaction.showModal(modal);
        }
        
        if (!hasReviewPermission(interaction.member)) {
            return interaction.reply({ 
                content: '```\n❌ ДОСТУП ЗАПРЕЩЕН\nНедостаточно прав\n```', 
                ephemeral: true 
            });
        }
        
        if (action === 'review') {
            const reviewEmbed = createStrictEmbed(
                '👁️ ЗАЯВКА В ПРОЦЕССЕ РАССМОТРЕНИЯ',
                `\`\`\`\n` +
                `Рассматривает: ${interaction.user.tag}\n` +
                `Время: ${new Date().toLocaleString('ru-RU')}\n` +
                `\`\`\``,
                'Forever Family'
            );
            
            await interaction.update({ embeds: [interaction.message.embeds[0], reviewEmbed], components: [] });
            
            await sendLog(
                client,
                'ЗАЯВКА НА РАССМОТРЕНИИ',
                `\`\`\`\n` +
                `Рассматривает: ${interaction.user.tag}\n` +
                `ID кандидата: ${userId}\n` +
                `\`\`\``
            );
        }
        
        if (action === 'accept') {
            const acceptEmbed = createStrictEmbed(
                '✅ ЗАЯВКА ПРИНЯТА',
                `\`\`\`\n` +
                `Принял: ${interaction.user.tag}\n` +
                `Время: ${new Date().toLocaleString('ru-RU')}\n` +
                `\`\`\`\n\n` +
                `**Кандидат успешно принят в семью Forever!**`,
                'Forever Family'
            );
            
            await interaction.update({ embeds: [interaction.message.embeds[0], acceptEmbed], components: [] });
            
            const user = await client.users.fetch(userId);
            if (user) {
                const dmEmbed = createStrictEmbed(
                    '✅ ПОЗДРАВЛЯЕМ!',
                    `\`\`\`\n` +
                    `┌─────────────────────────┐\n` +
                    `│  ЗАЯВКА ПРИНЯТА         │\n` +
                    `└─────────────────────────┘\n` +
                    `\`\`\`\n\n` +
                    `Ваша заявка в семью Forever была **ПРИНЯТА**!\n\n` +
                    `Добро пожаловать в нашу семью!`,
                    'Forever Family'
                );
                
                try {
                    await user.send({ embeds: [dmEmbed] });
                } catch (error) {
                    console.error('Не удалось отправить ЛС:', error);
                }
            }
            
            await sendLog(
                client,
                'ЗАЯВКА ПРИНЯТА',
                `\`\`\`\n` +
                `Принял: ${interaction.user.tag}\n` +
                `ID кандидата: ${userId}\n` +
                `\`\`\``
            );
        }
        
        if (action === 'reject') {
            const modal = new ModalBuilder()
                .setCustomId(`rejectReason_${userId}`)
                .setTitle('━━━ ПРИЧИНА ОТКАЗА ━━━');
            
            const reasonInput = new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Укажите причину отказа')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('Введите причину отклонения заявки')
                .setRequired(true);
            
            modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
            
            await interaction.showModal(modal);
        }
    }
    
    // Обработка причины отказа
    if (interaction.isModalSubmit() && interaction.customId.startsWith('rejectReason_')) {
        const userId = interaction.customId.split('_')[1];
        const reason = interaction.fields.getTextInputValue('reason');
        
        const rejectEmbed = createStrictEmbed(
            '❌ ЗАЯВКА ОТКЛОНЕНА',
            `\`\`\`\n` +
            `Отклонил: ${interaction.user.tag}\n` +
            `Время: ${new Date().toLocaleString('ru-RU')}\n` +
            `\`\`\`\n\n` +
            `**Причина отказа:**\n\`\`\`\n${reason}\n\`\`\``,
            'Forever Family'
        );
        
        await interaction.update({ embeds: [interaction.message.embeds[0], rejectEmbed], components: [] });
        
        const user = await client.users.fetch(userId);
        if (user) {
            const dmEmbed = createStrictEmbed(
                '❌ ОТКАЗ В ПРИНЯТИИ',
                `\`\`\`\n` +
                `┌─────────────────────────┐\n` +
                `│  ЗАЯВКА ОТКЛОНЕНА       │\n` +
                `└─────────────────────────┘\n` +
                `\`\`\`\n\n` +
                `Ваша заявка в семью Forever была **ОТКЛОНЕНА**.\n\n` +
                `**Причина:**\n\`\`\`\n${reason}\n\`\`\``,
                'Forever Family'
            );
            
            try {
                await user.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.error('Не удалось отправить ЛС:', error);
            }
        }
        
        await sendLog(
            client,
            'ЗАЯВКА ОТКЛОНЕНА',
            `\`\`\`\n` +
            `Отклонил: ${interaction.user.tag}\n` +
            `ID кандидата: ${userId}\n` +
            `Причина: ${reason}\n` +
            `\`\`\``
        );
    }
});

// Регистрация команд
client.on('ready', async () => {
    const commands = [
        {
            name: 'text',
            description: '📢 Отправить текст от имени бота (только для основателей)',
            options: [
                {
                    name: 'текст',
                    type: 3,
                    description: 'Текст сообщения',
                    required: true
                },
                {
                    name: 'канал',
                    type: 7,
                    description: 'Канал для отправки (по умолчанию текущий)',
                    required: false
                }
            ]
        },
        {
            name: 'info',
            description: '⚙️ Информация о боте'
        },
        {
            name: 'application',
            description: '📋 Подать заявку в семью Forever'
        },
        {
            name: 'setup_application_button',
            description: '🔧 Создать фиксированную кнопку для подачи заявок (только для основателей)'
        }
    ];
    
    await client.application.commands.set(commands);
    console.log('✅ Команды зарегистрированы!');
});

// Логирование событий
client.on('messageDelete', async (message) => {
    if (message.author.bot) return;
    
    await sendLog(
        client,
        'СООБЩЕНИЕ УДАЛЕНО',
        `\`\`\`\n` +
        `Автор: ${message.author.tag}\n` +
        `Канал: #${message.channel.name}\n` +
        `Содержание: ${message.content || '[Нет текста]'}\n` +
        `\`\`\``
    );
});

client.on('guildMemberRemove', async (member) => {
    await sendLog(
        client,
        'УЧАСТНИК ПОКИНУЛ СЕРВЕР',
        `\`\`\`\n` +
        `Пользователь: ${member.user.tag}\n` +
        `ID: ${member.user.id}\n` +
        `\`\`\``
    );
});

// Запуск бота
client.login(process.env.DISCORD_TOKEN);