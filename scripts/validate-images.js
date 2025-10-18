#!/usr/bin/env node

/**
 * Image Validation Script
 * Validates that all images in images.json are accessible
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const IMAGES_JSON_PATH = resolve(__dirname, '../src/data/images.json')
const TIMEOUT_MS = 5000

async function validateImageUrl(url, timeout = TIMEOUT_MS) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return { valid: false, error: `HTTP ${response.status}: ${response.statusText}` }
    }

    return { valid: true }
  } catch (error) {
    if (error.name === 'AbortError') {
      return { valid: false, error: 'Request timeout (>5s)' }
    }
    return { valid: false, error: error.message }
  }
}

async function validateAllImages() {
  console.log('🔍 Validating images from images.json...\n')

  // Read images.json
  let imagesData
  try {
    const fileContent = readFileSync(IMAGES_JSON_PATH, 'utf-8')
    imagesData = JSON.parse(fileContent)
  } catch (error) {
    console.error('❌ Failed to read or parse images.json:', error.message)
    process.exit(1)
  }

  if (!imagesData.images || !Array.isArray(imagesData.images)) {
    console.error('❌ Invalid images.json structure: "images" array not found')
    process.exit(1)
  }

  const images = imagesData.images
  console.log(`Found ${images.length} images to validate\n`)

  // Validate each image
  const results = []
  let validCount = 0
  let invalidCount = 0

  for (const image of images) {
    process.stdout.write(`Checking ${image.id}... `)

    if (!image.url) {
      console.log('❌ Missing URL')
      invalidCount++
      results.push({ id: image.id, valid: false, error: 'Missing URL' })
      continue
    }

    const result = await validateImageUrl(image.url)

    if (result.valid) {
      console.log('✅')
      validCount++
      results.push({ id: image.id, valid: true })
    } else {
      console.log(`❌ ${result.error}`)
      invalidCount++
      results.push({ id: image.id, valid: false, error: result.error, url: image.url })
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 Validation Summary')
  console.log('='.repeat(60))
  console.log(`✅ Valid:   ${validCount}/${images.length}`)
  console.log(`❌ Invalid: ${invalidCount}/${images.length}`)

  if (invalidCount > 0) {
    console.log('\n❌ Failed Images:')
    results
      .filter(r => !r.valid)
      .forEach(r => {
        console.log(`  - ${r.id}: ${r.error}`)
        if (r.url) console.log(`    URL: ${r.url}`)
      })

    console.log('\n⚠️  Warning: App may not work correctly with invalid images!')
    console.log('   Fix the URLs in src/data/images.json before running the app.\n')

    // Exit with error code if too few valid images
    if (validCount < 2) {
      console.error('❌ CRITICAL: Less than 2 valid images! App will not start.')
      process.exit(1)
    }

    // Exit with warning code if some images are invalid
    process.exit(1)
  }

  console.log('\n✅ All images validated successfully!')
  console.log('   You can now run: npm run dev\n')
  process.exit(0)
}

// Run validation
validateAllImages().catch(error => {
  console.error('\n❌ Validation script error:', error)
  process.exit(1)
})
