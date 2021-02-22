const { Client, Intents } = require('discord.js')

const client = new Client({
  ws: {
    intents: Intents.NON_PRIVILEGED
  }
})

client.once('ready', () => console.log('Ready!'))

const DECIBELS_PATTERN = /db=(?<decibels>[0-9]+)/u

const parseDecibels = content => {
  const decibels = Number.parseInt(DECIBELS_PATTERN.exec(content)?.groups?.decibels)

  return Number.isNaN(decibels)
    ? 5000
    : decibels
}

client.on('message', async message => {
  const messageAttachment = message.attachments.first()
  const member = message.member

  if (!member) return
  if (message.system || message.author.bot) return
  if (!message.content.startsWith('volume-upper')) return
  if (!member.voice.channel) return message.reply('ボイスチャンネルに参加してください')
  if (!messageAttachment) return message.reply('mp3形式のファイルを添付して「volume-upper」を送信してください')
  if (!messageAttachment.name.endsWith('.mp3')) return message.reply('mp3形式のファイルを添付して「volume-upper」を送信してください')

  const decibels = parseDecibels(message.content)
  const voiceChannel = member.voice.channel
  const connection = await voiceChannel.join()
  const dispatcher = connection.play(messageAttachment.attachment)

  dispatcher.setVolumeDecibels(decibels)

  dispatcher
    .on('start', () => {
      message.channel.send(`**${messageAttachment.name}**の再生を開始しました。（音量: ${decibels}db）`)
        .catch(console.error)
    })
    .on('finish', () => {
      voiceChannel.leave()
      message.channel.send('再生を終了しました。')
        .catch(console.error)
    })
})

client.login()
  .catch(console.error)
