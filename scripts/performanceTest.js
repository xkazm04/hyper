#!/usr/bin/env node

/**
 * Performance Test Script for StoryGraph Decorative Elements
 *
 * This script measures FPS and memory usage of the StoryGraph canvas
 * to ensure decorative animations don't impact performance.
 *
 * Usage:
 *   node scripts/performanceTest.js [options]
 *
 * Options:
 *   --url <url>       Base URL to test (default: http://localhost:3000)
 *   --duration <ms>   Test duration in milliseconds (default: 30000)
 *   --output <file>   CSV output file path (default: performance-results.csv)
 *   --headless        Run in headless mode (default: false)
 *
 * Requirements:
 *   - npm install puppeteer
 *   - Development server running
 *
 * Example:
 *   npm run test:perf
 *   node scripts/performanceTest.js --duration 60000 --output results.csv
 */

const puppeteer = require('puppeteer')
const fs = require('fs')
const path = require('path')

// Parse command line arguments
const args = process.argv.slice(2)
const getArg = (name, defaultValue) => {
  const index = args.indexOf(`--${name}`)
  if (index !== -1 && args[index + 1]) {
    return args[index + 1]
  }
  return defaultValue
}

const hasFlag = (name) => args.includes(`--${name}`)

// Configuration
const config = {
  baseUrl: getArg('url', 'http://localhost:3000'),
  testDuration: parseInt(getArg('duration', '30000'), 10),
  outputFile: getArg('output', 'performance-results.csv'),
  headless: hasFlag('headless'),
  sampleInterval: 100, // Collect samples every 100ms
}

/**
 * Collect FPS samples using requestAnimationFrame
 */
async function collectFPSSamples(page, duration) {
  return page.evaluate((durationMs) => {
    return new Promise((resolve) => {
      const samples = []
      let frameCount = 0
      let lastTime = performance.now()
      let startTime = lastTime
      let minFps = Infinity
      let maxFps = 0

      function measureFrame(timestamp) {
        frameCount++
        const elapsed = timestamp - lastTime

        // Calculate FPS every 100ms
        if (elapsed >= 100) {
          const fps = (frameCount / elapsed) * 1000
          samples.push({
            timestamp: timestamp - startTime,
            fps: Math.round(fps * 10) / 10,
          })

          minFps = Math.min(minFps, fps)
          maxFps = Math.max(maxFps, fps)

          frameCount = 0
          lastTime = timestamp
        }

        // Continue until duration is reached
        if (timestamp - startTime < durationMs) {
          requestAnimationFrame(measureFrame)
        } else {
          // Calculate final statistics
          const avgFps = samples.reduce((sum, s) => sum + s.fps, 0) / samples.length
          resolve({
            samples,
            avgFps: Math.round(avgFps * 10) / 10,
            minFps: Math.round(minFps * 10) / 10,
            maxFps: Math.round(maxFps * 10) / 10,
          })
        }
      }

      requestAnimationFrame(measureFrame)
    })
  }, duration)
}

/**
 * Collect memory usage samples
 */
async function collectMemorySamples(page, duration) {
  const samples = []
  const startTime = Date.now()

  while (Date.now() - startTime < duration) {
    // Get memory info from performance API
    const memory = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        }
      }
      return null
    })

    if (memory) {
      samples.push({
        timestamp: Date.now() - startTime,
        usedMB: Math.round(memory.usedJSHeapSize / (1024 * 1024) * 10) / 10,
        totalMB: Math.round(memory.totalJSHeapSize / (1024 * 1024) * 10) / 10,
      })
    }

    await new Promise((r) => setTimeout(r, config.sampleInterval))
  }

  const usedMemory = samples.map((s) => s.usedMB)
  return {
    samples,
    avgMemory: Math.round((usedMemory.reduce((a, b) => a + b, 0) / usedMemory.length) * 10) / 10,
    maxMemory: Math.round(Math.max(...usedMemory) * 10) / 10,
    minMemory: Math.round(Math.min(...usedMemory) * 10) / 10,
  }
}

/**
 * Run performance test on a specific page
 */
