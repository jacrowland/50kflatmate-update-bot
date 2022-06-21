# 50kFlatmate Updates Bot

## Twitter bot built using javascript, puppeteer and the Twitter V2 API

### Background

In June 2020 the New Zealand radio station The Edge ran a competition where ten twenty-somethings were placed into a flat. Their experience over the following 2 weeks was then live-streamed 24/7 on theedge.co.nz. Throughout the two weeks flatmates competed in challenges to earn money in between periods of elimination. 

### Twitter Account
You can find the version which ran throughout the duration of the competition at [@50kflatmate](https://twitter.com/50kflatmate)

### How the bot works

The bot users the js library puppeteer to open a headless instance of Google Chrome. It then navigates to the stream page, scrapes the relevant headers. It then clicks through each of the six camera elements and takes a snapshot of the video player.

Once the scraping is complete, the bot picks four of these images at random to upload (as tweets may only have up to four images) and posts a tweet with the time, the current stream title, and the media ids. 

The whole process is automated via a Cronjob that runs the scrape and tweet functions on an hourly basis.

### Setup
Clone the repository and install all the node dependencies.

Create a `.env` file in the root directory of the project with the following variables:
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_TOKEN_SECRET`
- `TWITTER_CLIENT_ID`
- `TWITTER_CLIENT_SECRET`
- `CHROME_PATH` 

#### Important notes:
- The Google Chrome executable file path is important as the bundled chromium included with puppeteer cannot capture the video stream.
- The Twitter keys can be acquired from the Twitter Developer Portal. The bot requires elevated privileges.

### Thank you
Thank you to The Edge for putting on such a fun event. It was a lot of fun to watch and participate in.

### Credits
Jacob Rowland, 2022