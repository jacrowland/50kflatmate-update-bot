const puppeteer = require('puppeteer');
require("dotenv").config();
const rwClient = require("./twitterClient.js");
const fs = require('fs');
var CronJob = require('cron').CronJob;

async function captureImages(date) {
    let paths = [];
    const browser = await puppeteer.launch({
        executablePath: process.env.CHROME_PATH,
        headless:false, 
        defaultViewport:null,
        devtools: true,
        args: ["--window-size=1920,1080", "--window-position=1921,0"]
      })
    const page = await browser.newPage();
    await page.waitForTimeout(10000);

    page.setViewport({width: 1920, height: 1080});
    console.log("Loading page...")
    await page.goto('https://www.theedge.co.nz/home/win/2022/05/win--register-for-the-edge--50k-flatmate-with-dosh.html');

    const cameras = ["#tnLounge", "#tnDining", "#tnBedroom", "#tnGames", "#tnMusic", "#tnBedroom2"];

    for (let i = 0; i < cameras.length; i++) {
      let camera = cameras[i];
      console.log(`Capturing ${camera}`);
      try {
        await page.click(camera);
        if (i !== 0) {
          await page.click('#player > div.jw-wrapper.jw-reset > div.jw-media.jw-reset > video'); // focus video player
        }
        await page.click('#player > div.jw-wrapper.jw-reset > div.jw-media.jw-reset > video'); // unpause the video player
        await page.waitForTimeout(5000);
        let videoPlayer = await page.$('#player > div.jw-wrapper.jw-reset > div.jw-media.jw-reset > video'); 
        let path = `images/${date}_${camera}.png`;
        await videoPlayer.screenshot({path: path});
        paths.push(path);
      }
      catch {
        console.log(`Failed to capture ${camera}`);
      }
    }
    await browser.close();
    return paths;
  };

const tweet = async() => {
  try {
    await rwClient.v2.tweet("Hello World!");
  } catch(err) {
    console.log(err);
  }
};

const tweetWithMedia = async(array) => {
  console.log("Posting images to Twitter...");
  let paths = array.sort(() => 0.5 - Math.random()).slice(0, 4);
  const mediaIds = await Promise.all(paths.map(path => rwClient.v1.uploadMedia(`./${path}`)));
  const dateTime = `${new Date().toDateString()} ${new Date().getHours()}:${new Date().getMinutes()}`;
  await rwClient.v1.tweet(`${dateTime}`, { media_ids: mediaIds });

  array.forEach(path => {
    fs.unlinkSync(path);
  });
};
  
async function main() {
  const date = `${new Date().toDateString()}${new Date().getHours()}${new Date().getMinutes()}`;
  console.log(date);
  paths = await captureImages(date);
  await tweetWithMedia(paths);
}

const job = new CronJob("0 * * * *", () => {
  try {
    main();
  } catch(err) {
    console.log(err);
  }

});

job.start();

//main();