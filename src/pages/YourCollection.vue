<template>
  <div class="text-center q-pa-md flex flex-center">
      <q-list>
        <div v-for="card in cards" :key="card">
            <q-card flat color="white" class="q-pa-sm">
                <img :src="card.image">
                <label>{{ card.name }}</label>
                <q-card-actions align="right">
                    <q-btn flat round color="red" icon="favorite" />
                    <q-btn flat round color="teal" icon="bookmark" />
                    <q-btn flat round color="primary" icon="share" />
                </q-card-actions>
            </q-card>
        </div>
      </q-list>

  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { getCardsBySearch, getURLImage } from '../utils/dbRequest'

export default defineComponent({
  name: 'YourCollection',
  setup () {
    const allCards = ref([])
    const cards = ref([])
    const nbCardsToDisplay = ref(25)

    return {
      allCards,
      cards,
      nbCardsToDisplay
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
      })
    })
  }
})
</script>
