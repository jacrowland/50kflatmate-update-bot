const puppeteer = require('puppeteer');
require("dotenv").config();
const rwClient = require("./twitterClient.js");
const fs = require('fs');
var CronJob = require('cron').CronJob;

async function captureImages() {
    let paths = [];
    const cameras = ["#tnLounge", "#tnDining", "#tnBedroom", "#tnGames", "#tnMusic", "#tnBedroom2"];
    const edgeUrl = 'https://www.theedge.co.nz/home/win/2022/05/win--register-for-the-edge--50k-flatmate-with-dosh.html';

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

    await page.goto(edgeUrl);

    for (let i = 0; i < cameras.length; i++) {
      let camera = cameras[i];
      console.log(`Capturing ${camera}`);
      try {
        await page.click(camera);
        if (i !== 0) {
          await page.click('#player > div.jw-wrapper.jw-reset > div.jw-media.jw-reset > video'); // focus video player
        }
        await page.click('#player > div.jw-wrapper.jw-reset > div.jw-media.jw-reset > video'); // unpause the video player
        await page.waitForTimeout(4000);

        let videoPlayer = await page.$('#player > div.jw-wrapper.jw-reset > div.jw-media.jw-reset > video'); 
        let path = `images/${camera}.png`;
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

const tweet = async(paths) => {
  console.log("Posting images to Twitter...");
  let selectedPaths = paths.sort(() => 0.5 - Math.random()).slice(0, 4);
  const mediaIds = await Promise.all(selectedPaths.map(path => rwClient.v1.uploadMedia(`./${path}`)));
  const date = getDateString();
  await rwClient.v1.tweet(`${date}`, { media_ids: mediaIds });

  console.log("Cleaning up images...");
  paths.forEach(path => {
    fs.unlinkSync(path);
  });

  console.log("Upload complete.\n");
};

function getDateString() {
  let minutes = parseInt(new Date().getMinutes());
  if (minutes < 10) {
    minutes = `0${new Date().getMinutes()}`;
  }
  return `${new Date().toDateString()} ${new Date().getHours()}:${minutes}`;
}
  
async function main() {
  console.log(getDateString());
  paths = await captureImages();
  await tweet(paths);
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