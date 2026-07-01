/* ==========================================================
   READZ
   Statistics
   ========================================================== */

import * as Database from "./database.js";

export async function addReadingTime(seconds) {

    const total = await Database.getStatistic("totalReadingTimeSeconds", 0);

    await Database.setStatistic("totalReadingTimeSeconds", total + seconds);

}

export async function registerBookFinished() {

    const finished = await Database.getStatistic("booksFinished", 0);

    await Database.setStatistic("booksFinished", finished + 1);

}

export async function getSummary() {

    const totalReadingTimeSeconds = await Database.getStatistic("totalReadingTimeSeconds", 0);
    const booksFinished = await Database.getStatistic("booksFinished", 0);

    return { totalReadingTimeSeconds, booksFinished };

}