async function runTest(page, testName, url) {
  console.log(`\n🧪 Testing: ${testName}`)
  console.log(`   URL: ${url}`)

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 })

  // Wait for the graph to render
  await page.waitForSelector('[data-testid="story-graph-container"]', { timeout: 10000 })

  // Let the page settle
  await new Promise((r) => setTimeout(r, 2000))

  console.log(`   ⏱️  Measuring for ${config.testDuration / 1000}s...`)

  // Collect FPS and memory in parallel
  const [fpsResult, memoryResult] = await Promise.all([
    collectFPSSamples(page, config.testDuration),
    collectMemorySamples(page, config.testDuration),
  ])

  return {
    testName,
    url,
    timestamp: new Date().toISOString(),
    fps: fpsResult,
    memory: memoryResult,
  }
}

/**
 * Format results as CSV
 */
function formatCSV(results) {
  const headers = [
    'Test Name',
    'Timestamp',
    'Avg FPS',
    'Min FPS',
    'Max FPS',
    'Avg Memory (MB)',
    'Max Memory (MB)',
    'Duration (s)',
  ]

  const rows = results.map((r) => [
    r.testName,
    r.timestamp,
    r.fps.avgFps,
    r.fps.minFps,
    r.fps.maxFps,
    r.memory.avgMemory,
    r.memory.maxMemory,
    config.testDuration / 1000,
  ])

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

/**
 * Print summary to console
 */
function printSummary(results) {
  console.log('\n📊 Performance Test Summary')
  console.log('═'.repeat(60))

  for (const result of results) {
    console.log(`\n${result.testName}:`)
    console.log(`   FPS: avg=${result.fps.avgFps}, min=${result.fps.minFps}, max=${result.fps.maxFps}`)
    console.log(`   Memory: avg=${result.memory.avgMemory}MB, max=${result.memory.maxMemory}MB`)

    // Check against thresholds
    const fpsPass = result.fps.avgFps >= 55
    const memoryPass = result.memory.maxMemory <= 200

    console.log(`   Status: ${fpsPass && memoryPass ? '✅ PASS' : '❌ FAIL'}`)
    if (!fpsPass) console.log(`      ⚠️  FPS below threshold (55)`)
    if (!memoryPass) console.log(`      ⚠️  Memory above threshold (200MB)`)
  }

  console.log('\n' + '═'.repeat(60))
}

/**
 * Main entry point
 */
async function main() {
  console.log('🚀 StoryGraph Performance Test')
  console.log(`   Duration: ${config.testDuration / 1000}s`)
  console.log(`   Output: ${config.outputFile}`)
  console.log(`   Headless: ${config.headless}`)

  let browser
  try {
    browser = await puppeteer.launch({
      headless: config.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--enable-precise-memory-info',
        '--disable-dev-shm-usage',
      ],
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })

    // Enable performance tracing
    await page.evaluateOnNewDocument(() => {
      // Ensure performance.memory is available
      if (!performance.memory) {
        console.warn('performance.memory not available - memory stats will be limited')
      }
    })

    const results = []

    // Test 1: Default mode (animations enabled)
    // Navigate to a story editor page - using dashboard as fallback
    try {
      const defaultResult = await runTest(
        page,
        'Default Mode (Animations Enabled)',
        `${config.baseUrl}/editor/test-story`
      )
      results.push(defaultResult)
    } catch {
      console.log('   ⚠️  Story editor not accessible, skipping default mode test')
    }

    // Test 2: Low-power mode (animations disabled)
    // Toggle low power mode via localStorage
    await page.evaluate(() => {
      localStorage.setItem('performance-low-power', 'true')
    })

    try {
      const lowPowerResult = await runTest(
        page,
        'Low-Power Mode (Animations Disabled)',
        `${config.baseUrl}/editor/test-story`
      )
      results.push(lowPowerResult)
    } catch {
      console.log('   ⚠️  Story editor not accessible, skipping low-power mode test')
    }

    // Reset localStorage
    await page.evaluate(() => {
      localStorage.removeItem('performance-low-power')
    })

    // Write CSV output
    if (results.length > 0) {
      const csv = formatCSV(results)
      fs.writeFileSync(config.outputFile, csv)
      console.log(`\n📁 Results saved to: ${config.outputFile}`)

      // Print summary
      printSummary(results)
    } else {
      console.log('\n⚠️  No tests completed. Make sure the development server is running.')
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = { runTest, collectFPSSamples, collectMemorySamples }
