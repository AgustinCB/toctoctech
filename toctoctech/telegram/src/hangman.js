'use strict'

import * as utils from './utils'
import fs from 'fs'

let words = new Map()

const MAX_TRIES = 6

const Status = utils.Enum({
  'PLAYING': 0,
  'WON': 1,
  'LOST': 2
})

const GuessSuccess = utils.Enum({
    'WRONG': 0,
    'SUCCESS': 1,
    'REPEATED': 2
})

const MESSAGE_TEXT =
{
    0: 'Bad luck, try again!',
    1: 'Good guess!',
    2: "Don't be stupid and choose another letter"
}

const hangman =
`____
  |       |    
  |       0    
  |      /|\\  
  |      / \\  
  |            
  |            `.split('\n').map((line) => line.split(''))
const hangmanindexes = [
  [ 2, 10 ],
  [ 3, 9 ],
  [ 3, 11 ],
  [ 3, 10 ],
  [ 4, 9 ],
  [ 4, 11 ]
].reverse()

export function init (onsuccess, onerror) {
  fs.readFile('../words.txt', (err, data) => {
    if (err) {
      onerror(err)
      return
    }

    data.toString().split('\n').forEach((word) => {
      word = word.toLowerCase().trim()

      if (!words.has(word.length)) {
        words.set(word.length, [])
      }

      words.get(word.length).push(word)
    })

    onsuccess()
  })
}

export class Hangman {
  constructor () {
    this.startlength = Math.min(words.keys())
    this.start(0)
  }

  start (level) {
    let wordlength = level + this.startlength

    if (!words.has(wordlength)) {
      this.status = Status['WON']
      return
    }

    this.level = level
    this.status = Status['PLAYING']
    this.message = ''
    this.word = utils.sample(words.get(wordlength))
    this.guesses = []
    this.successes = Array(wordlength).fill('_')
  }

  guess (letterorword) {
    let isletter = letterorword.length === 1
    let success = GuessSuccess['WRONG']

    letterorword.split('').forEach((letter, index) => {
      if (isletter) {
        this.word.split('').forEach((wordletter, wordindex) => {
          if (wordletter === letter) {
            this.successes[wordindex] = letter
            success = GuessSuccess['SUCCESS']
          }
        })
      } else {
        if (this.word[index] && this.word[index] === letter) {
          this.successes[index] = letter
          success = GuessSuccess['SUCCESS']
        }
      }
    })

    if (this.existInArray(letterorword)) {
      success = GuessSuccess['REPEATED'];
    } else {
      this.guesses.push(letterorword)
    }

    this.updateStatus(success)
  }

  existInArray(letterorword) {
      return (this.guesses.indexOf(letterorword) > 0)
  }

  updateStatus (success) {
    if (this.wrongs >= MAX_TRIES) {
      this.status = Status['LOST']
      return
    }

    if (this.successes.join('') === this.word) {
      this.start(this.level + 1)
      this.message = 'Congrats!! You cleared the level!'
      return
    }

      this.message = MESSAGE_TEXT[success]
  }

  statusScreen () {
    let statusscreen
    switch (this.status) {
      case Status['PLAYING']:
        statusscreen = this.gameScreen()
        break
      case Status['WON']:
        statusscreen = 'Well done! You defeated the bot!'
        break
      case Status['LOST']:
        statusscreen = 'Ha-ha, looser! You lost! Ha-ha!'
        break
    }
    return statusscreen
  }

  gameScreen () {
    let drawLevel = () => {
      return `Level ${this.level + 1}`
    }
    let drawHangman = () => {
      let drawing = utils.clone(hangman)
      for (let i = 0; i < MAX_TRIES - this.wrongs; i++) {
        let index = hangmanindexes[i]
        drawing[index[0]][index[1]] = '  '
      }
      return drawing.map((line) => line.join('')).join('\n')
    }
    let drawWord = () => {
      return this.successes.join(' ')
    }

    return `${this.message}
    ${drawLevel()}
    ${drawHangman()}

    ${drawWord()}
    `
  }

  get wrongs () {
    return this.guesses.length - this.successes.filter((letter) => letter !== '_').length
  }
}
