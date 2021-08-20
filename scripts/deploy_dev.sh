firebase use dev
export $(xargs < .env.development)
firebase functions:config:set app.id=$DAPP_ID
firebase functions:config:set app.secret=$DAPP_SECRET
firebase functions:config:set app.url=$DAPP_URL
firebase deploy