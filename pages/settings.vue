<template>
  <div class="min-h-screen p-4 md:p-6">
    <div v-if="showToast" class="toast toast-top toast-end z-[1000]">
      <div class="alert alert-info shadow-lg">
        <span>{{ toastMessage }}</span>
      </div>
    </div>

    <div class="max-w-3xl mx-auto">
      <h1 class="text-3xl md:text-4xl font-extrabold text-amber-950 mb-6">ตั้งค่า AI</h1>

      <!-- Alert -->
      <div v-if="showAlert" role="alert" class="alert alert-info shadow-lg mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 w-6 h-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ alertMessage }}</span>
      </div>

      <div class="card settings-card shadow-md">
        <div class="card-body space-y-6">
          <div class="text-xl font-bold text-amber-900 border-b border-amber-900/20 pb-3 mb-2">การตั้งค่า AI</div>

          <div class="grid grid-cols-1 gap-6">
            <!-- API Key -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">OpenAI API Key</span>
              </label>
              <input type="password" v-model="settings.openaiApiKey" placeholder="sk-..." class="input input-bordered w-full settings-input" />
              <label class="label">
                <span class="label-text-alt">API Key จะถูกเก็บไว้ในเครื่องของคุณเท่านั้น</span>
              </label>
            </div>

            <!-- Custom Prompt -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">Custom Prompt</span>
              </label>
              <textarea v-model="settings.customPrompt" placeholder="ระบุ prompt ที่ต้องการให้ AI ใช้ในการสร้างความหมาย" rows="6" class="textarea textarea-bordered w-full h-48 p-4 text-base resize-none settings-input"></textarea>
              <label class="label">
                <span class="label-text-alt">ใช้ <code>{word}</code> เพื่อแทนที่คำศัพท์ที่ต้องการหาความหมาย</span>
              </label>
            </div>

            <!-- Response Language -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">ภาษาที่ต้องการให้ AI ตอบ</span>
              </label>
              <select v-model="settings.responseLanguage" class="select select-bordered w-full settings-input">
                <option v-for="lang in responseLanguages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
              </select>
            </div>

            <!-- Pronunciation Language -->
            <div class="form-control w-full">
              <label class="label">
                <span class="label-text font-medium">ภาษาที่อ่านออกเสียง</span>
              </label>
              <select v-model="settings.pronunciationLanguage" class="select select-bordered w-full settings-input">
                <option v-for="lang in languages" :key="lang.code" :value="lang.code">{{ lang.name }}</option>
              </select>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap justify-end gap-3">
            <button class="btn btn-outline border-amber-900/30 text-amber-900 hover:bg-amber-100" @click="importWords"><Icon name="uiw:file-excel" />Import คำจาก Excel</button>
            <button class="btn btn-outline border-amber-900/30 text-amber-900 hover:bg-amber-100" @click="exportWords"><Icon name="uiw:file-excel" />Export คำเป็น Excel</button>
            <button class="btn brand-action-btn" @click="saveSettings"><Icon name="material-symbols:save-outline-sharp" /> บันทึกการตั้งค่า</button>
          </div>
          <div class="divider my-2">จัดการข้อมูล</div>
          <div class="flex flex-wrap justify-end gap-3">
            <button class="btn btn-outline btn-warning" @click="openConfirmModal('clearStats')">
              <Icon name="radix-icons:reset" /> ลบข้อมูลสถิติทั้งหมด
            </button>
            <button class="btn btn-error" @click="openConfirmModal('clearWords')">
              <Icon name="material-symbols:delete-outline" /> ลบข้อมูลศัพท์ทั้งหมด
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal" :class="{ 'modal-open': showConfirmModal }">
      <div class="modal-box">
        <h3 class="text-lg font-bold mb-4">{{ confirmTitle }}</h3>
        <p>{{ confirmMessage }}</p>
        <div class="modal-action">
          <button class="btn btn-error" @click="confirmAndRun">
            <Icon name="material-symbols:delete-outline" /> ยืนยัน
          </button>
          <button class="btn" @click="closeConfirmModal">
            <Icon name="bitcoin-icons:cross-filled" /> ยกเลิก
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="closeConfirmModal"></div>
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
  _rev?: string
  word: string
  pinyin?: string
  meaning: string
  tags?: string[]
  stats?: {
    correct: number
    incorrect: number
    lastSeen?: number
  }
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
const showToast = ref(false)
const toastMessage = ref('')
let toastTimer: ReturnType<typeof setTimeout> | null = null
const showConfirmModal = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const pendingAction = ref<null | 'clearWords' | 'clearStats'>(null)

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

