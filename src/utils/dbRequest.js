const { collection, getDocs, query, where, runTransaction, getDoc, addDoc } = require('firebase/firestore')
const { ref, getDownloadURL } = require('firebase/storage')

const { db, storage } = require('../conf/firebase/conf')

async function getURLImage (cardPicture) {
  return await getDownloadURL(ref(storage, cardPicture))
}

async function getSetName () {
  const setNames = []
  const qSet = query(collection(db, 'setGSC'))
  const sets = await getDocs(qSet)
  sets.forEach(set => {
    const setData = set.data()
    setNames.push([setData.name, setData.name])
  })
  return setNames
}

async function getDistinctRarity () {
  let rarities = []
  const qSet = query(collection(db, 'setGSC'))
  const sets = await getDocs(qSet)
  sets.forEach(set => {
    const setData = set.data()
    const raritySet = setData.collectionCard.map(card => {
      return card.rarity
    })
    rarities = rarities.concat(raritySet)
  })
  console.log(rarities.length)
  rarities = [...new Set(rarities)]
  // console.log(charNames)
  const distinctRarities = rarities.map(rarity => {
    return [rarity, rarity]
  })
  console.log(distinctRarities)
  return distinctRarities
}

async function getAllCard () {
  let cards = []
  const qSet = query(collection(db, 'setGSC'))
  const sets = await getDocs(qSet)
  sets.forEach(set => {
    const setData = set.data()
    cards = cards.concat(setData.collectionCard)
  })
  return cards
}

async function getUserCards (userId) {
  const user = await addOrCreateUser(userId)
  return user.data().collectionCard
}

async function getCardsBySearch (set, index, perso, rarity, anime, userId = null) {
  set = set == null ? '' : set
  index = index == null ? '' : index
  perso = perso == null ? '' : perso.toUpperCase()
  rarity = rarity == null ? '' : rarity
  anime = anime == null ? '' : anime

  // add 00 or 0 to index if index is a number
  if (index.length === 1) {
    index = '00' + index
  } else if (index.length === 2) {
    index = '0' + index
  }

  const cards = userId ? await getUserCards(userId) : await getAllCard()
  console.log(rarity)
  return cards.filter(card => (set === '' ? card.set.includes(set) : card.set === set) &&
        (card.index.includes(index)) &&
        (card.name.toUpperCase().includes(perso)) &&
        (rarity === '' ? card.rarity.includes(rarity) : card.rarity === rarity) &&
        (card.serie.toUpperCase().includes(anime.toUpperCase())))
}

async function getAnimeName () {
  let anime = []
  const qSet = query(collection(db, 'setGSC'))
  const sets = await getDocs(qSet)
  sets.forEach(set => {
    const collection = set.data().collectionCard
    collection.forEach(card => {
      anime.push(card.serie)
    })
  })
  anime = [...new Set(anime)]
  return anime
}

async function getCharName () {
  let char = []
  const qSet = query(collection(db, 'setGSC'))
  const sets = await getDocs(qSet)
  sets.forEach(set => {
    const collection = set.data().collectionCard
    collection.forEach(card => {
      char.push(card.name)
    })
  })
  char = [...new Set(char)]
  return char
}

async function addOrCreateUser (userId) {
  const userQuery = query(collection(db, 'discordUser'), where('id', '==', userId))
  const users = await getDocs(userQuery)
  let user
  users.forEach(us => {
    user = us
  })
  if (user) {
    console.log('user exist')
  } else {
    console.log('user not exist')
    const refUser = await addDoc(collection(db, 'discordUser'), {
      id: userId,
      collectionCard: [],
      virtualCollectionCard: []
    })
    user = await getDoc(refUser)
  }
  return user
}

async function manageCollectionUser (userId, card, action) {
  const user = await addOrCreateUser(userId)
  let quantity = 0
  await runTransaction(db, async (transaction) => {
    const sfDoc = await transaction.get(user.ref)
    if (!sfDoc) {
      // eslint-disable-next-line no-throw-literal
      throw 'document does not exist'
    }
    const collection = sfDoc.data().collectionCard
    const possessedCard = collection.find(c => c.index === card.index && c.set === card.set)
    if (possessedCard) {
      if (action === 'add') {
        possessedCard.quantity += 1
        quantity = possessedCard.quantity
      } else if (action === 'remove') {
        if (possessedCard.quantity > 1) {
          possessedCard.quantity -= 1
          quantity = possessedCard.quantity
        } else {
          collection.splice(collection.indexOf(possessedCard), 1)
        }
      }
    } else {
      if (action === 'add') {
        card.quantity = 1
        collection.push(card)
      }
    }

    transaction.update(sfDoc.ref, { collectionCard: collection })
  })

  return quantity
}

async function getQuantity (card, userId) {
  const user = await addOrCreateUser(userId)
  const collection = user.data().collectionCard
  const possessedCard = collection.find(c => c.index === card.index && c.set === card.set)
  if (possessedCard) {
    return possessedCard.quantity
  } else {
    return 0
  }
}

async function getNbCardOfSet (set) {
  const qSet = query(collection(db, 'setGSC'), where('name', '==', set))
  const sets = await getDocs(qSet)
  let ndCard = 0
  sets.forEach(set => {
    const setData = set.data()
    ndCard = setData.collectionCard.length
  })
  return ndCard
}

async function addTabCard (set, tabIndex, userId) {
  const qSet = query(collection(db, 'setGSC'), where('name', '==', set))
  const sets = await getDocs(qSet)
  const cardsToAdd = []
  const cardNotAdded = []
  sets.forEach(setFind => {
    const setData = setFind.data()
    const collection = setData.collectionCard
    tabIndex.forEach(index => {
      const card = collection.find(c => c.index === index)
      if (card) {
        cardsToAdd.push(card)
      } else {
        cardNotAdded.push(index)
      }
    })
  })
  const user = await addOrCreateUser(userId)
  await runTransaction(db, async (transaction) => {
    const sfDoc = await transaction.get(user.ref)
    if (!sfDoc) {
      // eslint-disable-next-line no-throw-literal
      throw 'document does not exist'
    }
    const collection = sfDoc.data().collectionCard
    cardsToAdd.forEach(card => {
      const existedCard = collection.find(c => c.index === card.index && c.set === card.set)
      if (existedCard) {
        existedCard.quantity += 1
      } else {
        card.quantity = 1
        collection.push(card)
      }
    })
    transaction.update(sfDoc.ref, { collectionCard: collection })
  })
  return cardNotAdded
}

module.exports = {
  getSetName,
  getDistinctRarity,
  getCardsBySearch,
  getAnimeName,
  getCharName,
  getURLImage,
  manageCollectionUser,
  getQuantity,
  getNbCardOfSet,
  addTabCard
}
