export const slackWebhook = process.env.SLACK_WEBHOOK

export const eventMessage = {
  democracy: {
    Passed: 'A referendum was successful and will be executed in ~1 day',
    Executed: 'A referendum was executed!',
    Tabled: 'A referendum was tabled! Please vote now.',
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
    enteredTopCandidates: 'There is a new collator!',
    leftTopCandidates: 'A collator left or was pushed out of the set',
  },
}
