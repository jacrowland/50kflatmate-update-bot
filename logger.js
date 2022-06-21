const log = (message) => {
    const time = new Date().toTimeString();
    console.log(`${time}: ${message}`);
};

log('meme');

module.exports = log;


