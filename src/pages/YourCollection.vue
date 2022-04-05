<template>
  <div class="q-pa-md flex column">
    <div class="q-pa-sm">
      <q-select v-model="setValue" :options="setNames" label="Set" @change="val => { test(val) }"/>
        {{  setValue }}
      <q-input v-model="indexValue" label="Index" @change="test"/>
      {{ indexValue }}
      <q-select v-model="rarityValue" :options="rarityNames" label="Rarity" />
      <q-select filled v-model="persoValue" use-input label="Perso" :options="optionsPersoNames" @filter="filterPersoName" style="width: 250px">
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">
              No results
            </q-item-section>
          </q-item>
        </template>
      </q-select>
      <q-select filled v-model="animeValue" use-input label="Anime" :options="optionsAnimeNames" @filter="filterAnimeName" style="width: 250px">
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey">
              No results
            </q-item-section>
          </q-item>
        </template>
      </q-select>
    </div>
    <q-list>
      <div v-for="card in cards" :key="card">
          <q-card color="white" class="q-pa-sm">
              <img :src="card.image" style="width: 20%" class="center">
              <label>{{ card.name }}</label>
              <q-card-actions align="center">
                  <q-btn flat round color="red" icon="remove" @click="addQuantity(card, 'remove')"/>
                  <q-input v-model="card.quantity" readonly />
                  <q-btn flat round color="primary" icon="add" @click="addQuantity(card, 'add')"/>
              </q-card-actions>
          </q-card>
      </div>
    </q-list>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { getCardsBySearch, getURLImage, getQuantity, manageCollectionUser, getSetName, getDistinctRarity, getCharName, getAnimeName } from '../utils/dbRequest'

let persoNames = []
let animeNames = []

export default defineComponent({
  name: 'YourCollection',
  setup () {
    const allCards = ref([])
    const cards = ref([])
    const nbCardsToDisplay = ref(25)
    const setNames = ref([])
    const rarityNames = ref([])
    const optionsPersoNames = ref([])
    const optionsAnimeNames = ref([])
    const indexValue = ref('')
    const setValue = ref('')
    const rarityValue = ref('')
    const persoValue = ref('')
    const animeValue = ref('')

    function addQuantity (card, action) {
      manageCollectionUser('384772616109555712', card, action)
        .then((qty) => {
          card.quantity = qty
        })
    }

    function filterPersoName (val, update) {
      update(() => {
        optionsPersoNames.value = persoNames.filter(perso => perso.toLowerCase().includes(val.toLowerCase()))
      })
    }

    function filterAnimeName (val, update) {
      update(() => {
        optionsAnimeNames.value = animeNames.filter(anime => anime.toLowerCase().includes(val.toLowerCase()))
      })
    }

    return {
      allCards,
      cards,
      nbCardsToDisplay,
      setNames,
      rarityNames,
      optionsPersoNames,
      optionsAnimeNames,
      filterPersoName,
      filterAnimeName,
      indexValue,
      setValue,
      rarityValue,
      persoValue,
      animeValue,
      test (val) {
        if (val.length === 1) {
          indexValue.value = '00' + val
        } else if (val.length === 2) {
          indexValue.value = '0' + val
        }
        console.log(val)
      },
      addQuantity
    }
  },
  beforeMount () {
    getCardsBySearch().then(res => {
      this.allCards = res
      console.log(this.cards)
      this.cards = this.allCards.slice(0, this.nbCardsToDisplay)
      this.cards.forEach(card => {
        getURLImage(card.picture)
          .then(res => {
            card.image = res
          })
        getQuantity(card, '384772616109555712')
          .then(res => {
            card.quantity = res
          })
      })
    })
    getSetName().then(res => {
      this.setNames = res
    })
    getDistinctRarity().then(res => {
      this.rarityNames = res
    })
    getCharName().then(res => {
      persoNames = res
    })
    getAnimeName().then(res => {
      animeNames = res
    })
  }
})
</script>
