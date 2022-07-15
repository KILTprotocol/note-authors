import got from 'got'

import { slackWebhook, eventMessage, SUBSCAN } from './slackconfig.js'

function buildMessage(
  record,
  eventNum,
  msgConfig,
  chainName,
  runtimeVersion,
  blockNum,
  blockHash,
) {
  let subscanLink = ""
  if (record.phase.isApplyExtrinsic) {
    const extrinsicNum = record.phase.asApplyExtrinsic
    subscanLink = `<https://${SUBSCAN}/extrinsic/${blockNum}-${extrinsicNum}?event=${blockNum}-${eventNum}|subscan>`
  } else {
    subscanLink = `<https://${SUBSCAN}/block/${blockNum}|subscan>`
  }

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
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: subscanLink,
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
  console.log('🏤', JSON.stringify(msg))
  await got.post(slackWebhook, {
    json: msg,
  })
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
    } else if (typeof msgConfigWildcard !== 'undefined') {
      sendNotification(api, record, index, signedBlock, msgConfigWildcard)
    }
  })
}

const MAX_CONSECUTIVE_FAILURES_BEFORE_MESSAGE = 5
const CALL_INDEX = [64, 12]
let failedConsecutiveSkycExtrinsics = 0

export async function checkForSkycFailure(api, signedBlock) {
  const skycDidTxs = signedBlock.extrinsics.filter(
    ({ extrinsic }, index) => {
      extrinsic.index = index
      return extrinsic.isSigned && extrinsic.callIndex[0] === CALL_INDEX[0] && extrinsic.callIndex[1] === CALL_INDEX[1] && extrinsic.signer.toString() == process.env.SKYC_ADDRESS
    }
  )
  console.log(`# of SKYC DID txs for block: [${skycDidTxs.length}]`)

  const allRecords = await api.query.system.events()

  skycDidTxs.forEach(({ extrinsic: { callIndex, index } }) => {
    allRecords
      // filter the specific events based on the phase and then the
      // index of our extrinsic in the block
      .filter(({ phase }) =>
        phase.isApplyExtrinsic &&
        phase.asApplyExtrinsic.eq(index)
      )
      // Return only the extrinsics that have failed
      .forEach((record) => {
        if (api.events.system.ExtrinsicSuccess.is(record.event)) {
          // extract the data for this event
          // (In TS, because of the guard above, these will be typed)
          const [dispatchInfo] = record.event.data

          console.log(`${callIndex}:: ExtrinsicSuccess:: ${JSON.stringify(dispatchInfo.toHuman())}`)
          failedConsecutiveSkycExtrinsics = 0
        } else if (api.events.system.ExtrinsicFailed.is(record.event)) {
          console.log(`${callIndex}:: ExtrinsicFailed. Bumping counter from ${failedConsecutiveSkycExtrinsics}.`)
          failedConsecutiveSkycExtrinsics += 1
          if (failedConsecutiveSkycExtrinsics >= MAX_CONSECUTIVE_FAILURES_BEFORE_MESSAGE) {
            console.log(`Counter >= ${MAX_CONSECUTIVE_FAILURES_BEFORE_MESSAGE}. Sending out Slack notification...`)
            sendNotification(api, record, index, signedBlock, "SocialKYC is stuck! Please restart <!subteam^S024L79GNEL> or <!subteam^S02566A0UV6>")
            console.log(`Counter reset to 0.`)
            failedConsecutiveSkycExtrinsics = 0
          }
        }
      })
  })
}