function showInfoToast(msg: string) {
  toastMessage.value = msg
  showToast.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    showToast.value = false
  }, 3500)
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
        word: row['คำ']?.toString().trim() || '',
        pinyin: row['พินอิน']?.toString().trim() || '',
        meaning: row['ความหมาย']?.toString().trim() || '',
        tags: row['แท็ก']?.toString().split(',').map((t: string) => t.trim()).filter(Boolean) || []
      }))
      
      // Build lookup for existing words, so duplicates can be updated instead of skipped
      const existingWords = await db.allDocs({ include_docs: true })
      const existingWordMap = new Map<string, Card & { _rev?: string }>()
      for (const row of existingWords.rows) {
        const doc = row.doc as (Card & { _rev?: string }) | undefined
        if (!doc?.word) continue
        existingWordMap.set(doc.word.toLowerCase(), doc)
      }

      let createdCount = 0
      let updatedCount = 0
      let skippedCount = 0
      for (const card of cards) {
        if (!card.word || !card.meaning) {
          skippedCount++
          continue
        }

        const key = card.word.toLowerCase()
        const existing = existingWordMap.get(key)

        if (existing?._id && existing._rev) {
          const updatedDoc = {
            ...existing,
            ...card,
            _id: existing._id,
            _rev: existing._rev
          }
          const result = await db.put(updatedDoc)
          existingWordMap.set(key, { ...updatedDoc, _rev: result.rev })
          updatedCount++
          continue
        }

        const createdDoc = {
          _id: `card_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          ...card
        }
        const result = await db.put(createdDoc)
        existingWordMap.set(key, { ...createdDoc, _rev: result.rev })
        createdCount++
      }

      const summary = `นำเข้าสำเร็จ เพิ่มใหม่ ${createdCount} คำ, อัปเดตคำเดิม ${updatedCount} คำ, ข้าม ${skippedCount} แถว`
      showFeedback(summary)
      showInfoToast(summary)
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
      .map(c => ({ คำ: c.word, พินอิน: c.pinyin || '', ความหมาย: c.meaning, แท็ก: (c.tags || []).join(', ') }))

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

function openConfirmModal(action: 'clearWords' | 'clearStats') {
  pendingAction.value = action
  if (action === 'clearWords') {
    confirmTitle.value = 'ยืนยันลบคำศัพท์ทั้งหมด'
    confirmMessage.value = 'ข้อมูลคำศัพท์ทั้งหมดจะถูกลบถาวรและไม่สามารถย้อนกลับได้'
  } else {
    confirmTitle.value = 'ยืนยันลบข้อมูลสถิติทั้งหมด'
    confirmMessage.value = 'ระบบจะรีเซ็ตจำนวนถูก/ผิดของคำศัพท์ทุกคำเป็น 0'
  }
  showConfirmModal.value = true
}

function closeConfirmModal() {
  showConfirmModal.value = false
  pendingAction.value = null
}

async function confirmAndRun() {
  const action = pendingAction.value
  closeConfirmModal()
  if (action === 'clearWords') await clearAllWords()
  if (action === 'clearStats') await clearAllStats()
}

async function clearAllWords() {
  try {
    const res = await db.allDocs({ include_docs: true })
    const docs = res.rows
      .map(r => r.doc as Card | undefined)
      .filter(doc => doc?._id && doc._rev && doc.word) as Card[]

    if (!docs.length) {
      showInfoToast('ไม่มีคำศัพท์ให้ลบ')
      return
    }

    await db.bulkDocs(docs.map(doc => ({ _id: doc._id!, _rev: doc._rev!, _deleted: true })))
    const msg = `ลบคำศัพท์ทั้งหมดแล้ว ${docs.length} คำ`
    showFeedback(msg)
    showInfoToast(msg)
  } catch (err) {
    console.error(err)
    showFeedback('เกิดข้อผิดพลาดในการลบคำศัพท์ทั้งหมด')
  }
}

async function clearAllStats() {
  try {
    const res = await db.allDocs({ include_docs: true })
    const docs = res.rows
      .map(r => r.doc as Card | undefined)
      .filter(doc => doc?._id && doc.word) as Card[]

    let updated = 0
    for (const doc of docs) {
      const current = await db.get(doc._id!)
      await db.put({
        ...current,
        stats: { correct: 0, incorrect: 0, lastSeen: Date.now() }
      })
      updated++
    }
    const msg = `ลบข้อมูลสถิติแล้ว ${updated} คำ`
    showFeedback(msg)
    showInfoToast(msg)
  } catch (err) {
    console.error(err)
    showFeedback('เกิดข้อผิดพลาดในการลบข้อมูลสถิติ')
  }
}

onMounted(loadSettings)
</script>

<style scoped>
.settings-card {
  background: linear-gradient(180deg, rgba(255, 251, 240, 0.95), rgba(247, 237, 215, 0.95));
  border: 1px solid rgba(109, 76, 56, 0.22);
}

.settings-input {
  background: rgba(255, 252, 245, 0.95);
  border-color: rgba(109, 76, 56, 0.28);
}

.brand-action-btn {
  background: linear-gradient(180deg, #7b4f33, #5d3a28);
  border: 1px solid rgba(93, 58, 40, 0.8);
  color: #fff7e8;
}
</style>
