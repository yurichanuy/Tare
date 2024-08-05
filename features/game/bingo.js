//© Create by L E X I C -  T E A M

/*  [ Info singkat ]
 true = iya
 false = tidak
 %cmd = prefix+command
*/

const Jimp = require("jimp");

class GameSession {
  constructor(id) {
    this.id = id;
    this.players = [];
    this.game = new BingoGame();
  }
}
class BingoGame {
  constructor() {
    this.players = [];
    this.currentTurn = 0;
    this.boardSize = 5;
    this.cards = {};
    this.numbersCalled = new Set();
    this.checkedNumbers = {};
    this.started = false;
  }
  initializeGame = async () => {
    this.players.forEach((player) => {
      this.cards[player] = this.generateBingoCard();
      this.checkedNumbers[player] = new Set();
    });
    this.currentTurn = Math.floor(Math.random() * this.players.length);
    this.started = true;
  };
  generateBingoCard = () => {
    let card = Array.from(
      {
        length: 25,
      },
      (_, i) => i + 1,
    );
    for (let i = card.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [card[i], card[j]] = [card[j], card[i]];
    }
    return card;
  };
  checkNumber = (number, player) => {
    if (!this.started) return "Permainan Bingo belum dimulai.";
    if (this.cards[player].includes(number)) {
      this.checkedNumbers[player].add(number);
      return `✅ Nomor *${number}* telah ditandai pada kartu @${player.split("@")[0]}. Sekarang, kamu bisa mengirim nomor tersebut dengan "bingo send ${number}".`;
    } else {
      return `❌ Nomor *${number}* tidak ada pada kartu @${player.split("@")[0]}.`;
    }
  };
  sendNumber = (number, player) => {
    if (!this.started) return "Permainan Bingo belum dimulai.";
    if (player !== this.players[this.currentTurn])
      return `❌ *Belum giliranmu*, @${player.split("@")[0]}.`;
    if (!this.checkedNumbers[player].has(number))
      return `❌ Kamu harus menandai nomor *${number}* terlebih dahulu dengan "bingo check ${number}" sebelum mengirimkannya.`;
    this.numbersCalled.add(number);
    this.players.forEach((p) => {
      if (this.cards[p].includes(number)) {
        const index = this.cards[p].indexOf(number);
        this.cards[p][index] = 0;
      }
    });
    if (this.checkBingo(this.cards[player])) {
      this.endGame();
      return `🎉 *@${player.split("@")[0]}* memenangkan permainan Bingo!`;
    }
    if (this.numbersCalled.size === 25) {
      this.endGame();
      return `🤝 Permainan berakhir seri (draw)!`;
    }
    this.currentTurn = (this.currentTurn + 1) % this.players.length;
    return `🔄 Giliran *@${this.players[this.currentTurn].split("@")[0]}*`;
  };
  endGame = () => {
    this.started = false;
    this.players = [];
    this.cards = {};
    this.numbersCalled.clear();
    this.checkedNumbers = {};
  };
  getCardBuffer = async (player) => {
    try {
      const card = this.cards[player];
      const bg = await Jimp.read("lib/database/bingo.png");
      const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
      const colors = [255, 4278190335];
      for (let i = 0; i < 25; i++) {
        const x = (i % 5) * 100 + 50;
        const y = Math.floor(i / 5) * 100 + 95;
        const text = card[i] === 0 ? "X" : card[i].toString();
        const color = card[i] === 0 ? colors[1] : colors[0];
        bg.print(font, x, y, text).color([
          {
            apply: "xor",
            params: [color],
          },
        ]);
      }
      return {
        buffer: await bg.getBufferAsync(Jimp.MIME_PNG),
        message: "🎫 Ini kartu Bingo Anda:",
      };
    } catch (error) {
      console.error(`Error generating Bingo card buffer for ${player}:`, error);
      throw new Error(`Gagal menghasilkan buffer kartu Bingo untuk ${player}`);
    }
  };
  checkBingo = (card) => {
    for (let i = 0; i < 25; i += 5) {
      if (
        card[i] === 0 &&
        card[i + 1] === 0 &&
        card[i + 2] === 0 &&
        card[i + 3] === 0 &&
        card[i + 4] === 0
      ) {
        return true;
      }
    }
    for (let i = 0; i < 5; i++) {
      if (
        card[i] === 0 &&
        card[i + 5] === 0 &&
        card[i + 10] === 0 &&
        card[i + 15] === 0 &&
        card[i + 20] === 0
      ) {
        return true;
      }
    }
    if (
      card[0] === 0 &&
      card[6] === 0 &&
      card[12] === 0 &&
      card[18] === 0 &&
      card[24] === 0
    ) {
      return true;
    }
    if (
      card[4] === 0 &&
      card[8] === 0 &&
      card[12] === 0 &&
      card[16] === 0 &&
      card[20] === 0
    ) {
      return true;
    }
    return false;
  };
}

