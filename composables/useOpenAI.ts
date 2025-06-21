import PouchDB from 'pouchdb'

interface Settings {
  openaiApiKey: string
  customPrompt: string
  responseLanguage: string
}

export function useOpenAI() {
  const SETTINGS_ID = 'app_settings'
  const db = new PouchDB('flashcards')

  async function getSettings(): Promise<Settings> {
    try {
      const doc = await db.get(SETTINGS_ID)
      if (!doc.openaiApiKey || !doc.customPrompt || !doc.responseLanguage) {
        throw new Error('การตั้งค่าไม่ถูกต้อง')
      }
      return {
        openaiApiKey: doc.openaiApiKey,
        customPrompt: doc.customPrompt,
        responseLanguage: doc.responseLanguage
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      throw new Error('ไม่พบการตั้งค่า API Key')
    }
  }

  async function getMeaning(word: string): Promise<string> {
    try {
      const settings = await getSettings()
      
      if (!settings.openaiApiKey) {
        throw new Error('กรุณาตั้งค่า OpenAI API Key ก่อนใช้งาน')
      }

      const prompt = settings.customPrompt.replace('{word}', word)
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4.1-nano',
          messages: [
            {
              role: 'system',
              content: `You are a helpful assistant that provides word meanings and examples. Please respond in ${settings.responseLanguage === 'th' ? 'Thai' : 'English'} language.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error('เกิดข้อผิดพลาดในการเรียกใช้ API')
      }

      const data = await response.json()
      return data.choices[0].message.content.trim()
    } catch (error: any) {
      console.error('Error getting meaning:', error)
      throw new Error(error.message || 'เกิดข้อผิดพลาดในการขอความหมายจาก AI')
    }
  }

  return {
    getMeaning
  }
}