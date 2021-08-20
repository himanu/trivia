firebase use prod
export $(xargs < .env.prod)
firebase functions:config:set app.id=$DAPP_ID
firebase functions:config:set app.secret=$DAPP_SECRET
firebase functions:config:set app.url=$DAPP_URL
firebase deploy