module.exports = {
  help: ["bingo"], //nama fitur kamu
  usage: "*minigames*", //deskripsi singkat
  command: ["bingo"], //untuk eksekusi fitur nya
  category: ["game"], //fitur kamu termasuk kategori apa?
  run: async (
    m,
    {
      kgy,
      usedPrefix,
      command,
      text,
      isOwner,
      isPrems,
      isMods,
      isAdmin,
      isBotAdmin,
      chatUpdate,
      args,
    },
  ) => {
    kgy.bingo = kgy.bingo || {};
    const sessions = kgy.bingo;
    const sessionId = m.chat;
    const session =
      sessions[sessionId] ?? (sessions[sessionId] = new GameSession(sessionId));
    const game = session.game;
    switch (args[0]) {
      case "join":
        if (!m.isGroup) return;
        const playerName = m.sender;
        if (game.players.length < 2 && !game.players.includes(playerName)) {
          game.players.push(playerName);
          m.reply(
            `🎉 Selamat datang *@${playerName.split("@")[0]}*! Kamu telah bergabung dalam permainan Bingo.`,
          );
        } else {
          m.reply(
            "❌ Maksimum pemain telah tercapai atau kamu sudah bergabung.",
          );
        }
        break;
      case "start":
        if (!m.isGroup) return;
        const playerRequestingStart = m.sender;
        if (
          game.players.length >= 2 &&
          game.players.includes(playerRequestingStart)
        ) {
          try {
            await game.initializeGame();
            await kgy.reply(
              m.chat,
              "🟢 *Permainan Bingo dimulai!*\nCek kartu Bingo-mu di obrolan pribadi",
              m,
            );
            for (const player of game.players) {
              const { buffer, message } = await game.getCardBuffer(player);
              await kgy.sendFile(
                player,
                buffer,
                "",
                `${message}\nPilih nomor dan kirimkan dengan perintah "bingo check <nomor>" atau "bingo send <nomor>"`,
                m,
              );
            }
          } catch (error) {
            console.error("Error starting Bingo game:", error);
            m.reply("❌ Gagal memulai permainan Bingo.");
          }
        } else {
          m.reply(
            "❌ Kamu tidak memenuhi syarat untuk memulai permainan. Pastikan ada setidaknya 2 pemain dan kamu telah bergabung.",
          );
        }
        break;
      case "reset":
        if (!m.isGroup) return;
        session.game.endGame();
        wa;
        m.reply("🔄 *Sesi permainan Bingo telah di-reset.*");
        break;
      case "check":
        if (!game.started) {
          m.reply("❌ Permainan Bingo belum dimulai.");
        } else {
          const numberToCheck = parseInt(args[1]);
          if (isNaN(numberToCheck)) {
            m.reply(
              '❌ Perintah tidak valid. Gunakan "bingo check <nomor>" untuk menandai nomor.',
            );
          } else {
            const result = game.checkNumber(numberToCheck, m.sender);
            m.reply(result);
          }
        }
        break;
      case "send":
        if (!game.started) {
          m.reply("❌ Permainan Bingo belum dimulai.");
        } else {
          const numberToSend = parseInt(args[1]);
          if (isNaN(numberToSend)) {
            m.reply(
              '❌ Perintah tidak valid. Gunakan "bingo send <nomor>" untuk mengirim nomor.',
            );
          } else {
            const result = await game.sendNumber(numberToSend, m.sender);
            m.reply(result);
          }
        }
        break;
      default:
        m.reply(`,┌─⭓「 *BINGO GAME* 」
│ *• Join game :* ${usedPrefix + command} join
│ *• start game :* ${usedPrefix + command} start
└───────────────⭓

Bingo adalah permainan keberuntungan yang melibatkan kartu dengan grid berisi angka. Pemain akan mencocokkan angka yang dipanggil dengan angka yang ada di kartu mereka. Tujuannya adalah untuk mencetak pola tertentu, biasanya dengan menandai angka yang sesuai.`);
    }
  },
  wait: false, //menampilkan pesan menunggu
  owner: false, //Fitur ini Khusus owner
  group: true, //Fitur ini khusus didalam group
  private: false, //Fitur ini khusus di private chat
  botadmin: false, //Fitur ini khusus ketikan bot menjadi admin
  premium: false, //Fitur ini khusus pengguna premium
  admin: false, //Fitur ini khusus admin group
  error: 0, //Menghitung total Error ( Jangan di ubah )
  update: Date.now(), //kapan terakhir fitur ini di perbarui? ( Jangan di ubah )
  description:
    "Bingo adalah permainan keberuntungan yang melibatkan kartu dengan grid berisi angka. Pemain akan mencocokkan angka yang dipanggil dengan angka yang ada di kartu mereka. Tujuannya adalah untuk mencetak pola tertentu, biasanya dengan menandai angka yang sesuai.", //kosongkan jika tidak ingin di isi
};
