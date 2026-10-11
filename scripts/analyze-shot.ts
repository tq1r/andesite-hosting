// Analyze a screenshot with the vision model for visual QA
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function main() {
  const file = process.argv[2]
  const prompt = process.argv[3] || 'Describe this web page screenshot. Is it rendering correctly (no blank areas, no overlapping text, no broken layout)? Answer briefly.'
  const b64 = fs.readFileSync(file).toString('base64')

  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
    // @ts-expect-error VLM model param
    model: 'glm-4.5v',
  })
  console.log(completion.choices[0]?.message?.content)
}

main().catch((e) => {
  console.error('VLM analysis failed:', e.message)
  process.exit(1)
})
