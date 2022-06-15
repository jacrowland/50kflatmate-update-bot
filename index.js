const puppeteer = require("puppeteer");
require("dotenv").config();
const rwClient = require("./twitterClient.js");
const fs = require("fs");
const { title } = require("process");
const CronJob = require("cron").CronJob;

function getDateString() {
  let minutes = parseInt(new Date().getMinutes());
  if (minutes < 10) {
    minutes = `0${new Date().getMinutes()}`;
  }
  return `${new Date().toDateString()} ${new Date().getHours()}:${minutes}`;
}

async function captureEachCamera(page, cameras) {
  let imagePaths = [];
  for (let i = 0; i < cameras.length; i++) {
    let camera = cameras[i];
    console.log(`Capturing ${camera}`);
    try {
      await page.click(camera);
      await page.click('#player > div.jw-wrapper.jw-reset > div.jw-media.jw-reset > video'); // focus video player
      await page.click(
        "#player > div.jw-wrapper.jw-reset > div.jw-media.jw-reset > video"
      ); // unpause the video player
      await page.waitForTimeout(5000);
      let videoPlayer = await page.$(
        "#player > div.jw-wrapper.jw-reset > div.jw-media.jw-reset > video"
      );
      let path = `images/${camera}.png`;
      await videoPlayer.screenshot({ path: path });
      imagePaths.push(path);
    } catch {
      console.log(`Failed to capture ${camera}`);
    }
  }
  return imagePaths;
}

async function getPageHeader(page) {
  const header = await page.$("#headerTitle");
  console.log("Fetching current stream header...");
  let title = "Tune in to see the next challenge";
  try {
    properties = await header.getProperty("innerHTML");
    title = properties._remoteObject.value;
  } catch (err) {
    console.log(err);
  }
  return title;
}

function deleteImages(paths) {
  console.log("Deleting images...");
  paths.forEach((path) => {
    fs.unlinkSync(path);
  });
}

async function scrapePage(cameras) {
  const edgeUrl =
    "https://www.theedge.co.nz/home/win/2022/05/win--register-for-the-edge--50k-flatmate-with-dosh.html";
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH,
    headless: true,
    defaultViewport: null,
    devtools: false,
    args: ["--window-size=1920,1080", "--window-position=1921,0"],
  });
  const page = await browser.newPage();
  await page.goto(edgeUrl);
  await page.waitForTimeout(30000);
  page.setViewport({ width: 1920, height: 1080 });
  console.log("Loading page...");
  await page.waitForTimeout(10000);
  let title = await getPageHeader(page);
  console.log(title);
  let paths = await captureEachCamera(page, cameras);
  await browser.close();
  return { paths: paths, title: title };
}

const tweet = async (paths, title) => {
  const date = getDateString();
  const body = `${date}\n\n${title}\n\nWatch live @ http://theedge.co.nz`;
  console.log("Posting images to Twitter...");
  let selectedPaths = paths.sort(() => 0.5 - Math.random()).slice(0, 4); // shuffle paths and select 4 of the 6 images
  const mediaIds = await Promise.all(
    selectedPaths.map((path) => rwClient.v1.uploadMedia(`./${path}`))
  ); // upload each image
  await rwClient.v1.tweet(body, { media_ids: mediaIds }); // tweet and attach uploaded media
  console.log("Upload complete.\n");
};

async function main() {
  console.log(getDateString());
  const cameras = [
    "#tnLounge",
    "#tnDining",
    "#tnBedroom",
    "#tnGames",
    "#tnMusic",
    "#tnBedroom2",
  ];
  let { paths, title } = await scrapePage(cameras);
  await tweet(paths, title);
  deleteImages(paths);
}

const cronString = "59 * * * *";

// Half hourly updates
const job = new CronJob(cronString, () => {
  try {
    main();
  } catch (err) {
    console.log(err);
    job.start(); // attempt restart if the job crashes
  }
});

job.start();
console.log("50kFlatemate - Day Cron Job Started...");
console.log(cronString);

//main();