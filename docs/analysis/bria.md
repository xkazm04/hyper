# Bria AI Tailored Generation Workflow

## Character-Scene Composition with Scene Reference

This guide covers the complete workflow for training a custom character model and using it with scene reference images to generate consistent character compositions.

---

## Table of Contents

1. [Workflow Overview](#workflow-overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: One-Time Model Training](#phase-1-one-time-model-training)
4. [Phase 2: Scene-Based Generation](#phase-2-scene-based-generation)
5. [Complete Code Implementation](#complete-code-implementation)
6. [API Reference](#api-reference)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BRIA TAILORED GENERATION WORKFLOW                        │
│                    (with Scene Reference Reimagine)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ══════════════════ PHASE 1: ONE-TIME SETUP (1-3 hours) ══════════════════ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     CHARACTER TRAINING IMAGES                        │   │
│  │                     (5-50 images, 1024x1024+ px)                     │   │
│  │                                                                       │   │
│  │   ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐             │   │
│  │   │ img │  │ img │  │ img │  │ img │  │ img │  │ ... │             │   │
│  │   │  1  │  │  2  │  │  3  │  │  4  │  │  5  │  │     │             │   │
│  │   └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘             │   │
│  │   Different poses, angles, expressions, outfits                      │   │
│  └────────────────────────────────┬────────────────────────────────────┘   │
│                                   │                                         │
│                                   ▼                                         │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Step 1: POST /tailored-gen/projects                               │    │
│  │  Create project with ip_type: "defined_character"                  │    │
│  └───────────────────────────────┬────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Step 2: POST /tailored-gen/datasets                               │    │
│  │  Create dataset within the project                                 │    │
│  └───────────────────────────────┬────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Step 3: POST /tailored-gen/generate_prefix                        │    │
│  │  Generate caption prefix from 1-6 sample images                    │    │
│  │  Output: "Luna, a young girl with blue hair and pointed ears,"    │    │
│  └───────────────────────────────┬────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Step 4: PUT /tailored-gen/datasets/{dataset_id}                   │    │
│  │  Update dataset with the generated caption prefix                  │    │
│  └───────────────────────────────┬────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Step 5: POST /tailored-gen/datasets/{dataset_id}/images           │    │
│  │  Upload all training images (auto-captioned)                       │    │
│  └───────────────────────────────┬────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Step 6: PUT /tailored-gen/datasets/{dataset_id}                   │    │
│  │  Set dataset status to "completed"                                 │    │
│  └───────────────────────────────┬────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Step 7: POST /tailored-gen/models                                 │    │
│  │  Create model with training_version: "max" or "light"              │    │
│  └───────────────────────────────┬────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Step 8: POST /tailored-gen/models/{model_id}/start_training       │    │
│  │  Begin training process (1-3 hours)                                │    │
│  └───────────────────────────────┬────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  Step 9: GET /tailored-gen/models/{model_id}                       │    │
│  │  Poll until status: "completed"                                    │    │
│  └───────────────────────────────┬────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│                    ┌──────────────────────────┐                             │
│                    │      TRAINED MODEL       │                             │
│                    │       (model_id)         │                             │
│                    │  ◄── Save this ID! ──►   │                             │
│                    └────────────┬─────────────┘                             │
│                                 │                                           │
│  ═══════════════════════════════╪═══════════════════════════════════════   │
│                                 │                                           │
│  ══════════════════ PHASE 2: GENERATION (per scene) ══════════════════════ │
│                                 │                                           │
│                                 ▼                                           │
│       ┌─────────────────────────────────────────────────────────┐          │
│       │                    SCENE REFERENCE                       │          │
│       │              (background/environment image)              │          │
│       │                                                          │          │
│       │   ┌───────────────────────────────────┐                 │          │
│       │   │                                   │                 │          │
│       │   │     🌲  Enchanted Forest  🌲      │                 │          │
│       │   │         🍄    🌸    🍄            │                 │          │
│       │   │                                   │                 │          │
│       │   └───────────────────────────────────┘                 │          │
│       │                                                          │          │
│       │   + Prompt: "Luna exploring the magical forest,         │          │
│       │              looking curious, soft evening light"        │          │
│       └──────────────────────────┬──────────────────────────────┘          │
│                                  │                                          │
│                                  ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │  POST /reimagine/tailored/{model_id}                               │    │
│  │                                                                     │    │
│  │  Parameters:                                                        │    │
│  │  • file: <scene_image_base64>                                      │    │
│  │  • prompt: "Luna exploring the magical forest..."                  │    │
│  │  • structure_strength: 0.6 (scene preservation level)              │    │
│  └───────────────────────────────┬────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│                    ┌──────────────────────────┐                             │
│                    │      FINAL OUTPUT        │                             │
│                    │                          │                             │
│                    │   ┌──────────────────┐   │                             │
│                    │   │   🌲      🌲     │   │                             │
│                    │   │      👧          │   │                             │
│                    │   │     Luna         │   │                             │
│                    │   │   🍄    🌸   🍄  │   │                             │
│                    │   └──────────────────┘   │                             │
│                    │                          │                             │
│                    │  Character + Scene       │                             │
│                    │  Consistent style        │                             │
│                    └──────────────────────────┘                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

### API Access

1. Register at [platform.bria.ai](https://platform.bria.ai)
2. Navigate to **Console → Account → API Keys**
3. Generate and save your API token

### Image Requirements

**Training Images (Character):**
- Minimum resolution: 1024×1024 pixels (smaller images auto-upscaled from 256×256)
- Recommended: 5-50 images for optimal results
- Maximum: 200 images per dataset
- Formats: JPG, JPEG, PNG, WEBP
- Content guidelines:
  - Subject should occupy most of the image area
  - Include diverse poses, expressions, angles, and outfits
  - Minimize unnecessary margins around subject
  - Maintain consistency in key visual elements (style, colors, features)

**Scene Reference Images:**
- Any resolution (will be processed accordingly)
- Formats: JPG, JPEG, PNG, WEBP
- Should represent the environment/background you want the character placed in

### Environment Setup

```bash
# Required environment variable
export BRIA_API_TOKEN="your_api_token_here"
```

---

## Phase 1: One-Time Model Training

### Step 1: Create Project

The project defines the type of visual IP you're training.

**Endpoint:** `POST /v1/tailored-gen/projects`

**IP Types Available:**
| IP Type | Description | Use Case |
|---------|-------------|----------|
| `defined_character` | Specific character with consistent features | Story characters, mascots |
| `multi_object_set` | Collection of related objects | Product catalogs |
| `stylized_scene` | Consistent visual style | Art style transfer |
| `object_variants` | Variations of a single object | Product variations |

```javascript
const createProject = async (apiToken) => {
  const response = await fetch('https://engine.prod.bria-api.com/v1/tailored-gen/projects', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_token': apiToken
    },
    body: JSON.stringify({
      name: "StoryCharacter_Luna",
      ip_type: "defined_character",
      medium: "illustration"  // Options: "photo", "illustration", "vector"
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create project: ${response.status}`);
  }
  
  const result = await response.json();
  console.log('Project created:', result.id);
  return result.id;
};
```

**Response:**
```json
{
  "id": "proj_abc123xyz",
  "name": "StoryCharacter_Luna",
  "ip_type": "defined_character",
  "medium": "illustration",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### Step 2: Create Dataset

The dataset holds your training images within the project.

**Endpoint:** `POST /v1/tailored-gen/datasets`

```javascript
const createDataset = async (apiToken, projectId) => {
  const response = await fetch('https://engine.prod.bria-api.com/v1/tailored-gen/datasets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_token': apiToken
    },
    body: JSON.stringify({
      project_id: projectId,
      name: "Luna_training_v1"
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create dataset: ${response.status}`);
  }
  
  const result = await response.json();
  console.log('Dataset created:', result.id);
  return result.id;
};
```

**Response:**
```json
{
  "id": "ds_def456uvw",
  "project_id": "proj_abc123xyz",
  "name": "Luna_training_v1",
  "status": "draft",
  "caption_prefix": null,
  "images": [],
  "created_at": "2024-01-15T10:31:00Z"
}
```

---

### Step 3: Generate Caption Prefix

For `defined_character`, `stylized_scene`, and `object_variants` IP types, generate a structured caption prefix that will be prepended to all image captions.

**Endpoint:** `POST /v1/tailored-gen/generate_prefix`

```javascript
const generatePrefix = async (apiToken, sampleImages) => {
  // Use 1-6 representative images from your training set
  // These should showcase the character's key features
  
  const response = await fetch('https://engine.prod.bria-api.com/v1/tailored-gen/generate_prefix', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_token': apiToken
    },
    body: JSON.stringify({
      images: sampleImages  // Array of base64-encoded images (1-6 images)
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to generate prefix: ${response.status}`);
  }
  
  const result = await response.json();
  console.log('Generated prefix:', result.prefix);
  return result.prefix;
};
```

**Response:**
```json
{
  "prefix": "Luna, a young girl with bright blue hair styled in twin tails, large emerald green eyes, pointed elf-like ears, wearing a flowing purple dress with silver star patterns,"
}
```

---

### Step 4: Update Dataset with Prefix

Apply the generated prefix to your dataset.

**Endpoint:** `PUT /v1/tailored-gen/datasets/{dataset_id}`

```javascript
const updateDatasetPrefix = async (apiToken, datasetId, prefix) => {
  const response = await fetch(
    `https://engine.prod.bria-api.com/v1/tailored-gen/datasets/${datasetId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'api_token': apiToken
      },
      body: JSON.stringify({
        caption_prefix: prefix
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to update dataset: ${response.status}`);
  }
  
  console.log('Dataset updated with caption prefix');
  return await response.json();
};
```

---

### Step 5: Upload Training Images

Upload all character images to the dataset. Each image receives an auto-generated caption that continues from the prefix.

**Endpoint:** `POST /v1/tailored-gen/datasets/{dataset_id}/images`

```javascript
const uploadImage = async (apiToken, datasetId, imageBase64, customCaption = null) => {
  const body = {
    file: imageBase64,
    increase_resolution: true  // Auto-upscale images smaller than 1024x1024
  };
  
  // Optionally override auto-generated caption
  if (customCaption) {
    body.caption = customCaption;
  }
  
  const response = await fetch(
    `https://engine.prod.bria-api.com/v1/tailored-gen/datasets/${datasetId}/images`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_token': apiToken
      },
      body: JSON.stringify(body)
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.status}`);
  }
  
  return await response.json();
};

// Batch upload function
const uploadAllImages = async (apiToken, datasetId, imagesBase64Array) => {
  console.log(`Uploading ${imagesBase64Array.length} images...`);
  
  const results = [];
  for (let i = 0; i < imagesBase64Array.length; i++) {
    console.log(`Uploading image ${i + 1}/${imagesBase64Array.length}`);
    const result = await uploadImage(apiToken, datasetId, imagesBase64Array[i]);
    results.push(result);
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('All images uploaded successfully');
  return results;
};
```

**Response (per image):**
```json
{
  "id": "img_789ghi",
  "dataset_id": "ds_def456uvw",
  "caption": "standing in a garden, smiling happily, arms raised in greeting",
  "caption_source": "automatic",
  "image_url": "https://bria-storage.../uploaded_image.png",
  "created_at": "2024-01-15T10:35:00Z"
}
```

---

### Step 6: Complete Dataset

Mark the dataset as ready for training.

**Endpoint:** `PUT /v1/tailored-gen/datasets/{dataset_id}`

```javascript
const completeDataset = async (apiToken, datasetId) => {
  const response = await fetch(
    `https://engine.prod.bria-api.com/v1/tailored-gen/datasets/${datasetId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'api_token': apiToken
      },
      body: JSON.stringify({
        status: "completed"
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to complete dataset: ${response.status}`);
  }
  
  console.log('Dataset marked as completed');
  return await response.json();
};
```

---

### Step 7: Create Model

Create a model configuration based on your completed dataset.

**Endpoint:** `POST /v1/tailored-gen/models`

**Training Versions:**
| Version | Quality | Speed | Best For |
|---------|---------|-------|----------|
| `light` (Bria 2.3) | Good | Faster training & generation | Quick iterations, portraits |
| `max` (Bria 3.2) | Superior | Slower training | Final production, complex scenes |

**Training Modes:**
| Mode | Description |
|------|-------------|
| `fully_automated` | Bria selects optimal parameters automatically |
| `expert` | Manual control over training parameters |

```javascript
const createModel = async (apiToken, datasetId, modelName) => {
  const response = await fetch('https://engine.prod.bria-api.com/v1/tailored-gen/models', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api_token': apiToken
    },
    body: JSON.stringify({
      dataset_id: datasetId,
      name: modelName,
      training_mode: "fully_automated",
      training_version: "max"  // "max" for best quality, "light" for speed
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create model: ${response.status}`);
  }
  
  const result = await response.json();
  console.log('Model created:', result.id);
  return result.id;
};
```

**Response:**
```json
{
  "id": "model_jkl012mno",
  "dataset_id": "ds_def456uvw",
  "name": "Luna_character_model",
  "training_mode": "fully_automated",
  "training_version": "max",
  "status": "created",
  "created_at": "2024-01-15T10:40:00Z"
}
```

---

### Step 8: Start Training

Initiate the training process. This typically takes 1-3 hours.

**Endpoint:** `POST /v1/tailored-gen/models/{model_id}/start_training`

```javascript
const startTraining = async (apiToken, modelId) => {
  const response = await fetch(
    `https://engine.prod.bria-api.com/v1/tailored-gen/models/${modelId}/start_training`,
    {
      method: 'POST',
      headers: {
        'api_token': apiToken
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Failed to start training: ${response.status}`);
  }
  
  console.log('Training started for model:', modelId);
  return await response.json();
};
```

---

### Step 9: Monitor Training Progress

Poll the model status until training completes.

**Endpoint:** `GET /v1/tailored-gen/models/{model_id}`

**Status Values:**
| Status | Description |
|--------|-------------|
| `created` | Model created, not yet training |
| `training` | Training in progress |
| `completed` | Training finished successfully |
| `failed` | Training failed |

```javascript
const waitForTraining = async (apiToken, modelId, pollIntervalMs = 60000) => {
  console.log('Waiting for training to complete...');
  console.log('This typically takes 1-3 hours.');
  
  while (true) {
    const response = await fetch(
      `https://engine.prod.bria-api.com/v1/tailored-gen/models/${modelId}`,
      {
        method: 'GET',
        headers: {
          'api_token': apiToken
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get model status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`Training status: ${result.status}`);
    
    if (result.status === 'completed') {
      console.log('✅ Training completed successfully!');
      return result;
    }
    
    if (result.status === 'failed') {
      throw new Error('Training failed: ' + (result.error_message || 'Unknown error'));
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }
};
```

**Response (completed):**
```json
{
  "id": "model_jkl012mno",
  "name": "Luna_character_model",
  "status": "completed",
  "training_version": "max",
  "generation_prefix": "Luna, a young girl with bright blue hair...",
  "completed_at": "2024-01-15T12:45:00Z"
}
```

---

## Phase 2: Scene-Based Generation

Once your model is trained, you can generate images of your character in any scene.

### Reimagine with Scene Reference

This is the primary method for placing your character into a scene while preserving the scene's structure.

**Endpoint:** `POST /v1/reimagine/tailored/{model_id}`

**Key Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `file` | string | Base64-encoded scene reference image |
| `image_url` | string | Alternative: URL to scene image |
| `prompt` | string | Description of character in scene |
| `structure_strength` | float | 0.0-1.0, how much to preserve scene structure |
| `num_results` | int | Number of variations (1-4) |
| `seed` | int | For reproducible results |

**Structure Strength Guide:**
| Value | Effect |
|-------|--------|
| 0.0-0.3 | Loose interpretation, character dominates |
| 0.4-0.6 | Balanced blend of character and scene |
| 0.7-0.9 | Strong scene preservation, character adapted |
| 1.0 | Maximum scene fidelity |

```javascript
const reimagineWithScene = async (apiToken, modelId, sceneImageBase64, prompt, options = {}) => {
  const {
    structureStrength = 0.6,
    numResults = 1,
    seed = null,
    sync = true
  } = options;
  
  const body = {
    file: sceneImageBase64,
    prompt: prompt,
    structure_strength: structureStrength,
    num_results: numResults,
    sync: sync
  };
  
  if (seed !== null) {
    body.seed = seed;
  }
  
  const response = await fetch(
    `https://engine.prod.bria-api.com/v1/reimagine/tailored/${modelId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_token': apiToken
      },
      body: JSON.stringify(body)
    }
  );
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Generation failed: ${error.message || response.status}`);
  }
  
  const result = await response.json();
  return result;
};
```

**Response:**
```json
{
  "result_url": "https://bria-results.../generated_image.png",
  "seed": 42,
  "prompt_used": "Luna, a young girl with bright blue hair... exploring the magical forest, looking curious"
}
```

---

### Alternative: Text-to-Image with Tailored Model

Generate images purely from text descriptions (no scene reference).

**Endpoint:** `POST /v1/text-to-image/tailored/{model_id}`

```javascript
const textToImageTailored = async (apiToken, modelId, prompt, options = {}) => {
  const {
    aspectRatio = "1:1",
    numResults = 1,
    seed = null,
    sync = true
  } = options;
  
  const body = {
    prompt: prompt,
    aspect_ratio: aspectRatio,
    num_results: numResults,
    sync: sync
  };
  
  if (seed !== null) {
    body.seed = seed;
  }
  
  const response = await fetch(
    `https://engine.prod.bria-api.com/v1/text-to-image/tailored/${modelId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_token': apiToken
      },
      body: JSON.stringify(body)
    }
  );
  
  if (!response.ok) {
    throw new Error(`Generation failed: ${response.status}`);
  }
  
  return await response.json();
};
```

---

### Using ControlNet with Tailored Model

Add pose or depth guidance to your generations.

**Available ControlNets:**
| Method | Description | Use Case |
|--------|-------------|----------|
| `controlnet_canny` | Edge detection guidance | Preserve outlines/shapes |
| `controlnet_depth` | Depth map guidance | Preserve spatial arrangement |
| `controlnet_recoloring` | Grayscale structure | Recolor while keeping geometry |
| `controlnet_color_grid` | 16×16 color palette | Guide overall color scheme |

```javascript
const generateWithControlNet = async (apiToken, modelId, prompt, controlImage, options = {}) => {
  const {
    guidanceMethod = "controlnet_depth",
    guidanceScale = 0.8,
    aspectRatio = "1:1",
    sync = true
  } = options;
  
  const response = await fetch(
    `https://engine.prod.bria-api.com/v1/text-to-image/tailored/${modelId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_token': apiToken
      },
      body: JSON.stringify({
        prompt: prompt,
        aspect_ratio: aspectRatio,
        guidance_method_1: guidanceMethod,
        guidance_method_1_image_file: controlImage,
        guidance_method_1_scale: guidanceScale,
        sync: sync
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`Generation failed: ${response.status}`);
  }
  
  return await response.json();
};
```

---

## Complete Code Implementation

### Full Training Pipeline

```javascript
/**
 * Bria AI Tailored Generation - Complete Training Pipeline
 * 
 * This script handles the entire model training process:
 * 1. Create project
 * 2. Create dataset
 * 3. Generate and apply caption prefix
 * 4. Upload training images
 * 5. Create and train model
 * 6. Wait for completion
 */

const fs = require('fs');
const path = require('path');

class BriaTailoredTrainer {
  constructor(apiToken) {
    this.apiToken = apiToken;
    this.baseUrl = 'https://engine.prod.bria-api.com/v1/tailored-gen';
  }
  
  async request(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'api_token': this.apiToken
      }
    };
    
    if (body) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`API Error ${response.status}: ${error.message || 'Unknown error'}`);
    }
    
    return response.json();
  }
  
  // Load images from directory and convert to base64
  loadImagesFromDirectory(dirPath) {
    const supportedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const images = [];
    
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (supportedExtensions.includes(ext)) {
        const filePath = path.join(dirPath, file);
        const buffer = fs.readFileSync(filePath);
        const base64 = buffer.toString('base64');
        images.push({
          filename: file,
          base64: base64
        });
      }
    }
    
    console.log(`Loaded ${images.length} images from ${dirPath}`);
    return images;
  }
  
  async createProject(name, ipType = 'defined_character', medium = 'illustration') {
    console.log(`Creating project: ${name}`);
    const result = await this.request('/projects', 'POST', {
      name,
      ip_type: ipType,
      medium
    });
    console.log(`✅ Project created: ${result.id}`);
    return result.id;
  }
  
  async createDataset(projectId, name) {
    console.log(`Creating dataset: ${name}`);
    const result = await this.request('/datasets', 'POST', {
      project_id: projectId,
      name
    });
    console.log(`✅ Dataset created: ${result.id}`);
    return result.id;
  }
  
  async generatePrefix(sampleImages) {
    console.log(`Generating caption prefix from ${sampleImages.length} sample images`);
    const result = await this.request('/generate_prefix', 'POST', {
      images: sampleImages
    });
    console.log(`✅ Generated prefix: "${result.prefix.substring(0, 50)}..."`);
    return result.prefix;
  }
  
  async updateDataset(datasetId, updates) {
    return this.request(`/datasets/${datasetId}`, 'PUT', updates);
  }
  
  async uploadImage(datasetId, imageBase64) {
    return this.request(`/datasets/${datasetId}/images`, 'POST', {
      file: imageBase64,
      increase_resolution: true
    });
  }
  
  async uploadAllImages(datasetId, images, delayMs = 500) {
    console.log(`Uploading ${images.length} images to dataset...`);
    
    for (let i = 0; i < images.length; i++) {
      console.log(`  [${i + 1}/${images.length}] Uploading ${images[i].filename}`);
      await this.uploadImage(datasetId, images[i].base64);
      
      if (i < images.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    console.log(`✅ All images uploaded`);
  }
  
  async createModel(datasetId, name, version = 'max') {
    console.log(`Creating model: ${name} (version: ${version})`);
    const result = await this.request('/models', 'POST', {
      dataset_id: datasetId,
      name,
      training_mode: 'fully_automated',
      training_version: version
    });
    console.log(`✅ Model created: ${result.id}`);
    return result.id;
  }
  
  async startTraining(modelId) {
    console.log(`Starting training for model: ${modelId}`);
    await this.request(`/models/${modelId}/start_training`, 'POST');
    console.log(`✅ Training started`);
  }
  
  async getModelStatus(modelId) {
    return this.request(`/models/${modelId}`);
  }
  
  async waitForTraining(modelId, pollIntervalMs = 60000) {
    console.log('Waiting for training to complete (this may take 1-3 hours)...');
    
    while (true) {
      const model = await this.getModelStatus(modelId);
      const timestamp = new Date().toLocaleTimeString();
      console.log(`  [${timestamp}] Status: ${model.status}`);
      
      if (model.status === 'completed') {
        console.log('✅ Training completed successfully!');
        return model;
      }
      
      if (model.status === 'failed') {
        throw new Error(`Training failed: ${model.error_message || 'Unknown error'}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
    }
  }
  
  /**
   * Run the complete training pipeline
   */
  async train(config) {
    const {
      projectName,
      datasetName,
      modelName,
      imagesDirectory,
      ipType = 'defined_character',
      medium = 'illustration',
      trainingVersion = 'max',
      sampleCount = 6
    } = config;
    
    console.log('\n' + '='.repeat(60));
    console.log('BRIA TAILORED GENERATION - TRAINING PIPELINE');
    console.log('='.repeat(60) + '\n');
    
    // Load images
    const images = this.loadImagesFromDirectory(imagesDirectory);
    if (images.length < 5) {
      throw new Error('At least 5 training images are required');
    }
    
    // Step 1: Create project
    const projectId = await this.createProject(projectName, ipType, medium);
    
    // Step 2: Create dataset
    const datasetId = await this.createDataset(projectId, datasetName);
    
    // Step 3: Generate prefix from sample images
    const sampleImages = images.slice(0, Math.min(sampleCount, 6)).map(img => img.base64);
    const prefix = await this.generatePrefix(sampleImages);
    
    // Step 4: Apply prefix to dataset
    await this.updateDataset(datasetId, { caption_prefix: prefix });
    console.log('✅ Caption prefix applied to dataset');
    
    // Step 5: Upload all images
    await this.uploadAllImages(datasetId, images);
    
    // Step 6: Complete dataset
    await this.updateDataset(datasetId, { status: 'completed' });
    console.log('✅ Dataset marked as completed');
    
    // Step 7: Create model
    const modelId = await this.createModel(datasetId, modelName, trainingVersion);
    
    // Step 8: Start training
    await this.startTraining(modelId);
    
    // Step 9: Wait for completion
    const trainedModel = await this.waitForTraining(modelId);
    
    console.log('\n' + '='.repeat(60));
    console.log('TRAINING COMPLETE');
    console.log('='.repeat(60));
    console.log(`Model ID: ${modelId}`);
    console.log(`Save this ID for generation!`);
    console.log('='.repeat(60) + '\n');
    
    return {
      projectId,
      datasetId,
      modelId,
      prefix,
      model: trainedModel
    };
  }
}

// Usage example
async function main() {
  const trainer = new BriaTailoredTrainer(process.env.BRIA_API_TOKEN);
  
  try {
    const result = await trainer.train({
      projectName: 'StoryCharacter_Luna',
      datasetName: 'Luna_training_v1',
      modelName: 'Luna_model_v1',
      imagesDirectory: './character_images',
      ipType: 'defined_character',
      medium: 'illustration',
      trainingVersion: 'max'
    });
    
    console.log('Training result:', result);
    
    // Save model ID for later use
    fs.writeFileSync('model_config.json', JSON.stringify({
      modelId: result.modelId,
      prefix: result.prefix
    }, null, 2));
    
  } catch (error) {
    console.error('Training failed:', error.message);
    process.exit(1);
  }
}

module.exports = { BriaTailoredTrainer };
```

---

### Scene Generation Class

```javascript
/**
 * Bria AI Tailored Generation - Scene Generation
 * 
 * Use a trained model to generate character images in various scenes
 */

const fs = require('fs');

class BriaSceneGenerator {
  constructor(apiToken, modelId) {
    this.apiToken = apiToken;
    this.modelId = modelId;
    this.baseUrl = 'https://engine.prod.bria-api.com/v1';
  }
  
  async request(endpoint, body) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api_token': this.apiToken
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`API Error ${response.status}: ${error.message || 'Unknown error'}`);
    }
    
    return response.json();
  }
  
  /**
   * Generate character in a scene using a reference image
   * 
   * @param {string} sceneImage - Base64-encoded scene reference image
   * @param {string} prompt - Description of character in scene
   * @param {object} options - Generation options
   * @returns {object} - Generation result with image URL
   */
  async reimagineWithScene(sceneImage, prompt, options = {}) {
    const {
      structureStrength = 0.6,
      numResults = 1,
      seed = null
    } = options;
    
    const body = {
      file: sceneImage,
      prompt: prompt,
      structure_strength: structureStrength,
      num_results: numResults,
      sync: true
    };
    
    if (seed !== null) {
      body.seed = seed;
    }
    
    console.log(`Generating image with structure_strength: ${structureStrength}`);
    const result = await this.request(`/reimagine/tailored/${this.modelId}`, body);
    
    console.log('✅ Image generated:', result.result_url);
    return result;
  }
  
  /**
   * Generate character from text description only
   * 
   * @param {string} prompt - Full scene description
   * @param {object} options - Generation options
   * @returns {object} - Generation result with image URL
   */
  async textToImage(prompt, options = {}) {
    const {
      aspectRatio = '1:1',
      numResults = 1,
      seed = null
    } = options;
    
    const body = {
      prompt: prompt,
      aspect_ratio: aspectRatio,
      num_results: numResults,
      sync: true
    };
    
    if (seed !== null) {
      body.seed = seed;
    }
    
    console.log('Generating image from text prompt...');
    const result = await this.request(`/text-to-image/tailored/${this.modelId}`, body);
    
    console.log('✅ Image generated');
    return result;
  }
  
  /**
   * Generate with ControlNet guidance
   * 
   * @param {string} prompt - Scene description
   * @param {string} controlImage - Base64 guidance image
   * @param {object} options - ControlNet options
   */
  async generateWithControlNet(prompt, controlImage, options = {}) {
    const {
      method = 'controlnet_depth',
      scale = 0.8,
      aspectRatio = '1:1',
      seed = null
    } = options;
    
    const body = {
      prompt: prompt,
      aspect_ratio: aspectRatio,
      guidance_method_1: method,
      guidance_method_1_image_file: controlImage,
      guidance_method_1_scale: scale,
      sync: true
    };
    
    if (seed !== null) {
      body.seed = seed;
    }
    
    console.log(`Generating with ${method} (scale: ${scale})...`);
    const result = await this.request(`/text-to-image/tailored/${this.modelId}`, body);
    
    console.log('✅ Image generated');
    return result;
  }
  
  /**
   * Generate multiple scene variations
   */
  async generateSceneBatch(scenes) {
    const results = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      console.log(`\n[${i + 1}/${scenes.length}] Generating: ${scene.name}`);
      
      try {
        let result;
        
        if (scene.sceneImage) {
          result = await this.reimagineWithScene(
            scene.sceneImage,
            scene.prompt,
            scene.options
          );
        } else {
          result = await this.textToImage(scene.prompt, scene.options);
        }
        
        results.push({
          name: scene.name,
          success: true,
          url: result.result_url,
          seed: result.seed
        });
        
      } catch (error) {
        console.error(`Failed: ${error.message}`);
        results.push({
          name: scene.name,
          success: false,
          error: error.message
        });
      }
      
      // Delay between generations
      if (i < scenes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
  
  /**
   * Download generated image
   */
  async downloadImage(url, outputPath) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    console.log(`Image saved to: ${outputPath}`);
  }
}

// Usage example
async function generateExamples() {
  const modelId = 'your_trained_model_id';
  const generator = new BriaSceneGenerator(process.env.BRIA_API_TOKEN, modelId);
  
  // Example 1: Reimagine with scene reference
  const sceneImageBase64 = fs.readFileSync('./forest_scene.jpg').toString('base64');
  
  const result1 = await generator.reimagineWithScene(
    sceneImageBase64,
    "Luna exploring the magical forest, looking curious, pointing at glowing mushrooms",
    { structureStrength: 0.6 }
  );
  
  await generator.downloadImage(result1.result_url, './output/luna_in_forest.png');
  
  // Example 2: Text-to-image
  const result2 = await generator.textToImage(
    "Luna sitting by a cozy fireplace, reading a book, warm lighting, whimsical illustration",
    { aspectRatio: '16:9' }
  );
  
  await generator.downloadImage(result2.result_url, './output/luna_reading.png');
  
  // Example 3: Batch generation
  const scenes = [
    {
      name: 'beach_scene',
      sceneImage: fs.readFileSync('./beach.jpg').toString('base64'),
      prompt: 'Luna building a sandcastle on the beach, sunny day',
      options: { structureStrength: 0.5 }
    },
    {
      name: 'castle_scene',
      sceneImage: fs.readFileSync('./castle.jpg').toString('base64'),
      prompt: 'Luna standing before a magical castle, evening sky',
      options: { structureStrength: 0.7 }
    },
    {
      name: 'garden_scene',
      prompt: 'Luna tending to a garden of magical flowers, butterflies around her',
      options: { aspectRatio: '1:1' }
    }
  ];
  
  const batchResults = await generator.generateSceneBatch(scenes);
  console.log('Batch results:', batchResults);
}

module.exports = { BriaSceneGenerator };
```

---

## API Reference

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://engine.prod.bria-api.com/v1` |

### Authentication

All requests require the `api_token` header:

```
api_token: your_api_token_here
```

### Training Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tailored-gen/projects` | POST | Create a new project |
| `/tailored-gen/projects` | GET | List all projects |
| `/tailored-gen/projects/{id}` | GET | Get project details |
| `/tailored-gen/projects/{id}` | PUT | Update project |
| `/tailored-gen/projects/{id}` | DELETE | Delete project |
| `/tailored-gen/datasets` | POST | Create a new dataset |
| `/tailored-gen/datasets` | GET | List all datasets |
| `/tailored-gen/datasets/{id}` | GET | Get dataset details |
| `/tailored-gen/datasets/{id}` | PUT | Update dataset |
| `/tailored-gen/datasets/{id}/images` | POST | Upload image to dataset |
| `/tailored-gen/datasets/{id}/images` | GET | List images in dataset |
| `/tailored-gen/datasets/{id}/images/bulk` | POST | Bulk upload (ZIP) |
| `/tailored-gen/generate_prefix` | POST | Generate caption prefix |
| `/tailored-gen/models` | POST | Create a new model |
| `/tailored-gen/models` | GET | List all models |
| `/tailored-gen/models/{id}` | GET | Get model details/status |
| `/tailored-gen/models/{id}/start_training` | POST | Start model training |
| `/tailored-gen/models/{id}/stop_training` | POST | Stop training |

### Generation Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/text-to-image/tailored/{model_id}` | POST | Text-to-image with tailored model |
| `/reimagine/tailored/{model_id}` | POST | Reimagine with scene reference |
| `/text-to-vector/tailored/{model_id}` | POST | Generate vector graphics |
| `/tailored-gen/restyle_portrait` | POST | Restyle portrait (light models only) |

---

## Best Practices

### Training Images

1. **Quantity**: 15-50 images for `light` version, 5-30 for `max` version
2. **Diversity**: Include various poses, expressions, angles, and outfits
3. **Consistency**: Maintain consistent key features (face, colors, style)
4. **Quality**: Use high-resolution images (1024×1024+ recommended)
5. **Framing**: Subject should fill most of the frame
6. **Background**: Clean backgrounds work best; transparent backgrounds are converted to black

### Scene Reference Images

1. **Resolution**: Higher resolution = more detail preserved
2. **Composition**: Leave space where you want the character placed
3. **Lighting**: Match the lighting description in your prompt
4. **Style**: Match the art style of your training images for best results

### Prompts

1. **Be Specific**: Describe pose, action, expression, and environment
2. **Include Character Name**: Start prompts with the character's name/prefix
3. **Match Style**: Reference the art style in your prompt
4. **Describe Lighting**: Specify lighting conditions for consistency

**Good Prompt Example:**
```
Luna exploring an enchanted forest at twilight, looking curiously at 
glowing mushrooms, her blue hair flowing in a gentle breeze, soft 
purple and gold lighting, whimsical storybook illustration style
```

### Structure Strength

| Use Case | Recommended Value |
|----------|-------------------|
| Loose interpretation (character focus) | 0.2-0.4 |
| Balanced composition | 0.5-0.6 |
| Strong scene preservation | 0.7-0.8 |
| Maximum fidelity to scene | 0.9-1.0 |

---

## Troubleshooting

### Common Issues

**Training Takes Too Long**
- Use `light` training version for faster results
- Reduce dataset size (15-30 images is optimal for most cases)

**Character Not Recognizable**
- Add more diverse training images
- Ensure training images are high quality
- Check that caption prefix accurately describes the character

**Scene Not Preserved**
- Increase `structure_strength` value
- Use simpler scene reference images
- Ensure scene image is high resolution

**Generation Fails**
- Check API token is valid
- Verify model status is "completed"
- Check prompt for moderation triggers

### Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 401 | Unauthorized | Check API token |
| 403 | Forbidden | Check account permissions |
| 404 | Not Found | Verify model/dataset ID |
| 422 | Validation Error | Check request parameters |
| 429 | Rate Limited | Wait and retry |
| 500 | Server Error | Contact support |

---

## Pricing

Bria uses a credit-based system. Approximate costs:

| Operation | Credits |
|-----------|---------|
| Model Training | 50-100 |
| Text-to-Image | 2-3 |
| Reimagine | 2-3 |
| Background Removal | 1 |

Check current pricing at [platform.bria.ai](https://platform.bria.ai/console/usage).

---

## Additional Resources

- [Bria API Documentation](https://docs.bria.ai)
- [Bria Console](https://platform.bria.ai/console)
- [Bria on Hugging Face](https://huggingface.co/briaai) (source models)
- [API Status](https://status.bria.ai)