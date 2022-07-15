export const slackWebhook = process.env.SLACK_WEBHOOK

export const SUBSCAN = 'kilt-testnet.subscan.io'

export const eventMessage = {
  democracy: {
    Passed: 'A referendum was successful and will be executed in ~1 day',
    Executed: 'A referendum was executed!',
    Started: 'A referendum was started! Please vote now.',
    Proposed:
      'There is a new proposal! Is it good? -> Second it! Is it bad? -> Tech Committee can cancel it.',
  },
  parachainSystem: {
    UpgradeAuthorized:
      'The upgrade was authorized and is ready to be scheduled! The upgrade can happen earliest in 1h.',
    ValidationFunctionStored:
      'The upgrade was scheduled and will happen in ~1h',
    ValidationFunctionApplied:
      'The runtime upgrade went through! Check that everything still works!',
  },
  kiltLaunch: {
    '*': 'The KILT Launch pallet did something!',
  },
  parachainStaking: {
    EnteredTopCandidates: 'There is a new collator!',
    LeftTopCandidates: 'A collator left or was pushed out of the set',
  },
  treasury: {
    Proposed: 'There is a new treasury proposal!',
  },
  council: {
    '*': 'Review the council action',
    Closed: 'Something passed',
    Voted: 'voted...',
  },
}
