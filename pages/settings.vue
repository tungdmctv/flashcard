<template>
  <div class="min-h-screen bg-base-200 p-6">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-semibold mb-8">ตั้งค่า AI</h1>

      <!-- Alert -->
      <div v-if="showAlert" role="alert" class="alert alert-info shadow-lg mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 w-6 h-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ alertMessage }}</span>
      </div>

      <div class="card bg-base-100 shadow-md">
        <div class="card-body space-y-6">
          <div class="text-xl font-medium border-b pb-2 mb-4">การตั้งค่า AI</div>

          <div class="grid grid-cols-1 gap-6">
            <!-- API Key -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">OpenAI API Key</span>
              </label>
              <input
                type="password"
                v-model="settings.openaiApiKey"
                placeholder="sk-..."
                class="input input-bordered w-full"
              />
              <label class="label">
                <span class="label-text-alt">API Key จะถูกเก็บไว้ในเครื่องของคุณเท่านั้น</span>
              </label>
            </div>

            <!-- Custom Prompt -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">Custom Prompt</span>
              </label>
              <textarea
                v-model="settings.customPrompt"
                placeholder="ระบุ prompt ที่ต้องการให้ AI ใช้ในการสร้างความหมาย"
                rows="6"
                class="textarea textarea-bordered w-full h-48 p-4 text-base resize-none"
              ></textarea>
              <label class="label">
                <span class="label-text-alt">ใช้ <code>{word}</code> เพื่อแทนที่คำศัพท์ที่ต้องการหาความหมาย</span>
              </label>
            </div>

            <!-- Response Language -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">ภาษาที่ต้องการให้ AI ตอบ</span>
              </label>
              <select v-model="settings.responseLanguage" class="select select-bordered w-full">
                <option v-for="lang in responseLanguages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
              </select>
            </div>

            <!-- Pronunciation Language -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">ภาษาที่อ่านออกเสียง</span>
              </label>
              <select v-model="settings.pronunciationLanguage" class="select select-bordered w-full">
                <option v-for="lang in languages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
              </select>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap justify-end space-x-4 space-y-2">
            <button class="btn btn-info" @click="importWords"><Icon name="uiw:file-excel" />Import คำจาก Excel</button>
            <button class="btn btn-secondary" @click="exportWords"><Icon name="uiw:file-excel" />Export คำเป็น Excel</button>
            <button class="btn btn-primary" @click="saveSettings"><Icon name="material-symbols:save-outline-sharp" /> บันทึกการตั้งค่า</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PouchDB from 'pouchdb'
import * as XLSX from 'xlsx'
import pronunciationLanguages from '~/src/pronunciationLanguage.json'
import responseLanguageData from '~/src/responseLanguage.json'

interface Settings {
  _id?: string
  _rev?: string
  openaiApiKey: string
  customPrompt: string
  responseLanguage: string
  pronunciationLanguage: string
}

interface Card {
  _id?: string
  word: string
  meaning: string
  tags?: string[]
}

const db = new PouchDB<Settings | Card>('flashcards')
const SETTINGS_ID = 'app_settings'

const languages = ref(pronunciationLanguages.languages)
const responseLanguages = ref<Array<{code: string, name: string}>>(responseLanguageData.languages)
const settings = ref<Settings>({
  openaiApiKey: '',
  customPrompt: 'ช่วยแปลความหมายของคำว่า {word} พร้อมยกตัวอย่างประโยค',
  responseLanguage: 'th',
  pronunciationLanguage: 'th-TH'
})
const showAlert = ref(false)
const alertMessage = ref('')

async function loadSettings() {
  try {
    const doc = await db.get(SETTINGS_ID)
    settings.value = doc as Settings
  } catch (err: any) {
    if (err.name === 'not_found') await saveSettings()
    else console.error(err)
  }
}

async function saveSettings() {
  try {
    const existing = await db.get(SETTINGS_ID).catch(() => null)
    const doc = existing
      ? { ...settings.value, _id: SETTINGS_ID, _rev: existing._rev }
      : { ...settings.value, _id: SETTINGS_ID }
    await db.put(doc)
    showFeedback('บันทึกการตั้งค่าเรียบร้อย')
  } catch (err) {
    console.error(err)
    showFeedback('เกิดข้อผิดพลาดในการบันทึก')
  }
}

function showFeedback(msg: string) {
  alertMessage.value = msg
  showAlert.value = true
  setTimeout(() => (showAlert.value = false), 5000)
}

async function importWords() {
  try {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const worksheet = workbook.Sheets['Flashcards']
      const jsonData = XLSX.utils.sheet_to_json(worksheet)
      
      const cards = jsonData.map((row: any) => ({
        word: row['คำ']?.toString() || '',
        meaning: row['ความหมาย']?.toString() || '',
        tags: row['แท็ก']?.toString().split(',').map((t: string) => t.trim()).filter(Boolean) || []
      }))
      
      // Get all existing words for duplicate check
      const existingWords = await db.allDocs({ include_docs: true })
      const existingWordSet = new Set(existingWords.rows
        .filter(r => (r.doc as Card)?.word)
        .map(r => (r.doc as Card).word.toLowerCase()))
      
      let importedCount = 0
      for (const card of cards) {
        if (card.word && card.meaning && !existingWordSet.has(card.word.toLowerCase())) {
          await db.put({
            _id: 'card_' + Date.now(),
            ...card
          })
          importedCount++
        }
      }
      
      showFeedback(`นำเข้าคำศัพท์สำเร็จ ${importedCount} คำ (ข้าม ${cards.length - importedCount} คำที่ซ้ำกัน)`)
    }
    
    input.click()
  } catch (err) {
    console.error(err)
    showFeedback('เกิดข้อผิดพลาดในการนำเข้าไฟล์')
  }
}

async function exportWords() {
  try {
    const res = await db.allDocs({ include_docs: true })
    const data = res.rows
      .map(r => r.doc as Card)
      .filter(c => c.word)
      .map(c => ({ คำ: c.word, ความหมาย: c.meaning, แท็ก: (c.tags || []).join(', ') }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Flashcards')
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([wbout], { type: 'application/octet-stream' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'flashcards.xlsx'
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error(err)
    showFeedback('ไม่สามารถส่งออกไฟล์ได้')
  }
}

onMounted(loadSettings)
</script>
