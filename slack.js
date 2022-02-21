import got from 'got'

import { slackWebhook, eventMessage } from './slackconfig.js'

function buildMessage(
  record,
  eventNum,
  msgConfig,
  chainName,
  runtimeVersion,
  blockNum,
  blockHash,
) {
  const extrinsicNum = record.phase.asApplyExtrinsic
  const docStr = '> ' + record.event.meta.docs.join('\n> ')
  const message = `${docStr}
${JSON.stringify(record.event.data, null, 2)}
`

  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚨 ${record.event.section}.${record.event.method} 🚨`,
          emoji: true,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'plain_text',
            text: `Blockchain: '${chainName}' Runtime: '${runtimeVersion}'`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: msgConfig,
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Subscan',
            emoji: true,
          },
          value: 'subscan',
          url: `https://spiritnet.subscan.io/extrinsic/${blockNum}-${extrinsicNum}?event=${blockNum}-${eventNum}`,
          action_id: 'subscan-action',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
    ],
  }
}

async function sendNotification(api, record, index, signedBlock, config) {
  const msg = buildMessage(
    record,
    index,
    config,
    api.runtimeChain.toString(),
    api.runtimeVersion.specVersion.toString(),
    signedBlock.block.header.number,
    signedBlock.block.hash,
  )

  console.log('🏤', record.event.section, record.event.method)
  console.log(JSON.stringify(msg))
  // await got.post(slackWebhook, {
  //   json: msg,
  // })
}

export async function notifySlack(api, chainState, header, signedBlock) {
  const allRecords = await api.query.system.events.at(
    signedBlock.block.header.hash,
  )
  allRecords.forEach((record, index) => {
    const msgConfigWildcard = eventMessage[record.event.section]?.['*']
    const msgConfigSpecific =
      eventMessage[record.event.section]?.[record.event.method]

    if (typeof msgConfigSpecific !== 'undefined') {
      sendNotification(api, record, index, signedBlock, msgConfigSpecific)
    }
    if (typeof msgConfigWildcard !== 'undefined') {
      sendNotification(api, record, index, signedBlock, msgConfigWildcard)
    }
  })
}
