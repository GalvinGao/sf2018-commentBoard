cd ..
git pull
cd server
npm install
cp -f get-history-posts.php /home/wwwroot/sf2018-api/index.php
node server.js | ./node_modules/.bin/bunyan -o short -l trace