const puppeteer = require("puppeteer");
const fs = require('fs')

const ligas = {
    Brasil: "https://www.betfair.com/exchange/plus/pt/futebol/brasil-s%C3%A9rie-a-apostas-13",
    Inglaterra: "https://www.betfair.com/exchange/plus/pt/futebol/inglaterra-premier-league-apostas-10932509",
    Alemanha: "https://www.betfair.com/exchange/plus/pt/futebol/bundesliga-alem%C3%A3-apostas-59",
    Espanha: "https://www.betfair.com/exchange/plus/pt/futebol/espanha-la-liga-apostas-117",
    Itália: "https://www.betfair.com/exchange/plus/pt/futebol/it%C3%A1lia-s%C3%A9rie-a-apostas-81",
    França: "https://www.betfair.com/exchange/plus/pt/futebol/fran%C3%A7a-ligue-1-apostas-55"
}

const dayLegend = {
    0: "dom",
    1: "seg",
    2: "ter",
    3: "qua",
    4: "qui",
    5: "sex",
    6: "sáb",
    7: "TODAY"
}

async function scrape(pais) {

    console.log("Scraping " + pais + "...")

    const browser = await puppeteer.launch({ headless: true, args: ['--lang=pt-BR,pt'] })
    const page = await browser.newPage()
    await page.setDefaultNavigationTimeout(0)

    await page.goto(ligas[pais], {
        waitUntil: "networkidle0",
    }).catch(err => {
        if (err) throw err
    })

    const betTextArray = await page.evaluate(() => {
        const elementArray = Array.from(document.querySelectorAll("tbody tr"))
        elementArray.pop()
        elementArray.shift()
        const textArray = elementArray.map(e => e.innerText)
        return textArray
    }
    )

    await browser.close()

    const now = new Date(Date.now())
    let allowedWeekDay = now.getDay() == 6 ? 0 : now.getDay() + 1
    if (now.getHours() <= 8) {
        allowedWeekDay = 7
    }

    const bets = []

    betTextArray.forEach(t => {
        const bet = {}
        const lines = t.split('\n')
        bet.horario = lines[0]
        if (!bet.horario.includes(dayLegend[allowedWeekDay])) {
            return
        }
        bet.times = [lines[1], lines[2]]
        bet.time1 = [lines[4], lines[6]]
        bet.time2 = [lines[12], lines[14]]
        bet.pais = pais
        bets.push(bet)
    })

    console.log(pais + " pronto. " + now.toLocaleString("pt-BR", { timezone: "BRT" }))

    return bets
}

async function start() {
    let bets = []
    for (const pais in ligas) {
        const newBets = await scrape(pais)
        bets = bets.concat(newBets)
    }

    fs.writeFileSync('./bets.json', JSON.stringify(bets, null, 4))
}

start()